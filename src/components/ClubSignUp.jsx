import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase';

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const ClubSignUp = () => {
  // Personal Info
  const [fullName, setFullName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Club Details
  const [clubName, setClubName] = useState('');
  const [clubCategory, setClubCategory] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [yearEstablished, setYearEstablished] = useState('');

  // Club Branding
  const [clubLogo, setClubLogo] = useState(null);
  const [clubBanner, setClubBanner] = useState(null);

  // Form state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Handle file inputs
  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setClubLogo(file);
      console.log('Logo file selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  };

  const handleBannerChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setClubBanner(file);
      console.log('Banner file selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  };

  // Function to upload file and get URL without using Firebase Storage directly
  const uploadFileAsBase64 = async (file) => {
    try {
      // Convert file to base64 string
      const base64String = await fileToBase64(file);

      // For this workaround, we'll store the base64 string directly in Firestore
      // This is not ideal for large files but works as a temporary solution
      console.log('File converted to base64 successfully');

      return base64String;
    } catch (error) {
      console.error('Error converting file to base64:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validate email domain (optional - uncomment to restrict to specific domains)
      // if (!email.endsWith('@college.edu')) {
      //   setError('Please use a valid college email address');
      //   setIsLoading(false);
      //   return;
      // }

      // Upload images to Firebase Storage
      let logoUrl = '';
      let bannerUrl = '';

      // Instead of using Firebase Storage directly, we'll use base64 encoding as a workaround
      if (clubLogo) {
        try {
          console.log('Processing logo file...');
          // Use the base64 approach instead
          logoUrl = await uploadFileAsBase64(clubLogo);
          console.log('Logo processed successfully');
        } catch (uploadError) {
          console.error('Error processing logo:', uploadError);
          throw uploadError;
        }
      }

      if (clubBanner) {
        try {
          console.log('Processing banner file...');
          // Use the base64 approach instead
          bannerUrl = await uploadFileAsBase64(clubBanner);
          console.log('Banner processed successfully');
        } catch (uploadError) {
          console.error('Error processing banner:', uploadError);
          throw uploadError;
        }
      }

      // First, add the club to the clubs collection
      const clubRef = await addDoc(collection(db, 'clubs'), {
        // Club Details
        name: clubName,
        category: clubCategory,
        description: clubDescription,
        yearEstablished,

        // Club Branding
        logoUrl,
        bannerUrl,

        // Metadata
        approved: true, // Auto-approve for now, can be changed to false if admin approval is needed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // Stats
        followersCount: 0,
        eventsCount: 0,

        // Admin info (reference only)
        adminName: fullName,
        adminEmail: email
      });

      console.log('Club created with ID: ', clubRef.id);

      // Then add the club admin to Firestore
      const adminRef = await addDoc(collection(db, 'club_admins'), {
        // Personal Info
        fullName,
        collegeId,
        mobileNumber,
        email,
        password, // Note: In a real app, you should hash passwords

        // Club Reference
        clubId: clubRef.id,
        clubName,

        // Metadata
        role: 'club_admin',
        createdAt: new Date().toISOString()
      });

      console.log('Club admin registered with ID: ', adminRef.id);

      // Registration successful
      setSuccess('Club registration submitted successfully! Waiting for approval.');

      // Clear form
      setFullName('');
      setCollegeId('');
      setMobileNumber('');
      setEmail('');
      setPassword('');
      setClubName('');
      setClubCategory('');
      setClubDescription('');
      setYearEstablished('');
      setClubLogo(null);
      setClubBanner(null);

      // Store basic user info in localStorage for session management
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', fullName);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', 'club_admin');
      localStorage.setItem('clubName', clubName);
      localStorage.setItem('clubId', clubRef.id);

      // Dispatch custom event to notify other components (like Navbar)
      window.dispatchEvent(new Event('authStateChanged'));

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (error) {
      console.error('Error during club registration:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      if (error.code === 'permission-denied') {
        setError('Permission denied. Check your Firestore and Storage rules.');
      } else if (error.code === 'unavailable') {
        setError('Firebase service is unavailable. Check your internet connection.');
      } else if (error.code === 'not-found') {
        setError('Firestore database not found. Make sure you have created a Firestore database.');
      } else if (error.message && error.message.includes('CORS')) {
        setError('CORS error: Unable to upload files. Please check Firebase Storage CORS configuration.');
        console.error('CORS Error Details:', error);
      } else {
        setError(`Error: ${error.message} (Code: ${error.code || 'unknown'})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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

  const sectionVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="auth-form-container club-form-container">
      <div className="auth-card-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
      </div>

      <h2>Register Your Club</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <motion.form
        onSubmit={handleSubmit}
        className="auth-form"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h3 variants={sectionVariants}>
          <span className="section-icon">🔐</span> Personal Information
        </motion.h3>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="collegeId">College ID / Staff ID</label>
          <input
            type="text"
            id="collegeId"
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            required
            placeholder="Enter your college/staff ID"
          />
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="mobileNumber">Mobile Number</label>
          <input
            type="tel"
            id="mobileNumber"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
            placeholder="Enter your mobile number"
          />
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="email">College Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your college email"
          />
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
            minLength="6"
          />
        </motion.div>

        <motion.h3 variants={sectionVariants}>
          <span className="section-icon">🏢</span> Club Details
        </motion.h3>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="clubName">Club Name</label>
          <input
            type="text"
            id="clubName"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            required
            placeholder="Enter club name"
          />
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="clubCategory">Club Category</label>
          <select
            id="clubCategory"
            value={clubCategory}
            onChange={(e) => setClubCategory(e.target.value)}
            required
          >
            <option value="">Select a category</option>
            <option value="Tech">Tech</option>
            <option value="Cultural">Cultural</option>
            <option value="Arts">Arts</option>
            <option value="Sports">Sports</option>
            <option value="Academic">Academic</option>
            <option value="Social">Social</option>
            <option value="Other">Other</option>
          </select>
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="clubDescription">Club Description</label>
          <textarea
            id="clubDescription"
            value={clubDescription}
            onChange={(e) => setClubDescription(e.target.value)}
            required
            placeholder="Short description of what the club does"
            rows="3"
          />
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="yearEstablished">Year Established</label>
          <input
            type="number"
            id="yearEstablished"
            value={yearEstablished}
            onChange={(e) => setYearEstablished(e.target.value)}
            placeholder="Year the club was established"
            min="1900"
            max={new Date().getFullYear()}
          />
        </motion.div>

        <motion.h3 variants={sectionVariants}>
          <span className="section-icon">📷</span> Club Branding
        </motion.h3>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="clubLogo">Club Logo</label>
          <input
            type="file"
            id="clubLogo"
            onChange={handleLogoChange}
            accept="image/*"
            required
          />
          <small>Recommended size: 200x200 pixels</small>
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="clubBanner">Club Banner</label>
          <input
            type="file"
            id="clubBanner"
            onChange={handleBannerChange}
            accept="image/*"
            required
          />
          <small>Recommended size: 1200x300 pixels</small>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="submit"
            className="auth-button"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
          >
            {isLoading ? 'Registering...' : 'Register Club'}
          </motion.button>
        </motion.div>

        <motion.p className="auth-footer" variants={itemVariants}>
          By registering, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.form>
    </div>
  );
};

export default ClubSignUp;

