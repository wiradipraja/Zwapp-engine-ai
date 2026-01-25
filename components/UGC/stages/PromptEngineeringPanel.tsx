// components/UGC/stages/PromptEngineeringPanel.tsx

import React, { useState } from 'react';
import { useUGCStore } from '../../../store/ugcStore';
import { generateSingleUGCImage } from '../../../services/ugcIntegration';
import { PromptTemplate } from '../../../types/ugc';

interface PromptEngineeringPanelProps {
  onGenerateImages?: () => Promise<void>;
  onGenerateSingleImage?: (prompt: PromptTemplate) => Promise<void>;
}

const PromptEngineeringPanel: React.FC<PromptEngineeringPanelProps> = ({ 
  onGenerateImages,
  onGenerateSingleImage 
}) => {
  const store = useUGCStore();
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [generatingScene, setGeneratingScene] = useState<number | null>(null);

  if (!store.currentProject) return null;

  const prompts = store.currentProject.generatedContent.prompts || 
                  store.currentProject.generatedContent.promptTemplates || [];
  
  // Get already generated images to check which scenes are done
  const generatedImages = store.currentProject.generatedContent.images || [];
  const generatedSceneIds = new Set(generatedImages.map(img => img.sceneId));

  const handleGenerateImages = async () => {
    if (onGenerateImages) {
      await onGenerateImages();
    } else {
      store.setCurrentStage('GENERATING');
    }
  };

  // Handle single scene generation
  const handleGenerateSingleScene = async (prompt: PromptTemplate) => {
    if (onGenerateSingleImage) {
      await onGenerateSingleImage(prompt);
      return;
    }

    // Default implementation
    const kieApiKey = localStorage.getItem('kie_api_key') || '';
    if (!kieApiKey) {
      store.setError('KIE API Key diperlukan untuk generate images');
      return;
    }

    const modelPhoto = store.currentProject?.inputAssets.modelPhotos[0];
    const productPhoto = store.currentProject?.inputAssets.productPhotos[0];

    if (!modelPhoto?.supabaseUrl && !productPhoto?.supabaseUrl) {
      store.setError('At least one reference image required');
      return;
    }

    setGeneratingScene(prompt.sceneNumber || 1);
    store.setProgress('GENERATING', 10, `Generating scene ${prompt.sceneNumber}...`);

    try {
      const image = await generateSingleUGCImage(
        prompt,
        modelPhoto!,
        productPhoto!,
        { kieApiKey, geminiApiKey: '' },
        (msg, pct) => store.setProgress('GENERATING', pct, msg)
      );

      store.addGeneratedImage(image);
      store.setSuccessMessage(`Scene ${prompt.sceneNumber} generated successfully!`);
    } catch (error) {
      console.error('Single image generation error:', error);
      store.setError(`Failed to generate scene ${prompt.sceneNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingScene(null);
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

      {/* Generation Status Bar */}
      {generatedImages.length > 0 && (
        <div className="bg-zinc-800 border border-zinc-700 p-3 flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">
            📸 {generatedImages.length} of {prompts.length} scenes generated
          </span>
          <div className="flex items-center gap-2">
            {prompts.map((_, idx) => (
              <div 
                key={idx}
                className={`w-3 h-3 border ${
                  generatedSceneIds.has(`scene-${idx + 1}`) 
                    ? 'bg-green-500 border-green-400' 
                    : generatingScene === idx + 1
                    ? 'bg-orange-500 border-orange-400 animate-pulse'
                    : 'bg-zinc-700 border-zinc-600'
                }`}
              />
            ))}
          </div>
        </div>
      )}

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
            const sceneId = prompt.sceneId || `scene-${prompt.sceneNumber || index + 1}`;
            const isGenerated = generatedSceneIds.has(sceneId);
            const isGenerating = generatingScene === (prompt.sceneNumber || index + 1);
            
            // Find the generated image for this scene
            const generatedImage = generatedImages.find(img => img.sceneId === sceneId);
            
            return (
              <div key={prompt.id || prompt.sceneId || index} className={`border bg-zinc-800/50 ${isGenerated ? 'border-green-600' : 'border-zinc-700'}`}>
                {/* Scene Header */}
                <div className="w-full px-4 py-3 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedPrompt(isExpanded ? null : (prompt.id || prompt.sceneId))}
                    className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                  >
                    <div className={`w-8 h-8 flex items-center justify-center text-black font-bold text-sm ${isGenerated ? 'bg-green-500' : 'bg-orange-600'}`}>
                      {isGenerated ? '✓' : prompt.sceneNumber || index + 1}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        Scene {prompt.sceneNumber || index + 1}
                        {isGenerated && <span className="text-xs text-green-500 font-mono">GENERATED</span>}
                        {isGenerating && <span className="text-xs text-orange-500 font-mono animate-pulse">GENERATING...</span>}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono truncate max-w-md">
                        {(prompt.sceneDescription || prompt.basePrompt)?.substring(0, 60)}...
                      </p>
                    </div>
                  </button>
                  
                  {/* Generate Single Scene Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateSingleScene(prompt);
                      }}
                      disabled={isGenerating || generatingScene !== null}
                      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
                        isGenerated 
                          ? 'bg-zinc-700 text-zinc-400 border border-zinc-600 hover:bg-zinc-600' 
                          : 'bg-orange-600 text-black hover:bg-orange-500 border border-orange-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isGenerating ? (
                        <span className="flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          ...
                        </span>
                      ) : isGenerated ? (
                        '🔄 Regen'
                      ) : (
                        '🎨 Generate'
                      )}
                    </button>
                    <span 
                      onClick={() => setExpandedPrompt(isExpanded ? null : (prompt.id || prompt.sceneId))}
                      className="text-zinc-500 text-sm cursor-pointer hover:text-zinc-300 p-1"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

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

                    {/* Generated Image Preview - INLINE OUTPUT */}
                    {generatedImage && generatedImage.imageUrl && (
                      <div className="bg-green-950/30 border border-green-700 p-3 mt-4">
                        <label className="text-[10px] font-mono text-green-500 uppercase tracking-widest mb-2 block">✅ Generated Output</label>
                        <div className="flex gap-4 items-start">
                          <div className="w-32 h-32 bg-zinc-900 border border-green-600 overflow-hidden flex-shrink-0">
                            <img 
                              src={generatedImage.imageUrl} 
                              alt={`Scene ${prompt.sceneNumber || index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="55" fill="%23666" text-anchor="middle" font-size="12">Error</text></svg>';
                              }}
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="text-xs text-zinc-400 font-mono">
                              <span className="text-green-500">Model:</span> {generatedImage.model || 'nano-banana-edit'}
                            </p>
                            <p className="text-xs text-zinc-400 font-mono">
                              <span className="text-green-500">Quality:</span> {generatedImage.qualityScore || generatedImage.consistency?.overallQuality || 85}%
                            </p>
                            <p className="text-xs text-zinc-400 font-mono break-all">
                              <span className="text-green-500">URL:</span> {generatedImage.imageUrl.substring(0, 60)}...
                            </p>
                            <div className="flex gap-2 mt-2">
                              <a 
                                href={generatedImage.imageUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs bg-green-600 hover:bg-green-500 text-black px-2 py-1 font-mono"
                              >
                                🔗 Open
                              </a>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedImage.imageUrl);
                                  store.setSuccessMessage('URL copied to clipboard!');
                                }}
                                className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-2 py-1 font-mono"
                              >
                                📋 Copy URL
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-4 justify-between items-center pt-4 border-t border-zinc-800">
        <button
          onClick={() => store.setCurrentStage('SCRIPTING')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          {/* Generation Stats */}
          {generatedImages.length > 0 && (
            <span className="text-xs text-zinc-500 font-mono">
              {generatedImages.length}/{prompts.length} done
            </span>
          )}

          {/* View Gallery Button - show when some images generated */}
          {generatedImages.length > 0 && (
            <button
              onClick={() => store.setCurrentStage('GENERATING')}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600 font-mono text-sm uppercase tracking-wider transition-colors"
            >
              📸 View Gallery
            </button>
          )}

          {/* Generate All Button */}
          <button
            onClick={handleGenerateImages}
            disabled={prompts.length === 0 || store.isLoading || generatingScene !== null}
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
              `🎨 GENERATE ALL (${prompts.length}) →`
            )}
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEngineeringPanel;
