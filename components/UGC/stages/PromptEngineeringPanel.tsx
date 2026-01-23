// components/UGC/stages/PromptEngineeringPanel.tsx

import React, { useState } from 'react';
import { useUGCStore } from '../../../store/ugcStore';

interface PromptEngineeringPanelProps {
  onGenerateImages?: () => Promise<void>;
}

const PromptEngineeringPanel: React.FC<PromptEngineeringPanelProps> = ({ onGenerateImages }) => {
  const store = useUGCStore();
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  if (!store.currentProject) return null;

  const prompts = store.currentProject.generatedContent.prompts || 
                  store.currentProject.generatedContent.promptTemplates || [];

  const handleGenerateImages = async () => {
    if (onGenerateImages) {
      await onGenerateImages();
    } else {
      store.setCurrentStage('GENERATING');
    }
  };

  const labelClass = "block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase";
  const inputClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-sm";
  const selectClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-2 focus:border-orange-500 focus:outline-none font-mono text-sm appearance-none cursor-pointer";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-orange-500"></div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-white">Prompt Engineering</h2>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Review and customize AI prompts • {prompts.length} prompts ready
          </p>
        </div>
        {prompts.length > 0 && (
          <div className="text-xs text-green-500 bg-green-500/10 border border-green-500/30 px-3 py-1 font-mono">
            ✓ {prompts.length} AUTO-GENERATED
          </div>
        )}
      </div>

      {prompts.length === 0 ? (
        <div className="bg-zinc-800 border border-zinc-700 p-8 text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <p className="text-zinc-300 font-mono mb-2">Prompts will be auto-generated from your script</p>
          <p className="text-zinc-600 text-xs font-mono">Go back and approve the script first</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map((prompt: any, index: number) => {
            const isExpanded = expandedPrompt === (prompt.id || prompt.sceneId);
            return (
              <div key={prompt.id || prompt.sceneId || index} className="border border-zinc-700 bg-zinc-800/50">
                <button
                  onClick={() => setExpandedPrompt(isExpanded ? null : (prompt.id || prompt.sceneId))}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-black font-bold text-sm">
                      {prompt.sceneNumber || index + 1}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Scene {prompt.sceneNumber || index + 1}</p>
                      <p className="text-xs text-zinc-500 font-mono truncate max-w-md">
                        {(prompt.sceneDescription || prompt.basePrompt)?.substring(0, 60)}...
                      </p>
                    </div>
                  </div>
                  <span className="text-zinc-500 text-sm">{isExpanded ? '▼' : '▶'}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-700 px-4 py-4 bg-zinc-900 space-y-4">
                    {/* Scene Description */}
                    <div>
                      <label className={labelClass}>📝 Scene Description</label>
                      <textarea
                        value={prompt.sceneDescription || prompt.basePrompt}
                        onChange={(e) => {
                          if (prompt.id) {
                            store.updatePrompt(prompt.sceneId, { ...prompt, sceneDescription: e.target.value });
                          }
                        }}
                        className={`${inputClass} resize-none`}
                        rows={3}
                      />
                    </div>

                    {/* Visual Style */}
                    <div>
                      <label className={labelClass}>🎨 Visual Style</label>
                      <input
                        type="text"
                        value={prompt.visualStyle || 'UGC photography style'}
                        onChange={(e) => {
                          if (prompt.id) {
                            store.updatePrompt(prompt.sceneId, { ...prompt, visualStyle: e.target.value });
                          }
                        }}
                        className={inputClass}
                      />
                    </div>

                    {/* Negative Prompts */}
                    <div>
                      <label className={labelClass}>🚫 Negative Prompts</label>
                      <input
                        type="text"
                        value={(prompt.negativePrompts || []).join(', ')}
                        onChange={(e) => {
                          if (prompt.id) {
                            store.updatePrompt(prompt.sceneId, { 
                              ...prompt, 
                              negativePrompts: e.target.value.split(',').map((p: string) => p.trim()).filter(Boolean)
                            });
                          }
                        }}
                        className={inputClass}
                        placeholder="blurry, distorted, watermark, low quality..."
                      />
                    </div>

                    {/* Customizations */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Style</label>
                        <div className="relative">
                          <select
                            value={prompt.customizations?.style || 'authentic UGC'}
                            onChange={(e) => {
                              if (prompt.id) {
                                store.updatePrompt(prompt.sceneId, { 
                                  ...prompt, 
                                  customizations: { ...prompt.customizations, style: e.target.value }
                                });
                              }
                            }}
                            className={selectClass}
                          >
                            <option value="authentic UGC">Authentic UGC</option>
                            <option value="professional">Professional</option>
                            <option value="cinematic">Cinematic</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="editorial">Editorial</option>
                          </select>
                          <div className="absolute right-2 top-2 pointer-events-none text-orange-500 text-xs">▼</div>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Lighting</label>
                        <div className="relative">
                          <select
                            value={prompt.customizations?.lighting || 'natural soft lighting'}
                            onChange={(e) => {
                              if (prompt.id) {
                                store.updatePrompt(prompt.sceneId, { 
                                  ...prompt, 
                                  customizations: { ...prompt.customizations, lighting: e.target.value }
                                });
                              }
                            }}
                            className={selectClass}
                          >
                            <option value="natural soft lighting">Natural Soft</option>
                            <option value="studio lighting">Studio</option>
                            <option value="golden hour">Golden Hour</option>
                            <option value="dramatic">Dramatic</option>
                            <option value="bright and airy">Bright & Airy</option>
                          </select>
                          <div className="absolute right-2 top-2 pointer-events-none text-orange-500 text-xs">▼</div>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Composition</label>
                        <div className="relative">
                          <select
                            value={prompt.customizations?.composition || 'rule of thirds'}
                            onChange={(e) => {
                              if (prompt.id) {
                                store.updatePrompt(prompt.sceneId, { 
                                  ...prompt, 
                                  customizations: { ...prompt.customizations, composition: e.target.value }
                                });
                              }
                            }}
                            className={selectClass}
                          >
                            <option value="rule of thirds">Rule of Thirds</option>
                            <option value="centered">Centered</option>
                            <option value="close-up">Close-up</option>
                            <option value="full body">Full Body</option>
                            <option value="product focus">Product Focus</option>
                          </select>
                          <div className="absolute right-2 top-2 pointer-events-none text-orange-500 text-xs">▼</div>
                        </div>
                      </div>
                    </div>

                    {/* Final Prompt Preview */}
                    <div className="bg-zinc-950 border border-zinc-700 p-3">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 block">🔍 Final Prompt Preview</label>
                      <p className="text-xs text-zinc-400 font-mono">{prompt.generatedPrompt || prompt.basePrompt}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
        <button
          onClick={() => store.setCurrentStage('SCRIPTING')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleGenerateImages}
          disabled={prompts.length === 0 || store.isLoading}
          className="relative font-bold uppercase tracking-wider py-3 px-6 bg-orange-600 hover:bg-orange-500 text-black border-l-4 border-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {store.isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              GENERATING...
            </span>
          ) : (
            '🎨 GENERATE IMAGES →'
          )}
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
        </button>
      </div>
    </div>
  );
};

export default PromptEngineeringPanel;
