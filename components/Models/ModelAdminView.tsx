import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { deleteModel, fetchModelCatalog, normalizeSlug, seedModelCatalogDefaults, upsertModel, type ModelCatalogForm } from '../../services/modelCatalog';
import { uploadAsset } from '../../services/supabase';
import type { ModelCatalogItem, ModelOutputType } from '../../types';

interface ModelAdminViewProps {
  onBackToCatalog?: () => void;
}

const IMAGE_MODULES = [
  { value: 'nano-banana-gen', label: 'Nano Banana Gen' },
  { value: 'nano-banana-edit', label: 'Nano Banana Edit' },
  { value: 'nano-banana-pro', label: 'Nano Banana Pro' },
  { value: 'qwen-text-to-image', label: 'Qwen Text to Image' },
  { value: 'qwen-image-to-image', label: 'Qwen Image to Image' },
  { value: 'z-image', label: 'Z-Image Gen' },
  { value: 'flux2-pro-text', label: 'Flux 2 Pro Text' },
  { value: 'flux2-pro-image', label: 'Flux 2 Pro Image' },
  { value: 'flux2-flex-text', label: 'Flux 2 Flex Text' },
  { value: 'flux2-flex-image', label: 'Flux 2 Flex Image' },
  { value: 'grok-text-to-image', label: 'Grok Text to Image' },
  { value: 'grok-image-to-image', label: 'Grok Image to Image' },
  { value: 'grok-upscale', label: 'Grok Upscale' },
];

const VIDEO_MODULES = [
  { value: 'motion-control', label: 'Kling Motion Control' },
  { value: 'sora2-characters', label: 'Sora 2 Characters' },
  { value: 'sora2-text-to-video', label: 'Sora 2 Text to Video' },
  { value: 'sora2-image-to-video', label: 'Sora 2 Image to Video' },
  { value: 'sora2-pro-text-to-video', label: 'Sora 2 Pro Text to Video' },
  { value: 'sora2-pro-image-to-video', label: 'Sora 2 Pro Image to Video' },
  { value: 'veo3-text-to-video', label: 'Veo 3.1 Text to Video' },
  { value: 'veo3-image-to-video', label: 'Veo 3.1 Image to Video' },
  { value: 'veo3-reference-to-video', label: 'Veo 3.1 Reference to Video' },
  { value: 'grok-image-to-video', label: 'Grok Image to Video' },
];

