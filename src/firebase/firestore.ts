import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, getDoc, writeBatch, setDoc,
  arrayUnion, arrayRemove, increment, where, getDocs, serverTimestamp
} from 'firebase/firestore';
import app from './config';
import type { PromptItem } from '../data/initialPrompts';
import { addMonths } from '../utils/authorApplication';

export const db = getFirestore(app);

const PROMPTS_COL = 'prompts';
const CATEGORIES_DOC = 'config/categories';
const ADMIN_DOC = 'config/admin';
const SEEDED_DOC = 'config/seeded';
const USERS_COL = 'users';
const APPLICATIONS_COL = 'applications';
const BLOCKED_COL = 'blocked';
const ADMIN_NEWS_COL = 'adminNews';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserNotification {
  id: string;
  type: 'like' | 'friend_request_accepted' | 'warning' | 'warning_response' | 'author_granted' | 'admin_news';
  fromUid?: string;
  fromName: string;
  promptTitle?: string;
  createdAt: string;
  read: boolean;
}

export type WarningResponse = 'accepted' | 'rejected';

export const WARNING_RESPONSE_MAX_CHARS = 500;

export interface AdminNews {
  id?: string;
  message: string;
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
}

export type AdminNewsReactionType = 'like' | 'dislike';

export interface Warning {
  id: string;
  message: string;
  createdAt: string;
  /** User accepted or rejected the admin message */
  response?: WarningResponse;
  responseNote?: string;
  respondedAt?: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  friends: string[];
  friendRequests: string[];
  favoriteUsers: string[];
  createdCategories: string[];
  notifications?: UserNotification[];
  isAuthor?: boolean;
  authorExpiresAt?: string | null;
  isBlocked?: boolean;
  warnings?: Warning[];
  authorApplicationCooldownUntil?: string | null;
  lastAuthorApplicationAt?: string | null;
  createdAt: string;
}

export interface AuthorApplication {
  id?: string;
  uid?: string;
  displayName: string;
  contactEmail: string;
  portfolioUrl: string;
  experience: string;
  motivation: string;
  exampleImageUrl: string;
  status: 'pending' | 'accepted' | 'rejected';
  authorPeriod?: '1month' | '5months' | '1year' | 'forever';
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string | null;
}

export type AuthorApplicationBlockReason =
  | 'blocked'
  | 'guest'
  | 'pending'
  | 'cooldown'
  | 'monthly'
  | 'is_author';

export interface AuthorApplicationEligibility {
  canApply: boolean;
  nextAllowedAt?: string;
  reason?: AuthorApplicationBlockReason;
}

