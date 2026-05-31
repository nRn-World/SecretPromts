import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { PromptItem, INITIAL_PROMPTS, CATEGORIES as INITIAL_CATEGORIES } from '../data/initialPrompts';
import {
  subscribePrompts, addPrompt as addPromptFS, updatePrompt as updatePromptFS,
  deletePrompt as deletePromptFS, subscribeCategories,
  addCategory as addCategoryFS, editCategory as editCategoryFS,
  deleteCategory as deleteCategoryFS, seedInitialData,
  toggleLike as toggleLikeFS,
} from '../firebase/firestore';
import { useAuth } from './AuthContext';

interface PromptContextType {
  prompts: PromptItem[];
  addPrompt: (promptData: Omit<PromptItem, 'id' | 'createdAt'>) => void;
  updatePrompt: (id: string, promptData: Partial<PromptItem>) => void;
  deletePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleLike: (id: string) => void;
  incrementView: (id: string) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  sortBy: 'newest' | 'oldest' | 'title' | 'popular' | 'likes';
  setSortBy: (sort: 'newest' | 'oldest' | 'title' | 'popular' | 'likes') => void;

  activeTab: 'all' | 'favorites' | 'my-creations';
  setActiveTab: (tab: 'all' | 'favorites' | 'my-creations') => void;

  filteredPrompts: PromptItem[];
  allTags: string[];

  exportPrompts: () => void;
  importPrompts: (jsonString: string) => boolean;

  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;

  selectedPromptForDetail: PromptItem | null;
  setSelectedPromptForDetail: (prompt: PromptItem | null) => void;

  isAdmin: boolean;
  isAuthor: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;

  categories: string[];
  addCategory: (name: string) => Promise<boolean>;
  editCategory: (oldName: string, newName: string) => Promise<boolean>;
  deleteCategory: (name: string) => Promise<boolean>;

  editingPrompt: PromptItem | null;
  setEditingPrompt: (prompt: PromptItem | null) => void;

  isManageCategoriesOpen: boolean;
  setIsManageCategoriesOpen: (isOpen: boolean) => void;

  isAdminLoginOpen: boolean;
  setIsAdminLoginOpen: (isOpen: boolean) => void;

  isSaving: boolean;

