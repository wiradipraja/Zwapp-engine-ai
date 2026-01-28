import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  fetchUserOutputs,
  updateOutputFeatured,
  deleteOutput,
  downloadOutput,
  type SavedOutput,
} from '../../services/outputSaving';

type FilterType = 'all' | 'image' | 'video';

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString();
};

const GalleryView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState<SavedOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [query, setQuery] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const loadGallery = async () => {
    setLoading(true);
    const data = await fetchUserOutputs(200, 0);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (featuredOnly && !item.featured) return false;
      if (filter !== 'all' && item.outputType !== filter) return false;
      if (query.trim()) {
        const needle = query.toLowerCase();
        const haystack = `${item.prompt || ''} ${item.model || ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, filter, featuredOnly, query]);

  const toggleFeatured = async (item: SavedOutput) => {
    const next = !item.featured;
    const featuredOrder = next ? Date.now() : 0;
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, featured: next, featuredOrder } : entry
      )
    );
    const ok = await updateOutputFeatured(item.id, next, featuredOrder);
    if (!ok) {
      // rollback on failure
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, featured: item.featured, featuredOrder: item.featuredOrder } : entry
        )
      );
    }
  };

  const handleDelete = async (item: SavedOutput) => {
    const okConfirm = window.confirm('Delete this output from gallery?');
    if (!okConfirm) return;
    const ok = await deleteOutput(item.id);
    if (ok) {
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    }
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] p-6 ${isDark ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 animate-pulse" />
              <span className={`text-xs font-mono tracking-widest ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                GALLERY ARCHIVE
              </span>
            </div>
            <h2 className={`text-2xl font-bold tracking-wider ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              OUTPUT GALLERY
            </h2>
            <p className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
              All generated outputs saved to Supabase. Mark featured items to show on landing page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'image', 'video'] as FilterType[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-2 text-xs font-mono border transition-all ${
                  filter === mode
                    ? isDark
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-orange-500 bg-orange-50 text-orange-600'
                    : isDark
                    ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    : 'border-zinc-300 text-zinc-600 hover:border-zinc-400'
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => setFeaturedOnly((prev) => !prev)}
              className={`px-3 py-2 text-xs font-mono border transition-all ${
                featuredOnly
                  ? isDark
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  : isDark
                  ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  : 'border-zinc-300 text-zinc-600 hover:border-zinc-400'
              }`}
            >
              FEATURED
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompt / model..."
            className={`w-full md:max-w-md px-3 py-2 text-sm border font-mono ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-200 placeholder-zinc-600'
                : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400'
            }`}
          />
          <button
            onClick={loadGallery}
            className={`px-3 py-2 text-xs font-mono border ${
              isDark
                ? 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'
            }`}
          >
            REFRESH
          </button>
        </div>

        {loading ? (
          <div className="text-xs font-mono text-zinc-500">Loading gallery...</div>
        ) : filtered.length === 0 ? (
          <div className="text-xs font-mono text-zinc-500">No outputs found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`border p-3 relative ${isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white'}`}
              >
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleFeatured(item)}
                    className={`text-[10px] px-2 py-1 border font-mono ${
                      item.featured
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                        : isDark
                        ? 'border-zinc-700 text-zinc-400'
                        : 'border-zinc-300 text-zinc-500'
                    }`}
                  >
                    {item.featured ? 'FEATURED' : 'FEATURE'}
                  </button>
                </div>

                <div className="border border-zinc-800 bg-black/40 mb-3">
                  {item.outputType === 'video' ? (
                    <video
                      src={item.outputUrl}
                      className="w-full aspect-video object-contain"
                      muted
                      loop
                      playsInline
                      controls
                    />
                  ) : item.outputType === 'text' ? (
                    <div className="p-4 text-[10px] font-mono text-zinc-300 whitespace-pre-wrap">
                      {item.metadata?.text || item.prompt || 'Text output'}
                    </div>
                  ) : (
                    <img src={item.outputUrl} alt={item.prompt} className="w-full h-48 object-contain bg-black" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-zinc-500">
                    {item.outputType?.toUpperCase()} • {formatDate(item.createdAt)}
                  </div>
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    {item.model}
                  </div>
                  {item.prompt && (
                    <div className={`text-[10px] font-mono line-clamp-3 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {item.prompt}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={item.outputUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-[10px] font-mono underline ${
                      isDark ? 'text-orange-400' : 'text-orange-600'
                    }`}
                  >
                    OPEN
                  </a>
                  <button
                    onClick={() => downloadOutput(item.outputUrl, `${item.model}-${item.id}`)}
                    className={`text-[10px] font-mono ${
                      isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    DOWNLOAD
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className={`text-[10px] font-mono ${
                      isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'
                    }`}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryView;
