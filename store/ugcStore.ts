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
  
  // Actions
  initializeProject: (projectName: string, userId: string) => void;
  
  // API Config
  setApiConfig: (config: UGCAPIConfig) => void;
  
  // Progress tracking
  setProgress: (stage: WorkflowStage | null, percent: number, message: string) => void;
  
  // Settings actions
  setLanguage: (language: NarrationLanguage) => void;
  setContentStyle: (style: UGCContentStyle) => void;
  
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
  addPrompt: (prompt: PromptTemplate) => void;
  updatePrompt: (sceneId: string, prompt: PromptTemplate) => void;
  
  addGeneratedImage: (image: GeneratedImage) => void;
  updateGeneratedImage: (imageId: string, updates: Partial<GeneratedImage>) => void;
  
  addGeneratedVideo: (video: GeneratedVideo) => void;
  
  // QA
  setQAResult: (imageId: string, result: QAResult) => void;
  
  // Stage management
  setCurrentStage: (stage: WorkflowStage) => void;
  setStatus: (status: ProjectStatus) => void;
  
  // UI state management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  
  // Project management
  resetProject: () => void;
  loadProject: (project: UGCProject) => void;
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
      
      set({ currentProject: newProject });
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
        return {
          currentProject: {
            ...state.currentProject,
            qaResults: {
              ...state.currentProject.qaResults,
              [imageId]: result,
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
    
    resetProject: () => set({ currentProject: null, error: null, successMessage: null }),
    
    loadProject: (project) => set({ currentProject: project }),
  }))
);