export const ensureUserProfile = async (uid: string, displayName: string, email?: string, photoURL?: string) => {
  const ref = doc(db, USERS_COL, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const profile: UserProfile = {
      uid,
      email,
      displayName,
      photoURL: photoURL ?? '',
      bio: '',
      friends: [],
      friendRequests: [],
      favoriteUsers: [],
      createdCategories: [],
      notifications: [],
      isAuthor: false,
      authorExpiresAt: null,
      isBlocked: false,
      warnings: [],
      authorApplicationCooldownUntil: null,
      lastAuthorApplicationAt: null,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, profile);
    return profile;
  }
  const data = snap.data() as UserProfile;
  const updates: Partial<UserProfile> = {};
  if (displayName && data.displayName !== displayName) updates.displayName = displayName;
  if (photoURL && data.photoURL !== photoURL) updates.photoURL = photoURL;
  if (email && data.email !== email) updates.email = email;
  if (Object.keys(updates).length) await updateDoc(ref, updates);
  return { ...data, ...updates };
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, USERS_COL, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const subscribeUserProfile = (uid: string, cb: (p: UserProfile | null) => void) =>
  onSnapshot(doc(db, USERS_COL, uid), (snap) => {
    cb(snap.exists() ? (snap.data() as UserProfile) : null);
  });

export const updateUserBio = async (uid: string, bio: string) => {
  await updateDoc(doc(db, USERS_COL, uid), { bio });
};

export const updateUserPhoto = async (uid: string, photoURL: string) => {
  await updateDoc(doc(db, USERS_COL, uid), { photoURL });
};

// Get prompts created by a specific user
export const getUserPrompts = async (uid: string): Promise<PromptItem[]> => {
  const q = query(collection(db, PROMPTS_COL), where('authorId', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as PromptItem));
};

// ─── Friend / Follow System ────────────────────────────────────────────────────

/** Send a friend request (adds currentUid to target's friendRequests) */
export const sendFriendRequest = async (currentUid: string, targetUid: string) => {
  await updateDoc(doc(db, USERS_COL, targetUid), {
    friendRequests: arrayUnion(currentUid),
  });
};

/** Accept a friend request – bidirectional friendship */
export const acceptFriendRequest = async (currentUid: string, requesterUid: string) => {
  const batch = writeBatch(db);
  batch.update(doc(db, USERS_COL, currentUid), {
    friends: arrayUnion(requesterUid),
    friendRequests: arrayRemove(requesterUid),
  });
  batch.update(doc(db, USERS_COL, requesterUid), {
    friends: arrayUnion(currentUid),
    notifications: arrayUnion({
      id: Math.random().toString(36).substr(2, 9),
      type: 'friend_request_accepted',
      fromUid: currentUid,
      fromName: 'En användare', // Fallback, could fetch name if needed
      createdAt: new Date().toISOString(),
      read: false
    })
  });
  await batch.commit();
};

/** Decline a friend request */
export const declineFriendRequest = async (currentUid: string, requesterUid: string) => {
  await updateDoc(doc(db, USERS_COL, currentUid), {
    friendRequests: arrayRemove(requesterUid),
  });
};

/** Remove / unfriend */
export const removeFriend = async (currentUid: string, targetUid: string) => {
  const batch = writeBatch(db);
  batch.update(doc(db, USERS_COL, currentUid), { friends: arrayRemove(targetUid) });
  batch.update(doc(db, USERS_COL, targetUid), { friends: arrayRemove(currentUid) });
  await batch.commit();
};

/** Toggle "favourite user" (one-way bookmark, not mutual) */
export const toggleFavoriteUser = async (currentUid: string, targetUid: string, isAlreadyFav: boolean) => {
  await updateDoc(doc(db, USERS_COL, currentUid), {
    favoriteUsers: isAlreadyFav ? arrayRemove(targetUid) : arrayUnion(targetUid),
  });
};

/** Mark all notifications as read */
export const markNotificationsRead = async (uid: string, notifications: UserNotification[]) => {
  if (!notifications || notifications.length === 0) return;
  const updated = notifications.map(n => ({ ...n, read: true }));
  await updateDoc(doc(db, USERS_COL, uid), { notifications: updated });
};

// ─── Prompts ──────────────────────────────────────────────────────────────────

export const promptsQuery = query(
  collection(db, PROMPTS_COL),
  orderBy('createdAt', 'desc')
);

export const subscribePrompts = (cb: (items: PromptItem[]) => void) =>
  onSnapshot(promptsQuery, (snap) => {
    cb(snap.docs.map(d => ({ ...d.data(), id: d.id } as PromptItem)));
  }, (error) => {
    console.error('Firestore prompts subscription error:', error);
  });

export const addPrompt = async (data: Omit<PromptItem, 'id'>) => {
  try {
    const ref = await addDoc(collection(db, PROMPTS_COL), data);
    return ref.id;
  } catch (e: any) {
    console.error('Firestore addDoc error:', e.code, e.message, e);
    throw e;
  }
};

export const updatePrompt = async (id: string, data: Partial<PromptItem>) => {
  await updateDoc(doc(db, PROMPTS_COL, id), data);
};

export const deletePrompt = async (id: string) => {
  try {
    await deleteDoc(doc(db, PROMPTS_COL, id));
  } catch (e: any) {
    console.error('Firestore deleteDoc error:', e.code, e.message);
    throw e;
  }
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const subscribeCategories = (cb: (list: string[]) => void) =>
  onSnapshot(doc(db, CATEGORIES_DOC), (snap) => {
    cb(snap.data()?.list ?? []);
  });

export const setCategories = async (list: string[]) => {
  await setDoc(doc(db, CATEGORIES_DOC), { list });
};

export const addCategory = async (name: string, current: string[]) => {
  if (!name.trim() || current.includes(name.trim())) return false;
  await setCategories([...current, name.trim()]);
  return true;
};

export const editCategory = async (oldName: string, newName: string, current: string[], prompts: PromptItem[]) => {
  const trimmed = newName.trim();
  if (!trimmed || oldName === 'Alla') return false;
  if (trimmed !== oldName && current.includes(trimmed)) return false;
  await setCategories(current.map(c => c === oldName ? trimmed : c));
  for (const p of prompts.filter(p => p.category === oldName)) {
    await updatePrompt(p.id!, { category: trimmed });
  }
  return true;
};

export const deleteCategory = async (name: string, current: string[], prompts: PromptItem[]) => {
  if (name === 'Alla') return false;
  const fallback = current.find(c => c !== 'Alla' && c !== name) || 'Porträtt';
  await setCategories(current.filter(c => c !== name));
  for (const p of prompts.filter(p => p.category === name)) {
    await updatePrompt(p.id!, { category: fallback as PromptItem['category'] });
  }
  return true;
};

// ─── Likes ────────────────────────────────────────────────────────────────────

export const toggleLike = async (
  promptId: string, 
  userEmail: string, 
  isLiked: boolean, 
  authorId?: string, 
  promptTitle?: string, 
  likerName?: string,
  fromUid?: string
) => {
  try {
    const ref = doc(db, PROMPTS_COL, promptId);
    if (isLiked) {
      await updateDoc(ref, {
        likedBy: arrayRemove(userEmail),
        likesCount: increment(-1),
      });
    } else {
      await updateDoc(ref, {
        likedBy: arrayUnion(userEmail),
        likesCount: increment(1),
      });
      // Send notification if the author exists and isn't the liker
      if (authorId) {
        const notif: UserNotification = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'like',
          fromUid,
          fromName: likerName || userEmail.split('@')[0],
          promptTitle: promptTitle || 'en prompt',
          createdAt: new Date().toISOString(),
          read: false
        };
        await updateDoc(doc(db, USERS_COL, authorId), {
          notifications: arrayUnion(notif)
        });
      }
    }
    return true;
  } catch (e: any) {
    console.error('Firestore toggleLike error:', e.code, e.message);
    return false;
  }
};

// ─── Applications ──────────────────────────────────────────────────────────────

const latestApplicationForUid = async (uid: string): Promise<AuthorApplication[]> => {
  const q = query(collection(db, APPLICATIONS_COL), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ ...d.data(), id: d.id } as AuthorApplication))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
};

