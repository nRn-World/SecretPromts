import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, getDoc, writeBatch, setDoc,
  arrayUnion, arrayRemove, increment, where, getDocs
} from 'firebase/firestore';
import app from './config';
import type { PromptItem } from '../data/initialPrompts';

export const db = getFirestore(app);

const PROMPTS_COL = 'prompts';
const CATEGORIES_DOC = 'config/categories';
const ADMIN_DOC = 'config/admin';
const SEEDED_DOC = 'config/seeded';
const USERS_COL = 'users';

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserNotification {
  id: string;
  type: 'like' | 'friend_request_accepted';
  fromUid?: string;
  fromName: string;
  promptTitle?: string;
  createdAt: string;
  read: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  friends: string[];       // uids of friends
  friendRequests: string[]; // uids who sent requests
  favoriteUsers: string[]; // uids marked as favourite
  createdCategories: string[];
  notifications?: UserNotification[];
  createdAt: string;
}

export const ensureUserProfile = async (uid: string, displayName: string, photoURL?: string) => {
  const ref = doc(db, USERS_COL, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const profile: UserProfile = {
      uid,
      displayName,
      photoURL: photoURL ?? '',
      bio: '',
      friends: [],
      friendRequests: [],
      favoriteUsers: [],
      createdCategories: [],
      notifications: [],
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, profile);
    return profile;
  }
  // Update displayName / photo if changed
  const data = snap.data() as UserProfile;
  const updates: Partial<UserProfile> = {};
  if (displayName && data.displayName !== displayName) updates.displayName = displayName;
  if (photoURL && data.photoURL !== photoURL) updates.photoURL = photoURL;
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
  likerName?: string
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
    batch.set(doc(db, ADMIN_DOC), { email: 'admin@admin.com' });
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
    await setDoc(doc(db, ADMIN_DOC), { email: 'admin@admin.com' });
  }
};
