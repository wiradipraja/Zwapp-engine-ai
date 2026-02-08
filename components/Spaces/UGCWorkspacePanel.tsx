import React, { useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadImageToKieAI } from '../../services/kieFileUpload';
import { generateUGCPlan } from '../../services/ugcPlanner';
import { generateUGCSceneSequenceByCount } from '../../services/ugcSceneGenerator';
import { produceUGCSceneVideo } from '../../services/ugcVideoPipeline';
import { getCreditCost } from '../../services/credits';
import { getOutputByTaskId, saveOutputToSupabase } from '../../services/outputSaving';
import {
  DEFAULT_UGC_INPUT,
  UGC_ASPECT_RATIO_OPTIONS,
  UGC_BACKGROUND_CATEGORIES,
  UGC_VIDEO_PROVIDER_OPTIONS,
  getUGCBackgroundCategoryById,
  getUGCBackgroundOption,
} from './presets/ugcPreset';
import type {
  UGCPlannerOutput,
  UGCSceneImageAsset,
  UGCSceneVideoAsset,
  UGCVideoMode,
  UGCVideoProvider,
  UGCWorkflowInputPayload,
} from '../../types/ugcWorkflow';

interface UGCWorkspacePanelProps {
  apiKey: string;
  spaceId?: string;
}

type SceneImageMap = Record<number, { start?: UGCSceneImageAsset; end?: UGCSceneImageAsset }>;
type SceneVideoMap = Record<number, UGCSceneVideoAsset | undefined>;
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const createEmptySceneImageMap = (): SceneImageMap => ({
  1: {},
  2: {},
  3: {},
  4: {},
});

const createEmptySceneVideoMap = (): SceneVideoMap => ({
  1: undefined,
  2: undefined,
  3: undefined,
  4: undefined,
});

const toGoalLabel = (goal: string): string => {
  switch (goal) {
    case 'hook_problem':
      return 'Hook + Problem';
    case 'solution':
      return 'Solution';
    case 'benefit':
      return 'Benefit';
    case 'cta':
      return 'CTA';
    default:
      return goal;
  }
};

