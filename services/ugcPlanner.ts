import type {
  UGCPlannerOutput,
  UGCSceneGoal,
  UGCScenePlan,
  UGCWorkflowInputPayload,
} from '../types/ugcWorkflow';

const UGC_PLANNER_ENDPOINT = '/api/proxy/gemini-3-flash/v1/chat/completions';

const PLANNER_SYSTEM_PROMPT = [
  'You are The Creative Director and Copywriter for Indonesian UGC ads.',
  'Return JSON only, no markdown, no extra text.',
  'Language policy:',
  '- dialogue_id, dialogue_text_id, caption_id, hashtags -> Indonesian',
  '- visual_description_en, camera_direction_en, negative_prompt_en -> English',
  'Hard constraints:',
  '1) Exactly 4 scenes with scene_number 1..4.',
  '2) Scene 1 goal=hook_problem and show_product=false.',
  '3) Scene 2 goal=solution and show_product=true.',
  '4) Scene 3 goal=benefit and show_product=true.',
  '5) Scene 4 goal=cta and show_product=true.',
  '6) Keep continuity and identity consistency.',
  '7) No subtitle, no caption, no text overlay, no watermark, no logo.',
  '8) Keep each visual_description_en concise and practical.',
  'Required output schema keys:',
  '{',
  '  "visual_anchor": { "model_identity_lock": "string", "product_identity_lock": "string" },',
  '  "scenes": [',
  '    {',
  '      "scene_number": 1|2|3|4,',
  '      "goal": "hook_problem"|"solution"|"benefit"|"cta",',
  '      "show_product": boolean,',
  '      "duration_seconds": number,',
  '      "dialogue_id": "string",',
  '      "dialogue_text_id": "string",',
  '      "visual_description_en": "string",',
  '      "camera_direction_en": "string",',
  '      "negative_prompt_en": "string"',
  '    }',
  '  ],',
  '  "caption_id": "string",',
  '  "hashtags": ["string"]',
  '}',
].join('\n');

const GOALS_BY_SCENE: Record<number, UGCSceneGoal> = {
  1: 'hook_problem',
  2: 'solution',
  3: 'benefit',
  4: 'cta',
};

const SHOW_PRODUCT_BY_SCENE: Record<number, boolean> = {
  1: false,
  2: true,
  3: true,
  4: true,
};

const toText = (value: any, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((v) => toText(v)).join(' ').trim() || fallback;
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text.trim() || fallback;
    if (typeof value.content === 'string') return value.content.trim() || fallback;
    if (Array.isArray(value.content)) return value.content.map((v) => toText(v)).join(' ').trim() || fallback;
  }
  return fallback;
};

const extractJsonBlock = (text: string): string => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }
  return text.trim();
};

const normalizeScene = (sceneRaw: any, sceneNumber: number): UGCScenePlan => {
  const rawDialogueId =
    toText(sceneRaw?.dialogue_id) ||
    toText(sceneRaw?.dialogue?.id) ||
    toText(sceneRaw?.dialogue?.text) ||
    `Scene ${sceneNumber}`;
  const dialogueText =
    toText(sceneRaw?.dialogue_text_id) ||
    toText(sceneRaw?.dialogue?.text) ||
    toText(sceneRaw?.dialogue_id);

  return {
    scene_number: sceneNumber as 1 | 2 | 3 | 4,
    goal: GOALS_BY_SCENE[sceneNumber],
    show_product: SHOW_PRODUCT_BY_SCENE[sceneNumber],
    duration_seconds: Math.max(2, Math.min(6, Number(sceneRaw?.duration_seconds || 3) || 3)),
    dialogue_id: rawDialogueId,
    dialogue_text_id: dialogueText || rawDialogueId,
    visual_description_en: toText(sceneRaw?.visual_description_en, ''),
    camera_direction_en: toText(sceneRaw?.camera_direction_en, ''),
    negative_prompt_en: toText(
      sceneRaw?.negative_prompt_en,
      'No subtitle, no caption, no text overlay, no watermark, no logo.'
    ),
  };
};

const normalizePlannerOutput = (raw: any): UGCPlannerOutput => {
  const scenesRaw = Array.isArray(raw?.scenes) ? raw.scenes : [];
  const bySceneNumber = new Map<number, any>();
  scenesRaw.forEach((scene: any) => {
    const n = Number(scene?.scene_number);
    if (n >= 1 && n <= 4) bySceneNumber.set(n, scene);
  });

  const scenes: UGCScenePlan[] = [1, 2, 3, 4].map((sceneNumber) =>
    normalizeScene(bySceneNumber.get(sceneNumber) || {}, sceneNumber)
  );

  return {
    visual_anchor: {
      model_identity_lock: toText(
        raw?.visual_anchor?.model_identity_lock,
        'Preserve same face, age, skin tone, hairstyle, and body proportions across all scenes.'
      ),
      product_identity_lock: toText(
        raw?.visual_anchor?.product_identity_lock,
        'Preserve same product shape, color, branding, and material details across all scenes.'
      ),
    },
    scenes,
    caption_id: toText(raw?.caption_id, ''),
    hashtags: Array.isArray(raw?.hashtags)
      ? raw.hashtags.map((item: any) => toText(item)).filter(Boolean)
      : [],
  };
};

