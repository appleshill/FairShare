import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB2Js0KZzzQf-WxH_oImMnbrK_sX5u3cbQ",
  authDomain: "fairshare-afe2a.firebaseapp.com",
  projectId: "fairshare-afe2a",
  storageBucket: "fairshare-afe2a.appspot.com",
  messagingSenderId: "495649052058",
  appId: "1:495649052058:web:3cf3b5a25515fcdeefd623",
  measurementId: "G-26027T8NYP"
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
