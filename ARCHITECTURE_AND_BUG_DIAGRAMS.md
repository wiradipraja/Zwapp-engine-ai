# 📊 System Architecture & Bug Flow Diagrams

## 1. Current Task Processing Flow (BROKEN)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER INITIATES TASK                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
          ┌──────────────────────────────────────┐
          │  Form Submission (App.tsx L454)      │
          │  - Validate inputs                   │
          │  - Check API key                     │
          │  - Create task request               │
          └──────────────────────────┬───────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │ Is Pixazo Model?                │
                    │ (admin only)                    │
                    └────────────────┬────────────────┘
                     YES             │              NO
            ┌──────────────────┐     │     ┌────────────────────┐
            │ Direct Sync Call  │     │     │ KIE.AI Async Call  │
            │ - Flux Schnell    │     │     │ - NanoBanana       │
            │ - SDXL Inpaint    │     │     │ - Sora 2           │
            │ - Kling Motion    │     │     │ - Veo 3            │
            │                   │     │     │ - Grok             │
            │ ✅ Returns URL    │     │     │ ⏳ Returns TaskID   │
            └──────────────────┘     │     └────────────────────┘
                                     │
                                     ▼
          ┌──────────────────────────────────────┐
          │  Task Created in UI (setTasks)       │
          │  - state: 'waiting'                  │
          │  - progress: 1%                      │
          │  - taskId: xxx                       │
          └──────────────────────┬───────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ Progress Simulator      │ Polls Every 1s
                    │ (Updates UI progress)   │
                    │ 1% → 90% (fast)         │
                    │ 90% → 99% (slow cap)    │
                    │ 99% (STUCK HERE)        │
                    └────────────────────────┘
                    ❌ NEVER REACHES 100%
                             │
                             ▼
              ┌─────────────────────────────┐
              │  API Polling Loop (L548)    │
              │  fetch /recordInfo?taskId   │
              └────────────┬────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │ Response Received            │
            │ (from KIE.AI)                │
            └──────────────┬──────────────┘
                           │
         ┌─────────────────┴────────────────────┐
         │ Extract Fields from Response          │
         │ (App.tsx L562-575)                   │
         └─────────────────┬────────────────────┘
                           │
    ┌──────────────────────┴───────────────────┐
    │ Check for result in:                     │
    │ 1. resultJson       ← Most check here    │
    │ 2. result                                │
    │ 3. output                                │
    │ 4. imageUrl                              │
    │ 5. imageUrl                              │
    │ 6. videoUrl                              │
    │ 7. video_url                             │
    │                                          │
    │ ❌ MISSING:                              │
    │ - resultUrls[0]     ← KIE uses this!    │
    │ - resultBody                             │
    │ - data.url (nested)                      │
    │ - data.image                             │
    │ - data.video                             │
    └──────────────────────┬──────────────────┘
                           │
                    ┌──────┴──────┐
                    │ resultJson? │
                    └──────┬──────┘
                   YES     │     NO
              ┌────────────┘     │
              │               ┌──▼─────────────┐
              │               │ resultJson =  │
              │               │ undefined     │
              │               └────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │ Normalize State      │
    │ (taskState.ts L47)   │
    └──────────┬───────────┘
               │
    ┌──────────┴──────────┐
    │ Detect Task Status   │
    │ from response.state  │
    │                      │
    │ ❌ WEAK DETECTION:  │
    │ - Doesn't check     │
    │   stateCode         │
    │ - Doesn't check     │
    │   statusCode        │
    │ - Numeric codes 2,3 │
    │   not recognized    │
    └──────────┬──────────┘
               │
        ┌──────┴──────┐
        │ State = ?   │
        └──────┬──────┘
           SUCCESS/FAIL  UNKNOWN
               │          │
               ▼          ▼
          ✅ Set to  ❌ Defaults to
          'success'  'waiting'
          or 'fail'      │
               │         │
               │    (Polling continues)
               ▼         │
    ┌───────────────────┐│
    │ Extract Output    ││
    │ from resultJson   ││
    │ (L647)            ││
    │                   ││
    │ ✅ URL found      ││
    │ ↓                 ││
    │ Save to           ││
    │ Supabase          ││
    │                   ││
    └───────────────────┘│
               │         │
               │ (No output URL)
               │         │
               │    ❌ STUCK
               │    at 99%
               │    forever ◄──┘
               │
               ▼
    ┌──────────────────────┐
    │ Task Complete        │
    │ - state: 'success'   │
    │ - progress: 100%     │
    │ - resultJson: URL    │
    │ - saved: true        │
    └──────────────────────┘
    ✅ USER SEES OUTPUT