const buildUserPrompt = (
  input: UGCWorkflowInputPayload,
  backgroundLabel: string,
  backgroundPromptHint: string
): string => {
  return [
    'Create a production-ready 4-scene UGC plan.',
    `Product name: ${input.productName}`,
    `Product short description: ${input.productShortDescription}`,
    `Target audience: ${input.targetAudience || 'General Indonesia audience'}`,
    `Content type: ${input.contentType || 'UGC product recommendation'}`,
    `Campaign tone: ${input.campaignTone || 'Kasual, Gaul'}`,
    `Global aspect ratio: ${input.aspectRatioGlobal}`,
    `Background category: ${input.backgroundCategory}`,
    `Background preset: ${backgroundLabel}`,
    `Background visual hint: ${backgroundPromptHint}`,
    `Tonevoice (single speaker): ${input.tonevoice}`,
    `Language: ${input.language}`,
    `Additional brief: ${input.brief || '-'}`,
    'Scene rules:',
    '- Scene 1 = hook + problem, character only, product hidden.',
    '- Scene 2 = solution, product clearly visible.',
    '- Scene 3 = benefit, product clearly visible.',
    '- Scene 4 = CTA, product clearly visible.',
    '- Keep identity lock from model + product references.',
  ].join('\n');
};

const extractAssistantContentText = (payload: any): string => {
  const root = payload?.data || payload;
  const choice = root?.choices?.[0];
  const message = choice?.message || choice?.delta || root?.message || {};
  const text =
    toText(message?.content) ||
    toText(choice?.content) ||
    toText(root?.content) ||
    toText(root?.output_text);
  return text;
};

const requestUGCPlanner = async (params: {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<any> => {
  const requestBody = {
    messages: [
      {
        role: 'developer',
        content: [{ type: 'text', text: params.systemPrompt }],
      },
      {
        role: 'user',
        content: [{ type: 'text', text: params.userPrompt }],
      },
    ],
    stream: false,
    include_thoughts: false,
    reasoning_effort: 'low',
  };

  const maxAttempts = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(UGC_PLANNER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${params.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(
          `UGC planner request failed (${response.status}) on attempt ${attempt}: ${errorText.slice(0, 320)}`
        );
        (err as any).status = response.status;
        throw err;
      }

      const json = await response.json();
      const rawCode = Number(json?.code);
      if (!Number.isNaN(rawCode) && rawCode !== 200) {
        const err = new Error(
          `Gemini provider error (${rawCode}) on attempt ${attempt}: ${json?.msg || 'Unknown provider error'}`
        );
        (err as any).status = rawCode;
        throw err;
      }

      return json;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const status = Number((error as any)?.status || 0);
      const retryable = status === 500 || status === 502 || status === 503 || status === 504;
      if (!retryable || attempt >= maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
  }

  throw lastError || new Error('UGC planner request failed.');
};

export const buildUGCDialogueScript = (plan: UGCPlannerOutput): string => {
  return plan.scenes
    .map((scene) => {
      const line = toText(scene.dialogue_text_id || scene.dialogue_id, '');
      return line ? `Scene ${scene.scene_number}: ${line}` : '';
    })
    .filter(Boolean)
    .join('\n');
};

export const generateUGCPlan = async (params: {
  apiKey: string;
  input: UGCWorkflowInputPayload;
  backgroundLabel: string;
  backgroundPromptHint: string;
}): Promise<UGCPlannerOutput> => {
  const { apiKey, input, backgroundLabel, backgroundPromptHint } = params;
  const userPrompt = buildUserPrompt(input, backgroundLabel, backgroundPromptHint);

  const payload = await requestUGCPlanner({
    apiKey,
    systemPrompt: PLANNER_SYSTEM_PROMPT,
    userPrompt,
  });

  const rawText = extractAssistantContentText(payload);
  if (!rawText) {
    throw new Error('UGC planner returned empty content.');
  }

  const jsonText = extractJsonBlock(rawText);
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error: any) {
    throw new Error(`UGC planner JSON parse failed: ${error.message || String(error)}`);
  }

  return normalizePlannerOutput(parsed);
};
