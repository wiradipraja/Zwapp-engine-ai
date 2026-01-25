// services/ugcGeminiService.ts
// UGC Script & Planning Service - GEMINI API ONLY (FREE)
// Based on PRD: Visual prompt = ENGLISH, Dialogue = BAHASA INDONESIA

import {
  ModelProfile,
  ProductProfile,
  NarrativeContext,
  GeneratedScript,
  SceneBreakdown,
  UGCPreferences,
} from '../types/ugc';

// --- SYSTEM PROMPT (PRD Compliant) ---
const UGC_SYSTEM_PROMPT = `
ROLE: Professional UGC Creative Director & Cinematographer.

CRITICAL GLOBAL RULES:
1. Visual prompt language = ENGLISH ONLY (for image generator accuracy)
2. Spoken dialogue/hook/cta language = BAHASA INDONESIA GAUL ONLY (for TikTok/Reels)
3. Motion must be continuous and physically realistic
4. Camera movement must be minimal, motivated, and ad-safe
5. Acting must feel human, imperfect, and natural (UGC Realism)
6. Dialogue must feel punchy, varied, and non-repetitive across scenes

BACKEND REALISM DIRECTIVE (MANDATORY, DO NOT OUTPUT):
You are a professional commercial photographer and visual director.
Your task is to generate a single continuous real-world photographic scene.
All objects, humans, hands, and products must exist in the same physical space.
Never treat elements as separate layers or composited objects.

PHYSICAL REALITY RULES:
- Every product must have real physical contact with something (hand, skin, surface, table, or ground).
- Contact must create realistic contact shadows and occlusion.
- No object may appear floating or artificially placed.
- Skin, surface, or environment must subtly reflect on the product material.
- Grip pressure, weight, and contact tension must appear natural.

LIGHTING CONSISTENCY:
- Use one coherent lighting setup for the entire scene.
- Shadows, highlights, and reflections must align from the same light source.
- No mismatched lighting or unnatural highlights are allowed.

CAMERA & DEPTH:
- Treat the scene as captured by a real camera.
- Specify realistic lens behavior and depth of field.
- All interacting elements must share the same focal plane unless physically separated.
- Perspective must be consistent across the entire image.

MATERIAL REALISM:
- Surfaces must show realistic texture, reflection, and micro-imperfections.
- Avoid CGI, overly smooth surfaces, or artificial sharpness.
- Include subtle imperfections when appropriate (fingerprints, smudges, wear).

SCENE TYPES:
- If a model is present: product must physically interact with the model.
- If only a hand is present: fingers must wrap naturally with skin deformation.
- If the product is standalone: it must rest on a real surface with a visible contact shadow.

STRICT PROHIBITIONS:
- No collage
- No overlay
- No pasted or floating objects
- No hard cutout edges
- No digital compositing artifacts
- No unrealistic separation between objects

STYLE:
- Photorealistic commercial product photography
- Natural, believable UGC aesthetic
- Shot as if captured in a real studio or real environment
- Always prioritize realism, physical interaction, and unified visual logic.
- The final image must appear as a single authentic photograph, never as a digital composite.

REFERENCE JSON (internal adapter, DO NOT OUTPUT):
{
  "ugc_scene_adapter": {
    "version": "1.0.0",
    "rules": {
      "model_product": [
        "Ensure the product is physically interacting with the model.",
        "Product casts soft shadow onto skin/clothing; subtle skin reflection visible on product."
      ],
      "hand_product": [
        "Fingers wrap naturally; skin deformation at grip points is visible.",
        "Contact shadow and occlusion between fingers and product must be present.",
        "Add subtle fingerprints/smudges on product surface when appropriate."
      ],
      "product_standalone": [
        "Product rests on a real surface with a clear contact shadow under the base.",
        "Surface has slight reflection near the base; reflections match the single light source."
      ]
    },
    "anti_composite": [
      "No collage, no overlay, no pasted look, no floating objects, no hard cutout edges.",
      "One coherent lighting setup; consistent highlights/shadows/reflections."
    ]
  }
}

DIALOGUE STYLE GUIDE (Bahasa Indonesia Gaul):
- Use "gue" NOT "saya/aku"
- Use "lo" NOT "kamu/anda"
- Use slang: "banget", "sih", "deh", "dong", "nih", "gak", "udah", "beneran", "worth it", "sumpah"
- Tone: Casual, relatable, like talking to bestie
`;

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface VisualAnchor {
  id: string;
  modelDescription: string;
  productDescription: string;
  backgroundContext: string;
  lightingProfile: string;
}

export interface UGCSceneFrame {
  visual_prompt: string;
  motion_notes: string;
  motion?: {
    character: string;
    gesture: string;
    camera: string;
    pacing: string;
    acting: string;
    ugc_realism?: {
      micro_expression: string;
      skin_detail: string;
      imperfection_level: string;
    };
  };
  generatedImageUrl?: string;
  quality_score?: number;
}

