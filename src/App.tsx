import { useEffect } from 'react';
import { PromptProvider } from './context/PromptContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { Filters } from './components/Filters';
import { PromptGrid } from './components/PromptGrid';
import { CreatePromptModal } from './components/CreatePromptModal';
import { PromptDetailModal } from './components/PromptDetailModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ManageCategoriesModal } from './components/ManageCategoriesModal';
import { EditPromptModal } from './components/EditPromptModal';
import { AuthorApplication } from './components/AuthorApplication';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { UserProfileModal } from './components/UserProfileModal';
import { useAuth } from './context/AuthContext';
import { ensureUserProfile } from './firebase/firestore';

/** Syncs Firebase Auth user → Firestore users/{uid} on login */
function UserProfileSync() {
  const { user, isGuest } = useAuth();
  useEffect(() => {
    if (isGuest || !user.id) return;
    ensureUserProfile(user.id, user.displayName).catch(console.error);
  }, [user.id, user.displayName, isGuest]);
  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PromptProvider>
          <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-400 selection:text-zinc-950">

            {/* Sync logged-in user to Firestore */}
            <UserProfileSync />

            {/* Sticky Header */}
            <Header />

            {/* Main interactive content */}
            <main className="flex-1">
              <Hero />
              <Marquee />
              <Filters />
              <PromptGrid />
              <AuthorApplication />
            </main>

            {/* Modals */}
            <CreatePromptModal />
            <PromptDetailModal />
            <AuthModal />
            <AdminLoginModal />
            <ManageCategoriesModal />
            <EditPromptModal />
            <UserProfileModal />

            {/* Professional Footer */}
            <Footer />

          </div>
        </PromptProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
