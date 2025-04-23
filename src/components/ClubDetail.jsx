import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import './ClubDetail.css';

const ClubDetail = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');
  const userClubId = localStorage.getItem('clubId');
  const isClubAdmin = userRole === 'club_admin';
  const isAdminOfThisClub = isClubAdmin && userClubId === clubId;

  // Redirect club admins if they try to view other clubs
  useEffect(() => {
    if (isClubAdmin && userClubId !== clubId) {
      console.log('Club admin attempting to view another club. Redirecting...');
      navigate('/clubs');
    }
  }, [isClubAdmin, userClubId, clubId, navigate]);

  // Fetch club details
  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        setLoading(true);
        const clubRef = doc(db, 'clubs', clubId);
        const clubSnap = await getDoc(clubRef);

        if (clubSnap.exists()) {
          setClub({
            id: clubSnap.id,
            ...clubSnap.data()
          });
        } else {
          setError('Club not found');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching club details:', error);
        setError('Failed to load club details. Please try again later.');
        setLoading(false);
      }
    };

    fetchClubDetails();
  }, [clubId]);

  // Fetch events for this club
  useEffect(() => {
    const fetchClubEvents = async () => {
      if (!clubId) return;

      try {
        setEventsLoading(true);
        setEventsError('');

        // Query events collection for events with this clubId
        const eventsCollection = collection(db, 'events');
        const eventsQuery = query(
          eventsCollection,
          where('clubId', '==', clubId)
        );

        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort events based on current sort order
        sortEvents(eventsList, sortOrder);

        setEvents(eventsList);
        setEventsLoading(false);
      } catch (error) {
        console.error('Error fetching club events:', error);
        setEventsError('Failed to load events. Please try again later.');
        setEventsLoading(false);
      }
    };

    fetchClubEvents();
  }, [clubId, sortOrder]);

  // Check if user is following this club
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isLoggedIn || !userEmail) return;

      try {
        const userFollowsCollection = collection(db, 'user_follows');
        const q = query(userFollowsCollection,
          where('userEmail', '==', userEmail),
          where('clubId', '==', clubId)
        );
        const followsSnapshot = await getDocs(q);

        setIsFollowing(!followsSnapshot.empty);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [clubId, isLoggedIn, userEmail]);

  // Handle follow/unfollow club
  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      alert('Please sign in to follow clubs');
      return;
    }

    try {
      const userFollowsCollection = collection(db, 'user_follows');
      const q = query(userFollowsCollection,
        where('userEmail', '==', userEmail),
        where('clubId', '==', clubId)
      );
      const followsSnapshot = await getDocs(q);

      const clubRef = doc(db, 'clubs', clubId);

      if (followsSnapshot.empty) {
        // User is not following this club, so follow it
        await setDoc(doc(collection(db, 'user_follows')), {
          userEmail,
          clubId,
          clubName: club.name,
          followedAt: new Date().toISOString()
        });

        // Increment followers count in club document
        await updateDoc(clubRef, {
          followersCount: increment(1)
        });

        setIsFollowing(true);

        // Update local club state
        setClub({
          ...club,
          followersCount: (club.followersCount || 0) + 1
        });
      } else {
        // User is already following this club, so unfollow it
        const followDoc = followsSnapshot.docs[0];
        await deleteDoc(doc(db, 'user_follows', followDoc.id));

        // Decrement followers count in club document
        await updateDoc(clubRef, {
          followersCount: Math.max(0, (club.followersCount || 0) - 1)
        });

        setIsFollowing(false);

        // Update local club state
        setClub({
          ...club,
          followersCount: Math.max(0, (club.followersCount || 0) - 1)
        });
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      alert('Failed to update follow status. Please try again.');
    }
  };

  const handleGoBack = () => {
    navigate('/clubs');
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Sort events by date
  const sortEvents = (eventsList, order) => {
    return eventsList.sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      return order === 'oldest' ? dateA - dateB : dateB - dateA;
    });
  };

  // Handle sort order change
  const handleSortChange = (order) => {
    setSortOrder(order);
    const sortedEvents = [...events];
    sortEvents(sortedEvents, order);
    setEvents(sortedEvents);
  };

  // Check if event is upcoming or past
  const getEventStatus = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();

    // Set time to beginning of day for comparison
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (eventDay.getTime() === today.getTime()) {
      return 'today';
    } else if (eventDate > now) {
      return 'upcoming';
    } else {
      return 'past';
    }
  };

  if (loading) {
    return (
      <div className="club-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading club details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="club-detail-error">
        <p>{error}</p>
        <button onClick={handleGoBack} className="back-button">
          Back to Clubs
        </button>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="club-detail-error">
        <p>Club not found</p>
        <button onClick={handleGoBack} className="back-button">
          Back to Clubs
        </button>
      </div>
    );
  }

  return (
    <div className="club-detail-container">
      <div className="club-detail-header">
        <button onClick={handleGoBack} className="back-button">
          ← Back to Clubs
        </button>

        {isAdminOfThisClub && (
          <div className="admin-badge">
            You are the admin of this club
          </div>
        )}
      </div>

      <div className="club-detail-content">
        <div className="club-banner">
          {club.bannerUrl ? (
            <img src={club.bannerUrl} alt={club.name} className="club-banner-image" />
          ) : (
            <div className="club-banner-placeholder">
              <div className="banner-text">{club.name}</div>
            </div>
          )}
        </div>

        <div className="club-info-container">
          <div className="club-info-header">
            <div className="club-logo-container">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="club-detail-logo" />
              ) : (
                <div className="club-detail-logo-placeholder">
                  {club.name?.charAt(0) || '?'}
                </div>
              )}
            </div>

            <div className="club-info-main">
              <h1 className="club-detail-name">{club.name}</h1>
              <div className="club-detail-category">{club.category}</div>

              <div className="club-detail-stats">
                <div className="club-detail-stat">
                  <span className="stat-icon">👥</span>
                  <span className="stat-value">{club.followersCount || 0} followers</span>
                </div>
                {club.yearEstablished && (
                  <div className="club-detail-stat">
                    <span className="stat-icon">📅</span>
                    <span className="stat-value">Est. {club.yearEstablished}</span>
                  </div>
                )}
              </div>
            </div>

            {!isAdminOfThisClub && (
              <motion.button
                className={`follow-detail-button ${isFollowing ? 'following' : ''}`}
                onClick={handleFollowToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFollowing ? 'Following ✓' : 'Follow'}
              </motion.button>
            )}
          </div>

          <div className="club-description-section">
            <h2 className="section-title">About</h2>
            <p className="club-detail-description">{club.description}</p>
          </div>

          <div className="club-admin-section">
            <h2 className="section-title">Contact</h2>
            <p className="admin-info">
              <span className="admin-label">Admin:</span> {club.adminName}
            </p>
            <p className="admin-info">
              <span className="admin-label">Email:</span> {club.adminEmail}
            </p>
          </div>

          {/* Club Events Section */}
          <div className="club-events-section">
            <div className="events-section-header">
              <h2 className="section-title">Events</h2>
              <div className="events-sort-controls">
                <span className="sort-label">Sort by:</span>
                <div className="sort-buttons">
                  <button
                    className={`sort-button ${sortOrder === 'newest' ? 'active' : ''}`}
                    onClick={() => handleSortChange('newest')}
                  >
                    Newest to Oldest
                  </button>
                  <button
                    className={`sort-button ${sortOrder === 'oldest' ? 'active' : ''}`}
                    onClick={() => handleSortChange('oldest')}
                  >
                    Oldest to Newest
                  </button>
                </div>
              </div>
            </div>

            {eventsLoading ? (
              <div className="events-loading">
                <div className="loading-spinner"></div>
                <p>Loading events...</p>
              </div>
            ) : eventsError ? (
              <div className="events-error">{eventsError}</div>
            ) : events.length === 0 ? (
              <div className="no-events-message">
                <p>This club hasn't organized any events yet.</p>
              </div>
            ) : (
              <motion.div
                className="club-events-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {events.map(event => {
                  const eventStatus = getEventStatus(event.eventDate);

                  return (
                    <motion.div
                      key={event.id}
                      className={`event-card ${eventStatus}`}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 100 }}
                    >
                      <div className="event-card-header">
                        <div className="event-info">
                          <h3 className="event-name">{event.name}</h3>
                          <div className="event-meta">
                            <span className="event-category">{event.category}</span>
                            {eventStatus === 'today' && <span className="event-today-badge">Today</span>}
                          </div>
                        </div>
                        <div className="event-time">
                          {new Date(event.eventDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="event-card-body">
                        <p className="event-description">{event.description}</p>

                        <div className="event-details">
                          <div className="event-detail">
                            <span className="detail-icon">📅</span>
                            <span>{formatDate(event.eventDate)}</span>
                          </div>

                          <div className="event-detail">
                            <span className="detail-icon">📍</span>
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;
