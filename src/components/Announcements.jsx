import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching announcements for global view, limit:', visibleCount);

        // Try with compound query first (requires index)
        try {
          const announcementsCollection = collection(db, 'announcements');
          const announcementsQuery = query(
            announcementsCollection,
            orderBy('createdAt', 'desc'),
            limit(visibleCount)
          );

          const announcementsSnapshot = await getDocs(announcementsQuery);

          const announcementsList = announcementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          console.log('Announcements fetched successfully:', announcementsList.length);
          setAnnouncements(announcementsList);
          setHasMore(announcementsList.length === visibleCount);
          setLoading(false);
        } catch (indexError) {
          // If the compound query fails (likely due to missing index), fall back to a simpler query
          console.warn('Compound query failed, falling back to simple query:', indexError);

          const announcementsCollection = collection(db, 'announcements');
          const simpleQuery = query(announcementsCollection);

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

          console.log('Announcements fetched with fallback:', announcementsList.length);
          setAnnouncements(announcementsList);
          setHasMore(announcementsSnapshot.docs.length > visibleCount);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setError('Failed to load announcements. Please try again later.');
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [visibleCount]);

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
          <p>No announcements available at the moment.</p>
          <p>Check back later for updates from clubs!</p>
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
