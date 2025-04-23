import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase';

const SignUp = () => {
  const [name, setName] = useState('');
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
      // Check if user with this email already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('A user with this email already exists');
        return;
      }

      // Add user to Firestore
      console.log('Attempting to add user to Firestore:', { name, email });
      const docRef = await addDoc(collection(db, 'users'), {
        name,
        email,
        password, // Note: In a real app, you should hash passwords before storing them
        createdAt: new Date().toISOString()
      });
      console.log('Document written with ID: ', docRef.id);

      // User registered successfully
      setSuccess('User registered successfully!');
      setName('');
      setEmail('');
      setPassword('');

      // Store user info in localStorage for session management
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', name);
      localStorage.setItem('isLoggedIn', 'true');

      // Dispatch custom event to notify other components (like Navbar)
      window.dispatchEvent(new Event('authStateChanged'));

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (error) {
      console.error('Error during sign up:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      if (error.code === 'permission-denied') {
        setError('Permission denied. Check your Firestore rules.');
      } else if (error.code === 'unavailable') {
        setError('Firebase service is unavailable. Check your internet connection.');
      } else if (error.code === 'not-found') {
        setError('Firestore database not found. Make sure you have created a Firestore database in your Firebase project.');
      } else if (error.code === 'resource-exhausted') {
        setError('Firebase quota exceeded. Check your Firebase usage.');
      } else {
        setError(`Error: ${error.message} (Code: ${error.code || 'unknown'})`);
      }
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

      <h2>Create Your Account</h2>

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
          <label htmlFor="name">
            <span className="input-icon">👤</span> Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </motion.div>

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
            placeholder="Create a secure password"
            minLength="6"
          />
          <small>Password must be at least 6 characters long</small>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="submit"
            className="auth-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Account
          </motion.button>
        </motion.div>

        <motion.p className="auth-footer" variants={itemVariants}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.form>
    </div>
  );
};

export default SignUp;
