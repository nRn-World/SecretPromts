import React, { useState } from 'react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Plus, Edit2, Trash2, Check, FolderKanban } from 'lucide-react';

export const ManageCategoriesModal: React.FC = () => {
  const { t, categoryLabel } = useLanguage();
  const { 
    isManageCategoriesOpen, 
    setIsManageCategoriesOpen, 
    categories, 
    addCategory, 
    editCategory, 
    deleteCategory 
  } = usePrompts();

  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  if (!isManageCategoriesOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addCategory(newCatName);
    if (success) {
      setNewCatName('');
    } else {
      alert(t('categoryAddError'));
    }
  };

  const startEdit = (cat: string) => {
    setEditingCat(cat);
    setEditCatName(cat);
  };

  const saveEdit = async (oldCat: string) => {
    const success = await editCategory(oldCat, editCatName);
    if (success) {
      setEditingCat(null);
      setEditCatName('');
    } else {
      alert(t('categoryUpdateError'));
    }
  };

  const handleDelete = async (cat: string) => {
    if (window.confirm(t('categoryDeleteConfirm', { name: categoryLabel(cat) }))) {
      await deleteCategory(cat);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <FolderKanban className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">{t('manageCategoriesHeading')}</h2>
          </div>
          <button
            onClick={() => setIsManageCategoriesOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="block text-xs font-bold text-zinc-300 uppercase">
              {t('createNewCategory')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={t('categoryPlaceholder')}
                className="flex-1 px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t('create')}</span>
              </button>
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="block text-xs font-bold text-zinc-400 uppercase">
              {t('existingCategories')}
            </label>
            
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSystemAll = cat === 'Alla';
                const isEditing = editingCat === cat;

                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2 mr-2">
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="flex-1 px-2 py-1 bg-zinc-900 rounded-lg border border-zinc-700 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(cat)}
                          className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md"
                          title={t('saveChange')}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCat(null)}
                          className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs px-1.5"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-zinc-200">
                        {categoryLabel(cat)}
                      </span>
                    )}

                    {!isSystemAll && !isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
                          title={t('editName')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title={t('deleteCategory')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {isSystemAll && (
                      <span className="text-[10px] text-zinc-500 uppercase font-bold px-2 py-0.5 bg-zinc-900 rounded">
                        {t('system')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
