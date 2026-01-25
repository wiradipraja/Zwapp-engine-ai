// services/scriptGeneration.ts
// Google Gemini Integration untuk Script Generation (FREE API)

import {
  ModelProfile,
  ProductProfile,
  NarrativeContext,
  GeneratedScript,
  SceneBreakdown,
  NarrationLanguage,
  UGCContentStyle,
  UGC_CONTENT_STYLES,
  UGCPreferences,
  DEFAULT_UGC_PREFERENCES
} from '../types/ugc';
import { NANO_BANANA_UGC_CONFIG } from './ugcPromptBuilder';

export interface ScriptGenerationConfig {
  apiKey: string;
  provider?: 'google' | 'kie';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  language?: NarrationLanguage;
  contentStyle?: UGCContentStyle;
  preferences?: UGCPreferences;
}

function normalizeJsonCandidate(raw: string): string {
  let text = raw.trim();

  if (text.startsWith('```json')) {
    text = text.slice(7);
  } else if (text.startsWith('```')) {
    text = text.slice(3);
  }
  if (text.endsWith('```')) {
    text = text.slice(0, -3);
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

function escapeNewlinesInStrings(text: string): string {
  let result = '';
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (isEscaped) {
        result += ch;
        isEscaped = false;
        continue;
      }
      if (ch === '\\') {
        result += ch;
        isEscaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
        result += ch;
        continue;
      }
      if (ch === '\n') {
        result += '\\n';
        continue;
      }
      if (ch === '\r') {
        result += '\\r';
        continue;
      }
      if (ch === '\t') {
        result += '\\t';
        continue;
      }
      if (ch.charCodeAt(0) < 0x20) {
        result += ' ';
        continue;
      }
      result += ch;
      continue;
    }

    if (ch === '"') {
      inString = true;
      result += ch;
      continue;
    }
    result += ch;
  }

  return result;
}

function repairJsonStringLax(text: string): string {
  let result = '';
  let inString = false;
  let isEscaped = false;
  let expectingKey = false;
  let stringRole: 'key' | 'value' | null = null;
  const stack: Array<'object' | 'array'> = [];

  const nextNonWhitespace = (start: number): string => {
    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];
      if (!/\s/.test(ch)) return ch;
    }
    return '';
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (!inString) {
      if (ch === '{') {
        stack.push('object');
        expectingKey = true;
        result += ch;
        continue;
      }
      if (ch === '[') {
        stack.push('array');
        expectingKey = false;
        result += ch;
        continue;
      }
      if (ch === '}' || ch === ']') {
        stack.pop();
        expectingKey = stack[stack.length - 1] === 'object';
        result += ch;
        continue;
      }
      if (ch === ':') {
        expectingKey = false;
        result += ch;
        continue;
      }
      if (ch === ',') {
        expectingKey = stack[stack.length - 1] === 'object';
        result += ch;
        continue;
      }
      if (ch === '"') {
        inString = true;
        stringRole = expectingKey ? 'key' : 'value';
        result += ch;
        continue;
      }
      result += ch;
      continue;
    }

    if (isEscaped) {
      result += ch;
      isEscaped = false;
      continue;
    }
    if (ch === '\\') {
      result += ch;
      isEscaped = true;
      continue;
    }
    if (ch === '"') {
      const next = nextNonWhitespace(i + 1);
      const isKeyClose = stringRole === 'key' && next === ':';
      const isValueClose = stringRole === 'value' && (next === ',' || next === '}' || next === ']' || next === '');

      if (isKeyClose || isValueClose) {
        inString = false;
        stringRole = null;
        result += ch;
      } else {
        result += '\\"';
      }
      continue;
    }
    if (ch === '\n') {
      result += '\\n';
      continue;
    }
    if (ch === '\r') {
      result += '\\r';
      continue;
    }
    if (ch === '\t') {
      result += '\\t';
      continue;
    }
    if (ch.charCodeAt(0) < 0x20) {
      result += ' ';
      continue;
    }

    result += ch;
  }

  return result;
}

function parseJsonSafe(raw: string): any {
  const normalized = normalizeJsonCandidate(raw);

  try {
    return JSON.parse(normalized);
  } catch (err) {
    const repaired = repairJsonStringLax(escapeNewlinesInStrings(normalized)).replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(repaired);
  }
}

