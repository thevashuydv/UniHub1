import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import './Home.css';
import './EnhancedHome.css';

const Home = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userName = localStorage.getItem('userName');
  const [featuredClubs, setFeaturedClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured clubs
  useEffect(() => {
    const fetchFeaturedClubs = async () => {
      try {
        const clubsCollection = collection(db, 'clubs');
        const clubsQuery = query(clubsCollection, orderBy('followersCount', 'desc'), limit(3));
        const clubSnapshot = await getDocs(clubsQuery);

        const clubsList = clubSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setFeaturedClubs(clubsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching featured clubs:', error);
        setLoading(false);
      }
    };

    fetchFeaturedClubs();
  }, []);

  return (
    <div className="home-container">
      <motion.div
        className="hero-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
        >
          <h1>Welcome to <span className="text-gradient">UniHub</span></h1>
          <p className="hero-subtitle">Your one-stop platform for university clubs and events</p>
        </motion.div>

        {isLoggedIn ? (
          <motion.div
            className="welcome-message"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h2>Welcome back, <span className="user-name-highlight">{userName}</span>!</h2>
            <p>Explore clubs and events happening around your campus.</p>
            <div className="cta-buttons">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Link to="/clubs" className="cta-button primary">
                  Explore Clubs
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <Link to="/events" className="cta-button secondary">
                  Upcoming Events
                </Link>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="cta-buttons"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
              <Link to="/signup" className="cta-button primary">
                Join Now
              </Link>
            </motion.div>
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
              <Link to="/signin" className="cta-button secondary">
                Sign In
              </Link>
            </motion.div>
          </motion.div>
        )}

        <motion.div
          className="hero-shapes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </motion.div>
      </motion.div>

      <motion.div
        className="features-section"
        data-aos="fade-up"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          className="section-title"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          What UniHub <span className="text-gradient">Offers</span>
        </motion.h2>
        <div className="features-grid">
          <div className="feature-card" data-aos="fade-up" data-aos-delay="100">
            <div className="feature-icon-container">
              <div className="feature-icon">🔍</div>
            </div>
            <h3>Discover Clubs</h3>
            <p>Find and join clubs that match your interests and passions.</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
            <div className="feature-icon-container">
              <div className="feature-icon">📅</div>
            </div>
            <h3>Track Events</h3>
            <p>Stay updated with all the events happening around your campus.</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="300">
            <div className="feature-icon-container">
              <div className="feature-icon">👥</div>
            </div>
            <h3>Connect</h3>
            <p>Network with like-minded students and build lasting relationships.</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="400">
            <div className="feature-icon-container">
              <div className="feature-icon">🚀</div>
            </div>
            <h3>Grow</h3>
            <p>Develop new skills and enhance your university experience.</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="clubs-preview-section"
        data-aos="fade-up"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          className="section-title"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Popular <span className="text-gradient">Clubs</span>
        </motion.h2>

        {loading ? (
          <div className="clubs-loading">
            <div className="loading-spinner"></div>
            <p>Loading clubs...</p>
          </div>
        ) : featuredClubs.length === 0 ? (
          <div className="no-clubs-message">
            <p>No clubs available yet. Be the first to create one!</p>
            <div className="view-all-container">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/signup" className="view-all-link">
                  Create a Club
                </Link>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="clubs-grid">
            {featuredClubs.map((club, index) => (
              <Link to={`/clubs/${club.id}`} className="club-card" key={club.id} data-aos="fade-up" data-aos-delay={100 * (index + 1)}>
                <motion.div
                  className="club-image placeholder"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <motion.div
                    className="club-icon"
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 10,
                      delay: index * 0.1 + 0.2
                    }}
                  >
                    {club.category === 'Tech' ? '💻' :
                     club.category === 'Arts' ? '🎨' :
                     club.category === 'Sports' ? '🏆' :
                     club.category === 'Cultural' ? '🌍' :
                     club.category === 'Academic' ? '📚' :
                     club.category === 'Social' ? '👥' : '🎓'}
                  </motion.div>
                </motion.div>
                <motion.div
                  className="club-content"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                >
                  <h3>{club.name}</h3>
                  <p>{club.description}</p>
                  <motion.div className="club-tags">
                    <span className="club-tag">{club.category}</span>
                    <span className="club-tag">{club.followersCount || 0} followers</span>
                    {club.yearEstablished && (
                      <span className="club-tag">Est. {club.yearEstablished}</span>
                    )}
                  </motion.div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        <div className="view-all-container" data-aos="fade-up">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/clubs" className="view-all-link">
              View All Clubs
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="newsletter-section"
        data-aos="fade-up"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="newsletter-content"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.h2
            className="section-title"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Stay <span className="text-gradient">Updated</span>
          </motion.h2>
          <p>Subscribe to our newsletter to get the latest updates on clubs and events.</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Enter your email" required />
            <motion.button
              type="submit"
              className="newsletter-button"
              whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(100, 108, 255, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              Subscribe
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
