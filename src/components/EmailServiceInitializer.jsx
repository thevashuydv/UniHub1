import { useEffect } from 'react';
import { initEmailService } from '../utils/emailService';

const EmailServiceInitializer = () => {
  useEffect(() => {
    // Initialize the email service when the app starts
    initEmailService();
  }, []);

  return null; // This component doesn't render anything
};

export default EmailServiceInitializer;
