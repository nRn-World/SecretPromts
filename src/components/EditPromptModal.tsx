import React, { useState, useEffect, useRef } from 'react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { MODELS } from '../data/initialPrompts';
import type { PromptItem } from '../data/initialPrompts';
import { X, Edit, Upload, Loader, XCircle } from 'lucide-react';
import { compressImage } from '../firebase/compress';

export const EditPromptModal: React.FC = () => {
  const { editingPrompt, setEditingPrompt, updatePrompt, categories } = usePrompts();
  const { t, categoryLabel } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState<any>('Midjourney v6');
  const [category, setCategory] = useState('Porträtt');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPrompt) {
      setTitle(editingPrompt.title);
      setDescription(editingPrompt.description || '');
      setPromptText(editingPrompt.promptText);
      setNegativePrompt(editingPrompt.negativePrompt || '');
      setModel(editingPrompt.model);
      setCategory(editingPrompt.category);
      setImageUrl(editingPrompt.imageUrl);
      setImages(editingPrompt.images || [editingPrompt.imageUrl]);
      setTagsInput(editingPrompt.tags ? editingPrompt.tags.join(', ') : '');
    }
  }, [editingPrompt]);

  if (!editingPrompt) return null;

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
      alert(t('editPromptRequiredError'));
      return;
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const data: Partial<PromptItem> = {
      title: title.trim(),
      description: description.trim(),
      promptText: promptText.trim(),
      model,
      category,
      imageUrl: images[0] || '',
      images,
      tags: tags.length ? tags : editingPrompt.tags
    };
    if (negativePrompt.trim()) data.negativePrompt = negativePrompt.trim();
    await updatePrompt(editingPrompt.id, data);

    setEditingPrompt(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Edit className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">{t('editPromptHeading')}</h2>
          </div>
          <button onClick={() => setEditingPrompt(null)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('titleLabel')} <span className="text-pink-500">*</span></label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
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
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('aiModelLabel')} <span className="text-red-400">*</span></label>
              <input list="model-suggestions" value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
              <datalist id="model-suggestions">
                {MODELS.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('tagsCommaLabel')}</label>
              <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('promptTextLabel')} <span className="text-pink-500">*</span></label>
            <textarea required rows={4} value={promptText} onChange={(e) => setPromptText(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white font-mono focus:outline-none focus:border-zinc-700" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('negativePromptLabel')}</label>
            <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">Bilder (max 3)</label>
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
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-600 text-white transition-all hover:scale-110">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button type="button" onClick={() => setEditingPrompt(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800">{t('cancel')}</button>
            <button type="submit" disabled={uploading || !model.trim()} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg disabled:opacity-50">{t('saveChanges')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
