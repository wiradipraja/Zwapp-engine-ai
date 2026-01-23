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
} from '../types/ugc';

export interface ScriptGenerationConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  language?: NarrationLanguage;
  contentStyle?: UGCContentStyle;
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
  } = config;

  // Get content style info
  const styleInfo = UGC_CONTENT_STYLES.find(s => s.id === contentStyle) || UGC_CONTENT_STYLES[0];
  
  // Language instruction
  const languageInstruction = language === 'ID' 
    ? 'IMPORTANT: All dialogue must be written in Bahasa Indonesia (Indonesian language). The model will speak in Indonesian.'
    : 'IMPORTANT: All dialogue must be written in English.';
  
  // Style instruction
  const styleInstruction = `CONTENT STYLE: ${styleInfo.name}
- Camera Style: ${styleInfo.cameraStyle}
- Visual Approach: ${styleInfo.promptModifier}`;

  // Build detailed prompt for script generation
  const prompt = `You are an expert UGC content writer. Generate authentic, engaging UGC scripts for social media (TikTok, Instagram Reels, YouTube Shorts).

${languageInstruction}

${styleInstruction}

The script should:
- Feel natural and authentic (not overly polished)
- Include the model naturally throughout
- Showcase the product organically
- Be optimized for 15-30 second videos
- Include 3 scenes with clear transitions
- Have specific actions and dialogue for the model
- Match the ${styleInfo.name} visual style

Create a UGC script with these details:

MODEL PROFILE:
- Look: ${modelProfile.lookDescription || modelProfile.appearance}
- Skin Tone: ${modelProfile.skinTone || 'natural'}
- Body Type: ${modelProfile.bodyType || 'average'}
- Facial Features: ${modelProfile.facialFeatures || 'natural'}
- Expression Style: ${modelProfile.expressionStyle || 'friendly'}

PRODUCT:
- Name: ${productProfile.name}
- Category: ${productProfile.category || 'general'}
- Colors: ${productProfile.colors.join(', ')}
- Key Features: ${productProfile.keyFeatures.join(', ')}
- Price Range: ${productProfile.priceRange || 'mid-range'}

BRAND NARRATIVE:
- Voice: ${narrativeContext.brandVoice}
- Target Audience: ${narrativeContext.targetAudience}
- Product Story: ${narrativeContext.productStory || 'Quality product for everyday use'}
- Cultural Context: ${narrativeContext.culturalContext || 'Universal appeal'}
- Emotional Tone: ${narrativeContext.emotionalTone || 'positive and engaging'}

Generate a 3-scene UGC script. Return ONLY valid JSON (no markdown, no code blocks, no explanation) with this exact structure:
{
  "title": "Script title",
  "duration": 24,
  "hook": "The opening attention grabber",
  "problemStatement": "The problem being addressed",
  "solution": "How the product solves it",
  "cta": "Call to action",
  "scenes": [
    {
      "sceneNumber": 1,
      "setting": "Description of setting",
      "action": "What the model does",
      "dialogue": "What the model says",
      "productPlacement": "How product is shown",
      "emotionalBeat": "The emotional moment"
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
