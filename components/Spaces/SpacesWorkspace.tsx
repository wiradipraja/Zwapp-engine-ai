import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from 'reactflow';
import { useTheme } from '../../contexts/ThemeContext';
import { createTask, queryTask } from '../../services/api';
import { generateVeo3Video } from '../../services/veo3Generation';
import { generateTextWithGemini } from '../../services/textGeneration';
import { uploadImageToKieAI, uploadVideoToKieAI } from '../../services/kieFileUpload';
import { createSpace, deleteSpace, fetchSpaces, updateSpace } from '../../services/spaces';
import { listUserAssets, uploadOutputUrlToSupabase, type SupabaseAsset } from '../../services/spacesAssets';
import type {
  SpaceFlowData,
  SpaceNodeData,
  SpaceNodeOutput,
  SpaceNodeType,
  SpaceRecord,
} from '../../types/spaces';
import type {
  NanoBananaEditInput,
  NanoBananaGenInput,
  Flux2ProTextInput,
  Flux2FlexTextInput,
  GrokImageToImageInput,
  GrokTextToImageInput,
  GrokUpscaleInput,
  QwenTextToImageInput,
  ZImageInput,
  Veo3ImageToVideoInput,
  Veo3Input,
  Veo3TextToVideoInput,
} from '../../types';

interface SpacesWorkspaceProps {
  apiKey: string;
  googleApiKey: string;
  onOpenSettings: () => void;
}

const DEFAULT_SPACE_NAME = 'New Space';
const FLOW_VERSION = '1.1';

const defaultNodeData = (type: SpaceNodeType): SpaceNodeData => {
  switch (type) {
    case 'prompt':
      return { label: 'Prompt', title: 'Prompt', status: 'idle', prompt: '' };
    case 'script':
      return { label: 'Script', title: 'Script', status: 'idle', prompt: '' };
    case 'image':
      return {
        label: 'Image',
        title: 'Image',
        status: 'idle',
        prompt: '',
        model: 'google/nano-banana',
        aspectRatio: '1:1',
        imageMode: 'auto',
        videoFrameRole: 'none',
      };
    case 'video':
      return {
        label: 'Video',
        title: 'Video',
        status: 'idle',
        prompt: '',
        model: 'veo3_fast',
        aspectRatio: '16:9',
        videoMode: 'auto',
      };
    case 'upload':
      return {
        label: 'Upload',
        title: 'Upload',
        status: 'idle',
        assetType: 'image',
        assetSource: 'local',
        assetRole: 'auto',
        videoFrameRole: 'none',
      };
    case 'camera':
      return {
        label: 'Camera',
        title: 'Camera Preset',
        status: 'success',
        presetId: 'ugc',
        output: { contentType: 'text', text: cameraPresets[0].snippet, metadata: { kind: 'camera_preset' } },
      };
    case 'motion':
      return {
        label: 'Motion',
        title: 'Motion Preset',
        status: 'success',
        presetId: 'static',
        output: {
          contentType: 'text',
          text: motionPresets.find((item) => item.id === 'static')?.snippet || motionPresets[0].snippet,
          metadata: { kind: 'motion_preset' },
        },
      };
    case 'angle':
      return {
        label: 'Angle',
        title: 'Angle Preset',
        status: 'success',
        presetId: 'eye',
        output: { contentType: 'text', text: anglePresets[0].snippet, metadata: { kind: 'angle_preset' } },
      };
    default:
      return { label: 'Node', status: 'idle' };
  }
};

