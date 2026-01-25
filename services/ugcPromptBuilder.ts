// services/ugcPromptBuilder.ts
// UGC Prompt Builder for Gemini Chat + Nano Banana consistency

import type { UGCSceneType } from "../types/ugc";

export type SceneType = UGCSceneType;

export type ImageUrl = { url: string };

export type BuildUGCPayloadInput = {
  apiKey: string;
  scene_type: SceneType;

  // required by builder
  product_desc: string;
  lighting_desc: string;
  camera_desc: string;
  background_desc: string;

  // optional by scene
  model_desc?: string;
  hand_pose_desc?: string;
  action_desc?: string;
  props_desc?: string;

  // multimodal refs (supabase urls, etc.)
  image_urls?: ImageUrl[];

  // request controls
  stream?: boolean;
  include_thoughts?: boolean;
  reasoning_effort?: "low" | "medium" | "high";

  // tools passthrough (optional)
  tools?: any[];
};

export const NANO_BANANA_UGC_CONFIG = {
  system_prompt: `You are a professional commercial photographer, advertising art director, and brand compliance reviewer.

Your task is to produce outputs that describe or generate a single continuous real-world photographic scene.
All objects, humans, hands, and products must exist in the same physical space.
Never treat elements as separate layers or composited objects.

========================
A) PHYSICAL REALITY (MANDATORY)
========================
- Every product must have real physical contact with something (hand, skin, surface, table, ground, fabric, or prop).
- Contact must create realistic contact shadows and occlusion.
- No object may appear floating or artificially placed.
- Skin/surface/environment must subtly reflect on the product material.
- Weight, grip pressure, and contact tension must look natural.

========================
B) LIGHTING CONSISTENCY (MANDATORY)
========================
- Use one coherent lighting setup for the entire scene.
- Shadows, highlights, and reflections must align from the same light source.
- No mismatched lighting, no impossible highlights, no conflicting shadow directions.

========================
C) CAMERA & DEPTH (MANDATORY)
========================
- Treat the scene as captured by a real camera.
- Use realistic lens behavior and depth of field.
- Interacting elements must share the same focal plane unless physically separated.
- Perspective must be consistent across the entire image.

========================
D) MATERIAL REALISM (MANDATORY)
========================
- Surfaces must show realistic texture, reflection, and micro-imperfections.
- Avoid CGI look, overly smooth surfaces, artificial sharpness, or plastic "render" vibes.
- Add subtle real-world imperfections when appropriate (fingerprints, smudges, tiny dust, minor wear),
  but never add dirt that harms the brand.

========================
E) BRAND, LOGO & TEXT PRESERVATION (CRITICAL / LEGAL-SAFE)
========================
Treat brand identity elements as legally sensitive and immutable.

- Any visible brand name, logo, trademark, label text, barcode text, certification marks, and packaging text
  MUST remain EXACTLY as in the reference image(s) when reference images are provided.
- Do NOT modify spelling, typography, kerning, layout, capitalization, wording, language, or logo geometry.
- Do NOT beautify, redesign, stylize, translate, “correct”, hallucinate, or reinterpret any text or logos.
- Do NOT generate “similar-looking” text. Similar is unacceptable. It must be exact.

FAIL-SAFE RULE (IMPORTANT):
- If label text is too small/unclear to preserve exactly, DO NOT guess.
  Instead keep it visually unreadable (soft focus / motion blur / shallow DOF / glare) while preserving the overall label shape and placement.
  Never invent readable text.

REFERENCE PRIORITY:
- When reference images exist, the reference is the single source of truth for brand/logo/text.
- Preserve label placement and orientation relative to the product geometry.

========================
F) STRICT PROHIBITIONS
========================
- No collage, no overlay, no pasted/floating objects
- No hard cutout edges, no compositing artifacts
- No unrealistic separation between objects
- No fake/altered trademarks, no counterfeit-like changes

========================
G) STYLE TARGET
========================
- Photorealistic commercial product photography
- Believable UGC aesthetic (authentic, not overly polished)
- Shot as if captured in a real studio or real environment

Always prioritize: unified lighting + real contact + contact shadow + occlusion + plausible reflections
and strict brand/text preservation.
The final result must look indistinguishable from a single authentic photograph and must be brand-compliant.`,

  global_guardrail_text: `HARD GUARDRAILS:
- Product must cast a soft shadow onto whatever it touches (hand/skin/surface/fabric).
- There must be visible occlusion where objects overlap (fingers over label, product base touching surface).
- Product reflections must match the scene lighting (no mismatched highlights).
- No floating objects, no cutout edges, no pasted-layer look.
- Treat as a real camera photo, not digital compositing.
- BRAND LOCK: Preserve all logo/text EXACTLY from reference. If unclear, keep softly unreadable (never guess).`,

  scene_templates: {
    S1_MODEL_HOLDING_PRODUCT: `SCENE TYPE: Model + Product.
Create a single continuous photoreal UGC scene.
A {model_desc} is naturally holding {product_desc} with {hand_pose_desc}.
Fingers partially cover the product surface/label to create real occlusion.
Add natural grip pressure (slight skin deformation at contact points).

Lighting: {lighting_desc}. Ensure unified highlights/shadows.
Shadows: product casts a soft shadow onto skin/clothing; subtle skin-tone reflection appears on the product.
Camera: {camera_desc}. Model and product must share the same focal plane.
Background: {background_desc}.

Quality targets: authentic UGC, realistic skin texture, realistic product material, no CGI.
IMPORTANT: brand_lock enabled. Preserve label/logo EXACTLY; if unclear keep softly unreadable.
{global_guardrail}`,

    S2_HAND_ONLY_PRODUCT: `SCENE TYPE: Hand + Product.
Create a single continuous photoreal scene.
Only a human hand is visible, naturally holding {product_desc}.
Fingers wrap around it with realistic pressure; skin slightly deforms where it touches.
Ensure strong occlusion between fingers and product edges.
Add subtle micro-imperfections: faint fingerprints/smudges on product surface (realistic, not dirty).

Lighting: {lighting_desc}. One coherent light setup.
Shadows: product casts soft shadow onto fingers/palm; shadow gradients must be natural.
Camera: {camera_desc}. Hand and product in the same focal plane.
Background: {background_desc}.

Style: UGC close-up product demo, photoreal.
IMPORTANT: brand_lock enabled. Preserve label/logo EXACTLY; if unclear keep softly unreadable.
{global_guardrail}`,

    S3_PRODUCT_STANDALONE_HERO: `SCENE TYPE: Standalone Product.
Create a single continuous studio-style product photograph.
{product_desc} is resting on a real surface (tabletop) with full physical contact.
Show a clear contact shadow directly beneath the product base.
Add a subtle surface reflection near the base (very gentle, realistic).

Lighting: {lighting_desc}. Ensure reflections and highlights are consistent.
Camera: {camera_desc}. Sharp focus on product; clean depth of field.
Background: {background_desc}.

Avoid CGI: realistic material texture and micro-imperfections.
IMPORTANT: brand_lock enabled. Preserve label/logo EXACTLY; if unclear keep softly unreadable.
{global_guardrail}`,

    S4_IN_USE_DEMO_ACTION: `SCENE TYPE: In-use Demonstration (action).
Create a single continuous photoreal UGC scene showing {product_desc} being used.
Action: {action_desc} must look physically plausible.
Show real interaction: droplets/mist/flow follow gravity and physics.
Occlusion: hand/fingers partially cover product; product is not perfectly centered like a cutout.
Shadows: action elements (mist/droplets) integrate with lighting; product and hand cast consistent shadows.

Lighting: {lighting_desc}. One coherent source.
Camera: {camera_desc}. Freeze motion realistically (appropriate shutter feel).
Background: {background_desc}.

No compositing artifacts. Everything must feel captured in one shot.
IMPORTANT: brand_lock enabled. Preserve label/logo EXACTLY; if unclear keep softly unreadable.
{global_guardrail}`,

    S5_LIFESTYLE_PLACEMENT_CONTEXT: `SCENE TYPE: Lifestyle Placement.
Create a single continuous photoreal scene where {product_desc} exists naturally in an environment.
Place product among props: {props_desc}.
The product must rest on a real surface with contact shadow.
Ensure occlusion where props overlap edges slightly (natural clutter, not staged like a render).
Reflections: product material reflects nearby props/environment subtly.

Lighting: {lighting_desc}. Unified and believable for the environment.
Camera: {camera_desc}. Realistic depth of field.
Background/setting: {background_desc}.

Style: believable UGC/lifestyle, not CGI.
IMPORTANT: brand_lock enabled. Preserve label/logo EXACTLY; if unclear keep softly unreadable.
{global_guardrail}`,
  } as const,
};