```

---

## 2. API Response Format Variations

```
KIE.AI API Responses (Different per Model):

Model: NanoBanana
┌─────────────────────────────────────┐
│ {                                   │
│   "code": 200,                      │
│   "data": {                         │
│     "taskId": "task_123",           │
│     "state": "success",             │
│     "resultJson": "...",            │
│     "resultUrls": [  ◄─ BUG #1!    │
│       "https://..."                 │
│     ]                               │
│   }                                 │
│ }                                   │
└─────────────────────────────────────┘

Model: Sora 2
┌─────────────────────────────────────┐
│ {                                   │
│   "code": 200,                      │
│   "data": {                         │
│     "taskId": "task_456",           │
│     "stateCode": 2,     ◄─ BUG #2! │
│     "progress": 100,                │
│     "resultBody": {                 │
│       "videoUrl": "..."             │
│     }                               │
│   }                                 │
│ }                                   │
└─────────────────────────────────────┘

Model: Veo 3
┌─────────────────────────────────────┐
│ {                                   │
│   "code": 200,                      │
│   "data": {                         │
│     "taskId": "task_789",           │
│     "statusCode": 3,    ◄─ BUG #2! │
│     "stage": "completed",           │
│     "output": {                     │
│       "url": "..."      ◄─ BUG #1! │
│     }                               │
│   }                                 │
│ }                                   │
└─────────────────────────────────────┘

Model: Grok Imagine
┌─────────────────────────────────────┐
│ {                                   │
│   "code": 200,                      │
│   "data": {                         │
│     "taskId": "task_grok",          │
│     "state": 2,         ◄─ BUG #2! │
│     "data": {           ◄─ BUG #1! │
│       "image": "..."                │
│     }                               │
│   }                                 │
│ }                                   │
└─────────────────────────────────────┘

PIXAZO API (Synchronous)
┌─────────────────────────────────────┐
│ {                                   │
│   "status": "success",              │
│   "imageUrl": "https://..."         │
│ }                                   │
└─────────────────────────────────────┘
```

---

## 3. Bug #1: Field Detection Chain

```
Current Chain (8 fields):          Needed Chain (13+ fields):
┌─────────────────────┐             ┌──────────────────────────┐
│ resultJson          │             │ resultJson               │
├─────────────────────┤             ├──────────────────────────┤
│ result              │             │ resultUrls[0]  ◄ ADD    │
├─────────────────────┤             ├──────────────────────────┤
│ output              │             │ resultBody     ◄ ADD    │
├─────────────────────┤             ├──────────────────────────┤
│ imageUrl            │             │ result                   │
├─────────────────────┤             ├──────────────────────────┤
│ image_url           │             │ output                   │
├─────────────────────┤             ├──────────────────────────┤
│ videoUrl            │             │ imageUrl                 │
├─────────────────────┤             ├──────────────────────────┤
│ video_url           │             │ image_url                │
├─────────────────────┤             ├──────────────────────────┤
│ (fallback to t.x)   │             │ videoUrl                 │
│                     │             ├──────────────────────────┤
│ Result:             │             │ video_url                │
│ 90% of responses    │             ├──────────────────────────┤
│ NOT found!          │             │ data.url       ◄ ADD    │
│                     │             ├──────────────────────────┤
│ ❌ FREEZE AT 99%    │             │ data.image     ◄ ADD    │
│                     │             ├──────────────────────────┤
└─────────────────────┘             │ data.video     ◄ ADD    │
                                    ├──────────────────────────┤
                                    │ value.url      ◄ ADD    │
                                    ├──────────────────────────┤
                                    │ (fallback to t.x)        │
                                    │                          │
                                    │ Result:                  │
                                    │ 99% of responses found!  │
                                    │                          │
                                    │ ✅ 100% COMPLETE        │
                                    └──────────────────────────┘