const buildDefaultFlow = (): SpaceFlowData => {
  const promptId = crypto.randomUUID();
  const scriptId = crypto.randomUUID();
  return {
    version: FLOW_VERSION,
    nodes: [
      {
        id: promptId,
        type: 'prompt',
        position: { x: 80, y: 120 },
        data: defaultNodeData('prompt'),
      },
      {
        id: scriptId,
        type: 'script',
        position: { x: 380, y: 120 },
        data: defaultNodeData('script'),
      },
    ],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
};

const cameraPresets = [
  {
    id: 'ugc',
    label: 'UGC Phone',
    description: 'Handheld phone camera, casual, natural light.',
    snippet: 'Handheld phone camera, natural lighting, candid UGC realism, slight motion blur, real skin texture.',
  },
  {
    id: 'ugc-clean',
    label: 'UGC Clean',
    description: 'Phone camera, clean framing, soft natural light.',
    snippet: 'Clean UGC framing, phone camera, soft natural daylight, realistic skin texture, minimal motion blur.',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Filmic lighting, shallow depth, dramatic mood.',
    snippet: 'Cinematic lighting, shallow depth of field, filmic contrast, soft roll-off highlights.',
  },
  {
    id: 'docu',
    label: 'Documentary',
    description: 'Natural handheld, authentic, slightly imperfect.',
    snippet: 'Documentary handheld camera, natural color, subtle motion, authentic unpolished realism.',
  },
  {
    id: 'studio',
    label: 'Studio',
    description: 'Clean studio, product focus, softbox.',
    snippet: 'Studio softbox lighting, clean backdrop, product-focused composition, crisp detail.',
  },
  {
    id: 'fashion',
    label: 'Fashion Editorial',
    description: 'High-end editorial lighting and styling.',
    snippet: 'Fashion editorial lighting, controlled highlights, soft shadows, premium commercial styling.',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    description: 'Natural lifestyle scene, warm tone.',
    snippet: 'Lifestyle photography, natural window light, warm tones, candid everyday scene.',
  },
  {
    id: 'product',
    label: 'Product Close-Up',
    description: 'Macro detail, clean focus, minimal background.',
    snippet: 'Close-up product shot, macro detail, sharp focus, minimal background, clean highlights.',
  },
];

const motionPresets = [
  { id: 'pan_left', label: 'Pan Left', description: 'Horizontal pan to the left.', snippet: 'Slow pan left, smooth cinematic movement.' },
  { id: 'pan_right', label: 'Pan Right', description: 'Horizontal pan to the right.', snippet: 'Slow pan right, smooth cinematic movement.' },
  { id: 'tilt_up', label: 'Tilt Up', description: 'Vertical tilt upward.', snippet: 'Slow tilt up, reveal upward, smooth movement.' },
  { id: 'tilt_down', label: 'Tilt Down', description: 'Vertical tilt downward.', snippet: 'Slow tilt down, reveal downward, smooth movement.' },
  { id: 'dolly_in', label: 'Dolly In', description: 'Camera moves closer to subject.', snippet: 'Dolly in, subtle push-in, smooth cinematic movement.' },
  { id: 'dolly_out', label: 'Dolly Out', description: 'Camera moves away from subject.', snippet: 'Dolly out, smooth pull-back movement.' },
  { id: 'truck_left', label: 'Truck Left', description: 'Lateral move to the left.', snippet: 'Truck left, lateral move, stable framing.' },
  { id: 'truck_right', label: 'Truck Right', description: 'Lateral move to the right.', snippet: 'Truck right, lateral move, stable framing.' },
  { id: 'orbit_left', label: 'Orbit Left', description: 'Orbit around subject to the left.', snippet: 'Orbit left around subject, smooth arc movement.' },
  { id: 'orbit_right', label: 'Orbit Right', description: 'Orbit around subject to the right.', snippet: 'Orbit right around subject, smooth arc movement.' },
  { id: 'crane_up', label: 'Crane Up', description: 'Camera rises upward.', snippet: 'Crane up, vertical rise, smooth controlled movement.' },
  { id: 'crane_down', label: 'Crane Down', description: 'Camera descends downward.', snippet: 'Crane down, gentle vertical drop, smooth movement.' },
  { id: 'drone_forward', label: 'Drone Forward', description: 'Aerial forward motion.', snippet: 'Drone forward, smooth aerial push with depth.' },
  { id: 'drone_down', label: 'Drone Down', description: 'Aerial descent.', snippet: 'Drone down, smooth aerial descent.' },
  { id: 'handheld_micro', label: 'Handheld Micro', description: 'Natural micro shake.', snippet: 'Handheld micro-shake, subtle natural movement.' },
  { id: 'static', label: 'Static', description: 'Locked-off shot, no movement.', snippet: 'Static tripod shot, no camera movement, stable framing.' },
];

const motionGroups = [
  { id: 'Pan', items: ['pan_left', 'pan_right'] },
  { id: 'Tilt', items: ['tilt_up', 'tilt_down'] },
  { id: 'Dolly', items: ['dolly_in', 'dolly_out'] },
  { id: 'Truck', items: ['truck_left', 'truck_right'] },
  { id: 'Orbit', items: ['orbit_left', 'orbit_right'] },
  { id: 'Crane', items: ['crane_up', 'crane_down'] },
  { id: 'Drone', items: ['drone_forward', 'drone_down'] },
  { id: 'Handheld', items: ['handheld_micro'] },
  { id: 'Static', items: ['static'] },
];

const getMotionPreset = (id: string) => motionPresets.find((preset) => preset.id === id);

const getMotionDiagram = (id: string) => {
  const stroke = '#00FFD1';
  const bg = '#0b0f1a';
  const text = id.replace(/_/g, ' ').toUpperCase();
  const arrowLeft = `<polygon points="60,45 74,38 74,52" fill="${stroke}" />`;
  const arrowRight = `<polygon points="180,45 166,38 166,52" fill="${stroke}" />`;
  const arrowUp = `<polygon points="120,20 112,34 128,34" fill="${stroke}" />`;
  const arrowDown = `<polygon points="120,70 112,56 128,56" fill="${stroke}" />`;

  let path = '';
  let circle = '';

  switch (id) {
    case 'pan_left':
    case 'truck_left':
      path = `<line x1="180" y1="45" x2="60" y2="45" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />${arrowLeft}`;
      circle = `<circle r="10" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="cx" from="180" to="60" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="cy" from="45" to="45" dur="1.5s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'pan_right':
    case 'truck_right':
      path = `<line x1="60" y1="45" x2="180" y2="45" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />${arrowRight}`;
      circle = `<circle r="10" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="cx" from="60" to="180" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="cy" from="45" to="45" dur="1.5s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'tilt_up':
      path = `<line x1="120" y1="70" x2="120" y2="20" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />${arrowUp}`;
      circle = `<circle r="10" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="cx" from="120" to="120" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="cy" from="70" to="20" dur="1.5s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'tilt_down':
      path = `<line x1="120" y1="20" x2="120" y2="70" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />${arrowDown}`;
      circle = `<circle r="10" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="cx" from="120" to="120" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="cy" from="20" to="70" dur="1.5s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'dolly_in':
      path = `<line x1="120" y1="20" x2="120" y2="70" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />`;
      circle = `<circle cx="120" cy="45" r="10" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="r" from="10" to="18" dur="1.5s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'dolly_out':
      path = `<line x1="120" y1="20" x2="120" y2="70" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />`;
      circle = `<circle cx="120" cy="45" r="18" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="r" from="18" to="10" dur="1.5s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'orbit_left':
    case 'orbit_right':
      path = `<circle cx="120" cy="45" r="24" fill="none" stroke="${stroke}" stroke-width="2" stroke-dasharray="6 6" />
        <circle cx="120" cy="45" r="4" fill="#FF0066" />`;
      circle = `<circle r="8" fill="#111" stroke="${stroke}" stroke-width="3">
        <animateMotion dur="2s" repeatCount="indefinite" path="M 120 45 m -24 0 a 24 24 0 1 1 48 0 a 24 24 0 1 1 -48 0" />
      </circle>`;
      break;
    case 'crane_up':
      path = `<line x1="120" y1="70" x2="120" y2="20" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />${arrowUp}`;
      circle = `<circle r="10" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="cx" from="120" to="120" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="cy" from="70" to="20" dur="1.6s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'crane_down':
      path = `<line x1="120" y1="20" x2="120" y2="70" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />${arrowDown}`;
      circle = `<circle r="10" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="cx" from="120" to="120" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="cy" from="20" to="70" dur="1.6s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'drone_forward':
      path = `<line x1="70" y1="65" x2="170" y2="30" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />${arrowRight}`;
      circle = `<circle cx="70" cy="65" r="8" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="cx" from="70" to="170" dur="2s" repeatCount="indefinite" />
        <animate attributeName="cy" from="65" to="30" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r" from="8" to="14" dur="2s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'drone_down':
      path = `<line x1="120" y1="20" x2="120" y2="70" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />${arrowDown}`;
      circle = `<circle cx="120" cy="20" r="9" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="cy" from="20" to="70" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="r" from="9" to="12" dur="1.8s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'handheld_micro':
      path = `<line x1="100" y1="45" x2="140" y2="45" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />`;
      circle = `<circle cx="120" cy="45" r="10" fill="#111" stroke="${stroke}" stroke-width="3">
        <animate attributeName="cx" values="118;122;119;121;118" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="cy" values="44;46;45;43;44" dur="1.2s" repeatCount="indefinite" />
      </circle>`;
      break;
    case 'static':
    default:
      path = `<line x1="90" y1="45" x2="150" y2="45" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="6 6" />`;
      circle = `<circle cx="120" cy="45" r="10" fill="#111" stroke="${stroke}" stroke-width="3" />`;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="90" viewBox="0 0 240 90">
    <rect width="240" height="90" rx="8" fill="${bg}" />
    ${path}
    ${circle}
    <text x="120" y="82" text-anchor="middle" fill="${stroke}" font-size="12" font-family="Arial, sans-serif">
      ${text}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const anglePresets = [
  { id: 'eye', label: 'Eye Level', description: 'Neutral, natural angle.', snippet: 'Eye-level camera angle, neutral perspective.' },
  { id: 'low', label: 'Low Angle', description: 'Slightly below subject.', snippet: 'Low-angle shot, subject feels taller and more dominant.' },
  { id: 'high', label: 'High Angle', description: 'Slightly above subject.', snippet: 'High-angle shot, camera slightly above subject.' },
  { id: 'overhead', label: 'Overhead', description: 'Top-down flatlay.', snippet: 'Overhead top-down angle, flatlay composition.' },
];

const getAnglePreview = (id: string) => {
  const svg = (() => {
    switch (id) {
      case 'low':
        return `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><rect width='120' height='60' fill='#0f172a'/><circle cx='60' cy='42' r='10' fill='#38bdf8'/><line x1='10' y1='50' x2='60' y2='42' stroke='#94a3b8' stroke-width='2'/></svg>`;
      case 'high':
        return `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><rect width='120' height='60' fill='#0f172a'/><circle cx='60' cy='18' r='10' fill='#38bdf8'/><line x1='10' y1='10' x2='60' y2='18' stroke='#94a3b8' stroke-width='2'/></svg>`;
      case 'overhead':
        return `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><rect width='120' height='60' fill='#0f172a'/><circle cx='60' cy='30' r='12' fill='#38bdf8'/><circle cx='60' cy='30' r='22' stroke='#94a3b8' stroke-width='2' fill='none'/></svg>`;
      default:
        return `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><rect width='120' height='60' fill='#0f172a'/><circle cx='60' cy='30' r='10' fill='#38bdf8'/><line x1='10' y1='30' x2='60' y2='30' stroke='#94a3b8' stroke-width='2'/></svg>`;
    }
  })();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const SpaceNodeCard: React.FC<NodeProps<SpaceNodeData>> = ({ data, type, selected }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const output = data.output;
  const status = data.status || 'idle';

  return (
    <div
      className={`min-w-[180px] max-w-[220px] rounded-xl border px-3 py-2 shadow-lg backdrop-blur ${
        selected ? (isDark ? 'border-zinc-400' : 'border-zinc-500') : isDark ? 'border-zinc-800' : 'border-zinc-200'
      } ${isDark ? 'bg-zinc-900/70 text-zinc-100' : 'bg-white text-zinc-800'}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-400/70" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold tracking-wide">{data.title || data.label}</span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-400">{data.label}</span>
        </div>
        <span
          className={`text-[10px] font-mono ${
            status === 'running'
              ? 'text-amber-300'
              : status === 'success'
              ? 'text-emerald-300'
              : status === 'error'
              ? 'text-red-400'
              : 'text-zinc-400'
          }`}
        >
          {status}
        </span>
      </div>

      {output?.text && (
        <div className="mt-2 text-[10px] text-zinc-300 line-clamp-4 whitespace-pre-wrap">
          {output.text}
        </div>
      )}

      {type === 'motion' && data.presetId && (
        <img
          src={getMotionDiagram(data.presetId)}
          alt="motion preview"
          className="mt-2 w-full h-12 object-contain rounded-md border border-white/10 bg-zinc-950"
        />
      )}

      {output?.url && output.contentType === 'image' && (
        <img
          src={output.url}
          alt="preview"
          className="mt-2 w-full h-auto rounded-lg object-contain border border-white/10"
        />
      )}

      {output?.url && output.contentType === 'video' && (
        <video className="mt-2 w-full h-auto rounded-lg border border-white/10 object-contain" src={output.url} />
      )}

      {data.error && (
        <div className="mt-2 text-[10px] text-red-300 line-clamp-3">{data.error}</div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-zinc-400/70" />
    </div>
  );
};

interface AssetLibraryModalProps {
  isOpen: boolean;
  kind: 'image' | 'video';
  onClose: () => void;
  onSelect: (asset: SupabaseAsset) => void;
}

const AssetLibraryModal: React.FC<AssetLibraryModalProps> = ({ isOpen, kind, onClose, onSelect }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [assets, setAssets] = useState<SupabaseAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    listUserAssets(kind)
      .then((data) => {
        if (!cancelled) setAssets(data);
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, kind]);

  const filtered = assets.filter((asset) =>
    asset.name.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`w-[900px] max-w-[95vw] max-h-[80vh] rounded-2xl border shadow-2xl ${
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Supabase Library
            </h3>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Pick a {kind} asset without re-upload.
            </p>
          </div>
          <button
            onClick={onClose}
            className={`text-xs px-3 py-1 rounded-full border ${
              isDark ? 'border-zinc-700 text-zinc-300' : 'border-zinc-200 text-zinc-600'
            }`}
          >
            Close
          </button>
        </div>

        <div className="px-6 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets..."
            className={`w-full px-3 py-2 rounded-lg text-sm border ${
              isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-zinc-50 border-zinc-200'
            }`}
          />
        </div>

        <div className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-sm text-zinc-500 py-6">Loading assets...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-zinc-500 py-6">No assets found.</div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {filtered.map((asset) => (
                <button
                  key={asset.path}
                  onClick={() => onSelect(asset)}
                  className={`rounded-xl border overflow-hidden text-left hover:scale-[1.01] transition-transform ${
                    isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
                  }`}
                >
                  {asset.type === 'image' ? (
                    <img src={asset.url} alt={asset.name} className="w-full h-28 object-cover" />
                  ) : (
                    <video src={asset.url} className="w-full h-28 object-cover" />
                  )}
                  <div className="px-3 py-2">
                    <div className="text-[10px] text-zinc-500 truncate">{asset.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SpacesWorkspace: React.FC<SpacesWorkspaceProps> = ({ apiKey, googleApiKey, onOpenSettings }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const flowWrapperRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const clipboardRef = useRef<{ nodes: Array<Node<SpaceNodeData>>; edges: Edge[] } | null>(null);
  const pasteCountRef = useRef(0);

  const [nodes, setNodes, onNodesChange] = useNodesState<SpaceNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [spaces, setSpaces] = useState<SpaceRecord[]>([]);
  const [activeSpace, setActiveSpace] = useState<SpaceRecord | null>(null);
  const [spaceName, setSpaceName] = useState(DEFAULT_SPACE_NAME);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  );
  const selectedImageModel = selectedNode?.type === 'image' ? (selectedNode.data.model || 'google/nano-banana') : 'google/nano-banana';
  const selectedImageCaps = selectedNode?.type === 'image' ? getImageModelCapabilities(selectedImageModel) : { t2i: true, i2i: false };
  const selectedImageIsUpscale = selectedNode?.type === 'image' && selectedNode.data.model === 'grok-imagine/upscale';

  const [logs, setLogs] = useState<string[]>([]);
  const [outputPreview, setOutputPreview] = useState<SpaceNodeOutput | null>(null);
  const [outputsCollapsed, setOutputsCollapsed] = useState(true);
  const [compactMotionList, setCompactMotionList] = useState(false);

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetModalKind, setAssetModalKind] = useState<'image' | 'video'>('image');
  const [assetModalTarget, setAssetModalTarget] = useState<string | null>(null);

  const nodeTypes = useMemo(
    () => ({
      prompt: SpaceNodeCard,
      script: SpaceNodeCard,
      image: SpaceNodeCard,
      video: SpaceNodeCard,
      upload: SpaceNodeCard,
      camera: SpaceNodeCard,
      motion: SpaceNodeCard,
      angle: SpaceNodeCard,
    }),
    []
  );

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [`> ${message}`, ...prev].slice(0, 100));
  }, []);

  const markDirty = useCallback(() => setIsDirty(true), []);

  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const data = await fetchSpaces();
        setSpaces(data);
        if (data.length > 0) {
          loadSpace(data[0]);
        } else {
          const flow = buildDefaultFlow();
          setNodes(flow.nodes);
          setEdges(flow.edges);
          setActiveSpace(null);
          setSpaceName(DEFAULT_SPACE_NAME);
          setIsDirty(true);
        }
      } catch (error: any) {
        addLog(`Failed to load spaces: ${error.message}`);
      }
    };
    loadSpaces();
  }, []);

  useEffect(() => {
    if (selectedNode?.data?.output) {
      setOutputPreview(selectedNode.data.output);
    } else {
      setOutputPreview(null);
    }
  }, [selectedNode]);

  const loadSpace = (space: SpaceRecord) => {
    const flow = space.data || buildDefaultFlow();
    setNodes(flow.nodes || []);
    setEdges(flow.edges || []);
    if (flow.viewport && reactFlowInstance) {
      reactFlowInstance.setViewport(flow.viewport);
    }
    setActiveSpace(space);
    setSpaceName(space.name);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSelectedNodeIds([]);
    setIsDirty(false);
    addLog(`Loaded space: ${space.name}`);
  };

  const buildSpaceData = (): SpaceFlowData => {
    const flow = reactFlowInstance?.toObject();
    if (flow) {
      return {
        version: FLOW_VERSION,
        nodes: flow.nodes as Array<Node<SpaceNodeData>>,
        edges: flow.edges as Edge[],
        viewport: flow.viewport,
      };
    }
    return {
      version: FLOW_VERSION,
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };
  };

  const handleSave = async () => {
    if (!apiKey) {
      onOpenSettings();
      return;
    }
    setIsSaving(true);
    try {
      const data = buildSpaceData();
      if (activeSpace) {
        const updated = await updateSpace(activeSpace.id, { name: spaceName, data });
        setActiveSpace(updated);
        setSpaces((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        addLog('Space updated.');
      } else {
        const created = await createSpace(spaceName || DEFAULT_SPACE_NAME, data);
        setActiveSpace(created);
        setSpaces((prev) => [created, ...prev]);
        addLog('Space saved.');
      }
      setIsDirty(false);
    } catch (error: any) {
      addLog(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewSpace = () => {
    const flow = buildDefaultFlow();
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setActiveSpace(null);
    setSpaceName(DEFAULT_SPACE_NAME);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSelectedNodeIds([]);
    setIsDirty(true);
    addLog('New space created.');
  };

  const handleDeleteSpace = async () => {
    if (!activeSpace) return;
    try {
      await deleteSpace(activeSpace.id);
      setSpaces((prev) => prev.filter((space) => space.id !== activeSpace.id));
      addLog('Space deleted.');
      handleNewSpace();
    } catch (error: any) {
      addLog(`Delete failed: ${error.message}`);
    }
  };

  const updateNodeData = (nodeId: string, patch: Partial<SpaceNodeData>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...patch,
                updatedAt: Date.now(),
              },
            }
          : node
      )
    );
    markDirty();
  };

  const addNode = (type: SpaceNodeType) => {
    const bounds = flowWrapperRef.current?.getBoundingClientRect();
    const position = reactFlowInstance && bounds
      ? reactFlowInstance.project({
          x: bounds.width / 2 - 120,
          y: bounds.height / 2 - 40,
        })
      : { x: 180 + nodes.length * 30, y: 120 + nodes.length * 40 };

    const newNode: Node<SpaceNodeData> = {
      id: crypto.randomUUID(),
      type,
      position,
      data: defaultNodeData(type),
    };

    setNodes((prev) => [...prev, newNode]);
    markDirty();
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: false,
            style: { strokeWidth: 1.5, stroke: '#64748b' },
          },
          eds
        )
      );
      markDirty();
    },
    [setEdges, markDirty]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodeId(selectedNodes[0]?.id ?? null);
    setSelectedEdgeId(selectedEdges[0]?.id ?? null);
    setSelectedNodeIds(selectedNodes.map((node) => node.id));
  }, []);

  const cloneNodeDataForPaste = useCallback((node: Node<SpaceNodeData>) => {
    const data = JSON.parse(JSON.stringify(node.data)) as SpaceNodeData;
    const resetOutputTypes = ['prompt', 'script', 'image', 'video'];
    if (resetOutputTypes.includes(node.type || '')) {
      data.status = 'idle';
      data.output = undefined;
      data.error = undefined;
    }
    if (node.type === 'upload' && !data.assetUrl) {
      data.status = 'idle';
      data.output = undefined;
      data.error = undefined;
    }
    data.updatedAt = Date.now();
    return data;
  }, []);

  const copySelection = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    const selectedSet = new Set(selectedNodeIds);
    const nodesToCopy = nodes.filter((node) => selectedSet.has(node.id));
    if (nodesToCopy.length === 0) return;
    const edgesToCopy = edges.filter((edge) => selectedSet.has(edge.source) && selectedSet.has(edge.target));
    clipboardRef.current = { nodes: nodesToCopy, edges: edgesToCopy };
    pasteCountRef.current = 0;
    addLog(`Copied ${nodesToCopy.length} node(s).`);
  }, [addLog, edges, nodes, selectedNodeIds]);

  const pasteSelection = useCallback(() => {
    const clipboard = clipboardRef.current;
    if (!clipboard || clipboard.nodes.length === 0) return;
    pasteCountRef.current += 1;
    const offset = 40 * pasteCountRef.current;
    const idMap = new Map<string, string>();
    const newNodes = clipboard.nodes.map((node) => {
      const newId = crypto.randomUUID();
      idMap.set(node.id, newId);
      const data = cloneNodeDataForPaste(node);
      return {
        ...node,
        id: newId,
        position: { x: node.position.x + offset, y: node.position.y + offset },
        data,
        selected: true,
      };
    });
    const newEdges = clipboard.edges.map((edge) => ({
      ...edge,
      id: crypto.randomUUID(),
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
      selected: true,
    }));

    setNodes((prev) => prev.map((node) => ({ ...node, selected: false })).concat(newNodes));
    setEdges((prev) => prev.map((edge) => ({ ...edge, selected: false })).concat(newEdges));
    setSelectedNodeId(newNodes[0]?.id ?? null);
    setSelectedEdgeId(null);
    setSelectedNodeIds(newNodes.map((node) => node.id));
    markDirty();
    addLog(`Pasted ${newNodes.length} node(s).`);
  }, [addLog, cloneNodeDataForPaste, markDirty, setEdges, setNodes]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      return target.isContentEditable;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === 'c') {
        event.preventDefault();
        copySelection();
      }
      if (key === 'v') {
        event.preventDefault();
        pasteSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySelection, pasteSelection]);

  const getUpstreamNodes = (nodeId: string) => {
    const visited = new Set<string>();
    const result: Array<Node<SpaceNodeData>> = [];
    const queue: string[] = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift() as string;
      edges.forEach((edge) => {
        if (edge.target !== current) return;
        const sourceId = edge.source;
        if (visited.has(sourceId)) return;
        visited.add(sourceId);
        const node = nodes.find((item) => item.id === sourceId);
        if (node) {
          result.push(node);
          queue.push(sourceId);
        }
      });
    }

    return result;
  };

  const getPresetSnippet = (kind: 'camera' | 'motion' | 'angle', presetId?: string) => {
    if (kind === 'camera') {
      return cameraPresets.find((item) => item.id === presetId)?.snippet || cameraPresets[0].snippet;
    }
    if (kind === 'motion') {
      return motionPresets.find((item) => item.id === presetId)?.snippet || motionPresets[0].snippet;
    }
    return anglePresets.find((item) => item.id === presetId)?.snippet || anglePresets[0].snippet;
  };

  const isSupportedImageUrl = (url: string) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    const clean = url.split('?')[0].toLowerCase();
    return clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.webp');
  };

  const collectTextInputs = (nodeId: string) => {
    const items: Array<{ text: string; kind: string }> = [];
    const current = nodes.find((item) => item.id === nodeId);
    if (current?.data.prompt?.trim()) {
      items.push({ text: current.data.prompt.trim(), kind: 'prompt' });
    }

    const upstream = getUpstreamNodes(nodeId);
    upstream.forEach((node) => {
      if (node.type === 'prompt') {
        const text = node.data.output?.text || node.data.prompt || '';
        if (text.trim()) items.push({ text, kind: 'prompt' });
        return;
      }
      if (node.type === 'script') {
        const text = node.data.output?.text || '';
        if (text.trim()) items.push({ text, kind: 'script' });
        return;
      }
      if (node.type === 'camera') {
        const text = node.data.output?.text || getPresetSnippet('camera', node.data.presetId);
        if (text.trim()) items.push({ text, kind: 'camera_preset' });
        return;
      }
      if (node.type === 'motion') {
        const text = node.data.output?.text || getPresetSnippet('motion', node.data.presetId);
        if (text.trim()) items.push({ text, kind: 'motion_preset' });
        return;
      }
      if (node.type === 'angle') {
        const text = node.data.output?.text || getPresetSnippet('angle', node.data.presetId);
        if (text.trim()) items.push({ text, kind: 'angle_preset' });
        return;
      }
    });

    return items;
  };

  const resolveTextInput = (nodeId: string) => {
    const inputs = collectTextInputs(nodeId).filter(
      (item) => item.kind !== 'camera_preset' && item.kind !== 'motion_preset' && item.kind !== 'angle_preset'
    );
    return inputs.map((item) => item.text).filter(Boolean).join('\n\n');
  };

  const resolveReferenceImages = (nodeId: string) => {
    const upstream = getUpstreamNodes(nodeId);
    const urls: string[] = [];

    upstream.forEach((node) => {
      if (node.type === 'upload' && node.data.assetUrl && node.data.assetType === 'image') {
        urls.push(node.data.assetUrl);
        return;
      }
      if (node.data.output?.contentType === 'image' && node.data.output.url) {
        urls.push(node.data.output.url);
      }
    });

    return Array.from(new Set(urls));
  };

  const resolveUpstreamTaskId = (nodeId: string) => {
    const upstream = getUpstreamNodes(nodeId);
    const candidates = upstream
      .map((node) => {
        const metadata = node.data.output?.metadata as { taskId?: string; model?: string } | undefined;
        return {
          taskId: metadata?.taskId,
          model: metadata?.model,
        };
      })
      .filter((item) => typeof item.taskId === 'string' && item.taskId);

    const grokCandidate = candidates.find((item) => (item.model || '').startsWith('grok-imagine/'));
    return (grokCandidate?.taskId || '') as string;
  };

  const normalizeReferenceImages = async (urls: string[]) => {
    const normalized: string[] = [];
    for (const url of urls) {
      if (isSupportedImageUrl(url)) {
        normalized.push(url);
        continue;
      }
      try {
        const uploaded = await uploadOutputUrlToSupabase(url, 'image');
        normalized.push(uploaded);
      } catch (error: any) {
        addLog(`Reference image not supported, skip: ${error.message}`);
      }
    }
    return Array.from(new Set(normalized));
  };

  const resolveUploadReferences = (nodeId: string) => {
    const upstream = getUpstreamNodes(nodeId);
    const uploadNodes = upstream
      .filter((node) => node.type === 'upload')
      .filter((node) => !!node.data.assetUrl);

    const subjectUrls: string[] = [];
    const objectUrls: string[] = [];

    uploadNodes.forEach((node) => {
      const role = node.data.assetRole || 'auto';
      const url = node.data.assetUrl as string;
      if (role === 'subject') {
        subjectUrls.push(url);
      } else if (role === 'object') {
        objectUrls.push(url);
      } else if (subjectUrls.length === 0) {
        subjectUrls.push(url);
      } else {
        objectUrls.push(url);
      }
    });

    return { subjectUrls, objectUrls };
  };

  const resolveVideoFrames = (nodeId: string) => {
    const upstream = getUpstreamNodes(nodeId);
    const frames: Array<{ url: string; role: 'start' | 'end' | 'none' }> = [];

    upstream.forEach((node) => {
      if (node.type === 'upload' && node.data.assetUrl && node.data.assetType === 'image') {
        frames.push({ url: node.data.assetUrl, role: node.data.videoFrameRole || 'none' });
        return;
      }
      if (node.data.output?.contentType === 'image' && node.data.output.url) {
        frames.push({ url: node.data.output.url, role: node.data.videoFrameRole || 'none' });
      }
    });

    const uniqueFrames = Array.from(new Map(frames.map((frame) => [frame.url, frame])).values());
    const start = uniqueFrames.find((frame) => frame.role === 'start');
    const end = uniqueFrames.find((frame) => frame.role === 'end');
    const remaining = uniqueFrames.filter((frame) => frame.role === 'none');

    return {
      list: uniqueFrames.map((frame) => frame.url),
      start: start?.url || remaining[0]?.url || uniqueFrames[0]?.url,
      end: end?.url || remaining[1]?.url || uniqueFrames[1]?.url || remaining[0]?.url || uniqueFrames[0]?.url,
    };
  };

  const buildIdentityLockText = (subjectUrls: string[], objectUrls: string[]) => {
    const lines: string[] = [];
    if (subjectUrls.length > 0) {
      lines.push(
        'Use the SAME person from the reference image. Preserve facial identity, age, skin tone, hairstyle, and body proportions.'
      );
    }
    if (objectUrls.length > 0) {
      lines.push(
        'Use the SAME object(s) from the reference image. Preserve shape, color, logo/branding, and material details.'
      );
    }
    return lines.join('\n');
  };

  const buildImagePrompt = (nodeId: string, includeIdentity: boolean) => {
    const textInputs = collectTextInputs(nodeId);
    const coreTexts = textInputs
      .filter((item) => item.kind !== 'camera_preset' && item.kind !== 'motion_preset' && item.kind !== 'angle_preset')
      .map((item) => item.text)
      .filter(Boolean);
    const presetTexts = textInputs
      .filter((item) => item.kind === 'camera_preset' || item.kind === 'angle_preset')
      .map((item) => item.text)
      .filter(Boolean);
    const { subjectUrls, objectUrls } = resolveUploadReferences(nodeId);
    const identityText = includeIdentity ? buildIdentityLockText(subjectUrls, objectUrls) : '';
    return [coreTexts.join('\n\n'), identityText, presetTexts.join('\n\n')].filter(Boolean).join('\n\n');
  };

  const buildVideoPrompt = (nodeId: string) => {
    const textInputs = collectTextInputs(nodeId);
    const coreTexts = textInputs
      .filter((item) => item.kind !== 'camera_preset' && item.kind !== 'motion_preset' && item.kind !== 'angle_preset')
      .map((item) => item.text)
      .filter(Boolean);
    const motionText = textInputs.filter((item) => item.kind === 'motion_preset').map((item) => item.text);
    const angleText = textInputs.filter((item) => item.kind === 'angle_preset').map((item) => item.text);
    return [coreTexts.join('\n\n'), motionText.join('\n\n'), angleText.join('\n\n')].filter(Boolean).join('\n\n');
  };

  const normalizeAspectRatio = (value?: string) => value || '1:1';

  const mapQwenImageSize = (ratio: string): QwenTextToImageInput['image_size'] => {
    switch (ratio) {
      case '9:16':
        return 'portrait_16_9';
      case '3:4':
      case '2:3':
        return 'portrait_4_3';
      case '16:9':
        return 'landscape_16_9';
      case '4:3':
      case '3:2':
        return 'landscape_4_3';
      default:
        return 'square_hd';
    }
  };

  const mapZImageAspect = (ratio: string): ZImageInput['aspect_ratio'] => {
    const allowed: ZImageInput['aspect_ratio'][] = ['1:1', '4:3', '3:4', '16:9', '9:16'];
    if (allowed.includes(ratio as ZImageInput['aspect_ratio'])) {
      return ratio as ZImageInput['aspect_ratio'];
    }
    return ratio.startsWith('2:') || ratio === '3:4' ? '3:4' : '4:3';
  };

  const mapFluxAspect = (ratio: string): Flux2ProTextInput['aspect_ratio'] => {
    const allowed: Flux2ProTextInput['aspect_ratio'][] = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', 'auto'];
    if (allowed.includes(ratio as Flux2ProTextInput['aspect_ratio'])) {
      return ratio as Flux2ProTextInput['aspect_ratio'];
    }
    return ratio.startsWith('2:') ? '2:3' : '3:2';
  };

  const mapGrokAspect = (ratio: string): GrokTextToImageInput['aspect_ratio'] => {
    const allowed: GrokTextToImageInput['aspect_ratio'][] = ['2:3', '3:2', '1:1', '9:16', '16:9'];
    if (allowed.includes(ratio as GrokTextToImageInput['aspect_ratio'])) {
      return ratio as GrokTextToImageInput['aspect_ratio'];
    }
    if (ratio === '4:3') return '3:2';
    if (ratio === '3:4') return '2:3';
    return '1:1';
  };

  const isGrokUpscaleModel = (model?: string) => model === 'grok-imagine/upscale';

  function getImageModelCapabilities(model: string) {
    switch (model) {
      case 'google/nano-banana':
        return { t2i: true, i2i: true };
      case 'grok-imagine/image-to-image':
        return { t2i: false, i2i: true };
      case 'grok-imagine/upscale':
        return { t2i: false, i2i: false };
      default:
        return { t2i: true, i2i: false };
    }
  }

  const extractResultUrl = (resultJson: any, data: any): string => {
    if (data?.imageUrl) return data.imageUrl;
    if (data?.image_url) return data.image_url;
    if (data?.videoUrl) return data.videoUrl;
    if (data?.video_url) return data.video_url;
    if (data?.url) return data.url;
    if (data?.output) {
      if (typeof data.output === 'string') return data.output;
      if (Array.isArray(data.output) && data.output[0]) return data.output[0];
    }

    let parsed = resultJson;
    if (typeof resultJson === 'string') {
      try {
        parsed = JSON.parse(resultJson);
      } catch (err) {
        if (resultJson.startsWith('http')) return resultJson;
      }
    }

    if (!parsed) return '';
    if (parsed.resultUrls?.[0]) return parsed.resultUrls[0];
    if (parsed.images?.[0]?.url) return parsed.images[0].url;
    if (parsed.image?.url) return parsed.image.url;
    if (parsed.output?.[0]) return parsed.output[0];
    if (parsed.url) return parsed.url;
    if (parsed.data?.url) return parsed.data.url;
    if (parsed.data?.images?.[0]?.url) return parsed.data.images[0].url;
    if (parsed.video?.url) return parsed.video.url;
    if (parsed.video_url) return parsed.video_url;
    if (typeof parsed === 'string' && parsed.startsWith('http')) return parsed;
    return '';
  };

  const queryVeoTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/proxy/veo/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (!response.ok) return null;
      return response.json();
    } catch (_error) {
      return null;
    }
  };

  const pollTaskForResult = async (taskId: string, provider: 'jobs' | 'veo' = 'jobs') => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const result = provider === 'veo' ? await queryVeoTask(taskId) : await queryTask(apiKey, taskId);
      const data = result?.data;
      if (!data) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

      const state = data.state || data.status;
      if (state === 'success') {
        const url = extractResultUrl(data.resultJson || data.result, data);
        if (!url) {
          throw new Error('Task succeeded but no output URL found.');
        }
        return url;
      }
      if (state === 'fail' || state === 'failed' || state === 'error') {
        throw new Error(data.failMsg || data.errorMsg || 'Generation failed.');
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    throw new Error('Task timed out.');
  };

  const runNode = async (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;

    updateNodeData(nodeId, { status: 'running', error: undefined });
    addLog(`Running ${node.data.label}...`);

    try {
      if (node.type === 'prompt') {
        const text = node.data.prompt?.trim() || '';
        updateNodeData(nodeId, {
          status: 'success',
          output: { contentType: 'text', text, metadata: { kind: 'prompt' } },
        });
        return;
      }

      if (node.type === 'script') {
        if (!googleApiKey) {
          throw new Error('Gemini API key missing.');
        }
        const prompt = resolveTextInput(nodeId);
        if (!prompt) {
          throw new Error('Prompt is required for script generation.');
        }
        const text = await generateTextWithGemini(prompt, { apiKey: googleApiKey });
        updateNodeData(nodeId, {
          status: 'success',
          output: { contentType: 'text', text, metadata: { kind: 'script' } },
        });
        return;
      }

      if (node.type === 'upload') {
        if (!node.data.assetUrl) {
          throw new Error('Upload an asset first.');
        }
        const contentType = node.data.assetType === 'video' ? 'video' : 'image';
        updateNodeData(nodeId, {
          status: 'success',
          output: { contentType, url: node.data.assetUrl },
        });
        return;
      }

      if (node.type === 'camera') {
        const preset = cameraPresets.find((item) => item.id === node.data.presetId) || cameraPresets[0];
        updateNodeData(nodeId, {
          status: 'success',
          output: { contentType: 'text', text: preset.snippet, metadata: { kind: 'camera_preset' } },
        });
        return;
      }

      if (node.type === 'motion') {
        const preset = motionPresets.find((item) => item.id === node.data.presetId) || motionPresets[0];
        updateNodeData(nodeId, {
          status: 'success',
          output: { contentType: 'text', text: preset.snippet, metadata: { kind: 'motion_preset' } },
        });
        return;
      }

      if (node.type === 'angle') {
        const preset = anglePresets.find((item) => item.id === node.data.presetId) || anglePresets[0];
        updateNodeData(nodeId, {
          status: 'success',
          output: { contentType: 'text', text: preset.snippet, metadata: { kind: 'angle_preset' } },
        });
        return;
      }

      if (node.type === 'image') {
        const selectedModel = node.data.model || 'google/nano-banana';
        const baseModel = selectedModel === 'google/nano-banana-edit' ? 'google/nano-banana' : selectedModel;

        if (baseModel === 'grok-imagine/upscale') {
          const manualTaskId = (node.data.taskId || '').trim();
          const upstreamTaskId = manualTaskId ? '' : resolveUpstreamTaskId(nodeId);
          const sourceTaskId = manualTaskId || upstreamTaskId;
          if (!sourceTaskId) {
            throw new Error('Grok Upscale requires a task_id from a Grok image task.');
          }
          addLog(`Grok Upscale: using task ${sourceTaskId.slice(-6)}`);
          const payload: GrokUpscaleInput = { task_id: sourceTaskId };
          const response = await createTask(apiKey, 'grok-imagine/upscale', payload);
          if (!response || response.code !== 200 || !response.data?.taskId) {
            throw new Error(response?.msg || 'Task creation failed.');
          }
          const upscaleTaskId = response.data.taskId;
          const resultUrl = await pollTaskForResult(upscaleTaskId, 'jobs');
          let storedUrl = resultUrl;
          try {
            storedUrl = await uploadOutputUrlToSupabase(resultUrl, 'image');
          } catch (error: any) {
            addLog(`Supabase upload failed, using source URL. ${error.message}`);
          }
          updateNodeData(nodeId, {
            status: 'success',
            output: {
              contentType: 'image',
              url: storedUrl,
              metadata: { sourceUrl: resultUrl, taskId: upscaleTaskId, model: 'grok-imagine/upscale', sourceTaskId },
            },
          });
          return;
        }

        const incomingImages = resolveReferenceImages(nodeId);
        const { subjectUrls, objectUrls } = resolveUploadReferences(nodeId);
        const orderedReferenceImages = Array.from(new Set([...subjectUrls, ...objectUrls, ...incomingImages]));
        const normalizedReferenceImages = await normalizeReferenceImages(orderedReferenceImages);
        const hasReferences = normalizedReferenceImages.length > 0;
        const imageMode = node.data.imageMode || 'auto';
        const caps = getImageModelCapabilities(baseModel);

        if (!caps.i2i && imageMode === 'i2i') {
          throw new Error('Selected model does not support Image→Image.');
        }
        if (!caps.t2i && imageMode === 't2i') {
          throw new Error('Selected model does not support Text→Image.');
        }
        if (caps.i2i && !caps.t2i && !hasReferences) {
          throw new Error('Image→Image requires at least one reference image.');
        }
        if (imageMode === 'i2i' && !hasReferences) {
          throw new Error('Force Image→Image requires at least one reference image.');
        }
        if (imageMode === 't2i' && hasReferences) {
          addLog('References ignored (Force Text→Image).');
        }
        if (imageMode === 'auto' && hasReferences && !caps.i2i) {
          addLog('Reference images detected but selected model is text-only. Using Text→Image.');
        }

        const useReferences =
          (caps.i2i && !caps.t2i) ||
          (caps.i2i && (imageMode === 'i2i' || (imageMode === 'auto' && hasReferences)));
        const prompt = buildImagePrompt(nodeId, useReferences);
        if (!prompt) {
          throw new Error('Prompt is required for image generation.');
        }

        const aspectRatio = normalizeAspectRatio(node.data.aspectRatio);
        let model = baseModel;
        let payload: NanoBananaGenInput | NanoBananaEditInput | QwenTextToImageInput | ZImageInput | Flux2ProTextInput | Flux2FlexTextInput | GrokTextToImageInput | GrokImageToImageInput;

        if (baseModel === 'google/nano-banana') {
          const imageSize = (aspectRatio as NanoBananaGenInput['image_size']) || '1:1';
          if (useReferences) {
            model = 'google/nano-banana-edit';
            payload = {
              prompt,
              image_urls: normalizedReferenceImages.slice(0, 4),
              output_format: 'png',
              image_size: imageSize,
            };
          } else {
            model = 'google/nano-banana';
            payload = {
              prompt,
              output_format: 'png',
              image_size: imageSize,
            };
          }
        } else if (baseModel === 'qwen/text-to-image') {
          payload = {
            prompt,
            image_size: mapQwenImageSize(aspectRatio),
            output_format: 'png',
          };
        } else if (baseModel === 'z-image') {
          payload = {
            prompt,
            aspect_ratio: mapZImageAspect(aspectRatio),
          };
        } else if (baseModel === 'flux-2/pro-text-to-image' || baseModel === 'flux-2/flex-text-to-image') {
          payload = {
            prompt,
            aspect_ratio: mapFluxAspect(aspectRatio),
            resolution: '1K',
          };
        } else if (baseModel === 'grok-imagine/text-to-image') {
          payload = {
            prompt,
            aspect_ratio: mapGrokAspect(aspectRatio),
          };
        } else if (baseModel === 'grok-imagine/image-to-image') {
          if (!hasReferences) {
            throw new Error('Grok Image→Image requires a reference image.');
          }
          if (normalizedReferenceImages.length > 1) {
            addLog('Grok Image→Image supports one image. Using the first reference.');
          }
          payload = {
            prompt,
            image_urls: normalizedReferenceImages.slice(0, 1),
          };
        } else {
          model = 'google/nano-banana';
          payload = {
            prompt,
            output_format: 'png',
            image_size: (aspectRatio as NanoBananaGenInput['image_size']) || '1:1',
          };
        }

        if (useReferences) {
          addLog(`Image references: ${normalizedReferenceImages.length}`);
        }
        addLog(`Image model: ${model}`);
        const response = await createTask(apiKey, model, payload);
        if (!response || response.code !== 200 || !response.data?.taskId) {
          throw new Error(response?.msg || 'Task creation failed.');
        }
        const taskId = response.data.taskId;
        const resultUrl = await pollTaskForResult(taskId, 'jobs');
        let storedUrl = resultUrl;
        try {
          storedUrl = await uploadOutputUrlToSupabase(resultUrl, 'image');
        } catch (error: any) {
          addLog(`Supabase upload failed, using source URL. ${error.message}`);
        }

        updateNodeData(nodeId, {
          status: 'success',
          output: {
            contentType: 'image',
            url: storedUrl,
            metadata: { sourceUrl: resultUrl, taskId, model },
          },
        });
        return;
      }

      if (node.type === 'video') {
        const prompt = buildVideoPrompt(nodeId);
        if (!prompt) {
          throw new Error('Prompt is required for video generation.');
        }

        const frameInfo = resolveVideoFrames(nodeId);
        const images = frameInfo.list;
        let taskId = '';
        if (node.data.model?.startsWith('veo3')) {
          let input: Veo3Input;
          const videoMode = node.data.videoMode || 'auto';
          const hasImages = images.length > 0;
          const shouldUseImage =
            videoMode === 'i2v-single' ||
            videoMode === 'i2v-reference' ||
            (videoMode === 'auto' && hasImages);
          const shouldUseTwo =
            videoMode === 'i2v-reference' ||
            (videoMode === 'auto' && images.length > 1);

          if (videoMode === 't2v' || !shouldUseImage) {
            const textInput: Veo3TextToVideoInput = {
              prompt,
              generationType: 'TEXT_2_VIDEO',
              aspect_ratio: (node.data.aspectRatio as Veo3TextToVideoInput['aspect_ratio']) || '16:9',
              model: node.data.model as Veo3TextToVideoInput['model'],
            };
            input = textInput;
          } else {
            const urlList = shouldUseTwo
              ? [frameInfo.start, frameInfo.end].filter(Boolean)
              : [frameInfo.start].filter(Boolean);
            if (urlList.length === 0) {
              throw new Error('Image→Video requires at least one frame.');
            }
            const imageInput: Veo3ImageToVideoInput = {
              prompt,
              imageUrls: urlList as string[],
              generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
              aspect_ratio: (node.data.aspectRatio as Veo3ImageToVideoInput['aspect_ratio']) || '16:9',
              model: node.data.model as Veo3ImageToVideoInput['model'],
            };
            input = imageInput;
          }
          const response = await generateVeo3Video(input);
          if (!response || response.code !== 200 || !response.data?.taskId) {
            throw new Error(response?.msg || 'Task creation failed.');
          }
          taskId = response.data?.taskId || '';
        } else if (node.data.model === 'grok-imagine/image-to-video') {
          const videoMode = node.data.videoMode || 'auto';
          if (videoMode === 't2v') {
            throw new Error('Grok Image→Video requires a reference image.');
          }
          if (!frameInfo.start) {
            throw new Error('Grok Image→Video requires at least one image.');
          }
          if (videoMode === 'i2v-reference' && frameInfo.end && frameInfo.end !== frameInfo.start) {
            addLog('Grok supports single reference image. Using start frame only.');
          }
          const response = await createTask(apiKey, 'grok-imagine/image-to-video', {
            image_urls: [frameInfo.start],
            prompt,
            mode: 'normal',
          });
          if (!response || response.code !== 200 || !response.data?.taskId) {
            throw new Error(response?.msg || 'Task creation failed.');
          }
          taskId = response.data.taskId;
        } else {
          const videoMode = node.data.videoMode || 'auto';
          const useImages = (videoMode === 'i2v-single' || videoMode === 'i2v-reference' || (videoMode === 'auto' && frameInfo.start));
          if (useImages && frameInfo.start) {
            const aspect = node.data.aspectRatio === '9:16' ? 'portrait' : 'landscape';
            const response = await createTask(apiKey, 'sora-2-image-to-video', {
              prompt,
              image_urls: [frameInfo.start],
              aspect_ratio: aspect,
            });
            if (!response || response.code !== 200 || !response.data?.taskId) {
              throw new Error(response?.msg || 'Task creation failed.');
            }
            taskId = response.data.taskId;
          } else {
            const response = await createTask(apiKey, 'sora-2-text-to-video', {
              prompt,
            });
            if (!response || response.code !== 200 || !response.data?.taskId) {
              throw new Error(response?.msg || 'Task creation failed.');
            }
            taskId = response.data.taskId;
          }
        }

        if (!taskId) {
          throw new Error('Failed to create video task.');
        }

        const resultUrl = await pollTaskForResult(taskId, node.data.model?.startsWith('veo3') ? 'veo' : 'jobs');
        let storedUrl = resultUrl;
        try {
          storedUrl = await uploadOutputUrlToSupabase(resultUrl, 'video');
        } catch (error: any) {
          addLog(`Supabase upload failed, using source URL. ${error.message}`);
        }

        updateNodeData(nodeId, {
          status: 'success',
          output: {
            contentType: 'video',
            url: storedUrl,
            metadata: { sourceUrl: resultUrl, taskId, model: node.data.model },
          },
        });
        return;
      }
    } catch (error: any) {
      updateNodeData(nodeId, { status: 'error', error: error.message || 'Failed' });
      addLog(`${node.data.label} failed: ${error.message}`);
    }
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
    markDirty();
  };

  const disconnectNode = (nodeId: string) => {
    setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedEdgeId(null);
    markDirty();
  };

  const cutSelectedEdge = () => {
    if (!selectedEdgeId) return;
    setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    markDirty();
  };

  const handleAssetSelect = (asset: SupabaseAsset) => {
    if (!assetModalTarget) return;
    updateNodeData(assetModalTarget, {
      assetUrl: asset.url,
      assetName: asset.name,
      assetType: asset.type,
      assetSource: 'supabase',
      output: { contentType: asset.type, url: asset.url },
      status: 'success',
      error: undefined,
    });
    setAssetModalOpen(false);
  };

  const handleUploadFile = async (nodeId: string, file: File) => {
    try {
      updateNodeData(nodeId, { status: 'running', error: undefined });
      const isVideo = file.type.startsWith('video');
      const url = isVideo
        ? await uploadVideoToKieAI(file, apiKey)
        : await uploadImageToKieAI(file, apiKey);

      updateNodeData(nodeId, {
        assetUrl: url,
        assetName: file.name,
        assetType: isVideo ? 'video' : 'image',
        assetSource: 'local',
        output: { contentType: isVideo ? 'video' : 'image', url },
        status: 'success',
      });
      addLog('Asset uploaded to Supabase.');
    } catch (error: any) {
      updateNodeData(nodeId, { status: 'error', error: error.message });
      addLog(`Upload failed: ${error.message}`);
    }
  };

  if (!apiKey) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-sm text-zinc-400">API Key required for Spaces.</div>
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm"
          >
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
      <AssetLibraryModal
        isOpen={assetModalOpen}
        kind={assetModalKind}
        onClose={() => setAssetModalOpen(false)}
        onSelect={handleAssetSelect}
      />

      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-white/80'}`}>
        <div className="flex items-center gap-3">
          <input
            value={spaceName}
            onChange={(e) => {
              setSpaceName(e.target.value);
              markDirty();
            }}
            className={`px-3 py-2 rounded-lg text-sm border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
            }`}
          />
          <select
            value={activeSpace?.id || ''}
            onChange={(e) => {
              const selected = spaces.find((item) => item.id === e.target.value);
              if (selected) loadSpace(selected);
            }}
            className={`px-3 py-2 rounded-lg text-xs border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
            }`}
          >
            <option value="">Unsaved</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
          {isDirty && <span className="text-[10px] text-amber-400 font-mono">Unsaved</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewSpace}
            className={`px-3 py-2 rounded-lg text-xs border ${
              isDark ? 'border-zinc-700 text-zinc-200' : 'border-zinc-200 text-zinc-700'
            }`}
          >
            New
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-2 rounded-lg text-xs bg-emerald-500 text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {activeSpace && (
            <button
              onClick={handleDeleteSpace}
              className={`px-3 py-2 rounded-lg text-xs border ${
                isDark ? 'border-red-500/40 text-red-300' : 'border-red-200 text-red-600'
              }`}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-2 text-xs text-amber-400">{statusMessage}</div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className={`w-56 border-r ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'}`}>
          <div className="px-4 py-4 space-y-3">
            <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Nodes</h4>
            {(['prompt', 'script', 'image', 'video', 'upload', 'camera', 'motion', 'angle'] as SpaceNodeType[]).map((type) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[11px] border ${
                  isDark ? 'border-zinc-800 text-zinc-200 hover:bg-zinc-900' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                + {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 relative" ref={flowWrapperRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              markDirty();
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              markDirty();
            }}
            onNodesDelete={() => {
              markDirty();
              setSelectedNodeId(null);
              setSelectedNodeIds([]);
            }}
            onEdgesDelete={() => {
              markDirty();
              setSelectedEdgeId(null);
            }}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            onSelectionChange={onSelectionChange}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
              setSelectedNodeIds([]);
            }}
            deleteKeyCode={['Backspace', 'Delete']}
            defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 1.5, stroke: '#64748b' } }}
            connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
            fitView
            className={isDark ? 'bg-zinc-900/60' : 'bg-zinc-50'}
          >
            <Background gap={24} size={1} color={isDark ? '#1f2937' : '#e5e7eb'} />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'prompt':
                    return '#f59e0b';
                  case 'script':
                    return '#10b981';
                  case 'image':
                    return '#d946ef';
                  case 'video':
                    return '#22d3ee';
                  case 'upload':
                    return '#3b82f6';
                  default:
                    return '#6b7280';
                }
              }}
              className="!bg-zinc-900/70"
            />
            <Controls />
          </ReactFlow>
        </div>

        <div className={`w-80 border-l ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'}`}>
          <div className="px-4 py-4 space-y-4 overflow-y-auto h-full">
            <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Inspector</h4>
            {!selectedNode && (
              <div className="text-xs text-zinc-500">Select a node to edit.</div>
            )}

            {!selectedNode && selectedEdge && (
              <div className="space-y-3">
                <div className="text-xs text-zinc-400">Edge selected</div>
                <button
                  onClick={cutSelectedEdge}
                  className="px-3 py-2 rounded-lg text-xs border border-amber-500/40 text-amber-300"
                >
                  Cut Connection
                </button>
              </div>
            )}

            {selectedNode && (
              <div className="space-y-3">
                <div className="text-xs text-zinc-400">Type: {selectedNode.type}</div>

                <input
                  value={selectedNode.data.title || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { title: e.target.value })}
                  placeholder="Node title"
                  className={`w-full px-3 py-2 rounded-lg text-xs border ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                  }`}
                />

                {(selectedNode.type === 'prompt' ||
                  selectedNode.type === 'script' ||
                  selectedNode.type === 'video' ||
                  (selectedNode.type === 'image' && !selectedImageIsUpscale)) && (
                  <textarea
                    value={selectedNode.data.prompt || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                    rows={5}
                    placeholder="Write your prompt..."
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                    }`}
                  />
                )}

                {selectedNode.type === 'image' && (
                  <>
                    {!selectedImageIsUpscale && (
                      <div className="flex gap-2">
                        {(['auto', 't2i', 'i2i'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => updateNodeData(selectedNode.id, { imageMode: mode })}
                            className={`flex-1 px-2 py-2 rounded-lg text-[10px] border ${
                              selectedNode.data.imageMode === mode
                                ? 'border-emerald-500/60 text-emerald-200'
                                : isDark
                                ? 'border-zinc-800 text-zinc-400'
                                : 'border-zinc-200 text-zinc-600'
                            }`}
                          >
                            {mode === 'auto' ? 'Auto' : mode === 't2i' ? 'Force T2I' : 'Force I2I'}
                          </button>
                        ))}
                      </div>
                    )}
                    <select
                      value={selectedNode.data.model || 'google/nano-banana'}
                      onChange={(e) => {
                        const nextModel = e.target.value;
                        const patch: Partial<SpaceNodeData> = { model: nextModel };
                        if (isGrokUpscaleModel(nextModel)) {
                          patch.imageMode = 'auto';
                        } else {
                          const nextCaps = getImageModelCapabilities(nextModel);
                          if (!nextCaps.i2i && selectedNode.data.imageMode === 'i2i') {
                            patch.imageMode = 't2i';
                          }
                          if (!nextCaps.t2i && selectedNode.data.imageMode === 't2i') {
                            patch.imageMode = 'i2i';
                          }
                          if (nextCaps.i2i && !nextCaps.t2i) {
                            patch.imageMode = 'i2i';
                          }
                        }
                        updateNodeData(selectedNode.id, patch);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <option value="google/nano-banana">Nano Banana (T2I/I2I)</option>
                      <option value="qwen/text-to-image">Qwen Text→Image</option>
                      <option value="z-image">Z-Image Text→Image</option>
                      <option value="flux-2/pro-text-to-image">Flux 2 Pro Text→Image</option>
                      <option value="flux-2/flex-text-to-image">Flux 2 Flex Text→Image</option>
                      <option value="grok-imagine/image-to-image">Grok Imagine Image→Image</option>
                      <option value="grok-imagine/text-to-image">Grok Imagine Text→Image</option>
                      <option value="grok-imagine/upscale">Grok Imagine Upscale</option>
                    </select>
                    {selectedImageIsUpscale && (
                      <div>
                        <label className={`block text-[10px] font-mono mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          GROK TASK ID
                        </label>
                        <input
                          value={selectedNode.data.taskId || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, { taskId: e.target.value })}
                          placeholder="Paste Grok task_id"
                          className={`w-full px-3 py-2 rounded-lg text-xs border ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                          }`}
                        />
                        <div className="text-[10px] text-zinc-500 mt-1">
                          If empty, uses the closest upstream Grok task_id.
                        </div>
                      </div>
                    )}
                    {!selectedImageIsUpscale && (
                      <select
                        value={selectedNode.data.aspectRatio || '1:1'}
                        onChange={(e) => updateNodeData(selectedNode.id, { aspectRatio: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg text-xs border ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <option value="1:1">1:1</option>
                        <option value="9:16">9:16</option>
                        <option value="16:9">16:9</option>
                        <option value="3:4">3:4</option>
                        <option value="4:3">4:3</option>
                        <option value="2:3">2:3</option>
                        <option value="3:2">3:2</option>
                      </select>
                    )}
                    <div className="text-[10px] text-zinc-500">
                      {selectedImageIsUpscale
                        ? 'Upscale uses Grok task_id. Provide one or connect a Grok image node.'
                        : selectedNode.data.imageMode === 't2i'
                        ? selectedImageCaps.t2i
                          ? 'Forced Text→Image mode.'
                          : 'Selected model does not support Text→Image.'
                        : selectedNode.data.imageMode === 'i2i'
                        ? selectedImageCaps.i2i
                          ? 'Forced Image→Image mode.'
                          : 'Selected model does not support Image→Image.'
                        : selectedImageCaps.i2i && resolveReferenceImages(selectedNode.id).length > 0
                        ? 'Reference images detected — running Image→Image.'
                        : selectedImageCaps.i2i && !selectedImageCaps.t2i
                        ? 'Model requires a reference image.'
                        : 'Text-only mode.'}
                    </div>
                    <select
                      value={selectedNode.data.videoFrameRole || 'none'}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          videoFrameRole: e.target.value as 'none' | 'start' | 'end',
                        })
                      }
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <option value="none">Video Frame: None</option>
                      <option value="start">Video Frame: Start</option>
                      <option value="end">Video Frame: End</option>
                    </select>
                  </>
                )}

                {selectedNode.type === 'video' && (
                  <>
                    <div className="flex gap-2">
                      {(['auto', 't2v', 'i2v-single', 'i2v-reference'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updateNodeData(selectedNode.id, { videoMode: mode })}
                          className={`flex-1 px-2 py-2 rounded-lg text-[10px] border ${
                            selectedNode.data.videoMode === mode
                              ? 'border-emerald-500/60 text-emerald-200'
                              : isDark
                              ? 'border-zinc-800 text-zinc-400'
                              : 'border-zinc-200 text-zinc-600'
                          }`}
                        >
                          {mode === 'auto'
                            ? 'Auto'
                            : mode === 't2v'
                            ? 'Text→Video'
                            : mode === 'i2v-single'
                            ? 'I2V Single'
                            : 'I2V Ref (2)'}
                        </button>
                      ))}
                    </div>
                    <select
                      value={selectedNode.data.model || 'veo3_fast'}
                      onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <option value="veo3_fast">Veo3 Fast</option>
                      <option value="veo3">Veo3 Quality</option>
                      <option value="sora-2-text-to-video">Sora2 Text-to-Video</option>
                      <option value="grok-imagine/image-to-video">Grok Image→Video</option>
                    </select>
                    <select
                      value={selectedNode.data.aspectRatio || '16:9'}
                      onChange={(e) => updateNodeData(selectedNode.id, { aspectRatio: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                      <option value="Auto">Auto</option>
                    </select>
                    <div className="text-[10px] text-zinc-500">
                      {selectedNode.data.videoMode === 't2v'
                        ? 'Forced Text→Video.'
                        : selectedNode.data.videoMode === 'i2v-single'
                        ? 'Forced Image→Video (single frame).'
                        : selectedNode.data.videoMode === 'i2v-reference'
                        ? 'Forced Image→Video (start + end).'
                        : 'Auto: uses images if connected, otherwise text.'}
                    </div>
                  </>
                )}

                {selectedNode.type === 'upload' && (
                  <>
                    <select
                      value={selectedNode.data.assetType || 'image'}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { assetType: e.target.value as 'image' | 'video' })
                      }
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                    <select
                      value={selectedNode.data.assetRole || 'auto'}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { assetRole: e.target.value as 'auto' | 'subject' | 'object' })
                      }
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <option value="auto">Role: Auto</option>
                      <option value="subject">Role: Subject</option>
                      <option value="object">Role: Object</option>
                    </select>
                    {selectedNode.data.assetType === 'image' && (
                      <select
                        value={selectedNode.data.videoFrameRole || 'none'}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            videoFrameRole: e.target.value as 'none' | 'start' | 'end',
                          })
                        }
                        className={`w-full px-3 py-2 rounded-lg text-xs border ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <option value="none">Video Frame: None</option>
                        <option value="start">Video Frame: Start</option>
                        <option value="end">Video Frame: End</option>
                      </select>
                    )}
                    <input
                      type="file"
                      accept={selectedNode.data.assetType === 'video' ? 'video/*' : 'image/*'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadFile(selectedNode.id, file);
                      }}
                      className="text-xs"
                    />
                    <button
                      onClick={() => {
                        setAssetModalKind(selectedNode.data.assetType === 'video' ? 'video' : 'image');
                        setAssetModalTarget(selectedNode.id);
                        setAssetModalOpen(true);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs border ${
                        isDark ? 'border-zinc-700 text-zinc-200' : 'border-zinc-200 text-zinc-700'
                      }`}
                    >
                      Choose from Supabase
                    </button>
                    {selectedNode.data.assetUrl && (
                      <div className="text-[10px] text-zinc-500 truncate">
                        {selectedNode.data.assetName || selectedNode.data.assetUrl}
                      </div>
                    )}
                  </>
                )}

                {selectedNode.type === 'camera' && (
                  <div className="space-y-3">
                    <select
                      value={selectedNode.data.presetId || cameraPresets[0].id}
                      onChange={(e) => {
                        const preset = cameraPresets.find((item) => item.id === e.target.value) || cameraPresets[0];
                        updateNodeData(selectedNode.id, {
                          presetId: preset.id,
                          status: 'success',
                          output: { contentType: 'text', text: preset.snippet, metadata: { kind: 'camera_preset' } },
                        });
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                      }`}
                    >
                      {cameraPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const preset = cameraPresets.find((item) => item.id === (selectedNode.data.presetId || cameraPresets[0].id)) || cameraPresets[0];
                      return (
                        <div className={`rounded-lg border px-3 py-2 text-[10px] ${
                          isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'
                        }`}>
                          <div className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                            {preset.label}
                          </div>
                          <div className="mt-1">{preset.description}</div>
                          <div className="mt-2 text-[10px] text-zinc-500">Prompt snippet:</div>
                          <div className="mt-1 whitespace-pre-wrap text-[10px] text-zinc-400">
                            {preset.snippet}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedNode.type === 'motion' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500">Motion Presets</span>
                      <button
                        onClick={() => setCompactMotionList((prev) => !prev)}
                        className={`px-2 py-1 rounded text-[10px] border ${
                          compactMotionList
                            ? 'border-emerald-500/60 text-emerald-200'
                            : isDark
                            ? 'border-zinc-800 text-zinc-400'
                            : 'border-zinc-200 text-zinc-600'
                        }`}
                      >
                        {compactMotionList ? 'Compact On' : 'Compact Off'}
                      </button>
                    </div>

                    {motionGroups.map((group) => (
                      <div key={group.id} className="space-y-2">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">{group.id}</div>
                        {group.items.map((id) => {
                          const preset = getMotionPreset(id);
                          if (!preset) return null;
                          const isActive = selectedNode.data.presetId === preset.id;
                          return (
                            <button
                              key={preset.id}
                              onClick={() =>
                                updateNodeData(selectedNode.id, {
                                  presetId: preset.id,
                                  status: 'success',
                                  output: { contentType: 'text', text: preset.snippet, metadata: { kind: 'motion_preset' } },
                                })
                              }
                              className={`w-full text-left rounded-lg border ${
                                compactMotionList ? 'px-2 py-2' : 'px-3 py-2'
                              } ${
                                isActive
                                  ? 'border-emerald-500/50 text-emerald-200'
                                  : isDark
                                  ? 'border-zinc-800 text-zinc-300'
                                  : 'border-zinc-200 text-zinc-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs">{preset.label}</span>
                                <span className="text-[10px] text-zinc-500">Motion</span>
                              </div>
                              <div className={`mt-2 flex items-center gap-2 ${compactMotionList ? '' : 'flex-col items-start'}`}>
                                <img
                                  src={getMotionDiagram(preset.id)}
                                  className={`${compactMotionList ? 'w-20 h-12' : 'w-full h-20'} object-contain rounded-md border border-zinc-800 bg-zinc-950`}
                                />
                                {!compactMotionList && (
                                  <div className="text-[10px] text-zinc-500">{preset.description}</div>
                                )}
                              </div>
                              {compactMotionList && (
                                <div className="text-[9px] text-zinc-500 mt-1">{preset.description}</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {selectedNode.type === 'angle' && (
                  <div className="space-y-2">
                    {anglePresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() =>
                          updateNodeData(selectedNode.id, {
                            presetId: preset.id,
                            status: 'success',
                            output: { contentType: 'text', text: preset.snippet, metadata: { kind: 'angle_preset' } },
                          })
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs border ${
                          selectedNode.data.presetId === preset.id
                            ? 'border-emerald-500/50 text-emerald-200'
                            : isDark
                            ? 'border-zinc-800 text-zinc-300'
                            : 'border-zinc-200 text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{preset.label}</span>
                          <span className="text-[10px] text-zinc-500">Angle (Image + Video)</span>
                        </div>
                        <img src={getAnglePreview(preset.id)} className="mt-2 w-full h-12 object-cover rounded-md border border-zinc-800" />
                        <div className="text-[10px] text-zinc-500 mt-1">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => runNode(selectedNode.id)}
                    className="px-3 py-2 rounded-lg text-xs bg-emerald-500 text-white"
                  >
                    Run Node
                  </button>
                  <button
                    onClick={() => disconnectNode(selectedNode.id)}
                    className="px-3 py-2 rounded-lg text-xs border border-amber-500/40 text-amber-300"
                  >
                    Cut Links
                  </button>
                  <button
                    onClick={() => deleteNode(selectedNode.id)}
                    className="px-3 py-2 rounded-lg text-xs border border-red-500/40 text-red-300"
                  >
                    Delete Node
                  </button>
                </div>

                {selectedNode.data.output?.url && selectedNode.data.output.contentType === 'image' && (
                  <img src={selectedNode.data.output.url} className="w-full h-auto object-contain rounded-lg border border-zinc-800" />
                )}
                {selectedNode.data.output?.url && selectedNode.data.output.contentType === 'video' && (
                  <video controls className="w-full h-auto object-contain rounded-lg border border-zinc-800" src={selectedNode.data.output.url} />
                )}
                {selectedNode.data.output?.text && (
                  <pre className="text-[10px] whitespace-pre-wrap text-zinc-300">{selectedNode.data.output.text}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${outputsCollapsed ? 'h-12' : 'h-40'} border-t ${isDark ? 'border-zinc-800 bg-black/40' : 'border-zinc-200 bg-white'}`}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Outputs</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-500">{logs.length} logs</span>
            <button
              onClick={() => setOutputsCollapsed((prev) => !prev)}
              className={`text-[10px] px-2 py-1 rounded border ${
                isDark ? 'border-zinc-700 text-zinc-300' : 'border-zinc-300 text-zinc-600'
              }`}
            >
              {outputsCollapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>
        </div>
        {!outputsCollapsed && (
          <div className="flex h-[calc(100%-32px)]">
            <div className="flex-1 overflow-y-auto px-4 py-2 text-[10px] font-mono text-zinc-400">
              {logs.map((log, idx) => (
                <div key={idx} className="py-0.5">
                  {log}
                </div>
              ))}
            </div>
            <div className="w-64 border-l border-white/10 p-3">
              {outputPreview?.url && outputPreview.contentType === 'image' && (
                <img src={outputPreview.url} className="w-full h-auto max-h-32 object-contain rounded-lg" />
              )}
              {outputPreview?.url && outputPreview.contentType === 'video' && (
                <video src={outputPreview.url} className="w-full h-auto max-h-32 object-contain rounded-lg" />
              )}
              {outputPreview?.text && (
                <div className="text-[10px] text-zinc-400 line-clamp-6 whitespace-pre-wrap">
                  {outputPreview.text}
                </div>
              )}
              {!outputPreview && (
                <div className="text-[10px] text-zinc-500">Select a node to preview output.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacesWorkspace;