function getTargetSceneCount(preferences?: UGCPreferences): number {
  const duration = preferences?.videoDuration || '';
  if (/15s/i.test(duration) || /3\s*scenes/i.test(duration)) {
    return 3;
  }
  if (/30s/i.test(duration) || /5\s*scenes/i.test(duration)) {
    return 5;
  }
  return 5;
}

function getFallbackDialogue(
  targetLanguage: 'ID' | 'EN',
  purpose: 'HOOK' | 'PAIN' | 'SOLUTION' | 'PROOF' | 'CTA',
  productName: string
): string {
  if (targetLanguage === 'ID') {
    switch (purpose) {
      case 'HOOK':
        return `Lo pernah ngerasa susah banget cari ${productName || 'produk'} yang beneran oke gak sih?`;
      case 'PAIN':
        return `Gue sering banget kecewa sama produk lain yang kualitasnya biasa aja dan gak sesuai ekspektasi.`;
      case 'SOLUTION':
        return `Untungnya sekarang gue nemu ${productName}, ini beneran game changer banget sih!`;
      case 'PROOF':
        return `Liat deh hasilnya, beneran beda banget kan? Kualitasnya ga main-main.`;
      case 'CTA':
        return `Buruan cobain ${productName} sekarang, jangan sampe nyesel belakangan!`;
      default:
        return `Gue rekomend banget ${productName} ini buat lo yang mau upgrade lifestyle.`;
    }
  }

  // Generic English Fallback
  switch (purpose) {
    case 'HOOK':
      return `Have you ever struggled to find a ${productName || 'product'} that actually works?`;
    case 'PAIN':
      return `I used to be so frustrated with low quality options that basically did nothing.`;
    case 'SOLUTION':
      return `Then I found ${productName} and it completely changed everything for me!`;
    case 'PROOF':
      return `Just look at this quality, it's honestly on another level compared to others.`;
    case 'CTA':
      return `You seriously need to try ${productName}, grab yours before it's gone!`;
    default:
      return `I highly recommend ${productName}, it's absolutely worth it.`;
  }
}

function ensureScenes(
  scriptData: any,
  targetSceneCount: number,
  targetLanguage: 'ID' | 'EN',
  productName: string
): any {
  const baseScenes = Array.isArray(scriptData.scenes) ? [...scriptData.scenes] : [];
  const purposes: Array<'HOOK' | 'PAIN' | 'SOLUTION' | 'PROOF' | 'CTA'> = [
    'HOOK',
    'PAIN',
    'SOLUTION',
    'PROOF',
    'CTA',
  ];

  const fallbackVisuals = [
    {
      setting: 'Cozy living room with natural window light, subtle lifestyle decor',
      action: 'Model addresses the camera in selfie mode with a relatable expression',
      productPlacement: 'No product visible yet, focus on model expression',
      emotionalBeat: 'Curiosity',
    },
    {
      setting: 'Kitchen counter with light clutter and everyday items',
      action: 'Model points at the messy area to show the problem',
      productPlacement: 'Product not shown yet, problem-focused',
      emotionalBeat: 'Frustration',
    },
    {
      setting: 'Clean countertop with warm daylight',
      action: `Model holds the ${productName} and shows how it organizes items`,
      productPlacement: `Product clearly visible in hand (${productName})`,
      emotionalBeat: 'Relief',
    },
    {
      setting: 'Close-up tabletop shot with organized items',
      action: `Model demonstrates the ${productName} in use, showing neat results`,
      productPlacement: `${productName} centered with visible contents`,
      emotionalBeat: 'Confidence',
    },
    {
      setting: 'Bright lifestyle corner with minimal props',
      action: `Model gestures to the ${productName} and smiles to camera`,
      productPlacement: `${productName} placed on surface with clean framing`,
      emotionalBeat: 'Satisfaction',
    },
  ];

  const targetPurposes = purposes.slice(0, targetSceneCount);

  while (baseScenes.length < targetSceneCount) {
    const idx = baseScenes.length;
    const purpose = targetPurposes[idx] || 'CTA';
    const fallback = fallbackVisuals[idx] || fallbackVisuals[fallbackVisuals.length - 1];
    const dialogueSource =
      purpose === 'HOOK'
        ? scriptData.hook
        : purpose === 'PAIN'
        ? scriptData.problemStatement
        : purpose === 'SOLUTION'
        ? scriptData.solution
        : purpose === 'CTA'
        ? scriptData.cta
        : '';

    baseScenes.push({
      sceneNumber: idx + 1,
      scenePurpose: purpose,
      setting: fallback.setting,
      action: fallback.action,
      dialogue: dialogueSource || getFallbackDialogue(targetLanguage, purpose, productName),
      productPlacement: fallback.productPlacement,
      emotionalBeat: fallback.emotionalBeat,
      voiceOver: getFallbackDialogue(targetLanguage, purpose, productName),
    });
  }

  const normalizedScenes = baseScenes.slice(0, targetSceneCount).map((scene, idx) => {
    const fallback = fallbackVisuals[idx] || fallbackVisuals[fallbackVisuals.length - 1];
    return {
      sceneNumber: scene.sceneNumber || idx + 1,
      scenePurpose: scene.scenePurpose || targetPurposes[idx],
      setting: scene.setting || fallback.setting,
      action: scene.action || fallback.action,
      dialogue: scene.dialogue || getFallbackDialogue(targetLanguage, targetPurposes[idx], productName),
      productPlacement: scene.productPlacement || fallback.productPlacement,
      emotionalBeat: scene.emotionalBeat || fallback.emotionalBeat,
      voiceOver: scene.voiceOver || getFallbackDialogue(targetLanguage, targetPurposes[idx], productName),
    };
  });

  return {
    ...scriptData,
    scenes: normalizedScenes,
  };
}

