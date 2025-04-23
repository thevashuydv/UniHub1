import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignUp from '../components/SignUp';
import SignIn from '../components/SignIn';
import ClubSignUp from '../components/ClubSignUp';
import AuthDetails from '../components/AuthDetails';

const AuthPage = ({ defaultTab = 'signin' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [registrationType, setRegistrationType] = useState('user'); // 'user' or 'club'
  const navigate = useNavigate();
  
  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      // Redirect to home page if already logged in
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="auth-container">
    
      <div className="auth-tabs">
        <button
          className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
          onClick={() => setActiveTab('signin')}
        >
          Sign In
        </button>
        <button
          className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
          onClick={() => setActiveTab('signup')}
        >
          Sign Up
        </button>
      </div>
      
      {/* Registration Type Selector (only show for signup) */}
      {activeTab === 'signup' && (
        <div className="registration-type-selector">
          <button
            className={`reg-type-btn ${registrationType === 'user' ? 'active' : ''}`}
            onClick={() => setRegistrationType('user')}
          >
            Register as User
          </button>
          <button
            className={`reg-type-btn ${registrationType === 'club' ? 'active' : ''}`}
            onClick={() => setRegistrationType('club')}
          >
            Register as Club Admin
          </button>
        </div>
      )}
      
      {/* Render the appropriate form */}
      {activeTab === 'signin' ? (
        <SignIn />
      ) : (
        registrationType === 'user' ? <SignUp /> : <ClubSignUp />
      )}
      
      <AuthDetails />
    </div>
  );
};

export default AuthPage;