export const checkAuthorApplicationEligibility = async (
  uid: string,
  email: string
): Promise<AuthorApplicationEligibility> => {
  if (!uid) return { canApply: false, reason: 'guest' };
  if (email.toLowerCase() !== 'bynrnworld@gmail.com' && (await isEmailBlocked(email))) {
    return { canApply: false, reason: 'blocked' };
  }
  const profile = await getUserProfile(uid);
  if (profile?.isAuthor) return { canApply: false, reason: 'is_author' };
  return { canApply: true };
};

export const submitApplication = async (data: Omit<AuthorApplication, 'id' | 'createdAt'>) => {
  if (!data.uid) throw new Error('LOGIN_REQUIRED');
  if (!data.exampleImageUrl?.trim()) throw new Error('IMAGE_REQUIRED');

  const eligibility = await checkAuthorApplicationEligibility(data.uid, data.contactEmail);
  if (!eligibility.canApply) {
    const err = new Error(eligibility.reason || 'NOT_ELIGIBLE');
    (err as Error & { eligibility: AuthorApplicationEligibility }).eligibility = eligibility;
    throw err;
  }

  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db, APPLICATIONS_COL), {
    ...data,
    exampleImageUrl: data.exampleImageUrl.trim(),
    createdAt,
    reviewedAt: null,
  });

  await updateDoc(doc(db, USERS_COL, data.uid), {
    lastAuthorApplicationAt: createdAt,
  });

  return ref.id;
};

