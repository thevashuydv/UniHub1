// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCngff3ooJZvEVs0GV-9uzOhrH4x2ftEhk",
  authDomain: "unihub-c1a9d.firebaseapp.com",
  projectId: "unihub-c1a9d",
  storageBucket: "unihub-c1a9d.appspot.com",
  messagingSenderId: "105546494412",
  appId: "1:105546494412:web:583d50906112481b972d69",
  measurementId: "G-PHC3VEM1Q4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);
console.log('Firebase Storage initialized');

export default app;
