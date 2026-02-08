import { createTask, queryTask } from './api';
import { uploadOutputUrlToSupabase } from './spacesAssets';
import { generateElevenLabsDialogueTrack } from './elevenLabsDialogue';
import { getFailureReason, normalizeTaskState } from './taskState';
import type {
  UGCAspectRatio,
  UGCScenePlan,
  UGCSceneVideoAsset,
  UGCVideoPipelineRequest,
  UGCVideoProvider,
} from '../types/ugcWorkflow';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mapVeoAspect = (ratio: UGCAspectRatio): '16:9' | '9:16' => {
  if (ratio === '16:9') return '16:9';
  return '9:16';
};

const mapSoraAspect = (ratio: UGCAspectRatio): 'portrait' | 'landscape' => {
  return ratio === '16:9' ? 'landscape' : 'portrait';
};

const createVeoTask = async (params: { apiKey: string; payload: any }) => {
  const response = await fetch('/api/proxy/veo/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(params.payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Veo task create failed (${response.status}): ${errorText.slice(0, 240)}`);
  }

  return response.json();
};

const extractResultUrl = (resultJson: any, data: any): string => {
  if (data?.videoUrl) return data.videoUrl;
  if (data?.video_url) return data.video_url;
  if (data?.url) return data.url;
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
  if (parsed.video?.url) return parsed.video.url;
  if (parsed.output?.[0]) return parsed.output[0];
  if (parsed.url) return parsed.url;
  if (parsed.data?.url) return parsed.data.url;
  if (typeof parsed === 'string' && parsed.startsWith('http')) return parsed;
  return '';
};

const queryVeoTask = async (apiKey: string, taskId: string) => {
  const response = await fetch(`/api/proxy/veo/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Veo query failed (${response.status})`);
  }
  return response.json();
};

const pollResultUrl = async (params: {
  apiKey: string;
  taskId: string;
  provider: 'jobs' | 'veo';
  timeoutMs?: number;
}): Promise<string> => {
  const timeoutMs = params.timeoutMs ?? 240_000;
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result =
      params.provider === 'veo'
        ? await queryVeoTask(params.apiKey, params.taskId)
        : await queryTask(params.apiKey, params.taskId);
    const data = result?.data;
    if (!data) {
      await wait(3000);
      continue;
    }

    const state = normalizeTaskState(data).state;
    if (state === 'success') {
      const url = extractResultUrl(data.resultJson || data.result, data);
      if (!url) throw new Error('Task succeeded but no output URL found.');
      return url;
    }
    if (state === 'fail') {
      const reason =
        getFailureReason(data) || data?.failMsg || data?.errorMsg || data?.msg || 'Video generation failed.';
      throw new Error(reason);
    }
    await wait(3000);
  }
  throw new Error('Video task timed out.');
};

const buildVideoPrompt = (scenePlan: UGCScenePlan, mode: 'A_NATIVE' | 'B_ELEVENLABS'): string => {
  const dialogue = scenePlan.dialogue_text_id || scenePlan.dialogue_id;
  const audioRule =
    mode === 'A_NATIVE'
      ? 'Character speaks dialogue naturally. Audio must contain dialogue voice only. No background music. No ambient SFX.'
      : 'Character lip-sync with dialogue context. No subtitle, no text overlay.';

  return [
    `Scene ${scenePlan.scene_number} - ${scenePlan.goal}`,
    scenePlan.visual_description_en,
    scenePlan.camera_direction_en,
    `Dialogue context: ${dialogue}`,
    scenePlan.show_product
      ? 'Product must be clearly visible and recognizable.'
      : 'Do not show product. Character only.',
    audioRule,
    'No subtitle, no caption, no text overlay, no watermark, no logo.',
  ]
    .filter(Boolean)
    .join('\n');
};

