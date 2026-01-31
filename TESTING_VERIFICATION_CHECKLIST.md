# ✅ VERIFICATION & TESTING CHECKLIST

## Pre-Implementation Checklist

- [ ] **Backup Code**
  - [ ] `git status` - check for uncommitted changes
  - [ ] `git commit -am "pre-bugfix-backup"` - commit current state
  - [ ] `git branch bugfix/99-percent-freeze` - create feature branch

- [ ] **Review Documentation**
  - [ ] Read BUG_QUICK_REFERENCE.md
  - [ ] Read BUG_ANALYSIS_99_PERCENT_FREEZE.md
  - [ ] Review all 5 fixes in FIXES_IMPLEMENTATION_GUIDE.md
  - [ ] Check diagrams in ARCHITECTURE_AND_BUG_DIAGRAMS.md

- [ ] **Set Up Testing Environment**
  - [ ] Node.js + npm installed
  - [ ] Dev server running (`npm run dev`)
  - [ ] Browser console open (F12)
  - [ ] Network tab visible (F12)
  - [ ] Supabase dashboard open in new tab

---

## Implementation Verification

### Phase 1: Code Changes

#### Fix #1: App.tsx resultJson Fallback Chain

- [ ] **Location**: App.tsx, lines 562-575
- [ ] **Change Type**: Field name expansion
- [ ] **Verification**:
  - [ ] Line 562: Check `resultJson:` assignment starts
  - [ ] Line 563: Verify `resultUrls?.[0]` added (4th option)
  - [ ] Line 564: Verify `resultBody` added (5th option)
  - [ ] Line 568: Verify `data?.url` added (nested)
  - [ ] Line 569: Verify `data?.image` added (nested image)
  - [ ] Line 570: Verify `data?.video` added (nested video)
  - [ ] Line 571: Verify `value?.url` added (alt nesting)
  - [ ] Line 572: Fallback to `t.resultJson` unchanged
  - [ ] **Syntax Check**: No trailing commas or missing pipes

```javascript
// Verify in console after making change:
// Find the line and count the || operators
// Should be 12+ options, not just 8
```

---

#### Fix #2: taskState.ts Normalization

- [ ] **Location**: services/taskState.ts, lines 47-95
- [ ] **Change Type**: State detection expansion
- [ ] **Verification**:
  - [ ] Line 48: Check `statusValue` now includes `stateCode` and `statusCode`
  - [ ] Line 48: Check includes `taskState` and `stage`
  - [ ] Line 52: Check `altStatusValue` not duplicating
  - [ ] Line 67: Check numeric state code mapping (0, 1, 2, 3, 100, 200, etc.)
  - [ ] Line 68: Check success keyword includes '2' and '200'
  - [ ] Line 69: Check fail keyword includes '3' and '400', '500'
  - [ ] Line 70: Check waiting keyword includes '0', '1', '100'
  - [ ] Line 78: Check `hasOutput` uses new field names
  - [ ] Line 80+: Verify new output detection logic
  - [ ] **Syntax Check**: All string comparisons use `===` or `.includes()`

```javascript
// Verify in console:
const testCases = [
  { state: 2 },        // Should return 'success'
  { status: 3 },       // Should return 'fail'
  { stateCode: 200 },  // Should return 'success'
  { progress: 100 },   // Should return 'success'
];
// Run normalizeTaskState() on each
```

---

#### Fix #3: api.ts queryTask Validation

- [ ] **Location**: services/api.ts, lines 35-48
- [ ] **Change Type**: Response validation
- [ ] **Verification**:
  - [ ] Line 35: Function signature unchanged
  - [ ] Line 44: HTTP status check with `!response.ok` exists
  - [ ] Line 45: Error thrown includes response status
  - [ ] Line 47: JSON parsing wrapped in try/catch
  - [ ] Line 49: Empty response check (`!data`)
  - [ ] Line 51: API error code check (`data.code !== 200`)
  - [ ] Line 52: Error includes `data.code` and `data.msg`
  - [ ] Line 55: Placeholder response for missing `data.data`
  - [ ] Line 60: Return statement unchanged
  - [ ] **Syntax Check**: All try/catch blocks properly closed

```javascript
// Verify in console:
// Mock API responses and test:
const mockError = { code: 400, msg: 'Bad request' };
// Should throw error with "API Error (400)"

const mockEmpty = { code: 200, data: null };
// Should return placeholder with taskId
```

---

#### Fix #4: App.tsx Polling Timeout (OPTIONAL - HIGH PRIORITY)

