// components/UGC/stages/VideoGenerationPanel.tsx

import React, { useState } from 'react';
import { useUGCStore } from '../../../store/ugcStore';

interface VideoGenerationPanelProps {
  onGenerateVideo?: () => Promise<void>;
}

const VideoGenerationPanel: React.FC<VideoGenerationPanelProps> = ({ onGenerateVideo }) => {
  const store = useUGCStore();
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p'>('1080p');
  const [frameRate, setFrameRate] = useState<24 | 30 | 60>(30);

  if (!store.currentProject) return null;

  const videos = store.currentProject.generatedContent.videos;
  const images = store.currentProject.generatedContent.images;
  const approvedImages = images.filter(img => img.approved !== false);

  const handleGenerateVideo = async () => {
    if (onGenerateVideo) {
      await onGenerateVideo();
    } else {
      store.setLoading(true);
      setTimeout(() => {
        store.setLoading(false);
        store.setSuccessMessage('Video generation completed');
      }, 3000);
    }
  };

  const canGenerateVideo = approvedImages.length >= 2;
  const selectClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-2 focus:border-orange-500 focus:outline-none font-mono text-sm appearance-none cursor-pointer";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-orange-500"></div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-white">Video Generation</h2>
        </div>
        <p className="text-xs text-zinc-500 font-mono">
          Create smooth video transitions using KIE.AI Veo 3.1
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-zinc-800 border border-zinc-700 p-4">
        <h3 className="text-xs font-mono text-orange-500 uppercase tracking-widest mb-3">About Video Generation</h3>
        <div className="grid grid-cols-2 gap-4">
          <ul className="text-xs text-zinc-400 space-y-1">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Smooth transitions</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> AI-powered motion</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Multiple resolutions</li>
          </ul>
          <ul className="text-xs text-zinc-400 space-y-1">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Cinematic style</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Social media ready</li>
            <li className="flex items-center gap-2"><span className="text-orange-500">💎</span> ~$2-5 per video</li>
          </ul>
        </div>
      </div>

      {/* Image Selection Summary */}
      <div className="bg-zinc-800 border border-zinc-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-mono text-orange-500 uppercase tracking-widest">Images to Include</h4>
          <span className={`text-xs font-mono px-2 py-1 ${canGenerateVideo ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {approvedImages.length} selected
          </span>
        </div>
        
        {approvedImages.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {approvedImages.map((image, index) => (
              <div key={image.id} className="flex-shrink-0 relative">
                <img
                  src={image.imageUrl}
                  alt={`Scene ${image.sceneNumber}`}
                  className="w-16 h-16 object-cover border border-zinc-600"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/1a1a2e/eee?text=?'; }}
                />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 font-mono">
            No images approved. Go back to Image Gallery and approve at least 2 images.
          </p>
        )}

        {!canGenerateVideo && approvedImages.length > 0 && (
          <p className="text-xs text-yellow-500 mt-2 font-mono">
            ⚠️ Need at least 2 images to generate video
          </p>
        )}
      </div>

      {/* Video Settings */}
      <div className="bg-zinc-800 border border-zinc-700 p-4">
        <h4 className="text-xs font-mono text-orange-500 uppercase tracking-widest mb-3">Video Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Resolution</label>
            <div className="relative">
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as '720p' | '1080p' | '1440p')}
                className={selectClass}
              >
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="1440p">1440p 2K</option>
              </select>
              <div className="absolute right-2 top-2 pointer-events-none text-orange-500 text-xs">▼</div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Frame Rate</label>
            <div className="relative">
              <select
                value={frameRate}
                onChange={(e) => setFrameRate(Number(e.target.value) as 24 | 30 | 60)}
                className={selectClass}
              >
                <option value={24}>24 fps (Cinematic)</option>
                <option value={30}>30 fps (Standard)</option>
                <option value={60}>60 fps (Smooth)</option>
              </select>
              <div className="absolute right-2 top-2 pointer-events-none text-orange-500 text-xs">▼</div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 font-mono mt-2">
          Estimated duration: ~{approvedImages.length * 3} seconds
        </p>
      </div>

      {/* Loading State */}
      {store.isLoading && videos.length === 0 && (
        <div className="bg-zinc-800 border border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 border-4 border-zinc-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-mono mb-2">GENERATING VIDEO...</p>
          <p className="text-xs text-zinc-500 font-mono">{store.progressMessage || 'This may take a few minutes'}</p>
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

      {/* Generate Button (when no videos) */}
      {videos.length === 0 && !store.isLoading && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🎥</div>
          <p className="text-zinc-400 font-mono mb-6">Ready to create your UGC video</p>
          <button
            onClick={handleGenerateVideo}
            disabled={!canGenerateVideo || store.isLoading}
            className="relative font-bold uppercase tracking-wider py-4 px-8 bg-gradient-to-r from-orange-600 to-yellow-500 text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            🎬 GENERATE VIDEO
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
          </button>
          {!canGenerateVideo && (
            <p className="text-xs text-zinc-500 font-mono mt-3">
              Approve at least 2 images to generate video
            </p>
          )}
        </div>
      )}

      {/* Generated Videos */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-mono text-orange-500 uppercase tracking-widest">Generated Videos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="bg-zinc-800 border border-zinc-700 overflow-hidden">
                <div className="bg-zinc-900 aspect-video flex items-center justify-center relative">
                  {video.videoUrl ? (
                    <video src={video.videoUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-zinc-400">
                      <div className="text-4xl mb-2">🎬</div>
                      <p className="text-xs font-mono">{video.duration?.toFixed(1)}s • {video.resolution}</p>
                    </div>
                  )}
                  
                  <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 uppercase tracking-wider ${
                    video.status === 'completed' ? 'bg-green-500 text-black' :
                    video.status === 'processing' ? 'bg-orange-500 text-black animate-pulse' :
                    video.status === 'failed' ? 'bg-red-500 text-white' :
                    'bg-zinc-600 text-white'
                  }`}>
                    {video.status === 'completed' && '✓ Ready'}
                    {video.status === 'processing' && '⏳ Processing'}
                    {video.status === 'failed' && '✕ Failed'}
                    {video.status === 'pending' && '⏸ Pending'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">UGC Video</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{video.resolution || '1080p'} @ {video.frameRate || 30}fps</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {new Date(video.createdAt || video.generatedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {video.videoUrl && video.status === 'completed' && (
                    <a
                      href={video.videoUrl}
                      download={`ugc-video-${video.id}.mp4`}
                      className="mt-3 w-full block text-center px-4 py-2 bg-zinc-700 text-orange-500 text-xs font-mono uppercase tracking-wider hover:bg-zinc-600 transition-colors"
                    >⬇️ Download Video</a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleGenerateVideo}
              disabled={!canGenerateVideo || store.isLoading}
              className="px-6 py-2 border border-orange-500/30 text-orange-500 font-mono text-xs uppercase tracking-wider hover:bg-orange-500/10 transition-colors disabled:opacity-50"
            >+ Generate Another</button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-between pt-4 border-t border-zinc-800">
        <button
          onClick={() => store.setCurrentStage('QA')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors"
        >← Back</button>
        <div className="flex gap-3">
          <button
            onClick={() => store.setCurrentStage('COMPLETE')}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors"
          >Skip Video →</button>
          <button
            onClick={() => store.setCurrentStage('COMPLETE')}
            disabled={store.isLoading}
            className="relative font-bold uppercase tracking-wider py-3 px-6 bg-orange-600 hover:bg-orange-500 text-black border-l-4 border-orange-800 transition-all disabled:opacity-50"
          >
            ✨ COMPLETE PROJECT →
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationPanel;
