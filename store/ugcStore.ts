// store/ugcStore.ts - UGC State Management

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  UGCProject,
  WorkflowStage,
  ProjectStatus,
  UploadedAsset,
  GeneratedScript,
  VisualStyleGuide,
  PromptTemplate,
  GeneratedImage,
  GeneratedVideo,
  QAResult,
  InputAssets,
  ModelProfile,
  ProductProfile,
  NarrativeContext,
  NarrationLanguage,
  UGCContentStyle,
  DEFAULT_UGC_PREFERENCES,
} from '../types/ugc';

// API Configuration for UGC services
export interface UGCAPIConfig {
  kieApiKey: string;
  geminiApiKey: string;
  visionApiKey: string;
}

interface UGCStoreState {
  // Current project
  currentProject: UGCProject | null;
  
  // API Configuration
  apiConfig: UGCAPIConfig | null;
  
  // Processing state
  processingStage: WorkflowStage | null;
  progressPercent: number;
  progressMessage: string;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  // Debug logs
  debugLogs: string[];
  
  // Actions
  initializeProject: (projectName: string, userId: string) => void;
  
  // API Config
  setApiConfig: (config: UGCAPIConfig) => void;
  
  // Progress tracking
  setProgress: (stage: WorkflowStage | null, percent: number, message: string) => void;
  
  // Settings actions
  setLanguage: (language: NarrationLanguage) => void;
  setContentStyle: (style: UGCContentStyle) => void;
  updateSettings: (settings: Partial<UGCProject['settings']>) => void;
  
  // Input actions
  addModelPhotos: (assets: UploadedAsset[]) => void;
  removeModelPhoto: (assetId: string) => void;
  addProductPhotos: (assets: UploadedAsset[]) => void;
  removeProductPhoto: (assetId: string) => void;
  addNarrativeLink: (link: string) => void;
  removeNarrativeLink: (link: string) => void;
  
  // Context extraction
  setExtractedContext: (context: {
    modelProfile?: ModelProfile;
    productProfile?: ProductProfile;
    narrativeContext?: NarrativeContext;
  }) => void;
  
  // Content generation
  setGeneratedScript: (script: GeneratedScript) => void;
  setVisualStyleGuide: (guide: VisualStyleGuide) => void;
  clearPrompts: () => void;
  addPrompt: (prompt: PromptTemplate) => void;
  updatePrompt: (sceneId: string, prompt: PromptTemplate) => void;
  
  addGeneratedImage: (image: GeneratedImage) => void;
  updateGeneratedImage: (imageId: string, updates: Partial<GeneratedImage>) => void;
  
  addGeneratedVideo: (video: GeneratedVideo) => void;
  
  // QA
  setQAResult: (imageId: string, result: QAResult) => void;
  setQAResults: (results: QAResult[], overallPassRate?: number) => void;
  
  // Stage management
  setCurrentStage: (stage: WorkflowStage) => void;
  setStatus: (status: ProjectStatus) => void;
  
  // UI state management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;

  // Debug log actions
  addDebugLog: (message: string) => void;
  clearDebugLogs: () => void;
  
  // Project management
  resetProject: () => void;
  loadProject: (project: UGCProject) => void;
  resetGeneratedOutputs: () => void;
}

