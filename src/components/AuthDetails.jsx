import { useState, useEffect } from 'react';

const AuthDetails = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check localStorage for login status
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');

    setIsLoggedIn(loggedIn);
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const userSignOut = () => {
    // Clear user data from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');

    // Update state
    setIsLoggedIn(false);
    setUserName('');
    setUserEmail('');

    console.log('Sign out successful');
  };

  return (
    <div className="auth-details">
      {isLoggedIn ? (
        <div>
          <p>Signed In as {userName} ({userEmail})</p>
          <button onClick={userSignOut} className="sign-out-button">Sign Out</button>
        </div>
      ) : (
        <p>Signed Out</p>
      )}
    </div>
  );
};

export default AuthDetails;
