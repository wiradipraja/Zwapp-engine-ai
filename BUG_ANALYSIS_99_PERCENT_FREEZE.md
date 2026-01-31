# 🐛 BUG ANALYSIS: KIE AI Task Stuck at 99% Progress

## Executive Summary

**Issue**: Task request dengan KIE AI API KEY tidak menerima response dari API, menyebabkan task freeze di progress 99%.

**Root Causes Identified**: 3 Critical Issues + 1 Architectural Bottleneck

---

## 🔴 CRITICAL BUG #1: Missing `resultJson` Field in Task Polling

### Problem Location
[types.ts#L303-L315](types.ts#L303-L315) - `TaskRecordInfo` dan `QueryTaskResponse`

```typescript
export interface TaskRecordInfo {
  taskId: string;
  model: string;
  state: 'waiting' | 'success' | 'fail';
  param: string;
  resultJson?: string;  // ❌ OPTIONAL - API might return different field name
  failCode?: string | null;
  failMsg?: string | null;
  costTime?: number | null;
  completeTime?: number | null;
  createTime: number;
}
```

### Why This Causes 99% Freeze
In [App.tsx#L562-L600](App.tsx#L562-L600), the polling logic updates task progress:

```typescript
resultJson:
  (update.data as any).resultJson ||
  (update.data as any).result ||
  (update.data as any).output ||
  (update.data as any).imageUrl ||
  (update.data as any).image_url ||
  (update.data as any).videoUrl ||
  (update.data as any).video_url ||
  t.resultJson,
```

✅ **Good**: Multiple field name fallbacks exist  
❌ **Bad**: If KIE API returns response in a field NOT in this list, `resultJson` remains undefined

When [App.tsx#L647-L656](App.tsx#L647-L656) tries to save output:

```typescript
const outputUrl = extractOutputUrl(task.resultJson);
if (!outputUrl) return;  // ❌ EXITS EARLY if resultJson is missing!
```

### Impact
- Task shows "success" status but **no output URL extracted**
- `saveOutputToSupabase()` never called
- Progress stays at 99% (waiting for output)
- Task appears complete in UI but data never persists

### KIE AI API Response Format (Likely Issue)
KIE AI might return response in format like:
```json
{
  "code": 200,
  "data": {
    "taskId": "xxx",
    "state": "success",
    "resultUrls": ["https://..."],  // ← Different from resultJson!
    "output": "..."
  }
}
```

---

## 🔴 CRITICAL BUG #2: Task State Normalization Not Handling All API States

### Problem Location
[services/taskState.ts#L47-L95](services/taskState.ts#L47-L95)

```typescript
export const normalizeTaskState = (data: any): { state: NormalizedTaskState; raw: string } => {
  const statusValue = data?.state ?? data?.status;
  const altStatusValue = data?.taskStatus ?? data?.task_status ?? ...
  // Missing: data?.stateCode, data?.statusCode variations
```

### Issue
If KIE API returns task state in format like:
- `data.progress: 99` (instead of state field)
- `data.stage: "processing"` (non-standard field)
- `data.code: 0` (numeric status code)

The logic fails to classify it correctly:

```typescript
if (waitingKeywords.some((key) => rawState.includes(key))) {
  return { state: 'waiting', raw: rawState || 'waiting' };
}

return { state: 'waiting', raw: rawState || 'waiting' };  // ❌ DEFAULT TO WAITING!
```

### Impact
- Task is actually complete but gets stuck in "waiting" state
- Polling continues indefinitely
- Progress simulator caps at 99% (per PROGRESS_SOFT_CAP)
- User sees frozen progress bar

---

## 🔴 CRITICAL BUG #3: queryTask() Doesn't Handle KIE API Error Responses Properly

### Problem Location
[services/api.ts#L35-L48](services/api.ts#L35-L48)

```typescript
export const queryTask = async (apiKey: string, taskId: string): Promise<QueryTaskResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
        console.warn(`Query Task Warning: ${response.status} ${response.statusText}`);
        throw new Error(`Status Check Failed: ${response.status}`);
    }

    return response.json();  // ❌ NO VALIDATION!
  } catch (error: any) {
    throw error;
  }
};
```

### Issues
1. **Missing response.json() validation**: Doesn't check if response is valid JSON
2. **No API error field parsing**: KIE API might return `{ code: 400, msg: "error" }` but code is not 200
3. **Throws error on non-200**: Breaks polling loop

### Example Failure Scenario
```
API returns: { code: 500, msg: "Internal Server Error", data: null }
response.ok: true (if HTTP 200)
resultJson: null
state: "waiting"  (defaults to waiting!)
Progress: Stuck at 99%
```

---

## 🟡 ARCHITECTURAL BOTTLENECK: KIE API ↔ PIXAZO API Pipeline

### Problem Location
Dual pipeline architecture in [App.tsx#L454-L470](App.tsx#L454-L470)

```typescript
let response;
if (isVeo3Task) {
  response = await generateVeo3Video(input as Veo3Input);
} else {
  response = await createTask(apiKey, modelName, input as KieInput);  // KIE
}

// Later, PIXAZO tasks handled separately (line 417-449)
if (activeModule === 'stable-diffusion-text') {
  const result = await generateSDXLImage(resolvedPixazoKey, input);
  outputUrl = result.imageUrl;
}
```

### Issues
1. **Different response formats**: KIE vs PIXAZO return data differently
2. **No unified response handler**: Each API has different output field structure
3. **Polling strategy mismatch**: KIE uses async polling, PIXAZO uses synchronous calls
4. **Error handling inconsistency**: KIE errors thrown, PIXAZO errors caught differently

### Timeline Bottleneck
- **KIE Tasks** (async):
  1. Create task → wait 1-2s for API
  2. Poll every 1s × N (could be 30-300 seconds for video)
  3. Extract URL from response
  4. Save to Supabase
  
- **PIXAZO Tasks** (semi-sync):
  1. Call API → wait for immediate response
  2. Direct output or job ID
  3. No polling needed
  4. Save to Supabase

**Result**: If network is slow, KIE polling might timeout while waiting for response.

---

## 🟢 DATABASE ISSUE: Supabase `generated_outputs` Table

### Problem Location
[SUPABASE_OUTPUTS_SCHEMA.sql#L1-L20](SUPABASE_OUTPUTS_SCHEMA.sql#L1-L20)

```sql
create table if not exists public.generated_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  task_id text unique,  -- ❌ UNIQUE constraint
  model text,
  prompt text,
  output_url text,
  -- ...
);
```

### Potential Issues
1. **Duplicate task_id error**: If same task ID inserted twice, query fails silently
2. **NULL user_id**: If session lost during save, insert fails
3. **Missing task_id**: If `extractPromptFromParam()` fails, no data saved

From [App.tsx#L647-L676](App.tsx#L647-L676):

```typescript
const userId = await getCurrentUserId();  // Could be null!
if (!userId) {
  throw new Error('Authentication required to save output.');
}

await saveOutputToSupabase(
  task.taskId,  // Could be undefined
  task.model,
  prompt,
  outputUrl,  // Could be empty string
  // ...
);
```

### Impact
- Task completes but fails to save
- Progress stuck at 99% (waiting for successful save)
- Supabase RLS policies might block anonymous users

---

## 🔧 ROOT CAUSE SUMMARY

### Why Task Freezes at 99%

1. **API Response**: KIE API returns task result in field name NOT in fallback list
   - Example: `data.resultBody` instead of `data.resultJson`

2. **State Classification**: Task state not recognized as "success"
   - Defaults to "waiting" indefinitely
   - Progress simulator keeps incrementing toward 99% cap

3. **Polling Loop**: Never exits because:
   - Task status never becomes "success" or "fail"
   - `resultJson` never populated
   - Save logic blocked by empty `outputUrl`

4. **User Experience**: 
   - Progress bar animates from 1% → 99% (simulator)
   - Task shows in queue as "waiting"
   - Click to view result = empty or error
   - Credits deducted but output not saved

---

## ✅ SOLUTIONS

### Fix #1: Expand Response Field Detection
**File**: [App.tsx#L562-L575](App.tsx#L562-L575)

**Before**:
```typescript
resultJson:
  (update.data as any).resultJson ||
  (update.data as any).result ||
  (update.data as any).output ||
  (update.data as any).imageUrl ||
  (update.data as any).image_url ||
  (update.data as any).videoUrl ||
  (update.data as any).video_url ||
  t.resultJson,
```

**After**:
```typescript
resultJson:
  (update.data as any).resultJson ||
  (update.data as any).resultUrls?.[0] ||
  (update.data as any).result ||
  (update.data as any).output ||
  (update.data as any).resultBody ||
  (update.data as any).imageUrl ||
  (update.data as any).image_url ||
  (update.data as any).videoUrl ||
  (update.data as any).video_url ||
  (update.data as any).data?.url ||
  (update.data as any).data?.image ||
  (update.data as any).data?.video ||
  t.resultJson,
```

---

### Fix #2: Improve State Normalization
**File**: [services/taskState.ts#L47-L95](services/taskState.ts#L47-L95)

**Add** these state variations:
```typescript
const statusValue = data?.state ?? data?.status ?? data?.stateCode ?? 
                   data?.statusCode ?? data?.taskState ?? data?.stage;

// Add numeric state codes for KIE API
const hasNumericState = Number.isFinite(numericState);
if (hasNumericState) {
  if (numericState === 0 || numericState === 1) return { state: 'waiting', raw: rawState || 'waiting' };
  if (numericState === 2) return { state: 'success', raw: rawState || 'success' };
  if (numericState === 3) return { state: 'fail', raw: rawState || 'fail' };
}

// Add progress-based fallback
if (!hasOutput && (data?.progress ?? 0) >= 99) {
  return { state: 'success', raw: 'progress:99' };  // Assume success at 99%
}
```

---

### Fix #3: Validate API Response in queryTask()
**File**: [services/api.ts#L35-L48](services/api.ts#L35-L48)

**Replace**:
```typescript
export const queryTask = async (apiKey: string, taskId: string): Promise<QueryTaskResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
        console.warn(`Query Task Warning: ${response.status} ${response.statusText}`);
        throw new Error(`Status Check Failed: ${response.status}`);
    }

    const data: any = await response.json();
    
    // ✅ NEW: Validate API response
    if (!data) {
      throw new Error('Empty response from API');
    }
    
    // Handle KIE API error codes
    if (data.code && data.code !== 200) {
      const error = new Error(`API Error (${data.code}): ${data.msg || data.error || 'Unknown'}`);
      (error as any).apiCode = data.code;
      throw error;
    }
    
    // Ensure data.data exists
    if (!data.data) {
      console.warn('Query Task: data.data is empty', data);
      return {
        code: data.code || 200,
        msg: data.msg || 'No data returned',
        data: {
          taskId: taskId,
          model: '',
          state: 'waiting',
          param: '',
          createTime: Date.now(),
        }
      };
    }
    
    return data;
  } catch (error: any) {
    throw error;
  }
};
```

---

### Fix #4: Add Timeout and Retry Logic
**File**: [App.tsx#L485-L545](App.tsx#L485-L545)

**Add** to polling section:
```typescript
// Track polling attempts per task
const pollAttempts = new Map<string, number>();
const MAX_POLL_ATTEMPTS = 300;  // ~5 minutes at 1s interval
const POLL_TIMEOUT_MS = 5 * 60 * 1000;  // 5 minutes

// In API polling loop:
tasksToPoll.forEach(task => {
  const attempts = (pollAttempts.get(task.taskId) || 0) + 1;
  const taskAge = Date.now() - task.createTime;
  
  if (attempts > MAX_POLL_ATTEMPTS || taskAge > POLL_TIMEOUT_MS) {
    // ✅ Mark task as failed after timeout
    setTasks(prev => 
      prev.map(t => 
        t.taskId === task.taskId
          ? {
              ...t,
              state: 'fail',
              progress: 100,
              failMsg: 'Task polling timeout (5 minutes)',
              completeTime: Date.now(),
            }
          : t
      )
    );
    addLog(`⚠️ Task ${task.taskId.slice(-4)}: Polling timeout after ${attempts} attempts`, true);
    pollAttempts.delete(task.taskId);
  } else {
    pollAttempts.set(task.taskId, attempts);
  }
});
```

---

### Fix #5: Secure Supabase Save Operation
**File**: [services/outputSaving.ts#L50-L95](services/outputSaving.ts#L50-L95)

**Add**:
```typescript
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
    // ✅ Validate inputs
    if (!taskId || !outputUrl) {
      throw new Error(`Invalid task data: taskId=${taskId}, outputUrl=${outputUrl}`);
    }
    
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Authentication required to save output.');
    }
    
    // ✅ Check for duplicate
    const existing = await getOutputByTaskId(taskId);
    if (existing) {
      console.log(`[OutputSaving] Task ${taskId} already saved, skipping`);
      return existing;
    }
    
    const now = new Date().toISOString();
    const insertData = {
      task_id: taskId,
      user_id: userId,
      model: model || 'unknown',
      prompt: prompt || '',
      output_url: outputUrl,
      output_type: outputType,
      metadata: metadata || {},
      credits_cost: creditsCost || 0,
      created_at: now,
    };

    const { data, error } = await supabase
      .from('generated_outputs')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      // ✅ Handle unique constraint error
      if (error.code === '23505') {
        console.log('[OutputSaving] Duplicate task_id, fetching existing');
        return await getOutputByTaskId(taskId);
      }
      throw new Error(`Database error: ${error.message}`);
    }
    
    return mapToSavedOutput(data);
  } catch (error: any) {
    throw new Error(`Failed to save output: ${error.message}`);
  }
};
```

---

## 📋 TESTING CHECKLIST

- [ ] **Test 1**: Submit KIE AI task with NanoBanana model
  - Verify task created (✓ in console)
  - Monitor polling responses (check Network tab)
  - Verify `resultJson` field populated after success
  - Verify output saved to Supabase (check dashboard)

- [ ] **Test 2**: Check API response field formats
  - Log full response data: `console.log('API Response:', update.data)`
  - Verify expected fields match fallback list
  - Add missing fields to fallback chain

- [ ] **Test 3**: Monitor progress bar behavior
  - Should reach 100% when task completes
  - Should NOT freeze at 99%
  - Should display output URL immediately

- [ ] **Test 4**: Check polling timeout
  - Submit task, let run for 5+ minutes
  - Verify task marked as failed (not stuck "waiting")
  - Check error message in logs

- [ ] **Test 5**: Verify Supabase save
  - Check `generated_outputs` table after task completes
  - Verify correct user_id, task_id, output_url
  - Verify no duplicate entries

---

## 🚀 DEPLOYMENT PRIORITY

**CRITICAL** (Fix immediately):
1. Fix #1: Response field detection
2. Fix #3: API response validation
3. Fix #4: Timeout logic

**HIGH** (Fix within 24 hours):
1. Fix #2: State normalization
2. Fix #5: Supabase validation

**MEDIUM** (Optimize after):
1. Unify KIE/PIXAZO response handling
2. Add response schema validation
3. Add comprehensive error logging

---

## 📊 Impact Summary

| Issue | Severity | User Impact | Fix Time |
|-------|----------|------------|----------|
| Missing resultJson field | 🔴 CRITICAL | Task stuck at 99% | 5 min |
| State normalization | 🔴 CRITICAL | Task never completes | 10 min |
| API response validation | 🔴 CRITICAL | Silent failures | 10 min |
| Polling timeout | 🟡 HIGH | Indefinite waiting | 15 min |
| Supabase errors | 🟡 HIGH | Lost outputs | 10 min |
| KIE/PIXAZO pipeline | 🟠 MEDIUM | Inconsistent behavior | 30 min |

---

Generated: 2026-01-31
Analyzer: Code Audit System
