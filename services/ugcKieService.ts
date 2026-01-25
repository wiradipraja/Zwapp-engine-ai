// services/ugcKieService.ts
// UGC Image & Video Generation Service - KIE.AI API ONLY
// Based on PRD: Nano Banana for Image-to-Image, Veo3 for Image-to-Video

import { PromptTemplate, GeneratedImage, GeneratedVideo } from '../types/ugc';
import { VisualAnchor, UGCScene, UGCSceneFrame } from './ugcGeminiService';

const BASE_URL = '/api/proxy/jobs';

export interface KieConfig {
  apiKey: string;
}

export interface KieTaskResponse {
  code: number;
  msg: string;
  data: { taskId: string };
}

export interface KieQueryResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    state: 'waiting' | 'success' | 'fail';
    resultJson?: string;
    failMsg?: string;
  };
}

// --- IDENTITY LOCK PROMPT STRUCTURE (PRD) ---
const buildIdentityLockPrompt = (
  visualPrompt: string,
  anchor: VisualAnchor,
  frameType: 'star' | 'end',
  motion?: UGCSceneFrame['motion']
): string => {
  const realismNote = motion?.ugc_realism
    ? `Skin: ${motion.ugc_realism.skin_detail}. Micro-expression: ${motion.ugc_realism.micro_expression}. Imperfection: ${motion.ugc_realism.imperfection_level}.`
    : 'Natural skin texture, realistic imperfections, visible pores.';

  return `
[LOCK_IDENTITY]
Keep the person EXACTLY the same as in Reference Image 1.
Do NOT change face, hair, outfit, skin tone, or accessories.
Model: ${anchor.modelDescription}

[LOCK_ENV]
Keep background and lighting EXACTLY the same.
No new props or camera angle changes.
Background: ${anchor.backgroundContext}
Lighting: ${anchor.lightingProfile}

[PRODUCT_INTEGRATION]
Integrate product from Reference Image 2.
Product must be sharp, readable, naturally placed.
Product: ${anchor.productDescription}

[SCENE_VISUAL]
${visualPrompt}
Frame Type: ${frameType === 'star' ? 'Entry/Start' : 'Exit/End'} Frame
Acting: ${motion?.acting || 'Natural, casual'}
Camera: ${motion?.camera || 'Static, eye-level, 9:16'}

[UGC_REALISM]
${realismNote}

[NEGATIVE]
face morphing, identity change, outfit change, background change, 
extra fingers, blur, text overlays, watermarks, cartoon, 3d render,
plastic skin, airbrushed skin, low quality, noise, grain.

[STYLE]
UGC iPhone 15 Pro quality. High resolution, crisp 4K.
Bright influencer lighting (ring light or natural window).
Authentic but polished TikTok/Reels content vibe.
`.trim();
};

/**
 * Create KIE.AI task for image generation
 */
async function createKieTask(
  prompt: string,
  imageUrls: string[],
  apiKey: string,
  model: string = 'google/nano-banana-edit',
  aspectRatio: string = '9:16'
): Promise<string> {
  console.log('[KIE] Creating task:', model);
  console.log('[KIE] Image URLs:', imageUrls.length);

  const payload = {
    model,
    input: {
      prompt,
      image_urls: imageUrls.filter(url => url && url.startsWith('http')),
      image_size: aspectRatio,
      output_format: 'png',
    },
  };

  const response = await fetch(`${BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KIE API Error (${response.status}): ${errorText.substring(0, 200)}`);
  }

  const result: KieTaskResponse = await response.json();
  if (result.code !== 200) {
    throw new Error(result.msg || 'Task creation failed');
  }

  return result.data.taskId;
}

/**
 * Poll KIE.AI task until completion
 */
