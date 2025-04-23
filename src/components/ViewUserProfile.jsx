import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import './UserProfile.css'; // Reuse the same CSS as UserProfile
import './EnhancedProfile.css'; // Enhanced styles

const ViewUserProfile = () => {
  const { userId, userType } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    college: '',
    contactNumber: '',
    bio: '',
    profilePicture: ''
  });

  // Check if viewer is a club admin
  const isClubAdmin = localStorage.getItem('userRole') === 'club_admin';

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.5 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 12 }
    }
  };

  const profilePicVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        delay: 0.1,
        duration: 0.6
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
      transition: { type: 'spring', stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');

        let userData;

        if (userType === 'user') {
          // Fetch from users collection
          const userDoc = await getDoc(doc(db, 'users', userId));

          if (userDoc.exists()) {
            userData = userDoc.data();
            setUserData({
              name: userData.name || '',
              email: userData.email || '',
              college: userData.college || '',
              contactNumber: userData.contactNumber || '',
              bio: userData.bio || '',
              profilePicture: userData.profilePicture || ''
            });
          } else {
            setError('User profile not found');
          }
        } else if (userType === 'club_admin') {
          // Fetch from club_admins collection
          const adminDoc = await getDoc(doc(db, 'club_admins', userId));

          if (adminDoc.exists()) {
            userData = adminDoc.data();
            setUserData({
              name: userData.fullName || '',
              email: userData.email || '',
              college: userData.collegeId || '',
              contactNumber: userData.mobileNumber || '',
              bio: userData.bio || '',
              profilePicture: userData.profilePicture || ''
            });
          } else {
            setError('User profile not found');
          }
        } else {
          // Try to find in both collections if userType is not specified
          // First check users collection
          const usersRef = collection(db, 'users');
          const userQuery = query(usersRef, where('email', '==', userId));
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            userData = userDoc.data();
            setUserData({
              name: userData.name || '',
              email: userData.email || '',
              college: userData.college || '',
              contactNumber: userData.contactNumber || '',
              bio: userData.bio || '',
              profilePicture: userData.profilePicture || ''
            });
          } else {
            // Then check club_admins collection
            const adminsRef = collection(db, 'club_admins');
            const adminQuery = query(adminsRef, where('email', '==', userId));
            const adminSnapshot = await getDocs(adminQuery);

            if (!adminSnapshot.empty) {
              const adminDoc = adminSnapshot.docs[0];
              userData = adminDoc.data();
              setUserData({
                name: userData.fullName || '',
                email: userData.email || '',
                college: userData.collegeId || '',
                contactNumber: userData.mobileNumber || '',
                bio: userData.bio || '',
                profilePicture: userData.profilePicture || ''
              });
            } else {
              setError('User profile not found');
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile. Please try again later.');
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    } else {
      setError('User ID is required');
      setLoading(false);
    }
  }, [userId, userType]);

  // Go back to previous page
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <motion.div
      className="profile-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="profile-header enhanced">
        <div className="back-button-container">
          <motion.button
            className="back-button enhanced"
            onClick={handleGoBack}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span className="back-icon">←</span> Back
          </motion.button>
        </div>
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          User Profile
        </motion.h1>
        <motion.p
          className="profile-subtitle"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Viewing user information
        </motion.p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="error enhanced"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <motion.div
          className="loading-spinner-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="loading-spinner enhanced"></div>
          <p>Loading profile...</p>
        </motion.div>
      ) : (
        <motion.div
          className="profile-content enhanced"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile-picture-section">
            <motion.div
              className="profile-picture-container"
              variants={profilePicVariants}
            >
              {userData.profilePicture ? (
                <motion.img
                  src={userData.profilePicture}
                  alt="Profile"
                  className="profile-picture enhanced"
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(100, 108, 255, 0.5)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                />
              ) : (
                <motion.div
                  className="profile-picture-placeholder enhanced"
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(100, 108, 255, 0.5)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                  {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
                </motion.div>
              )}
            </motion.div>
          </div>

          <motion.div
            className="profile-details-section view-only enhanced"
            variants={itemVariants}
          >
            <div className="profile-form enhanced">
              <motion.div
                className="form-group"
                variants={itemVariants}
              >
                <label>Full Name</label>
                <div className="profile-field enhanced">{userData.name || 'Not provided'}</div>
              </motion.div>

              <motion.div
                className="form-group"
                variants={itemVariants}
              >
                <label>Email Address</label>
                <div className="profile-field enhanced">{userData.email}</div>
              </motion.div>

              <motion.div
                className="form-group"
                variants={itemVariants}
              >
                <label>College/University</label>
                <div className="profile-field enhanced">{userData.college || 'Not provided'}</div>
              </motion.div>

              <motion.div
                className="form-group"
                variants={itemVariants}
              >
                <label>Contact Number</label>
                <div className="profile-field enhanced">{userData.contactNumber || 'Not provided'}</div>
              </motion.div>

              <motion.div
                className="form-group full-width"
                variants={itemVariants}
              >
                <label>Bio</label>
                <div className="profile-field bio enhanced">{userData.bio || 'No bio provided'}</div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ViewUserProfile;