  selectedProfileUid: string | null;
  openUserProfile: (uid: string) => void;
  closeUserProfile: () => void;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, isAuthor } = useAuth();

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [categories, setCategoriesState] = useState<string[]>([]);
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alla');
  const [selectedModel, setSelectedModel] = useState('Alla');
  const [selectedTag, setSelectedTag] = useState('Alla');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'popular' | 'likes'>('newest');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'my-creations'>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPromptForDetail, setSelectedPromptForDetail] = useState<PromptItem | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);

  const openUserProfile = (uid: string) => setSelectedProfileUid(uid);
  const closeUserProfile = () => setSelectedProfileUid(null);

  useEffect(() => {
    seedInitialData(INITIAL_PROMPTS, [...INITIAL_CATEGORIES]);
  }, []);

  useEffect(() => {
    const unsub = subscribePrompts((items) => {
      setPrompts(items.map(p => ({
        ...p,
        isFavorite: localFavorites.has(p.id),
        isLiked: userLikes.has(p.id),
        likesCount: p.likesCount ?? 0,
        viewCount: viewCounts[p.id] ?? p.viewCount ?? 0,
      })));
    });
    return unsub;
  }, [localFavorites, userLikes, viewCounts]);

  useEffect(() => {
    const unsub = subscribeCategories((list) => {
      setCategoriesState(list);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setPrompts(prev => prev.map(p => ({
      ...p,
      isFavorite: localFavorites.has(p.id),
      isLiked: userLikes.has(p.id),
    })));
  }, [localFavorites, userLikes]);

  useEffect(() => {
    if (user.isGuest && activeTab !== 'all') {
      setActiveTab('all');
    }
  }, [user.isGuest, activeTab]);

  useEffect(() => {
    const saved = localStorage.getItem('secret_prompts_favorites_v3');
    if (saved) {
      try {
        setLocalFavorites(new Set(JSON.parse(saved)));
      } catch {}
    }
    const savedLikes = localStorage.getItem('secret_prompts_likes_v1');
    if (savedLikes) {
      try {
        setUserLikes(new Set(JSON.parse(savedLikes)));
      } catch {}
    }
    const savedViews = localStorage.getItem('secret_prompts_views_v1');
    if (savedViews) {
      try { setViewCounts(JSON.parse(savedViews)); } catch {}
    }
  }, []);

  const incrementView = (id: string) => {
    setViewCounts(prev => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + 1 };
      localStorage.setItem('secret_prompts_views_v1', JSON.stringify(next));
      return next;
    });
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, viewCount: (p.viewCount ?? 0) + 1 } : p
    ));
    if (selectedPromptForDetail?.id === id) {
      setSelectedPromptForDetail(prev => prev ? { ...prev, viewCount: (prev.viewCount ?? 0) + 1 } : null);
    }
  };

  const addPrompt = async (promptData: Omit<PromptItem, 'id' | 'createdAt'>) => {
    setIsSaving(true);
    const data: Omit<PromptItem, 'id'> = {
      ...promptData,
      createdAt: new Date().toISOString().split('T')[0],
      isCustom: true,
      variables: promptData.variables?.length ? promptData.variables : extractVariables(promptData.promptText),
      authorId: user.isGuest ? undefined : user.id,
      authorName: user.isGuest ? undefined : user.displayName,
    };
    await addPromptFS(data);
    setIsSaving(false);
  };

  const updatePrompt = async (id: string, promptData: Partial<PromptItem>) => {
    const data = { ...promptData };
    if (data.promptText) {
      data.variables = extractVariables(data.promptText);
    }
    await updatePromptFS(id, data);
    if (selectedPromptForDetail?.id === id) {
      setSelectedPromptForDetail(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const deletePrompt = async (id: string) => {
    await deletePromptFS(id);
    if (selectedPromptForDetail?.id === id) {
      setSelectedPromptForDetail(null);
    }
  };

  const toggleFavorite = (id: string) => {
    setLocalFavorites(prev => {
      const next = new Set(prev);
      const wasFav = next.has(id);
      if (wasFav) next.delete(id);
      else next.add(id);
      localStorage.setItem('secret_prompts_favorites_v3', JSON.stringify([...next]));
      // Sync selectedPromptForDetail
      if (selectedPromptForDetail?.id === id) {
        setSelectedPromptForDetail(prev => prev ? { ...prev, isFavorite: !wasFav } : null);
      }
      return next;
    });
  };

  const toggleLike = (id: string) => {
    const wasLiked = userLikes.has(id);
    setUserLikes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('secret_prompts_likes_v1', JSON.stringify([...next]));
      return next;
    });
    // Sync selectedPromptForDetail
    if (selectedPromptForDetail?.id === id) {
      setSelectedPromptForDetail(prev => prev ? {
        ...prev,
        isLiked: !wasLiked,
        likesCount: (prev.likesCount ?? 0) + (wasLiked ? -1 : 1)
      } : null);
    }
    // Update likesCount optimistically in prompts
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, likesCount: (p.likesCount ?? 0) + (wasLiked ? -1 : 1), isLiked: !wasLiked } : p
    ));
    // Sync to Firestore if authenticated
    if (user.email && !user.isGuest) {
      const prompt = prompts.find(p => p.id === id);
      toggleLikeFS(
        id, 
        user.email, 
        wasLiked, 
        prompt?.authorId, 
        prompt?.title, 
        user.displayName,
        user.id
      );
    }
  };

  const extractVariables = (text: string) => {
    const regex = /\[([^\]]+)\]/g;
    const matches = [];
    let match;
    const seen = new Set<string>();
    while ((match = regex.exec(text)) !== null) {
      const varName = match[1];
      if (!seen.has(varName)) {
        seen.add(varName);
        matches.push({ name: varName, defaultValue: '', description: `Värde för ${varName}` });
      }
    }
    return matches;
  };

  const loginAdmin = (_password: string) => false;
  const logoutAdmin = () => {};

  const addCategory = async (name: string) => {
    return addCategoryFS(name, categories);
  };

  const editCategory = async (oldName: string, newName: string) => {
    return editCategoryFS(oldName, newName, categories, prompts);
  };

  const deleteCategory = async (name: string) => {
    return deleteCategoryFS(name, categories, prompts);
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    prompts.forEach(p => p.tags?.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      if (activeTab === 'favorites' && !p.isFavorite) return false;
      if (activeTab === 'my-creations' && (!p.isCustom || (p.authorId && p.authorId !== user.id))) return false;
      if (selectedCategory !== 'Alla' && p.category !== selectedCategory) return false;
      if (selectedModel !== 'Alla' && p.model !== selectedModel) return false;
      if (selectedTag !== 'Alla' && !p.tags.includes(selectedTag)) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesPrompt = p.promptText.toLowerCase().includes(q);
        const matchesTags = p.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesPrompt && !matchesTags) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      else if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortBy === 'popular') return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      else if (sortBy === 'likes') return (b.likesCount ?? 0) - (a.likesCount ?? 0);
      else return a.title.localeCompare(b.title);
    });
  }, [prompts, searchQuery, selectedCategory, selectedModel, selectedTag, sortBy, activeTab]);

  const exportPrompts = () => {
    const dataStr = JSON.stringify({ prompts, categories }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `secret-prompts-backup-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importPrompts = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      let importedPrompts: PromptItem[] = [];
      let importedCategories: string[] = [];

      if (Array.isArray(parsed)) {
        importedPrompts = parsed;
      } else if (parsed && Array.isArray(parsed.prompts)) {
        importedPrompts = parsed.prompts;
        if (Array.isArray(parsed.categories)) importedCategories = parsed.categories;
      }

      const validItems = importedPrompts.filter(item => item.id && item.title && item.promptText && item.imageUrl);
      if (validItems.length > 0) {
        const merged = Array.from(new Set(['Alla', ...importedCategories, ...categories]));
        setCategoriesState(merged);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <PromptContext.Provider
      value={{
        prompts, addPrompt, updatePrompt, deletePrompt, toggleFavorite, toggleLike, incrementView,
        searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
        selectedModel, setSelectedModel, selectedTag, setSelectedTag,
        sortBy, setSortBy, activeTab, setActiveTab,
        filteredPrompts, allTags, exportPrompts, importPrompts,
        isCreateModalOpen, setIsCreateModalOpen,
        selectedPromptForDetail, setSelectedPromptForDetail,
        isAdmin, isAuthor, loginAdmin, logoutAdmin,
        categories, addCategory, editCategory, deleteCategory,
        editingPrompt, setEditingPrompt,
        isManageCategoriesOpen, setIsManageCategoriesOpen,
        isAdminLoginOpen, setIsAdminLoginOpen,
        isSaving,
        selectedProfileUid, openUserProfile, closeUserProfile,
      }}
    >
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompts = () => {
  const context = useContext(PromptContext);
  if (!context) throw new Error('usePrompts must be used within a PromptProvider');
  return context;
};
