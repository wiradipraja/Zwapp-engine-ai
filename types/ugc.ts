// types/ugc.ts - UGC AI Orchestration Workspace Types

// ============ ENUMS ============
export type WorkflowStage = 
  | 'INPUT' 
  | 'ANALYSIS' 
  | 'SCRIPTING' 
  | 'PROMPTING' 
  | 'GENERATING' 
  | 'QA' 
  | 'VIDEO_GENERATION' 
  | 'COMPLETE';

export type ProjectStatus = 'IDLE' | 'PROCESSING' | 'PAUSED' | 'COMPLETE' | 'ERROR';

// Language options for narration
export type NarrationLanguage = 'EN' | 'ID';

// UGC Content Style
export type UGCContentStyle = 'selfie' | 'cinematic' | 'professional';

export type UGCSceneType =
  | 'S1_MODEL_HOLDING_PRODUCT'
  | 'S2_HAND_ONLY_PRODUCT'
  | 'S3_PRODUCT_STANDALONE_HERO'
  | 'S4_IN_USE_DEMO_ACTION'
  | 'S5_LIFESTYLE_PLACEMENT_CONTEXT';

// PRD 4.2: Comprehensive Dropdown Options
export interface UGCPreferences {
  characterProfile: 'Asian Female 20s' | 'Asian Male 20s' | 'Western Female 20s' | 'Professional Female 30s' | 'Custom';
  outfitStyle: 'Casual T-Shirt' | 'Smart Casual' | 'Sporty/Activewear' | 'Modest Hijab' | 'Formal Business';
  backgroundStyle: 'Living Room' | 'Minimalist Bedroom' | 'Urban Street' | 'Office Desk' | 'Outdoor Park';
  framing: 'Selfie (Close Up)' | 'Half Body (Medium)' | 'Full Body';
  lightingStyle: 'Natural Window' | 'Golden Hour' | 'Soft Studio' | 'Ring Light';
  
  productCategory: 'Skincare' | 'Fashion' | 'F&B' | 'Gadget' | 'Home Living';
  priceRange: 'Budget (<100k)' | 'Affordable (100k-500k)' | 'Premium (>500k)';
  
  platform: 'TikTok' | 'Instagram Reels' | 'YouTube Shorts';
  objective: 'Brand Awareness' | 'Soft Selling' | 'Hard Selling' | 'Educational';
  
  brandTone: 'Excited/Hype' | 'Calm/Healing' | 'Professional/Trust' | 'Friendly/Bestie';
  language: 'ID (Bahasa Gaul)' | 'ID (Formal)' | 'EN (Casual)' | 'EN (Professional)';
  videoDuration: '15s (3 scenes)' | '30s (5 scenes)';
  
  customNote?: string;
}

export const DEFAULT_UGC_PREFERENCES: UGCPreferences = {
  characterProfile: 'Asian Female 20s',
  outfitStyle: 'Casual T-Shirt',
  backgroundStyle: 'Living Room',
  framing: 'Selfie (Close Up)',
  lightingStyle: 'Natural Window',
  productCategory: 'Skincare',
  priceRange: 'Affordable (100k-500k)',
  platform: 'TikTok',
  objective: 'Soft Selling',
  brandTone: 'Friendly/Bestie',
  language: 'ID (Bahasa Gaul)',
  videoDuration: '30s (5 scenes)',
};

export interface UGCContentStyleInfo {
  id: UGCContentStyle;
  name: string;
  description: string;
  promptModifier: string; // Added to image/video prompts
  cameraStyle: string;
}

export const UGC_CONTENT_STYLES: UGCContentStyleInfo[] = [
  {
    id: 'selfie',
    name: 'Selfie Style',
    description: 'Model holding camera, authentic UGC look',
    promptModifier: 'selfie style, model holding smartphone camera, close-up POV shot, authentic UGC content, casual vibe',
    cameraStyle: 'handheld POV'
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Professional filming with cinematic look',
    promptModifier: 'cinematic shot, professional lighting, shallow depth of field, film grain, movie quality',
    cameraStyle: 'cinematic camera movement'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Studio quality, polished presentation',
    promptModifier: 'professional studio shot, clean background, perfect lighting, high-end commercial quality',
    cameraStyle: 'steady professional camera'
  }
];

// ============ ASSETS ============
export interface UploadedAsset {
  id: string;
  fileName: string;
  supabaseUrl: string;
  supabasePath: string;
  size: number; // bytes
  uploadedAt: number;
  type?: 'model' | 'product' | 'moodboard';
  base64?: string; // For API calls
}

export interface InputAssets {
  modelPhotos: UploadedAsset[];
  productPhotos: UploadedAsset[];
  productName?: string;
  narrativeLinks: string[];
  moodboardImages?: UploadedAsset[];
}

// ============ EXTRACTED PROFILES ============
export interface ModelProfile {
  appearance: string;
  poses: string[];
  expressions: string[];
  outfitStyle: string;
  // Extended for service integration
  lookDescription?: string;
  skinTone?: string;
  bodyType?: string;
  facialFeatures?: string;
  expressionStyle?: string;
  referenceImageUrl?: string;
}

