import { supabase } from './supabase';
import { uploadFileToSupabaseGetUrl } from './kieFileUpload';

export type SpaceAssetKind = 'image' | 'video';

export interface SupabaseAsset {
  name: string;
  path: string;
  url: string;
  type: SpaceAssetKind;
  updatedAt?: string;
  size?: number;
}

const bucket = 'kie-assets';

const buildAssetUrl = (path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

const listFolderAssets = async (
  folder: string,
  type: SpaceAssetKind
): Promise<SupabaseAsset[]> => {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 100,
    sortBy: { column: 'updated_at', order: 'desc' },
  });

  if (error) {
    return [];
  }

  return (data || [])
    .filter((item) => item.name && !item.name.endsWith('/'))
    .map((item) => {
      const path = `${folder}/${item.name}`;
      return {
        name: item.name,
        path,
        url: buildAssetUrl(path),
        type,
        updatedAt: item.updated_at || undefined,
        size: item.metadata?.size || undefined,
      };
    });
};

export const listUserAssets = async (
  kind: SpaceAssetKind | 'all' = 'all'
): Promise<SupabaseAsset[]> => {
  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;
  if (!userId) {
    throw new Error('Authentication required to load assets.');
  }

  const folders: Array<{ folder: string; type: SpaceAssetKind }> = [];
  if (kind === 'all' || kind === 'image') {
    folders.push({ folder: `images/${userId}`, type: 'image' });
    folders.push({ folder: `spaces/outputs/images/${userId}`, type: 'image' });
  }
  if (kind === 'all' || kind === 'video') {
    folders.push({ folder: `videos/${userId}`, type: 'video' });
    folders.push({ folder: `spaces/outputs/videos/${userId}`, type: 'video' });
  }

  const results = await Promise.all(
    folders.map((entry) => listFolderAssets(entry.folder, entry.type))
  );

  return results.flat();
};

const getExtensionFromType = (contentType: string, fallback: string): string => {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('mp4')) return 'mp4';
  if (contentType.includes('quicktime')) return 'mov';
  if (contentType.includes('webm')) return 'webm';
  return fallback;
};

export const uploadOutputUrlToSupabase = async (
  url: string,
  type: SpaceAssetKind
): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download output (${response.status})`);
  }

  const blob = await response.blob();
  const fallbackExt = type === 'image' ? 'png' : 'mp4';
  const ext = getExtensionFromType(blob.type, fallbackExt);
  const fileName = `output-${Date.now()}.${ext}`;
  const file = new File([blob], fileName, { type: blob.type || '' });

  const uploadPath =
    type === 'image' ? 'spaces/outputs/images' : 'spaces/outputs/videos';

  return uploadFileToSupabaseGetUrl(file, uploadPath);
};
