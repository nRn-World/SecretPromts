import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { signUp as fbSignUp, signIn as fbSignIn, logOut as fbLogOut, onAuthChanged, signInWithGoogle as fbGoogleSignIn, handleGoogleRedirectResult } from '../firebase/auth';
import { getAdminEmail, setAdminEmail, isEmailBlocked, getUserProfile, ensureUserProfile } from '../firebase/firestore';
import type { User } from 'firebase/auth';

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
  continueAsGuest: () => void | Promise<void>;
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

const syncUserProfile = async (user: User) => {
  await ensureUserProfile(
    user.uid,
    user.displayName || user.email?.split('@')[0] || 'User',
    user.email || undefined,
    user.photoURL || undefined,
  );
};

const checkIfBlocked = async (user: User): Promise<boolean> => {
  if (user.email?.toLowerCase() === 'bynrnworld@gmail.com') return false;
  if (user.email && await isEmailBlocked(user.email)) return true;
  const profile = await getUserProfile(user.uid);
  return !!profile?.isBlocked;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminEmail, setAdminEmailState] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isAuthorState, setIsAuthorState] = useState(false);
  const [loading, setLoading] = useState(true);

  const mapGoogleAuthError = (code?: string): string => {
    if (code === 'auth/popup-closed-by-user') return 'authPopupClosed';
    if (code === 'auth/unauthorized-domain') return 'authUnauthorizedDomain';
    if (code === 'auth/popup-blocked') return 'authPopupBlocked';
    if (code === 'auth/operation-not-allowed') return 'authGoogleDisabled';
    if (code === 'auth/network-request-failed') return 'authNetworkError';
    return 'authGenericError';
  };

  useEffect(() => {
    let active = true;

    handleGoogleRedirectResult()
      .then((result) => {
        if (result?.user) setIsAuthModalOpen(false);
      })
      .catch((error) => {
        console.error('Google redirect sign-in failed:', error);
      });

    const unsub = onAuthChanged(async (user) => {
      if (!active) return;
      setFirebaseUser(user);

      if (!user) {
        setIsBlocked(false);
        setIsAuthorState(false);
        setLoading(false);
        return;
      }

      try {
        await syncUserProfile(user);
        const blocked = await checkIfBlocked(user);
        if (!active) return;

        if (blocked) {
          setIsBlocked(true);
          setIsAuthorState(false);
          await fbLogOut();
          setIsAuthModalOpen(true);
          return;
        }

        setIsBlocked(false);
        const profile = await getUserProfile(user.uid);
        if (!active) return;
        setIsAuthorState(!!profile?.isAuthor);
      } catch (error) {
        console.error('Auth profile sync failed:', error);
        if (!active) return;
        setIsBlocked(false);
      } finally {
        if (active) setLoading(false);
      }
    });

    getAdminEmail().then((email) => {
      if (active) setAdminEmailState(email);
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

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
  }, [firebaseUser, isBlocked, isAuthorState]);

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
    try {
      await fbGoogleSignIn();
      return { ok: true, message: 'authRedirecting' };
    } catch (e: any) {
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

  const continueAsGuest = async () => {
    await fbLogOut();
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    await fbLogOut();
    setAdminEmailState(null);
  };

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
  }), [user, isAuthModalOpen]);

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
