/**
 * KIE.AI File Upload Service with Supabase Backend
 * 
 * FLOW:
 * 1. Upload file to Supabase → get public URL
 * 2. Send public URL to KIE.AI for processing
 * 3. KIE.AI fetches file from Supabase URL
 */

import { supabase } from './supabase';

/**
 * Convert File to public URL via Supabase
 * Uploads file to Supabase and returns a public URL that KIE.AI can access
 */
export const uploadFileToSupabaseGetUrl = async (
  file: File,
  uploadPath: string = 'uploads'
): Promise<string> => {
  try {
    // Check if user is authenticated
    const user = await supabase.auth.getUser();
    
    // Generate unique filename (use anonymous prefix if no user)
    const fileExt = file.name.split('.').pop();
    const userId = user.data.user?.id || 'anonymous';
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${uploadPath}/${fileName}`;

    console.log('[Upload] Uploading to Supabase:', filePath);

    // Upload to Supabase 'kie-assets' bucket (should allow public uploads)
    const { data, error: uploadError } = await supabase.storage
      .from('kie-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[Upload] Supabase error:', uploadError);
      throw uploadError;
    }

    // Get Public URL from Supabase
    const { data: urlData } = supabase.storage
      .from('kie-assets')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('[Upload] Supabase URL generated:', publicUrl.substring(0, 50) + '...');

    return publicUrl;
  } catch (error: any) {
    throw new Error(`Supabase Upload Failed: ${error.message}`);
  }
};

/**
 * Upload image file to Supabase, then get public URL
 * Returns URL that KIE.AI can fetch and process
 */
export const uploadImageToKieAI = async (
  file: File,
  apiKey: string // apiKey kept for backward compatibility but not used here
): Promise<string> => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: JPG, PNG, WEBP, GIF`);
  }

  // Validate file size (10MB for most image models)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB`);
  }

  console.log('[Upload] Starting image upload:', file.name);
  return uploadFileToSupabaseGetUrl(file, 'images');
};

/**
 * Upload video file to Supabase, then get public URL
 * Returns URL that KIE.AI can fetch and process
 */
export const uploadVideoToKieAI = async (
  file: File,
  apiKey: string // apiKey kept for backward compatibility but not used here
): Promise<string> => {
  // Validate file type
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: MP4, MOV, MKV, AVI, WEBM`);
  }

  // Validate file size (100MB for videos)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 100MB`);
  }

  console.log('[Upload] Starting video upload:', file.name);
  return uploadFileToSupabaseGetUrl(file, 'videos');
};

/**
 * Upload multiple images concurrently to Supabase, get public URLs
 */
export const uploadImagesToKieAI = async (
  files: File[],
  apiKey: string // kept for backward compatibility
): Promise<string[]> => {
  try {
    console.log('[Upload] Uploading', files.length, 'images');
    const uploadPromises = files.map(file => uploadImageToKieAI(file, apiKey));
    const urls = await Promise.all(uploadPromises);
    console.log('[Upload] Successfully uploaded', urls.length, 'images');
    return urls;
  } catch (error: any) {
    throw new Error(`Batch upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple videos concurrently to Supabase, get public URLs
 */
export const uploadVideosToKieAI = async (
  files: File[],
  apiKey: string // kept for backward compatibility
): Promise<string[]> => {
  try {
    console.log('[Upload] Uploading', files.length, 'videos');
    const uploadPromises = files.map(file => uploadVideoToKieAI(file, apiKey));
    const urls = await Promise.all(uploadPromises);
    console.log('[Upload] Successfully uploaded', urls.length, 'videos');
    return urls;
  } catch (error: any) {
    throw new Error(`Batch upload failed: ${error.message}`);
  }
};

/**
 * Convert File to dataURL for preview (no upload)
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Check file size without uploading
 */
export const getFileSizeInfo = (file: File): {
  sizeInMB: number;
  isValid: boolean;
  message: string;
} => {
  const sizeInMB = file.size / 1024 / 1024;
  
  if (file.type.startsWith('image/')) {
    const maxMB = 10;
    return {
      sizeInMB,
      isValid: sizeInMB <= maxMB,
      message: `${sizeInMB.toFixed(2)}MB / ${maxMB}MB`
    };
  }
  
  if (file.type.startsWith('video/')) {
    const maxMB = 100;
    return {
      sizeInMB,
      isValid: sizeInMB <= maxMB,
      message: `${sizeInMB.toFixed(2)}MB / ${maxMB}MB`
    };
  }
  
  return {
    sizeInMB,
    isValid: true,
    message: `${sizeInMB.toFixed(2)}MB`
  };
};
