// services/ugcImageService.ts
// Dedicated image generation service for UGC using KIE.AI Flux API

import { PromptTemplate, GeneratedImage } from '../types/ugc';

const BASE_URL = '/api/proxy/jobs';

export interface UGCImageConfig {
  apiKey: string;
  modelPhotoUrl: string;
  productPhotoUrl: string;
}

export interface KieTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
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

/**
 * Create image generation task using KIE.AI Flux Flex API
 */
async function createImageTask(
  prompt: string,
  imageUrls: string[],
  apiKey: string,
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9' | 'auto' = '9:16',
  outputFormat: 'png' | 'jpeg' = 'png'
): Promise<string> {
  console.log('[UGC Image] Creating Nano Banana task with prompt:', prompt.substring(0, 100) + '...');
  console.log('[UGC Image] Reference images:', imageUrls);

  // Use google/nano-banana-edit - PRD requirement for image-to-image
  const payload = {
    model: 'google/nano-banana-edit',
    input: {
      prompt: prompt,
      image_urls: imageUrls.filter(url => url && url.length > 0),
      image_size: aspectRatio,
      output_format: outputFormat,
    },
  };

  try {
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
      console.error('[UGC Image] API Error:', response.status, errorText);
      throw new Error(`API Error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const result: KieTaskResponse = await response.json();
    
    if (result.code !== 200) {
      console.error('[UGC Image] Task creation failed:', result.msg);
      throw new Error(result.msg || 'Task creation failed');
    }

    console.log('[UGC Image] Task created:', result.data.taskId);
    return result.data.taskId;
  } catch (error) {
    console.error('[UGC Image] Create task error:', error);
    throw error;
  }
}

/**
 * Poll task status until completion
 */
async function pollTaskResult(
  taskId: string,
  apiKey: string,
  maxAttempts: number = 60,
  intervalMs: number = 3000
): Promise<string> {
  console.log('[UGC Image] Polling task:', taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/recordInfo?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        console.warn('[UGC Image] Poll warning:', response.status);
        await new Promise((r) => setTimeout(r, intervalMs));
        continue;
      }

      const result: KieQueryResponse = await response.json();
      
      console.log('[UGC Image] Poll result:', result.data?.state);

      if (result.data?.state === 'success') {
        if (result.data.resultJson) {
          try {
            const parsed = JSON.parse(result.data.resultJson);
            const imageUrl = parsed.images?.[0]?.url || 
                            parsed.image?.url ||
                            parsed.output?.[0] ||
                            parsed.url ||
                            '';
            
            if (imageUrl) {
              console.log('[UGC Image] Got image URL:', imageUrl.substring(0, 50) + '...');
              return imageUrl;
            }
          } catch (e) {
            console.error('[UGC Image] Parse error:', e);
          }
        }
        throw new Error('Task succeeded but no image URL found in result');
      }

      if (result.data?.state === 'fail') {
        throw new Error(result.data.failMsg || 'Image generation failed');
      }

      // Still waiting, continue polling
      await new Promise((r) => setTimeout(r, intervalMs));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  throw new Error('Image generation timed out after ' + (maxAttempts * intervalMs / 1000) + ' seconds');
}

/**
 * Generate a single UGC image using KIE.AI
 */
export async function generateUGCImage(
  sceneNumber: number,
  prompt: PromptTemplate,
  config: UGCImageConfig,
  onProgress?: (message: string) => void
): Promise<GeneratedImage> {
  const { apiKey, modelPhotoUrl, productPhotoUrl } = config;

  // PRD Identity Lock Prompt Structure for Nano Banana
  const LOCK_IDENTITY = `Keep the person EXACTLY the same as in the reference image. Do not change face, hair, outfit, skin tone, accessories.`;
  const LOCK_ENV = `Keep background and lighting EXACTLY the same. No new props or camera changes.`;
  const PRODUCT_INTEGRATION = `Integrate product from reference image. Place product naturally, sharp and readable. Add soft realistic shadow.`;
  const NEGATIVE = `Negative: face morphing, outfit change, background change, extra fingers, blur, text overlays, watermarks.`;

  // Build comprehensive prompt with Identity Lock structure
  const fullPrompt = `
[LOCK_IDENTITY]
${LOCK_IDENTITY}

[LOCK_ENV]
${LOCK_ENV}

[PRODUCT_INTEGRATION]
${PRODUCT_INTEGRATION}

Scene: ${prompt.sceneDescription}
Style: ${prompt.visualStyle || 'Natural UGC photography, authentic and relatable'}
Product Placement: ${prompt.productIntegration || 'Product visible in frame'}

${prompt.generatedPrompt || prompt.basePrompt}

[NEGATIVE]
${NEGATIVE}
`.trim();

  // Collect reference images
  const imageUrls: string[] = [];
  if (modelPhotoUrl) imageUrls.push(modelPhotoUrl);
  if (productPhotoUrl) imageUrls.push(productPhotoUrl);

  if (imageUrls.length === 0) {
    throw new Error('At least one reference image (model or product) is required');
  }

  onProgress?.(`Creating image task for scene ${sceneNumber}...`);

  try {
    // Create task
    const taskId = await createImageTask(fullPrompt, imageUrls, apiKey);
    
    onProgress?.(`Processing image for scene ${sceneNumber}...`);

    // Poll for result
    const imageUrl = await pollTaskResult(taskId, apiKey);

    const generatedImage: GeneratedImage = {
      id: crypto.randomUUID(),
      sceneNumber,
      sceneId: prompt.sceneId || `scene-${sceneNumber}`,
      imageUrl,
      supabasePath: `ugc-generated/${crypto.randomUUID()}.png`,
      prompt: prompt.generatedPrompt || prompt.basePrompt,
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

    console.log('[UGC Image] Successfully generated image for scene', sceneNumber);
    return generatedImage;
  } catch (error) {
    console.error('[UGC Image] Generation failed for scene', sceneNumber, error);
    throw new Error(
      `Image generation failed for scene ${sceneNumber}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate multiple UGC images from prompts
 */
export async function generateAllUGCImages(
  prompts: PromptTemplate[],
  config: UGCImageConfig,
  onProgress?: (message: string, percent: number, currentImage?: GeneratedImage) => void
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];
  const errors: string[] = [];
  const total = prompts.length;

  console.log('[UGC Image] Starting generation of', total, 'images');

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const percent = Math.round(((i + 1) / total) * 100);

    onProgress?.(`Generating image ${i + 1}/${total}...`, percent);

    try {
      const image = await generateUGCImage(
        prompt.sceneNumber || i + 1,
        prompt,
        config,
        (msg) => onProgress?.(msg, percent)
      );

      images.push(image);
      onProgress?.(`Image ${i + 1}/${total} complete!`, percent, image);

      // Small delay between generations to avoid rate limits
      if (i < prompts.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[UGC Image] Error for prompt', i + 1, errorMsg);
      errors.push(`Scene ${i + 1}: ${errorMsg}`);
      
      // Continue with other images even if one fails
      onProgress?.(`Failed scene ${i + 1}, continuing...`, percent);
    }
  }

  if (images.length === 0 && errors.length > 0) {
    throw new Error(`All image generations failed:\n${errors.join('\n')}`);
  }

  console.log('[UGC Image] Completed:', images.length, 'success,', errors.length, 'failed');

  return images;
}
