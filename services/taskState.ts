// services/taskState.ts
// Normalize provider-specific task states into app-friendly values.

export type NormalizedTaskState = 'waiting' | 'success' | 'fail';

export const getFailureReason = (dataOrText: any): string | null => {
  const text =
    typeof dataOrText === 'string'
      ? dataOrText
      : `${dataOrText?.state ?? ''} ${dataOrText?.status ?? ''} ${dataOrText?.failMsg ?? ''} ${
          dataOrText?.errorMsg ?? ''
        } ${dataOrText?.error ?? ''} ${dataOrText?.msg ?? ''} ${dataOrText?.message ?? ''} ${
          dataOrText?.reason ?? ''
        } ${dataOrText?.detail ?? ''}`;
  const lower = text.toLowerCase();

  const has = (value: string) => lower.includes(value);
  const hasWord = (value: string) => new RegExp(`\\b${value}\\b`, 'i').test(lower);

  if (has('nsfw') || has('nudity') || has('sexual') || has('porn')) {
    return 'Blocked by safety filter (NSFW/sexual content).';
  }
  if (has('minor') || has('underage') || has('child')) {
    return 'Blocked by safety filter (minors involved).';
  }
  if (has('self-harm') || has('suicide') || has('self harm')) {
    return 'Blocked by safety filter (self-harm).';
  }
  if (has('violence') || has('gore') || has('blood')) {
    return 'Blocked by safety filter (violence).';
  }
  if (has('hate') || has('harassment')) {
    return 'Blocked by safety filter (hate/harassment).';
  }
  if (has('copyright') || has('trademark') || has('intellectual property') || hasWord('ip')) {
    return 'Blocked due to IP/copyright policy.';
  }
  if (has('illegal') || has('weapon') || has('drug') || has('narcotic')) {
    return 'Blocked by safety policy (illegal content).';
  }
  if (has('rate limit') || has('quota')) {
    return 'Rate limited or quota exceeded.';
  }
  if (has('timeout') || has('timed out')) {
    return 'Request timed out.';
  }
  if (has('invalid') || has('bad request') || has('validation')) {
    return 'Invalid request payload.';
  }
  if (has('safety') || has('policy') || has('unsafe') || has('filtered') || has('blocked') || has('rejected')) {
    return 'Blocked by safety policy.';
  }

  return null;
};

export const normalizeTaskState = (data: any): { state: NormalizedTaskState; raw: string } => {
  // ✅ NEW: Support more field name variations
  const statusValue = data?.state ?? 
                     data?.status ?? 
                     data?.stateCode ?? 
                     data?.statusCode ?? 
                     data?.taskState ?? 
                     data?.stage;
  
  const altStatusValue =
    data?.taskStatus ?? 
    data?.task_status ?? 
    data?.state_code ?? 
    data?.statusCode ?? 
    data?.status_code;
  
  const rawStateSource = statusValue ?? altStatusValue;
  const rawState = String(rawStateSource ?? '').toLowerCase();
  const failMsg = String(data?.failMsg ?? '');
  const errorMsg = String(data?.errorMsg ?? data?.error ?? '');
  const metaMsg = String(data?.msg ?? data?.message ?? data?.reason ?? data?.detail ?? '');
  const combined = `${rawState} ${failMsg} ${errorMsg} ${metaMsg}`.toLowerCase();
  const numericState = Number(statusValue ?? altStatusValue);
  const hasNumericState = Number.isFinite(numericState);
  const hasFailureDetails = Boolean(
    data?.failMsg || data?.failCode || data?.errorMsg || data?.error || data?.msg || data?.message || data?.reason || data?.detail
  );
  const successFlag = data?.success === true || data?.ok === true;
  // ✅ NEW: Extended output detection
  const hasOutput = Boolean(
    data?.resultJson ||
    data?.result_json ||
    data?.resultUrl ||
    data?.result_url ||
    data?.resultUrls ||
    data?.result_urls ||
    data?.result ||
    data?.output ||
    data?.outputUrl ||
    data?.output_url ||
    data?.outputUrls ||
    data?.output_urls ||
    data?.resultBody ||
    data?.imageUrl ||
    data?.image_url ||
    data?.videoUrl ||
    data?.video_url ||
    data?.url ||
    data?.data?.url ||
    data?.data?.image ||
    data?.data?.video ||
    data?.value?.url
  );

  const successKeywords = ['success', 'succeeded', 'complete', 'completed', 'done', 'finish', 'finished', '2'];
  const failKeywords = ['fail', 'failed', 'error', 'blocked', 'rejected', 'filtered', 'safety', 'canceled', 'cancelled', 'timeout', 'invalid', '3'];
  const waitingKeywords = ['waiting', 'queued', 'queue', 'pending', 'running', 'processing', 'created', 'in_progress', 'in-progress', 'progress', '0', '1'];

  if (failKeywords.some((key) => combined.includes(key))) {
    return { state: 'fail', raw: rawState || 'fail' };
  }
  if (successFlag && !hasFailureDetails) {
    return { state: 'success', raw: rawState || 'success_flag' };
  }
  if (successKeywords.some((key) => rawState.includes(key))) {
    if (failMsg || errorMsg) return { state: 'fail', raw: rawState || 'fail' };
    return { state: 'success', raw: rawState || 'success' };
  }
  // ✅ NEW: Better numeric code mapping
  if (hasNumericState) {
    if (numericState === 2 || numericState === 200) return { state: 'success', raw: String(numericState) };
    if (numericState === 3 || numericState === 400 || numericState === 500) return { state: 'fail', raw: String(numericState) };
    if (numericState === 0 || numericState === 1 || numericState === 100) return { state: 'waiting', raw: String(numericState) };
  }
  if (hasFailureDetails) {
    return { state: 'fail', raw: rawState || 'fail' };
  }
  // ✅ NEW: If we have output, consider it success
  if (hasOutput && !failMsg && !errorMsg) {
    return { state: 'success', raw: 'has_output' };
  }
  if (waitingKeywords.some((key) => rawState.includes(key))) {
    return { state: 'waiting', raw: rawState || 'waiting' };
  }

  return { state: 'waiting', raw: rawState || 'unknown' };
};
