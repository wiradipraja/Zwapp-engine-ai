// services/ugcVideoPipeline.ts
// UGC Image-to-Video Pipeline (format v1.1.0)

export type UGCVideoEngine = 'veo' | 'qwen';

export interface UGCVideoPipelineConfig {
  aspect_ratio: '9:16' | '16:9';
  fps: 24 | 30 | 60;
  brand_lock: boolean;
  label_policy: 'unreadable_in_base_video' | 'preserve_if_readable';
  post_overlay_required: boolean;
  default_resolution: '1080x1920' | '1920x1080' | '1440x2560' | '1080x1080';
}

export interface UGCVideoScene {
  scene_id: string;
  engine: UGCVideoEngine;
  duration_s: number;
  seed: number;
  payload: {
    engine: UGCVideoEngine;
    prompt: string;
    reference_images: string[];
    camera?: { lens?: string; movement?: string };
    lighting?: string;
    seed?: number;
  };
  retry?: {
    max: number;
    on_fail?: string[];
  };
}

export interface UGCVideoPipelinePayload {
  job_type: 'ugc_video_full_pipeline';
  version: '1.1.0';
  global: UGCVideoPipelineConfig;
  engines: {
    veo: {
      endpoint: string;
      defaults: { quality: string; motion_stability: string; temporal_consistency: string };
    };
    qwen: {
      endpoint: string;
      defaults: { quality: string; motion_stability: string; temporal_consistency: string };
    };
  };
  scenes: UGCVideoScene[];
  stitch_timeline: {
    order: string[];
    transition: { type: string; note?: string };
  };
  cta_ending_scene: {
    scene_id: string;
    duration_s: number;
    type: string;
    brand_safe: boolean;
    instructions: {
      background: string;
      overlay_elements: Array<{ type: string; source?: string; content?: string; style?: string }>;
      rules: string[];
    };
  };
  final_export: {
    format: 'mp4';
    codec: 'h264';
    audio?: string;
    note?: string;
  };
}

const DEFAULT_PROMPTS = {
  V1_MODEL_SELFIE:
    'Single continuous UGC video shot. Model holding the product near her face in a selfie-style pose. Slow natural handheld sway, stabilized and smooth. Soft window daylight lighting, consistent shadows and reflections. Real hand-product interaction with grip pressure and partial label occlusion. BRAND SAFETY: keep label text softly unreadable, do not generate readable brand text. No jitter, no warping, no flicker. Maintain product geometry.',
  V2_HAND_MACRO:
    'Single continuous macro video shot. Only a hand holding the product. Slow push-in motion with slight rotation. Strong occlusion between fingers and product, visible grip pressure. Soft daylight, consistent reflections. BRAND SAFETY: label text softly unreadable. No jitter, no geometry changes.',
  V3_PRODUCT_HERO:
    'Stable tabletop product video. Product resting on real surface with visible contact shadow. Very slow lateral slide. Soft key and fill lighting, consistent reflections. BRAND SAFETY: label unreadable. No camera shake, no flicker, no shape change.',
  V4_IN_USE_ACTION:
    'Single continuous in-use demo video. Product being poured or sprayed naturally. Realistic physics with gravity-following droplets. Hand partially occludes label. Soft daylight lighting. Camera follows action smoothly. BRAND SAFETY: label unreadable. No jitter, no warping.',
  V5_LIFESTYLE_PLACEMENT:
    'Stable lifestyle placement video. Product placed naturally on surface among simple props. Slow push-in motion. Warm window light. Product rests on surface with contact shadow. BRAND SAFETY: label unreadable. No jitter, no morphing.',
};

export interface BuildUGCVideoPipelineInput {
  product_ref_url: string;
  brand_logo_url?: string;
  fps: 24 | 30 | 60;
  aspect_ratio?: '9:16' | '16:9';
  default_resolution?: '1080x1920' | '1920x1080' | '1440x2560' | '1080x1080';
  use_engine?: UGCVideoEngine;
}

