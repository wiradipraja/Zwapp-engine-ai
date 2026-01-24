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

// Flex Image API Types (Legacy - kept for backward compatibility)
export interface FlexImageInput {
  prompt: string;
  image_urls: string[]; // Reference images (up to 4, Supabase URLs)
  aspect_ratio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '21:9' | '9:21';
  output_format: 'png' | 'jpeg';
  safety_tolerance: 1 | 2 | 3 | 4 | 5 | 6; // 1=strict, 6=permissive
}

// ==================== FLUX 2 PRO API Types ====================
// Flux 2 Pro - Text to Image
export interface Flux2ProTextInput {
  prompt: string;
  image_size?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  num_inference_steps?: number; // 1-50, default 28
  seed?: number;
  guidance_scale?: number; // 1.5-5, default 3.5
  num_images?: number; // 1-4, default 1
  enable_safety_checker?: boolean;
  output_format?: 'jpeg' | 'png';
  sync_mode?: boolean;
}

// Flux 2 Pro - Image to Image
export interface Flux2ProImageInput {
  prompt: string;
  image_url: string; // Input image for transformation
  strength?: number; // 0-1, default 0.95
  image_size?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  num_inference_steps?: number; // 1-50, default 28
  seed?: number;
  guidance_scale?: number; // 1.5-5, default 3.5
  num_images?: number; // 1-4, default 1
  enable_safety_checker?: boolean;
  output_format?: 'jpeg' | 'png';
  sync_mode?: boolean;
}

// ==================== FLUX 2 FLEX API Types ====================
// Flux 2 Flex - Text to Image (with reference images)
export interface Flux2FlexTextInput {
  prompt: string;
  image_urls: string[]; // Up to 4 reference images
  aspect_ratio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '21:9' | '9:21';
  num_images?: number; // 1-4, default 1
  enable_safety_checker?: boolean;
  safety_tolerance?: 1 | 2 | 3 | 4 | 5 | 6;
  output_format?: 'jpeg' | 'png';
  sync_mode?: boolean;
}

// Flux 2 Flex - Image to Image
export interface Flux2FlexImageInput {
  prompt: string;
  image_url: string; // Input image for transformation
  image_urls?: string[]; // Additional reference images (up to 4)
  strength?: number; // 0-1, transformation strength
  aspect_ratio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '21:9' | '9:21';
  num_images?: number; // 1-4, default 1
  enable_safety_checker?: boolean;
  safety_tolerance?: 1 | 2 | 3 | 4 | 5 | 6;
  output_format?: 'jpeg' | 'png';
  sync_mode?: boolean;
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