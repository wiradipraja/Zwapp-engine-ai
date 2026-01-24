// components/layout/WorkspaceLayout.tsx
import React from 'react';

interface WorkspaceLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  outputPanel?: React.ReactNode;
  logs?: string[];
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  title,
  subtitle,
  icon,
  children,
  outputPanel,
  logs = [],
}) => {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Ready
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Input Panel */}
        <div className="w-[480px] flex-shrink-0 border-r border-white/5 overflow-y-auto bg-zinc-950/30">
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900/20">
          {outputPanel ? (
            <div className="flex-1 overflow-y-auto p-6">
              {outputPanel}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-500 mb-2">Output Preview</h3>
                <p className="text-sm text-zinc-600 max-w-sm">
                  Generated content will appear here. Configure your parameters and click generate to start.
                </p>
              </div>
            </div>
          )}

          {/* Log Panel */}
          {logs.length > 0 && (
            <div className="flex-shrink-0 h-40 border-t border-white/5 bg-black/30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Activity Log</span>
                <span className="text-[10px] text-zinc-600">{logs.length} entries</span>
              </div>
              <div className="overflow-y-auto h-[calc(100%-32px)] p-3 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className={`py-1 ${
                    log.includes('ERROR') ? 'text-red-400' : 
                    log.includes('SUCCESS') || log.includes('✓') ? 'text-emerald-400' : 
                    log.includes('WARNING') ? 'text-amber-400' :
                    'text-zinc-500'
                  }`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
