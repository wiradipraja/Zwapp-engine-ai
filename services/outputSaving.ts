/**
 * Output Saving Service
 * Saves generated results to Supabase for long-term storage
 * Supabase becomes the repository for generated content (not input files)
 */

import { supabase } from './supabase';

export interface SavedOutput {
  id: string;
  taskId: string;
  model: string;
  prompt: string;
  outputUrl: string;
  outputType: 'image' | 'video' | 'text';
  metadata: Record<string, any>;
  creditsCost: number;
  createdAt: string;
  userId?: string;
  featured?: boolean;
  featuredOrder?: number | null;
}

const STORAGE_BUCKET = 'kie-assets';
const STORAGE_PUBLIC_PREFIX = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

const getCurrentUserId = async (): Promise<string | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id) return sessionData.session.user.id;
  const { data: userData } = await supabase.auth.getUser();
  return userData.user?.id || null;
};

const extractStoragePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(STORAGE_PUBLIC_PREFIX);
    if (idx === -1) return null;
    return parsed.pathname.slice(idx + STORAGE_PUBLIC_PREFIX.length).replace(/^\/+/, '');
  } catch (_err) {
    const idx = url.indexOf(STORAGE_PUBLIC_PREFIX);
    if (idx === -1) return null;
    return url.slice(idx + STORAGE_PUBLIC_PREFIX.length).replace(/^\/+/, '').split('?')[0];
  }
};

/**
 * Save generated output to Supabase
 * Stores metadata + URL reference (not the actual file)
 */
export const saveOutputToSupabase = async (
  taskId: string,
  model: string,
  prompt: string,
  outputUrl: string,
  outputType: 'image' | 'video' | 'text',
  creditsCost: number,
  metadata: Record<string, any> = {}
): Promise<SavedOutput> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Authentication required to save output.');
    }
    const now = new Date().toISOString();
    const insertData = {
      task_id: taskId,
      user_id: userId,
      model,
      prompt,
      output_url: outputUrl,
      output_type: outputType,
      metadata,
      credits_cost: creditsCost,
      created_at: now,
    };

    // Insert into 'generated_outputs' table
    const { data, error } = await supabase
      .from('generated_outputs')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      id: data.id,
      taskId: data.task_id,
      model: data.model,
      prompt: data.prompt,
      outputUrl: data.output_url,
      outputType: data.output_type,
      metadata: data.metadata,
      creditsCost: data.credits_cost,
      createdAt: data.created_at,
      userId: data.user_id,
      featured: data.featured ?? false,
      featuredOrder: data.featured_order ?? null,
    };
  } catch (error: any) {
    throw new Error(`Failed to save output: ${error.message}`);
  }
};

/**
 * Fetch saved outputs for current user
 */
export const fetchUserOutputs = async (
  limit: number = 50,
  offset: number = 0
): Promise<SavedOutput[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Authentication required to load gallery.');
    }

    const { data, error } = await supabase
      .from('generated_outputs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Fetch error: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      taskId: row.task_id,
      model: row.model,
      prompt: row.prompt,
      outputUrl: row.output_url,
      outputType: row.output_type,
      metadata: row.metadata,
      creditsCost: row.credits_cost,
      createdAt: row.created_at,
      userId: row.user_id,
      featured: row.featured ?? false,
      featuredOrder: row.featured_order ?? null,
    }));
  } catch (error: any) {
    console.error('Failed to fetch outputs:', error);
    throw new Error(error?.message || 'Failed to fetch outputs.');
  }
};

/**
 * Delete saved output
 */
export const deleteOutput = async (outputId: string): Promise<boolean> => {
  try {
    const { data, error: fetchError } = await supabase
      .from('generated_outputs')
      .select('output_url')
      .eq('id', outputId)
      .single();

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    const storagePath = data?.output_url ? extractStoragePathFromUrl(data.output_url) : null;

    if (storagePath) {
      const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      if (storageError && !String(storageError.message || '').toLowerCase().includes('not found')) {
        throw new Error(`Storage delete error: ${storageError.message}`);
      }
    }

    const { error } = await supabase
      .from('generated_outputs')
      .delete()
      .eq('id', outputId);

    if (error) {
      throw new Error(`Delete error: ${error.message}`);
    }

    return true;
  } catch (error: any) {
    console.error('Failed to delete output:', error);
    return false;
  }
};

/**
 * Get output by taskId
 */