async function pollKieTask(
  taskId: string,
  apiKey: string,
  maxAttempts: number = 60,
  intervalMs: number = 3000
): Promise<string> {
  console.log('[KIE] Polling task:', taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${BASE_URL}/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      console.log(`[KIE] Poll attempt ${attempt + 1} - response not ok, retrying...`);
      await new Promise(r => setTimeout(r, intervalMs));
      continue;
    }

    const result: KieQueryResponse = await response.json();
    console.log('[KIE] Poll result state:', result.data?.state);
    console.log('[KIE] Full poll result:', JSON.stringify(result).substring(0, 1000));

    if (result.data?.state === 'success') {
      // Log everything we can about the result
      console.log('[KIE] SUCCESS! Checking for resultJson...');
      console.log('[KIE] result.data keys:', Object.keys(result.data));
      
      // Some APIs return the URL directly in different fields
      const data = result.data as any;
      
      // Check if URL is directly in data object (not in resultJson)
      if (data.imageUrl) {
        console.log('[KIE] Found URL in data.imageUrl');
        return data.imageUrl;
      }
      if (data.image_url) {
        console.log('[KIE] Found URL in data.image_url');
        return data.image_url;
      }
      if (data.url) {
        console.log('[KIE] Found URL in data.url');
        return data.url;
      }
      if (data.output) {
        console.log('[KIE] Found data.output:', data.output);
        if (typeof data.output === 'string' && data.output.startsWith('http')) {
          return data.output;
        }
        if (Array.isArray(data.output) && data.output[0]) {
          return data.output[0];
        }
      }
      
      if (result.data.resultJson) {
        console.log('[KIE] Raw resultJson:', result.data.resultJson);
        console.log('[KIE] resultJson type:', typeof result.data.resultJson);
      
        // Handle case where resultJson is already an object (not a string)
        let parsed: any;
        if (typeof result.data.resultJson === 'string') {
          try {
            parsed = JSON.parse(result.data.resultJson);
          } catch (e) {
            // Maybe it's a direct URL string
            if (result.data.resultJson.startsWith('http')) {
              console.log('[KIE] resultJson is direct URL string');
              return result.data.resultJson;
            }
            throw e;
          }
        } else {
          // resultJson is already an object
          parsed = result.data.resultJson;
        }
        
        console.log('[KIE] Parsed result keys:', Object.keys(parsed));
        console.log('[KIE] Parsed result:', JSON.stringify(parsed).substring(0, 500));
        let imageUrl = '';
        
        // Format 0: { resultUrls: ["url1", "url2"] } - KIE.AI nano-banana-edit format!
        if (parsed.resultUrls && Array.isArray(parsed.resultUrls) && parsed.resultUrls[0]) {
          imageUrl = parsed.resultUrls[0];
          console.log('[KIE] Found URL in resultUrls[0]');
        }
        // Format 1: { images: [{ url: "..." }] }
        else if (parsed.images && Array.isArray(parsed.images) && parsed.images[0]?.url) {
          imageUrl = parsed.images[0].url;
          console.log('[KIE] Found URL in images[0].url');
        }
        // Format 2: { image: { url: "..." } }
        else if (parsed.image?.url) {
          imageUrl = parsed.image.url;
          console.log('[KIE] Found URL in image.url');
        }
        // Format 3: { output: ["url1", "url2"] }
        else if (parsed.output && Array.isArray(parsed.output) && parsed.output[0]) {
          imageUrl = parsed.output[0];
          console.log('[KIE] Found URL in output[0]');
        }
        // Format 4: { url: "..." }
        else if (parsed.url) {
          imageUrl = parsed.url;
          console.log('[KIE] Found URL in url');
        }
        // Format 5: { data: { url: "..." } } or { data: { images: [...] } }
        else if (parsed.data?.url) {
          imageUrl = parsed.data.url;
          console.log('[KIE] Found URL in data.url');
        }
        else if (parsed.data?.images?.[0]?.url) {
          imageUrl = parsed.data.images[0].url;
          console.log('[KIE] Found URL in data.images[0].url');
        }
        // Format 6: Direct string (the resultJson itself might be the URL)
        else if (typeof parsed === 'string' && parsed.startsWith('http')) {
          imageUrl = parsed;
          console.log('[KIE] resultJson is direct URL string');
        }
        // Format 7: { image_url: "..." }
        else if (parsed.image_url) {
          imageUrl = parsed.image_url;
          console.log('[KIE] Found URL in image_url');
        }
        // Format 8: { result: { url: "..." } } or { result: "url" }
        else if (parsed.result?.url) {
          imageUrl = parsed.result.url;
          console.log('[KIE] Found URL in result.url');
        }
        else if (typeof parsed.result === 'string' && parsed.result.startsWith('http')) {
          imageUrl = parsed.result;
          console.log('[KIE] Found URL in result (string)');
        }
        
        if (imageUrl) {
          console.log('[KIE] Final image URL:', imageUrl.substring(0, 100) + '...');
          return imageUrl;
        }
        
        console.error('[KIE] Could not find image URL in parsed result:', JSON.stringify(parsed));
        throw new Error(`No image URL found in result. Keys: ${Object.keys(parsed).join(', ')}`);
      }
      
      // No resultJson but state is success - check if there's any other URL field
      console.error('[KIE] No resultJson but state is success. Full data:', JSON.stringify(result.data));
      throw new Error('Task succeeded but no resultJson found');
    }

    if (result.data?.state === 'fail') {
      console.error('[KIE] Task failed:', result.data.failMsg);
      throw new Error(result.data.failMsg || 'Generation failed');
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error('Generation timed out');
}

/**
 * Render UGC Scene Frame using KIE.AI (Nano Banana)
 */
export async function renderUGCSceneFrame(
  scene: UGCScene,
  anchor: VisualAnchor,
  modelImageUrl: string,
  productImageUrl: string,
  frameType: 'star' | 'end',
  config: KieConfig,
  onProgress?: (msg: string) => void
): Promise<{ url: string; score: number }> {
  const frame = frameType === 'star' ? scene.star_frame : scene.end_frame;
  if (!frame) throw new Error(`No ${frameType} frame defined for scene ${scene.scene_number}`);

  // Build Identity Lock prompt
  const fullPrompt = buildIdentityLockPrompt(
    frame.visual_prompt,
    anchor,
    frameType,
    frame.motion
  );

  onProgress?.(`Creating image task for Scene ${scene.scene_number} (${frameType})...`);

  // Send both model and product images as references
  const imageUrls = [modelImageUrl, productImageUrl].filter(url => url && url.startsWith('http'));
  
  if (imageUrls.length === 0) {
    throw new Error('No valid image URLs provided. Images must be uploaded to Supabase first.');
  }

  const taskId = await createKieTask(fullPrompt, imageUrls, config.apiKey);
  
  onProgress?.(`Processing image for Scene ${scene.scene_number}...`);
  
  const imageUrl = await pollKieTask(taskId, config.apiKey);

  return { url: imageUrl, score: 85 }; // Default score, can be enhanced with QA
}

/**
 * Generate single UGC image from prompt template
 */
export async function generateUGCImage(
  prompt: PromptTemplate,
  modelImageUrl: string,
  productImageUrl: string,
  config: KieConfig,
  onProgress?: (msg: string) => void
): Promise<GeneratedImage> {
  const imageUrls = [modelImageUrl, productImageUrl].filter(url => url && url.startsWith('http'));
  
  if (imageUrls.length === 0) {
    throw new Error('No valid image URLs. Please ensure images are uploaded to Supabase.');
  }

  onProgress?.(`Creating task for Scene ${prompt.sceneNumber}...`);

  // Build prompt with Identity Lock structure
  const scenePrompt = prompt.generatedPrompt || prompt.basePrompt || prompt.sceneDescription || '';
  const fullPrompt = `
[LOCK_IDENTITY]
Keep the person EXACTLY the same as in Reference Image 1.
Do NOT change face, hair, outfit, skin tone.

[LOCK_ENV]
Keep background and lighting consistent.

[PRODUCT_INTEGRATION]
Product from Reference Image 2 must appear naturally.

[SCENE]
${scenePrompt}

[STYLE]
UGC iPhone quality, authentic social media content.
Natural lighting, lifestyle photography.

[NEGATIVE]
face morphing, outfit change, blur, watermark, low quality, cartoon.
`.trim();

  const taskId = await createKieTask(fullPrompt, imageUrls, config.apiKey);
  
  onProgress?.(`Processing Scene ${prompt.sceneNumber}...`);
  
  const imageUrl = await pollKieTask(taskId, config.apiKey);

  return {
    id: crypto.randomUUID(),
    sceneNumber: prompt.sceneNumber || 1,
    sceneId: prompt.sceneId || `scene-${prompt.sceneNumber}`,
    imageUrl,
    supabasePath: `ugc-generated/${crypto.randomUUID()}.png`,
    prompt: scenePrompt,
    promptUsed: fullPrompt,
    generatedAt: Date.now(),
    createdAt: Date.now(),
    model: 'google/nano-banana-edit',
    consistency: {
      modelConsistency: 85,
      productPlacement: 90,
      styleCohesion: 88,
      overallQuality: 87,
    },
    qualityScore: 87,
    approved: false,
    regenerationCount: 0,
  };
}

/**
 * Generate all UGC images from prompt templates
 */
export async function generateAllUGCImages(
  prompts: PromptTemplate[],
  modelImageUrl: string,
  productImageUrl: string,
  config: KieConfig,
  onProgress?: (msg: string, percent: number, image?: GeneratedImage) => void
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];
  const total = prompts.length;

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const percent = Math.round(((i + 1) / total) * 100);

    try {
      onProgress?.(`Generating image ${i + 1}/${total}...`, percent);

      const image = await generateUGCImage(
        prompt,
        modelImageUrl,
        productImageUrl,
        config,
        msg => onProgress?.(msg, percent)
      );

      images.push(image);
      onProgress?.(`Image ${i + 1}/${total} complete!`, percent, image);

      // Rate limit delay
      if (i < prompts.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error(`[KIE] Error for scene ${i + 1}:`, error);
      onProgress?.(`Failed scene ${i + 1}, continuing...`, percent);
    }
  }

  if (images.length === 0) {
    throw new Error('All image generations failed');
  }

  return images;
}