- [ ] **Location**: App.tsx, lines 485-545
- [ ] **Change Type**: Timeout tracking
- [ ] **Verification**:
  - [ ] New Map created: `pollTimeouts`
  - [ ] Constants defined: `POLL_TIMEOUT_MS = 5 * 60 * 1000`
  - [ ] Constants defined: `MAX_POLL_ATTEMPTS = 300`
  - [ ] Timeout check in polling loop
  - [ ] Task marked as 'fail' on timeout
  - [ ] Log message generated
  - [ ] Timeout removed from map
  - [ ] **Syntax Check**: All interval clearing works

```javascript
// Verify in console:
// Submit task with intentionally slow API
// After 5 minutes, verify:
// - Task shows 'fail' state
// - Not stuck in 'waiting'
```

---

#### Fix #5: outputSaving.ts Validation (OPTIONAL - HIGH PRIORITY)

- [ ] **Location**: services/outputSaving.ts, lines 50-95
- [ ] **Change Type**: Input validation + error handling
- [ ] **Verification**:
  - [ ] Input validation for `taskId` (must be string)
  - [ ] Input validation for `outputUrl` (must be string)
  - [ ] Error thrown with descriptive message
  - [ ] Duplicate check before insert
  - [ ] Error code handling: `23505` (unique constraint)
  - [ ] Error code handling: `42501` (RLS policy)
  - [ ] Helper function `mapToSavedOutput()` exists
  - [ ] Console logs at key points
  - [ ] **Syntax Check**: All database operations use `.select().single()`

```javascript
// Verify in console:
// Check Supabase logs during save
// Should see specific error codes, not generic errors
```

---

## Testing Phase 1: Basic Functionality

### Test 1: Task Creation & Polling

**Objective**: Verify task created and polling starts

```
Steps:
1. Open app, ensure API key configured
2. Select "NanoBanana Gen" model
3. Enter prompt: "A red ball"
4. Click GENERATE IMAGE
5. Open DevTools → Console
6. Open DevTools → Network tab
7. Wait 10 seconds

Expected Results:
✅ Task appears in queue with ID
✅ Progress bar visible, animating
✅ Console shows: "Initiating generation sequence..."
✅ Network tab shows POST /createTask (201-202 status)
✅ Network tab shows GET /recordInfo requests (every ~1s)
✅ At least 10 polling requests visible
```

**Checklist**:
- [ ] Task created with correct model name
- [ ] Progress starts at 1%
- [ ] Progress animates toward 99%
- [ ] Polling requests visible in Network tab
- [ ] No console errors in red

---

### Test 2: API Response Examination

**Objective**: Verify API returns data we can extract

```
Steps:
1. In Network tab, find a /recordInfo response
2. Click on it
3. Go to "Response" tab
4. Examine JSON structure
5. Look for these fields:
   - data.resultJson
   - data.resultUrls
   - data.result
   - data.output
   - data.resultBody
   - data.data.url
   - data.data.image
   - data.data.video
   
Expected Results:
✅ One of these fields contains the output URL
✅ URL starts with "https://" or "data:"
✅ state or stateCode field shows "success" or "2"
✅ progress field shows 100
```

**Checklist**:
- [ ] Response is valid JSON (not HTML error)
- [ ] code field equals 200 (not error code)
- [ ] data field is object (not null)
- [ ] At least one output field present
- [ ] State field readable

---

### Test 3: Task Completion & Output

**Objective**: Verify task reaches 100% and output extracted

```
Steps:
1. Let task from Test 1 complete (1-5 minutes)
2. Watch progress bar
3. When progress reaches 99%, observe closely
4. In Console, run:
   const task = tasks[tasks.length - 1];
   console.log('Task state:', task.state);
   console.log('Progress:', task.progress);
   console.log('Result JSON:', task.resultJson);
   console.log('Result:', task.result);

Expected Results:
✅ Progress reaches 100% (not stuck at 99%)
✅ Task state is 'success' (not 'waiting')
✅ resultJson has value (not empty/undefined)
✅ Either resultJson OR result contains URL
✅ Task shows green checkmark in queue
✅ Output image/video visible in task details
```

**Checklist**:
- [ ] No progress bar stuck
- [ ] Task state is success (not waiting)
- [ ] Output URL populated
- [ ] Output visible in UI
- [ ] No error messages

---

### Test 4: Supabase Save Verification

**Objective**: Verify output saved to database

