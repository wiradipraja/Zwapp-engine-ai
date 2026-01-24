/**
 * Veo 3.1 Video Generation Service
 * Endpoint: POST https://api.kie.ai/api/v1/veo/generate
 * 
 * Different from regular KIE.AI endpoint - uses dedicated Veo API
 */

import { Veo3TextToVideoInput, Veo3ImageToVideoInput, Veo3ReferenceToVideoInput, Veo3Input } from '../types';

// Use proxy to avoid CORS
const VEO3_ENDPOINT = '/api/proxy/veo/generate';

export interface Veo3Response {
  code: number;
  msg: string;
  data?: {
    taskId: string;
  };
}

/**
 * Generate Veo 3.1 Video
 * Supports Text→Video, Image→Video, and Reference→Video modes
 */
export const generateVeo3Video = async (input: Veo3Input): Promise<Veo3Response> => {
  // Get API key from localStorage
  const apiKey = localStorage.getItem('kie_api_key');
  if (!apiKey) {
    throw new Error('API Key required. Please configure in Settings.');
  }

  const response = await fetch(VEO3_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || `Veo 3.1 API Error: ${response.status}`);
  }

  return response.json();
};

/**
 * Generate Text to Video using Veo 3.1
 */
export const generateVeo3TextToVideo = async (input: Veo3TextToVideoInput): Promise<Veo3Response> => {
  return generateVeo3Video({
    ...input,
    generationType: 'TEXT_2_VIDEO',
  });
};

/**
 * Generate Image to Video using Veo 3.1
 * Supports 1-2 images (First frame / First+Last frame transition)
 */
export const generateVeo3ImageToVideo = async (input: Veo3ImageToVideoInput): Promise<Veo3Response> => {
  return generateVeo3Video({
    ...input,
    generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
  });
};

/**
 * Generate Reference/Material to Video using Veo 3.1
 * Only supports veo3_fast model and 16:9/9:16 aspect ratios
 */
export const generateVeo3ReferenceToVideo = async (input: Veo3ReferenceToVideoInput): Promise<Veo3Response> => {
  return generateVeo3Video({
    ...input,
    model: 'veo3_fast', // Force fast model
    generationType: 'REFERENCE_2_VIDEO',
  });
};

export default {
  generateVeo3Video,
  generateVeo3TextToVideo,
  generateVeo3ImageToVideo,
  generateVeo3ReferenceToVideo,
};