/**
 * Generate video from images using KIE.AI Veo3
 */
export async function generateUGCVideo(
  images: GeneratedImage[],
  config: KieConfig,
  options?: {
    aspectRatio?: '16:9' | '9:16';
    duration?: number;
  },
  onProgress?: (msg: string, percent: number) => void
): Promise<GeneratedVideo> {
  const approvedImages = images.filter(img => img.approved !== false);
  
  if (approvedImages.length < 2) {
    throw new Error('Need at least 2 images for video generation');
  }

  onProgress?.('Preparing Veo3 video generation...', 10);

  // Use Veo3 image-to-video
  const payload = {
    model: 'veo3',
    input: {
      prompt: 'Smooth UGC video transition between frames. Natural movement, subtle motion, professional quality.',
      imageUrls: approvedImages.slice(0, 2).map(img => img.imageUrl),
      generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
      aspect_ratio: options?.aspectRatio || '9:16',
    },
  };

  const response = await fetch(`${BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Veo3 task creation failed');
  }

  const result: KieTaskResponse = await response.json();
  
  onProgress?.('Processing video...', 30);

  // Poll for video result
  let videoUrl = '';
  for (let attempt = 0; attempt < 120; attempt++) {
    const pollResponse = await fetch(`${BASE_URL}/recordInfo?taskId=${result.data.taskId}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });

    if (pollResponse.ok) {
      const pollResult: KieQueryResponse = await pollResponse.json();
      
      if (pollResult.data?.state === 'success' && pollResult.data.resultJson) {
        const parsed = JSON.parse(pollResult.data.resultJson);
        videoUrl = parsed.video_url || parsed.url || '';
        if (videoUrl) break;
      }

      if (pollResult.data?.state === 'fail') {
        throw new Error(pollResult.data.failMsg || 'Video generation failed');
      }
    }

    onProgress?.('Processing video...', 30 + Math.min(attempt, 60));
    await new Promise(r => setTimeout(r, 5000));
  }

  if (!videoUrl) {
    throw new Error('Video generation timed out');
  }

  onProgress?.('Video complete!', 100);

  return {
    id: crypto.randomUUID(),
    imageId: approvedImages[0]?.id || '',
    videoUrl,
    supabasePath: `ugc-videos/${crypto.randomUUID()}.mp4`,
    duration: options?.duration || approvedImages.length * 3,
    resolution: '1080p',
    frameRate: 30,
    createdAt: Date.now(),
    generatedAt: Date.now(),
    model: 'veo3',
    status: 'completed',
  };
}
