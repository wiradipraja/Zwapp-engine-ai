// services/ugcPromptBuilder.ts
// UGC Prompt Builder for Gemini Chat + Nano Banana consistency

export type SceneType =
  | "S1_MODEL_HOLDING_PRODUCT"
  | "S2_HAND_ONLY_PRODUCT"
  | "S3_PRODUCT_STANDALONE_HERO"
  | "S4_IN_USE_DEMO_ACTION"
  | "S5_LIFESTYLE_PLACEMENT_CONTEXT";

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
  system_prompt: `You are a professional commercial photographer and visual director.

Your task is to produce outputs that describe or generate a single continuous real-world photographic scene.
All objects, humans, hands, and products must exist in the same physical space.
Never treat elements as separate layers or composited objects.

PHYSICAL REALITY RULES (MANDATORY):
- Every product must have real physical contact with something (hand, skin, surface, table, ground, fabric, or prop).
- Contact must create realistic contact shadows and occlusion.
- No object may appear floating or artificially placed.
- Skin/surface/environment must subtly reflect on the product material.
- Weight, grip pressure, and contact tension must look natural.

LIGHTING CONSISTENCY:
- Use one coherent lighting setup for the entire scene.
- Shadows, highlights, and reflections must align from the same light source.
- No mismatched lighting, no impossible highlights.

CAMERA & DEPTH:
- Treat the scene as captured by a real camera.
- Specify realistic lens behavior and depth of field.
- Interacting elements must share the same focal plane unless physically separated.
- Perspective must be consistent.

MATERIAL REALISM:
- Surfaces show realistic texture, reflection, and micro-imperfections.
- Avoid CGI look, overly smooth plastic, artificial sharpness.
- Add subtle real-world imperfections when appropriate (fingerprints, smudges, tiny dust, minor wear).

STRICT PROHIBITIONS:
- No collage, no overlay, no pasted/floating objects
- No hard cutout edges, no compositing artifacts
- No unrealistic separation between objects

STYLE:
- Photorealistic commercial product photography
- Believable UGC aesthetic (authentic, not too polished)
- Shot as if captured in a real studio or real environment

ALWAYS enforce: unified lighting + real contact + contact shadow + occlusion + plausible reflections.
The final result must look indistinguishable from a single authentic photograph, never a digital composite.`,

  global_guardrail_text: `HARD GUARDRAILS:
- Product must cast a soft shadow onto whatever it touches (hand/skin/surface/fabric).
- There must be visible occlusion where objects overlap (fingers over label, product base touching surface).
- Product reflections must match the scene lighting (no mismatched highlights).
- No floating objects, no cutout edges, no pasted-layer look.
- Treat as a real camera photo, not digital compositing.`,

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
 */
export function buildKieGeminiUGCPayload(input: BuildUGCPayloadInput) {
  assertRequired(input);

  const stream = input.stream ?? true;
  const include_thoughts = input.include_thoughts ?? false;
  const reasoning_effort = input.reasoning_effort ?? "high";

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

  const userContent: any[] = [{ type: "text", text: rendered_scene_prompt }];

  // append image references if provided
  if (input.image_urls?.length) {
    for (const img of input.image_urls) {
      if (img?.url) {
        userContent.push({ type: "image_url", image_url: { url: img.url } });
      }
    }
  }

  const payload: any = {
    messages: [
      {
        role: "system",
        content: [{ type: "text", text: NANO_BANANA_UGC_CONFIG.system_prompt }],
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    stream,
    include_thoughts,
    reasoning_effort,
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
