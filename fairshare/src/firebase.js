import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDv8hpZGKGllJrk4Mszz8LfLhEOe88tRwY",
    authDomain: "splitdumb-4ce22.firebaseapp.com",
    projectId: "splitdumb-4ce22",
    storageBucket: "splitdumb-4ce22.appspot.com",
    messagingSenderId: "1027055263565",
    appId: "1:1027055263565:web:3766adb5efa15a535c6104",
    measurementId: "G-ZVGYD8VEDC"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// If using Firebase App Check
// import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
// export const appCheck = initializeAppCheck(app, {
//   provider: new ReCaptchaV3Provider('your-recaptcha-public-key'),
//   isTokenAutoRefreshEnabled: true
// });
