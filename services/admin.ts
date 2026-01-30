// services/admin.ts
// Simple admin gating based on Supabase Auth UID list

const getEnv = (key: string, viteKey: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey];
    }
  } catch (_err) {
    // ignore
  }

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (_err) {
    // ignore
  }

  return '';
};

const parseAdminUids = (value: string): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => v.toLowerCase());

const ADMIN_UIDS = parseAdminUids(getEnv('REACT_APP_ADMIN_UIDS', 'VITE_ADMIN_UIDS'));

export const getAdminUids = (): string[] => ADMIN_UIDS;

export const isAdminUser = (userId?: string | null): boolean => {
  if (!userId) return false;
  return ADMIN_UIDS.includes(userId.toLowerCase());
};
