import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      console.log('Attempting to sign in with email:', email);

      // First, try to find the user in the regular users collection
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', email), where('password', '==', password));
      const userSnapshot = await getDocs(userQuery);

      // If not found in users, check the club_admins collection
      const clubAdminsRef = collection(db, 'club_admins');
      const adminQuery = query(clubAdminsRef, where('email', '==', email), where('password', '==', password));
      const adminSnapshot = await getDocs(adminQuery);

      console.log('Query results - Users:', userSnapshot.size, 'Club Admins:', adminSnapshot.size);

      // If not found in either collection, show error
      if (userSnapshot.empty && adminSnapshot.empty) {
        setError('Invalid email or password');
        return;
      }

      // Determine which collection the user was found in and get their data
      let userData;
      let isClubAdmin = false;

      if (!userSnapshot.empty) {
        // Regular user found
        userData = userSnapshot.docs[0].data();
        userData.id = userSnapshot.docs[0].id;
      } else {
        // Club admin found
        userData = adminSnapshot.docs[0].data();
        userData.id = adminSnapshot.docs[0].id;
        isClubAdmin = true;
      }

      // Store user info in localStorage for session management
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', isClubAdmin ? userData.fullName : userData.name);
      localStorage.setItem('isLoggedIn', 'true');

      // If user is a club admin, store additional info
      if (isClubAdmin) {
        console.log('Club admin login detected:', userData);
        localStorage.setItem('userRole', 'club_admin');
        localStorage.setItem('clubId', userData.clubId);
        localStorage.setItem('clubName', userData.clubName);
        console.log('Stored club admin data in localStorage:', {
          userRole: 'club_admin',
          clubId: userData.clubId,
          clubName: userData.clubName
        });
      }

      // Signed in successfully
      setSuccess('Signed in successfully!');
      setEmail('');
      setPassword('');

      // Dispatch custom event to notify other components (like Navbar)
      window.dispatchEvent(new Event('authStateChanged'));

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
    }
  };

  // Animation variants for staggered animations
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
    <div className="auth-form-container">
      <div className="auth-card-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
      </div>

      <h2>Welcome Back</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <motion.form
        onSubmit={handleSubmit}
        className="auth-form"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="email">
            <span className="input-icon">✉️</span> Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email address"
          />
        </motion.div>

        <motion.div className="form-group" variants={itemVariants}>
          <label htmlFor="password">
            <span className="input-icon">🔒</span> Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
          <div className="forgot-password">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="submit"
            className="auth-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>
        </motion.div>

        <motion.p className="auth-footer" variants={itemVariants}>
          Don't have an account? <Link to="/signup">Create one now</Link>
        </motion.p>
      </motion.form>
    </div>
  );
};

export default SignIn;
