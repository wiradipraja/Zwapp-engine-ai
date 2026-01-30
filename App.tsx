import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'reactflow/dist/style.css';
import { createTask, queryTask } from './services/api';
import { supabase, signOut } from './services/supabase';
import { generateVeo3Video } from './services/veo3Generation';
import { fetchUserCredits, formatCreditsShort, getCreditCost } from './services/credits';
import { saveOutputToSupabase, getOutputByTaskId } from './services/outputSaving';
import { generateSDXLImage, generateInpaintImage } from './services/pixazo';
import { MotionControlInput, NanoBananaInput, ImageEditInput, ZImageInput, Flux2Input, Flux2ProTextInput, Flux2ProImageInput, Flux2FlexTextInput, Flux2FlexImageInput, QwenTextToImageInput, Sora2CharactersInput, Sora2TextToVideoInput, Sora2ImageToVideoInput, Sora2ProTextToVideoInput, Sora2ProImageToVideoInput, Veo3TextToVideoInput, Veo3ImageToVideoInput, Veo3ReferenceToVideoInput, Veo3Input, GrokImageToVideoInput, GrokImageToImageInput, GrokTextToImageInput, GrokUpscaleInput, StableDiffusionTextInput, StableDiffusionInpaintInput, LocalTask } from './types';
import { TaskForm } from './components/TaskForm';
import { NanoBananaGenForm } from './components/NanoBananaGenForm';
import { NanoBananaEditForm } from './components/NanoBananaEditForm';
import { NanoBananaProForm } from './components/NanoBananaProForm';
import { ImageEditForm } from './components/ImageEditForm';
import { QwenTextToImageForm } from './components/QwenTextToImageForm';
import { ZImageForm } from './components/ZImageForm';
import { Flux2ProTextForm } from './components/Flux2ProTextForm';
import { Flux2ProImageForm } from './components/Flux2ProImageForm';
import { Flux2FlexTextForm } from './components/Flux2FlexTextForm';
import { Flux2FlexImageForm } from './components/Flux2FlexImageForm';
import { StableDiffusionTextForm } from './components/StableDiffusionTextForm';
import { StableDiffusionInpaintForm } from './components/StableDiffusionInpaintForm';
import { Sora2CharactersForm } from './components/Sora2CharactersForm';
import { Sora2TextToVideoForm } from './components/Sora2TextToVideoForm';
import { Sora2ImageToVideoForm } from './components/Sora2ImageToVideoForm';
import { Sora2ProTextToVideoForm } from './components/Sora2ProTextToVideoForm';
import { Sora2ProImageToVideoForm } from './components/Sora2ProImageToVideoForm';
import { Veo3TextToVideoForm } from './components/Veo3TextToVideoForm';
import { Veo3ImageToVideoForm } from './components/Veo3ImageToVideoForm';
import { Veo3ReferenceToVideoForm } from './components/Veo3ReferenceToVideoForm';
import { GrokImageToVideoForm } from './components/GrokImageToVideoForm';
import { GrokTextToImageForm } from './components/GrokTextToImageForm';
import { GrokImageToImageForm } from './components/GrokImageToImageForm';
import { GrokUpscaleForm } from './components/GrokUpscaleForm';
import { StatusTerminal } from './components/StatusTerminal';
import { QueueList } from './components/QueueList';
import { AuthForm } from './components/AuthForm';
import { SettingsModal } from './components/SettingsModal';
import SpacesWorkspace from './components/Spaces/SpacesWorkspace';
import GalleryView from './components/Gallery/GalleryView';
import Sidebar, { MenuSection, ModuleType } from './components/layout/Sidebar';
import PublicLanding from './components/layout/PublicLanding';
import Toast, { useToast, ToastMessage } from './components/ui/Toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { normalizeTaskState, getFailureReason } from './services/taskState';

