import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import app, { googleClientId } from './config';

export const auth = getAuth(app);
export { googleClientId };

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const onAuthChanged = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);

export const signInWithGoogleIdToken = (idToken: string) =>
  signInWithCredential(auth, GoogleAuthProvider.credential(idToken));

export const loadGoogleIdentityScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById('google-identity-services');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Identity Services failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services failed to load'));
    document.head.appendChild(script);
  });