const UGCWorkspacePanel: React.FC<UGCWorkspacePanelProps> = ({ apiKey, spaceId }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [input, setInput] = useState<UGCWorkflowInputPayload>(DEFAULT_UGC_INPUT);
  const [plan, setPlan] = useState<UGCPlannerOutput | null>(null);
  const [sceneImages, setSceneImages] = useState<SceneImageMap>(createEmptySceneImageMap);
  const [sceneVideos, setSceneVideos] = useState<SceneVideoMap>(createEmptySceneVideoMap);
  const [sceneGenerateCount, setSceneGenerateCount] = useState<1 | 2 | 3 | 4>(1);
  const [videoProvider, setVideoProvider] = useState<UGCVideoProvider>('veo3_fast');
  const [videoMode, setVideoMode] = useState<UGCVideoMode>('A_NATIVE');
  const [muteNativeAudio, setMuteNativeAudio] = useState(true);

  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);
  const [producingSceneNumber, setProducingSceneNumber] = useState<number | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, SaveStatus>>({});
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  const selectedBackgroundCategory = useMemo(
    () => getUGCBackgroundCategoryById(input.backgroundCategory),
    [input.backgroundCategory]
  );
  const selectedBackgroundOption = useMemo(
    () => getUGCBackgroundOption(input.backgroundPreset),
    [input.backgroundPreset]
  );

  const setSaveState = (key: string, status: SaveStatus) => {
    setSaveStates((prev) => ({ ...prev, [key]: status }));
  };

  const handleInputChange = <K extends keyof UGCWorkflowInputPayload>(
    key: K,
    value: UGCWorkflowInputPayload[K]
  ) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleBackgroundCategoryChange = (category: UGCWorkflowInputPayload['backgroundCategory']) => {
    const categoryGroup = getUGCBackgroundCategoryById(category);
    const firstPreset = categoryGroup?.options?.[0]?.id || '';
    setInput((prev) => ({
      ...prev,
      backgroundCategory: category,
      backgroundPreset: firstPreset,
    }));
  };

  const uploadReferenceImage = async (
    file: File,
    target: 'modelImageUrl' | 'productImageUrl'
  ): Promise<void> => {
    if (!file) return;
    setErrorText('');
    setStatusText('');
    if (target === 'modelImageUrl') setIsUploadingModel(true);
    if (target === 'productImageUrl') setIsUploadingProduct(true);
    try {
      const url = await uploadImageToKieAI(file, apiKey);
      handleInputChange(target, url as UGCWorkflowInputPayload[typeof target]);
      setStatusText(`${target === 'modelImageUrl' ? 'Foto model' : 'Foto produk'} berhasil diupload.`);
    } catch (error: any) {
      setErrorText(error.message || 'Upload gagal.');
    } finally {
      if (target === 'modelImageUrl') setIsUploadingModel(false);
      if (target === 'productImageUrl') setIsUploadingProduct(false);
    }
  };

  const validateBeforePlanning = (): string | null => {
    if (!input.modelImageUrl) return 'Foto model karakter wajib diupload.';
    if (!input.productImageUrl) return 'Foto produk wajib diupload.';
    if (!input.productName.trim()) return 'Nama produk wajib diisi.';
    if (!input.productShortDescription.trim()) return 'Deskripsi ringkas produk wajib diisi.';
    if (!input.aspectRatioGlobal) return 'Global aspect ratio wajib dipilih.';
    if (!input.backgroundPreset) return 'Background preset wajib dipilih.';
    if (!input.tonevoice.trim()) return 'Tonevoice single speaker wajib diisi.';
    return null;
  };

  const handleGeneratePlan = async () => {
    const validationError = validateBeforePlanning();
    if (validationError) {
      setErrorText(validationError);
      return;
    }

    if (!selectedBackgroundOption) {
      setErrorText('Background preset tidak valid.');
      return;
    }

    setErrorText('');
    setStatusText('');
    setIsPlanning(true);
    try {
      const nextPlan = await generateUGCPlan({
        apiKey,
        input,
        backgroundLabel: selectedBackgroundOption.label,
        backgroundPromptHint: selectedBackgroundOption.promptHintEn,
      });
      setPlan(nextPlan);
      setSceneImages(createEmptySceneImageMap());
      setSceneVideos(createEmptySceneVideoMap());
      setStatusText('Plan 4 scene berhasil dibuat. Lanjut generate image sequence.');
    } catch (error: any) {
      setErrorText(error.message || 'Generate plan gagal.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleGenerateSceneSequence = async () => {
    if (!plan) {
      setErrorText('Generate plan dulu sebelum generate scene sequence.');
      return;
    }
    if (!selectedBackgroundOption) {
      setErrorText('Background preset tidak valid.');
      return;
    }

    setErrorText('');
    setStatusText('');
    setIsGeneratingSequence(true);
    try {
      const generated = await generateUGCSceneSequenceByCount({
        apiKey,
        input,
        backgroundLabel: selectedBackgroundOption.label,
        backgroundPromptHint: selectedBackgroundOption.promptHintEn,
        scenes: plan.scenes,
        sceneCount: sceneGenerateCount,
      });
      setSceneImages(generated);
      setStatusText(
        sceneGenerateCount === 1
          ? 'Scene 1 anchor (start+end) berhasil dibuat.'
          : `Scene 1-${sceneGenerateCount} berhasil dibuat berurutan dengan anchor continuity.`
      );
    } catch (error: any) {
      setErrorText(error.message || 'Generate scene sequence gagal.');
    } finally {
      setIsGeneratingSequence(false);
    }
  };

  const handleProduceSceneVideo = async (sceneNumber: number) => {
    if (!plan) {
      setErrorText('Plan belum tersedia.');
      return;
    }
    const scene = plan.scenes.find((item) => item.scene_number === sceneNumber);
    if (!scene) {
      setErrorText(`Scene ${sceneNumber} tidak ditemukan.`);
      return;
    }
    const frames = sceneImages[sceneNumber];
    if (!frames?.start?.imageUrl) {
      setErrorText(`Scene ${sceneNumber} belum punya start frame.`);
      return;
    }

    setErrorText('');
    setStatusText('');
    setProducingSceneNumber(sceneNumber);
    try {
      const video = await produceUGCSceneVideo({
        apiKey,
        provider: videoProvider,
        aspectRatio: input.aspectRatioGlobal,
        scenePlan: scene,
        startFrameUrl: frames.start.imageUrl,
        endFrameUrl: frames.end?.imageUrl || frames.start.imageUrl,
        audio: {
          videoMode,
          muteNativeAudio,
          singleSpeakerTonevoice: input.tonevoice,
          dialogueScript: scene.dialogue_text_id || scene.dialogue_id,
        },
      });
      setSceneVideos((prev) => ({ ...prev, [sceneNumber]: video }));
      setStatusText(`Video scene ${sceneNumber} berhasil dibuat.`);
    } catch (error: any) {
      setErrorText(error.message || `Produce video scene ${sceneNumber} gagal.`);
    } finally {
      setProducingSceneNumber(null);
    }
  };

  const buildFallbackTaskId = (prefix: string, sceneNumber: number, suffix: string) => {
    return `ugc-${spaceId || 'workspace'}-${prefix}-scene-${sceneNumber}-${suffix}`;
  };

  const saveSceneImage = async (asset: UGCSceneImageAsset) => {
    const key = `image-${asset.id}`;
    setSaveState(key, 'saving');
    setErrorText('');
    setStatusText('');
    try {
      const taskId = asset.sourceTaskId || buildFallbackTaskId('image', asset.sceneNumber, asset.frameRole);
      const existing = await getOutputByTaskId(taskId);
      if (!existing) {
        await saveOutputToSupabase(
          taskId,
          asset.sourceModel,
          asset.promptUsed,
          asset.imageUrl,
          'image',
          getCreditCost(asset.sourceModel),
          {
            source: 'spaces-ugc',
            kind: 'scene-image',
            sceneNumber: asset.sceneNumber,
            frameRole: asset.frameRole,
            sourceUrl: asset.sourceUrl,
            inputConfig: {
              productName: input.productName,
              aspectRatioGlobal: input.aspectRatioGlobal,
              backgroundPreset: input.backgroundPreset,
              tonevoice: input.tonevoice,
            },
          }
        );
      }
      setSaveState(key, 'saved');
      setStatusText(`Scene ${asset.sceneNumber} ${asset.frameRole} tersimpan.`);
    } catch (error: any) {
      setSaveState(key, 'error');
      setErrorText(error.message || 'Save image gagal.');
    }
  };

  const saveSceneVideo = async (sceneNumber: number, asset: UGCSceneVideoAsset) => {
    const key = `video-${asset.id}`;
    setSaveState(key, 'saving');
    setErrorText('');
    setStatusText('');
    try {
      const taskId = asset.sourceTaskId || buildFallbackTaskId('video', sceneNumber, asset.videoMode.toLowerCase());
      const existing = await getOutputByTaskId(taskId);
      if (!existing) {
        await saveOutputToSupabase(
          taskId,
          asset.provider,
          asset.promptUsed,
          asset.videoUrl,
          'video',
          getCreditCost(asset.provider),
          {
            source: 'spaces-ugc',
            kind: 'scene-video',
            sceneNumber,
            videoMode: asset.videoMode,
            muted: asset.muted,
            audioUrl: asset.audioUrl,
            inputConfig: {
              productName: input.productName,
              aspectRatioGlobal: input.aspectRatioGlobal,
              tonevoice: input.tonevoice,
            },
          }
        );
      }
      setSaveState(key, 'saved');
      setStatusText(`Video scene ${sceneNumber} tersimpan.`);
    } catch (error: any) {
      setSaveState(key, 'error');
      setErrorText(error.message || 'Save video gagal.');
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="px-4 py-4 space-y-4">
        <div
          className={`rounded-xl border px-4 py-3 ${
            isDark ? 'border-zinc-800 bg-zinc-950/80 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">UGC Preset Workflow (MVP)</div>
              <div className="text-xs text-zinc-500">
                4 scene plan, scene 1 anchor tanpa produk, mode video A/B, save manual-only.
              </div>
            </div>
            <div className="text-[11px] font-mono text-emerald-400">NO AUTO-REGENERATE</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div
            className={`rounded-xl border p-4 space-y-4 ${
              isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-white'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Step 1 - Input Wajib</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-zinc-400">Foto Model Karakter</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadReferenceImage(file, 'modelImageUrl');
                  }}
                  className="text-xs"
                />
                {isUploadingModel && <div className="text-[11px] text-amber-400">Uploading model...</div>}
                {input.modelImageUrl && (
                  <img
                    src={input.modelImageUrl}
                    alt="Model reference"
                    className="w-full h-40 object-cover rounded-lg border border-zinc-800"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400">Foto Produk</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadReferenceImage(file, 'productImageUrl');
                  }}
                  className="text-xs"
                />
                {isUploadingProduct && <div className="text-[11px] text-amber-400">Uploading produk...</div>}
                {input.productImageUrl && (
                  <img
                    src={input.productImageUrl}
                    alt="Product reference"
                    className="w-full h-40 object-cover rounded-lg border border-zinc-800"
                  />
                )}
              </div>
            </div>

            <input
              value={input.productName}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              placeholder="Nama Produk"
              className={`w-full px-3 py-2 rounded-lg text-xs border ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
              }`}
            />

            <textarea
              value={input.productShortDescription}
              onChange={(e) => handleInputChange('productShortDescription', e.target.value)}
              rows={3}
              placeholder="Deskripsi ringkas produk"
              className={`w-full px-3 py-2 rounded-lg text-xs border ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
              }`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={input.aspectRatioGlobal}
                onChange={(e) =>
                  handleInputChange(
                    'aspectRatioGlobal',
                    e.target.value as UGCWorkflowInputPayload['aspectRatioGlobal']
                  )
                }
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                }`}
              >
                {UGC_ASPECT_RATIO_OPTIONS.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    Aspect Ratio: {ratio}
                  </option>
                ))}
              </select>

              <input
                value={input.tonevoice}
                onChange={(e) => handleInputChange('tonevoice', e.target.value)}
                placeholder="Tonevoice single speaker (contoh: middle-age, baritone)"
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={input.backgroundCategory}
                onChange={(e) =>
                  handleBackgroundCategoryChange(
                    e.target.value as UGCWorkflowInputPayload['backgroundCategory']
                  )
                }
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                }`}
              >
                {UGC_BACKGROUND_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={input.backgroundPreset}
                onChange={(e) => handleInputChange('backgroundPreset', e.target.value)}
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                }`}
              >
                {(selectedBackgroundCategory?.options || []).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={input.targetAudience || ''}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                placeholder="Target audience (contoh: Gen Z)"
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                }`}
              />
              <input
                value={input.campaignTone}
                onChange={(e) => handleInputChange('campaignTone', e.target.value)}
                placeholder="Campaign tone (contoh: Kasual, Gaul)"
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                }`}
              />
            </div>

            <textarea
              value={input.brief || ''}
              onChange={(e) => handleInputChange('brief', e.target.value)}
              rows={2}
              placeholder="Brief tambahan (opsional)"
              className={`w-full px-3 py-2 rounded-lg text-xs border ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
              }`}
            />

            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={sceneGenerateCount}
                onChange={(e) => setSceneGenerateCount(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                }`}
              >
                <option value={1}>Generate: Scene 1 only (Anchor)</option>
                <option value={2}>Generate: Scene 1-2</option>
                <option value={3}>Generate: Scene 1-3</option>
                <option value={4}>Generate: Scene 1-4</option>
              </select>
              <button
                onClick={handleGeneratePlan}
                disabled={isPlanning}
                className="px-3 py-2 rounded-lg text-xs bg-emerald-500 text-white disabled:opacity-50"
              >
                {isPlanning ? 'Generating Plan...' : 'Step 2: Generate Plan (4 Scene)'}
              </button>
              <button
                onClick={handleGenerateSceneSequence}
                disabled={!plan || isGeneratingSequence}
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'border-zinc-700 text-zinc-200' : 'border-zinc-300 text-zinc-700'
                } disabled:opacity-50`}
              >
                {isGeneratingSequence
                  ? 'Generating Sequence...'
                  : sceneGenerateCount === 1
                  ? 'Step 3: Generate Scene 1 Anchor'
                  : `Step 3: Generate Scene 1-${sceneGenerateCount}`}
              </button>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 space-y-4 ${
              isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-white'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Step 4 - Image to Video</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={videoProvider}
                onChange={(e) => setVideoProvider(e.target.value as UGCVideoProvider)}
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                }`}
              >
                {UGC_VIDEO_PROVIDER_OPTIONS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    Provider: {provider.label}
                  </option>
                ))}
              </select>

              <select
                value={videoMode}
                onChange={(e) => setVideoMode(e.target.value as UGCVideoMode)}
                className={`px-3 py-2 rounded-lg text-xs border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                }`}
              >
                <option value="A_NATIVE">Mode A - Native Voice (Veo/Grok)</option>
                <option value="B_ELEVENLABS">Mode B - ElevenLabs Dialogue</option>
              </select>
            </div>

            {videoMode === 'B_ELEVENLABS' && (
              <div className="flex items-center justify-between rounded-lg border border-zinc-700 px-3 py-2 text-xs">
                <div>
                  <div className="font-semibold">Mute native audio</div>
                  <div className="text-[11px] text-zinc-500">Pilih ON/OFF sesuai kebutuhan mode B.</div>
                </div>
                <button
                  onClick={() => setMuteNativeAudio((prev) => !prev)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    muteNativeAudio ? 'bg-emerald-500/80' : isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      muteNativeAudio ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="text-[11px] text-zinc-500">
              Rule enforced: no subtitle, no caption, no overlay text, dialog-focused audio.
            </div>

            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pt-2">Step 5 - Save</div>
            <div className="text-[11px] text-zinc-500">
              Tidak ada autosave. Semua output scene hanya tersimpan saat user klik tombol Save.
            </div>
          </div>
        </div>

        {statusText && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs ${
              isDark
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {statusText}
          </div>
        )}
        {errorText && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs ${
              isDark ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {errorText}
          </div>
        )}

        {plan && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Planner Output</div>
              <div className="text-xs text-zinc-300">
                <span className="font-semibold">Caption:</span> {plan.caption_id || '-'}
              </div>
              <div className="text-xs text-zinc-300">
                <span className="font-semibold">Hashtags:</span>{' '}
                {plan.hashtags.length > 0 ? plan.hashtags.join(' ') : '-'}
              </div>
              <div className="text-[11px] text-zinc-500">
                Scene 1 hard rule: karakter only (tanpa produk). Scene 2-4: model + produk visible.
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {plan.scenes.map((scene) => {
                const sceneFrame = sceneImages[scene.scene_number];
                const sceneVideo = sceneVideos[scene.scene_number];
                const startSaveKey = sceneFrame?.start ? `image-${sceneFrame.start.id}` : '';
                const endSaveKey = sceneFrame?.end ? `image-${sceneFrame.end.id}` : '';
                const videoSaveKey = sceneVideo ? `video-${sceneVideo.id}` : '';
                const isProducingThisScene = producingSceneNumber === scene.scene_number;
                return (
                  <div
                    key={`scene-${scene.scene_number}`}
                    className={`rounded-xl border p-4 space-y-3 ${
                      isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">Scene {scene.scene_number}</div>
                        <div className="text-[11px] text-zinc-500">{toGoalLabel(scene.goal)}</div>
                      </div>
                      <div
                        className={`text-[10px] px-2 py-1 rounded border ${
                          scene.show_product
                            ? 'border-emerald-500/40 text-emerald-300'
                            : 'border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {scene.show_product ? 'Show Product' : 'Character Only'}
                      </div>
                    </div>

                    <div className="text-xs text-zinc-300">
                      <span className="font-semibold">Dialogue:</span> {scene.dialogue_text_id || scene.dialogue_id}
                    </div>
                    <div className="text-[11px] text-zinc-500 whitespace-pre-wrap">
                      {scene.visual_description_en}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-wider text-zinc-500">Start Frame</div>
                        {sceneFrame?.start ? (
                          <>
                            <img
                              src={sceneFrame.start.imageUrl}
                              alt={`Scene ${scene.scene_number} start`}
                              className="w-full h-44 object-cover rounded-lg border border-zinc-800"
                            />
                            <button
                              onClick={() => saveSceneImage(sceneFrame.start as UGCSceneImageAsset)}
                              disabled={saveStates[startSaveKey] === 'saving' || saveStates[startSaveKey] === 'saved'}
                              className={`px-3 py-2 rounded-lg text-xs border ${
                                saveStates[startSaveKey] === 'saved'
                                  ? 'border-emerald-500/50 text-emerald-300'
                                  : isDark
                                  ? 'border-zinc-700 text-zinc-200'
                                  : 'border-zinc-300 text-zinc-700'
                              } disabled:opacity-50`}
                            >
                              {saveStates[startSaveKey] === 'saved'
                                ? 'Saved'
                                : saveStates[startSaveKey] === 'saving'
                                ? 'Saving...'
                                : 'Save Start Frame'}
                            </button>
                          </>
                        ) : (
                          <div className="h-44 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center text-[11px] text-zinc-500">
                            Belum digenerate
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-wider text-zinc-500">End Frame</div>
                        {sceneFrame?.end ? (
                          <>
                            <img
                              src={sceneFrame.end.imageUrl}
                              alt={`Scene ${scene.scene_number} end`}
                              className="w-full h-44 object-cover rounded-lg border border-zinc-800"
                            />
                            <button
                              onClick={() => saveSceneImage(sceneFrame.end as UGCSceneImageAsset)}
                              disabled={saveStates[endSaveKey] === 'saving' || saveStates[endSaveKey] === 'saved'}
                              className={`px-3 py-2 rounded-lg text-xs border ${
                                saveStates[endSaveKey] === 'saved'
                                  ? 'border-emerald-500/50 text-emerald-300'
                                  : isDark
                                  ? 'border-zinc-700 text-zinc-200'
                                  : 'border-zinc-300 text-zinc-700'
                              } disabled:opacity-50`}
                            >
                              {saveStates[endSaveKey] === 'saved'
                                ? 'Saved'
                                : saveStates[endSaveKey] === 'saving'
                                ? 'Saving...'
                                : 'Save End Frame'}
                            </button>
                          </>
                        ) : (
                          <div className="h-44 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center text-[11px] text-zinc-500">
                            Belum digenerate
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => handleProduceSceneVideo(scene.scene_number)}
                        disabled={!sceneFrame?.start || isProducingThisScene}
                        className="px-3 py-2 rounded-lg text-xs bg-orange-500 text-white disabled:opacity-50"
                      >
                        {isProducingThisScene ? 'Producing Video...' : `Produce Video Scene ${scene.scene_number}`}
                      </button>
                    </div>

                    {sceneVideo && (
                      <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
                        <div className="text-[11px] uppercase tracking-wider text-zinc-500">Video Output</div>
                        <video
                          src={sceneVideo.videoUrl}
                          controls
                          muted={sceneVideo.muted}
                          className="w-full max-h-72 object-contain rounded-lg border border-zinc-800"
                        />
                        {sceneVideo.audioUrl && <audio src={sceneVideo.audioUrl} controls className="w-full" />}
                        <div className="text-[11px] text-zinc-500">
                          Provider: {sceneVideo.provider} | Mode: {sceneVideo.videoMode}
                          {sceneVideo.videoMode === 'B_ELEVENLABS' && (
                            <span> | Mute native: {sceneVideo.muted ? 'ON' : 'OFF'}</span>
                          )}
                        </div>
                        <button
                          onClick={() => saveSceneVideo(scene.scene_number, sceneVideo)}
                          disabled={saveStates[videoSaveKey] === 'saving' || saveStates[videoSaveKey] === 'saved'}
                          className={`px-3 py-2 rounded-lg text-xs border ${
                            saveStates[videoSaveKey] === 'saved'
                              ? 'border-emerald-500/50 text-emerald-300'
                              : isDark
                              ? 'border-zinc-700 text-zinc-200'
                              : 'border-zinc-300 text-zinc-700'
                          } disabled:opacity-50`}
                        >
                          {saveStates[videoSaveKey] === 'saved'
                            ? 'Saved'
                            : saveStates[videoSaveKey] === 'saving'
                            ? 'Saving...'
                            : 'Save Video'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UGCWorkspacePanel;
