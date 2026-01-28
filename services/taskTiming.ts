// services/taskTiming.ts
// Lightweight helpers for ETA / countdown rendering

const DEFAULT_IMAGE_MS = 25000;
const DEFAULT_VIDEO_MS = 120000;
const DEFAULT_TEXT_MS = 15000;
const DEFAULT_UPSCALE_MS = 35000;

export const estimateDurationMs = (model: string): number => {
  const lower = (model || '').toLowerCase();

  if (!lower) return DEFAULT_IMAGE_MS;

  if (lower.includes('upscale')) return DEFAULT_UPSCALE_MS;
  if (lower.includes('characters')) return DEFAULT_IMAGE_MS;
  if (
    lower.includes('text-to-video') ||
    lower.includes('image-to-video') ||
    lower.includes('reference-to-video') ||
    lower.includes('motion-control') ||
    lower.includes('veo3') ||
    lower.includes('sora-2')
  ) {
    return DEFAULT_VIDEO_MS;
  }
  if (lower.includes('text') || lower.includes('script')) return DEFAULT_TEXT_MS;

  return DEFAULT_IMAGE_MS;
};

export const computeRemainingMs = (
  progress: number | undefined,
  startTime: number | undefined,
  estimatedTotalMs: number,
  now: number = Date.now()
): number => {
  const safeProgress = Math.max(0, Math.min(100, progress ?? 0));
  const elapsed = startTime ? Math.max(0, now - startTime) : 0;
  let total = estimatedTotalMs;

  if (safeProgress > 2 && elapsed > 500) {
    const byProgress = elapsed / (safeProgress / 100);
    if (Number.isFinite(byProgress) && byProgress > 0) {
      total = Math.max(total, byProgress);
    }
  }

  return Math.max(0, total - elapsed);
};

export const formatCountdown = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};
