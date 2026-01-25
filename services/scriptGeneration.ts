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
  UGCPreferences
} from '../types/ugc';

export interface ScriptGenerationConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  language?: NarrationLanguage;
  contentStyle?: UGCContentStyle;
  preferences?: UGCPreferences;
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
    model = 'gemini-1.5-flash', // Free tier model
    temperature = 0.7,
    maxTokens = 2048,
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
  
  // Language instruction - CRITICAL for dialogue output
  // Now handles both ID and EN properly based on 'preferences.language' or 'config.language'
  const targetLanguage = preferences?.language?.includes('ID') ? 'ID' : (language === 'ID' ? 'ID' : 'EN');
  
  const languageInstruction = targetLanguage === 'ID' 
    ? `BAHASA WAJIB: Semua dialogue/dialog model HARUS dalam Bahasa Indonesia (Style: ${targetTone}).
Contoh style bahasa: "Gue", "Lo", "Banget", "Sumpah", "Worth it".
JANGAN gunakan bahasa Inggris untuk dialogue. Visual description tetap dalam English.`
    : `LANGUAGE: All dialogue must be written in English. Use tone: ${targetTone}.`;
  
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
  const prompt = `Kamu adalah CREATIVE DIRECTOR untuk agensi pemasaran terkemuka.
Buatlah cerita visual berkesinambungan untuk iklan produk UGC (User Generated Content).

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

MODEL PROFILE (IDENTITY LOCK):
- Character: ${preferences?.characterProfile || modelProfile.appearance}
- Outfit: ${preferences?.outfitStyle || modelProfile.outfitStyle || 'Casual'}
- Background Preference: ${preferences?.backgroundStyle || 'Aesthetic Room'}
- Lighting Preference: ${preferences?.lightingStyle || 'Natural Light'}
- Framing Preference: ${preferences?.framing || 'Selfie'}

PRODUCT:
- Name: ${productProfile.name}
- Category: ${preferences?.productCategory || productProfile.category || 'General'}
- Key Features: ${productProfile.keyFeatures.join(', ')}
- Price Perception: ${preferences?.priceRange || productProfile.priceRange || 'Affordable'}

BRAND NARRATIVE:
- Objective: ${targetObjective}
- Tone: ${targetTone}
- Target Platform: ${targetPlatform}

Generate a UGC script. Return ONLY valid JSON (no markdown) with this structure:
{
  "title": "Script title",
  "duration": 30,
  "hook": "The powerful opening hook",
  "problemStatement": "The problem being addressed",
  "solution": "How the product solves it",
  "cta": "Call to action",
  "scenes": [
    {
      "sceneNumber": 1,
      "setting": "Description of setting (ALWAYS IN ENGLISH, e.g. 'A living room with natural light')",
      "action": "What the model does (ALWAYS IN ENGLISH)",
      "dialogue": "What the model SAYS (IN ${targetLanguage})",
      "productPlacement": "How product is shown (ALWAYS IN ENGLISH)",
      "emotionalBeat": "The emotional moment (ALWAYS IN ENGLISH)"
    }
  ],
  "voiceoverText": "Optional narration"
}`;

  try {
    // Call Gemini API (FREE)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP: 0.95,
            topK: 40,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Gemini API Error: ${error.error?.message || JSON.stringify(error)}`
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content received from Gemini');
    }

    // Clean the response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    // Parse JSON response
    const scriptData = JSON.parse(cleanContent);

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
      model: 'gemini-1.5-flash',
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
    'gemini-1.5-flash': 0, // FREE
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
  const { apiKey, model = 'gemini-1.5-flash' } = config;

  const refinementPrompt = `You are refining a UGC script based on feedback.

CURRENT SCRIPT:
${JSON.stringify(currentScript, null, 2)}

FEEDBACK:
${feedback}

Please refine the script based on the feedback. Return ONLY valid JSON (no markdown, no code blocks) with the same structure as the current script.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: refinementPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to refine script');
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No refinement content received');
    }

    // Clean the response
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    const refinedData = JSON.parse(cleanContent);

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
      model: 'gemini-1.5-flash',
    };
  } catch (error) {
    throw new Error(
      `Script refinement failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Alias for backward compatibility
export const refineScriptWithOpenAI = refineScriptWithGemini;