// --- helpers ---
export function assertRequired(input: BuildUGCPayloadInput) {
  const missing: string[] = [];
  if (!input.scene_type) missing.push("scene_type");
  if (!input.product_desc) missing.push("product_desc");
  if (!input.lighting_desc) missing.push("lighting_desc");
  if (!input.camera_desc) missing.push("camera_desc");
  if (!input.background_desc) missing.push("background_desc");

  // scene-specific required
  if (input.scene_type === "S1_MODEL_HOLDING_PRODUCT") {
    if (!input.model_desc) missing.push("model_desc (required for S1)");
    if (!input.hand_pose_desc) missing.push("hand_pose_desc (required for S1)");
  }
  if (input.scene_type === "S4_IN_USE_DEMO_ACTION") {
    if (!input.action_desc) missing.push("action_desc (required for S4)");
  }
  if (input.scene_type === "S5_LIFESTYLE_PLACEMENT_CONTEXT") {
    if (!input.props_desc) missing.push("props_desc (required for S5)");
  }

  if (missing.length) {
    throw new Error(`UGC payload build failed. Missing: ${missing.join(", ")}`);
  }
}

export function renderTemplate(scene_type: SceneType, vars: Record<string, string>) {
  const template = NANO_BANANA_UGC_CONFIG.scene_templates[scene_type];
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v !== undefined ? v : `{${key}}`;
  });
}

