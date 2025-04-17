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
      // Query Firestore to find user with matching email and password
      console.log('Attempting to sign in with email:', email);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), where('password', '==', password));
      const querySnapshot = await getDocs(q);

      console.log('Query results:', querySnapshot.size, 'documents found');

      if (querySnapshot.empty) {
        setError('Invalid email or password');
        return;
      }

      // Get user data
      const userData = querySnapshot.docs[0].data();

      // Store user info in localStorage for session management
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('isLoggedIn', 'true');

      // Signed in successfully
      setSuccess('Signed in successfully!');
      setEmail('');
      setPassword('');

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
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
