import { useEffect, useState } from 'react';
import { LocalTask } from '../types';
import { formatElapsed } from '../services/taskTiming';
import { saveOutputToSupabase, getOutputByTaskId, downloadOutput } from '../services/outputSaving';
import { getCreditCost } from '../services/credits';
import { getFailureReason } from '../services/taskState';
import { ProgressBar } from './ui/ProgressBar';

interface StatusTerminalProps {
  task: LocalTask | null;
  logs: string[];
}

export const StatusTerminal: React.FC<StatusTerminalProps> = ({ task, logs }) => {
  const extractResultUrl = (resultJson?: string): string => {
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

  const resultUrl = task?.state === 'success' ? extractResultUrl(task.resultJson) : '';
  const lowerUrl = resultUrl.toLowerCase();
  const isVideo = lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.webm');

  const now = Date.now();
  const progress = task?.progress ?? (task?.state === 'success' ? 100 : 0);
  const elapsedMs =
    task && task.state === 'waiting'
      ? Math.max(0, now - task.createTime)
      : task?.completeTime
      ? Math.max(0, task.completeTime - task.createTime)
      : 0;
  const countdownLabel =
    task && task.state === 'waiting'
      ? formatElapsed(elapsedMs)
      : task?.state === 'success'
      ? 'DONE'
      : task?.state === 'fail'
      ? 'FAILED'
      : '--:--';

  const failureReason =
    task && task.state === 'fail'
      ? getFailureReason(task) || task.failMsg || task.failCode || 'Unknown error'
      : '';

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    setSaved(false);
  }, [task?.taskId]);

  useEffect(() => {
    let active = true;
    if (!task || !resultUrl) return undefined;
    getOutputByTaskId(task.taskId).then((existing) => {
      if (active && existing) {
        setSaved(true);
      }
    });
    return () => {
      active = false;
    };
  }, [task, resultUrl]);

  const extractPromptFromParam = (param?: string): string => {
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

  const inferOutputType = (url: string, model: string): 'image' | 'video' | 'text' => {
    const lowerUrl = (url || '').toLowerCase();
    if (lowerUrl.startsWith('data:text')) return 'text';
    if (lowerUrl.match(/\.(mp4|mov|webm|mkv|avi)$/)) return 'video';
    if (model.toLowerCase().includes('video')) return 'video';
    return 'image';
  };

  const handleSaveToGallery = async () => {
    if (!task || !resultUrl) return;
    setIsSaving(true);
    const existing = await getOutputByTaskId(task.taskId);
    if (existing) {
      setSaved(true);
      setIsSaving(false);
      return;
    }
    try {
      await saveOutputToSupabase(
        task.taskId,
        task.model,
        extractPromptFromParam(task.param),
        resultUrl,
        inferOutputType(resultUrl, task.model),
        getCreditCost(task.model),
        { source: 'manual-save', model: task.model, createdAt: task.createTime }
      );
      setSaved(true);
    } catch (_err) {
      setSaved(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    setDownloadError('');
    try {
      await downloadOutput(resultUrl, `zwapp-output-${task?.taskId.slice(-6) || 'file'}`);
    } catch (err: any) {
      setDownloadError(err?.message || 'Download failed.');
    }
  };

  // Check if task is complete
  const isTaskComplete = task && (task.state === 'success' || task.state === 'fail');
  // Show logs only if task is pending or failed
  const shouldShowLogs = logs.length > 0 && (!isTaskComplete);

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Result Display - Takes Priority */}
      {resultUrl && (
        <div className="border-2 border-orange-500 p-1 bg-zinc-900 relative flex-shrink-0">
          <div className="absolute top-0 left-0 bg-orange-500 text-black text-xs font-bold px-2 py-0.5 z-10">OUTPUT_FEED</div>
          {isVideo ? (
            <video 
                src={resultUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full aspect-video bg-black object-contain"
            />
          ) : (
            <img 
                src={resultUrl}
                alt="Generated Output"
                className="w-full h-auto max-h-[500px] bg-black object-contain border border-zinc-800"
            />
          )}
          
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={handleDownload}
              className="inline-block text-xs text-orange-500 hover:text-orange-400 underline decoration-dotted underline-offset-4"
            >
              DOWNLOAD RAW ARTIFACT
            </button>
            <button
              onClick={handleSaveToGallery}
              disabled={isSaving || saved}
              className={`inline-block text-xs underline decoration-dotted underline-offset-4 ${
                saved ? 'text-green-400' : 'text-zinc-300 hover:text-orange-300'
              }`}
            >
              {saved ? 'SAVED TO GALLERY' : isSaving ? 'SAVING...' : 'SAVE TO GALLERY'}
            </button>
          </div>
          {downloadError && (
            <div className="mt-2 text-[10px] font-mono text-red-400 text-center">{downloadError}</div>
          )}
        </div>
      )}

      {/* Status Panel */}
      {task && (
        <div className="bg-zinc-900 border border-zinc-800 p-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
            <span className="text-orange-500 font-bold tracking-widest uppercase text-sm">Operation Status</span>
            <span className={`px-2 py-0.5 text-xs font-bold uppercase ${
              task.state === 'success' ? 'bg-green-900 text-green-400' :
              task.state === 'fail' ? 'bg-red-900 text-red-400' :
              'bg-orange-900/40 text-orange-400 animate-pulse'
            }`}>
              {task.state}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-400">
             <div>
               <span className="block text-zinc-600 mb-1">TASK ID</span>
               <span className="text-zinc-200 select-all break-all">{task.taskId.slice(0, 16)}...</span>
             </div>
             <div>
               <span className="block text-zinc-600 mb-1">MODEL</span>
               <span className="text-zinc-300">{task.model}</span>
             </div>
             <div>
                <span className="block text-zinc-600 mb-1">CREATED</span>
                <span className="text-zinc-300">{new Date(task.createTime).toLocaleTimeString()}</span>
             </div>
             {task.costTime && (
                <div>
                  <span className="block text-zinc-600 mb-1">DURATION</span>
                  <span className="text-green-400">{task.costTime}ms</span>
                </div>
             )}
          </div>

          {failureReason && (
            <div className="mt-3 border border-red-900/40 bg-red-950/20 px-3 py-2 text-[10px] font-mono text-red-300 break-words">
              <span className="block text-red-400 mb-1">FAIL REASON</span>
              <span>{failureReason}</span>
            </div>
          )}

          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1">
              <span>PROGRESS</span>
              <span>{Math.round(progress)}%</span>
              <span>{countdownLabel}</span>
            </div>
            <ProgressBar
              value={progress}
              animated={task.state === 'waiting'}
              heightClassName="h-2"
              trackClassName="bg-zinc-800"
              barClassName={
                task.state === 'success'
                  ? 'bg-green-500'
                  : task.state === 'fail'
                  ? 'bg-red-500'
                  : 'bg-orange-500'
              }
            />
          </div>
        </div>
      )}

      {/* Spacer - Grows to fill available space */}
      <div className="flex-grow"></div>

      {/* System Log - Floating at Bottom with Gradient */}
      {shouldShowLogs && (
        <div className="absolute bottom-0 left-0 right-0 max-h-[180px] overflow-y-auto">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none"></div>
          
          {/* Log Content */}
          <div className="relative z-10 font-mono text-xs text-zinc-400 px-4 pt-8 pb-4 space-y-1">
            {logs.slice(0, 8).map((log, i) => (
              <div key={i} className="border-l-2 border-zinc-800 pl-2 text-zinc-300 hover:text-orange-400 transition-colors">
                <span className="text-orange-600 mr-2 text-[9px]">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-[10px]">{log}</span>
              </div>
            ))}
            {logs.length > 8 && (
              <div className="text-zinc-600 text-[10px] italic pl-2">
                ... +{logs.length - 8} more messages
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
