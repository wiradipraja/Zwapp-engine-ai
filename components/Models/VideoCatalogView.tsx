import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchModelCatalog } from '../../services/modelCatalog';
import type { ModelCatalogItem } from '../../types';
import type { ModuleType } from '../layout/Sidebar';

interface VideoCatalogViewProps {
  onSelectModule: (module: ModuleType) => void;
  onOpenAdmin?: () => void;
}

type FilterMode = 'all' | 'text' | 'image';

const formatCredits = (price?: number, unit?: ModelCatalogItem['priceUnit']) => {
  if (price === undefined || price === null) return 'Custom';
  const numeric = Number(price);
  if (Number.isNaN(numeric)) return 'Custom';
  return `${numeric.toLocaleString('en-US')} credits${unit === 'per_second' ? ' / sec' : ''}`;
};

const getCapabilityBadges = (item: ModelCatalogItem) => {
  const caps = item.capabilities || {};
  const badges: string[] = [];
  if (caps.textToVideo) badges.push('Text to Video');
  if (caps.imageToVideo) badges.push('Image to Video');
  return badges.length ? badges : ['Video'];
};

const VideoCatalogView: React.FC<VideoCatalogViewProps> = ({ onSelectModule, onOpenAdmin }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState<ModelCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchModelCatalog('video');
      setItems(data);
      setLoading(false);
    };

    load();
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const hay = `${item.name} ${item.family} ${item.apiModel} ${item.shortDescription || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === 'text' && !item.capabilities?.textToVideo) return false;
      if (filter === 'image' && !item.capabilities?.imageToVideo) return false;
      return true;
    });
  }, [items, query, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, ModelCatalogItem[]> = {};
    filteredItems.forEach((item) => {
      const key = item.family || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${isDark ? 'bg-zinc-950 text-zinc-200' : 'bg-zinc-50 text-zinc-900'}`}>
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 ${isDark ? 'bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.12),_transparent_55%)]' : 'bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_60%)]'}`} />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative px-6 py-8 lg:px-10">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className={`text-xs uppercase tracking-[0.3em] ${isDark ? 'text-sky-300/70' : 'text-sky-600/80'}`}>
                  Video Catalog
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Pick a video engine that matches the brief
                </h1>
                <p className={`text-sm md:text-base max-w-2xl ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Filter by text or image driven models. Pricing is in credits for every clip you generate.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {onOpenAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className={`px-4 py-2 text-xs tracking-[0.2em] uppercase border transition-colors ${
                      isDark
                        ? 'border-zinc-700 text-zinc-300 hover:border-sky-400 hover:text-sky-300'
                        : 'border-zinc-300 text-zinc-600 hover:border-sky-500 hover:text-sky-600'
                    }`}
                  >
                    Manage Catalog
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {([
                  { id: 'all', label: 'All' },
                  { id: 'text', label: 'Text to Video' },
                  { id: 'image', label: 'Image to Video' },
                ] as const).map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setFilter(chip.id)}
                    className={`px-3 py-2 text-xs rounded-full border transition-colors ${
                      filter === chip.id
                        ? isDark
                          ? 'border-sky-400/60 bg-sky-500/10 text-sky-200'
                          : 'border-sky-500/60 bg-sky-200/50 text-sky-700'
                        : isDark
                        ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        : 'border-zinc-300 text-zinc-600 hover:border-zinc-400'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full max-w-md">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search model, family, or feature..."
                  className={`w-full px-4 py-3 rounded-full border text-sm outline-none transition-colors ${
                    isDark
                      ? 'bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-sky-400/60'
                      : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-sky-500/60'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-10 lg:px-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {loading ? (
            <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Loading catalog...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              No models matched your filters.
            </div>
          ) : (
            Object.entries(grouped).map(([family, models]) => (
              <div key={family} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{family}</h2>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                      {models.length} models available
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {models.map((item) => {
                    const badges = getCapabilityBadges(item);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border overflow-hidden transition-all ${
                          isDark
                            ? 'border-zinc-800 bg-zinc-900/60 hover:border-sky-400/40'
                            : 'border-zinc-200 bg-white hover:border-sky-300'
                        }`}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                              <span className="text-sm uppercase tracking-[0.4em] text-zinc-400">No Image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            {badges.slice(0, 2).map((badge) => (
                              <span
                                key={badge}
                                className="text-[10px] px-2 py-1 rounded-full bg-black/60 text-white uppercase tracking-wide"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                          <div className="absolute bottom-3 left-3">
                            <p className="text-xs text-zinc-200">{item.shortDescription || 'Video generation engine'}</p>
                          </div>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{item.name}</h3>
                              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{item.apiModel}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-[10px] uppercase tracking-[0.3em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                {item.priceUnit === 'per_second' ? 'credits per second' : 'credits per video'}
                              </div>
                              <div className={`text-sm font-semibold ${isDark ? 'text-sky-200' : 'text-sky-600'}`}>
                                {formatCredits(item.pricePerOutput, item.priceUnit)}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {badges.map((badge) => (
                              <span
                                key={badge}
                                className={`text-[11px] px-2 py-1 rounded-full border ${
                                  isDark ? 'border-zinc-700 text-zinc-400' : 'border-zinc-200 text-zinc-600'
                                }`}
                              >
                                {badge}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => onSelectModule(item.appModule as ModuleType)}
                              className={`flex-1 px-4 py-2 text-xs uppercase tracking-[0.2em] rounded-full transition-colors ${
                                isDark
                                  ? 'bg-sky-500/80 text-black hover:bg-sky-400'
                                  : 'bg-sky-500 text-white hover:bg-sky-600'
                              }`}
                            >
                              Generate
                            </button>
                            <button
                              onClick={() => onSelectModule(item.appModule as ModuleType)}
                              className={`flex-1 px-4 py-2 text-xs uppercase tracking-[0.2em] rounded-full border transition-colors ${
                                isDark
                                  ? 'border-zinc-700 text-zinc-300 hover:border-sky-400 hover:text-sky-300'
                                  : 'border-zinc-300 text-zinc-600 hover:border-sky-400 hover:text-sky-600'
                              }`}
                            >
                              Open Form
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCatalogView;