```
Steps:
1. From Test 3, note the task ID
2. Open Supabase dashboard
3. Go to SQL Editor
4. Run query:
   SELECT * FROM generated_outputs 
   WHERE task_id = 'TASK_ID_FROM_TEST_3'
   LIMIT 1;
5. Check results

Expected Results:
✅ One row returned
✅ task_id matches
✅ output_url not null/empty
✅ model field filled
✅ user_id matches logged-in user
✅ created_at is recent timestamp
✅ metadata is JSON object (not null)
```

**Checklist**:
- [ ] Record exists in database
- [ ] All required fields populated
- [ ] No duplicates (only 1 row returned)
- [ ] URL is valid HTTP/HTTPS or data URI
- [ ] User ID matches current user

---

### Test 5: Error Handling

**Objective**: Verify errors don't freeze progress

```
Steps:
1. Temporarily modify API key to invalid value
2. Create new task
3. Watch progress bar
4. Let it try to poll for 30 seconds
5. Check console for error messages

Expected Results:
✅ Progress animates to 99% (visual)
✅ Console shows polling warnings (not errors)
✅ After ~30s, task doesn't freeze permanently
✅ Can close task and create new one
✅ Previous invalid task still shows but with fail state
```

**Checklist**:
- [ ] No page crash
- [ ] No frozen UI
- [ ] Error messages readable in console
- [ ] Can continue using app after error

---

## Testing Phase 2: Advanced Scenarios

### Test 6: Multiple Simultaneous Tasks

**Objective**: Verify polling works with multiple tasks

```
Steps:
1. Create Task A (NanoBanana)
2. While A is polling, Create Task B (NanoBanana)
3. Create Task C (Sora 2 text-to-video)
4. Watch all 3 tasks in queue
5. Let all 3 complete

Expected Results:
✅ All 3 show in queue
✅ Polling works for all simultaneously
✅ Progress bars animate independently
✅ All 3 reach 100% completion
✅ All 3 saved to Supabase
✅ No interference between tasks
```

**Checklist**:
- [ ] Queue shows all tasks
- [ ] Each task's progress updates
- [ ] No task blocks others
- [ ] All complete successfully
- [ ] All 3 rows in database

---

### Test 7: Task Timeout (If Implemented)

**Objective**: Verify timeout prevents indefinite waiting

```
Steps:
1. Modify /api/proxy endpoint to return invalid response
2. Create task
3. Let polling run for 5+ minutes
4. Check if task marked as failed

Expected Results (If Fix #4 implemented):
✅ After 5 minutes, task state changes to 'fail'
✅ failMsg shows "Timeout after X attempts"
✅ Polling stops for this task
✅ User sees failure (not 99% freeze)
✅ Progress shows 100% (complete, but failed)
```

**Checklist**:
- [ ] Timeout occurs at correct time (5 min)
- [ ] Task marked as 'fail'
- [ ] Error message clear
- [ ] Polling stopped

---

### Test 8: Different Model Types

**Objective**: Verify fixes work for all models

**For each model type, run quick test:**

- [ ] **NanoBanana Gen** (KIE)
  - [ ] Task completes
  - [ ] Output extracted
  - [ ] Saved to DB

- [ ] **Sora 2 Text-to-Video** (KIE, video model)
  - [ ] Task completes
  - [ ] Video URL extracted
  - [ ] Video playable

- [ ] **Veo 3 Text-to-Video** (KIE, different API)
  - [ ] Task completes
  - [ ] Output extracted
  - [ ] Different response format handled

- [ ] **Grok Text-to-Image** (KIE)
  - [ ] Task completes
  - [ ] Output extracted
  - [ ] Nested data.image field handled

- [ ] **Flux Schnell** (PIXAZO, if admin)
  - [ ] Immediate return (no polling)
  - [ ] Output available
  - [ ] Saved to DB

**Expected**: All models complete without freezing

---

## Testing Phase 3: Edge Cases

### Test 9: Network Interruption

**Objective**: Verify recovery after network issues

```
Steps:
1. Create task (NanoBanana)
2. While polling, turn off internet
3. Wait 5 seconds
4. Turn internet back on
5. Watch if polling resumes

Expected Results:
✅ Console shows connection errors (warnings, not crashes)
✅ After reconnect, polling resumes
✅ Task eventually completes
✅ Output extracted and saved
```

---

### Test 10: Browser Tab Background

**Objective**: Verify polling works when tab in background

```
Steps:
1. Create task (NanoBanana)
2. Let it start polling
3. Switch to different browser tab
4. Wait for task to complete (5 min)
5. Switch back to original tab

Expected Results:
✅ Task completed while in background
✅ Progress shows 100%
✅ Output available
✅ Output saved to DB
```

