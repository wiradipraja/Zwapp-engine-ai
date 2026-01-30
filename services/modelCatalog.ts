import { supabase } from './supabase';
import type { ModelCatalogItem, ModelOutputType, ModelCapabilities } from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = (value?: string) => !!value && UUID_REGEX.test(value);

export interface ModelCatalogForm {
  id?: string;
  slug?: string;
  name: string;
  family: string;
  provider?: string;
  apiModel: string;
  appModule: string;
  modelType: ModelOutputType;
  shortDescription?: string;
  pricePerOutput?: number;
  priceCurrency?: string;
  priceUnit?: 'per_output' | 'per_second';
  thumbnailUrl?: string;
  sampleUrls?: string[];
  capabilities?: ModelCapabilities;
  active?: boolean;
  displayOrder?: number;
}

const FALLBACK_MODELS: ModelCatalogItem[] = [
  {
    id: 'local-nano-banana-gen',
    slug: 'nano-banana-gen',
    name: 'Nano Banana Gen',
    family: 'Nano Banana',
    provider: 'Google',
    apiModel: 'google/nano-banana',
    appModule: 'nano-banana-gen',
    modelType: 'image',
    shortDescription: 'Fast text to image for daily iterations.',
    pricePerOutput: 120,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToImage: true },
    active: true,
    displayOrder: 10,
  },
  {
    id: 'local-nano-banana-edit',
    slug: 'nano-banana-edit',
    name: 'Nano Banana Edit',
    family: 'Nano Banana',
    provider: 'Google',
    apiModel: 'google/nano-banana-edit',
    appModule: 'nano-banana-edit',
    modelType: 'image',
    shortDescription: 'Precise image to image edits with strong control.',
    pricePerOutput: 180,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToImage: true },
    active: true,
    displayOrder: 20,
  },
  {
    id: 'local-nano-banana-pro',
    slug: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    family: 'Nano Banana',
    provider: 'Google',
    apiModel: 'nano-banana-pro',
    appModule: 'nano-banana-pro',
    modelType: 'image',
    shortDescription: 'High fidelity output with multi ratio support.',
    pricePerOutput: 260,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToImage: true, imageToImage: true },
    active: true,
    displayOrder: 30,
  },
  {
    id: 'local-qwen-text',
    slug: 'qwen-text-to-image',
    name: 'Qwen Text to Image',
    family: 'Qwen',
    provider: 'Qwen',
    apiModel: 'qwen/text-to-image',
    appModule: 'qwen-text-to-image',
    modelType: 'image',
    shortDescription: 'Clean prompts, consistent results for campaigns.',
    pricePerOutput: 110,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToImage: true },
    active: true,
    displayOrder: 40,
  },
  {
    id: 'local-qwen-image',
    slug: 'qwen-image-to-image',
    name: 'Qwen Image to Image',
    family: 'Qwen',
    provider: 'Qwen',
    apiModel: 'qwen/image-to-image',
    appModule: 'qwen-image-to-image',
    modelType: 'image',
    shortDescription: 'Style transfer with controllable strength.',
    pricePerOutput: 160,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToImage: true },
    active: true,
    displayOrder: 50,
  },
  {
    id: 'local-z-image',
    slug: 'z-image',
    name: 'Z-Image Gen',
    family: 'Qwen',
    provider: 'Z',
    apiModel: 'z-image',
    appModule: 'z-image',
    modelType: 'image',
    shortDescription: 'Balanced quality and speed for production.',
    pricePerOutput: 130,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToImage: true },
    active: true,
    displayOrder: 60,
  },
  {
    id: 'local-flux-pro-text',
    slug: 'flux2-pro-text',
    name: 'Flux 2 Pro Text',
    family: 'Flux 2',
    provider: 'Flux',
    apiModel: 'flux-2/pro-text-to-image',
    appModule: 'flux2-pro-text',
    modelType: 'image',
    shortDescription: 'High detail visuals with cinematic depth.',
    pricePerOutput: 240,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToImage: true },
    active: true,
    displayOrder: 70,
  },
  {
    id: 'local-flux-pro-image',
    slug: 'flux2-pro-image',
    name: 'Flux 2 Pro Image',
    family: 'Flux 2',
    provider: 'Flux',
    apiModel: 'flux-2/pro-image-to-image',
    appModule: 'flux2-pro-image',
    modelType: 'image',
    shortDescription: 'Premium edits with multi reference support.',
    pricePerOutput: 280,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToImage: true },
    active: true,
    displayOrder: 80,
  },
  {
    id: 'local-flux-flex-text',
    slug: 'flux2-flex-text',
    name: 'Flux 2 Flex Text',
    family: 'Flux 2',
    provider: 'Flux',
    apiModel: 'flux-2/flex-text-to-image',
    appModule: 'flux2-flex-text',
    modelType: 'image',
    shortDescription: 'Fast text to image for volume production.',
    pricePerOutput: 150,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToImage: true },
    active: true,
    displayOrder: 90,
  },
  {
    id: 'local-flux-flex-image',
    slug: 'flux2-flex-image',
    name: 'Flux 2 Flex Image',
    family: 'Flux 2',
    provider: 'Flux',
    apiModel: 'flux-2/flex-image-to-image',
    appModule: 'flux2-flex-image',
    modelType: 'image',
    shortDescription: 'Efficient image edits with flexible inputs.',
    pricePerOutput: 170,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToImage: true },
    active: true,
    displayOrder: 100,
  },
  {
    id: 'local-grok-text',
    slug: 'grok-text-to-image',
    name: 'Grok Text to Image',
    family: 'Grok',
    provider: 'Grok',
    apiModel: 'grok-imagine/text-to-image',
    appModule: 'grok-text-to-image',
    modelType: 'image',
    shortDescription: 'Clean outputs with lightweight prompts.',
    pricePerOutput: 140,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToImage: true },
    active: true,
    displayOrder: 110,
  },
  {
    id: 'local-grok-image',
    slug: 'grok-image-to-image',
    name: 'Grok Image to Image',
    family: 'Grok',
    provider: 'Grok',
    apiModel: 'grok-imagine/image-to-image',
    appModule: 'grok-image-to-image',
    modelType: 'image',
    shortDescription: 'Stylize and transform with good fidelity.',
    pricePerOutput: 190,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToImage: true },
    active: true,
    displayOrder: 120,
  },
  {
    id: 'local-grok-upscale',
    slug: 'grok-upscale',
    name: 'Grok Upscale',
    family: 'Grok',
    provider: 'Grok',
    apiModel: 'grok-imagine/upscale',
    appModule: 'grok-upscale',
    modelType: 'image',
    shortDescription: 'Upscale outputs with minimal artifacts.',
    pricePerOutput: 90,
    priceCurrency: 'CREDITS',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { upscale: true },
    active: true,
    displayOrder: 130,
  },
  {
    id: 'local-kling-motion-control',
    slug: 'motion-control',
    name: 'Kling Motion Control',
    family: 'Kling',
    provider: 'KIE AI',
    apiModel: 'kling-2.6/motion-control',
    appModule: 'motion-control',
    modelType: 'video',
    shortDescription: 'Control motion with reference frames and direction.',
    pricePerOutput: 35,
    priceCurrency: 'CREDITS',
    priceUnit: 'per_second',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToVideo: true },
    active: true,
    displayOrder: 210,
  },
  {
    id: 'local-sora2-text',
    slug: 'sora2-text-to-video',
    name: 'Sora 2 Text',
    family: 'Sora 2',
    provider: 'Sora',
    apiModel: 'sora-2-text-to-video',
    appModule: 'sora2-text-to-video',
    modelType: 'video',
    shortDescription: 'Text to video with cinematic motion.',
    pricePerOutput: 520,
    priceCurrency: 'CREDITS',
    priceUnit: 'per_output',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToVideo: true },
    active: true,
    displayOrder: 220,
  },
  {
    id: 'local-sora2-image',
    slug: 'sora2-image-to-video',
    name: 'Sora 2 Image',
    family: 'Sora 2',
    provider: 'Sora',
    apiModel: 'sora-2-image-to-video',
    appModule: 'sora2-image-to-video',
    modelType: 'video',
    shortDescription: 'Animate stills into short video clips.',
    pricePerOutput: 560,
    priceCurrency: 'CREDITS',
    priceUnit: 'per_output',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToVideo: true },
    active: true,
    displayOrder: 230,
  },
  {
    id: 'local-sora2-pro-text',
    slug: 'sora2-pro-text-to-video',
    name: 'Sora 2 Pro Text',
    family: 'Sora 2 Pro',
    provider: 'Sora',
    apiModel: 'sora-2-pro-text-to-video',
    appModule: 'sora2-pro-text-to-video',
    modelType: 'video',
    shortDescription: 'Higher quality text to video output.',
    pricePerOutput: 760,
    priceCurrency: 'CREDITS',
    priceUnit: 'per_output',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToVideo: true },
    active: true,
    displayOrder: 240,
  },
  {
    id: 'local-sora2-pro-image',
    slug: 'sora2-pro-image-to-video',
    name: 'Sora 2 Pro Image',
    family: 'Sora 2 Pro',
    provider: 'Sora',
    apiModel: 'sora-2-pro-image-to-video',
    appModule: 'sora2-pro-image-to-video',
    modelType: 'video',
    shortDescription: 'Premium image to video with higher fidelity.',
    pricePerOutput: 820,
    priceCurrency: 'CREDITS',
    priceUnit: 'per_output',
    thumbnailUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToVideo: true },
    active: true,
    displayOrder: 250,
  },
  {
    id: 'local-veo3-text',
    slug: 'veo3-text-to-video',
    name: 'Veo 3.1 Text',
    family: 'Veo 3.1',
    provider: 'Google',
    apiModel: 'veo3/text-to-video',
    appModule: 'veo3-text-to-video',
    modelType: 'video',
    shortDescription: 'Flagship text to video with depth.',
    pricePerOutput: 680,
    priceCurrency: 'CREDITS',
    priceUnit: 'per_output',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { textToVideo: true },
    active: true,
    displayOrder: 260,
  },
  {
    id: 'local-veo3-image',
    slug: 'veo3-image-to-video',
    name: 'Veo 3.1 Image',
    family: 'Veo 3.1',
    provider: 'Google',
    apiModel: 'veo3/image-to-video',
    appModule: 'veo3-image-to-video',
    modelType: 'video',
    shortDescription: 'Turn frames into smooth video motion.',
    pricePerOutput: 720,
    priceCurrency: 'CREDITS',
    priceUnit: 'per_output',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToVideo: true },
    active: true,
    displayOrder: 270,
  },
  {
    id: 'local-veo3-reference',
    slug: 'veo3-reference-to-video',
    name: 'Veo 3.1 Reference',
    family: 'Veo 3.1',
    provider: 'Google',
    apiModel: 'veo3/reference-to-video',
    appModule: 'veo3-reference-to-video',
    modelType: 'video',
    shortDescription: 'Reference guided motion with multiple frames.',
    pricePerOutput: 760,
    priceCurrency: 'CREDITS',
    priceUnit: 'per_output',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToVideo: true },
    active: true,
    displayOrder: 280,
  },
  {
    id: 'local-grok-image-video',
    slug: 'grok-image-to-video',
    name: 'Grok Image to Video',
    family: 'Grok',
    provider: 'Grok',
    apiModel: 'grok-imagine/image-to-video',
    appModule: 'grok-image-to-video',
    modelType: 'video',
    shortDescription: 'Quick image to video animation.',
    pricePerOutput: 360,
    priceCurrency: 'CREDITS',
    priceUnit: 'per_output',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
    sampleUrls: [
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
    ],
    capabilities: { imageToVideo: true },
    active: true,
    displayOrder: 290,
  },
];

