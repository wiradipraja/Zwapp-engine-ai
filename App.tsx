import React, { useState, useEffect, useRef } from 'react';
import { createTask, queryTask } from './services/api';
import { supabase, signOut } from './services/supabase';
import { MotionControlInput, NanoBananaInput, ImageEditInput, ZImageInput, LocalTask } from './types';
import { TaskForm } from './components/TaskForm';
import { NanoBananaGenForm } from './components/NanoBananaGenForm';
import { NanoBananaEditForm } from './components/NanoBananaEditForm';
import { NanoBananaProForm } from './components/NanoBananaProForm';
import { ImageEditForm } from './components/ImageEditForm';
import { ZImageForm } from './components/ZImageForm';
import { StatusTerminal } from './components/StatusTerminal';
import { QueueList } from './components/QueueList';
import { AuthForm } from './components/AuthForm';
import { SettingsModal } from './components/SettingsModal';
import UGCOrchestrationWorkspace from './components/UGC/UGCOrchestrationWorkspace';

type ModuleType = 'motion-control' | 'nano-banana-gen' | 'nano-banana-edit' | 'nano-banana-pro' | 'image-edit' | 'z-image' | 'ugc';
type NanoBananaType = 'gen' | 'edit' | 'pro';

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App State
  const [apiKey, setApiKey] = useState('');
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>('motion-control');
  const [expandImageGen, setExpandImageGen] = useState(false);
  const [expandNano, setExpandNano] = useState(false);
  const [nanoBananaType, setNanoBananaType] = useState<NanoBananaType>('gen');
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Polling Interval Ref
  const pollIntervalRef = useRef<number | null>(null);

  // 1. Check for Supabase Session and LocalStorage API Key on Mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Load API Key from LocalStorage
    const storedKey = localStorage.getItem('kie_api_key');
    if (storedKey) {
        setApiKey(storedKey);
    }

    return () => subscription.unsubscribe();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`> ${msg}`, ...prev].slice(0, 50));
  };

  const handleSaveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('kie_api_key', key);
      addLog('System Configuration Updated: API Key Saved.');
  };

  const handleLogout = async () => {
      await signOut();
      addLog('Session Terminated.');
      setSession(null);
  };

  const handleCreateTask = async (input: MotionControlInput | NanoBananaInput | ImageEditInput | ZImageInput) => {
    if (!apiKey) {
        setIsSettingsOpen(true);
        addLog('ERROR: API Key missing. Please configure in Settings.');
        return;
    }

    setIsSubmitting(true);
    
    let modelName = '';
    if (activeModule === 'motion-control') modelName = 'kling-2.6/motion-control';
    else if (activeModule === 'nano-banana-gen') modelName = 'google/nano-banana';
    else if (activeModule === 'nano-banana-edit') modelName = 'google/nano-banana-edit';
    else if (activeModule === 'nano-banana-pro') modelName = 'nano-banana-pro';
    else if (activeModule === 'image-edit') modelName = 'qwen/image-to-image';
    else if (activeModule === 'z-image') modelName = 'z-image';

    addLog(`Initiating generation sequence [${modelName}]...`);
    
    try {
      const response = await createTask(apiKey, modelName, input);
      if (response.code === 200) {
        addLog(`Task created successfully. ID: ${response.data.taskId}`);
        
        // Buat task lokal awal
        const newTask: LocalTask = {
            taskId: response.data.taskId,
            model: modelName,
            state: 'waiting',
            param: JSON.stringify(input),
            createTime: Date.now(),
            progress: 0,
            isRead: false
        };

        setTasks(prev => [newTask, ...prev]);
        setSelectedTaskId(response.data.taskId); 
      } else {
        addLog(`Error: ${response.msg}`);
      }
    } catch (error: any) {
      addLog(`Critical Failure: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Central Polling Logic
  useEffect(() => {
    if (!session || !apiKey) return;

    // Background Progress Simulator (Visual Only)
    if (!pollIntervalRef.current) {
        pollIntervalRef.current = window.setInterval(async () => {
          setTasks(prevTasks => {
            const pendingTasks = prevTasks.filter(t => t.state === 'waiting');
            return prevTasks.map(task => {
               if (task.state === 'waiting') {
                 // Slow down progress as it gets closer to 90%
                 const increment = Math.max(0.1, (90 - task.progress) / 20);
                 return { 
                   ...task, 
                   progress: Math.min(task.progress + increment, 90),
                   queuePosition: pendingTasks.findIndex(pt => pt.taskId === task.taskId) + 1
                 };
               }
               return task;
            });
          });
        }, 1000);
    }

    // Actual API Polling
    const apiPollId = window.setInterval(async () => {
        // Fetch current state
        setTasks(prevTasks => {
            const tasksToPoll = prevTasks.filter(t => t.state === 'waiting');
            if (tasksToPoll.length === 0) return prevTasks;

            // Start async polling
            (async () => {
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
                        const newState = update.data.state;
                        // If success/fail, jump to 100%. If waiting, keep simulated progress.
                        const newProgress = (newState === 'success' || newState === 'fail') ? 100 : t.progress;
                        
                        if (newState !== t.state) {
                            addLog(`Task ${t.taskId.slice(-4)} updated: ${t.state} -> ${newState}`);
                        }

                        return {
                            ...t,
                            ...update.data,
                            state: newState,
                            progress: newProgress,
                            resultJson: update.data.resultJson || t.resultJson,
                        };
                    }
                    return t;
                }));
            })();

            return prevTasks;
        });
    }, 3000); // Check every 3 seconds

    return () => {
        clearInterval(apiPollId);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [apiKey, session]);

  const activeTask = tasks.find(t => t.taskId === selectedTaskId) || tasks[0] || null;

  if (authLoading) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-orange-500 font-mono animate-pulse">INITIALIZING SYSTEM...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid text-zinc-300 font-sans selection:bg-orange-500 selection:text-black">
      
      {/* AUTH SCREEN OR MAIN APP */}
      {!session ? (
        <AuthForm onAuthSuccess={() => addLog('User Authenticated. Loading Preferences...')} />
      ) : (
        <>
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            onSave={handleSaveApiKey}
            currentKey={apiKey}
        />

        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-bold text-black text-xl clip-path-polygon">
                K
                </div>
                <div>
                <h1 className="text-lg font-bold tracking-widest uppercase text-white leading-none">Kie.ai</h1>
                <span className="text-[10px] text-orange-500 font-mono tracking-wider">CORE INTERFACE v2.2</span>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {/* API Status */}
                <div className="hidden md:flex items-center gap-2 border-r border-zinc-800 pr-4">
                    <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
                    <span className="text-xs font-mono text-zinc-500">{apiKey ? 'API LINKED' : 'API DISCONNECTED'}</span>
                </div>

                {/* User Status */}
                <div className="text-right hidden md:block">
                    <div className="text-xs text-white font-bold">{session.user.email}</div>
                    <div className="text-[10px] text-zinc-600 font-mono uppercase">OPERATOR LEVEL 1</div>
                </div>
                
                {/* Controls */}
                <div className="flex gap-1">
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
                        title="Settings"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 border border-transparent hover:border-red-900 transition-all"
                        title="Logout"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                </div>
            </div>
            </div>
            {/* Decorative stripe */}
            <div className="h-1 bg-stripes opacity-20 w-full"></div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col: Controls */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                
                {/* Module Navigation - Two Row Layout */}
                <div className="flex flex-col gap-1 bg-zinc-900 border border-zinc-800 p-1">
                    {/* First Row: Motion */}
                    <button
                        onClick={() => setActiveModule('motion-control')}
                        className={`w-full py-2 text-xs font-bold uppercase tracking-wider transition-all text-center ${
                            activeModule === 'motion-control' 
                            ? 'bg-zinc-800 text-orange-500 border border-zinc-700 shadow-inner' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        Motion Control
                    </button>

                    {/* Second Row: Nano Banana Parent + Submenu */}
                    <button
                        onClick={() => setExpandNano(!expandNano)}
                        className={`w-full py-2 text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-between px-3 ${
                            expandNano 
                            ? 'bg-zinc-800 text-orange-500 border border-zinc-700' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <span>Nano Banana</span>
                        <span className="text-[10px]">{expandNano ? '▼' : '▶'}</span>
                    </button>

                    {/* Submenu - Nano Banana Children */}
                    {expandNano && (
                        <div className="flex gap-1 p-1 border-t border-zinc-700 bg-zinc-950">
                            <button
                                onClick={() => {
                                    setActiveModule('nano-banana-gen');
                                    setNanoBananaType('gen');
                                }}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeModule === 'nano-banana-gen' 
                                    ? 'bg-green-700 text-white border border-green-600 shadow-inner' 
                                    : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                                }`}
                            >
                                Gen
                            </button>
                            <button
                                onClick={() => {
                                    setActiveModule('nano-banana-edit');
                                    setNanoBananaType('edit');
                                }}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeModule === 'nano-banana-edit' 
                                    ? 'bg-blue-700 text-white border border-blue-600 shadow-inner' 
                                    : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                                }`}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    setActiveModule('nano-banana-pro');
                                    setNanoBananaType('pro');
                                }}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeModule === 'nano-banana-pro' 
                                    ? 'bg-purple-700 text-white border border-purple-600 shadow-inner' 
                                    : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                                }`}
                            >
                                Pro
                            </button>
                        </div>
                    )}

                    {/* Third Row: Image Generation Parent + Submenu */}
                    <button
                        onClick={() => setExpandImageGen(!expandImageGen)}
                        className={`w-full py-2 text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-between px-3 ${
                            expandImageGen 
                            ? 'bg-zinc-800 text-orange-500 border border-zinc-700' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <span>Image Generation</span>
                        <span className="text-[10px]">{expandImageGen ? '▼' : '▶'}</span>
                    </button>

                    {/* Submenu - Image Generation Children */}
                    {expandImageGen && (
                        <div className="flex gap-1 p-1 border-t border-zinc-700 bg-zinc-950">
                            <button
                                onClick={() => {
                                    setActiveModule('image-edit');
                                }}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeModule === 'image-edit' 
                                    ? 'bg-zinc-700 text-orange-500 border border-zinc-600 shadow-inner' 
                                    : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                                }`}
                            >
                                Qwen Edit
                            </button>
                            <button
                                onClick={() => {
                                    setActiveModule('z-image');
                                }}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeModule === 'z-image' 
                                    ? 'bg-zinc-700 text-orange-500 border border-zinc-600 shadow-inner' 
                                    : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                                }`}
                            >
                                Z-Image
                            </button>
                        </div>
                    )}

                    {/* UGC AI Studio - New Menu Option */}
                    <button
                        onClick={() => setActiveModule('ugc')}
                        className={`w-full py-2 text-xs font-bold uppercase tracking-wider transition-all text-center ${
                            activeModule === 'ugc' 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border border-purple-500 shadow-lg' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        🎬 UGC AI Studio
                    </button>
                </div>

                {activeModule === 'motion-control' && (
                    <TaskForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />
                )}
                {activeModule === 'nano-banana-gen' && (
                    <NanoBananaGenForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />
                )}
                {activeModule === 'nano-banana-edit' && (
                    <NanoBananaEditForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />
                )}
                {activeModule === 'nano-banana-pro' && (
                    <NanoBananaProForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />
                )}
                {activeModule === 'image-edit' && (
                    <ImageEditForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />
                )}
                {activeModule === 'z-image' && (
                    <ZImageForm onSubmit={handleCreateTask} isLoading={isSubmitting} apiKey={apiKey} />
                )}
                {activeModule === 'ugc' && (
                    <div className="w-full">
                        <UGCOrchestrationWorkspace apiKey={apiKey} />
                    </div>
                )}
                </div>

                {/* Right Col: Output & Queue */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Task Queue List - MOVED TO TOP */}
                <QueueList 
                    tasks={tasks} 
                    onSelectTask={setSelectedTaskId} 
                    selectedTaskId={selectedTaskId} 
                />
                
                {/* Active Task Detail & Output - MOVED TO BOTTOM */}
                <StatusTerminal task={activeTask} logs={logs} />
                </div>
            </div>
        </main>
        </>
      )}
    </div>
  );
};

export default App;