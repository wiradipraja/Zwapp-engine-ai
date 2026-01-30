// services/pixazo.ts
// Pixazo Stable Diffusion integration (per provided MD docs)

import { StableDiffusionTextInput, StableDiffusionInpaintInput } from '../types';

export interface PixazoImageResult {
  imageUrl: string;
  jobSetId?: string;
  raw?: any;
}

const SDXL_ENDPOINT = '/api/pixazo/sdxl';
const INPAINT_ENDPOINT = '/api/pixazo/inpaint';
const POLL_ENDPOINT = '/api/pixazo/poll';

const buildHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Ocp-Apim-Subscription-Key': apiKey,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const cleanPayload = (payload: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  );

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    if (!text) return response.statusText || 'Unknown error';
    try {
      const data = JSON.parse(text);
      if (data?.error) return String(data.error);
      if (data?.message) return String(data.message);
      return JSON.stringify(data).slice(0, 200);
    } catch (_err) {
      return text.slice(0, 200);
    }
  } catch (_err2) {
    return response.statusText || 'Unknown error';
  }
};

const requestPixazo = async (url: string, apiKey: string, body: Record<string, any>) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Pixazo API key missing');
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(apiKey.trim()),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(`Pixazo API error (${response.status}): ${message}`);
  }

  try {
    return await response.json();
  } catch (_err) {
    const text = await response.text();
    return { raw: text };
  }
};

const pollPixazoJob = async (apiKey: string, jobSetId: string): Promise<string> => {
  const maxAttempts = 25;
  const delayMs = 1200;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const data = await requestPixazo(POLL_ENDPOINT, apiKey, { job_set_id: jobSetId });
    const status = String(data?.status || '').toLowerCase();
    const imageUrl = data?.results?.[0]?.imageUrl || data?.imageUrl;

    if (imageUrl) {
      return imageUrl;
    }

    if (status === 'failed' || status === 'error') {
      throw new Error('Pixazo job failed');
    }

    await sleep(delayMs);
  }

  throw new Error('Pixazo job timed out');
};

export const generateSDXLImage = async (
  apiKey: string,
  input: StableDiffusionTextInput
): Promise<PixazoImageResult> => {
  const payload = cleanPayload({
    prompt: input.prompt,
    negative_prompt: input.negative_prompt,
    height: input.height,
    width: input.width,
    num_steps: input.num_steps,
    guidance_scale: input.guidance_scale,
    seed: input.seed,
  });

  const data = await requestPixazo(SDXL_ENDPOINT, apiKey, payload);
  const imageUrl = data?.imageUrl || data?.results?.[0]?.imageUrl;

  if (!imageUrl) {
    throw new Error('Pixazo response missing imageUrl');
  }

  return { imageUrl, raw: data };
};

export const generateInpaintImage = async (
  apiKey: string,
  input: StableDiffusionInpaintInput
): Promise<PixazoImageResult> => {
  const payload = cleanPayload({
    prompt: input.prompt,
    imageUrl: input.imageUrl,
    maskUrl: input.maskUrl,
    negative_prompt: input.negative_prompt,
    height: input.height,
    width: input.width,
    num_steps: input.num_steps,
    guidance: input.guidance,
    seed: input.seed,
  });

  const data = await requestPixazo(INPAINT_ENDPOINT, apiKey, payload);

  if (data?.imageUrl) {
    return { imageUrl: data.imageUrl, raw: data };
  }

  const jobSetId = data?.job_set_id || data?.jobSetId || data?.job_set;
  if (jobSetId) {
    const imageUrl = await pollPixazoJob(apiKey, String(jobSetId));
    return { imageUrl, jobSetId: String(jobSetId), raw: data };
  }

  throw new Error('Pixazo response missing imageUrl');
};
