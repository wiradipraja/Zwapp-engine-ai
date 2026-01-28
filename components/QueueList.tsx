import React from 'react';
import { LocalTask } from '../types';
import { estimateDurationMs, computeRemainingMs, formatCountdown } from '../services/taskTiming';
import { getFailureReason } from '../services/taskState';
import { ProgressBar } from './ui/ProgressBar';

interface QueueListProps {
  tasks: LocalTask[];
  onSelectTask: (taskId: string) => void;
  selectedTaskId: string | null;
}

export const QueueList: React.FC<QueueListProps> = ({ tasks, onSelectTask, selectedTaskId }) => {
  if (tasks.length === 0) return null;
  const now = Date.now();

  return (
    <div className="bg-zinc-950 border border-zinc-700 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-1">
         <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-orange-500 animate-pulse rounded-full"></div>
           <span className="text-[10px] text-orange-500 font-mono uppercase tracking-wider">Queue Active</span>
         </div>
      </div>
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">
        Task Sequence [{tasks.length}]
      </h3>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {tasks.map((task, index) => (
          <div 
            key={task.taskId}
            onClick={() => onSelectTask(task.taskId)}
            className={`p-3 border transition-all cursor-pointer relative group ${
              selectedTaskId === task.taskId 
                ? 'border-orange-500 bg-zinc-900' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
            }`}
          >
            {/* Selection Indicator */}
            {selectedTaskId === task.taskId && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
            )}

            <div className="flex justify-between items-start mb-2 pl-2">
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase">ID: {task.taskId.slice(-8)}</div>
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{task.model.split('/')[0]}</div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                  task.state === 'success' ? 'border-green-800 text-green-500 bg-green-900/20' :
                  task.state === 'fail' ? 'border-red-800 text-red-500 bg-red-900/20' :
                  'border-orange-800 text-orange-500 bg-orange-900/20'
                }`}>
                  {task.state === 'waiting' ? `QUEUE #${task.queuePosition || '-'}` : task.state}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pl-2">
              {(() => {
                const estimatedMs = estimateDurationMs(task.model);
                const remainingMs =
                  task.state === 'waiting'
                    ? computeRemainingMs(task.progress, task.createTime, estimatedMs, now)
                    : 0;
                const countdownLabel =
                  task.state === 'waiting'
                    ? remainingMs > 0
                      ? formatCountdown(remainingMs)
                      : 'FINALIZING'
                    : task.state === 'success'
                    ? 'DONE'
                    : 'FAILED';
                const failureReason =
                  task.state === 'fail' ? (getFailureReason(task) || task.failMsg || task.failCode || 'Unknown error') : '';
                return (
                  <>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1">
                      <span>PROGRESS</span>
                      <span>{Math.round(task.progress)}%</span>
                      <span>{countdownLabel}</span>
                    </div>
                    <ProgressBar
                      value={task.progress}
                      animated={task.state === 'waiting'}
                      heightClassName="h-1.5"
                      trackClassName="bg-zinc-800"
                      barClassName={
                        task.state === 'success'
                          ? 'bg-green-500'
                          : task.state === 'fail'
                          ? 'bg-red-500'
                          : 'bg-orange-500'
                      }
                    />
                    {failureReason && (
                      <div className="mt-2 text-[10px] font-mono text-red-400 break-words">
                        FAIL REASON: {failureReason}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            
            {/* Hover Effect Corner */}
            <div className="absolute bottom-0 right-0 w-0 h-0 border-b-4 border-r-4 border-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b; 
        }
      `}</style>
    </div>
  );
};
