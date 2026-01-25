// components/UGC/UGCOrchestrationWorkspace.tsx

import React, { useState, useEffect } from 'react';
import { useUGCStore } from '../../store/ugcStore';
import { WorkflowStage } from '../../types/ugc';
import {
  analyzeInputAssets,
  generateUGCScript,
  generatePromptsFromScript,
  generateUGCImages,
  runQualityAssurance,
  generateUGCVideo,
  calculateOverallPassRate,
} from '../../services/ugcIntegration';
import InputModule from './stages/InputModule';
import ScriptReviewPanel from './stages/ScriptReviewPanel';
import PromptEngineeringPanel from './stages/PromptEngineeringPanel';
import ImageGalleryView from './stages/ImageGalleryView';
import QAResultsPanel from './stages/QAResultsPanel';
import VideoGenerationPanel from './stages/VideoGenerationPanel';

interface UGCOrchestrationWorkspaceProps {
  apiKey?: string;
  geminiApiKey?: string;
}

const UGCOrchestrationWorkspace: React.FC<UGCOrchestrationWorkspaceProps> = ({
  apiKey,
  geminiApiKey,
}) => {
  const store = useUGCStore();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey || '');
  const [localKieKey, setLocalKieKey] = useState(apiKey || '');

  useEffect(() => {
    const storedGeminiKey = localStorage.getItem('gemini_api_key') || geminiApiKey || '';
    const storedKieKey = localStorage.getItem('kie_api_key') || apiKey || '';
    
    setLocalGeminiKey(storedGeminiKey);
    setLocalKieKey(storedKieKey);
    
    if (storedGeminiKey || storedKieKey) {
      store.setApiConfig({
        geminiApiKey: storedGeminiKey,
        kieApiKey: storedKieKey,
        visionApiKey: '',
      });
    }
  }, [apiKey, geminiApiKey]);

  const handleAnalyzeAndGenerate = async () => {
    if (!store.currentProject) return;
    
    if (!localGeminiKey) {
      setShowApiKeyModal(true);
      store.setError('Gemini API Key diperlukan untuk generate script');
      return;
    }

    store.setLoading(true);
    store.setStatus('PROCESSING');
    store.setCurrentStage('ANALYSIS');

    try {
      store.setProgress('ANALYSIS', 10, 'Analyzing input assets...');
      
      const { modelProfile, productProfile, narrativeContext } = await analyzeInputAssets(
        store.currentProject,
        { kieApiKey: localKieKey, geminiApiKey: localGeminiKey },
        (msg, pct) => store.setProgress('ANALYSIS', pct, msg)
      );

      store.setExtractedContext({ modelProfile, productProfile, narrativeContext });
      store.setProgress('SCRIPTING', 0, 'Starting script generation...');
      store.setCurrentStage('SCRIPTING');
      
      // Get language and style settings from project
      const projectSettings = store.currentProject?.settings;
      
      const script = await generateUGCScript(
        modelProfile,
        productProfile,
        narrativeContext,
        { kieApiKey: localKieKey, geminiApiKey: localGeminiKey },
        (msg, pct) => store.setProgress('SCRIPTING', pct, msg),
        { 
          language: projectSettings?.language || 'EN', 
          contentStyle: projectSettings?.contentStyle || 'selfie',
          preferences: projectSettings?.preferences
        }
      );

      store.setGeneratedScript(script);
      const prompts = generatePromptsFromScript(script, modelProfile, productProfile, projectSettings?.preferences);
      prompts.forEach(prompt => store.addPrompt(prompt));

      store.setSuccessMessage('Analysis and script generation complete!');
      store.setLoading(false);
    } catch (error) {
      console.error('Analysis error:', error);
      store.setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      store.setLoading(false);
      store.setCurrentStage('INPUT');
    }
  };

  const handleGenerateImages = async () => {
    if (!store.currentProject) return;
    
    if (!localKieKey) {
      store.setError('KIE API Key diperlukan untuk generate images');
      return;
    }

    const prompts = store.currentProject.generatedContent.prompts || 
                    store.currentProject.generatedContent.promptTemplates || [];
    
    if (prompts.length === 0) {
      store.setError('No prompts available for image generation');
      return;
    }

    store.setLoading(true);
    store.setCurrentStage('GENERATING');

    try {
      const modelPhoto = store.currentProject.inputAssets.modelPhotos[0];
      const productPhoto = store.currentProject.inputAssets.productPhotos[0];

      const images = await generateUGCImages(
        prompts, modelPhoto, productPhoto,
        { kieApiKey: localKieKey, geminiApiKey: localGeminiKey },
        (msg, pct) => store.setProgress('GENERATING', pct, msg)
      );

      images.forEach(image => store.addGeneratedImage(image));
      store.setSuccessMessage(`Generated ${images.length} images!`);
      store.setLoading(false);
    } catch (error) {
      console.error('Image generation error:', error);
      store.setError(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      store.setLoading(false);
    }
  };

  const handleRunQA = async () => {
    if (!store.currentProject) return;

    const images = store.currentProject.generatedContent.images;
    if (images.length === 0) {
      store.setError('No images to analyze');
      return;
    }

    store.setLoading(true);
    store.setCurrentStage('QA');

    try {
      const qaResults = await runQualityAssurance(
        images,
        store.currentProject.extractedContext.modelProfile!,
        store.currentProject.extractedContext.productProfile!,
        { kieApiKey: localKieKey, geminiApiKey: localGeminiKey },
        (msg, pct) => store.setProgress('QA', pct, msg)
      );

      qaResults.forEach(result => {
        if (result.imageId) store.setQAResult(result.imageId, result);
      });

      const passRate = calculateOverallPassRate(qaResults);
      store.setSuccessMessage(`QA Complete! Pass rate: ${passRate}%`);
      store.setLoading(false);
    } catch (error) {
      console.error('QA error:', error);
      store.setError(`QA failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      store.setLoading(false);
    }
  };

  const handleGenerateVideo = async (engine: string = 'veo3') => {
    if (!store.currentProject) return;

    if (!localKieKey) {
      store.setError('KIE API Key diperlukan untuk generate video');
      return;
    }

    const images = store.currentProject.generatedContent.images.filter(img => img.approved !== false);
    
    if (images.length < 2) {
      store.setError('Need at least 2 images to generate video');
      return;
    }

    store.setLoading(true);
    store.setCurrentStage('VIDEO_GENERATION');

    try {
      store.setProgress('VIDEO_GENERATION', 10, `Initializing ${engine.toUpperCase()}...`);
      
      const video = await generateUGCVideo(
        images,
        { kieApiKey: localKieKey, geminiApiKey: localGeminiKey },
        { resolution: '1080p', frameRate: 30, engine },
        (msg, pct) => store.setProgress('VIDEO_GENERATION', pct, msg)
      );

      store.addGeneratedVideo(video);
      store.setSuccessMessage(`Video generated successfully with ${engine.toUpperCase()}!`);
      store.setLoading(false);
    } catch (error) {
      console.error('Video generation error:', error);
      store.setError(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      store.setLoading(false);
    }
  };

  const handleSaveApiKeys = () => {
    localStorage.setItem('gemini_api_key', localGeminiKey);
    localStorage.setItem('kie_api_key', localKieKey);
    store.setApiConfig({ geminiApiKey: localGeminiKey, kieApiKey: localKieKey, visionApiKey: '' });
    setShowApiKeyModal(false);
    store.setSuccessMessage('API Keys saved successfully!');
  };

  const stageOrder: WorkflowStage[] = [
    'INPUT', 'ANALYSIS', 'SCRIPTING', 'PROMPTING', 'GENERATING', 'QA', 'VIDEO_GENERATION', 'COMPLETE'
  ];
  const stageLabels: Record<WorkflowStage, string> = {
    INPUT: 'INPUT', ANALYSIS: 'ANALYZE', SCRIPTING: 'SCRIPT', PROMPTING: 'PROMPT',
    GENERATING: 'GENERATE', QA: 'QA CHECK', VIDEO_GENERATION: 'VIDEO', COMPLETE: 'COMPLETE',
  };

  // New Project Screen
  if (!store.currentProject) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-600 flex items-center justify-center">
            <span className="text-3xl">🎬</span>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-white mb-2">UGC AI Orchestration</h1>
          <p className="text-zinc-500 text-sm font-mono mb-8">Create professional UGC content with AI-powered consistency control</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={() => {
                const userId = localStorage.getItem('userId') || 'anonymous-user';
                store.initializeProject('New UGC Campaign', userId);
              }}
              className="relative font-bold uppercase tracking-wider py-3 px-6 bg-orange-600 hover:bg-orange-500 text-black border-l-4 border-orange-800 transition-all"
            >
              <span className="flex items-center justify-center gap-2"><span>✨</span><span>NEW PROJECT</span></span>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
            </button>
            <button className="relative font-bold uppercase tracking-wider py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-orange-500 border border-orange-500/30 transition-all">
              <span className="flex items-center justify-center gap-2"><span>📂</span><span>LOAD PROJECT</span></span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStageIndex = stageOrder.indexOf(store.currentProject.currentStage);
  const progressPercent = ((currentStageIndex + 1) / stageOrder.length) * 100;

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 p-6 max-w-md w-full mx-4 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 bg-orange-500 animate-pulse"></div>
              <h3 className="text-lg font-bold uppercase tracking-widest text-white">API Configuration</h3>
            </div>
            <p className="text-sm text-zinc-500 font-mono mb-4">Enter your API keys to enable AI features</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase">Google Gemini API Key (FREE)</label>
                <input type="password" value={localGeminiKey} onChange={(e) => setLocalGeminiKey(e.target.value)} placeholder="AIza..."
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-sm" />
                <p className="text-xs text-zinc-600 mt-1 font-mono">Get free API key at: aistudio.google.com</p>
              </div>
              <div>
                <label className="block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase">KIE.AI API Key</label>
                <input type="password" value={localKieKey} onChange={(e) => setLocalKieKey(e.target.value)} placeholder="Your KIE API key"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowApiKeyModal(false)} className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors">Cancel</button>
              <button onClick={handleSaveApiKeys} className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-500 text-black font-bold uppercase tracking-wider transition-colors">Save Keys</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-orange-500 animate-pulse"></div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-widest text-white">{store.currentProject.projectName}</h1>
              <p className="text-xs text-zinc-600 font-mono uppercase">Stage: {stageLabels[store.currentProject.currentStage]}{store.progressMessage && ` // ${store.progressMessage}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowApiKeyModal(true)} className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all" title="API Keys">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
            </button>
            <button onClick={() => store.resetProject()} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 border border-transparent hover:border-red-900 transition-all" title="Exit Project">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-zinc-800 h-1">
            <div className="bg-orange-600 h-1 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between">
            {stageOrder.map((stage, index) => (
              <div key={stage} className={`text-[10px] font-mono uppercase tracking-wider ${index <= currentStageIndex ? 'text-orange-500' : 'text-zinc-600'}`}>
                {index < currentStageIndex ? '✓' : index === currentStageIndex ? '●' : '○'}
              </div>
            ))}
          </div>
        </div>
        {/* Processing Progress */}
        {store.isLoading && store.progressPercent > 0 && (
          <div className="mt-3 bg-zinc-950 border border-zinc-700 p-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-2">
              <span>{store.progressMessage || 'Processing...'}</span>
              <span className="text-orange-500">{store.progressPercent}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1">
              <div className="bg-orange-500 h-1 transition-all duration-300" style={{ width: `${store.progressPercent}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6">
        {store.currentProject.currentStage === 'INPUT' && <InputModule onStartGeneration={handleAnalyzeAndGenerate} />}
        {store.currentProject.currentStage === 'ANALYSIS' && <AnalysisLoading />}
        {store.currentProject.currentStage === 'SCRIPTING' && <ScriptReviewPanel />}
        {store.currentProject.currentStage === 'PROMPTING' && <PromptEngineeringPanel onGenerateImages={handleGenerateImages} />}
        {store.currentProject.currentStage === 'GENERATING' && <ImageGalleryView onRunQA={handleRunQA} />}
        {store.currentProject.currentStage === 'QA' && <QAResultsPanel onContinue={() => store.setCurrentStage('VIDEO_GENERATION')} />}
        {store.currentProject.currentStage === 'VIDEO_GENERATION' && <VideoGenerationPanel onGenerateVideo={handleGenerateVideo} />}
        {store.currentProject.currentStage === 'COMPLETE' && <CompleteScreen />}
      </div>

      {/* Toast Notifications */}
      {store.error && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-700 text-red-200 px-4 py-3 flex items-center gap-3 max-w-sm z-50">
          <span className="text-xl">✕</span>
          <p className="text-sm font-mono">{store.error}</p>
          <button onClick={() => store.setError(null)} className="ml-auto hover:text-white">✕</button>
        </div>
      )}
      {store.successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-900/90 border border-green-700 text-green-200 px-4 py-3 flex items-center gap-3 max-w-sm z-50">
          <span className="text-xl">✓</span>
          <p className="text-sm font-mono">{store.successMessage}</p>
          <button onClick={() => store.setSuccessMessage(null)} className="ml-auto hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
};

const AnalysisLoading: React.FC = () => (
  <div className="text-center py-12">
    <div className="inline-block mb-4">
      <div className="w-16 h-16 border-4 border-zinc-700 border-t-orange-500 rounded-full animate-spin"></div>
    </div>
    <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-2">Analyzing Inputs</h3>
    <p className="text-zinc-500 text-sm font-mono">Extracting model profile, product details, and brand context...</p>
    <div className="mt-6 space-y-2 text-xs font-mono">
      <p className="text-green-500">✓ ANALYZING MODEL PHOTOS</p>
      <p className="text-green-500">✓ ANALYZING PRODUCT PHOTOS</p>
      <p className="text-orange-500 animate-pulse">⏳ PARSING NARRATIVE LINKS</p>
    </div>
  </div>
);

const CompleteScreen: React.FC = () => {
  const store = useUGCStore();
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
        <span className="text-4xl">🎉</span>
      </div>
      <h3 className="text-2xl font-bold uppercase tracking-widest text-white mb-2">Project Complete</h3>
      <p className="text-zinc-500 text-sm font-mono mb-8">Your UGC content has been generated and is ready for download</p>
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
        <div className="bg-zinc-800 border border-zinc-700 p-4">
          <div className="text-2xl font-bold text-orange-500 font-mono">{store.currentProject?.generatedContent.images.length || 0}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Images</div>
        </div>
        <div className="bg-zinc-800 border border-zinc-700 p-4">
          <div className="text-2xl font-bold text-orange-500 font-mono">{store.currentProject?.generatedContent.videos.length || 0}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Videos</div>
        </div>
        <div className="bg-zinc-800 border border-zinc-700 p-4">
          <div className="text-2xl font-bold text-green-500 font-mono">1</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Script</div>
        </div>
      </div>
      <button onClick={() => store.resetProject()} className="relative font-bold uppercase tracking-wider py-3 px-6 bg-orange-600 hover:bg-orange-500 text-black border-l-4 border-orange-800 transition-all">
        ✨ START NEW PROJECT
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
      </button>
    </div>
  );
};

export default UGCOrchestrationWorkspace;