const mapRowToItem = (row: any): ModelCatalogItem => {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    family: row.family,
    provider: row.provider || undefined,
    apiModel: row.api_model,
    appModule: row.app_module,
    modelType: row.model_type,
    shortDescription: row.short_description || undefined,
    pricePerOutput: row.price_per_output !== null && row.price_per_output !== undefined ? Number(row.price_per_output) : undefined,
    priceCurrency: row.price_currency || undefined,
    priceUnit: row.price_unit || undefined,
    thumbnailUrl: row.thumbnail_url || undefined,
    sampleUrls: row.sample_urls || undefined,
    capabilities: row.capabilities || undefined,
    active: row.active,
    displayOrder: row.display_order ?? undefined,
  };
};

const mapFormToRow = (form: ModelCatalogForm) => {
  return {
    id: isValidUuid(form.id) ? form.id : undefined,
    slug: form.slug,
    name: form.name,
    family: form.family,
    provider: form.provider,
    api_model: form.apiModel,
    app_module: form.appModule,
    model_type: form.modelType,
    short_description: form.shortDescription,
    price_per_output: form.pricePerOutput ?? 0,
    price_currency: form.priceCurrency || 'CREDITS',
    price_unit: form.priceUnit || 'per_output',
    thumbnail_url: form.thumbnailUrl,
    sample_urls: form.sampleUrls || [],
    capabilities: form.capabilities || {},
    active: form.active ?? true,
    display_order: form.displayOrder ?? 0,
    updated_at: new Date().toISOString(),
  };
};

