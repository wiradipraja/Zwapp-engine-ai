import type {
  UGCBackgroundCategory,
  UGCBackgroundOption,
  UGCVideoProvider,
  UGCWorkflowInputPayload,
} from '../../../types/ugcWorkflow';

const option = (
  id: string,
  label: string,
  category: UGCBackgroundOption['category'],
  promptHintEn: string
): UGCBackgroundOption => ({
  id,
  label,
  category,
  promptHintEn,
});

export const UGC_BACKGROUND_CATEGORIES: UGCBackgroundCategory[] = [
  {
    id: 'VIBE_DASAR',
    label: 'Vibe Dasar (Style Umum)',
    description: 'Gaya visual umum yang menentukan suasana keseluruhan.',
    options: [
      option('minimalist-chic', 'Minimalist Chic', 'VIBE_DASAR', 'Minimalist modern lifestyle set, clean composition.'),
      option('urban-street', 'Urban Street', 'VIBE_DASAR', 'Urban street lifestyle with authentic city texture.'),
      option('cozy-home', 'Cozy Home', 'VIBE_DASAR', 'Warm cozy home setting, natural and relatable.'),
      option('boho-natural', 'Boho Natural', 'VIBE_DASAR', 'Boho natural decor with earthy palette.'),
      option('fitness-active', 'Fitness Active', 'VIBE_DASAR', 'Active fitness environment, energetic framing.'),
      option('corporate-sleek', 'Corporate Sleek', 'VIBE_DASAR', 'Modern corporate sleek environment, polished.'),
      option('outdoor-adventure', 'Outdoor Adventure', 'VIBE_DASAR', 'Outdoor adventure mood, dynamic lifestyle context.'),
    ],
  },
  {
    id: 'VARIAN_REALISTIS',
    label: 'Varian Realistis (Lifestyle & Lingkungan)',
    description: 'Lokasi dunia nyata untuk konteks penggunaan produk.',
    options: [
      option('luxury-hotel', 'Luxury Hotel (Mewah & Elegan)', 'VARIAN_REALISTIS', 'Luxury hotel interior, elegant and premium ambience.'),
      option('modern-cafe', 'Modern Cafe (Lifestyle & Santai)', 'VARIAN_REALISTIS', 'Modern cafe lifestyle, relaxed social atmosphere.'),
      option('beach-resort', 'Beach Resort (Liburan & Tropis)', 'VARIAN_REALISTIS', 'Tropical beach resort with bright natural light.'),
      option('industrial-loft', 'Industrial Loft (Edgy & Estetik)', 'VARIAN_REALISTIS', 'Industrial loft, edgy urban aesthetic.'),
      option('scandinavian-living', 'Scandinavian Living (Bersih & Rapi)', 'VARIAN_REALISTIS', 'Scandinavian living room, clean and tidy layout.'),
      option('garden-party', 'Garden Party (Segar & Outdoor)', 'VARIAN_REALISTIS', 'Garden party outdoor setup with fresh greenery.'),
      option('workspace-studio', 'Workspace Studio (Profesional & Kreatif)', 'VARIAN_REALISTIS', 'Creative workspace studio, productive yet stylish.'),
      option('kitchen-culinary', 'Kitchen Culinary (Hangat & Lezat)', 'VARIAN_REALISTIS', 'Warm kitchen culinary setting, appetizing mood.'),
      option('sunset-rooftop', 'Sunset Rooftop (Dramatis & Mewah)', 'VARIAN_REALISTIS', 'Sunset rooftop scene with dramatic luxury vibe.'),
      option('serene-spa', 'Serene Spa (Tenang & Perawatan)', 'VARIAN_REALISTIS', 'Serene spa environment, calm self-care atmosphere.'),
    ],
  },
  {
    id: 'STUDIO_SPESIFIK',
    label: 'Studio & Spesifik (Profesional & Detail)',
    description: 'Fokus pada fotografi produk dan kontrol pencahayaan.',
    options: [
      option('professional-photo-studio', 'Professional Photo Studio (Latar Polos)', 'STUDIO_SPESIFIK', 'Professional photo studio with plain backdrop and controlled light.'),
      option('minimalist-podium', 'Minimalist Podium (Podium Geometris)', 'STUDIO_SPESIFIK', 'Minimalist geometric podium product showcase.'),
      option('abstract-pastel-studio', 'Abstract Pastel Studio (Warna Lembut)', 'STUDIO_SPESIFIK', 'Abstract pastel studio with soft color transitions.'),
      option('neon-city-night', 'Neon City Night (Bokeh Lampu Kota)', 'STUDIO_SPESIFIK', 'Neon city night with cinematic bokeh lights.'),
      option('luxury-marble-bathroom', 'Luxury Marble Bathroom (Kamar Mandi Mewah)', 'STUDIO_SPESIFIK', 'Luxury marble bathroom environment, premium detail.'),
      option('botanical-greenhouse', 'Botanical Greenhouse (Rumah Kaca)', 'STUDIO_SPESIFIK', 'Botanical greenhouse with natural diffused light.'),
      option('rustic-wooden-table', 'Rustic Wooden Table (Tekstur Kayu)', 'STUDIO_SPESIFIK', 'Rustic wooden table texture with tactile realism.'),
      option('modern-gym', 'Modern Gym (Pusat Kebugaran)', 'STUDIO_SPESIFIK', 'Modern gym environment, high-energy fitness look.'),
      option('classic-library', 'Classic Library (Rak Buku)', 'STUDIO_SPESIFIK', 'Classic library with bookshelf depth and warm light.'),
      option('art-gallery', 'Art Gallery (Ruang Putih)', 'STUDIO_SPESIFIK', 'White art gallery environment, clean premium space.'),
    ],
  },
  {
    id: 'INDONESIA_ELEGAN',
    label: 'Nuansa Indonesia Elegan (Lokal & Budaya)',
    description: 'Kekayaan budaya Indonesia dengan estetika premium.',
    options: [
      option('balinese-private-villa', 'Balinese Private Villa (Nuansa Bali)', 'INDONESIA_ELEGAN', 'Balinese private villa architecture, tropical premium ambience.'),
      option('javanese-joglo-house', 'Javanese Joglo House (Rumah Jawa)', 'INDONESIA_ELEGAN', 'Traditional Javanese joglo house, elegant heritage texture.'),
      option('ubud-rice-fields', 'Ubud Rice Fields (Sawah Terasering)', 'INDONESIA_ELEGAN', 'Ubud rice terrace landscape with cinematic natural depth.'),
      option('traditional-batik-workshop', 'Traditional Batik Workshop (Latar Batik)', 'INDONESIA_ELEGAN', 'Traditional batik workshop with artisan details.'),
      option('bamboo-eco-lodge', 'Bamboo Eco-Lodge (Arsitektur Bambu)', 'INDONESIA_ELEGAN', 'Bamboo eco-lodge architecture, earthy luxury style.'),
      option('phinisi-boat-deck', 'Phinisi Boat Deck (Kapal Kayu)', 'INDONESIA_ELEGAN', 'Phinisi wooden boat deck with maritime elegance.'),
      option('borobudur-stone-stupa', 'Borobudur Stone Stupa (Candi Batu)', 'INDONESIA_ELEGAN', 'Borobudur stone stupa inspired cultural backdrop.'),
      option('tropical-coffee-estate', 'Tropical Coffee Estate (Perkebunan Kopi)', 'INDONESIA_ELEGAN', 'Tropical coffee estate with lush plantation mood.'),
      option('traditional-tenun-ikat', 'Traditional Tenun Ikat (Latar Tenun)', 'INDONESIA_ELEGAN', 'Traditional tenun ikat textile context with craft authenticity.'),
      option('balinese-temple-gate', 'Balinese Temple Gate (Candi Bentar)', 'INDONESIA_ELEGAN', 'Balinese candi bentar gate, spiritual and majestic ambience.'),
    ],
  },
  {
    id: 'INDONESIA_KELAS_BAWAH',
    label: 'Nuansa Indonesia Kelas Bawah (Realistis & Messy)',
    description: 'Kondisi lingkungan kelas bawah ditampilkan apa adanya.',
    options: [
      option('di-dalam-angkot', 'Di Dalam Angkot', 'INDONESIA_KELAS_BAWAH', 'Inside Indonesian angkot, cramped realistic public transport look.'),
      option('di-halaman-rumah', 'Di Halaman Rumah (dengan Jemuran Baju)', 'INDONESIA_KELAS_BAWAH', 'Modest house yard with visible hanging laundry, realistic daily life.'),
      option('warkop-kaki-lima', 'Warkop kaki lima', 'INDONESIA_KELAS_BAWAH', 'Street-side warkop kaki lima, authentic and slightly messy environment.'),
      option('warteg-bahari', 'Warteg Bahari', 'INDONESIA_KELAS_BAWAH', 'Warteg Bahari style local eatery, practical and dense setting.'),
      option(
        'kamar-kos-mahasiswa',
        'Kamar Kos Mahasiswa yang berantakan tapi masih rapi normal',
        'INDONESIA_KELAS_BAWAH',
        'Student boarding room, naturally cluttered but still normal and lived-in.'
      ),
      option('dapur-kontrakan', 'Dapur kontrakan', 'INDONESIA_KELAS_BAWAH', 'Rental house kitchen, humble realistic details, slightly messy.'),
      option('kamar-mandi-kontrakan', 'Kamar Mandi Kontrakan', 'INDONESIA_KELAS_BAWAH', 'Rental house bathroom with realistic lower-income context.'),
    ],
  },
];