function buildFallbackScriptData(
  targetLanguage: 'ID' | 'EN',
  productName: string,
  targetDuration: string
): any {
  const duration = /15s/i.test(targetDuration) ? 15 : 30;
  return {
    title: `${productName} UGC Script`,
    duration,
    hook: getFallbackDialogue(targetLanguage, 'HOOK', productName),
    problemStatement: getFallbackDialogue(targetLanguage, 'PAIN', productName),
    solution: getFallbackDialogue(targetLanguage, 'SOLUTION', productName),
    cta: getFallbackDialogue(targetLanguage, 'CTA', productName),
    scenes: [],
    voiceoverText: '',
  };
}

async function callGoogleGeminiDirect(
  apiKey: string,
  modelName: string, 
  systemInstruction: string,
  userPrompt: string,
  images: { url: string }[] = [],
  temperature: number = 0.8
): Promise<string> {
  // Safe model selection - force gemini-2.5-flash as default if generic text passed
  const finalModel = modelName.includes('gemini') ? modelName : 'gemini-2.5-flash';
  
  // Log URL for debugging 404s
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${apiKey}`;
  console.log(`[Gemini Direct] Calling URL: https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent`);

  // Membangun request body sesuai standar Google Gemini
  const parts: any[] = [{ text: userPrompt }];
  
  const requestBody = {
    system_instruction: {
      parts: { text: systemInstruction }
    },
    contents: [
      {
        role: "user",
        parts: parts
      }
    ],
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Gemini Direct] Response Error ${response.status}:`, errorText);
      // Safe error logging without exposing key
      throw new Error(`Google Gemini API Error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Empty response from Google Gemini');
    }

    return textResponse;

  } catch (error) {
    console.error('Direct Gemini Call Failed:', error);
    throw error;
  }
}

async function repairJsonWithModel(
  raw: string,
  provider: 'google' | 'kie',
  apiKey: string,
  model: string
): Promise<string> {
  const repairInstruction =
    'Fix the JSON below. Return ONLY valid JSON (no markdown, no explanations). ' +
    'Preserve all fields and values. Escape newlines inside strings and add missing commas if needed.';

  const combinedPrompt = `${repairInstruction}\n\n${raw}`;

  try {
     return await callGoogleGeminiDirect(
         apiKey,
         model,
         "You are a strict JSON repair tool. Return ONLY raw JSON.",
         combinedPrompt,
         [],
         0.1
     );
  } catch (e) {
      console.error("JSON Repair failed:", e);
      // Return original or empty if repair fails
      return "";
  }
}

/**
 * Generate UGC script using Google Gemini (FREE)
 * Creates scene-based script with model/product integration
 */
export async function generateScriptWithGemini(
  modelProfile: ModelProfile,
  productProfile: ProductProfile,
  narrativeContext: NarrativeContext,
  config: ScriptGenerationConfig
): Promise<GeneratedScript> {
  const {
    apiKey,
    provider,
    model = 'gemini-2.5-flash', // Updated to 2.5 Flash as requested
    temperature = 0.7,
    maxTokens = 8192, // Increased from 2048 to prevent truncated JSON responses
    language = 'EN',
    contentStyle = 'selfie',
    preferences
  } = config;

  // Get content style info
  const styleInfo = UGC_CONTENT_STYLES.find(s => s.id === contentStyle) || UGC_CONTENT_STYLES[0];
  
  // Use Preferences if available (Identity Lock System)
  const targetObjective = preferences?.objective || narrativeContext.campaignGoal || 'Soft Selling';
  const targetTone = preferences?.brandTone || narrativeContext.brandVoice || 'Friendly/Bestie';
  const targetPlatform = preferences?.platform || 'TikTok';
  const targetDuration = preferences?.videoDuration || '30s';
  const customNote = preferences?.customNote ? `\nSPECIAL INSTRUCTION: ${preferences.customNote}` : '';
  const productName = productProfile.name || 'Product';
  const lowerProductName = productName.toLowerCase();
  const isDefaultCategory = preferences?.productCategory === DEFAULT_UGC_PREFERENCES.productCategory;
  const hasSkincareCue = /(skin|serum|cream|lotion|face|beauty|cosmetic|moistur|sunscreen|toner|acne)/.test(lowerProductName);
  const shouldUsePreferenceCategory = preferences?.productCategory && (!isDefaultCategory || hasSkincareCue);
  const safeProductCategory =
    (shouldUsePreferenceCategory ? preferences?.productCategory : undefined) ||
    productProfile.category ||
    'General';
  const productIdentityRules = `PRODUCT IDENTITY RULES:
- Use product name EXACTLY as provided: "${productName}" (do NOT rename).
- If product type is unclear, keep it generic (e.g., "plastic container" or "household container").
- Do NOT assume skincare/beauty unless explicitly indicated by the product name or reference image.
- If reference images are provided, they are the single source of truth for product identity.`;
  
  // Language instruction - CRITICAL for dialogue output
  // Now handles both ID and EN properly based on 'preferences.language' or 'config.language'
  const targetLanguage = preferences?.language?.includes('ID') ? 'ID' : (language === 'ID' ? 'ID' : 'EN');
  
  const languageInstruction = targetLanguage === 'ID' 
    ? `⚠️ CRITICAL LANGUAGE REQUIREMENT - BAHASA INDONESIA WAJIB ⚠️

SEMUA dialogue, hook, problemStatement, solution, cta, dan voiceOver HARUS ditulis dalam BAHASA INDONESIA GAUL.

Gaya bahasa yang WAJIB digunakan:
- Gunakan "gue" bukan "saya" atau "aku"
- Gunakan "lo" bukan "kamu" atau "anda"  
- Gunakan kata-kata gaul: "banget", "sih", "deh", "dong", "nih", "gak", "udah", "beneran", "worth it"
- Tone: ${targetTone}

CONTOH DIALOGUE YANG BENAR:
- "Guys, gue akhirnya nemu produk yang beneran works!"
- "Sumpah ini worth it banget sih!"
- "Lo harus cobain deh, gak bakal nyesel!"

❌ DILARANG menggunakan bahasa Inggris untuk dialogue/hook/cta
✅ Visual description (setting, action, productPlacement) tetap dalam English`
    : `LANGUAGE REQUIREMENT: All dialogue, hook, problemStatement, solution, cta, and voiceOver must be written in ENGLISH.
Tone: ${targetTone}. Keep it conversational and relatable.`;
  
  // Style instruction
  const styleInstruction = `CONTENT STYLE: ${styleInfo.name}
- Camera Style: ${styleInfo.cameraStyle}
- Visual Approach: ${styleInfo.promptModifier}
- Platform: ${targetPlatform} (Optimize structure for this platform)`;

  // Hook templates based on objective
  const hookTemplates = targetLanguage === 'ID' 
    ? `HOOK TEMPLATES (Choose one best for ${targetObjective}):
a. [Problem/Agitation] "Kalian ngerasa ga sih kalau [MASALAH] itu ganggu banget?"
b. [Direct Benefit] "Akhirnya gue nemu [PRODUK] yang beneran [SOLUSI]!"
c. [Curiosity] "Ini dia rahasia [HASIL] yang gue sembunyiin selama ini!"

Hook HARUS powerful, menembus FYP, dan sesuai objective: ${targetObjective}!`
    : `HOOK TEMPLATES (Choose one best for ${targetObjective}):
a. [Problem] "Do you hate it when [PROBLEM] happens?"
b. [Benefit] "Finally found a [PRODUCT] that actually [SOLUTION]!"
c. [Secret] "I've been gatekeeping this [RESULT] secret for too long!"`;

  // Build detailed prompt for script generation
  const prompt = `Kamu adalah CREATIVE DIRECTOR & UGC SCRIPTWRITER senior untuk agensi pemasaran terkemuka.
Buatlah cerita visual berkesinambungan untuk iklan produk UGC (User Generated Content) yang POWERFUL, tidak monoton, dan tidak kaku.

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

${languageInstruction}

${styleInstruction}

${hookTemplates}

${customNote}

IMPORTANT RULES:
1. Visual Description (setting, action, productPlacement) = ALWAYS in English (untuk akurasi image generator)
2. Dialogue/Dialog Model = WAJIB sesuai bahasa yang dipilih (${targetLanguage})
3. Marketing Copy Style = ${targetTone} (Focus on ${targetObjective})
4. Durasi optimal: ${targetDuration}
5. Include 3-5 scenes (sesuai durasi) dengan transisi yang jelas
6. Jangan repetitif: variasikan panjang kalimat, ritme, dan choice of words antar scene
7. Hindari frasa generik/klise; gunakan detail spesifik dan vivid
8. Setiap scene harus punya tujuan emosional yang berbeda, tidak datar

MODEL PROFILE (IDENTITY LOCK):
- Character: ${preferences?.characterProfile || modelProfile.appearance}
- Outfit: ${preferences?.outfitStyle || modelProfile.outfitStyle || 'Casual'}
- Background Preference: ${preferences?.backgroundStyle || 'Aesthetic Room'}
- Lighting Preference: ${preferences?.lightingStyle || 'Natural Light'}
- Framing Preference: ${preferences?.framing || 'Selfie'}

PRODUCT:
- Name: ${productName}
- Category: ${safeProductCategory}
- Key Features: ${productProfile.keyFeatures.join(', ')}
- Price Perception: ${preferences?.priceRange || productProfile.priceRange || 'Affordable'}

${productIdentityRules}

BRAND NARRATIVE:
- Objective: ${targetObjective}
- Tone: ${targetTone}
- Target Platform: ${targetPlatform}

SCENE STRUCTURE (PRD REQUIREMENT - EXACTLY 5 SCENES):
1. HOOK - Scroll-stopping opening (powerful statement/question)
2. PAIN/PROBLEM - Relatable problem moment
3. SOLUTION - Product introduction as solution (confident)
4. PROOF - Social proof/demonstration (calm, trustworthy)
5. CTA - Call to action (soft, direct)

VOICE OVER RULES (per scene):
- 1 scene = 1 kalimat saja
- 12-16 kata per kalimat
- Conversational, 130-160 WPM speaking pace

Generate a UGC script. Return ONLY valid JSON (no markdown) with this structure:
{
  "title": "Script title",
  "duration": 30,
  "hook": "The powerful opening hook (${targetLanguage === 'ID' ? 'dalam Bahasa Indonesia gaul' : 'in English'})",
  "problemStatement": "The problem being addressed (${targetLanguage === 'ID' ? 'Bahasa Indonesia' : 'English'})",
  "solution": "How the product solves it (${targetLanguage === 'ID' ? 'Bahasa Indonesia' : 'English'})",
  "cta": "Call to action (${targetLanguage === 'ID' ? 'Bahasa Indonesia' : 'English'})",
  "scenes": [
    {
      "sceneNumber": 1,
      "scenePurpose": "HOOK",
      "setting": "Description of setting (ALWAYS IN ENGLISH)",
      "action": "What the model does (ALWAYS IN ENGLISH)",
      "dialogue": "What the model SAYS - MUST BE IN ${targetLanguage === 'ID' ? 'BAHASA INDONESIA GAUL (gunakan: gue, lo, banget, sih, deh)' : 'ENGLISH'}",
      "productPlacement": "How product is shown (ALWAYS IN ENGLISH)",
      "emotionalBeat": "The emotional moment (ALWAYS IN ENGLISH)",
      "voiceOver": "12-16 word sentence for this scene (${targetLanguage === 'ID' ? 'Bahasa Indonesia' : 'English'})"
    }
  ],
  "voiceoverText": "Full narration combining all scenes"
}

IMPORTANT JSON RULES:
- Output must be a single valid JSON object (no markdown, no extra text).
- Escape all quotes/newlines inside strings (use \\n for line breaks).
- Do NOT include trailing commas.`;

  try {
    console.log('[UGC Script] Using DIRECT Google Gemini API');

    // Separate System Prompt and User Prompt for best results with Gemini
    const systemPromptBase = `Kamu adalah CREATIVE DIRECTOR & UGC SCRIPTWRITER senior.\n${languageInstruction}\n${styleInstruction}`;
    
    // Combine the rest into User Prompt
    const userPromptFull = `${prompt}\n\nPlease generate the JSON based on these details.`;

    // Call direct Gemini function
    const content = await callGoogleGeminiDirect(
        apiKey,
        model, 
        systemPromptBase,
        userPromptFull,
        [], // Processing images skipped for text stability
        temperature
    );

    console.log('[UGC Script] Gemini Response Length:', content.length);

    // Parse JSON response 
    let scriptData: any;
    try {
      scriptData = parseJsonSafe(content);
    } catch (parseError) {
       console.error('JSON Parse error, trying fallback/repair...');
       try {
           // We pass 'google' as provider but it is ignored by new implementation
           const repairedContent = await repairJsonWithModel(content, 'google', apiKey, model);
           scriptData = parseJsonSafe(repairedContent);
       } catch (e) {
           console.error('Repair failed, using fallback script');
           scriptData = buildFallbackScriptData(targetLanguage, productName, targetDuration);
       }
    }

    const resolvedModelName = model; // Ensure model name is carried over

    const targetSceneCount = getTargetSceneCount(preferences);
    scriptData = ensureScenes(scriptData, targetSceneCount, targetLanguage, productName);
    if (!scriptData.voiceoverText && Array.isArray(scriptData.scenes)) {
      scriptData.voiceoverText = scriptData.scenes
        .map((scene: any) => scene.voiceOver || scene.dialogue || '')
        .filter(Boolean)
        .join(' ');
    }

    // Build sceneBreakdown for UGC format
    const sceneBreakdown: SceneBreakdown[] = (scriptData.scenes || []).map(
      (scene: any, idx: number) => ({
        sceneNumber: scene.sceneNumber || idx + 1,
        description: scene.setting || '',
        backgroundDescription: scene.setting || scene.backgroundDescription || '',
        modelAction: scene.action || scene.modelAction || '',
        narrativePoint: scene.dialogue || scene.narrativePoint || '',
        productPlacement: scene.productPlacement || '',
        modelExpression: scene.emotionalBeat || scene.modelExpression || '',
        cameraAngle: 'medium-shot',
      })
    );

    // Build scenes for GeneratedScript format
    const scenes = (scriptData.scenes || []).map(
      (scene: any, idx: number) => ({
        sceneNumber: scene.sceneNumber || idx + 1,
        setting: scene.setting || '',
        action: scene.action || '',
        dialogue: scene.dialogue || '',
        productPlacement: scene.productPlacement || '',
        emotionalBeat: scene.emotionalBeat || '',
      })
    );

    const generatedScript: GeneratedScript = {
      id: crypto.randomUUID(),
      title: scriptData.title || 'Untitled Script',
      duration: scriptData.duration || 24,
      hook: scriptData.hook || '',
      problemStatement: scriptData.problemStatement || '',
      solution: scriptData.solution || '',
      cta: scriptData.cta || '',
      fullNarrative: scriptData.voiceoverText || '',
      scenes,
      sceneBreakdown,
      voiceoverText: scriptData.voiceoverText || '',
      generatedAt: Date.now(),
      model: resolvedModelName,
    };

    return generatedScript;
  } catch (error) {
    console.error('Gemini script generation error:', error);
    throw new Error(
      `Script generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Alias for backward compatibility
export const generateScriptWithOpenAI = generateScriptWithGemini;

/**
 * Estimate cost for script generation (Gemini is FREE)
 */
export function estimateScriptGenerationCost(model: string): number {
  // Gemini 1.5 Flash is FREE for up to 15 requests/minute
  // Gemini 1.5 Pro has a free tier too
  const costs: Record<string, number> = {
    'gemini-2.5-flash': 0, // FREE
    'gemini-1.5-pro': 0, // FREE (limited)
    'gemini-pro': 0, // FREE
  };
  return costs[model] || 0;
}

/**
 * Refine/iterate on existing script
 */
export async function refineScriptWithGemini(
  currentScript: GeneratedScript,
  feedback: string,
  config: ScriptGenerationConfig
): Promise<GeneratedScript> {
  const { apiKey, model = 'gemini-2.5-flash' } = config;

  const refinementPrompt = `You are refining a UGC script based on feedback.

CURRENT SCRIPT:
${JSON.stringify(currentScript, null, 2)}

FEEDBACK:
${feedback}

Please refine the script based on the feedback. Return ONLY valid JSON (no markdown, no code blocks) with the same structure as the current script.`;

  try {
     console.log('[UGC Script] Refining script via DIRECT Google Gemini');
     
     const content = await callGoogleGeminiDirect(
         apiKey,
         model,
         "You are a professional script editor. Return ONLY valid JSON.",
         refinementPrompt,
         [],
         0.7
     );
     
     const refinedData = parseJsonSafe(content);

    // Build sceneBreakdown for UGC format
    const sceneBreakdown: SceneBreakdown[] = (refinedData.scenes || []).map(
      (scene: any, idx: number) => ({
        sceneNumber: scene.sceneNumber || idx + 1,
        description: scene.setting || '',
        backgroundDescription: scene.setting || scene.backgroundDescription || '',
        modelAction: scene.action || scene.modelAction || '',
        narrativePoint: scene.dialogue || scene.narrativePoint || '',
        productPlacement: scene.productPlacement || '',
        modelExpression: scene.emotionalBeat || scene.modelExpression || '',
        cameraAngle: 'medium-shot',
      })
    );

    // Build scenes for GeneratedScript format
    const scenes = (refinedData.scenes || []).map(
      (scene: any, idx: number) => ({
        sceneNumber: scene.sceneNumber || idx + 1,
        setting: scene.setting || '',
        action: scene.action || '',
        dialogue: scene.dialogue || '',
        productPlacement: scene.productPlacement || '',
        emotionalBeat: scene.emotionalBeat || '',
      })
    );

    return {
      id: crypto.randomUUID(),
      title: refinedData.title || currentScript.title,
      duration: refinedData.duration || currentScript.duration,
      hook: refinedData.hook || currentScript.hook,
      problemStatement: refinedData.problemStatement || currentScript.problemStatement,
      solution: refinedData.solution || currentScript.solution,
      cta: refinedData.cta || currentScript.cta,
      fullNarrative: refinedData.voiceoverText || currentScript.fullNarrative || '',
      scenes,
      sceneBreakdown,
      voiceoverText: refinedData.voiceoverText || currentScript.voiceoverText,
      generatedAt: Date.now(),
      model: model || 'gemini-2.5-flash',
    };
  } catch (error) {
    throw new Error(
      `Script refinement failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Alias for backward compatibility
export const refineScriptWithOpenAI = refineScriptWithGemini;
