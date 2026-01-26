import type { Edge, Node, Viewport } from 'reactflow';

export type SpaceNodeType =
  | 'prompt'
  | 'script'
  | 'image'
  | 'video'
  | 'upload'
  | 'camera'
  | 'motion'
  | 'angle';
export type SpaceNodeStatus = 'idle' | 'running' | 'success' | 'error';
export type SpaceAssetType = 'image' | 'video';
export type SpaceAssetRole = 'auto' | 'subject' | 'object';

export interface SpaceNodeOutput {
  contentType: 'text' | 'image' | 'video' | 'asset';
  text?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface SpaceNodeData {
  label: string;
  title?: string;
  status: SpaceNodeStatus;
  prompt?: string;
  instructions?: string;
  model?: string;
  aspectRatio?: string;
  assetType?: SpaceAssetType;
  assetSource?: 'local' | 'supabase';
  assetUrl?: string;
  assetName?: string;
  assetRole?: SpaceAssetRole;
  presetId?: string;
  output?: SpaceNodeOutput;
  error?: string;
  updatedAt?: number;
}

export interface SpaceFlowData {
  version: string;
  nodes: Array<Node<SpaceNodeData>>;
  edges: Edge[];
  viewport?: Viewport;
}

export interface SpaceRecord {
  id: string;
  userId: string;
  name: string;
  data: SpaceFlowData;
  createdAt: string;
  updatedAt: string;
}