export const fetchModelCatalog = async (type?: ModelOutputType): Promise<ModelCatalogItem[]> => {
  try {
    let query = supabase
      .from('ai_models')
      .select('*')
      .order('display_order', { ascending: true });

    if (type) {
      query = query.eq('model_type', type).eq('active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return type ? FALLBACK_MODELS.filter((item) => item.modelType === type) : FALLBACK_MODELS;
    }

    return data.map(mapRowToItem);
  } catch (error) {
    console.warn('Model catalog fallback mode:', error);
    return type ? FALLBACK_MODELS.filter((item) => item.modelType === type) : FALLBACK_MODELS;
  }
};

export const upsertModel = async (form: ModelCatalogForm): Promise<ModelCatalogItem> => {
  const payload = mapFormToRow(form);
  const isUpdate = isValidUuid(form.id);

  if (isUpdate && payload.id) {
    const { data, error } = await supabase
      .from('ai_models')
      .update(payload)
      .eq('id', form.id)
      .select()
      .single();

    if (error) throw error;
    return mapRowToItem(data);
  }

  const { data, error } = await supabase
    .from('ai_models')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapRowToItem(data);
};

export const deleteModel = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('ai_models').delete().eq('id', id);
  return !error;
};

export const normalizeSlug = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const FALLBACK_IMAGE_MODELS = FALLBACK_MODELS.filter((item) => item.modelType === 'image');
