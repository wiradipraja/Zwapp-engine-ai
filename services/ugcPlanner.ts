import {
  createGemini3FlashChatCompletion,
  DEFAULT_GEMINI_CHAT_DEVELOPER_PROMPT,
} from './geminiChat';
import type {
  UGCPlannerOutput,
  UGCSceneGoal,
  UGCScenePlan,
  UGCWorkflowInputPayload,
} from '../types/ugcWorkflow';

const PLANNER_SYSTEM_PROMPT = `${DEFAULT_GEMINI_CHAT_DEVELOPER_PROMPT}
You are also The Creative Director and Copywriter for UGC campaign production.
Return JSON only. No markdown. No explanation.
Use Indonesian language for dialogue/caption/hashtags.
Use English language for visual descriptions/camera/negative prompts.
Hard rules:
1. Always output exactly 4 scenes with scene_number 1..4.
2. Scene 1 goal=hook_problem and show_product=false.
3. Scene 2 goal=solution and show_product=true.
4. Scene 3 goal=benefit and show_product=true.
5. Scene 4 goal=cta and show_product=true.
6. Keep global aspect ratio consistency.
7. Never include subtitles, text overlays, logos, or watermark.
8. Scene 1 must show character only (no product visible).
9. Scene 2-4 must show product clearly and recognizable.
10. Make dialogue concise and actionable for Indonesian audience.
Output schema:
{
  "visual_anchor": {
    "model_identity_lock": "string",
    "product_identity_lock": "string"
  },
  "scenes": [
    {
      "scene_number": 1,
      "goal": "hook_problem",
      "show_product": false,
      "duration_seconds": 3,
      "dialogue_id": "string",
      "dialogue_text_id": "string",
      "visual_description_en": "string",
      "camera_direction_en": "string",
      "negative_prompt_en": "string"
    },
    {
      "scene_number": 2,
      "goal": "solution",
      "show_product": true,
      "duration_seconds": 3,
      "dialogue_id": "string",
      "dialogue_text_id": "string",
      "visual_description_en": "string",
      "camera_direction_en": "string",
      "negative_prompt_en": "string"
    },
    {
      "scene_number": 3,
      "goal": "benefit",
      "show_product": true,
      "duration_seconds": 3,
      "dialogue_id": "string",
      "dialogue_text_id": "string",
      "visual_description_en": "string",
      "camera_direction_en": "string",
      "negative_prompt_en": "string"
    },
    {
      "scene_number": 4,
      "goal": "cta",
      "show_product": true,
      "duration_seconds": 3,
      "dialogue_id": "string",
      "dialogue_text_id": "string",
      "visual_description_en": "string",
      "camera_direction_en": "string",
      "negative_prompt_en": "string"
    }
  ],
  "caption_id": "string",
  "hashtags": ["string"]
}`;

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
    const parsedSceneNumber = Number(scene?.scene_number);
    if (parsedSceneNumber >= 1 && parsedSceneNumber <= 4) {
      bySceneNumber.set(parsedSceneNumber, scene);
    }
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
    'Build a 4-scene UGC storyboard and copywriting payload.',
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
    'Visual constraints:',
    '- Scene 1 = hook + problem, character only, product hidden.',
    '- Scene 2 = solution, product clearly visible.',
    '- Scene 3 = benefit, product clearly visible.',
    '- Scene 4 = CTA, product clearly visible.',
    '- Keep visual consistency and identity lock from reference images.',
    '- No subtitle, no caption, no text overlay, no watermark, no logo.',
  ].join('\n');
};

const isProviderOutageError = (error: any): boolean => {
  const text = String(error?.message || error || '').toLowerCase();
  const status = Number((error as any)?.status || (error as any)?.apiCode || 0);
  return (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    text.includes('provider error (500)') ||
    text.includes('server exception') ||
    text.includes('maintained') ||
    text.includes('maintenance') ||
    text.includes('try again later') ||
    text.includes('http 500') ||
    text.includes('http 502') ||
    text.includes('http 503') ||
    text.includes('failed to fetch') ||
    text.includes('networkerror') ||
    text.includes('network error')
  );
};

const isAuthOrConfigError = (error: any): boolean => {
  const text = String(error?.message || error || '').toLowerCase();
  const status = Number((error as any)?.status || (error as any)?.apiCode || 0);
  return (
    status === 401 ||
    status === 403 ||
    text.includes('api key') ||
    text.includes('authentication') ||
    text.includes('unauthorized') ||
    text.includes('forbidden') ||
    text.includes('kie api key is required')
  );
};

const safeSentence = (value: string, fallback: string): string => {
  const cleaned = toText(value).replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
};