```

---

## 4. Bug #2: State Detection Logic

```
Current Logic (Limited):          Improved Logic (Complete):

Input: data.stateCode = 2         Input: data.stateCode = 2
            │                                   │
            ▼                                   ▼
┌──────────────────────┐          ┌──────────────────────────┐
│ rawState = ""        │          │ rawState = "2"           │
│ (stateCode ignored!) │          │ (detected!)              │
└──────────┬───────────┘          └──────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────┐          ┌──────────────────────────┐
│ Check keywords       │          │ Check numeric codes      │
│ "success" in ""?     │          │ 2 === 2?                 │
│ NO                   │          │ YES → SUCCESS! ✅        │
│                      │          │                          │
│ "fail" in ""?        │          │ OR: "success" in "2"?    │
│ NO                   │          │ NO                       │
│                      │          │                          │
│ Default to WAITING   │          │ OR: has output?          │
│ ❌ STUCK!            │          │ YES → SUCCESS! ✅        │
└──────────────────────┘          └──────────────────────────┘

Field Name Detection:              Better Field Name Detection:
┌──────────────────────┐          ┌──────────────────────────┐
│ statusValue =        │          │ statusValue =            │
│   data.state OR      │          │   data.state OR          │
│   data.status        │          │   data.status OR         │
│                      │          │   data.stateCode OR      │
│ ❌ Missing:          │          │   data.statusCode OR     │
│ - stateCode          │          │   data.taskState OR      │
│ - statusCode         │          │   data.stage             │
│ - taskState          │          │                          │
│ - stage              │          │ ✅ 6 options!           │
└──────────────────────┘          └──────────────────────────┘
```

---

## 5. Bug #3: API Response Validation

```
Current Handling:                 Improved Handling:

fetch() → response                fetch() → response
    │                                  │
    ▼                                  ▼
if (!response.ok)              if (!response.ok)
  throw Error(status)             throw Error(status)
    │                                  │
    ▼                                  ▼
response.json()                response.json()
    │                          (try/catch) ◄ ADD
    ▼                                  │
return data                       Parse Error?
    │                          ❌ throw Error ◄ ADD
    ▼                                  │
No validation!              Return: parsed data
    │                                  │
    ▼                                  ▼
│ { code: 500, msg: "..." } │  if (data.code !== 200) ◄ ADD
│                            │    throw Error(apiCode)
│ Treated as SUCCESS!    │       │
│ ❌ SILENT FAIL         │       ▼
│                            │ data.code === 200?
│ resultJson = undefined │    YES → ✅ SUCCESS
│                            │    NO  → ❌ THROW ERROR
│ Progress frozen           │
│ Credits deducted!      │ if (!data.data) ◄ ADD
│                        │   return placeholder
│ ❌ User sees 99%        │
│    forever!             │ resultJson = extracted
                          │ ✅ Ready to save
                          │
                          │ ✅ Complete!
```

---

## 6. Bug #4: Missing Timeout Mechanism

```
Current Flow:                         Improved Flow:

Task Created                         Task Created
    │                                    │
    ▼                                    ▼
