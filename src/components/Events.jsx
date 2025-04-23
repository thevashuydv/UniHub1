import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { sendEventRegistrationEmail } from '../utils/emailService';
import './Events.css';

const Events = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [followedClubs, setFollowedClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [registrationLoading, setRegistrationLoading] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [unregistrationSuccess, setUnregistrationSuccess] = useState(null);
  const [registrationIds, setRegistrationIds] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [eventFeedback, setEventFeedback] = useState({});

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');
  const isClubAdmin = localStorage.getItem('userRole') === 'club_admin';
  const adminClubId = localStorage.getItem('clubId');
  const clubName = localStorage.getItem('clubName');

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isLoggedIn || !userEmail) return;

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserProfile({
            id: querySnapshot.docs[0].id,
            ...userData
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [isLoggedIn, userEmail]);

  // Fetch user's event registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!isLoggedIn || !userEmail) return;

      try {
        const registrationsRef = collection(db, 'event_registrations');
        const q = query(registrationsRef, where('userEmail', '==', userEmail));
        const querySnapshot = await getDocs(q);

        const registeredEventIds = [];
        const registrationIdsMap = {};

        querySnapshot.docs.forEach(doc => {
          const eventId = doc.data().eventId;
          registeredEventIds.push(eventId);
          registrationIdsMap[eventId] = doc.id;
        });

        setRegisteredEvents(registeredEventIds);
        setRegistrationIds(registrationIdsMap);

        // Fetch feedback for past events
        fetchEventFeedback();
      } catch (error) {
        console.error('Error fetching event registrations:', error);
      }
    };

    fetchRegistrations();
  }, [isLoggedIn, userEmail]);

  // Fetch events based on user role
  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!isLoggedIn || !userEmail) {
        setLoading(false);
        return;
      }

      try {
        // If user is a club admin, only show their club's events
        if (isClubAdmin && adminClubId) {
          console.log('Club admin detected. Only showing admin\'s club events:', adminClubId);
          setFollowedClubs([{ id: adminClubId, name: clubName || 'Your Club' }]);
          fetchEvents([adminClubId]);
        } else {
          // For regular users, show events from followed clubs
          const userFollowsCollection = collection(db, 'user_follows');
          const q = query(userFollowsCollection, where('userEmail', '==', userEmail));
          const followsSnapshot = await getDocs(q);

          const clubIds = followsSnapshot.docs.map(doc => ({
            id: doc.data().clubId,
            name: doc.data().clubName
          }));

          console.log('User is following these clubs:', clubIds.map(club => club.id));
          setFollowedClubs(clubIds);

          // After getting followed clubs, fetch their events
          if (clubIds.length > 0) {
            fetchEvents(clubIds.map(club => club.id));
          } else {
            console.log('User is not following any clubs');
            setEvents([]);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching user events:', error);
        setError('Failed to load your events. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [isLoggedIn, userEmail, isClubAdmin, adminClubId, clubName]);

  // Fetch events from followed clubs
  const fetchEvents = async (clubIds) => {
    try {
      setLoading(true);
      console.log('Fetching events for clubs:', clubIds);

      // If no clubs are followed, don't fetch any events
      if (clubIds.length === 0) {
        console.log('No clubs to fetch events from');
        setEvents([]);
        setLoading(false);
        return;
      }

      const eventsCollection = collection(db, 'events');

      // We need to use multiple queries since Firestore doesn't support OR queries directly
      const eventPromises = clubIds.map(clubId => {
        const clubEventsQuery = query(eventsCollection, where('clubId', '==', clubId));
        return getDocs(clubEventsQuery);
      });

      const eventSnapshots = await Promise.all(eventPromises);

      // Combine results from all queries
      let allEvents = [];
      eventSnapshots.forEach(snapshot => {
        const clubEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        allEvents = [...allEvents, ...clubEvents];
      });

      // Sort events by date
      allEvents.sort((a, b) => {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        return dateA - dateB; // ascending order
      });

      console.log('Events fetched successfully:', allEvents.length);
      setEvents(allEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
      setLoading(false);
    }
  };

  // Check if user is registered for an event
  const isRegistered = (eventId) => {
    return registeredEvents.includes(eventId);
  };

  // Handle event registration
  const handleRegister = async (event) => {
    if (!isLoggedIn) {
      alert('Please sign in to register for events');
      return;
    }

    if (isRegistered(event.id)) {
      alert('You are already registered for this event');
      return;
    }

    try {
      // Set loading state for this specific event
      setRegistrationLoading(prev => ({
        ...prev,
        [event.id]: true
      }));

      // Create registration document
      const registrationData = {
        eventId: event.id,
        eventName: event.name,
        clubId: event.clubId,
        clubName: event.clubName,
        userEmail: userEmail,
        userName: userName,
        userProfile: userProfile || { name: userName, email: userEmail },
        registeredAt: new Date().toISOString()
      };

      // Add registration to Firestore
      const docRef = await addDoc(collection(db, 'event_registrations'), registrationData);

      // Update local state
      setRegisteredEvents([...registeredEvents, event.id]);
      setRegistrationIds(prev => ({
        ...prev,
        [event.id]: docRef.id
      }));

      // Send confirmation email
      try {
        const emailParams = {
          userEmail,
          userName,
          eventName: event.name,
          eventDate: new Date(event.eventDate).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          eventLocation: event.location,
          clubName: event.clubName
        };

        await sendEventRegistrationEmail(emailParams);
        console.log('Event registration confirmation email sent successfully');
      } catch (emailError) {
        console.error('Failed to send registration confirmation email:', emailError);
        // Continue with registration process even if email fails
      }

      // Show success message
      setRegistrationSuccess({
        eventId: event.id,
        eventName: event.name
      });

      // Clear any unregistration message
      setUnregistrationSuccess(null);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setRegistrationSuccess(null);
      }, 5000);

      // Clear loading state for this event
      setRegistrationLoading(prev => {
        const updated = { ...prev };
        delete updated[event.id];
        return updated;
      });
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Failed to register for event. Please try again.');
      // Clear loading state for this event
      setRegistrationLoading(prev => {
        const updated = { ...prev };
        delete updated[event.id];
        return updated;
      });
    }
  };

  // Handle event unregistration
  const handleUnregister = async (event) => {
    if (!isLoggedIn) {
      alert('Please sign in to manage your registrations');
      return;
    }

    if (!isRegistered(event.id)) {
      alert('You are not registered for this event');
      return;
    }

    try {
      // Set loading state for this specific event
      setRegistrationLoading(prev => ({
        ...prev,
        [event.id]: true
      }));

      // Get the registration document ID
      const registrationId = registrationIds[event.id];

      if (!registrationId) {
        throw new Error('Registration not found');
      }

      // Delete the registration document from Firestore
      await deleteDoc(doc(db, 'event_registrations', registrationId));

      // Update local state
      const updatedRegisteredEvents = registeredEvents.filter(id => id !== event.id);
      setRegisteredEvents(updatedRegisteredEvents);

      // Update registration IDs
      const updatedRegistrationIds = { ...registrationIds };
      delete updatedRegistrationIds[event.id];
      setRegistrationIds(updatedRegistrationIds);

      // Show success message
      setUnregistrationSuccess({
        eventId: event.id,
        eventName: event.name
      });

      // Clear any registration message
      setRegistrationSuccess(null);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setUnregistrationSuccess(null);
      }, 5000);

      // Clear loading state for this event
      setRegistrationLoading(prev => {
        const updated = { ...prev };
        delete updated[event.id];
        return updated;
      });
    } catch (error) {
      console.error('Error unregistering from event:', error);
      alert('Failed to unregister from event. Please try again.');
      // Clear loading state for this event
      setRegistrationLoading(prev => {
        const updated = { ...prev };
        delete updated[event.id];
        return updated;
      });
    }
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

  // Fetch feedback for events
  const fetchEventFeedback = async () => {
    try {
      const feedbackRef = collection(db, 'event_feedback');
      const feedbackSnapshot = await getDocs(feedbackRef);

      const feedbackData = {};

      feedbackSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const eventId = data.eventId;

        if (!feedbackData[eventId]) {
          feedbackData[eventId] = {
            count: 0,
            totalRating: 0,
            averageRating: 0
          };
        }

        feedbackData[eventId].count += 1;
        feedbackData[eventId].totalRating += data.rating;
        feedbackData[eventId].averageRating =
          feedbackData[eventId].totalRating / feedbackData[eventId].count;
      });

      setEventFeedback(feedbackData);
    } catch (error) {
      console.error('Error fetching event feedback:', error);
    }
  };

  // Check if event is upcoming, happening today, or past
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

  // Filter events based on search term and active filter
  const filteredEvents = events.filter(event => {
    // Filter by search term
    const matchesSearch =
      event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.clubName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by event status
    const status = getEventStatus(event.eventDate);
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'today' && status === 'today') ||
      (activeFilter === 'upcoming' && status === 'upcoming') ||
      (activeFilter === 'past' && status === 'past');

    return matchesSearch && matchesFilter;
  });

  // Group events by date for better organization
  const groupEventsByDate = (events) => {
    const grouped = {};

    events.forEach(event => {
      const date = new Date(event.eventDate).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    // Convert to array and sort by date
    return Object.entries(grouped)
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="events-container">
      <div className="events-header">
        <h1 className="events-title">Upcoming <span className="text-gradient">Events</span></h1>
        <p className="events-subtitle">
          {isLoggedIn
            ? `Stay updated with events from clubs you follow (${followedClubs.length} ${followedClubs.length === 1 ? 'club' : 'clubs'})`
            : 'Sign in to see events from clubs you follow'}
        </p>

        <div className="events-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="event-search-input"
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Events
            </button>
            <button
              className={`filter-button ${activeFilter === 'today' ? 'active' : ''}`}
              onClick={() => setActiveFilter('today')}
            >
              Today
            </button>
            <button
              className={`filter-button ${activeFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`filter-button ${activeFilter === 'past' ? 'active' : ''}`}
              onClick={() => setActiveFilter('past')}
            >
              Past
            </button>
          </div>
        </div>
      </div>

      <div className="events-content">
        {loading ? (
          <div className="events-loading">
            <div className="loading-spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div className="events-error">{error}</div>
        ) : !isLoggedIn ? (
          <div className="events-not-logged-in">
            <p>Please sign in to see events from clubs you follow.</p>
            <motion.button
              className="sign-in-button"
              onClick={() => window.location.href = '/signin'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>
          </div>
        ) : followedClubs.length === 0 && !isClubAdmin ? (
          <div className="no-followed-clubs">
            <p>You haven't followed any clubs yet.</p>
            <p>Follow clubs to see their events here!</p>
            <motion.button
              className="browse-clubs-button"
              onClick={() => window.location.href = '/clubs'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Clubs
            </motion.button>
          </div>
        ) : followedClubs.length === 0 && isClubAdmin ? (
          <div className="no-events-admin">
            <p>Your club doesn't have any events yet.</p>
            <p>Create events from your admin dashboard!</p>
            <motion.button
              className="admin-dashboard-button"
              onClick={() => window.location.href = '/club-admin'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Admin Dashboard
            </motion.button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="no-events-message">
            <p>No events found matching your criteria.</p>
            {activeFilter !== 'all' && (
              <p>
                Try changing your filter or
                <button
                  className="reset-filter-button"
                  onClick={() => setActiveFilter('all')}
                >
                  view all events
                </button>
              </p>
            )}
          </div>
        ) : (
          <motion.div
            className="events-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {groupedEvents.map(group => (
              <div key={group.date} className="event-date-group">
                <h3 className="event-date-header">{new Date(group.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>

                <div className="event-cards-grid">
                  {group.events.map(event => {
                    const eventStatus = getEventStatus(event.eventDate);

                    return (
                      <motion.div
                        key={event.id}
                        className={`event-card ${eventStatus}`}
                        variants={itemVariants}
                        style={{ cursor: 'default' }}
                      >
                      <div className="event-card-header">
                        <div className="event-info">
                          <h3 className="event-name">{event.name}</h3>
                          <div className="event-meta">
                            <span className="event-club">{event.clubName}</span>
                            <span className="event-category">{event.category}</span>
                            {eventStatus === 'today' && <span className="event-today-badge">Today</span>}
                          </div>
                        </div>
                        <div className="event-time">
                          {new Date(event.eventDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="event-card-body">
                        <div className="event-details">
                          <div className="event-detail">
                            <span className="detail-icon">📍</span>
                            <span>{event.location}</span>
                          </div>
                          <div className="event-detail">
                            <span className="detail-icon">👤</span>
                            <span>Organized by {event.clubName}</span>
                          </div>
                        </div>

                        <div className="event-card-actions">
                          {/* Only show registration buttons for regular users, not for club admins */}
                          {!isClubAdmin && (eventStatus === 'upcoming' || eventStatus === 'today') && (
                            <>
                              {isRegistered(event.id) ? (
                                <motion.button
                                  className="unregister-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnregister(event);
                                  }}
                                  disabled={!!registrationLoading[event.id]}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {registrationLoading[event.id] ? 'Processing...' : 'Unregister'}
                                </motion.button>
                              ) : (
                                <motion.button
                                  className="register-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRegister(event);
                                  }}
                                  disabled={!!registrationLoading[event.id]}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {registrationLoading[event.id] ? 'Processing...' : 'Register'}
                                </motion.button>
                              )}
                            </>
                          )}

                          <motion.button
                            className={`view-details-button ${isClubAdmin ? 'admin-view-details' : ''}`}
                            onClick={() => {
                              console.log('Navigating to event detail with ID:', event.id);
                              navigate(`/events/${event.id}`);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Details
                          </motion.button>
                        </div>

                        <AnimatePresence>
                          {registrationSuccess && registrationSuccess.eventId === event.id && (
                            <motion.div
                              className="registration-confirmation success"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              key="registration-success"
                            >
                              <span className="confirmation-icon">✓</span>
                              <span>Successfully registered for {registrationSuccess.eventName}!</span>
                            </motion.div>
                          )}

                          {unregistrationSuccess && unregistrationSuccess.eventId === event.id && (
                            <motion.div
                              className="registration-confirmation unregistered"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              key="unregistration-success"
                            >
                              <span className="confirmation-icon">✓</span>
                              <span>Successfully unregistered from {unregistrationSuccess.eventName}!</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Events;