type NanoBananaType = 'gen' | 'edit' | 'pro';
type Flux2Type = 'pro-text' | 'pro-image' | 'flex-text' | 'flex-image';
type AppView = 'landing' | 'auth' | 'app';
type KieInput =
  | MotionControlInput
  | NanoBananaInput
  | ImageEditInput
  | ZImageInput
  | Flux2Input
  | QwenTextToImageInput
  | Sora2CharactersInput
  | Sora2TextToVideoInput
  | Sora2ImageToVideoInput
  | Sora2ProTextToVideoInput
  | Sora2ProImageToVideoInput
  | Veo3Input
  | GrokImageToVideoInput
  | GrokImageToImageInput
  | GrokTextToImageInput
  | GrokUpscaleInput;
type PixazoInput = StableDiffusionTextInput | StableDiffusionInpaintInput;
type AppInput = KieInput | PixazoInput;

const extractOutputUrl = (resultJson?: string): string => {
  if (!resultJson) return '';
  let parsed: any = resultJson;
  if (typeof resultJson === 'string') {
    try {
      parsed = JSON.parse(resultJson);
    } catch (_err) {
      if (resultJson.startsWith('http') || resultJson.startsWith('data:')) return resultJson;
      return '';
    }
  }

  if (!parsed) return '';
  if (parsed.resultUrls?.[0]) return parsed.resultUrls[0];
  if (parsed.images?.[0]?.url) return parsed.images[0].url;
  if (parsed.image?.url) return parsed.image.url;
  if (parsed.output?.[0]) return parsed.output[0];
  if (parsed.url) return parsed.url;
  if (parsed.data?.url) return parsed.data.url;
  if (parsed.data?.images?.[0]?.url) return parsed.data.images[0].url;
  if (parsed.video?.url) return parsed.video.url;
  if (parsed.video_url) return parsed.video_url;
  if (typeof parsed === 'string' && parsed.startsWith('http')) return parsed;
  return '';
};

const inferOutputType = (url: string, model: string): 'image' | 'video' | 'text' => {
  const lowerUrl = (url || '').toLowerCase();
  if (lowerUrl.startsWith('data:text')) return 'text';
  if (lowerUrl.match(/\.(mp4|mov|webm|mkv|avi)$/)) return 'video';
  if (model.toLowerCase().includes('video')) return 'video';
  return 'image';
};

const normalizeProgress = (value: any): number | null => {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (num > 0 && num <= 1) return Math.round(num * 100);
  return Math.max(0, Math.min(100, Math.round(num)));
};

