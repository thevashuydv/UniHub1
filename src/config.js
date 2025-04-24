// Configuration for different environments
const config = {
  development: {
    apiUrl: 'http://localhost:3003',
    firebase: {
      apiKey: "AIzaSyCngff3ooJZvEVs0GV-9uzOhrH4x2ftEhk",
      authDomain: "unihub-c1a9d.firebaseapp.com",
      projectId: "unihub-c1a9d",
      storageBucket: "unihub-c1a9d.appspot.com",
      messagingSenderId: "105546494412",
      appId: "1:105546494412:web:583d50906112481b972d69",
      measurementId: "G-PHC3VEM1Q4"
    }
  },
  production: {
    // Replace with your deployed server URL
    apiUrl: 'https://unihub-email-server.onrender.com',
    firebase: {
      apiKey: "AIzaSyCngff3ooJZvEVs0GV-9uzOhrH4x2ftEhk",
      authDomain: "unihub-c1a9d.firebaseapp.com",
      projectId: "unihub-c1a9d",
      storageBucket: "unihub-c1a9d.appspot.com",
      messagingSenderId: "105546494412",
      appId: "1:105546494412:web:583d50906112481b972d69",
      measurementId: "G-PHC3VEM1Q4"
    }
  }
};

// Determine the current environment
const env = import.meta.env.MODE || 'development';

// Export the configuration for the current environment
export default config[env];