export interface UGCScene {
  scene_number: number;
  scenePurpose: string; // HOOK, PAIN, SOLUTION, PROOF, CTA
  objective: string;
  dialogue: {
    language: 'id';
    text: string;
    tone_voice: string;
  };
  star_frame?: UGCSceneFrame;
  end_frame?: UGCSceneFrame;
  visual_prompt?: string;
  generatedImageUrl?: string;
  quality_score?: number;
}

export interface UGCPlanResult {
  visualAnchor: VisualAnchor;
  scenes: UGCScene[];
  script: GeneratedScript;
}

/**
 * Generate complete UGC Plan using Gemini (FREE)
 * Returns: Visual Anchor + Scenes + Script
 */
export async function generateUGCPlan(
  modelProfile: ModelProfile,
  productProfile: ProductProfile,
  preferences: UGCPreferences | undefined,
  config: GeminiConfig
): Promise<UGCPlanResult> {
  const { apiKey, model = 'gemini-2.5-flash', temperature = 0.7, maxTokens = 4096 } = config;

  // Build context from preferences
  const targetTone = preferences?.brandTone || 'Friendly/Bestie';
  const targetObjective = preferences?.objective || 'Soft Selling';
  const targetPlatform = preferences?.platform || 'TikTok';
  const targetDuration = preferences?.videoDuration || '30s (5 scenes)';
  const customNote = preferences?.customNote || '';

  const prompt = `${UGC_SYSTEM_PROMPT}

INPUTS:
- Model Profile: ${preferences?.characterProfile || modelProfile.appearance || 'Young female model'}
- Outfit: ${preferences?.outfitStyle || 'Casual T-Shirt'}
- Product: ${productProfile.name || 'Product'}
- Product Category: ${preferences?.productCategory || productProfile.category || 'Skincare'}
- Background: ${preferences?.backgroundStyle || 'Living Room'}
- Lighting: ${preferences?.lightingStyle || 'Natural Window'}
- Framing: ${preferences?.framing || 'Selfie (Close Up)'}
- Platform: ${targetPlatform}
- Duration: ${targetDuration}
- Objective: ${targetObjective}
- Tone: ${targetTone}
${customNote ? `- Special Note: ${customNote}` : ''}

TASK: Generate a complete UGC video plan with 5 scenes.

SCENE STRUCTURE (PRD REQUIREMENT):
1. HOOK - Scroll-stopping opening (powerful question/statement)
2. PAIN - Relatable problem moment
3. SOLUTION - Product introduction (confident)
4. PROOF - Demonstration/social proof (calm, trustworthy)
5. CTA - Call to action (soft, direct)

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{
  "visualAnchor": {
    "id": "anchor_1",
    "modelDescription": "Detailed description of model appearance for image consistency (ENGLISH)",
    "productDescription": "Detailed description of product for accurate rendering (ENGLISH)",
    "backgroundContext": "Background/setting description (ENGLISH)",
    "lightingProfile": "Lighting setup description (ENGLISH)"
  },
  "scenes": [
    {
      "scene_number": 1,
      "scenePurpose": "HOOK",
      "objective": "Stop the scroll",
      "dialogue": {
        "language": "id",
        "text": "BAHASA INDONESIA GAUL dialogue here - use gue/lo/banget/sih",
        "tone_voice": "excited"
      },
      "star_frame": {
        "visual_prompt": "ENGLISH: Detailed visual description for image generator...",
        "motion_notes": "Character entry state",
        "motion": {
          "character": "posture description",
          "gesture": "hand/body movement",
          "camera": "static, eye-level, 9:16",
          "pacing": "2s action",
          "acting": "natural, casual",
          "ugc_realism": {
            "micro_expression": "soft blink, slight smile",
            "skin_detail": "natural pores visible",
            "imperfection_level": "realistic"
          }
        }
      },
      "end_frame": {
        "visual_prompt": "ENGLISH: End state visual description...",
        "motion_notes": "Character action state",
        "motion": { ... same structure ... }
      }
    }
  ],
  "script": {
    "title": "Script title",
    "duration": 30,
    "hook": "BAHASA INDONESIA - Opening hook",
    "problemStatement": "BAHASA INDONESIA - Problem",
    "solution": "BAHASA INDONESIA - Solution",
    "cta": "BAHASA INDONESIA - Call to action",
    "voiceoverText": "BAHASA INDONESIA - Full narration"
  }
}

Generate 5 scenes following the structure above. All dialogue MUST be in Bahasa Indonesia Gaul. All visual_prompt MUST be in English.`;

  try {
    // USE KIE AI ENDPOINT - this ensures requests are logged in KIE dashboard
    console.log('[UGC Gemini] Using KIE AI Gemini Chat Completions');
    const response = await fetch(
      'https://api.kie.ai/gemini-3-flash/v1/chat/completions',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: prompt }],
            },
          ],
          stream: false,
          include_thoughts: false,
          reasoning_effort: 'high',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KIE Gemini API Error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    
    // Extract content from KIE chat completions format
    let content = '';
    const messageContent = data?.choices?.[0]?.message?.content;
    if (typeof messageContent === 'string') {
      content = messageContent;
    } else if (Array.isArray(messageContent)) {
      content = messageContent.map((part: any) => part?.text || part?.content || '').join('');
    } else if (messageContent?.text) {
      content = messageContent.text;
    }

    if (!content) {
      throw new Error('No content received from Gemini');
    }

    // Clean JSON response
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
    else if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
    if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
    cleanContent = cleanContent.trim();

    const result = JSON.parse(cleanContent);

    // Build GeneratedScript from result
    const generatedScript: GeneratedScript = {
      id: crypto.randomUUID(),
      title: result.script?.title || 'UGC Script',
      duration: result.script?.duration || 30,
      hook: result.script?.hook || result.scenes?.[0]?.dialogue?.text || '',
      problemStatement: result.script?.problemStatement || '',
      solution: result.script?.solution || '',
      cta: result.script?.cta || '',
      fullNarrative: result.script?.voiceoverText || '',
      scenes: (result.scenes || []).map((s: any, idx: number) => ({
        sceneNumber: s.scene_number || idx + 1,
        setting: s.star_frame?.visual_prompt || '',
        action: s.star_frame?.motion?.character || '',
        dialogue: s.dialogue?.text || '',
        productPlacement: s.star_frame?.motion?.gesture || '',
        emotionalBeat: s.dialogue?.tone_voice || '',
      })),
      sceneBreakdown: (result.scenes || []).map((s: any, idx: number) => ({
        sceneNumber: s.scene_number || idx + 1,
        description: s.objective || '',
        backgroundDescription: s.star_frame?.visual_prompt || '',
        modelAction: s.star_frame?.motion?.character || '',
        narrativePoint: s.dialogue?.text || '',
        productPlacement: s.star_frame?.motion?.gesture || '',
        modelExpression: s.dialogue?.tone_voice || '',
        cameraAngle: s.star_frame?.motion?.camera || 'medium-shot',
      })),
      voiceoverText: result.script?.voiceoverText || '',
      generatedAt: Date.now(),
      model: 'gemini-2.5-flash',
    };

    return {
      visualAnchor: result.visualAnchor || {
        id: 'anchor_default',
        modelDescription: '',
        productDescription: '',
        backgroundContext: '',
        lightingProfile: '',
      },
      scenes: result.scenes || [],
      script: generatedScript,
    };
  } catch (error) {
    console.error('[UGC Gemini] Plan generation error:', error);
    throw new Error(`UGC Plan generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate visual prompt for a specific scene (Gemini)
 * Used for refining/regenerating scene prompts
 */
export async function generateSceneVisualPrompt(
  scene: UGCScene,
  visualAnchor: VisualAnchor,
  config: GeminiConfig
): Promise<string> {
  const { apiKey, model = 'gemini-2.5-flash' } = config;

  const prompt = `Generate a detailed visual prompt (ENGLISH ONLY) for image generation.

VISUAL ANCHOR:
- Model: ${visualAnchor.modelDescription}
- Product: ${visualAnchor.productDescription}
- Background: ${visualAnchor.backgroundContext}
- Lighting: ${visualAnchor.lightingProfile}

SCENE CONTEXT:
- Purpose: ${scene.scenePurpose}
- Dialogue: "${scene.dialogue?.text}"
- Action: ${scene.star_frame?.motion?.character || 'natural pose'}

Generate a single paragraph visual prompt in ENGLISH that describes exactly what the image should look like. Include model pose, expression, product placement, background, and lighting. Keep it under 200 words.`;

  // USE KIE AI ENDPOINT
  console.log('[UGC Gemini] Generating visual prompt via KIE Gemini');
  const response = await fetch(
    'https://api.kie.ai/gemini-3-flash/v1/chat/completions',
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }],
          },
        ],
        stream: false,
        include_thoughts: false,
        reasoning_effort: 'low',
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate visual prompt: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const messageContent = data?.choices?.[0]?.message?.content;
  if (typeof messageContent === 'string') {
    return messageContent.trim();
  } else if (Array.isArray(messageContent)) {
    return messageContent.map((p: any) => p?.text || p?.content || '').join('').trim();
  } else if (messageContent?.text) {
    return messageContent.text.trim();
  }
  return '';
}