export interface ProductProfile {
  name: string;
  colors: string[];
  dimensions: string;
  keyFeatures: string[];
  highlightAngles: string[];
  // Extended for service integration
  category?: string;
  priceRange?: string;
  referenceImageUrl?: string;
}

export interface NarrativeContext {
  brandVoice: string;
  targetAudience: string;
  campaignGoal: string;
  keyMessages: string[];
  competitorAnalysis?: string;
  // Extended for service integration
  productStory?: string;
  culturalContext?: string;
  emotionalTone?: string;
}

// ============ GENERATED CONTENT ============
export interface SceneBreakdown {
  sceneNumber: number;
  description: string;
  modelAction: string;
  modelExpression: string;
  productPlacement: string;
  backgroundDescription: string;
  cameraAngle: string;
  narrativePoint: string;
}

export interface GeneratedScript {
  id?: string;
  hook: string;
  problemStatement: string;
  solution: string;
  cta: string;
  fullNarrative: string;
  sceneBreakdown: SceneBreakdown[];
  // Extended from scriptGeneration service
  title?: string;
  duration?: number;
  scenes?: Array<{
    sceneNumber: number;
    setting: string;
    action: string;
    dialogue: string;
    productPlacement: string;
    emotionalBeat: string;
  }>;
  voiceoverText?: string;
  generatedAt?: number;
  model?: string; // Support any model (gemini-1.5-flash, gpt-4, etc.)
}

export interface VisualStyleGuide {
  cameraSpecs: string;
  lighting: string;
  backgroundStyle: string;
  colorPalette: string[];
  compositions: string[];
}

export interface ConsistencyCheckpoint {
  aspect: 'model_face' | 'product_accuracy' | 'background' | 'style' | 'lighting';
  baseline: string;
  requirement: string;
}

export interface PromptTemplate {
  id?: string;
  sceneId: string;
  sceneNumber?: number;
  sceneDescription?: string;
  sceneType?: UGCSceneType;
  basePrompt: string;
  dynamicVariables: Record<string, string>;
  consistencyCheckpoints: ConsistencyCheckpoint[];
  generatedPrompt: string;
  // Extended for service integration
  visualStyle?: string;
  productIntegration?: string;
  negativePrompts?: string[];
  customizations?: {
    style?: string;
    lighting?: string;
    composition?: string;
  };
}

export interface GeneratedImage {
  id: string;
  sceneId: string;
  sceneNumber?: number;
  prompt: string;
  promptUsed?: string;
  imageUrl: string;
  nanobananaTaskId?: string;
  qualityScore: number;
  issues?: string[];
  createdAt: number;
  // Extended for service integration
  supabasePath?: string;
  generatedAt?: number;
  model?: string;
  consistency?: {
    modelConsistency: number;
    productPlacement: number;
    styleCohesion: number;
    overallQuality: number;
  };
  approved?: boolean;
  regenerationCount?: number;
}

export interface GeneratedVideo {
  id: string;
  imageId: string;
  videoUrl: string;
  veoTaskId?: string;
  duration?: number;
  createdAt: number;
  // Extended for service integration
  supabasePath?: string;
  generatedAt?: number;
  model?: string;
  frameRate?: number;
  resolution?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface QAResult {
  id?: string;
  imageId?: string;
  sceneNumber?: number;
  qualityScore: number;
  issues: string[];
  recommendations: string[];
  timestamp: number;
  // Extended for service integration
  checks?: {
    modelConsistency: { passed: boolean; confidence: number; notes: string };
    productPlacement: { passed: boolean; confidence: number; notes: string };
    styleCohesion: { passed: boolean; confidence: number; notes: string };
    noHallucinations: { passed: boolean; confidence: number; notes: string };
  };
  overallStatus?: 'passed' | 'failed' | 'needs_review';
  suggestedFixes?: string[];
  performedAt?: number;
  analysisModel?: string;
}

// ============ PROJECT ============
export interface UGCProject {
  id: string;
  userId: string;
  projectName: string;
  status: ProjectStatus;
  currentStage: WorkflowStage;
  
  // UGC Settings
  settings: {
    language: NarrationLanguage;
    contentStyle: UGCContentStyle;
    preferences?: UGCPreferences; // Added from PRD
  };
  
  inputAssets: InputAssets;
  extractedContext: {
    modelProfile?: ModelProfile;
    productProfile?: ProductProfile;
    narrativeContext?: NarrativeContext;
  };
  
  generatedContent: {
    script?: GeneratedScript;
    visualStyleGuide?: VisualStyleGuide;
    prompts: PromptTemplate[];
    promptTemplates?: PromptTemplate[]; // Alias for prompts
    images: GeneratedImage[];
    videos: GeneratedVideo[];
  };
  
  qaResults: {
    imageQA: QAResult[];
    overallPassRate?: number;
  };
  
  createdAt: number;
  updatedAt: number;
}

// ============ PROGRESS EVENTS ============
export interface ProgressEvent {
  stage: WorkflowStage;
  progress: number; // 0-100
  status: 'idle' | 'processing' | 'complete' | 'error';
  message?: string;
  sceneNumber?: number;
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
}

// ============ API RESPONSES ============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