export function buildUGCVideoPipelinePayload(input: BuildUGCVideoPipelineInput): UGCVideoPipelinePayload {
  const engine: UGCVideoEngine = input.use_engine || 'veo';

  const scenes: UGCVideoScene[] = [
    {
      scene_id: 'V1_MODEL_SELFIE',
      engine,
      duration_s: 3,
      seed: 112233,
      payload: {
        engine,
        prompt: DEFAULT_PROMPTS.V1_MODEL_SELFIE,
        reference_images: [input.product_ref_url],
        camera: { lens: '50mm', movement: 'slow_handheld_stabilized' },
        lighting: 'soft_window_daylight',
        seed: 112233,
      },
      retry: { max: 3, on_fail: ['new_seed', 'tighten_motion'] },
    },
    {
      scene_id: 'V2_HAND_MACRO',
      engine,
      duration_s: 3,
      seed: 223344,
      payload: {
        engine,
        prompt: DEFAULT_PROMPTS.V2_HAND_MACRO,
        reference_images: [input.product_ref_url],
        camera: { lens: 'macro', movement: 'slow_push_in' },
        lighting: 'soft_daylight',
        seed: 223344,
      },
      retry: { max: 3, on_fail: ['new_seed', 'reduce_rotation'] },
    },
    {
      scene_id: 'V3_PRODUCT_HERO',
      engine: engine === 'veo' ? 'qwen' : engine,
      duration_s: 3,
      seed: 334455,
      payload: {
        engine: engine === 'veo' ? 'qwen' : engine,
        prompt: DEFAULT_PROMPTS.V3_PRODUCT_HERO,
        reference_images: [input.product_ref_url],
        camera: { movement: 'slow_slide' },
        lighting: 'soft_key_fill',
        seed: 334455,
      },
      retry: { max: 2, on_fail: ['new_seed'] },
    },
    {
      scene_id: 'V4_IN_USE_ACTION',
      engine,
      duration_s: 4,
      seed: 445566,
      payload: {
        engine,
        prompt: DEFAULT_PROMPTS.V4_IN_USE_ACTION,
        reference_images: [input.product_ref_url],
        camera: { movement: 'follow_action_smooth' },
        lighting: 'soft_daylight',
        seed: 445566,
      },
      retry: { max: 3, on_fail: ['new_seed', 'slow_motion'] },
    },
    {
      scene_id: 'V5_LIFESTYLE_PLACEMENT',
      engine: engine === 'veo' ? 'qwen' : engine,
      duration_s: 3,
      seed: 556677,
      payload: {
        engine: engine === 'veo' ? 'qwen' : engine,
        prompt: DEFAULT_PROMPTS.V5_LIFESTYLE_PLACEMENT,
        reference_images: [input.product_ref_url],
        camera: { movement: 'slow_push_in' },
        lighting: 'warm_window_light',
        seed: 556677,
      },
      retry: { max: 2, on_fail: ['new_seed'] },
    },
  ];

  return {
    job_type: 'ugc_video_full_pipeline',
    version: '1.1.0',
    global: {
      aspect_ratio: input.aspect_ratio || '9:16',
      fps: input.fps,
      brand_lock: true,
      label_policy: 'unreadable_in_base_video',
      post_overlay_required: true,
      default_resolution: input.default_resolution || '1080x1920',
    },
    engines: {
      veo: {
        endpoint: 'VEO_VIDEO_GENERATE',
        defaults: {
          quality: 'high',
          motion_stability: 'cinematic_smooth',
          temporal_consistency: 'strong',
        },
      },
      qwen: {
        endpoint: 'QWEN_VIDEO_GENERATE',
        defaults: {
          quality: 'standard',
          motion_stability: 'ultra_stable',
          temporal_consistency: 'medium',
        },
      },
    },
    scenes,
    stitch_timeline: {
      order: [
        'V1_MODEL_SELFIE',
        'V2_HAND_MACRO',
        'V3_PRODUCT_HERO',
        'V4_IN_USE_ACTION',
        'V5_LIFESTYLE_PLACEMENT',
        'CTA_ENDING',
      ],
      transition: { type: 'hard_cut', note: 'No fancy transitions to preserve realism' },
    },
    cta_ending_scene: {
      scene_id: 'CTA_ENDING',
      duration_s: 2,
      type: 'motion_graphic_overlay',
      brand_safe: true,
      instructions: {
        background: 'Use last frame of previous scene, slightly blurred',
        overlay_elements: [
          ...(input.brand_logo_url ? [{ type: 'brand_logo', source: input.brand_logo_url }] : []),
          { type: 'text', content: 'Try it today', style: 'clean_sans_bold' },
          { type: 'text', content: 'Available now', style: 'clean_sans_regular' },
        ],
        rules: [
          'Do not generate logo with AI',
          'Use provided official brand assets only',
          'Keep typography simple and legible',
        ],
      },
    },
    final_export: {
      format: 'mp4',
      codec: 'h264',
      audio: 'optional_background_music',
      note: 'Final video is stitched after QC and brand label overlay',
    },
  };
}

export function extractVideoUrl(payload: any): string | '' {
  if (!payload) return '';
  if (typeof payload === 'string' && payload.startsWith('http')) return payload;

  const candidates = [
    payload.video_url,
    payload.videoUrl,
    payload.data?.video_url,
    payload.data?.videoUrl,
    payload.result?.video_url,
    payload.result?.videoUrl,
    payload.output?.video_url,
    payload.output?.videoUrl,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.startsWith('http')) return c;
  }

  return '';
}