const EMPTY_FORM: ModelCatalogForm = {
  name: '',
  slug: '',
  family: '',
  provider: '',
  apiModel: '',
  appModule: '',
  modelType: 'image',
  shortDescription: '',
  pricePerOutput: 0,
  priceCurrency: 'CREDITS',
  priceUnit: 'per_output',
  thumbnailUrl: '',
  sampleUrls: [],
  capabilities: { textToImage: false, imageToImage: false, upscale: false },
  active: true,
  displayOrder: 0,
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = (value?: string) => !!value && UUID_REGEX.test(value);

const ModelAdminView: React.FC<ModelAdminViewProps> = ({ onBackToCatalog }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState<ModelCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [form, setForm] = useState<ModelCatalogForm>(EMPTY_FORM);

  const moduleOptions = useMemo(() => {
    if (form.modelType === 'video') return VIDEO_MODULES;
    if (form.modelType === 'text') return [];
    return IMAGE_MODULES;
  }, [form.modelType]);

  const loadModels = async () => {
    setLoading(true);
    try {
      await seedModelCatalogDefaults();
    } catch (error) {
      console.warn('Model catalog seed skipped:', error);
    }
    const data = await fetchModelCatalog();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadModels();
  }, []);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async () => {
    if (!form.name || !form.family || !form.apiModel || !form.appModule) {
      setStatus({ type: 'error', message: 'Name, family, API model, and app module are required.' });
      return;
    }

    const nextSlug = normalizeSlug(form.slug || form.name);
    const payload = { ...form, slug: nextSlug, priceCurrency: 'CREDITS' };

    try {
      setSaving(true);
      const saved = await upsertModel(payload);
      setStatus({ type: 'success', message: `Saved ${saved.name}` });
      setItems((prev) => {
        const exists = prev.find((item) => item.id === saved.id);
        if (exists) {
          return prev.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...prev];
      });
      setForm((prev) => ({ ...prev, id: saved.id, slug: saved.slug }));
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message || 'Failed to save model.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ModelCatalogItem) => {
    const ok = window.confirm(`Delete ${item.name}?`);
    if (!ok) return;
    const success = await deleteModel(item.id);
    if (success) {
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      if (form.id === item.id) resetForm();
      setStatus({ type: 'success', message: 'Model removed.' });
    } else {
      setStatus({ type: 'error', message: 'Delete failed.' });
    }
  };

  const handleUpload = async (file?: File, type: 'thumbnail' | 'sample') => {
    if (!file) return;
    try {
      setSaving(true);
      const url = await uploadAsset(file);
      if (type === 'thumbnail') {
        setForm((prev) => ({ ...prev, thumbnailUrl: url }));
      } else {
        setForm((prev) => ({ ...prev, sampleUrls: [...(prev.sampleUrls || []), url] }));
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message || 'Upload failed.' });
    } finally {
      setSaving(false);
    }
  };

  const statusClasses = status
    ? status.type === 'success'
      ? isDark
        ? 'border-emerald-500/40 text-emerald-300'
        : 'border-emerald-500/50 text-emerald-600'
      : status.type === 'error'
      ? isDark
        ? 'border-red-500/40 text-red-300'
        : 'border-red-500/50 text-red-600'
      : isDark
      ? 'border-zinc-700 text-zinc-400'
      : 'border-zinc-300 text-zinc-600'
    : '';

  return (
    <div className={`min-h-[calc(100vh-4rem)] p-6 ${isDark ? 'bg-zinc-950 text-zinc-200' : 'bg-zinc-50 text-zinc-900'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className={`text-xs uppercase tracking-[0.3em] ${isDark ? 'text-orange-300/70' : 'text-orange-600/80'}`}>
              Admin
            </div>
            <h2 className="text-2xl font-semibold">Model Catalog Manager</h2>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
              Upload samples, set credits per output, and control visibility.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onBackToCatalog && (
              <button
                onClick={onBackToCatalog}
                className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${
                  isDark
                    ? 'border-zinc-700 text-zinc-300 hover:border-orange-400 hover:text-orange-300'
                    : 'border-zinc-300 text-zinc-600 hover:border-orange-400 hover:text-orange-600'
                }`}
              >
                Back to Catalog
              </button>
            )}
            <button
              onClick={resetForm}
              className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${
                isDark
                  ? 'border-zinc-700 text-zinc-300 hover:border-orange-400 hover:text-orange-300'
                  : 'border-zinc-300 text-zinc-600 hover:border-orange-400 hover:text-orange-600'
              }`}
            >
              New Model
            </button>
          </div>
        </div>

        {status && (
          <div className={`border px-4 py-3 text-xs ${statusClasses}`}>{status.message}</div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <div className={`rounded-2xl border p-5 ${isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white'}`}>
            <div className="space-y-4">
              <h3 className={`text-sm uppercase tracking-[0.3em] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Model Details
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs uppercase tracking-[0.2em]">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={`px-3 py-2 text-sm border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs uppercase tracking-[0.2em]">Family</label>
                <input
                  value={form.family}
                  onChange={(e) => setForm((prev) => ({ ...prev, family: e.target.value }))}
                  className={`px-3 py-2 text-sm border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs uppercase tracking-[0.2em]">Provider</label>
                <input
                  value={form.provider}
                  onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
                  className={`px-3 py-2 text-sm border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs uppercase tracking-[0.2em]">API Model Key</label>
                <input
                  value={form.apiModel}
                  onChange={(e) => setForm((prev) => ({ ...prev, apiModel: e.target.value }))}
                  className={`px-3 py-2 text-sm border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs uppercase tracking-[0.2em]">Model Type</label>
                <select
                  value={form.modelType}
                  onChange={(e) => {
                    const nextType = e.target.value as ModelOutputType;
                    setForm((prev) => ({
                      ...prev,
                      modelType: nextType,
                      appModule: nextType === 'text' ? '' : prev.appModule,
                    }));
                  }}
                  className={`px-3 py-2 text-sm border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="text">Text</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs uppercase tracking-[0.2em]">App Module</label>
                <select
                  value={form.appModule}
                  onChange={(e) => setForm((prev) => ({ ...prev, appModule: e.target.value }))}
                  className={`px-3 py-2 text-sm border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                >
                  <option value="">Select module</option>
                  {moduleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs uppercase tracking-[0.2em]">Short Description</label>
                <textarea
                  value={form.shortDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  className={`px-3 py-2 text-sm border h-20 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em]">Credits</label>
                  <input
                    type="number"
                    value={form.pricePerOutput ?? 0}
                    onChange={(e) => setForm((prev) => ({ ...prev, pricePerOutput: Number(e.target.value) }))}
                    className={`px-3 py-2 text-sm border w-full ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em]">Pricing Unit</label>
                  <select
                    value={form.priceUnit || 'per_output'}
                    onChange={(e) => setForm((prev) => ({ ...prev, priceUnit: e.target.value as 'per_output' | 'per_second' }))}
                    className={`px-3 py-2 text-sm border w-full ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                  >
                    <option value="per_output">Per Output</option>
                    <option value="per_second">Per Second</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em]">Display Order</label>
                  <input
                    type="number"
                    value={form.displayOrder ?? 0}
                    onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))}
                    className={`px-3 py-2 text-sm border w-full ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em]">Active</label>
                  <select
                    value={form.active ? 'true' : 'false'}
                    onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.value === 'true' }))}
                    className={`px-3 py-2 text-sm border w-full ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em]">Capabilities</label>
                <div className="flex flex-wrap gap-3">
                  {([
                    { id: 'textToImage', label: 'Text to Image' },
                    { id: 'imageToImage', label: 'Image to Image' },
                    { id: 'upscale', label: 'Upscale' },
                    { id: 'textToVideo', label: 'Text to Video' },
                    { id: 'imageToVideo', label: 'Image to Video' },
                  ] as const).map((cap) => (
                    <label key={cap.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!!form.capabilities?.[cap.id]}
                        onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          capabilities: { ...prev.capabilities, [cap.id]: e.target.checked },
                          priceUnit: prev.priceUnit || 'per_output',
                        }))
                      }
                      />
                      {cap.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.2em]">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0], 'thumbnail')}
                  className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                />
                {form.thumbnailUrl && (
                  <img src={form.thumbnailUrl} alt="Thumbnail" className="w-full h-32 object-cover rounded-xl" />
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.2em]">Sample Images</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0], 'sample')}
                  className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                />
                {form.sampleUrls && form.sampleUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.sampleUrls.map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative">
                        <img src={url} alt="Sample" className="w-full h-20 object-cover rounded-lg" />
                        <button
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              sampleUrls: (prev.sampleUrls || []).filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 bg-black/70 text-white rounded"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full px-4 py-3 text-xs uppercase tracking-[0.25em] rounded-full transition-colors ${
                  isDark
                    ? 'bg-orange-500/80 text-black hover:bg-orange-400'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Saving...' : 'Save Model'}
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm uppercase tracking-[0.3em] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Catalog List
              </h3>
              <button
                onClick={loadModels}
                className={`text-xs uppercase tracking-[0.2em] border px-3 py-2 ${
                  isDark
                    ? 'border-zinc-700 text-zinc-400 hover:border-orange-400 hover:text-orange-300'
                    : 'border-zinc-300 text-zinc-600 hover:border-orange-400 hover:text-orange-600'
                }`}
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Loading...</div>
            ) : items.length === 0 ? (
              <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>No models yet.</div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-xl p-3 ${
                      isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] uppercase text-zinc-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.name}</div>
                        <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{item.apiModel}</div>
                        <div className={`text-[10px] uppercase tracking-[0.3em] ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
                          {item.modelType} - {item.family}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setForm({
                          id: isValidUuid(item.id) ? item.id : undefined,
                          slug: item.slug,
                          name: item.name,
                          family: item.family,
                          provider: item.provider,
                          apiModel: item.apiModel,
                          appModule: item.appModule,
                          modelType: item.modelType,
                          shortDescription: item.shortDescription || '',
                          pricePerOutput: item.pricePerOutput || 0,
                          priceCurrency: item.priceCurrency || 'CREDITS',
                          priceUnit: item.priceUnit || 'per_output',
                          thumbnailUrl: item.thumbnailUrl || '',
                          sampleUrls: item.sampleUrls || [],
                          capabilities: item.capabilities || {},
                          active: item.active ?? true,
                          displayOrder: item.displayOrder || 0,
                        })}
                        className={`text-xs uppercase tracking-[0.2em] border px-3 py-2 ${
                          isDark
                            ? 'border-zinc-700 text-zinc-400 hover:border-orange-400 hover:text-orange-300'
                            : 'border-zinc-300 text-zinc-600 hover:border-orange-400 hover:text-orange-600'
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className={`text-xs uppercase tracking-[0.2em] border px-3 py-2 ${
                          isDark
                            ? 'border-red-500/40 text-red-300 hover:border-red-400'
                            : 'border-red-500/40 text-red-600 hover:border-red-500'
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelAdminView;
