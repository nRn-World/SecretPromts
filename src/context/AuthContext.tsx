import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { signUp as fbSignUp, signIn as fbSignIn, logOut as fbLogOut, onAuthChanged, signInWithGoogle as fbGoogleSignIn, handleGoogleRedirectResult } from '../firebase/auth';
import { getAdminEmail, setAdminEmail, isEmailBlocked, getUserProfile, ensureUserProfile } from '../firebase/firestore';
import type { User, UserCredential } from 'firebase/auth';

interface AuthContextType {
  user: AuthUser;
  isGuest: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  createAccount: (email: string, password: string, displayName: string) => Promise<{ ok: boolean; message: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  loginWithGoogle: () => Promise<{ ok: boolean; message: string }>;
  continueAsGuest: () => void;
  logout: () => void;
  loginAsAdmin: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signUpAdmin: (email: string, password: string, displayName: string) => Promise<{ ok: boolean; message: string }>;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isGuest: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
}

const guestUser: AuthUser = {
  id: 'guest',
  email: '',
  displayName: 'Guest',
  isGuest: true,
  isAdmin: false,
  isAuthor: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminEmail, setAdminEmailState] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isAuthorState, setIsAuthorState] = useState(false);
  const [loading, setLoading] = useState(true);

  const validateGoogleCredential = async (cred: UserCredential): Promise<{ ok: boolean; message: string } | null> => {
    try {
      const fbUser = cred.user;
      await ensureUserProfile(
        fbUser.uid,
        fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        fbUser.email || undefined,
        fbUser.photoURL || undefined,
      );

      if (fbUser.email && fbUser.email.toLowerCase() !== 'bynrnworld@gmail.com') {
        const emailBlocked = await isEmailBlocked(fbUser.email);
        if (emailBlocked) {
          await fbLogOut();
          return { ok: false, message: 'Detta konto är blockerat. Kontakta admin.' };
        }
        const profile = await getUserProfile(fbUser.uid);
        if (profile?.isBlocked) {
          await fbLogOut();
          return { ok: false, message: 'Detta konto är blockerat. Kontakta admin.' };
        }
      }
      return null;
    } catch (error) {
      console.error('Google credential validation failed:', error);
      await fbLogOut();
      return { ok: false, message: 'authGenericError' };
    }
  };

  const mapGoogleAuthError = (code?: string): string => {
    if (code === 'auth/popup-closed-by-user') return 'authPopupClosed';
    if (code === 'auth/unauthorized-domain') return 'authUnauthorizedDomain';
    if (code === 'auth/popup-blocked') return 'authPopupBlocked';
    if (code === 'auth/operation-not-allowed') return 'authGoogleDisabled';
    if (code === 'auth/network-request-failed') return 'authNetworkError';
    return 'authGenericError';
  };

  useEffect(() => {
    const unsub = onAuthChanged(async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setLoading(false);
        setIsBlocked(false);
      } else if (user.email?.toLowerCase() === 'bynrnworld@gmail.com') {
        // Admin email is never blocked
        setIsBlocked(false);
        const profile = await getUserProfile(user.uid);
        setIsAuthorState(!!profile?.isAuthor);
        setLoading(false);
      } else {
        try {
          const emailBlocked = await isEmailBlocked(user.email || '');
          const profile = await getUserProfile(user.uid);
          setIsBlocked(emailBlocked || !!profile?.isBlocked);
          setIsAuthorState(!!profile?.isAuthor);
        } catch (error) {
          console.error('Auth state check failed:', error);
          setIsBlocked(false);
          setIsAuthorState(false);
        } finally {
          setLoading(false);
        }
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    handleGoogleRedirectResult()
      .then(async (result) => {
        if (!result?.user) return;
        const blocked = await validateGoogleCredential(result);
        if (blocked) {
          setIsAuthModalOpen(true);
        } else {
          setIsAuthModalOpen(false);
        }
      })
      .catch((error) => {
        console.error('Google redirect sign-in failed:', error);
      });
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }
    getAdminEmail().then((email) => {
      setAdminEmailState(email);
      setLoading(false);
    });
  }, [firebaseUser]);

  const user = useMemo<AuthUser>(() => {
    if (!firebaseUser || isBlocked) return guestUser;
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      isGuest: false,
      isAdmin: firebaseUser.email?.toLowerCase() === 'bynrnworld@gmail.com',
      isAuthor: isAuthorState,
    };
  }, [firebaseUser, adminEmail, isBlocked, isAuthorState]);

  const createAccount = async (email: string, password: string, _displayName: string) => {
    try {
      if (email.toLowerCase() !== 'bynrnworld@gmail.com') {
        const blocked = await isEmailBlocked(email);
        if (blocked) return { ok: false, message: 'Detta konto är blockerat. Kontakta admin.' };
      }
      const cred = await fbSignUp(email, password);
      if (cred.user) {
        setIsAuthModalOpen(false);
        return { ok: true, message: 'authAccountCreated' };
      }
      return { ok: false, message: 'authGenericError' };
    } catch (e: any) {
      const code = e.code;
      if (code === 'auth/email-already-in-use') return { ok: false, message: 'authExistingAccount' };
      if (code === 'auth/invalid-email') return { ok: false, message: 'authInvalidEmail' };
      if (code === 'auth/weak-password') return { ok: false, message: 'authWeakPassword' };
      return { ok: false, message: 'authGenericError' };
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      if (email.toLowerCase() !== 'bynrnworld@gmail.com') {
        const blocked = await isEmailBlocked(email);
        if (blocked) return { ok: false, message: 'Detta konto är blockerat. Kontakta admin.' };
      }
      const cred = await fbSignIn(email, password);
      if (email.toLowerCase() !== 'bynrnworld@gmail.com') {
        const profile = await getUserProfile(cred.user.uid);
        if (profile?.isBlocked) {
          await fbLogOut();
          return { ok: false, message: 'Detta konto är blockerat. Kontakta admin.' };
        }
      }
      setIsAuthModalOpen(false);
      return { ok: true, message: 'authLoggedIn' };
    } catch (e: any) {
      const code = e.code;
      if (code === 'auth/user-not-found') return { ok: false, message: 'authNoAccount' };
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return { ok: false, message: 'authWrongPassword' };
      if (code === 'auth/invalid-email') return { ok: false, message: 'authInvalidEmail' };
      return { ok: false, message: 'authGenericError' };
    }
  };

  const loginWithGoogle = async () => {
    let signedIn = false;
    try {
      const cred = await fbGoogleSignIn();
      signedIn = true;
      const blocked = await validateGoogleCredential(cred);
      if (blocked) return blocked;
      setIsAuthModalOpen(false);
      return { ok: true, message: 'authLoggedIn' };
    } catch (e: any) {
      if (signedIn) await fbLogOut();
      if (e?.message === 'auth/redirect-initiated') {
        return { ok: true, message: 'authRedirecting' };
      }
      return { ok: false, message: mapGoogleAuthError(e?.code) };
    }
  };

  const loginAsAdmin = async (email: string, password: string) => {
    if (email.toLowerCase() !== 'bynrnworld@gmail.com') return { ok: false, message: 'Endast bynrnworld@gmail.com kan vara admin.' };
    try {
      await fbSignIn(email, password);
      await setAdminEmail(email);
      setAdminEmailState(email);
      setIsAuthModalOpen(false);
      return { ok: true, message: 'authLoggedIn' };
    } catch (e: any) {
      const code = e.code;
      if (code === 'auth/user-not-found') return { ok: false, message: 'authNoAccount' };
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return { ok: false, message: 'authWrongPassword' };
      return { ok: false, message: 'authGenericError' };
    }
  };

  const signUpAdmin = async (email: string, password: string, _displayName: string) => {
    if (email.toLowerCase() !== 'bynrnworld@gmail.com') return { ok: false, message: 'Endast bynrnworld@gmail.com kan vara admin.' };
    try {
      const cred = await fbSignUp(email, password);
      if (cred.user) {
        await setAdminEmail(email);
        setAdminEmailState(email);
        setIsAuthModalOpen(false);
        return { ok: true, message: 'authAccountCreated' };
      }
      return { ok: false, message: 'authGenericError' };
    } catch (e: any) {
      const code = e.code;
      if (code === 'auth/email-already-in-use') return { ok: false, message: 'authExistingAccount' };
      return { ok: false, message: 'authGenericError' };
    }
  };

  const continueAsGuest = () => {
    setFirebaseUser(null);
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    await fbLogOut();
    setAdminEmailState(null);
  };

  // If user is blocked, log them out
  useEffect(() => {
    if (isBlocked && firebaseUser) {
      fbLogOut();
    }
  }, [isBlocked, firebaseUser]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isGuest: user.isGuest,
    isAdmin: user.isAdmin,
    isAuthor: user.isAuthor,
    isAuthModalOpen,
    setIsAuthModalOpen,
    createAccount,
    loginWithEmail,
    loginWithGoogle,
    continueAsGuest,
    logout,
    loginAsAdmin,
    signUpAdmin,
  }), [user, isAuthModalOpen, loading]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};