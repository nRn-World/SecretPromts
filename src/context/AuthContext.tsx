import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { signUp as fbSignUp, signIn as fbSignIn, logOut as fbLogOut, onAuthChanged, signInWithGoogle as fbGoogleSignIn } from '../firebase/auth';
import { getAdminEmail, setAdminEmail, isEmailBlocked, getUserProfile } from '../firebase/firestore';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: AuthUser;
  isGuest: boolean;
  isAdmin: boolean;
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
}

const guestUser: AuthUser = {
  id: 'guest',
  email: '',
  displayName: 'Guest',
  isGuest: true,
  isAdmin: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminEmail, setAdminEmailState] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChanged(async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setLoading(false);
        setIsBlocked(false);
      } else {
        // Check if email is blocked
        const emailBlocked = await isEmailBlocked(user.email || '');
        setIsBlocked(emailBlocked);
        
        // Also check user profile
        const profile = await getUserProfile(user.uid);
        if (profile?.isBlocked) {
          setIsBlocked(true);
        }
      }
    });
    return unsub;
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
      isAdmin: !!adminEmail && firebaseUser.email?.toLowerCase() === adminEmail.toLowerCase(),
    };
  }, [firebaseUser, adminEmail, isBlocked]);

  const createAccount = async (email: string, password: string, _displayName: string) => {
    try {
      const blocked = await isEmailBlocked(email);
      if (blocked) return { ok: false, message: 'Detta konto är blockerat. Kontakta admin.' };
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
      const blocked = await isEmailBlocked(email);
      if (blocked) return { ok: false, message: 'Detta konto är blockerat. Kontakta admin.' };
      await fbSignIn(email, password);
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
      setIsAuthModalOpen(false);
      return { ok: true, message: 'authLoggedIn' };
    } catch (e: any) {
      if (e.code === 'auth/popup-closed-by-user') return { ok: false, message: 'authPopupClosed' };
      if (e.code === 'auth/cancelled-popup-request') return { ok: false, message: 'authGenericError' };
      return { ok: false, message: 'authGenericError' };
    }
  };

  const loginAsAdmin = async (email: string, password: string) => {
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