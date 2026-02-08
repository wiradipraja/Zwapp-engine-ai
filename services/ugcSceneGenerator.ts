import { createTask, queryTask } from './api';
import { uploadOutputUrlToSupabase } from './spacesAssets';
import { getFailureReason, normalizeTaskState } from './taskState';
import type {
  UGCAspectRatio,
  UGCSceneFrameRole,
  UGCSceneImageAsset,
  UGCScenePlan,
  UGCWorkflowInputPayload,
} from '../types/ugcWorkflow';

const GLOBAL_VISUAL_RULE =
  'No subtitle, no caption, no text overlay, no watermark, no logo. Maintain identity consistency and global aspect ratio.';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractResultUrl = (resultJson: any, data: any): string => {
  if (data?.imageUrl) return data.imageUrl;
  if (data?.image_url) return data.image_url;
  if (data?.videoUrl) return data.videoUrl;
  if (data?.video_url) return data.video_url;
  if (data?.url) return data.url;
  if (data?.resultUrl) return data.resultUrl;
  if (Array.isArray(data?.resultUrls) && data.resultUrls[0]) return data.resultUrls[0];
  if (data?.output) {
    if (typeof data.output === 'string') return data.output;
    if (Array.isArray(data.output) && data.output[0]) return data.output[0];
  }

  let parsed = resultJson;
  if (typeof resultJson === 'string') {
    try {
      parsed = JSON.parse(resultJson);
    } catch (_error) {
      if (resultJson.startsWith('http')) return resultJson;
      parsed = null;
    }
  }

  if (!parsed) return '';
  if (parsed.resultUrls?.[0]) return parsed.resultUrls[0];
  if (parsed.images?.[0]?.url) return parsed.images[0].url;
  if (parsed.image?.url) return parsed.image.url;
  if (parsed.output?.[0]) return parsed.output[0];
  if (parsed.url) return parsed.url;
  if (parsed.data?.url) return parsed.data.url;
  if (parsed.data?.images?.[0]?.url) return parsed.data.images[0].url;
  if (typeof parsed === 'string' && parsed.startsWith('http')) return parsed;
  return '';
};

const pollTaskResultUrl = async (
  apiKey: string,
  taskId: string,
  timeoutMs = 180_000
): Promise<string> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const response = await queryTask(apiKey, taskId);
    const data = response?.data;
    if (!data) {
      await wait(2500);
      continue;
    }

    const normalized = normalizeTaskState(data);
    if (normalized.state === 'success') {
      const url = extractResultUrl(data.resultJson || data.result, data);
      if (!url) throw new Error('Task success but output URL missing.');
      return url;
    }

    if (normalized.state === 'fail') {
      const reason =
        getFailureReason(data) || data.failMsg || data.errorMsg || data.msg || 'Generation failed.';
      throw new Error(reason);
    }

    await wait(2500);
  }

  throw new Error('Generation timed out.');
};

const mapNanoAspectRatio = (ratio: UGCAspectRatio) => {
  switch (ratio) {
    case '16:9':
    case '9:16':
    case '1:1':
    case '4:5':
    case '3:4':
      return ratio;
    default:
      return '9:16';
  }
};