export const subscribeApplications = (
  cb: (apps: AuthorApplication[]) => void,
  onError?: (error: Error) => void
) =>
  onSnapshot(collection(db, APPLICATIONS_COL), (snap) => {
    const apps = snap.docs.map(d => ({ ...d.data(), id: d.id } as AuthorApplication));
    apps.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    cb(apps);
  }, (error) => {
    console.error('Firestore applications subscription error:', error);
    onError?.(error);
  });

/** Live count of pending "Become an Author" applications (for admin badge). */
export const subscribePendingApplicationCount = (
  cb: (count: number) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, APPLICATIONS_COL), where('status', '==', 'pending'));
  return onSnapshot(q, (snap) => {
    cb(snap.size);
  }, (error) => {
    console.error('Firestore pending applications subscription error:', error);
    onError?.(error);
    cb(0);
  });
};

export const updateApplicationStatus = async (
  id: string,
  status: 'accepted' | 'rejected',
  uid: string | undefined,
  period?: '1month' | '5months' | '1year' | 'forever',
  adminNote?: string
) => {
  const updates: Record<string, any> = {
    status,
    reviewedAt: new Date().toISOString(),
  };
  if (period) updates.authorPeriod = period;
  if (adminNote) updates.adminNote = adminNote;
  await updateDoc(doc(db, APPLICATIONS_COL, id), updates);

  // If accepted, update the user's profile
  if (status === 'accepted' && uid) {
    let expiresAt: string | null = null;
    if (period && period !== 'forever') {
      const now = new Date();
      switch (period) {
        case '1month': now.setMonth(now.getMonth() + 1); break;
        case '5months': now.setMonth(now.getMonth() + 5); break;
        case '1year': now.setFullYear(now.getFullYear() + 1); break;
      }
      expiresAt = now.toISOString();
    }
    await updateDoc(doc(db, USERS_COL, uid), {
      isAuthor: true,
      authorExpiresAt: expiresAt,
      authorApplicationCooldownUntil: null,
      notifications: arrayUnion({
        id: Math.random().toString(36).substr(2, 9),
        type: 'author_granted' as const,
        fromName: 'Admin',
        createdAt: new Date().toISOString(),
        read: false,
      }),
    });
  }

  if (status === 'rejected' && uid) {
    const cooldownUntil = addMonths(new Date(), 1).toISOString();
    await updateDoc(doc(db, USERS_COL, uid), {
      authorApplicationCooldownUntil: cooldownUntil,
    });
  }
};

export const removeAuthorRights = async (uid: string) => {
  await updateDoc(doc(db, USERS_COL, uid), {
    isAuthor: false,
    authorExpiresAt: null,
  });
};

// ─── Blocked Users ────────────────────────────────────────────────────────────

export const blockUser = async (uid: string, email: string, reason?: string) => {
  if (email.toLowerCase() === 'bynrnworld@gmail.com') return; // Don't block admin
  await setDoc(doc(db, BLOCKED_COL, email), {
    email,
    uid,
    reason: reason || '',
    blockedAt: new Date().toISOString(),
  });
  // Mark the user's profile as blocked
  await updateDoc(doc(db, USERS_COL, uid), { isBlocked: true });
};

