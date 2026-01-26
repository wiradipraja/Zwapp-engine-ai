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
import type { NanoBananaGenInput, Veo3ImageToVideoInput, Veo3Input, Veo3TextToVideoInput } from '../../types';

interface SpacesWorkspaceProps {
  apiKey: string;
  googleApiKey: string;
  onOpenSettings: () => void;
}

const DEFAULT_SPACE_NAME = 'New Space';
const FLOW_VERSION = '1.0';

const defaultNodeData = (type: SpaceNodeType): SpaceNodeData => {
  switch (type) {
    case 'prompt':
      return { label: 'Prompt', status: 'idle', prompt: '' };
    case 'script':
      return { label: 'Script', status: 'idle', prompt: '' };
    case 'image':
      return { label: 'Image', status: 'idle', prompt: '', model: 'google/nano-banana', aspectRatio: '1:1' };
    case 'video':
      return { label: 'Video', status: 'idle', prompt: '', model: 'veo3_fast', aspectRatio: '16:9' };
    case 'upload':
      return { label: 'Upload', status: 'idle', assetType: 'image', assetSource: 'local' };
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

const accentByType = (type?: string) => {
  switch (type) {
    case 'prompt':
      return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    case 'script':
      return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    case 'image':
      return 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10';
    case 'video':
      return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
    case 'upload':
      return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
    default:
      return 'text-zinc-400 border-zinc-700 bg-zinc-900/30';
  }
};

const SpaceNodeCard: React.FC<NodeProps<SpaceNodeData>> = ({ data, type, selected }) => {
  const accent = accentByType(type);
  const output = data.output;
  const status = data.status || 'idle';

  return (
    <div
      className={`min-w-[180px] max-w-[220px] rounded-xl border px-3 py-2 shadow-lg backdrop-blur ${
        selected ? 'border-white/40' : 'border-white/10'
      } ${accent}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-400/70" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-mono">{data.label}</span>
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
        <div className="mt-2 text-[10px] text-zinc-100/80 line-clamp-4 whitespace-pre-wrap">
          {output.text}
        </div>
      )}

      {output?.url && output.contentType === 'image' && (
        <img
          src={output.url}
          alt="preview"
          className="mt-2 h-24 w-full rounded-lg object-cover border border-white/10"
        />
      )}

      {output?.url && output.contentType === 'video' && (
        <video className="mt-2 h-24 w-full rounded-lg border border-white/10 object-cover" src={output.url} />
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

  const [nodes, setNodes, onNodesChange] = useNodesState<SpaceNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [spaces, setSpaces] = useState<SpaceRecord[]>([]);
  const [activeSpace, setActiveSpace] = useState<SpaceRecord | null>(null);
  const [spaceName, setSpaceName] = useState(DEFAULT_SPACE_NAME);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const [logs, setLogs] = useState<string[]>([]);
  const [outputPreview, setOutputPreview] = useState<SpaceNodeOutput | null>(null);

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
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
      markDirty();
    },
    [setEdges, markDirty]
  );

  const onSelectionChange = useCallback(({ nodes: selected }: { nodes: Node[] }) => {
    setSelectedNodeId(selected[0]?.id ?? null);
  }, []);

  const resolveIncomingOutputs = (nodeId: string) => {
    const incomingEdges = edges.filter((edge) => edge.target === nodeId);
    return incomingEdges
      .map((edge) => nodes.find((node) => node.id === edge.source))
      .filter((node): node is Node<SpaceNodeData> => !!node)
      .map((node) => node.data.output)
      .filter((output): output is SpaceNodeOutput => !!output);
  };

  const resolveTextInput = (nodeId: string, fallback?: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    const direct = node?.data.prompt?.trim();
    if (direct) return direct;
    const incoming = resolveIncomingOutputs(nodeId).find((output) => output.text);
    return incoming?.text || fallback || '';
  };

  const resolveImageInputs = (nodeId: string) => {
    return resolveIncomingOutputs(nodeId)
      .filter((output) => output.contentType === 'image' && output.url)
      .map((output) => output.url as string);
  };

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

  const pollTaskForResult = async (taskId: string) => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const result = await queryTask(apiKey, taskId);
      const data = result.data;
      if (data.state === 'success') {
        const url = extractResultUrl(data.resultJson, data);
        if (!url) {
          throw new Error('Task succeeded but no output URL found.');
        }
        return url;
      }
      if (data.state === 'fail') {
        throw new Error(data.failMsg || 'Generation failed.');
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
          output: { contentType: 'text', text },
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
          output: { contentType: 'text', text },
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

      if (node.type === 'image') {
        const prompt = resolveTextInput(nodeId);
        if (!prompt) {
          throw new Error('Prompt is required for image generation.');
        }

        const payload: NanoBananaGenInput = {
          prompt,
          output_format: 'png',
          image_size: (node.data.aspectRatio as NanoBananaGenInput['image_size']) || '1:1',
        };

        const response = await createTask(apiKey, 'google/nano-banana', payload);
        const taskId = response.data.taskId;
        const resultUrl = await pollTaskForResult(taskId);
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
            metadata: { sourceUrl: resultUrl },
          },
        });
        return;
      }

      if (node.type === 'video') {
        const prompt = resolveTextInput(nodeId);
        if (!prompt) {
          throw new Error('Prompt is required for video generation.');
        }

        const images = resolveImageInputs(nodeId);
        let taskId = '';
        if (node.data.model?.startsWith('veo3')) {
          let input: Veo3Input;
          if (images.length > 0) {
            const imageInput: Veo3ImageToVideoInput = {
              prompt,
              imageUrls: images.slice(0, 2),
              generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
              aspect_ratio: (node.data.aspectRatio as Veo3ImageToVideoInput['aspect_ratio']) || '16:9',
              model: node.data.model as Veo3ImageToVideoInput['model'],
            };
            input = imageInput;
          } else {
            const textInput: Veo3TextToVideoInput = {
              prompt,
              generationType: 'TEXT_2_VIDEO',
              aspect_ratio: (node.data.aspectRatio as Veo3TextToVideoInput['aspect_ratio']) || '16:9',
              model: node.data.model as Veo3TextToVideoInput['model'],
            };
            input = textInput;
          }
          const response = await generateVeo3Video(input);
          taskId = response.data?.taskId || '';
        } else {
          const response = await createTask(apiKey, 'sora-2-text-to-video', {
            prompt,
          });
          taskId = response.data.taskId;
        }

        if (!taskId) {
          throw new Error('Failed to create video task.');
        }

        const resultUrl = await pollTaskForResult(taskId);
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
            metadata: { sourceUrl: resultUrl },
          },
        });
        return;
      }
    } catch (error: any) {
      updateNodeData(nodeId, { status: 'error', error: error.message || 'Failed' });
      addLog(`${node.data.label} failed: ${error.message}`);
    }
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
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
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
            {(['prompt', 'script', 'image', 'video', 'upload'] as SpaceNodeType[]).map((type) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs border ${
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
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            onSelectionChange={onSelectionChange}
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

            {selectedNode && (
              <div className="space-y-3">
                <div className="text-xs text-zinc-400">Type: {selectedNode.type}</div>

                {(selectedNode.type === 'prompt' || selectedNode.type === 'script' || selectedNode.type === 'image' || selectedNode.type === 'video') && (
                  <textarea
                    value={selectedNode.data.prompt || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                    rows={6}
                    placeholder="Write your prompt..."
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200'
                    }`}
                  />
                )}

                {selectedNode.type === 'image' && (
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
                  </select>
                )}

                {selectedNode.type === 'video' && (
                  <>
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

                <button
                  onClick={() => runNode(selectedNode.id)}
                  className="px-3 py-2 rounded-lg text-xs bg-emerald-500 text-white"
                >
                  Run Node
                </button>

                {selectedNode.data.output?.url && selectedNode.data.output.contentType === 'image' && (
                  <img src={selectedNode.data.output.url} className="w-full rounded-lg border border-zinc-800" />
                )}
                {selectedNode.data.output?.url && selectedNode.data.output.contentType === 'video' && (
                  <video controls className="w-full rounded-lg border border-zinc-800" src={selectedNode.data.output.url} />
                )}
                {selectedNode.data.output?.text && (
                  <pre className="text-[10px] whitespace-pre-wrap text-zinc-300">{selectedNode.data.output.text}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`h-40 border-t ${isDark ? 'border-zinc-800 bg-black/40' : 'border-zinc-200 bg-white'}`}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Outputs</span>
          <span className="text-[10px] text-zinc-500">{logs.length} logs</span>
        </div>
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
              <img src={outputPreview.url} className="w-full h-24 object-cover rounded-lg" />
            )}
            {outputPreview?.url && outputPreview.contentType === 'video' && (
              <video src={outputPreview.url} className="w-full h-24 object-cover rounded-lg" />
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
      </div>
    </div>
  );
};

export default SpacesWorkspace;