const createNativeVideoTask = async (
  request: UGCVideoPipelineRequest
): Promise<{ taskId: string; provider: 'jobs' | 'veo'; prompt: string }> => {
  const prompt = buildVideoPrompt(request.scenePlan, request.audio.videoMode);
  const provider = request.provider;

  if (provider === 'veo3_fast' || provider === 'veo3') {
    const imageUrls = [request.startFrameUrl, request.endFrameUrl || request.startFrameUrl].filter(Boolean);
    const response = await createVeoTask({
      apiKey: request.apiKey,
      payload: {
        prompt,
        imageUrls: imageUrls.slice(0, 2),
        generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
        model: provider === 'veo3' ? 'veo3' : 'veo3_fast',
        aspect_ratio: mapVeoAspect(request.aspectRatio),
      },
    });

    if (!response || response.code !== 200 || !response.data?.taskId) {
      throw new Error(response?.msg || 'Failed to create Veo video task.');
    }

    return {
      taskId: response.data.taskId,
      provider: 'veo',
      prompt,
    };
  }

  if (provider === 'grok-imagine/image-to-video') {
    const response = await createTask(request.apiKey, 'grok-imagine/image-to-video', {
      image_urls: [request.startFrameUrl],
      prompt,
      mode: 'normal',
    } as any);
    if (!response || response.code !== 200 || !response.data?.taskId) {
      throw new Error(response?.msg || 'Failed to create Grok video task.');
    }
    return {
      taskId: response.data.taskId,
      provider: 'jobs',
      prompt,
    };
  }

  const response = await createTask(request.apiKey, 'sora-2-image-to-video', {
    prompt,
    image_urls: [request.startFrameUrl],
    aspect_ratio: mapSoraAspect(request.aspectRatio),
  } as any);
  if (!response || response.code !== 200 || !response.data?.taskId) {
    throw new Error(response?.msg || 'Failed to create Sora video task.');
  }
  return {
    taskId: response.data.taskId,
    provider: 'jobs',
    prompt,
  };
};

const mergeVideoAndAudio = async (params: {
  videoUrl: string;
  audioUrl?: string;
  muted: boolean;
}): Promise<string> => {
  // In-browser muxing is intentionally skipped for MVP.
  // The panel can play audio track separately while keeping this URL as primary video source.
  return params.videoUrl;
};

export const produceUGCSceneVideo = async (
  request: UGCVideoPipelineRequest
): Promise<UGCSceneVideoAsset> => {
  const nativeTask = await createNativeVideoTask(request);
  const nativeVideoUrl = await pollResultUrl({
    apiKey: request.apiKey,
    taskId: nativeTask.taskId,
    provider: nativeTask.provider,
  });

  let storedVideoUrl = nativeVideoUrl;
  try {
    storedVideoUrl = await uploadOutputUrlToSupabase(nativeVideoUrl, 'video');
  } catch (_error) {
    // fallback to provider URL
  }

  let dialogueAudioUrl: string | undefined;
  if (request.audio.videoMode === 'B_ELEVENLABS') {
    const dialogue = await generateElevenLabsDialogueTrack({
      apiKey: request.apiKey,
      dialogueScript: request.audio.dialogueScript,
      tonevoice: request.audio.singleSpeakerTonevoice,
      languageCode: 'id',
      stability: 0.5,
    });
    dialogueAudioUrl = dialogue.audioUrl;
  }

  const finalVideoUrl = await mergeVideoAndAudio({
    videoUrl: storedVideoUrl,
    audioUrl: dialogueAudioUrl,
    muted: request.audio.videoMode === 'B_ELEVENLABS' ? request.audio.muteNativeAudio : false,
  });

  return {
    id: crypto.randomUUID(),
    sceneNumber: request.scenePlan.scene_number,
    provider: request.provider as UGCVideoProvider,
    videoMode: request.audio.videoMode,
    videoUrl: finalVideoUrl,
    sourceTaskId: nativeTask.taskId,
    audioUrl: dialogueAudioUrl,
    muted: request.audio.videoMode === 'B_ELEVENLABS' ? request.audio.muteNativeAudio : false,
    promptUsed: nativeTask.prompt,
  };
};