export const UGC_ASPECT_RATIO_OPTIONS: Array<UGCWorkflowInputPayload['aspectRatioGlobal']> = [
  '9:16',
  '16:9',
];

export const UGC_VIDEO_PROVIDER_OPTIONS: Array<{
  value: UGCVideoProvider;
  label: string;
}> = [
  { value: 'veo3_fast', label: 'Veo 3 Fast' },
  { value: 'veo3', label: 'Veo 3 Quality' },
  { value: 'grok-imagine/image-to-video', label: 'Grok Image to Video' },
];

export const DEFAULT_UGC_INPUT: UGCWorkflowInputPayload = {
  modelImageUrl: '',
  productImageUrl: '',
  productName: '',
  productShortDescription: '',
  aspectRatioGlobal: '9:16',
  backgroundCategory: 'VIBE_DASAR',
  backgroundPreset: 'minimalist-chic',
  tonevoice: 'middle-age, baritone',
  language: 'id',
  campaignTone: 'Kasual, Gaul',
  targetAudience: 'Gen Z & Milenial Indonesia',
  contentType: 'UGC Product Recommendation',
  brief: '',
};

export const getUGCBackgroundOption = (presetId: string): UGCBackgroundOption | undefined => {
  for (const category of UGC_BACKGROUND_CATEGORIES) {
    const found = category.options.find((item) => item.id === presetId);
    if (found) return found;
  }
  return undefined;
};

export const getUGCBackgroundCategoryById = (id: UGCBackgroundOption['category']) => {
  return UGC_BACKGROUND_CATEGORIES.find((item) => item.id === id);
};
