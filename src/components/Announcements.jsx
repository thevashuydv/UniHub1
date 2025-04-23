import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const isClubAdmin = localStorage.getItem('userRole') === 'club_admin';
  const adminClubId = localStorage.getItem('clubId');

  // State to track followed clubs
  const [followedClubs, setFollowedClubs] = useState([]);
  const [isFollowedClubsLoaded, setIsFollowedClubsLoaded] = useState(false);

  // Fetch user's followed clubs
  useEffect(() => {
    const fetchFollowedClubs = async () => {
      if (!isLoggedIn || !userEmail || isClubAdmin) {
        setIsFollowedClubsLoaded(true);
        return;
      }

      try {
        console.log('Fetching followed clubs for user:', userEmail);
        const userFollowsCollection = collection(db, 'user_follows');
        const q = query(userFollowsCollection, where('userEmail', '==', userEmail));
        const followsSnapshot = await getDocs(q);

        const clubIds = followsSnapshot.docs.map(doc => doc.data().clubId);
        console.log('User is following these clubs:', clubIds);

        setFollowedClubs(clubIds);
        setIsFollowedClubsLoaded(true);
      } catch (error) {
        console.error('Error fetching followed clubs:', error);
        setIsFollowedClubsLoaded(true);
      }
    };

    fetchFollowedClubs();
  }, [isLoggedIn, userEmail, isClubAdmin]);

  // Fetch announcements
  useEffect(() => {
    // Wait until we know which clubs the user is following
    if (!isFollowedClubsLoaded) return;

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError('');

        // If user is a club admin, only show their club's announcements
        if (isClubAdmin && adminClubId) {
          console.log('Club admin detected. Only showing admin\'s club announcements:', adminClubId);

          try {
            // Try with compound query first (requires index)
            const announcementsCollection = collection(db, 'announcements');
            const adminAnnouncementsQuery = query(
              announcementsCollection,
              where('clubId', '==', adminClubId),
              orderBy('createdAt', 'desc'),
              limit(visibleCount)
            );

            const announcementsSnapshot = await getDocs(adminAnnouncementsQuery);
            const announcementsList = announcementsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            console.log('Admin announcements fetched successfully:', announcementsList.length);
            setAnnouncements(announcementsList);
            setHasMore(announcementsList.length === visibleCount);
            setLoading(false);
          } catch (indexError) {
            // If the compound query fails, fall back to a simpler query
            console.warn('Compound query failed for admin, falling back to simple query:', indexError);

            const announcementsCollection = collection(db, 'announcements');
            const simpleQuery = query(
              announcementsCollection,
              where('clubId', '==', adminClubId)
            );

            const announcementsSnapshot = await getDocs(simpleQuery);
            let announcementsList = announcementsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Sort manually in JavaScript
            announcementsList.sort((a, b) => {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB - dateA; // descending order (newest first)
            });

            // Apply limit in JavaScript
            announcementsList = announcementsList.slice(0, visibleCount);

            console.log('Admin announcements fetched with fallback:', announcementsList.length);
            setAnnouncements(announcementsList);
            setHasMore(announcementsSnapshot.docs.length > visibleCount);
            setLoading(false);
          }
        } else if (followedClubs.length > 0) {
          // For regular users, show announcements from followed clubs
          console.log('Fetching announcements from followed clubs:', followedClubs);

          try {
            // We need to use multiple queries since Firestore doesn't support OR queries directly
            const announcementsCollection = collection(db, 'announcements');
            const announcementPromises = followedClubs.map(clubId => {
              const clubAnnouncementsQuery = query(
                announcementsCollection,
                where('clubId', '==', clubId)
              );
              return getDocs(clubAnnouncementsQuery);
            });

            const announcementSnapshots = await Promise.all(announcementPromises);

            // Combine results from all queries
            let allAnnouncements = [];
            announcementSnapshots.forEach(snapshot => {
              const clubAnnouncements = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              allAnnouncements = [...allAnnouncements, ...clubAnnouncements];
            });

            // Sort by date (newest first)
            allAnnouncements.sort((a, b) => {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB - dateA; // descending order (newest first)
            });

            // Apply limit
            const limitedAnnouncements = allAnnouncements.slice(0, visibleCount);

            console.log('Followed club announcements fetched:', limitedAnnouncements.length);
            setAnnouncements(limitedAnnouncements);
            setHasMore(allAnnouncements.length > visibleCount);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching announcements from followed clubs:', error);
            setError('Failed to load announcements. Please try again later.');
            setLoading(false);
          }
        } else {
          // User is not following any clubs
          console.log('User is not following any clubs');
          setAnnouncements([]);
          setLoading(false);
        }
        }
      catch (error) {
        console.error('Error fetching announcements:', error);
        setError('Failed to load announcements. Please try again later.');
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [visibleCount, isClubAdmin, adminClubId, followedClubs, isFollowedClubsLoaded]);

  // Load more announcements
  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + 10);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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
    <div className="announcements-container">
      <div className="announcements-header">
        <h1>Announcements</h1>
        <p className="announcements-subtitle">Stay updated with the latest news from clubs</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && announcements.length === 0 ? (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="no-announcements-message">
          {isLoggedIn && !isClubAdmin && followedClubs.length === 0 ? (
            <>
              <p>You haven't followed any clubs yet.</p>
              <p>Follow clubs to see their announcements here!</p>
              <motion.button
                className="browse-clubs-button"
                onClick={() => window.location.href = '/clubs'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse Clubs
              </motion.button>
            </>
          ) : (
            <>
              <p>No announcements available at the moment.</p>
              <p>Check back later for updates from clubs!</p>
            </>
          )}
        </div>
      ) : (
        <>
          <motion.div
            className="announcements-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {announcements.map(announcement => (
                <motion.div
                  key={announcement.id}
                  className="announcement-card"
                  variants={itemVariants}
                  layout
                >
                  <div className="announcement-header">
                    <h3>{announcement.title}</h3>
                    <div className="announcement-meta">
                      <span className="announcement-club">{announcement.clubName}</span>
                      <span className="announcement-date">{formatDate(announcement.createdAt)}</span>
                    </div>
                  </div>

                  <div className="announcement-content">
                    <p>{announcement.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {hasMore && (
            <div className="load-more-container">
              <motion.button
                className="load-more-button"
                onClick={handleLoadMore}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </motion.button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Announcements;
