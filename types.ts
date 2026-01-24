export interface MotionControlInput {
  prompt: string;
  input_urls: string[];
  video_urls: string[];
  character_orientation: 'image' | 'video';
  mode: '720p' | '1080p';
}

export interface NanoBananaGenInput {
  prompt: string;
  output_format: 'png' | 'jpeg';
  image_size: '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9' | 'auto';
}

export interface NanoBananaEditInput {
  prompt: string;
  image_urls: string[];
  output_format: 'png' | 'jpeg';
  image_size: '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9' | 'auto';
}

export interface NanoBananaProInput {
  prompt: string;
  image_input: string[];
  aspect_ratio: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' | 'auto';
  resolution: '1K' | '2K' | '4K';
  output_format: 'png' | 'jpg';
}

export type NanoBananaInput = NanoBananaGenInput | NanoBananaEditInput | NanoBananaProInput;

export interface ImageEditInput {
  prompt: string;
  image_url: string;
  strength?: number;
  negative_prompt?: string;
  image_size?: string;
  output_format?: 'png' | 'jpeg';
  acceleration?: 'none' | 'regular' | 'high';
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  enable_safety_checker?: boolean;
  sync_mode?: boolean;
  num_images?: string;
}

export interface ZImageInput {
  prompt: string;
  aspect_ratio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
}

// ==================== QWEN API Types ====================
// According to KIE.AI API Documentation

// Qwen Text To Image (qwen/text-to-image)
export interface QwenTextToImageInput {
  prompt: string; // Max 5000 characters
  image_size?: 'square' | 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  num_inference_steps?: number; // 2-250, default: 30
  seed?: number;
  guidance_scale?: number; // 0-20, default: 2.5
  enable_safety_checker?: boolean; // default: true
  output_format?: 'png' | 'jpeg';
  negative_prompt?: string; // Max 500 characters
  acceleration?: 'none' | 'regular' | 'high';
}

// Qwen Image To Image (qwen/image-to-image) - currently ImageEditInput
// Re-export for clarity
export type QwenImageToImageInput = ImageEditInput;

export type QwenInput = QwenTextToImageInput | QwenImageToImageInput;

// ==================== FLUX 2 PRO API Types ====================
// According to KIE.AI API Documentation

// Flux 2 Pro - Text to Image (flux-2/pro-text-to-image)
export interface Flux2ProTextInput {
  prompt: string; // 3-5000 characters
  aspect_ratio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3' | 'auto';
  resolution: '1K' | '2K';
}

// Flux 2 Pro - Image to Image (flux-2/pro-image-to-image)
export interface Flux2ProImageInput {
  input_urls: string[]; // 1-8 images (max 10MB each, jpeg/png/webp)
  prompt: string; // 3-5000 characters
  aspect_ratio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3' | 'auto';
  resolution: '1K' | '2K';
}

// ==================== FLUX 2 FLEX API Types ====================
// According to KIE.AI API Documentation

// Flux 2 Flex - Text to Image (flux-2/flex-text-to-image)
export interface Flux2FlexTextInput {
  prompt: string; // 3-5000 characters
  aspect_ratio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3' | 'auto';
  resolution: '1K' | '2K';
}

// Flux 2 Flex - Image to Image (flux-2/flex-image-to-image)
export interface Flux2FlexImageInput {
  input_urls: string[]; // 1-8 images (max 10MB each, jpeg/png/webp)
  prompt: string; // 3-5000 characters
  aspect_ratio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3' | 'auto';
  resolution: '1K' | '2K';
}

export type Flux2Input = Flux2ProTextInput | Flux2ProImageInput | Flux2FlexTextInput | Flux2FlexImageInput;

export interface CreateTaskRequest {
  model: string; 
  input: MotionControlInput | NanoBananaInput | ImageEditInput | ZImageInput | FlexImageInput | Flux2Input;
  callBackUrl?: string;
}

export interface CreateTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface TaskRecordInfo {
  taskId: string;
  model: string;
  state: 'waiting' | 'success' | 'fail';
  param: string; // JSON string
  resultJson?: string; // JSON string containing results
  failCode?: string | null;
  failMsg?: string | null;
  costTime?: number | null;
  completeTime?: number | null;
  createTime: number;
}

export interface LocalTask extends TaskRecordInfo {
  progress: number; // 0-100
  isRead: boolean;
  queuePosition?: number;
}

export interface QueryTaskResponse {
  code: number;
  msg: string;
  data: TaskRecordInfo;
}

export interface ParsedResult {
  resultUrls: string[];
}

export interface ApiConfig {
  apiKey: string;
}