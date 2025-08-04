import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDnU6ZOYL-ngt8XimJfiU99u_NEy2BsGtA",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "fashionkesang.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "fashionkesang",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "fashionkesang.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1060419486525",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1060419486525:web:7bd1d879501bf3b5f23b54",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-9RCPDP1HVR"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
export default app;