import React, { useState, useRef } from 'react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { MODELS } from '../data/initialPrompts';
import type { PromptItem } from '../data/initialPrompts';
import { X, Sparkles, Upload, Loader, XCircle } from 'lucide-react';
import { compressImage } from '../firebase/compress';

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:5', '3:4', '2:3', '2:1'];

export const CreatePromptModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, addPrompt, categories, isAdmin, isAuthor, isSaving } = usePrompts();
  const { t, categoryLabel } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState<any>('Midjourney v6');
  const [category, setCategory] = useState('Porträtt');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [images, setImages] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCreateModalOpen || (!isAdmin && !isAuthor)) return null;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - images.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const dataUrls = await Promise.all(files.map(f => compressImage(f)));
      setImages(prev => [...prev, ...dataUrls].slice(0, 3));
    } catch {
      alert('Kunde inte läsa bilden');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) {
      alert(t('requiredTitlePromptError'));
      return;
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

    try {
      setSaveError('');
      const data: Omit<PromptItem, 'id' | 'createdAt'> = {
        title: title.trim(),
        description: description.trim(),
        promptText: promptText.trim(),
        model,
        category,
        aspectRatio,
        imageUrl: images[0] || '',
        images,
        tags: tags.length ? tags : [category]
      };
      if (negativePrompt.trim()) data.negativePrompt = negativePrompt.trim();
      await addPrompt(data);

      setTitle('');
      setDescription('');
      setPromptText('');
      setNegativePrompt('');
      setTagsInput('');
      setImages([]);
      setIsCreateModalOpen(false);
    } catch (err) {
      setSaveError('Kunde inte spara prompten. Kontrollera Firestore-behörigheter i Firebase Console.');
      console.error('Save prompt error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">{t('createPromptTitle')}</h2>
          </div>
          <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('titleLabel')} <span className="text-pink-500">*</span></label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('titlePlaceholder')} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('categoryLabel')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700">
                {categories.filter(c => c !== 'Alla').map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('descriptionLabel')}</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('descriptionPlaceholder')} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('aiModelLabel')} <span className="text-red-400">*</span></label>
              <input list="model-suggestions" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Midjourney, DALL-E, ..." className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
              <datalist id="model-suggestions">
                {MODELS.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('aspectRatioLabel')}</label>
              <div className="flex flex-wrap gap-1.5">
                {ASPECT_RATIOS.map(ar => (
                  <button key={ar} type="button" onClick={() => setAspectRatio(ar)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${aspectRatio === ar ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'}`}>{ar}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-300 uppercase">{t('promptTextLabel')} <span className="text-pink-500">*</span></label>
              <span className="text-[10px] text-amber-400 flex items-center gap-1">💡 {t('promptTextTip')}</span>
            </div>
            <textarea required rows={4} value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder={t('promptTextPlaceholder')} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white font-mono focus:outline-none focus:border-zinc-700" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('negativePromptLongLabel')}</label>
            <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder={t('negativePromptPlaceholder')} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">Bilder (max 3) <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || images.length >= 3} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700 text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-40">
                {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Ladda upp ({images.length}/3)
              </button>
            </div>

            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover bg-zinc-900 border border-zinc-800" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('tagsCommaLabel')}</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Cyberpunk, Neon, 8k, Fotorealism" className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
          </div>

          {saveError && (
            <div className="p-3 bg-red-950/80 border border-red-500/30 rounded-xl text-xs text-red-400 font-medium">
              {saveError}
            </div>
          )}
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800">{t('cancel')}</button>
            <button type="submit" disabled={isSaving || uploading || !model.trim() || images.length === 0} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2">
              {(isSaving || uploading) && <Loader className="w-3 h-3 animate-spin" />}
              {t('savePrompt')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
