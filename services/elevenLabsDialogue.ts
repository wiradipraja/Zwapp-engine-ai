import { getFailureReason, normalizeTaskState } from './taskState';

const JOBS_BASE_URL = '/api/proxy/jobs';
const ELEVENLABS_MODEL = 'elevenlabs/text-to-dialogue-v3';
const DEFAULT_VOICE_ID = 'TX3LPaxmHKxFdv7VOQHJ';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractAudioUrl = (resultJson: any, data: any): string => {
  if (data?.audioUrl) return data.audioUrl;
  if (data?.audio_url) return data.audio_url;
  if (data?.url) return data.url;
  if (Array.isArray(data?.resultUrls) && data.resultUrls[0]) return data.resultUrls[0];

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
  if (parsed.output?.[0]) return parsed.output[0];
  if (parsed.audio?.url) return parsed.audio.url;
  if (parsed.url) return parsed.url;
  if (parsed.data?.url) return parsed.data.url;
  if (typeof parsed === 'string' && parsed.startsWith('http')) return parsed;
  return '';
};

const buildSingleSpeakerDialogueText = (script: string, tonevoice: string): string => {
  const prefix = tonevoice?.trim() ? `[${tonevoice.trim()}] ` : '';
  return `${prefix}${script.trim()}`.slice(0, 5000);
};

export interface ElevenLabsDialogueRequest {
  apiKey: string;
  dialogueScript: string;
  tonevoice: string;
  voiceId?: string;
  languageCode?: string;
  stability?: number;
}

export interface ElevenLabsDialogueResult {
  taskId: string;
  audioUrl: string;
  raw: any;
}

export const createElevenLabsDialogueTask = async (
  params: ElevenLabsDialogueRequest
): Promise<string> => {
  if (!params.apiKey) {
    throw new Error('KIE API key is required.');
  }
  if (!params.dialogueScript?.trim()) {
    throw new Error('Dialogue script is required for ElevenLabs mode.');
  }

  const dialogueText = buildSingleSpeakerDialogueText(params.dialogueScript, params.tonevoice);
  const payload = {
    model: ELEVENLABS_MODEL,
    input: {
      stability: typeof params.stability === 'number' ? params.stability : 0.5,
      language_code: params.languageCode || 'id',
      dialogue: [
        {
          text: dialogueText,
          voice: params.voiceId || DEFAULT_VOICE_ID,
        },
      ],
    },
  };

  const response = await fetch(`${JOBS_BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs task create failed (${response.status}): ${errorText.slice(0, 240)}`);
  }

  const json = await response.json();
  const code = Number(json?.code);
  if (code !== 200 || !json?.data?.taskId) {
    throw new Error(json?.msg || json?.message || 'ElevenLabs task creation failed.');
  }

  return json.data.taskId as string;
};

export const queryElevenLabsDialogueTask = async (
  apiKey: string,
  taskId: string
): Promise<ElevenLabsDialogueResult> => {
  const response = await fetch(`${JOBS_BASE_URL}/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs query failed (${response.status}): ${errorText.slice(0, 240)}`);
  }

  const json = await response.json();
  const data = json?.data;
  const normalized = normalizeTaskState(data);
  if (normalized.state === 'fail') {
    const reason =
      getFailureReason(data) || data?.failMsg || data?.errorMsg || json?.msg || 'ElevenLabs generation failed.';
    throw new Error(reason);
  }
  if (normalized.state !== 'success') {
    throw new Error('Task not finished.');
  }

  const audioUrl = extractAudioUrl(data?.resultJson || data?.result, data);
  if (!audioUrl) {
    throw new Error('ElevenLabs finished but audio URL is missing.');
  }

  return {
    taskId,
    audioUrl,
    raw: json,
  };
};

export const pollElevenLabsDialogueTask = async (params: {
  apiKey: string;
  taskId: string;
  timeoutMs?: number;
}): Promise<ElevenLabsDialogueResult> => {
  const timeoutMs = params.timeoutMs ?? 180_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const result = await queryElevenLabsDialogueTask(params.apiKey, params.taskId);
      return result;
    } catch (error: any) {
      if (error?.message === 'Task not finished.') {
        await wait(2500);
        continue;
      }
      throw error;
    }
  }

  throw new Error('ElevenLabs dialogue task timeout.');
};

export const generateElevenLabsDialogueTrack = async (
  params: ElevenLabsDialogueRequest
): Promise<ElevenLabsDialogueResult> => {
  const taskId = await createElevenLabsDialogueTask(params);
  return pollElevenLabsDialogueTask({ apiKey: params.apiKey, taskId });
};

export const ELEVENLABS_DEFAULT_VOICE_ID = DEFAULT_VOICE_ID;