---

### Test 11: Page Refresh During Task

**Objective**: Verify task state persists after refresh

```
Steps:
1. Create task (NanoBanana)
2. Wait until progress ~50%
3. Press F5 (refresh page)
4. Log back in if needed
5. Check if task still visible

Expected Results (Before fix):
❌ Task lost after refresh

Expected Results (After fix):
✅ Task might not persist in local state (expected)
✅ Can query Supabase for completed tasks
✅ Gallery shows output if completed
✅ No data lost
```

---

## Performance Testing

### Test 12: Polling Frequency

**Objective**: Verify polling not overwhelming API

```
Steps:
1. Create 5 tasks simultaneously
2. Open Network tab
3. Count /recordInfo requests in 10 seconds
4. Calculate requests per second

Expected Results:
✅ ~10 requests in 10 seconds (1 per task per second)
✅ No 429 (Too Many Requests) errors
✅ No DDoS-like behavior
✅ Server responds within 500ms each
```

---

### Test 13: Memory Usage

**Objective**: Verify no memory leaks during polling

```
Steps:
1. Open DevTools → Memory tab
2. Take heap snapshot (baseline)
3. Create and complete 20 tasks over 1 hour
4. Take another heap snapshot

Expected Results:
✅ Memory increases initially (normal)
✅ Memory stabilizes (not continuously growing)
✅ No detached DOM nodes accumulating
✅ No unremoved event listeners
```

---

## Regression Testing

### Test 14: Existing Features Still Work

Verify these existing features not broken:

- [ ] **Authentication**
  - [ ] Login works
  - [ ] Logout works
  - [ ] Session persists

- [ ] **API Key Management**
  - [ ] Can save KIE API key
  - [ ] Can save PIXAZO API key
  - [ ] Keys persist after refresh

- [ ] **Gallery**
  - [ ] Can view past outputs
  - [ ] Can delete outputs
  - [ ] Pagination works

- [ ] **Settings**
  - [ ] Can open settings modal
  - [ ] Can update API keys
  - [ ] Settings save correctly

- [ ] **UI/UX**
  - [ ] Sidebar navigation works
  - [ ] Module switching works
  - [ ] Progress bar displays correctly
  - [ ] Toast notifications appear
  - [ ] Error messages clear

---

## Final Verification

### Sign-Off Checklist

Before marking as "FIXED":

- [ ] All 5 fixes implemented correctly
- [ ] No syntax errors (npm run build succeeds)
- [ ] All tests pass (Phase 1 + 2 + 3)
- [ ] No new console errors
- [ ] Performance acceptable
- [ ] No existing features broken
- [ ] Code committed with good messages
- [ ] Documentation updated
- [ ] Change logged in CHANGELOG.md

### Deploy Checklist

Before deploying to production:

- [ ] Tested on staging environment for 24 hours
- [ ] Monitored error logs (no new errors)
- [ ] Verified credit system still works
- [ ] Verified Supabase operations
- [ ] Backup of database created
- [ ] Team notified of changes
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## Troubleshooting During Testing

### Problem: Task still stuck at 99%

**Diagnosis**:
1. Check: Did Fix #1 get applied? (resultJson fallback)
2. Check: API response in Network tab - what field has the URL?
3. Add that field to the fallback chain in Fix #1

**Solution**: Search for the missing field name in API response, add to fallback chain

---

### Problem: Polling never stops

**Diagnosis**:
1. Check: Did Fix #4 get applied? (Timeout)
2. Check: Is task state staying "waiting"?
3. Check: Did Fix #2 get applied? (State normalization)

**Solution**: Verify task state field recognized, implement timeout if not

---

### Problem: Output not saving to Supabase

**Diagnosis**:
1. Check: Is resultJson populated? (Check console)
2. Check: Supabase RLS policies
3. Check: User authentication status
4. Check: Disk space in Supabase

**Solution**: Run Fix #5 diagnostics, check RLS policies

---

### Problem: API validation throwing too many errors

**Diagnosis**:
1. Check: Is KIE API actually returning errors?
2. Check: Are error codes parsed correctly?

**Solution**: Log raw API response, adjust error handling in Fix #3

---

## Summary

**Total Tests**: 14 main tests + edge cases  
**Estimated Time**: 2-3 hours  
**Success Criteria**: All tests pass with ✅ marks  
**Sign-Off**: When all sections complete

**After Testing**: 🚀 Ready for production deployment

---

Last Updated: 2026-01-31  
Version: 1.0  
Author: Code Audit System
