import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc, query, where, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './ClubList.css';

const ClubList = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followedClubs, setFollowedClubs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const isClubAdmin = localStorage.getItem('userRole') === 'club_admin';
  const adminClubId = localStorage.getItem('clubId');

  const categories = ['All', 'Tech', 'Cultural', 'Arts', 'Sports', 'Academic', 'Social', 'Other'];

  // Fetch clubs - all clubs for regular users, only admin's club for club admins
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);

        // If user is a club admin, only show their own club
        if (isClubAdmin && adminClubId) {
          console.log('Club admin detected. Only showing admin\'s club:', adminClubId);
          const clubDoc = await getDoc(doc(db, 'clubs', adminClubId));

          if (clubDoc.exists()) {
            const clubData = {
              id: clubDoc.id,
              ...clubDoc.data()
            };
            setClubs([clubData]);
          } else {
            console.error('Admin club not found:', adminClubId);
            setError('Your club information could not be loaded.');
          }
        } else {
          // For regular users, show all clubs
          const clubsCollection = collection(db, 'clubs');
          const clubSnapshot = await getDocs(clubsCollection);
          const clubsList = clubSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Sort clubs by creation date (newest first)
          clubsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          setClubs(clubsList);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        setError('Failed to load clubs. Please try again later.');
        setLoading(false);
      }
    };

    fetchClubs();
  }, [isClubAdmin, adminClubId]);

  // Fetch user's followed clubs
  useEffect(() => {
    const fetchFollowedClubs = async () => {
      if (!isLoggedIn || !userEmail) return;

      try {
        const userFollowsCollection = collection(db, 'user_follows');
        const q = query(userFollowsCollection, where('userEmail', '==', userEmail));
        const followsSnapshot = await getDocs(q);

        const followedClubIds = followsSnapshot.docs.map(doc => doc.data().clubId);
        setFollowedClubs(followedClubIds);
      } catch (error) {
        console.error('Error fetching followed clubs:', error);
      }
    };

    fetchFollowedClubs();
  }, [isLoggedIn, userEmail]);

  // Handle follow/unfollow club
  const handleFollowToggle = async (clubId, clubName) => {
    if (!isLoggedIn) {
      alert('Please sign in to follow clubs');
      return;
    }

    // Club admins cannot follow clubs
    if (isClubAdmin) {
      alert('As a club admin, you cannot follow other clubs');
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
          clubName,
          followedAt: new Date().toISOString()
        });

        // Increment followers count in club document
        await updateDoc(clubRef, {
          followersCount: increment(1)
        });

        setFollowedClubs([...followedClubs, clubId]);
      } else {
        // User is already following this club, so unfollow it
        const followDoc = followsSnapshot.docs[0];
        await deleteDoc(doc(db, 'user_follows', followDoc.id));

        // Decrement followers count in club document
        const clubDoc = await getDoc(clubRef);
        const currentCount = clubDoc.data().followersCount || 0;
        await updateDoc(clubRef, {
          followersCount: Math.max(0, currentCount - 1) // Ensure count doesn't go below 0
        });

        setFollowedClubs(followedClubs.filter(id => id !== clubId));
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      alert('Failed to update follow status. Please try again.');
    }
  };

  // Filter clubs by category and search term
  const filteredClubs = clubs.filter(club => {
    const matchesCategory = activeCategory === 'All' || club.category === activeCategory;
    const matchesSearch = club.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="clubs-loading">
        <div className="loading-spinner"></div>
        <p>Loading clubs...</p>
      </div>
    );
  }

  if (error) {
    return <div className="clubs-error">{error}</div>;
  }

  return (
    <div className="clubs-container">
      <div className="clubs-header">
        <h1 className="clubs-title">Explore <span className="text-gradient">Clubs</span></h1>
        <p className="clubs-subtitle">Discover and follow clubs that match your interests</p>

        <div className="clubs-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="club-search-input"
            />
          </div>

          <div className="categories-container">
            {categories.map(category => (
              <button
                key={category}
                className={`category-button ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredClubs.length === 0 ? (
        <div className="no-clubs-message">
          <p>No clubs found matching your criteria.</p>
        </div>
      ) : (
        <div className="clubs-grid">
          {filteredClubs.map(club => (
            <motion.div
              key={club.id}
              className="club-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
            >
              <div className="club-card-header">
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt={club.name} className="club-logo" />
                ) : (
                  <div className="club-logo-placeholder">
                    {club.name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="club-category-badge">{club.category}</div>
              </div>

              <div className="club-card-content">
                <h3 className="club-name">{club.name}</h3>
                <p className="club-description">{club.description}</p>

                <div className="club-stats">
                  <div className="club-stat">
                    <span className="stat-icon">👥</span>
                    <span className="stat-value">{club.followersCount || 0} followers</span>
                  </div>
                  {club.yearEstablished && (
                    <div className="club-stat">
                      <span className="stat-icon">📅</span>
                      <span className="stat-value">Est. {club.yearEstablished}</span>
                    </div>
                  )}
                </div>

                <div className="club-actions">
                  {!isClubAdmin && (
                    <button
                      className={`follow-button ${followedClubs.includes(club.id) ? 'following' : ''}`}
                      onClick={() => handleFollowToggle(club.id, club.name)}
                    >
                      {followedClubs.includes(club.id) ? 'Following ✓' : 'Follow'}
                    </button>
                  )}

                  {isClubAdmin && club.id === adminClubId ? (
                    <Link to="/club-admin" className="view-details-button admin-button">
                      Manage Club
                    </Link>
                  ) : (
                    <Link to={`/clubs/${club.id}`} className="view-details-button">
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubList;
