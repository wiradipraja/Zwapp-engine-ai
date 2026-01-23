// components/UGC/stages/InputModule.tsx

import React, { useState } from 'react';
import { useUGCStore } from '../../../store/ugcStore';
import { UploadedAsset } from '../../../types/ugc';

interface InputModuleProps {
  onStartGeneration?: () => Promise<void>;
}

const InputModule: React.FC<InputModuleProps> = ({ onStartGeneration }) => {
  const store = useUGCStore();
  const [links, setLinks] = useState('');
  const [dragOver, setDragOver] = useState<'model' | 'product' | null>(null);

  if (!store.currentProject) return null;

  const handleFileDrop = (files: File[], type: 'model' | 'product') => {
    files.forEach((file) => {
      const asset: UploadedAsset = {
        id: crypto.randomUUID(),
        fileName: file.name,
        supabaseUrl: URL.createObjectURL(file),
        supabasePath: `${type}s/${file.name}`,
        size: file.size,
        uploadedAt: Date.now(),
        type,
      };
      if (type === 'model') {
        store.addModelPhotos([asset]);
      } else {
        store.addProductPhotos([asset]);
      }
    });
    store.setSuccessMessage(`Uploaded ${files.length} ${type} photo(s)`);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'model' | 'product') => {
    e.preventDefault();
    setDragOver(null);
    const allFiles = Array.from(e.dataTransfer.files) as File[];
    const files = allFiles.filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handleFileDrop(files, type);
  };

  const handleAddLink = () => {
    if (links.trim()) {
      try {
        new URL(links);
        store.addNarrativeLink(links);
        setLinks('');
        store.setSuccessMessage('Link added successfully');
      } catch {
        store.setError('Invalid URL format');
      }
    }
  };

  const isComplete =
    store.currentProject.inputAssets.modelPhotos.length > 0 &&
    store.currentProject.inputAssets.productPhotos.length > 0 &&
    store.currentProject.inputAssets.narrativeLinks.length > 0;

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

  const labelClass = "block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase";
  const inputClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-sm";

  return (
    <div className="space-y-6">
      {/* Model Photos */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 bg-orange-500 text-black text-xs font-bold flex items-center justify-center">1</span>
          <label className={labelClass}>Upload Model Photos</label>
        </div>
        <p className="text-xs text-zinc-600 font-mono mb-3">
          Clear photos of your model showing different poses and angles
        </p>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver('model'); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => handleDrop(e, 'model')}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
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
          <label htmlFor="model-upload" className="cursor-pointer">
            <div className="text-3xl mb-2">📸</div>
            <p className="text-zinc-400 text-sm font-mono">Drag files here or click to select</p>
            <p className="text-zinc-600 text-xs mt-1">JPG, PNG, WEBP • Max 30MB</p>
          </label>
        </div>

        {store.currentProject.inputAssets.modelPhotos.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {store.currentProject.inputAssets.modelPhotos.map((asset) => (
              <div key={asset.id} className="relative group">
                <img src={asset.supabaseUrl} alt={asset.fileName} className="w-full h-16 object-cover border border-zinc-700" />
                <button
                  onClick={() => store.removeModelPhoto(asset.id)}
                  className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >✕</button>
                <p className="text-[10px] text-zinc-500 font-mono truncate mt-1">{asset.fileName}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Photos */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 bg-orange-500 text-black text-xs font-bold flex items-center justify-center">2</span>
          <label className={labelClass}>Upload Product Photos</label>
        </div>
        <p className="text-xs text-zinc-600 font-mono mb-3">
          Clear product photos showing colors, features, and details
        </p>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver('product'); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => handleDrop(e, 'product')}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
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
          <label htmlFor="product-upload" className="cursor-pointer">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-zinc-400 text-sm font-mono">Drag files here or click to select</p>
            <p className="text-zinc-600 text-xs mt-1">JPG, PNG, WEBP • Max 30MB</p>
          </label>
        </div>

        {store.currentProject.inputAssets.productPhotos.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {store.currentProject.inputAssets.productPhotos.map((asset) => (
              <div key={asset.id} className="relative group">
                <img src={asset.supabaseUrl} alt={asset.fileName} className="w-full h-16 object-cover border border-zinc-700" />
                <button
                  onClick={() => store.removeProductPhoto(asset.id)}
                  className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >✕</button>
                <p className="text-[10px] text-zinc-500 font-mono truncate mt-1">{asset.fileName}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Narrative Links */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 bg-orange-500 text-black text-xs font-bold flex items-center justify-center">3</span>
          <label className={labelClass}>Add Narrative Reference Link</label>
        </div>
        <p className="text-xs text-zinc-600 font-mono mb-3">
          TikTok, Instagram link or Google Doc link for brand context
        </p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddLink()}
            placeholder="https://www.tiktok.com/@brand/video/..."
            className={inputClass}
          />
          <button
            onClick={handleAddLink}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-orange-500 border border-orange-500/30 font-mono text-sm uppercase tracking-wider transition-colors"
          >
            Add
          </button>
        </div>

        {store.currentProject.inputAssets.narrativeLinks.length > 0 && (
          <div className="space-y-2">
            {store.currentProject.inputAssets.narrativeLinks.map((link) => (
              <div key={link} className="flex items-center justify-between bg-zinc-800 border border-zinc-700 p-2">
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:text-orange-300 font-mono truncate flex-1">
                  🔗 {link}
                </a>
                <button onClick={() => store.removeNarrativeLink(link)} className="ml-2 text-zinc-500 hover:text-red-500 transition-colors text-sm">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="bg-zinc-800 border border-zinc-700 p-4">
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Input Status</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className={store.currentProject.inputAssets.modelPhotos.length > 0 ? 'text-green-500' : 'text-zinc-600'}>
              {store.currentProject.inputAssets.modelPhotos.length > 0 ? '✓' : '○'}
            </span>
            <span className="text-xs font-mono text-zinc-400">Model Photos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={store.currentProject.inputAssets.productPhotos.length > 0 ? 'text-green-500' : 'text-zinc-600'}>
              {store.currentProject.inputAssets.productPhotos.length > 0 ? '✓' : '○'}
            </span>
            <span className="text-xs font-mono text-zinc-400">Product Photos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={store.currentProject.inputAssets.narrativeLinks.length > 0 ? 'text-green-500' : 'text-zinc-600'}>
              {store.currentProject.inputAssets.narrativeLinks.length > 0 ? '✓' : '○'}
            </span>
            <span className="text-xs font-mono text-zinc-400">Narrative Link</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
        <button
          onClick={() => store.resetProject()}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors"
        >
          Cancel
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
              ANALYZING...
            </span>
          ) : (
            '✨ ANALYZE & GENERATE SCRIPT'
          )}
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
        </button>
      </div>
    </div>
  );
};

export default InputModule;