export const useUGCStore = create<UGCStoreState>()(
  devtools((set, get) => ({
    currentProject: null,
    apiConfig: null,
    processingStage: null,
    progressPercent: 0,
    progressMessage: '',
    isLoading: false,
    error: null,
    successMessage: null,
    debugLogs: [],
    
    setApiConfig: (config) => set({ apiConfig: config }),
    
    setProgress: (stage, percent, message) => set({
      processingStage: stage,
      progressPercent: percent,
      progressMessage: message
    }),
    
    initializeProject: (projectName, userId) => {
      const newProject: UGCProject = {
        id: crypto.randomUUID(),
        userId,
        projectName,
        status: 'IDLE',
        currentStage: 'INPUT',
        settings: {
          language: 'EN',
          contentStyle: 'selfie',
          preferences: { ...DEFAULT_UGC_PREFERENCES },
        },
        inputAssets: {
          modelPhotos: [],
          productPhotos: [],
          narrativeLinks: [],
        },
        extractedContext: {},
        generatedContent: {
          prompts: [],
          promptTemplates: [],
          images: [],
          videos: [],
        },
        qaResults: {
          imageQA: [],
          overallPassRate: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      set({ currentProject: newProject, debugLogs: [] });
    },
    
    setLanguage: (language) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            settings: {
              ...state.currentProject.settings,
              language,
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    setContentStyle: (style) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            settings: {
              ...state.currentProject.settings,
              contentStyle: style,
            },
            updatedAt: Date.now(),
          },
        };
      }),

    updateSettings: (settings) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            settings: {
              ...state.currentProject.settings,
              ...settings,
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    addModelPhotos: (assets) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            inputAssets: {
              ...state.currentProject.inputAssets,
              modelPhotos: [...state.currentProject.inputAssets.modelPhotos, ...assets],
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    removeModelPhoto: (assetId) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            inputAssets: {
              ...state.currentProject.inputAssets,
              modelPhotos: state.currentProject.inputAssets.modelPhotos.filter(
                (a) => a.id !== assetId
              ),
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    addProductPhotos: (assets) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            inputAssets: {
              ...state.currentProject.inputAssets,
              productPhotos: [...state.currentProject.inputAssets.productPhotos, ...assets],
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    removeProductPhoto: (assetId) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            inputAssets: {
              ...state.currentProject.inputAssets,
              productPhotos: state.currentProject.inputAssets.productPhotos.filter(
                (a) => a.id !== assetId
              ),
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    addNarrativeLink: (link) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            inputAssets: {
              ...state.currentProject.inputAssets,
              narrativeLinks: [...state.currentProject.inputAssets.narrativeLinks, link],
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    removeNarrativeLink: (link) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            inputAssets: {
              ...state.currentProject.inputAssets,
              narrativeLinks: state.currentProject.inputAssets.narrativeLinks.filter(
                (l) => l !== link
              ),
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    setExtractedContext: (context) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            extractedContext: {
              ...state.currentProject.extractedContext,
              ...context,
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    setGeneratedScript: (script) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            generatedContent: {
              ...state.currentProject.generatedContent,
              script,
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    setVisualStyleGuide: (guide) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            generatedContent: {
              ...state.currentProject.generatedContent,
              visualStyleGuide: guide,
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    addPrompt: (prompt) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            generatedContent: {
              ...state.currentProject.generatedContent,
              prompts: [...state.currentProject.generatedContent.prompts, prompt],
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    clearPrompts: () =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            generatedContent: {
              ...state.currentProject.generatedContent,
              prompts: [],
              promptTemplates: [],
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    updatePrompt: (sceneId, prompt) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            generatedContent: {
              ...state.currentProject.generatedContent,
              prompts: state.currentProject.generatedContent.prompts.map((p) =>
                p.sceneId === sceneId ? prompt : p
              ),
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    addGeneratedImage: (image) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            generatedContent: {
              ...state.currentProject.generatedContent,
              images: [...state.currentProject.generatedContent.images, image],
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    updateGeneratedImage: (imageId, updates) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            generatedContent: {
              ...state.currentProject.generatedContent,
              images: state.currentProject.generatedContent.images.map((img) =>
                img.id === imageId ? { ...img, ...updates } : img
              ),
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    addGeneratedVideo: (video) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            generatedContent: {
              ...state.currentProject.generatedContent,
              videos: [...state.currentProject.generatedContent.videos, video],
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    setQAResult: (imageId, result) =>
      set((state) => {
        if (!state.currentProject) return {};
        const existing = state.currentProject.qaResults.imageQA || [];
        const updated = existing.some(r => r.imageId === imageId)
          ? existing.map(r => (r.imageId === imageId ? result : r))
          : [...existing, result];

        return {
          currentProject: {
            ...state.currentProject,
            qaResults: {
              ...state.currentProject.qaResults,
              imageQA: updated,
            },
            updatedAt: Date.now(),
          },
        };
      }),

    setQAResults: (results, overallPassRate) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            qaResults: {
              imageQA: results,
              overallPassRate: overallPassRate ?? state.currentProject.qaResults.overallPassRate ?? 0,
            },
            updatedAt: Date.now(),
          },
        };
      }),
    
    setCurrentStage: (stage) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            currentStage: stage,
            updatedAt: Date.now(),
          },
        };
      }),
    
    setStatus: (status) =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            status,
            updatedAt: Date.now(),
          },
        };
      }),
    
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setSuccessMessage: (message) => set({ successMessage: message }),
    addDebugLog: (message) =>
      set((state) => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `${timestamp} - ${message}`;
        const nextLogs = [...state.debugLogs, entry];
        return { debugLogs: nextLogs.slice(-200) };
      }),
    clearDebugLogs: () => set({ debugLogs: [] }),
    
    resetProject: () => set({ currentProject: null, error: null, successMessage: null, debugLogs: [] }),
    
    loadProject: (project) =>
      set({
        currentProject: {
          ...project,
          settings: {
            ...project.settings,
            preferences: project.settings.preferences || { ...DEFAULT_UGC_PREFERENCES },
          },
          qaResults: {
            imageQA: project.qaResults?.imageQA || [],
            overallPassRate: project.qaResults?.overallPassRate || 0,
          },
        },
        debugLogs: [],
      }),

    resetGeneratedOutputs: () =>
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            generatedContent: {
              ...state.currentProject.generatedContent,
              images: [],
              videos: [],
            },
            qaResults: {
              imageQA: [],
              overallPassRate: 0,
            },
            updatedAt: Date.now(),
          },
        };
      }),
  }))
);
