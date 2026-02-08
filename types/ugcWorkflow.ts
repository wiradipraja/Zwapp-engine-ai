export type UGCAspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | '3:4';

export type UGCBackgroundCategoryId =
  | 'VIBE_DASAR'
  | 'VARIAN_REALISTIS'
  | 'STUDIO_SPESIFIK'
  | 'INDONESIA_ELEGAN'
  | 'INDONESIA_KELAS_BAWAH';

export interface UGCBackgroundOption {
  id: string;
  label: string;
  category: UGCBackgroundCategoryId;
  promptHintEn: string;
}

export interface UGCBackgroundCategory {
  id: UGCBackgroundCategoryId;
  label: string;
  description: string;
  options: UGCBackgroundOption[];
}

export interface UGCWorkflowInputPayload {
  modelImageUrl: string;
  productImageUrl: string;
  productName: string;
  productShortDescription: string;
  aspectRatioGlobal: UGCAspectRatio;
  backgroundCategory: UGCBackgroundCategoryId;
  backgroundPreset: string;
  tonevoice: string;
  language: 'id';
  campaignTone: string;
  targetAudience?: string;
  contentType?: string;
  brief?: string;
}

export type UGCSceneGoal = 'hook_problem' | 'solution' | 'benefit' | 'cta';

export interface UGCScenePlan {
  scene_number: 1 | 2 | 3 | 4;
  goal: UGCSceneGoal;
  show_product: boolean;
  duration_seconds: number;
  dialogue_id: string;
  dialogue_text_id?: string;
  visual_description_en: string;
  camera_direction_en: string;
  negative_prompt_en: string;
}

export interface UGCPlannerOutput {
  visual_anchor: {
    model_identity_lock: string;
    product_identity_lock: string;
  };
  scenes: UGCScenePlan[];
  caption_id: string;
  hashtags: string[];
}

export type UGCSceneFrameRole = 'scene_start' | 'scene_end';

export interface UGCSceneImageAsset {
  id: string;
  sceneNumber: 1 | 2 | 3 | 4;
  frameRole: UGCSceneFrameRole;
  imageUrl: string;
  sourceModel: string;
  sourceTaskId?: string;
  sourceUrl?: string;
  promptUsed: string;
}

export type UGCVideoMode = 'A_NATIVE' | 'B_ELEVENLABS';

export type UGCVideoProvider =
  | 'veo3_fast'
  | 'veo3'
  | 'grok-imagine/image-to-video'
  | 'sora-2-image-to-video';

export interface UGCVideoAudioSettings {
  videoMode: UGCVideoMode;
  muteNativeAudio: boolean;
  singleSpeakerTonevoice: string;
  dialogueScript: string;
}

export interface UGCSceneVideoAsset {
  id: string;
  sceneNumber: 1 | 2 | 3 | 4;
  provider: UGCVideoProvider;
  videoMode: UGCVideoMode;
  videoUrl: string;
  sourceTaskId: string;
  audioUrl?: string;
  muted: boolean;
  promptUsed: string;
}

export interface UGCVideoPipelineRequest {
  apiKey: string;
  provider: UGCVideoProvider;
  aspectRatio: UGCAspectRatio;
  scenePlan: UGCScenePlan;
  startFrameUrl: string;
  endFrameUrl?: string;
  audio: UGCVideoAudioSettings;
}

export interface UGCSceneSaveSelection {
  sceneNumber: 1 | 2 | 3 | 4;
  selectedStartImage?: UGCSceneImageAsset;
  selectedEndImage?: UGCSceneImageAsset;
  selectedVideo?: UGCSceneVideoAsset;
}
