import React from 'react';

const SimpleSignUp = () => {
  return (
    <div className="auth-form-container">
      <h2>Create Your Account</h2>
      
      <form className="auth-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            required
            placeholder="Enter your email address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            required
            placeholder="Create a secure password"
            minLength="6"
          />
        </div>

        <button type="submit" className="auth-button">
          Create Account
        </button>
      </form>
    </div>
  );
};

export default SimpleSignUp;