Polling Loop (Every 1s)          Polling Loop (Every 1s)
    │                                    │
    ├─ Attempt 1                        ├─ Attempt 1 (0s)
    ├─ Attempt 2                        ├─ Attempt 2 (1s)
    ├─ Attempt 3                        ├─ Attempt 3 (2s)
    ...                                 ...
    ├─ Attempt 100                      ├─ Attempt 100 (99s)
    ...                                 ...
    ├─ Attempt 200                      ├─ Attempt 200 (199s)
    ...                                 ...
    ├─ Attempt 300                      ├─ Attempt 300 (299s)
    │                                   │
    ✅ Complete? YES                    ✅ Complete? YES
    │ NO                                │ NO
    │                                   │ ✅ 5 min timeout?
    │                                   │ YES → ❌ FAIL
    │                                   │    Mark as failed
    │                                   │    Stop polling
    │                                   │    Show error
    │                                   │    ✅ USER KNOWS
    │
    │ Keep polling...                   (Continue monitoring
    │ (No timeout!)                      up to 5 minutes)
    │
    │ 1 hour later...
    │ Attempt 3600 (forever waiting)
    │
    ❌ USER: "WTF? Why is it stuck?"
```

---

## 7. Complete System Architecture (As-Is)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ZWAPP ENGINE v2                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Frontend (React + TypeScript)                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Components/                                                  │   │
│  │ - TaskForm.tsx (Input)                                       │   │
│  │ - StatusTerminal.tsx (Progress)                              │   │
│  │ - QueueList.tsx (Task list)                                  │   │
│  │ - Gallery/ (Output view)                                     │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
│                     │                                                 │
│  State Management (React Hooks)                                      │
│  ┌──────────────────▼───────────────────────────────────────────┐   │
│  │ App.tsx (Main)                                               │   │
│  │ - tasks: LocalTask[]                                         │   │
│  │ - Progress simulator (setInterval)                           │   │
│  │ - API polling loop (setInterval) ◄─ BUG #4                 │   │
│  │ - Output saving queue                                        │   │
│  │                                                              │   │
│  │ useEffect hooks:                                             │   │
│  │ 1. Auth session                                              │   │
│  │ 2. Credits refresh                                           │   │
│  │ 3. Progress + Polling ◄─ MAIN POLLING LOGIC                │   │
│  │ 4. Output persistence                                        │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
│                     │                                                 │
└─────────────────────┼────────────────────────────────────────────────┘
                      │
         ┌────────────┴───────────┐
         │ API Routes via Vercel  │
         │ (vercel.json)          │
         └────────┬───────────────┘
         ┌────────┴────────┐
         │ /api/proxy/*    │  /api/pixazo/*
         │ → KIE.AI        │  → PIXAZO
         │                 │
         ▼                 ▼
    ┌─────────────────────────────────────┐
    │         Backend APIs                 │
    │                                      │
    │  KIE.AI              PIXAZO         │
    │  ┌─────────────────┐ ┌────────────┐ │
    │  │ POST /createTask│ │ Sync calls │ │
    │  │ GET /recordInfo │ │ - SDXL     │ │
    │  │                 │ │ - Flux     │ │
    │  │ Models:         │ │ - Kling    │ │
    │  │ - NanoBanana    │ │            │ │
    │  │ - Sora 2        │ │ Response:  │ │
    │  │ - Veo 3         │ │ Direct URL │ │
    │  │ - Grok          │ │            │ │
    │  │                 │ │            │ │
    │  │ Response:       │ │ ✅ No poll │ │
    │  │ Task ID + Poll  │ │ needed     │ │
    │  │ ❌ Async        │ │            │ │
    │  └─────────────────┘ └────────────┘ │
    │                                      │
    │  ◄─ BUG ZONE: Different pipelines   │
    └──────────────────────────────────────┘

    ┌──────────────────────────────────────┐
    │      Database (Supabase)             │
    │                                      │
    │  Tables:                             │
    │  ┌────────────────────────────────┐  │
    │  │ generated_outputs              │  │
    │  │ - id: uuid                     │  │
    │  │ - user_id: uuid                │  │
    │  │ - task_id: text (UNIQUE)       │  │
    │  │ - output_url: text             │  │
    │  │ - model: text                  │  │
    │  │ - prompt: text                 │  │
    │  │ - created_at: timestamp        │  │
    │  │ - metadata: jsonb              │  │
    │  └────────────────────────────────┘  │
    │                                      │
    │  ◄─ BUG #5: Validation missing      │
    └──────────────────────────────────────┘
```

