// components/UGC/stages/InputModule.tsx

import React, { useEffect, useState } from 'react';
import { useUGCStore } from '../../../store/ugcStore';
import { UploadedAsset, UGCPreferences, DEFAULT_UGC_PREFERENCES } from '../../../types/ugc';
import { uploadFileToSupabaseGetUrl } from '../../../services/kieFileUpload';

interface InputModuleProps {
  onStartGeneration?: () => Promise<void>;
}

const InputModule: React.FC<InputModuleProps> = ({ onStartGeneration }) => {
  const store = useUGCStore();
  const [links, setLinks] = useState('');
  const [dragOver, setDragOver] = useState<'model' | 'product' | null>(null);

  if (!store.currentProject) return null;

  // Initialize preferences if not exist
  const preferences = store.currentProject.settings.preferences || DEFAULT_UGC_PREFERENCES;

  useEffect(() => {
    if (!store.currentProject?.settings.preferences) {
      store.updateSettings({ preferences: { ...DEFAULT_UGC_PREFERENCES } });
    }
  }, [store, store.currentProject?.settings.preferences]);

  const updatePreference = (key: keyof UGCPreferences, value: string) => {
    const newPreferences = { ...preferences, [key]: value };
    store.updateSettings({ preferences: newPreferences });
  };

  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  const handleFileDrop = async (files: File[], type: 'model' | 'product') => {
    for (const file of files) {
      const tempId = crypto.randomUUID();
      
      // Show uploading state with preview
      const previewUrl = URL.createObjectURL(file);
      setUploadingFiles(prev => ({ ...prev, [tempId]: true }));
      
      try {
        // Upload to Supabase to get public URL (required for KIE.AI API)
        const publicUrl = await uploadFileToSupabaseGetUrl(file, `ugc/${type}s`);
        
        const asset: UploadedAsset = {
          id: tempId,
          fileName: file.name,
          supabaseUrl: publicUrl, // Now a real public HTTPS URL
          supabasePath: `ugc/${type}s/${file.name}`,
          size: file.size,
          uploadedAt: Date.now(),
          type,
        };
        
        if (type === 'model') {
          store.addModelPhotos([asset]);
        } else {
          store.addProductPhotos([asset]);
        }
        
        store.setSuccessMessage(`Uploaded ${file.name}`);
      } catch (error) {
        console.error('Upload error:', error);
        store.setError(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setUploadingFiles(prev => ({ ...prev, [tempId]: false }));
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'model' | 'product') => {
    e.preventDefault();
    setDragOver(null);
    const allFiles = Array.from(e.dataTransfer.files) as File[];
    const files = allFiles.filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handleFileDrop(files, type);
  };

  // Skip Narrative Links requirement as per PRD "Input System" - replaced by extensive dropdowns
  const isComplete =
    store.currentProject.inputAssets.modelPhotos.length > 0 &&
    store.currentProject.inputAssets.productPhotos.length > 0;

  const handleStartGeneration = async () => {
    if (isComplete) {
      if (onStartGeneration) {
        await onStartGeneration();
      } else {
        store.setStatus('PROCESSING');
        store.setCurrentStage('ANALYSIS');
      }
    }
  };

  const labelClass = "block text-[10px] font-mono text-orange-500 mb-1 tracking-widest uppercase truncate";
  const selectClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-xs appearance-none cursor-pointer";
  const sectionTitleClass = "flex items-center gap-2 mb-3 pb-2 border-b border-zinc-700";

  // Dropdown Options Data
  const options = {
    characterProfile: ['Asian Female 20s', 'Asian Male 20s', 'Western Female 20s', 'Professional Female 30s', 'Custom'],
    outfitStyle: ['Casual T-Shirt', 'Smart Casual', 'Sporty/Activewear', 'Modest Hijab', 'Formal Business'],
    backgroundStyle: ['Living Room', 'Minimalist Bedroom', 'Urban Street', 'Office Desk', 'Outdoor Park'],
    framing: ['Selfie (Close Up)', 'Half Body (Medium)', 'Full Body'],
    lightingStyle: ['Natural Window', 'Golden Hour', 'Soft Studio', 'Ring Light'],
    productCategory: ['Skincare', 'Fashion', 'F&B', 'Gadget', 'Home Living'],
    priceRange: ['Budget (<100k)', 'Affordable (100k-500k)', 'Premium (>500k)'],
    platform: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
    objective: ['Brand Awareness', 'Soft Selling', 'Hard Selling', 'Educational'],
    brandTone: ['Excited/Hype', 'Calm/Healing', 'Professional/Trust', 'Friendly/Bestie'],
    language: ['ID (Bahasa Gaul)', 'ID (Formal)', 'EN (Casual)', 'EN (Professional)'],
    videoDuration: ['15s (3 scenes)', '30s (5 scenes)'],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN: VISUAL ASSETS */}
        <div className="space-y-6">
           {/* Model Photos */}
          <div>
            <div className={sectionTitleClass}>
              <span className="w-5 h-5 bg-orange-500 text-black text-xs font-bold flex items-center justify-center">1</span>
              <label className="text-sm font-bold text-white uppercase tracking-wider">Model Photos (Identity)</label>
            </div>
            
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver('model'); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, 'model')}
              className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                dragOver === 'model' ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files: File[] = Array.from(e.target.files || []);
                  if (files.length > 0) handleFileDrop(files, 'model');
                }}
                className="hidden"
                id="model-upload"
              />
              <label htmlFor="model-upload" className="cursor-pointer block">
                {Object.values(uploadingFiles).some(v => v) ? (
                  <>
                    <div className="text-2xl mb-2 animate-pulse">⏳</div>
                    <p className="text-orange-500 text-xs mt-1">Uploading...</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl mb-2">📸</div>
                    <p className="text-zinc-600 text-xs mt-1">Ref Identity Photo</p>
                  </>
                )}
              </label>

              {store.currentProject.inputAssets.modelPhotos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {store.currentProject.inputAssets.modelPhotos.map((asset) => (
                    <div key={asset.id} className="relative group aspect-square bg-zinc-900 border border-zinc-600">
                      <img src={asset.supabaseUrl} alt="Model" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); store.removeModelPhoto(asset.id); }}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-600/80 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Photos */}
          <div>
            <div className={sectionTitleClass}>
              <span className="w-5 h-5 bg-orange-500 text-black text-xs font-bold flex items-center justify-center">2</span>
              <label className="text-sm font-bold text-white uppercase tracking-wider">Product Photos</label>
            </div>

            {/* PRODUCT NAME INPUT - NEW FIELD */}
            <div className="mb-3">
              <label className="block text-[10px] font-mono text-zinc-500 mb-1 tracking-widest uppercase truncate">
                Product Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sunglass A, Bikini Set B..."
                value={store.currentProject.inputAssets.productName || ''}
                onChange={(e) => store.setProductName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-xs"
              />
              <p className="text-[10px] text-zinc-600 mt-1 font-mono">Used for AI script generation context</p>
            </div>
            
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver('product'); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, 'product')}
              className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                dragOver === 'product' ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files: File[] = Array.from(e.target.files || []);
                  if (files.length > 0) handleFileDrop(files, 'product');
                }}
                className="hidden"
                id="product-upload"
              />
              <label htmlFor="product-upload" className="cursor-pointer block">
                <div className="text-2xl mb-2">📦</div>
                <p className="text-zinc-600 text-xs mt-1">Ref Product Photo</p>
              </label>

              {store.currentProject.inputAssets.productPhotos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {store.currentProject.inputAssets.productPhotos.map((asset) => (
                    <div key={asset.id} className="relative group aspect-square bg-zinc-900 border border-zinc-600">
                      <img src={asset.supabaseUrl} alt="Product" className="w-full h-full object-contain p-1" />
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); store.removeProductPhoto(asset.id); }}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-600/80 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREFERENCES DROPDOWNS */}
        <div className="bg-zinc-800 border border-zinc-700 p-4 h-full overflow-y-auto max-h-[600px]">
          <div className={sectionTitleClass}>
            <span className="w-5 h-5 bg-orange-500 text-black text-xs font-bold flex items-center justify-center">3</span>
            <label className="text-sm font-bold text-white uppercase tracking-wider">Production Settings</label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Visual Identity */}
            <div className="col-span-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2 border-b border-zinc-700/50 pb-1">Visual Identity</div>
            
            <div>
              <label className={labelClass}>Character</label>
              <div className="relative">
                <select value={preferences.characterProfile} onChange={(e) => updatePreference('characterProfile', e.target.value)} className={selectClass}>
                  {options.characterProfile.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className={labelClass}>Background</label>
              <div className="relative">
                <select value={preferences.backgroundStyle} onChange={(e) => updatePreference('backgroundStyle', e.target.value)} className={selectClass}>
                  {options.backgroundStyle.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Outfit</label>
              <div className="relative">
                <select value={preferences.outfitStyle} onChange={(e) => updatePreference('outfitStyle', e.target.value)} className={selectClass}>
                  {options.outfitStyle.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Lighting</label>
              <div className="relative">
                <select value={preferences.lightingStyle} onChange={(e) => updatePreference('lightingStyle', e.target.value)} className={selectClass}>
                  {options.lightingStyle.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* Campaign Strategy */}
            <div className="col-span-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mt-4 border-b border-zinc-700/50 pb-1">Campaign Strategy</div>
            
            <div>
              <label className={labelClass}>Objective</label>
              <div className="relative">
                <select value={preferences.objective} onChange={(e) => updatePreference('objective', e.target.value)} className={selectClass}>
                  {options.objective.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Tone</label>
              <div className="relative">
                <select value={preferences.brandTone} onChange={(e) => updatePreference('brandTone', e.target.value)} className={selectClass}>
                  {options.brandTone.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            
             <div>
              <label className={labelClass}>Language</label>
              <div className="relative">
                <select value={preferences.language} onChange={(e) => updatePreference('language', e.target.value)} className={selectClass}>
                  {options.language.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

             <div>
              <label className={labelClass}>Platform</label>
              <div className="relative">
                <select value={preferences.platform} onChange={(e) => updatePreference('platform', e.target.value)} className={selectClass}>
                  {options.platform.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            
            {/* Custom inputs */}
            <div className="col-span-2 mt-2">
              <label className={labelClass}>Custom Note (Optional)</label>
              <textarea 
                value={preferences.customNote || ''}
                onChange={(e) => updatePreference('customNote', e.target.value)}
                placeholder="Ex: Mention 'Gratis Ongkir' specifically..."
                className={`${selectClass} h-20 resize-none`}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-between items-center pt-4 border-t border-zinc-800">
        <div className="text-[10px] font-mono text-zinc-500">
          <p>Strict Identity & Environment Lock Active</p>
          <p>Manual Generation Mode: No Auto-Retry</p>
        </div>
        
        <div className="flex gap-3">
           <button
            onClick={() => store.resetProject()}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleStartGeneration}
            disabled={!isComplete || store.isLoading}
            className="relative font-bold uppercase tracking-wider py-3 px-6 bg-orange-600 hover:bg-orange-500 text-black border-l-4 border-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {store.isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                GENERATING BLUEPRINT...
              </span>
            ) : (
              '✨ GENERATE SCRIPT & PLAN'
            )}
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModule;
