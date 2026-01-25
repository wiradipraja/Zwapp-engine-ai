// services/videoGeneration.ts
// KIE.AI Veo 3.1 Integration untuk Video Generation

import { GeneratedImage, GeneratedVideo } from '../types/ugc';

const BASE_URL = '/api/proxy';
const JOBS_URL = `${BASE_URL}/jobs`;

export interface VideoGenerationConfig {
  apiKey: string;
  resolution?: '720p' | '1080p' | '1440p';
  frameRate?: 24 | 30 | 60;
  duration?: number; // seconds
  style?: string; // video style description
}

export interface VeoResponse {
  video_url?: string;
  video_base64?: string;
  status: 'success' | 'processing' | 'error';
  message?: string;
  duration?: number;
  resolution?: string;
  frame_rate?: number;
  job_id?: string;
}

/**
 * Generate video from sequence of images using Veo 3.1
 * Creates smooth transitions between images
 */
export async function generateVideoWithVeo(
  images: GeneratedImage[],
  config: VideoGenerationConfig
): Promise<GeneratedVideo> {
  const {
    apiKey,
    resolution = '1080p',
    frameRate = 30,
    duration = images.length * 2, // 2 seconds per image
    style = 'cinematic smooth transitions',
  } = config;

  if (images.length < 2) {
    throw new Error('Need at least 2 images to create video');
  }

  try {
    // Create video generation request
    const response = await fetch(
      `${BASE_URL}/generate/veo-video`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          images: images.map((img) => ({
            url: img.imageUrl,
            duration: duration / images.length,
          })),
          video_style: style,
          resolution,
          frame_rate: frameRate,
          transition_style: 'smooth_fade',
          total_duration: duration,
          quality: 'high',
          include_audio: false, // Can add music separately
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Video generation failed: ${error.message || 'Unknown error'}`
      );
    }

    const data: VeoResponse = await response.json();

    if (data.status !== 'success' && data.status !== 'processing') {
      throw new Error(data.message || 'Video generation error');
    }

    // If processing, poll for completion
    let finalResponse = data;
    if (data.status === 'processing' && data.job_id) {
      finalResponse = await pollVideoStatus(data.job_id, apiKey);
    }

    if (!finalResponse.video_url && !finalResponse.video_base64) {
      throw new Error('No video received from Veo');
    }

    const videoUrl = finalResponse.video_url ||
      (finalResponse.video_base64
        ? `data:video/mp4;base64,${finalResponse.video_base64}`
        : '');

    const generatedVideo: GeneratedVideo = {
      id: crypto.randomUUID(),
      videoUrl,
      supabasePath: `generated-videos/${crypto.randomUUID()}.mp4`,
      duration: finalResponse.duration || duration,
      generatedAt: Date.now(),
      model: 'veo-3.1',
      frameRate: finalResponse.frame_rate || frameRate,
      resolution: finalResponse.resolution || resolution,
      status: 'completed',
    };

    return generatedVideo;
  } catch (error) {
    throw new Error(
      `Video generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Poll for video generation status
 */
async function pollVideoStatus(
  jobId: string,
  apiKey: string,
  maxAttempts: number = 60,
  pollInterval: number = 5000 // 5 seconds
): Promise<VeoResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${JOBS_URL}/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Job status check failed');
      }

      const data: VeoResponse = await response.json();

      if (data.status === 'success' || data.status === 'error') {
        return data;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Poll error:', error);
      if (i === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new Error('Video generation timeout - job did not complete');
}

/**
 * Generate video with custom transitions and effects
 */
export async function generateVideoWithEffects(
  images: GeneratedImage[],
  effects: {
    transitionType?: 'fade' | 'slide' | 'dissolve' | 'zoom';
    duration?: number;
    addMusicUrl?: string;
    includeText?: string[];
    colorGrade?: string;
  },
  config: VideoGenerationConfig
): Promise<GeneratedVideo> {
  const {
    transitionType = 'fade',
    duration = 30,
    addMusicUrl,
    includeText = [],
    colorGrade = 'cinematic',
  } = effects;

  const enhancedConfig = {
    ...config,
    duration,
    style: `${colorGrade} transitions with ${transitionType} effects`,
  };

  // Generate base video
  const baseVideo = await generateVideoWithVeo(images, enhancedConfig);

  // If advanced effects needed, would call additional API
  // For now, return base video with effect metadata
  return {
    ...baseVideo,
    // Additional properties for effect tracking
  };
}

/**
 * Create short-form video for social media (TikTok, Instagram Reels)
 */
export async function generateShortFormVideo(
  images: GeneratedImage[],
  platform: 'tiktok' | 'instagram' | 'youtube_shorts' = 'tiktok',
  config: VideoGenerationConfig
): Promise<GeneratedVideo> {
  const resolutions = {
    tiktok: '1080p', // 1080x1920
    instagram: '1080p', // 1080x1080
    youtube_shorts: '1440p', // 1440x2560
  };

  const shortFormConfig = {
    ...config,
    resolution: resolutions[platform] as '720p' | '1080p' | '1440p',
    frameRate: 30,
    duration: Math.min(60, images.length * 2), // Max 60 seconds
  };

  return generateVideoWithVeo(images, shortFormConfig);
}

/**
 * Estimate cost for video generation
 * Veo 3.1: $2-5 per minute depending on resolution
 */
export function estimateVideoGenerationCost(
  duration: number,
  resolution: string = '1080p'
): number {
  const costPerMinute: Record<string, number> = {
    '720p': 2.0,
    '1080p': 3.5,
    '1440p': 5.0,
  };

  const costPer60Sec = costPerMinute[resolution] || 3.5;
  const durationInMinutes = duration / 60;

  return durationInMinutes * costPer60Sec;
}

/**
 * Estimate time for video generation
 * Generally takes 1-2 minutes per minute of video
 */
export function estimateVideoGenerationTime(
  duration: number,
  imageCount: number
): number {
  // Veo generation time: ~1-2x realtime
  // Plus encoding time: ~30-60 seconds
  const generationTime = duration * 1.5 * 60; // seconds
  const encodingTime = 45; // seconds

  return Math.round((generationTime + encodingTime) / 60); // return in minutes
}

/**
 * Create multi-clip video from multiple image sequences
 */
export async function generateMultiClipVideo(
  imageClusters: GeneratedImage[][], // Array of image sequences (one per clip)
  transitions: string[] = [], // Transition type between clips
  config: VideoGenerationConfig
): Promise<GeneratedVideo> {
  if (imageClusters.length === 0) {
    throw new Error('No image clusters provided');
  }

  // Flatten all images while tracking clip boundaries
  const allImages: GeneratedImage[] = [];
  const clipMarkers: number[] = [];

  imageClusters.forEach((cluster, idx) => {
    clipMarkers.push(allImages.length);
    allImages.push(...cluster);
  });

  const totalDuration = config.duration || allImages.length * 2;
  const durationPerClip = totalDuration / imageClusters.length;

  return generateVideoWithVeo(allImages, {
    ...config,
    duration: totalDuration,
  });
}

/**
 * Check video generation status and progress
 */
export async function getVideoStatus(
  jobId: string,
  apiKey: string
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  videoUrl?: string;
}> {
  try {
      const response = await fetch(
      `${JOBS_URL}/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }

    const data = await response.json();

    return {
      status: data.status as any,
      progress: data.progress || 0,
      estimatedTimeRemaining: data.eta_seconds,
      videoUrl: data.video_url,
    };
  } catch (error) {
    throw new Error(
      `Status check failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Cancel video generation job
 */
export async function cancelVideoGeneration(
  jobId: string,
  apiKey: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${JOBS_URL}/${jobId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Cancellation failed:', error);
    return false;
  }
}

/**
 * Download video file
 */
export async function downloadVideo(
  videoUrl: string,
  filename: string = 'generated-video.mp4'
): Promise<Blob> {
  try {
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error('Failed to download video');
    }

    return await response.blob();
  } catch (error) {
    throw new Error(
      `Download failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Combine multiple videos into one
 */
export async function mergeVideos(
  videoUrls: string[],
  config: VideoGenerationConfig
): Promise<GeneratedVideo> {
  if (videoUrls.length < 2) {
    throw new Error('Need at least 2 videos to merge');
  }

  try {
    const response = await fetch(
      `${BASE_URL}/generate/merge-videos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          videos: videoUrls,
          transition: 'fade',
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Video merge failed');
    }

    const data = await response.json();

    return {
      id: crypto.randomUUID(),
      videoUrl: data.video_url,
      supabasePath: `merged-videos/${crypto.randomUUID()}.mp4`,
      duration: data.duration || 30,
      generatedAt: Date.now(),
      model: 'veo-3.1',
      frameRate: config.frameRate || 30,
      resolution: config.resolution || '1080p',
      status: 'completed',
    };
  } catch (error) {
    throw new Error(
      `Merge failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