---

## 8. Data Flow During Task Completion

```
SUCCESS SCENARIO (After fixes):

API Response                Task State Update            Save to DB
┌────────────────────┐     ┌──────────────────┐       ┌───────────────┐
│ {                  │     │ state: 'waiting' │       │ Check output  │
│   code: 200,       │────→│ ↓                │──────→│ URL present?  │
│   data: {          │     │ state: 'success' │       │ ✅ YES        │
│     state: 2,      │     │ progress: 100%   │       │ ↓             │
│     resultUrls: [ │     │ resultJson: URL  │       │ Validate:     │
│       "https://x"  │     │ (extracted)      │       │ - taskId ✅   │
│     ]              │     └──────────────────┘       │ - outputUrl ✅│
│   }                │                                │ - userId ✅   │
│ }                  │                                │ ↓             │
└────────────────────┘                                │ INSERT into   │
                                                      │ generated_    │
                                                      │ outputs       │
                                                      │ ✅ SUCCESS    │
                                                      └───────────────┘


FAILURE SCENARIO (After fixes):

API Error                  Task State Update            No Save (OK)
┌────────────────────┐     ┌──────────────────┐       ┌───────────────┐
│ {                  │     │ state: 'waiting' │       │ No output URL │
│   code: 400,       │────→│ ↓                │──────→│ ❌ SKIP save  │
│   msg: "error"     │     │ state: 'fail'    │       │ ↓             │
│ }                  │     │ progress: 100%   │       │ Show error    │
│                    │     │ failMsg: "msg"   │       │ message       │
│                    │     │ resultJson: null │       │ ✅ USER KNOWS │
└────────────────────┘     └──────────────────┘       └───────────────┘


TIMEOUT SCENARIO (After fixes):

5 Minutes No Response      Task State Update            User Notified
┌────────────────────┐     ┌──────────────────┐       ┌───────────────┐
│ Polling attempts:  │     │ state: 'waiting' │       │ Task failed:  │
│ 0s → 300s          │     │ ↓                │       │ "Timeout      │
│ No response yet    │────→│ state: 'fail'    │──────→│ after 5 min"  │
│                    │     │ progress: 100%   │       │ ✅ CLEAR MSG  │
│                    │     │ failMsg: "timeout"       │               │
│                    │     │ resultJson: null │       │ Credits NOT   │
│                    │     └──────────────────┘       │ deducted      │
└────────────────────┘                                └───────────────┘
```

---

## 9. Fix Impact Summary

```
Before Fixes:
┌──────────────────────────────────────────────────┐
│ Task Success Rate:  ~70%                         │
│ Stuck at 99%:       ~25% of tasks                │
│ Failed saves:       ~5% of completed tasks       │
│ Avg wait time:      Indefinite                   │
│ User frustration:   🔴 VERY HIGH                 │
└──────────────────────────────────────────────────┘

After Fixes:
┌──────────────────────────────────────────────────┐
│ Task Success Rate:  >99%                         │
│ Stuck at 99%:       ~0% of tasks                 │
│ Failed saves:       <1% of completed tasks       │
│ Avg wait time:      10-300s (depending on model) │
│ User frustration:   🟢 MINIMAL                   │
└──────────────────────────────────────────────────┘
```

---

Generated: 2026-01-31  
Format: Visual Flow Diagrams  
Purpose: Architecture Understanding + Bug Visualization