const buildScenePrompt = (params: {
  scene: UGCScenePlan;
  input: UGCWorkflowInputPayload;
  backgroundLabel: string;
  backgroundPromptHint: string;
  frameRole: UGCSceneFrameRole;
  continuityReferenceUrl?: string;
  anchorSceneStartUrl?: string;
}) => {
  const {
    scene,
    input,
    backgroundLabel,
    backgroundPromptHint,
    frameRole,
    continuityReferenceUrl,
    anchorSceneStartUrl,
  } = params;

  const identityLockText = [
    'Reference image #1 is the main character identity lock. Keep face, body, skin tone, and hairstyle unchanged.',
    scene.show_product
      ? 'Reference image #2 is the product lock. Product shape, label, color, and branding must match exactly.'
      : 'Do not show the product object in this scene.',
  ].join(' ');

  const productVisibilityRule = scene.show_product
    ? 'Product must be visible and recognizable.'
    : 'Do not show product. Character only.';

  const frameRule =
    frameRole === 'scene_start'
      ? 'Generate START frame with a clear opening composition.'
      : 'Generate END frame that naturally transitions from the start frame and keeps continuity.';

  const continuityRule = [
    continuityReferenceUrl
      ? 'Keep motion continuity from previous scene reference while preserving same character identity.'
      : '',
    anchorSceneStartUrl
      ? 'Lock continuity against scene 1 start anchor for facial identity, wardrobe, and environment realism.'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return [
    `Scene ${scene.scene_number} (${scene.goal}) - ${frameRole}`,
    `Product: ${input.productName}`,
    `Product description: ${input.productShortDescription}`,
    `Background preset: ${backgroundLabel}`,
    `Background hint: ${backgroundPromptHint}`,
    `Aspect ratio: ${input.aspectRatioGlobal}`,
    `Visual description: ${scene.visual_description_en}`,
    `Camera direction: ${scene.camera_direction_en}`,
    `Negative prompt: ${scene.negative_prompt_en}`,
    `Dialogue context (Indonesian): ${scene.dialogue_text_id || scene.dialogue_id}`,
    identityLockText,
    productVisibilityRule,
    frameRule,
    continuityRule,
    GLOBAL_VISUAL_RULE,
    'Style: UGC realism, natural skin texture, practical lighting, no over-stylized CGI look.',
  ]
    .filter(Boolean)
    .join('\n');
};

const runModelWithPayloadCandidates = async (params: {
  apiKey: string;
  model: string;
  payloadCandidates: any[];
}): Promise<{ resultUrl: string; taskId: string; model: string }> => {
  const errors: string[] = [];
  for (let idx = 0; idx < params.payloadCandidates.length; idx += 1) {
    const payload = params.payloadCandidates[idx];
    try {
      const created = await createTask(params.apiKey, params.model, payload as any);
      if (!created || created.code !== 200 || !created.data?.taskId) {
        throw new Error(created?.msg || 'Task create failed.');
      }
      const taskId = created.data.taskId;
      const resultUrl = await pollTaskResultUrl(params.apiKey, taskId);
      return { resultUrl, taskId, model: params.model };
    } catch (error: any) {
      errors.push(`candidate ${idx + 1}: ${error.message || String(error)}`);
    }
  }
  throw new Error(errors.join(' | '));
};

export interface GenerateUGCSceneFrameParams {
  apiKey: string;
  scene: UGCScenePlan;
  input: UGCWorkflowInputPayload;
  backgroundLabel: string;
  backgroundPromptHint: string;
  frameRole: UGCSceneFrameRole;
  continuityReferenceUrl?: string;
  anchorSceneStartUrl?: string;
}

export const generateUGCSceneFrame = async (
  params: GenerateUGCSceneFrameParams
): Promise<UGCSceneImageAsset> => {
  const {
    apiKey,
    scene,
    input,
    backgroundLabel,
    backgroundPromptHint,
    frameRole,
    continuityReferenceUrl,
    anchorSceneStartUrl,
  } = params;

  const prompt = buildScenePrompt({
    scene,
    input,
    backgroundLabel,
    backgroundPromptHint,
    frameRole,
    continuityReferenceUrl,
    anchorSceneStartUrl,
  });

  const referenceImages = [
    input.modelImageUrl,
    scene.show_product ? input.productImageUrl : '',
    continuityReferenceUrl || '',
    anchorSceneStartUrl || '',
  ].filter(Boolean);

  const primaryCandidates = [
    {
      prompt,
      image_urls: referenceImages,
      aspect_ratio: input.aspectRatioGlobal,
    },
    {
      prompt,
      input_urls: referenceImages,
      aspect_ratio: input.aspectRatioGlobal,
    },
  ];

  const fallbackCandidates = [
    {
      prompt,
      image_urls: referenceImages.slice(0, 3),
      output_format: 'png',
      image_size: mapNanoAspectRatio(input.aspectRatioGlobal),
    },
    {
      prompt,
      output_format: 'png',
      image_size: mapNanoAspectRatio(input.aspectRatioGlobal),
    },
  ];

  let modelUsed = 'gemini-3-pro-image-preview';
  let resultUrl = '';
  let taskId = '';

  try {
    const generated = await runModelWithPayloadCandidates({
      apiKey,
      model: 'gemini-3-pro-image-preview',
      payloadCandidates: primaryCandidates,
    });
    resultUrl = generated.resultUrl;
    taskId = generated.taskId;
    modelUsed = generated.model;
  } catch (_primaryError) {
    const fallbackModel = referenceImages.length > 0 ? 'google/nano-banana-edit' : 'google/nano-banana';
    const generated = await runModelWithPayloadCandidates({
      apiKey,
      model: fallbackModel,
      payloadCandidates: fallbackCandidates,
    });
    resultUrl = generated.resultUrl;
    taskId = generated.taskId;
    modelUsed = generated.model;
  }

  let storedUrl = resultUrl;
  try {
    storedUrl = await uploadOutputUrlToSupabase(resultUrl, 'image');
  } catch (_error) {
    // Fallback to provider URL when storage upload fails.
  }

  return {
    id: crypto.randomUUID(),
    sceneNumber: scene.scene_number,
    frameRole,
    imageUrl: storedUrl,
    sourceModel: modelUsed,
    sourceTaskId: taskId,
    sourceUrl: resultUrl,
    promptUsed: prompt,
  };
};

export const generateUGCSceneSequence = async (params: {
  apiKey: string;
  input: UGCWorkflowInputPayload;
  backgroundLabel: string;
  backgroundPromptHint: string;
  scenes: UGCScenePlan[];
}): Promise<Record<number, { start?: UGCSceneImageAsset; end?: UGCSceneImageAsset }>> => {
  const result: Record<number, { start?: UGCSceneImageAsset; end?: UGCSceneImageAsset }> = {
    1: {},
    2: {},
    3: {},
    4: {},
  };

  const orderedScenes = [...params.scenes].sort((a, b) => a.scene_number - b.scene_number);
  let sceneOneAnchorUrl = '';
  let previousEndUrl = '';

  for (const scene of orderedScenes) {
    const start = await generateUGCSceneFrame({
      apiKey: params.apiKey,
      input: params.input,
      backgroundLabel: params.backgroundLabel,
      backgroundPromptHint: params.backgroundPromptHint,
      scene,
      frameRole: 'scene_start',
      continuityReferenceUrl: previousEndUrl || undefined,
      anchorSceneStartUrl: sceneOneAnchorUrl || undefined,
    });
    result[scene.scene_number].start = start;

    if (scene.scene_number === 1) {
      sceneOneAnchorUrl = start.imageUrl;
    }

    const end = await generateUGCSceneFrame({
      apiKey: params.apiKey,
      input: params.input,
      backgroundLabel: params.backgroundLabel,
      backgroundPromptHint: params.backgroundPromptHint,
      scene,
      frameRole: 'scene_end',
      continuityReferenceUrl: start.imageUrl,
      anchorSceneStartUrl: sceneOneAnchorUrl || undefined,
    });
    result[scene.scene_number].end = end;
    previousEndUrl = end.imageUrl;
  }

  return result;
};

export const generateUGCSceneSequenceByCount = async (params: {
  apiKey: string;
  input: UGCWorkflowInputPayload;
  backgroundLabel: string;
  backgroundPromptHint: string;
  scenes: UGCScenePlan[];
  sceneCount: number;
}): Promise<Record<number, { start?: UGCSceneImageAsset; end?: UGCSceneImageAsset }>> => {
  const limitedScenes = [...params.scenes]
    .sort((a, b) => a.scene_number - b.scene_number)
    .slice(0, Math.max(1, Math.min(4, params.sceneCount)));

  return generateUGCSceneSequence({
    apiKey: params.apiKey,
    input: params.input,
    backgroundLabel: params.backgroundLabel,
    backgroundPromptHint: params.backgroundPromptHint,
    scenes: limitedScenes,
  });
};