const buildLocalFallbackPlan = (params: {
  input: UGCWorkflowInputPayload;
  backgroundLabel: string;
  backgroundPromptHint: string;
}): UGCPlannerOutput => {
  const { input, backgroundLabel, backgroundPromptHint } = params;
  const productName = safeSentence(input.productName, 'produk ini');
  const productDesc = safeSentence(input.productShortDescription, 'manfaat produk yang relevan');
  const audience = safeSentence(input.targetAudience || '', 'audiens Indonesia');
  const tone = safeSentence(input.campaignTone || '', 'kasual');
  const messyRealismRule =
    input.backgroundCategory === 'INDONESIA_KELAS_BAWAH'
      ? 'Keep lower-income Indonesian environment realistic, slightly messy, and authentic without beautifying it.'
      : '';
  const negativeGlobal =
    'No subtitle, no caption, no text overlay, no watermark, no logo, no extra text artifacts.';

  const scenes: UGCScenePlan[] = [
    {
      scene_number: 1,
      goal: 'hook_problem',
      show_product: false,
      duration_seconds: 3,
      dialogue_id: `Kamu juga pernah ngerasain masalah ini sebelum pakai ${productName}?`,
      dialogue_text_id: `Kamu juga pernah ngerasain masalah ini sebelum pakai ${productName}?`,
      visual_description_en: [
        `Vertical UGC opening shot in ${backgroundLabel}.`,
        'Character-only frame, product is not visible.',
        `Convey daily problem related to: ${productDesc}.`,
        `Background hint: ${backgroundPromptHint}.`,
        messyRealismRule,
      ]
        .filter(Boolean)
        .join(' '),
      camera_direction_en:
        'Handheld phone framing, eye-level medium close-up, natural movement, emotional hook in first 3 seconds.',
      negative_prompt_en: negativeGlobal,
    },
    {
      scene_number: 2,
      goal: 'solution',
      show_product: true,
      duration_seconds: 3,
      dialogue_id: `Aku pilih ${productName} buat jadi solusi yang praktis.`,
      dialogue_text_id: `Aku pilih ${productName} buat jadi solusi yang praktis.`,
      visual_description_en: [
        `Same character and same environment continuity in ${backgroundLabel}.`,
        `Character introduces ${productName} clearly to camera.`,
        'Product must be fully visible and recognizable.',
        `Background hint: ${backgroundPromptHint}.`,
      ].join(' '),
      camera_direction_en:
        'Start from previous pose continuity, slight push-in to product reveal, keep handheld UGC realism.',
      negative_prompt_en: negativeGlobal,
    },
    {
      scene_number: 3,
      goal: 'benefit',
      show_product: true,
      duration_seconds: 3,
      dialogue_id: `Setelah pakai ${productName}, manfaatnya langsung kerasa: ${productDesc}.`,
      dialogue_text_id: `Setelah pakai ${productName}, manfaatnya langsung kerasa: ${productDesc}.`,
      visual_description_en: [
        `Same model identity lock and same ${productName} identity lock.`,
        'Show practical usage moment and positive expression.',
        'Product remains visible, clear label/shape consistency.',
      ].join(' '),
      camera_direction_en:
        'UGC close-up with natural hand interaction, brief reaction shot, maintain continuity from scene 2.',
      negative_prompt_en: negativeGlobal,
    },
    {
      scene_number: 4,
      goal: 'cta',
      show_product: true,
      duration_seconds: 3,
      dialogue_id: `Kalau kamu ${audience}, cobain ${productName} sekarang juga.`,
      dialogue_text_id: `Kalau kamu ${audience}, cobain ${productName} sekarang juga.`,
      visual_description_en: [
        `Final CTA frame in ${backgroundLabel}.`,
        'Character looks directly at camera while holding product confidently.',
        'Product must be visible and recognizable for final conversion moment.',
      ].join(' '),
      camera_direction_en:
        'Stable handheld closing shot, slight hold for CTA delivery, natural eye contact with camera.',
      negative_prompt_en: negativeGlobal,
    },
  ];

  return {
    visual_anchor: {
      model_identity_lock:
        'Preserve same face, age, skin tone, hairstyle, body proportions, and wardrobe continuity across all scenes.',
      product_identity_lock:
        'Preserve same product shape, size, color, branding, and material details across all scenes.',
    },
    scenes,
    caption_id: `${productName} bikin hidup lebih praktis. Cocok buat gaya ${tone}.`,
    hashtags: [
      `#${productName.replace(/[^a-zA-Z0-9]/g, '')}`,
      '#UGCIndonesia',
      '#KontenProduk',
      '#ReviewJujur',
      '#ZwappEngine',
    ],
  };
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
  try {
    const completion = await createGemini3FlashChatCompletion(
      apiKey,
      [
        { role: 'developer', content: PLANNER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        stream: false,
        includeThoughts: false,
        reasoningEffort: 'low',
      }
    );

    const rawText = toText(completion.content);
    if (!rawText) {
      throw new Error('Planner returned empty response.');
    }

    const jsonText = extractJsonBlock(rawText);
    const parsed = JSON.parse(jsonText);
    return normalizePlannerOutput(parsed);
  } catch (error: any) {
    if (isAuthOrConfigError(error)) {
      throw error;
    }

    if (isProviderOutageError(error)) {
      console.warn('[UGC Planner] Provider outage detected, using local fallback plan.', error?.message || error);
      return buildLocalFallbackPlan({ input, backgroundLabel, backgroundPromptHint });
    }

    const parseLikeError =
      error instanceof SyntaxError ||
      String(error?.message || '').toLowerCase().includes('unexpected token') ||
      String(error?.message || '').toLowerCase().includes('json');
    if (parseLikeError) {
      console.warn('[UGC Planner] JSON parse failed, using local fallback plan.');
      return buildLocalFallbackPlan({ input, backgroundLabel, backgroundPromptHint });
    }

    // For planner UX, fail closed to deterministic local plan for any non-auth runtime error.
    console.warn('[UGC Planner] Non-auth planner error, using local fallback plan.', error?.message || error);
    return buildLocalFallbackPlan({ input, backgroundLabel, backgroundPromptHint });
  }
};