const extractPromptFromParam = (param: string): string => {
  if (!param) return '';
  try {
    const data: any = JSON.parse(param);
    return (
      data.prompt ||
      data.text ||
      data.caption ||
      data.description ||
      data.character_prompt ||
      data.safety_instruction ||
      data.negative_prompt ||
      ''
    );
  } catch (_err) {
    return '';
  }
};

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // View State - Landing, Auth, or Main App
  const [currentView, setCurrentView] = useState<AppView>('landing');
  
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App State
  const [apiKey, setApiKey] = useState('');
  const [pixazoKey, setPixazoKey] = useState('');
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>('motion-control');
  const [expandedSection, setExpandedSection] = useState<MenuSection | null>(null);
  const [nanoBananaType, setNanoBananaType] = useState<NanoBananaType>('gen');
  const [flux2Type, setFlux2Type] = useState<Flux2Type>('pro-text');
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Credit refresh trigger - increment to force credit balance refresh
  const [creditRefreshTrigger, setCreditRefreshTrigger] = useState(0);
  
  // Credit balance state for header display
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);

  // Toast notifications
  const toast = useToast();

  // Polling Interval Ref
  const pollIntervalRef = useRef<number | null>(null);
  const savedTaskIdsRef = useRef<Set<string>>(new Set());

  // 1. Check for Supabase Session and LocalStorage API Key on Mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      // If already logged in, go to app
      if (session) {
        setCurrentView('app');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setCurrentView('app');
      } else {
        setCurrentView('landing');
      }
    });

    // Load API Keys from LocalStorage
    const storedKey = localStorage.getItem('kie_api_key');
    if (storedKey) {
        setApiKey(storedKey);
    }
    const storedPixazoKey = localStorage.getItem('pixazo_api_key');
    if (storedPixazoKey) {
        setPixazoKey(storedPixazoKey);
    }

    return () => subscription.unsubscribe();
  }, []);

  // Fetch credits when apiKey changes or when creditRefreshTrigger changes
  useEffect(() => {
    const loadCredits = async () => {
      if (!apiKey || apiKey.trim() === '') {
        setCreditBalance(null);
        return;
      }

      setIsLoadingCredits(true);
      try {
        const credits = await fetchUserCredits(apiKey);
        setCreditBalance(credits);
        console.log('[App] Credits loaded:', credits);
      } catch (error) {
        console.error('[App] Failed to load credits:', error);
        setCreditBalance(null);
      } finally {
        setIsLoadingCredits(false);
      }
    };

    loadCredits();
    
    // Auto-refresh credits every 30 seconds
    const intervalId = setInterval(loadCredits, 30000);
    return () => clearInterval(intervalId);
  }, [apiKey, creditRefreshTrigger]);

  const addLog = (msg: string, isError: boolean = false) => {
    setLogs(prev => [`> ${msg}`, ...prev].slice(0, 50));
    // Show toast notification for important messages
    if (isError || msg.includes('ERROR') || msg.includes('Critical') || msg.includes('✗')) {
      toast.error(msg);
    } else if (msg.includes('success') || msg.includes('Success') || msg.includes('✓')) {
      toast.success(msg);
    }
  };

  const handleSaveApiKey = (kieKey: string, pixazoApiKey: string) => {
      setApiKey(kieKey);
      setPixazoKey(pixazoApiKey);
      localStorage.setItem('kie_api_key', kieKey);
      localStorage.setItem('pixazo_api_key', pixazoApiKey);
      
      addLog('System Configuration Updated: API Keys Saved.');
  };

  const handleLogout = async () => {
      await signOut();
      addLog('Session Terminated.');
      setSession(null);
      setCurrentView('landing');
  };

  const handleCreateTask = async (input: AppInput) => {
    const isPixazoTask = activeModule === 'stable-diffusion-text' || activeModule === 'stable-diffusion-inpaint';
    if (isPixazoTask) {
        if (!pixazoKey) {
            setIsSettingsOpen(true);
            addLog('ERROR: Pixazo API Key missing. Please configure in Settings.', true);
            return;
        }
    } else if (!apiKey) {
        setIsSettingsOpen(true);
        addLog('ERROR: API Key missing. Please configure in Settings.', true);
        return;
    }

    setIsSubmitting(true);
    
    // Check if this is a Veo 3.1 task (uses different API endpoint)
    const isVeo3Task = activeModule.startsWith('veo3-');
    
    let modelName = '';
    if (activeModule === 'motion-control') modelName = 'kling-2.6/motion-control';
    else if (activeModule === 'nano-banana-gen') modelName = 'google/nano-banana';
    else if (activeModule === 'nano-banana-edit') modelName = 'google/nano-banana-edit';
    else if (activeModule === 'nano-banana-pro') modelName = 'nano-banana-pro';
    else if (activeModule === 'qwen-text-to-image') modelName = 'qwen/text-to-image';
    else if (activeModule === 'qwen-image-to-image') modelName = 'qwen/image-to-image';
    else if (activeModule === 'z-image') modelName = 'z-image';
    else if (activeModule === 'flux2-pro-text') modelName = 'flux-2/pro-text-to-image';
    else if (activeModule === 'flux2-pro-image') modelName = 'flux-2/pro-image-to-image';
    else if (activeModule === 'flux2-flex-text') modelName = 'flux-2/flex-text-to-image';
    else if (activeModule === 'flux2-flex-image') modelName = 'flux-2/flex-image-to-image';
    else if (activeModule === 'sora2-characters') modelName = 'sora-2-characters';
    else if (activeModule === 'sora2-text-to-video') modelName = 'sora-2-text-to-video';
    else if (activeModule === 'sora2-image-to-video') modelName = 'sora-2-image-to-video';
    else if (activeModule === 'sora2-pro-text-to-video') modelName = 'sora-2-pro-text-to-video';
    else if (activeModule === 'sora2-pro-image-to-video') modelName = 'sora-2-pro-image-to-video';
    else if (activeModule === 'veo3-text-to-video') modelName = 'veo3/text-to-video';
    else if (activeModule === 'veo3-image-to-video') modelName = 'veo3/image-to-video';
    else if (activeModule === 'veo3-reference-to-video') modelName = 'veo3/reference-to-video';
    else if (activeModule === 'grok-image-to-video') modelName = 'grok-imagine/image-to-video';
    else if (activeModule === 'grok-image-to-image') modelName = 'grok-imagine/image-to-image';
    else if (activeModule === 'grok-text-to-image') modelName = 'grok-imagine/text-to-image';
    else if (activeModule === 'grok-upscale') modelName = 'grok-imagine/upscale';
    else if (activeModule === 'stable-diffusion-text') modelName = 'pixazo/sdxl-image';
    else if (activeModule === 'stable-diffusion-inpaint') modelName = 'pixazo/sd-inpaint';

    addLog(`Initiating generation sequence [${modelName}]...`);
    
    try {
      if (isPixazoTask) {
        const taskId = `pixazo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const createdAt = Date.now();
        const newTask: LocalTask = {
          taskId,
          model: modelName,
          state: 'waiting',
          param: JSON.stringify(input),
          createTime: createdAt,
          progress: 1,
          isRead: false,
        };

        setTasks((prev) => [newTask, ...prev]);
        setSelectedTaskId(taskId);

        try {
          let imageUrl = '';
          if (activeModule === 'stable-diffusion-text') {
            const result = await generateSDXLImage(pixazoKey, input as StableDiffusionTextInput);
            imageUrl = result.imageUrl;
          } else {
            const result = await generateInpaintImage(pixazoKey, input as StableDiffusionInpaintInput);
            imageUrl = result.imageUrl;
          }

          setTasks((prev) =>
            prev.map((task) =>
              task.taskId === taskId
                ? {
                    ...task,
                    state: 'success',
                    progress: 100,
                    resultJson: imageUrl,
                    completeTime: Date.now(),
                    costTime: Date.now() - createdAt,
                  }
                : task
            )
          );
          addLog(`Task created successfully. ID: ${taskId}`);
        } catch (error: any) {
          const message = error?.message || 'Pixazo request failed';
          setTasks((prev) =>
            prev.map((task) =>
              task.taskId === taskId
                ? {
                    ...task,
                    state: 'fail',
                    progress: 100,
                    failMsg: message,
                    completeTime: Date.now(),
                    costTime: Date.now() - createdAt,
                  }
                : task
            )
          );
          addLog(`ERROR: ${message}`, true);
        }
        return;
      }

      let response;
      if (isVeo3Task) {
        // Use Veo 3.1 specific API endpoint
        response = await generateVeo3Video(input as Veo3Input);
      } else {
        // Use standard KIE.AI API endpoint
        response = await createTask(apiKey, modelName, input as KieInput);
      }
      
      if (response.code === 200) {
        addLog(`Task created successfully. ID: ${response.data.taskId}`);
        
        // Buat task lokal awal
        const newTask: LocalTask = {
            taskId: response.data.taskId,
            model: modelName,
            state: 'waiting',
            param: JSON.stringify(input),
            createTime: Date.now(),
            progress: 1,
            isRead: false
        };

        setTasks(prev => [newTask, ...prev]);
        setSelectedTaskId(response.data.taskId); 
      } else {
        addLog(`Error: ${response.msg}`, true);
      }
    } catch (error: any) {
      addLog(`Critical Failure: ${error.message}`, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Central Polling Logic
  useEffect(() => {
    if (!session || !apiKey) return;

    // Background Progress Simulator (Visual Only)
    const PROGRESS_TICK_MS = 250;
    const PROGRESS_FAST_CAP = 90;
    const PROGRESS_SOFT_CAP = 99;
    if (!pollIntervalRef.current) {
        pollIntervalRef.current = window.setInterval(() => {
          setTasks(prevTasks => {
            const pendingTasks = prevTasks.filter(t => t.state === 'waiting');
            if (pendingTasks.length === 0) return prevTasks;
            const queueMap = new Map(pendingTasks.map((t, idx) => [t.taskId, idx + 1]));
            const tickScale = PROGRESS_TICK_MS / 1000;
            return prevTasks.map(task => {
               if (task.state === 'waiting') {
                 const current = Number(task.progress) || 0;
                 let next = current;
                 if (current < PROGRESS_FAST_CAP) {
                   const remaining = PROGRESS_FAST_CAP - current;
                   const increment = Math.max(0.2, (remaining / 15) * tickScale);
                   next = Math.min(current + increment, PROGRESS_FAST_CAP);
                 } else if (current < PROGRESS_SOFT_CAP) {
                   const remaining = PROGRESS_SOFT_CAP - current;
                   const increment = Math.max(0.02, (remaining / 120) * tickScale);
                   next = Math.min(current + increment, PROGRESS_SOFT_CAP);
                 }
                 const queuePosition = queueMap.get(task.taskId) ?? task.queuePosition;
                 if (next !== current || queuePosition !== task.queuePosition) {
                   return { 
                     ...task, 
                     progress: next,
                     queuePosition
                   };
                 }
               }
               if ((task.state === 'success' || task.state === 'fail') && task.progress < 100) {
                 return { ...task, progress: 100 };
               }
               return task;
            });
          });
        }, PROGRESS_TICK_MS);
    }

    // Actual API Polling - polls all waiting tasks
    const API_POLL_MS = 1000;
    let polling = false;
    const apiPollId = window.setInterval(async () => {
        if (polling) return;
        polling = true;
        // Get current tasks that need polling
        let tasksToPoll: LocalTask[] = [];
        setTasks(prevTasks => {
            tasksToPoll = prevTasks.filter(
              (t) => t.state === 'waiting' && !t.model.startsWith('pixazo/')
            );
            return prevTasks;
        });

        if (tasksToPoll.length === 0) {
            polling = false;
            return;
        }

        // Poll all waiting tasks
        try {
          const updates = await Promise.all(tasksToPoll.map(async (task) => {
              try {
                  const res = await queryTask(apiKey, task.taskId);
                  if (res.code === 200) {
                      return { taskId: task.taskId, data: res.data };
                  }
              } catch (e: any) {
                  // Log error only once per few seconds to avoid spamming
                  if (Math.random() > 0.8) {
                     console.error(`Polling error for ${task.taskId}:`, e.message);
                  }
              }
              return null;
          }));

          // Update State with fetched data
          setTasks(prev => prev.map(t => {
              const update = updates.find(u => u && u.taskId === t.taskId);
              
              if (update && update.data) {
                  const normalized = normalizeTaskState(update.data);
                  const newState = normalized.state;
                  const apiProgress = normalizeProgress((update.data as any).progress);
                  // If success or fail, set progress to 100% immediately
                  const newProgress = (newState === 'success' || newState === 'fail')
                    ? 100
                    : (apiProgress !== null ? Math.max(t.progress, apiProgress) : t.progress);
                  
                  if (newState !== t.state) {
                      const stateEmoji = newState === 'success' ? '✓' : newState === 'fail' ? '✗' : '⏳';
                      const rawSuffix = normalized.raw && normalized.raw !== newState ? ` [${normalized.raw}]` : '';
                      const reason = newState === 'fail' ? (getFailureReason(update.data) || update.data.failMsg || update.data.errorMsg) : '';
                      addLog(`${stateEmoji} Task ${t.taskId.slice(-4)}: ${t.state} → ${newState}${rawSuffix}${reason ? ` (${reason})` : ''}`);
                      
                      // Trigger credit refresh when task completes (success or fail)
                      if (newState === 'success' || newState === 'fail') {
                          console.log('[App] Task completed, triggering credit refresh');
                          setCreditRefreshTrigger(prev => prev + 1);
                      }
                  }

                  return {
                      ...t,
                      ...update.data,
                      state: newState,
                      progress: newProgress,
                      resultJson: (update.data as any).resultJson || (update.data as any).result || t.resultJson,
                      failCode: update.data.failCode,
                      failMsg: update.data.failMsg,
                  };
              }
              return t;
          }));
        } finally {
          polling = false;
        }
    }, API_POLL_MS); // Check every ~1 second for faster success sync

    return () => {
        clearInterval(apiPollId);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
    };
  }, [apiKey, session]);

  useEffect(() => {
    if (!session) return;
    const completed = tasks.filter(t => t.state === 'success');
    if (completed.length === 0) return;

    completed.forEach(async (task) => {
      if (savedTaskIdsRef.current.has(task.taskId)) return;

      const outputUrl = extractOutputUrl(task.resultJson);
      if (!outputUrl) return;

      const existing = await getOutputByTaskId(task.taskId);
      if (existing) {
        savedTaskIdsRef.current.add(task.taskId);
        return;
      }

      const prompt = extractPromptFromParam(task.param);
      const outputType = inferOutputType(outputUrl, task.model);
      const creditsCost = getCreditCost(task.model);

      try {
        await saveOutputToSupabase(
          task.taskId,
          task.model,
          prompt,
          outputUrl,
          outputType,
          creditsCost,
          {
            source: 'main-app',
            model: task.model,
            createdAt: task.createTime,
          }
        );
        savedTaskIdsRef.current.add(task.taskId);
      } catch (error: any) {
        console.warn('Failed to save output to gallery:', error.message || error);
      }
    });
  }, [tasks, session]);

  const activeTask = tasks.find(t => t.taskId === selectedTaskId) || tasks[0] || null;

  if (authLoading) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
            <p className="text-violet-400 font-mono animate-pulse">INITIALIZING ZWAPP ENGINE...</p>
          </div>
        </div>
      );
  }

  // Handle section toggle for sidebar
  const handleSectionToggle = (section: MenuSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  // Handle module change from sidebar
  const handleModuleChange = (module: ModuleType) => {
    setActiveModule(module);
    // Auto-expand section based on module
    if (module === 'motion-control') {
      setExpandedSection('video');
    } else if (['nano-banana-gen', 'nano-banana-edit', 'nano-banana-pro'].includes(module)) {
      setExpandedSection('nano-banana');
    } else if (['qwen-text-to-image', 'qwen-image-to-image', 'z-image'].includes(module)) {
      setExpandedSection('qwen');
    } else if (['flux2-pro-text', 'flux2-pro-image', 'flux2-flex-text', 'flux2-flex-image'].includes(module)) {
      setExpandedSection('flux');
    } else if (['sora2-characters', 'sora2-text-to-video', 'sora2-image-to-video', 'sora2-pro-text-to-video', 'sora2-pro-image-to-video'].includes(module)) {
      setExpandedSection('sora2');
    } else if (['grok-image-to-video', 'grok-image-to-image', 'grok-text-to-image', 'grok-upscale'].includes(module)) {
      setExpandedSection('grok');
    } else if (['veo3-text-to-video', 'veo3-image-to-video', 'veo3-reference-to-video'].includes(module)) {
      setExpandedSection('veo3');
    } else if (['stable-diffusion-text', 'stable-diffusion-inpaint'].includes(module)) {
      setExpandedSection('stable-diffusion');
    }
  };

  // Render active form
  const renderActiveForm = () => {
    switch (activeModule) {
      case 'motion-control':
        return <TaskForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'nano-banana-gen':
        return <NanoBananaGenForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'nano-banana-edit':
        return <NanoBananaEditForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'nano-banana-pro':
        return <NanoBananaProForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'qwen-text-to-image':
        return <QwenTextToImageForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'qwen-image-to-image':
        return <ImageEditForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'z-image':
        return <ZImageForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'flux2-pro-text':
        return <Flux2ProTextForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'flux2-pro-image':
        return <Flux2ProImageForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'flux2-flex-text':
        return <Flux2FlexTextForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'flux2-flex-image':
        return <Flux2FlexImageForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'stable-diffusion-text':
        return <StableDiffusionTextForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={pixazoKey} />;
      case 'stable-diffusion-inpaint':
        return <StableDiffusionInpaintForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={pixazoKey} />;
      case 'sora2-characters':
        return <Sora2CharactersForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'sora2-text-to-video':
        return <Sora2TextToVideoForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'sora2-image-to-video':
        return <Sora2ImageToVideoForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'sora2-pro-text-to-video':
        return <Sora2ProTextToVideoForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'sora2-pro-image-to-video':
        return <Sora2ProImageToVideoForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'veo3-text-to-video':
        return <Veo3TextToVideoForm onSubmit={handleCreateTask} isLoading={isSubmitting} />;
      case 'veo3-image-to-video':
        return <Veo3ImageToVideoForm onSubmit={handleCreateTask} isLoading={isSubmitting} />;
      case 'veo3-reference-to-video':
        return <Veo3ReferenceToVideoForm onSubmit={handleCreateTask} isLoading={isSubmitting} />;
      case 'grok-image-to-video':
        return <GrokImageToVideoForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'grok-text-to-image':
        return <GrokTextToImageForm onSubmit={handleCreateTask} isLoading={isSubmitting} />;
      case 'grok-image-to-image':
        return <GrokImageToImageForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />;
      case 'gallery':
        return null;
      case 'ugc':
        return null; // UGC has its own workspace in the right panel
      case 'spaces':
        return null; // Spaces has its own workspace in the right panel
      default:
        return (
          <div className="text-center text-zinc-500 py-8">
            <p className="text-sm font-mono">Select a module from the sidebar</p>
          </div>
        );
    }
  };

  // Get module title for display
  const getModuleTitle = () => {
    const titles: Record<string, string> = {
      'motion-control': 'Kling Motion Control',
      'nano-banana-gen': 'Nano Banana Generate',
      'nano-banana-edit': 'Nano Banana Edit',
      'nano-banana-pro': 'Nano Banana Pro',
      'qwen-text-to-image': 'Qwen Text→Image',
      'qwen-image-to-image': 'Qwen Image→Image',
      'z-image': 'Z-Image Generation',
      'flux2-pro-text': 'Flux 2 Pro Text→Image',
      'flux2-pro-image': 'Flux 2 Pro Image→Image',
      'flux2-flex-text': 'Flux 2 Flex Text→Image',
      'flux2-flex-image': 'Flux 2 Flex Image→Image',
      'stable-diffusion-text': 'Stable Diffusion Text-to-Image',
      'stable-diffusion-inpaint': 'Stable Diffusion Inpainting',
      'sora2-characters': 'Sora 2 Characters',
      'sora2-text-to-video': 'Sora 2 Text→Video',
      'sora2-image-to-video': 'Sora 2 Image→Video',
      'sora2-pro-text-to-video': 'Sora 2 Pro Text→Video',
      'sora2-pro-image-to-video': 'Sora 2 Pro Image→Video',
      'veo3-text-to-video': 'Veo 3.1 Text→Video',
      'veo3-image-to-video': 'Veo 3.1 Image→Video',
      'veo3-reference-to-video': 'Veo 3.1 Reference→Video',
      'gallery': 'Output Gallery',
      'spaces': 'Spaces Studio',
      'grok-image-to-video': 'Grok Image→Video',
      'grok-text-to-image': 'Grok Text→Image',
      'grok-image-to-image': 'Grok Image→Image',
      'grok-upscale': 'Grok Upscale',
      'landing': 'Home',
    };
    return titles[activeModule] || 'Workspace';
  };

  // Loading state
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${isDark ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-12 h-12 border-4 ${isDark ? 'border-orange-500/30 border-t-orange-500' : 'border-orange-300 border-t-orange-500'} rounded-full animate-spin`}></div>
          <p className={`font-mono animate-pulse ${isDark ? 'text-orange-500' : 'text-orange-600'}`}>INITIALIZING ENGINE...</p>
        </div>
      </div>
    );
  }

  // View: Public Landing Page (before login)
  if (currentView === 'landing') {
    return (
      <PublicLanding
        onSignIn={() => setCurrentView('auth')}
        onLaunchEngine={() => {
          if (session) {
            setCurrentView('app');
          } else {
            setCurrentView('auth');
          }
        }}
      />
    );
  }

  // View: Auth/Login Page
  if (currentView === 'auth' && !session) {
    return (
      <AuthForm 
        onAuthSuccess={() => {
          addLog('User Authenticated. Loading Preferences...');
          setCurrentView('app');
        }}
        onBackToHome={() => setCurrentView('landing')}
      />
    );
  }

  // View: Main Application (after login)
  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isDark ? 'bg-zinc-950 text-zinc-300' : 'bg-zinc-100 text-zinc-800'}`}>
      {/* Toast Notifications */}
      <Toast toasts={toast.toasts} onRemove={toast.removeToast} />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveApiKey}
        currentKieKey={apiKey}
        currentPixazoKey={pixazoKey}
      />

      {/* Sidebar - Narrow icon-based */}
      <Sidebar
        activeModule={activeModule}
        expandedSection={expandedSection}
        onModuleChange={handleModuleChange}
        onSectionToggle={handleSectionToggle}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        userEmail={session?.user?.email}
        apiConnected={!!apiKey}
      />

      {/* Main Content Area - Fixed margin for collapsed sidebar, sidebar expands over content on hover */}
      <div className="ml-16 min-h-screen transition-all duration-300">
        {/* Header Bar */}
        <header className={`h-16 flex items-center justify-between px-6 border-b ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200'} backdrop-blur-sm sticky top-0 z-40`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className={`font-bold tracking-wider ${isDark ? 'text-white' : 'text-zinc-900'}`}>{getModuleTitle()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-xs font-mono ${apiKey ? (isDark ? 'text-green-500' : 'text-green-600') : (isDark ? 'text-red-500' : 'text-red-600')}`}>
                {apiKey ? 'API CONNECTED' : 'API DISCONNECTED'}
              </span>
            </div>
          </div>
          
          {/* Credits Display */}
          <div className="flex items-center gap-4">
            <div 
              className={`px-4 py-2 border cursor-pointer transition-colors ${isDark ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'}`}
              onClick={() => setCreditRefreshTrigger(prev => prev + 1)}
              title="Click to refresh credits"
            >
              <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>CREDITS: </span>
              {isLoadingCredits ? (
                <span className="inline-block w-3 h-3 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              ) : (
                <span className={`text-xs font-mono font-bold ${
                  creditBalance === null ? (isDark ? 'text-zinc-600' : 'text-zinc-400') :
                  creditBalance === 0 ? 'text-red-500' :
                  creditBalance < 100 ? 'text-orange-500' :
                  creditBalance < 500 ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {creditBalance !== null ? formatCreditsShort(creditBalance) : '—'}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex">
          {activeModule === 'spaces' ? (
            <div className="flex-1">
              <SpacesWorkspace
                apiKey={apiKey}
                googleApiKey=""
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          ) : activeModule === 'gallery' ? (
            <div className="flex-1">
              <GalleryView />
            </div>
          ) : (
            <>
              {/* Left Panel - Dynamic Form */}
              <div className={`w-96 min-h-[calc(100vh-4rem)] border-r overflow-y-auto ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="p-4">
                  {/* Dynamic Form Based on Module */}
                  {renderActiveForm()}
                </div>
              </div>

              {/* Right Panel - Output */}
              <div className="flex-1 p-6">
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
                  {/* System Ready State */}
                  <div className={`w-24 h-24 border-2 ${isDark ? 'border-zinc-800' : 'border-zinc-300'} flex items-center justify-center mb-6`}>
                    <svg className={`w-12 h-12 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-mono tracking-widest mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>SYSTEM READY</h3>
                  <p className={`text-sm font-mono ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>Awaiting Input Parameters...</p>

                  {/* Queue & Terminal Below */}
                  <div className="w-full max-w-2xl mt-12 space-y-4">
                    <QueueList 
                      tasks={tasks} 
                      onSelectTask={setSelectedTaskId} 
                      selectedTaskId={selectedTaskId} 
                    />
                    <StatusTerminal task={activeTask} logs={logs} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap with ThemeProvider
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;


