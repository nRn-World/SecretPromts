import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDRiERJVtKRrYFKeXLVkaYtu3VBye76D1s",
  authDomain: "secretpromts.firebaseapp.com",
  projectId: "secretpromts",
  storageBucket: "secretpromts.firebasestorage.app",
  messagingSenderId: "854110275451",
  appId: "1:854110275451:web:3147d914f828d91216dfde",
  measurementId: "G-GW62KZK9DX"
};

const app = initializeApp(firebaseConfig);

export const googleClientId = '854110275451-rprkdsdorr5atqamuc5acs8l6mclt4l5.apps.googleusercontent.com';

export default app;
