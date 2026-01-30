import { createClient } from '@supabase/supabase-js';

// KONFIGURASI SUPABASE
// Menggunakan Environment Variables untuk keamanan di Production (Vercel)
// Mendukung format Vite (import.meta.env) dan Create-React-App (process.env)

const getEnv = (key: string, viteKey: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey];
    }
  } catch (e) { /* ignore */ }
  
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) { /* ignore */ }

  return '';
};

const getSiteUrl = () => {
  const envSite = getEnv('REACT_APP_SITE_URL', 'VITE_SITE_URL');
  if (envSite) return envSite.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
};

// Default Fallbacks (agar tidak crash jika env var belum diset di Vercel)
// Ini mencegah error "supabaseUrl is required" saat deploy jika variabel lingkungan belum diset
const DEFAULT_URL = 'https://gljcfyyiqbriuappruox.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsamNmeXlpcWJyaXVhcHBydW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjI5MTgsImV4cCI6MjA4NDIzODkxOH0.GSZUaVlce4iFJJb9ShGnLfDxFz3bWFC0aSJzeTSth0s';

// PENTING: Di Vercel (Vite), Environment Variable HARUS diawali dengan VITE_
const envUrl = getEnv('REACT_APP_SUPABASE_URL', 'VITE_SUPABASE_URL');
const envKey = getEnv('REACT_APP_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

// Gunakan Env Var jika ada, jika tidak gunakan Default
const SUPABASE_URL = envUrl || DEFAULT_URL;
const SUPABASE_ANON_KEY = envKey || DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("FATAL ERROR: Supabase Configuration is missing/invalid.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTHENTICATION ---

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const siteUrl = getSiteUrl();
  const options = siteUrl ? { emailRedirectTo: siteUrl } : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// --- STORAGE ---

export const uploadAsset = async (file: File): Promise<string> => {
  try {
    const user = await getUser();
    if (!user) throw new Error("Authentication required for upload");

    // 1. Generate unique filename
    const fileExt = file.name.split('.').pop();
    // Use user ID in path for organization
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // 2. Upload to 'kie-assets' bucket
    const { error: uploadError } = await supabase.storage
      .from('kie-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // 3. Get Public URL
    const { data } = supabase.storage
      .from('kie-assets')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error: any) {
    throw new Error(`Storage Upload Failed: ${error.message}`);
  }
};
