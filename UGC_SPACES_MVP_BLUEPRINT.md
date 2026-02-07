# UGC Spaces MVP Blueprint

## 1) Scope
- UGC masuk sebagai preset workflow di menu `Spaces`.
- Tidak ada auto-regenerate.
- Global aspect ratio wajib diisi di awal dan dipakai konsisten untuk semua output.
- Tone voice karakter: single speaker (`tonevoice` text field).
- Scene plan selalu 4 scene:
  - Scene 1: Hook + Problem
  - Scene 2: Solusi
  - Scene 3: Benefit
  - Scene 4: CTA
- Rule visual penting:
  - Scene 1 tidak menampilkan produk, hanya model karakter.
  - Scene 2-4 menampilkan model + produk.
- Save output hanya saat user klik `Save`.

## 2) UX Flow (Preset UGC di Spaces)
- Step 1: Input wajib
  - Upload foto model.
  - Upload foto produk.
  - Product name.
  - Product short description.
  - Global aspect ratio.
  - Background preset (berdasarkan kategori lengkap).
  - Tone voice (single speaker, contoh: `middle-age, baritone`).
- Step 2: Generate Plan (Gemini Chat role: Creative Director & Copywriter)
  - Output JSON schema ketat 4 scene.
- Step 3: Generate Image Sequence
  - Scene 1 start frame sebagai anchor master.
  - Scene 1 end frame mengikuti anchor scene 1.
  - Scene 2-4 generate sesuai plan dan rule produk.
- Step 4: Produce Image-to-Video
  - Mode A: Native voice model video (Veo/Grok).
  - Mode B: ElevenLabs dialogue track.
  - Mode B memberi pilihan user:
    - Mute native audio: ON/OFF.
- Step 5: Save
  - User pilih hasil, lalu klik `Save`.

## 3) Data Contract

### 3.1 UGC Input Payload
```json
{
  "modelImageUrl": "https://...",
  "productImageUrl": "https://...",
  "productName": "string",
  "productShortDescription": "string",
  "aspectRatioGlobal": "9:16 | 16:9",
  "backgroundCategory": "string",
  "backgroundPreset": "string",
  "tonevoice": "string",
  "language": "id",
  "campaignTone": "string"
}
```

### 3.2 Planner Output (Strict JSON)
```json
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
      "visual_description_en": "string",
      "camera_direction_en": "string",
      "negative_prompt_en": "string"
    }
  ],
  "caption_id": "string",
  "hashtags": ["string"]
}
```

### 3.3 Video Audio Mode Payload
```json
{
  "videoMode": "A_NATIVE | B_ELEVENLABS",
  "muteNativeAudio": true,
  "singleSpeakerTonevoice": "middle-age, baritone",
  "dialogueScript": "string"
}
```

## 4) Background Preset Structure
- Kategori background akan disimpan sebagai struktur grouped options.
- Semua opsi dari requirement wajib dimasukkan apa adanya, termasuk:
  - Nuansa Indonesia elegan.
  - Nuansa Indonesia kelas bawah (messy/realistic).

Contoh struktur:
```ts
type BackgroundOption = {
  id: string;
  label: string;
  category:
    | 'VIBE_DASAR'
    | 'VARIAN_REALISTIS'
    | 'STUDIO_SPESIFIK'
    | 'INDONESIA_ELEGAN'
    | 'INDONESIA_KELAS_BAWAH';
};
```

## 5) Prompt Rules (Hard Constraints)
- Selalu sisipkan rule global:
  - `No subtitle, no caption, no text overlay, no watermark, no logo.`
- Scene 1 hard rule:
  - `Do not show product. Character only.`
- Scene 2-4 hard rule:
  - `Product must be visible and recognizable.`
- Identity lock:
  - Pertahankan wajah model, bentuk produk, dan rasio global.

## 6) Model Strategy
- Planner:
  - Gunakan pipeline Gemini Chat KIE yang sudah stabil.
- Image Renderer:
  - Primary: Gemini 3 Pro Image.
  - Fallback: Nano Banana multimodal (existing in system).
- Video Renderer:
  - Mode A: Veo/Grok native.
  - Mode B: ElevenLabs dialogue via model `elevenlabs/text-to-dialogue-v3`.

## 7) ElevenLabs Integration Notes
- Endpoint create task:
  - `POST /api/proxy/jobs/createTask`
  - Model: `elevenlabs/text-to-dialogue-v3`
- Query task:
  - `GET /api/proxy/jobs/recordInfo?taskId=...`
- Input dialogue single speaker:
  - `dialogue` berisi 1 object speaker untuk seluruh script.
- Output:
  - Ambil audio URL dari `resultJson.resultUrls[0]`.

## 8) Save Behavior
- Tidak autosave.
- Simpan hanya saat user klik `Save` pada scene/output yang dipilih.
- Metadata yang disimpan minimal:
  - input config,
  - planner output,
  - selected images/videos,
  - audio mode dan setting mute.

## 9) Suggested File Plan
- `types/ugcWorkflow.ts`
  - Types untuk input, planner output, scene asset, video pipeline.
- `services/ugcPlanner.ts`
  - Planner Gemini role Creative Director & Copywriter.
- `services/ugcSceneGenerator.ts`
  - Generate scene images dengan strategy primary/fallback.
- `services/ugcVideoPipeline.ts`
  - Orkestrasi mode A/B video.
- `services/elevenLabsDialogue.ts`
  - Wrapper create/query task ElevenLabs KIE.
- `components/Spaces/presets/ugcPreset.ts`
  - Default nodes dan state preset UGC.
- `components/Spaces/UGCWorkspacePanel.tsx`
  - Input form, planner board, scene board, save action.
- `components/Spaces/SpacesWorkspace.tsx`
  - Register preset UGC dan route panelnya.

## 10) MVP Acceptance Criteria
- User bisa isi parameter wajib termasuk global aspect ratio.
- Planner selalu mengembalikan 4 scene valid.
- Scene 1 tidak menampilkan produk.
- Scene 2-4 menampilkan produk.
- Semua output konsisten di rasio global.
- Mode video A dan B bisa dipilih user.
- Mode B punya toggle mute native audio.
- Tidak ada auto-regenerate.
- Save hanya saat klik `Save`.
