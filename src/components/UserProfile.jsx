import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import './UserProfile.css';

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // User data state
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    college: '',
    contactNumber: '',
    bio: '',
    profilePicture: ''
  });

  // Form data state (for editing)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    contactNumber: '',
    bio: ''
  });

  const fileInputRef = useRef(null);

  // Check if user is logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');

    if (!isLoggedIn || !userEmail) {
      navigate('/signin');
      return;
    }

    fetchUserProfile(userEmail);
  }, [navigate]);

  // Fetch user profile data
  const fetchUserProfile = async (userEmail) => {
    try {
      setLoading(true);
      setError('');

      // Check regular users collection first
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // User found in regular users collection
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        setUserId(userDoc.id);
        setUserData({
          name: userData.name || '',
          email: userData.email || '',
          college: userData.college || '',
          contactNumber: userData.contactNumber || '',
          bio: userData.bio || '',
          profilePicture: userData.profilePicture || ''
        });

        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          college: userData.college || '',
          contactNumber: userData.contactNumber || '',
          bio: userData.bio || ''
        });
      } else {
        // Check club_admins collection
        const clubAdminsRef = collection(db, 'club_admins');
        const adminQuery = query(clubAdminsRef, where('email', '==', userEmail));
        const adminSnapshot = await getDocs(adminQuery);

        if (!adminSnapshot.empty) {
          // User found in club_admins collection
          const adminDoc = adminSnapshot.docs[0];
          const adminData = adminDoc.data();

          setUserId(adminDoc.id);
          setUserData({
            name: adminData.fullName || '',
            email: adminData.email || '',
            college: adminData.collegeId || '',
            contactNumber: adminData.mobileNumber || '',
            bio: adminData.bio || '',
            profilePicture: adminData.profilePicture || ''
          });

          setFormData({
            name: adminData.fullName || '',
            email: adminData.email || '',
            college: adminData.collegeId || '',
            contactNumber: adminData.mobileNumber || '',
            bio: adminData.bio || ''
          });
        } else {
          setError('User profile not found');
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please try again later.');
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Cancel editing - reset form data to current user data
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        college: userData.college || '',
        contactNumber: userData.contactNumber || '',
        bio: userData.bio || ''
      });
    }
    setIsEditing(!isEditing);
    setSuccess('');
  };

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Determine which collection to update based on user type
      const isClubAdmin = localStorage.getItem('userRole') === 'club_admin';
      const collectionName = isClubAdmin ? 'club_admins' : 'users';

      // Create update object based on user type
      let updateData;

      if (isClubAdmin) {
        updateData = {
          fullName: formData.name,
          collegeId: formData.college,
          mobileNumber: formData.contactNumber,
          bio: formData.bio,
          updatedAt: new Date().toISOString()
        };
      } else {
        updateData = {
          name: formData.name,
          college: formData.college,
          contactNumber: formData.contactNumber,
          bio: formData.bio,
          updatedAt: new Date().toISOString()
        };
      }

      // Update user document in Firestore
      const userDocRef = doc(db, collectionName, userId);
      await updateDoc(userDocRef, updateData);

      // Update local state
      setUserData({
        ...userData,
        name: formData.name,
        college: formData.college,
        contactNumber: formData.contactNumber,
        bio: formData.bio
      });

      // Update localStorage if name changed
      if (formData.name !== userData.name) {
        localStorage.setItem('userName', formData.name);
        // Dispatch custom event to notify other components (like Navbar)
        window.dispatchEvent(new Event('authStateChanged'));
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setLoading(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError('');

      console.log('Processing profile picture file...');

      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('File size exceeds 2MB. Please choose a smaller image.');
        setUploadingImage(false);
        return;
      }

      // Convert file to base64 string
      const base64String = await fileToBase64(file);
      console.log('File converted to base64 successfully');

      // Determine which collection to update based on user type
      const isClubAdmin = localStorage.getItem('userRole') === 'club_admin';
      const collectionName = isClubAdmin ? 'club_admins' : 'users';

      // Update user document in Firestore with base64 string
      const userDocRef = doc(db, collectionName, userId);
      await updateDoc(userDocRef, {
        profilePicture: base64String,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUserData({
        ...userData,
        profilePicture: base64String
      });

      setSuccess('Profile picture updated successfully!');
      setUploadingImage(false);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Failed to upload profile picture. Please try again.');
      setUploadingImage(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
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
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p className="profile-subtitle">View and manage your personal information</p>
      </div>

      {error && <div className="error">{error}</div>}
      <AnimatePresence>
        {success && (
          <motion.div
            className="success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      ) : (
        <motion.div
          className="profile-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile-picture-section">
            <motion.div
              className="profile-picture-container"
              variants={itemVariants}
            >
              {userData.profilePicture ? (
                <img
                  src={userData.profilePicture}
                  alt="Profile"
                  className="profile-picture"
                />
              ) : (
                <div className="profile-picture-placeholder">
                  {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <motion.button
                className="change-picture-button"
                onClick={triggerFileInput}
                disabled={uploadingImage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variants={itemVariants}
              >
                {uploadingImage ? 'Uploading...' : 'Change Picture'}
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            className="profile-details-section"
            variants={itemVariants}
          >
            <div className="profile-actions">
              <motion.button
                className={`edit-profile-button ${isEditing ? 'cancel' : ''}`}
                onClick={toggleEditMode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </motion.button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="profile-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  ) : (
                    <div className="profile-field">{userData.name || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="profile-field">{userData.email}</div>
                </div>

                <div className="form-group">
                  <label htmlFor="college">College/University</label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="college"
                      name="college"
                      value={formData.college}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="profile-field">{userData.college || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="profile-field">{userData.contactNumber || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="bio">Bio</label>
                  {isEditing ? (
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Tell us a bit about yourself..."
                    />
                  ) : (
                    <div className="profile-field bio">{userData.bio || 'No bio provided'}</div>
                  )}
                </div>
              </div>

              {isEditing && (
                <motion.div
                  className="form-actions"
                  variants={itemVariants}
                >
                  <motion.button
                    type="submit"
                    className="save-button"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </motion.div>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default UserProfile;