/** Admin: remove user profile, their prompts, and block email from re-registering easily. */
export const deleteUserAccountAsAdmin = async (uid: string, email?: string) => {
  if (email && email.toLowerCase() === 'bynrnworld@gmail.com') return; // Don't delete admin
  const promptsSnap = await getDocs(
    query(collection(db, PROMPTS_COL), where('authorId', '==', uid))
  );

  const promptDocs = promptsSnap.docs;
  for (let i = 0; i < promptDocs.length; i += 400) {
    const batch = writeBatch(db);
    promptDocs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  const batch = writeBatch(db);
  batch.delete(doc(db, USERS_COL, uid));
  if (email) {
    batch.set(doc(db, BLOCKED_COL, email), {
      email,
      uid,
      reason: 'Account deleted by admin',
      blockedAt: new Date().toISOString(),
    });
  }
  await batch.commit();
};

export const unblockUser = async (email: string, uid?: string) => {
  await deleteDoc(doc(db, BLOCKED_COL, email));
  if (uid) {
    await updateDoc(doc(db, USERS_COL, uid), { isBlocked: false });
  } else {
    // Fallback: try to find user by email
    const q = query(collection(db, USERS_COL), where('email', '==', email));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(doc(db, USERS_COL, d.id), { isBlocked: false });
    }
  }
};

export const isEmailBlocked = async (email: string): Promise<boolean> => {
  if (email.toLowerCase() === 'bynrnworld@gmail.com') return false; // Admin email is never blocked
  const snap = await getDoc(doc(db, BLOCKED_COL, email));
  return snap.exists();
};

export const subscribeBlockedEmails = (cb: (list: any[]) => void) =>
  onSnapshot(query(collection(db, BLOCKED_COL), orderBy('blockedAt', 'desc')), (snap) => {
    cb(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  });

export const subscribeAllUsers = (cb: (users: UserProfile[]) => void) =>
  onSnapshot(query(collection(db, USERS_COL), orderBy('createdAt', 'desc')), (snap) => {
    cb(snap.docs.map(d => ({ ...d.data() } as UserProfile)));
  });

// ─── Warnings ──────────────────────────────────────────────────────────────────

const buildWarning = (message: string): Warning => ({
  id: Math.random().toString(36).slice(2, 11),
  message,
  createdAt: new Date().toISOString(),
});

export const sendWarning = async (uid: string, message: string) => {
  const warning = buildWarning(message);
  await updateDoc(doc(db, USERS_COL, uid), {
    warnings: arrayUnion(warning),
    notifications: arrayUnion({
      id: Math.random().toString(36).slice(2, 11),
      type: 'warning' as const,
      fromName: 'Admin',
      createdAt: new Date().toISOString(),
      read: false,
    }),
  });
};

/** Broadcast admin news to all users (not a warning — users like/dislike, no comments). */
export const sendAdminNewsToAllUsers = async (message: string): Promise<{ newsId: string; count: number }> => {
  const trimmed = message.trim();
  if (!trimmed) return { newsId: '', count: 0 };

  const createdAt = new Date().toISOString();
  const newsRef = await addDoc(collection(db, ADMIN_NEWS_COL), {
    message: trimmed,
    createdAt,
    likeCount: 0,
    dislikeCount: 0,
  });

  const snap = await getDocs(collection(db, USERS_COL));
  let count = 0;
  const chunkSize = 400;
  for (let i = 0; i < snap.docs.length; i += chunkSize) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + chunkSize).forEach((userDoc) => {
      batch.update(userDoc.ref, {
        notifications: arrayUnion({
          id: newsRef.id,
          type: 'admin_news' as const,
          fromName: 'Admin',
          createdAt,
          read: false,
        }),
      });
      count += 1;
    });
    await batch.commit();
  }
  return { newsId: newsRef.id, count };
};

export const subscribeAdminNews = (cb: (items: AdminNews[]) => void) =>
  onSnapshot(query(collection(db, ADMIN_NEWS_COL), orderBy('createdAt', 'desc')), (snap) => {
    cb(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdminNews)));
  });

export const getAdminNews = async (newsId: string): Promise<AdminNews | null> => {
  const snap = await getDoc(doc(db, ADMIN_NEWS_COL, newsId));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as AdminNews) : null;
};

