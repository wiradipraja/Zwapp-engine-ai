// components/UGC/stages/ImageGalleryView.tsx

import React, { useState } from 'react';
import { useUGCStore } from '../../../store/ugcStore';

interface ImageGalleryViewProps {
  onRunQA?: () => Promise<void>;
}

const ImageGalleryView: React.FC<ImageGalleryViewProps> = ({ onRunQA }) => {
  const store = useUGCStore();
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!store.currentProject) return null;

  const images = store.currentProject.generatedContent.images;
  const approvedCount = images.filter(img => img.approved).length;

  const handleRunQA = async () => {
    if (onRunQA) {
      await onRunQA();
    } else {
      store.setCurrentStage('QA');
    }
  };

  const handleApproveAll = () => {
    images.forEach(img => store.updateGeneratedImage(img.id, { approved: true }));
    store.setSuccessMessage('All images approved!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-orange-500"></div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-white">Image Gallery</h2>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Generated {images.length} images | {approvedCount} approved
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 border transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 border-orange-500 text-orange-500' : 'border-zinc-700 text-zinc-500'}`}
          >⊞</button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 border transition-colors ${viewMode === 'list' ? 'bg-zinc-800 border-orange-500 text-orange-500' : 'border-zinc-700 text-zinc-500'}`}
          >≡</button>
        </div>
      </div>

      {/* Loading State */}
      {store.isLoading && images.length === 0 && (
        <div className="bg-zinc-800 border border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 border-4 border-zinc-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-mono mb-2">GENERATING IMAGES...</p>
          <p className="text-xs text-zinc-500 font-mono">{store.progressMessage || 'This may take a few moments'}</p>
          {store.progressPercent > 0 && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="w-full bg-zinc-700 h-1">
                <div className="bg-orange-500 h-1 transition-all" style={{ width: `${store.progressPercent}%` }} />
              </div>
              <p className="text-xs text-orange-500 font-mono mt-1">{store.progressPercent}%</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !store.isLoading && (
        <div className="bg-zinc-800 border border-zinc-700 p-12 text-center">
          <div className="text-4xl mb-4">🖼️</div>
          <p className="text-white font-mono mb-2">No images generated yet</p>
          <p className="text-xs text-zinc-500 font-mono">
            Go back to Prompt Engineering and click "Generate Images"
          </p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <>
          {/* Bulk Actions */}
          <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 p-3">
            <span className="text-xs text-zinc-400 font-mono">
              {approvedCount} of {images.length} images approved
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleApproveAll}
                className="text-xs text-green-500 hover:text-green-400 font-mono uppercase tracking-wider"
              >✓ Approve All</button>
              <button
                onClick={() => images.forEach(img => store.updateGeneratedImage(img.id, { approved: false }))}
                className="text-xs text-zinc-500 hover:text-zinc-400 font-mono uppercase tracking-wider"
              >Clear</button>
            </div>
          </div>

          <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {images.map((image) => (
              <div
                key={image.id}
                onClick={() => setSelectedImageId(image.id)}
                className={`relative group cursor-pointer border-2 transition-all ${
                  selectedImageId === image.id
                    ? 'border-orange-500'
                    : image.approved
                    ? 'border-green-500'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <img
                  src={image.imageUrl}
                  alt={`Scene ${image.sceneNumber || image.sceneId}`}
                  className="w-full h-40 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/512x512/1a1a2e/eee?text=Image'; }}
                />
                
                {/* Approval Badge */}
                {image.approved && (
                  <div className="absolute top-2 left-2 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                    ✓ Approved
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <p className="text-white text-xs font-mono uppercase">Scene {image.sceneNumber || image.sceneId}</p>
                  {image.consistency && (
                    <p className="text-zinc-400 text-[10px] font-mono">Quality: {image.consistency.overallQuality}%</p>
                  )}
                </div>

                {/* Quick Approve Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    store.updateGeneratedImage(image.id, { approved: !image.approved });
                  }}
                  className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center transition-all text-sm ${
                    image.approved ? 'bg-green-500 text-black' : 'bg-zinc-900/80 text-zinc-400 hover:bg-green-500 hover:text-black'
                  }`}
                >✓</button>
              </div>
            ))}
          </div>

          {/* Selected Image Detail */}
          {selectedImageId && (() => {
            const image = images.find((img) => img.id === selectedImageId);
            if (!image) return null;

            return (
              <div className="bg-zinc-800 border border-zinc-700 p-4">
                <div className="flex gap-6">
                  <img
                    src={image.imageUrl}
                    alt={`Scene ${image.sceneNumber}`}
                    className="w-48 h-48 object-cover border border-zinc-600"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/512x512/1a1a2e/eee?text=Image'; }}
                  />
                  <div className="flex-1 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                      Scene {image.sceneNumber || image.sceneId} Details
                    </h3>

                    {/* Consistency Metrics */}
                    {image.consistency && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Model Consistency', value: image.consistency.modelConsistency },
                          { label: 'Product Placement', value: image.consistency.productPlacement },
                          { label: 'Style Cohesion', value: image.consistency.styleCohesion },
                          { label: 'Overall Quality', value: image.consistency.overallQuality },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] font-mono text-orange-500 uppercase tracking-widest">{label}</p>
                            <div className="w-full bg-zinc-700 h-1 mt-1">
                              <div
                                className={`h-1 ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <p className="text-xs text-zinc-400 font-mono">{value}%</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Approve Toggle */}
                    <div className="pt-3 border-t border-zinc-700">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={image.approved || false}
                          onChange={(e) => store.updateGeneratedImage(image.id, { approved: e.target.checked })}
                          className="w-4 h-4 bg-zinc-900 border-zinc-600 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-xs text-zinc-300 font-mono uppercase tracking-wider">
                          Approve for final output
                        </span>
                      </label>
                    </div>

                    {/* Prompt Used */}
                    {(image.promptUsed || image.prompt) && (
                      <div className="pt-3 border-t border-zinc-700">
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Prompt Used:</p>
                        <p className="text-xs text-zinc-500 font-mono bg-zinc-900 p-2">{image.promptUsed || image.prompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
        <button
          onClick={() => store.setCurrentStage('PROMPTING')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors"
        >← Back</button>
        <button
          onClick={handleRunQA}
          disabled={images.length === 0 || store.isLoading}
          className="relative font-bold uppercase tracking-wider py-3 px-6 bg-orange-600 hover:bg-orange-500 text-black border-l-4 border-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {store.isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              PROCESSING...
            </span>
          ) : (
            '✅ REVIEW QUALITY →'
          )}
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
        </button>
      </div>
    </div>
  );
};

export default ImageGalleryView;