/**
 * Build Kie.ai Gemini chat payload (multimodal)
 * Uses OpenAI-compatible format for KIE AI endpoint
 */
export function buildKieGeminiUGCPayload(input: BuildUGCPayloadInput) {
  assertRequired(input);

  const rendered_scene_prompt = renderTemplate(input.scene_type, {
    product_desc: input.product_desc,
    lighting_desc: input.lighting_desc,
    camera_desc: input.camera_desc,
    background_desc: input.background_desc,
    model_desc: input.model_desc ?? "",
    hand_pose_desc: input.hand_pose_desc ?? "",
    action_desc: input.action_desc ?? "",
    props_desc: input.props_desc ?? "",
    global_guardrail: NANO_BANANA_UGC_CONFIG.global_guardrail_text,
  });

  // Per KIE AI docs: content MUST be array [{type: "text", text: "..."}]
  // Combine system prompt with user prompt
  const combinedPrompt = `${NANO_BANANA_UGC_CONFIG.system_prompt}\n\n---\n\n${rendered_scene_prompt}`;
  
  // Build content array - always start with text
  const userContent: any[] = [{ type: "text", text: combinedPrompt }];
  
  // Append images if provided
  if (input.image_urls?.length) {
    for (const img of input.image_urls) {
      if (img?.url) {
        userContent.push({ type: "image_url", image_url: { url: img.url } });
      }
    }
  }

  // KIE AI format per official documentation
  const payload: any = {
    messages: [
      {
        role: "user",
        content: userContent, // Always array format per KIE AI docs
      },
    ],
    include_thoughts: false,
    reasoning_effort: "high",
  };

  // optional tools passthrough
  if (input.tools) payload.tools = input.tools;

  return payload;
}

/**
 * Optional: Build request object for requests.post() caller
 */
export function buildKieGeminiUGCRequest(input: BuildUGCPayloadInput) {
  const url = "https://api.kie.ai/gemini-3-flash/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${input.apiKey}`,
  };
  const payload = buildKieGeminiUGCPayload(input);
  return { url, headers, payload };
}

/**
 * Build Nano Banana prompt text from scene template
 */
export function buildNanoBananaScenePrompt(input: BuildUGCPayloadInput) {
  assertRequired(input);

  return renderTemplate(input.scene_type, {
    product_desc: input.product_desc,
    lighting_desc: input.lighting_desc,
    camera_desc: input.camera_desc,
    background_desc: input.background_desc,
    model_desc: input.model_desc ?? "",
    hand_pose_desc: input.hand_pose_desc ?? "",
    action_desc: input.action_desc ?? "",
    props_desc: input.props_desc ?? "",
    global_guardrail: NANO_BANANA_UGC_CONFIG.global_guardrail_text,
  });
}