export const getOutputByTaskId = async (taskId: string): Promise<SavedOutput | null> => {
  try {
    const { data, error } = await supabase
      .from('generated_outputs')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (error) {
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      taskId: data.task_id,
      model: data.model,
      prompt: data.prompt,
      outputUrl: data.output_url,
      outputType: data.output_type,
      metadata: data.metadata,
      creditsCost: data.credits_cost,
      createdAt: data.created_at,
      userId: data.user_id,
      featured: data.featured ?? false,
      featuredOrder: data.featured_order ?? null,
    };
  } catch (error: any) {
    console.error('Failed to get output:', error);
    return null;
  }
};

/**
 * Fetch featured outputs for landing page
 */
export const fetchFeaturedOutputs = async (limit: number = 6): Promise<SavedOutput[]> => {
  try {
    const { data, error } = await supabase
      .from('generated_outputs')
      .select('*')
      .eq('featured', true)
      .order('featured_order', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Fetch error: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      taskId: row.task_id,
      model: row.model,
      prompt: row.prompt,
      outputUrl: row.output_url,
      outputType: row.output_type,
      metadata: row.metadata,
      creditsCost: row.credits_cost,
      createdAt: row.created_at,
      userId: row.user_id,
      featured: row.featured ?? false,
      featuredOrder: row.featured_order ?? null,
    }));
  } catch (error: any) {
    console.error('Failed to fetch featured outputs:', error);
    return [];
  }
};

/**
 * Update featured status for landing page
 */
export const updateOutputFeatured = async (
  outputId: string,
  featured: boolean,
  featuredOrder: number = 0
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('generated_outputs')
      .update({
        featured,
        featured_order: featured ? featuredOrder : 0,
      })
      .eq('id', outputId);

    if (error) {
      throw new Error(`Update error: ${error.message}`);
    }

    return true;
  } catch (error: any) {
    console.error('Failed to update featured output:', error);
    return false;
  }
};

/**
 * Get total credits spent by user
 */
export const getTotalCreditsCost = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('generated_outputs')
      .select('credits_cost');

    if (error) {
      throw new Error(`Sum error: ${error.message}`);
    }

    return (data || []).reduce((sum, row) => sum + (row.credits_cost || 0), 0);
  } catch (error: any) {
    console.error('Failed to get total credits:', error);
    return 0;
  }
};

/**
 * Get statistics for user outputs
 */
export const getOutputStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('generated_outputs')
      .select('output_type, credits_cost');

    if (error) {
      throw new Error(`Stats error: ${error.message}`);
    }

    const stats = {
      totalCount: (data || []).length,
      imageCount: (data || []).filter(d => d.output_type === 'image').length,
      videoCount: (data || []).filter(d => d.output_type === 'video').length,
      totalCreditsCost: (data || []).reduce((sum, row) => sum + (row.credits_cost || 0), 0),
    };

    return stats;
  } catch (error: any) {
    console.error('Failed to get statistics:', error);
    return {
      totalCount: 0,
      imageCount: 0,
      videoCount: 0,
      totalCreditsCost: 0,
    };
  }
};

const isDirectDownloadUrl = (url: string): boolean => {
  return /^data:|^blob:/i.test(url);
};

const triggerAnchorDownload = (href: string, fileName?: string, openInNewTab: boolean = false) => {
  const link = document.createElement('a');
  link.href = href;
  if (fileName) link.download = fileName;
  if (openInNewTab) {
    link.target = '_blank';
    link.rel = 'noreferrer';
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download output file (creates a download link)
 */
export const downloadOutput = async (outputUrl: string, fileName: string): Promise<void> => {
  if (!outputUrl) {
    throw new Error('Download failed: missing output URL');
  }

  if (isDirectDownloadUrl(outputUrl)) {
    triggerAnchorDownload(outputUrl, fileName);
    return;
  }

  try {
    const response = await fetch(outputUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    try {
      triggerAnchorDownload(url, fileName);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (error: any) {
    try {
      // Fallback for cross-origin URLs without CORS
      triggerAnchorDownload(outputUrl, fileName, true);
    } catch (fallbackError: any) {
      const message = error?.message || fallbackError?.message || 'Unknown error';
      throw new Error(`Download failed: ${message}`);
    }
  }
};

/**
 * Share output (generates shareable URL or prepares for sharing)
 */
export const shareOutput = async (outputId: string): Promise<string> => {
  // This could be extended to create a shareable token or public link
  // For now, return the output ID that can be used to fetch from database
  return `${window.location.origin}/shared/${outputId}`;
};
