import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check localStorage for login status
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedName = localStorage.getItem('userName');
    const storedRole = localStorage.getItem('userRole');

    setIsLoggedIn(loggedIn);
    if (storedName) setUserName(storedName);
    if (storedRole) setUserRole(storedRole);

    // Add event listener for storage changes (for when other components update localStorage)
    const handleStorageChange = () => {
      const updatedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const updatedName = localStorage.getItem('userName');
      const updatedRole = localStorage.getItem('userRole');

      setIsLoggedIn(updatedLoggedIn);
      if (updatedName) setUserName(updatedName);
      if (updatedRole) setUserRole(updatedRole);
    };

    window.addEventListener('storage', handleStorageChange);

    // Also add a custom event listener for login/logout events
    const handleAuthEvent = () => {
      const updatedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const updatedName = localStorage.getItem('userName');
      const updatedRole = localStorage.getItem('userRole');

      setIsLoggedIn(updatedLoggedIn);
      if (updatedName) setUserName(updatedName);
      if (updatedRole) setUserRole(updatedRole);
    };

    window.addEventListener('authStateChanged', handleAuthEvent);

    // Add scroll event listener
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Clean up event listeners
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthEvent);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleSignOut = () => {
    // Clear user data from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('clubId');
    localStorage.removeItem('clubName');

    // Update state
    setIsLoggedIn(false);
    setUserName('');

    // Close mobile menu if open
    setMenuOpen(false);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));

    // Redirect to home page
    window.location.href = '/';
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="logo-container"
          >
            Uni<span className="logo-highlight">Hub</span> <span className="logo-icon">🎓</span>
          </motion.div>
        </Link>

        <div className="menu-icon" onClick={toggleMenu}>
          <motion.i
            className={menuOpen ? "fas fa-times" : "fas fa-bars"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          ></motion.i>
        </div>

        <ul className={menuOpen ? "nav-menu active" : "nav-menu"}>
          <motion.li
            className="nav-item"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
          </motion.li>
          {/* Only show Clubs link for regular users, not for club admins */}
          {userRole !== 'club_admin' && (
            <motion.li
              className="nav-item"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/clubs" className={`nav-link ${location.pathname === '/clubs' ? 'active' : ''}`}>
                Clubs
              </Link>
            </motion.li>
          )}
          <motion.li
            className="nav-item"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/events" className={`nav-link ${location.pathname === '/events' ? 'active' : ''}`}>
              Events
            </Link>
          </motion.li>
          <motion.li
            className="nav-item"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Link to="/announcements" className={`nav-link ${location.pathname === '/announcements' ? 'active' : ''}`}>
              Announcements
            </Link>
          </motion.li>
          {/* About page removed as requested */}

          {isLoggedIn && userRole === 'club_admin' && (
            <motion.li
              className="nav-item"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Link to="/dashboard" className={`nav-link dashboard-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
            </motion.li>
          )}

          {isLoggedIn ? (
            <>
              <motion.li
                className="nav-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/profile" className="nav-button profile">
                    My Profile
                  </Link>
                </motion.div>
              </motion.li>
              <motion.li
                className="nav-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  onClick={handleSignOut}
                  className="nav-button sign-out"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Out
                </motion.button>
              </motion.li>
            </>
          ) : (
            <>
              <motion.li
                className="nav-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/signin" className="nav-button sign-in">
                    Sign In
                  </Link>
                </motion.div>
              </motion.li>
              <motion.li
                className="nav-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/signup" className="nav-button sign-up">
                    Sign Up
                  </Link>
                </motion.div>
              </motion.li>
            </>
          )}
        </ul>
      </div>
    </motion.nav>
  );
};

export default Navbar;