export const getAdminNewsReaction = async (
  newsId: string,
  uid: string
): Promise<AdminNewsReactionType | null> => {
  const snap = await getDoc(doc(db, ADMIN_NEWS_COL, newsId, 'reactions', uid));
  return snap.exists() ? (snap.data().reaction as AdminNewsReactionType) : null;
};

export const reactToAdminNews = async (
  newsId: string,
  uid: string,
  reaction: AdminNewsReactionType
) => {
  const newsRef = doc(db, ADMIN_NEWS_COL, newsId);
  const reactionRef = doc(db, ADMIN_NEWS_COL, newsId, 'reactions', uid);
  const existing = await getDoc(reactionRef);

  if (existing.exists()) {
    const prev = existing.data().reaction as AdminNewsReactionType;
    if (prev === reaction) return;
    await updateDoc(newsRef, {
      likeCount: increment(reaction === 'like' ? 1 : -1),
      dislikeCount: increment(reaction === 'dislike' ? 1 : -1),
    });
    await updateDoc(reactionRef, { reaction, reactedAt: new Date().toISOString() });
    return;
  }

  await setDoc(reactionRef, { reaction, reactedAt: new Date().toISOString() });
  await updateDoc(newsRef, {
    likeCount: increment(reaction === 'like' ? 1 : 0),
    dislikeCount: increment(reaction === 'dislike' ? 1 : 0),
  });
};

export const respondToWarning = async (
  uid: string,
  warningId: string,
  accepted: boolean,
  note?: string
) => {
  const snap = await getDoc(doc(db, USERS_COL, uid));
  const profile = snap.data() as UserProfile | undefined;
  if (!profile?.warnings) return;

  const already = profile.warnings.find(w => w.id === warningId);
  if (already?.response) return;

  const trimmedNote = (note?.trim() || '').slice(0, WARNING_RESPONSE_MAX_CHARS);

  const updatedWarnings = profile.warnings.map(w =>
    w.id === warningId
      ? {
          ...w,
          response: (accepted ? 'accepted' : 'rejected') as WarningResponse,
          responseNote: trimmedNote,
          respondedAt: new Date().toISOString(),
        }
      : w
  );
  await updateDoc(doc(db, USERS_COL, uid), { warnings: updatedWarnings });
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAdminEmail = async (): Promise<string | null> => {
  const snap = await getDoc(doc(db, ADMIN_DOC));
  return snap.data()?.email ?? null;
};

export const setAdminEmail = async (email: string) => {
  await setDoc(doc(db, ADMIN_DOC), { email });
};

export const seedInitialData = async (initialPrompts: PromptItem[], initialCategories: string[]) => {
  const seededSnap = await getDoc(doc(db, SEEDED_DOC));

  if (!seededSnap.exists()) {
    const batch = writeBatch(db);
    for (const p of initialPrompts) {
      batch.set(doc(db, PROMPTS_COL, p.id), p);
    }
    batch.set(doc(db, CATEGORIES_DOC), { list: initialCategories });
    batch.set(doc(db, ADMIN_DOC), { email: 'bynrnworld@gmail.com' });
    batch.set(doc(db, SEEDED_DOC), { seeded: true, at: new Date().toISOString() });
    await batch.commit();
  } else {
    const catSnap = await getDoc(doc(db, CATEGORIES_DOC));
    const existing = catSnap.data()?.list ?? [];
    const merged = Array.from(new Set([...existing, ...initialCategories]));
    if (merged.length !== existing.length || merged.some((c, i) => c !== existing[i])) {
      await setDoc(doc(db, CATEGORIES_DOC), { list: merged });
    }
  }

  const adminSnap = await getDoc(doc(db, ADMIN_DOC));
  if (!adminSnap.exists()) {
    await setDoc(doc(db, ADMIN_DOC), { email: 'bynrnworld@gmail.com' });
  }
};