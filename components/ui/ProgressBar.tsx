import React from 'react';

interface ProgressBarProps {
  value: number;
  barClassName?: string;
  trackClassName?: string;
  heightClassName?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  barClassName = 'bg-orange-500',
  trackClassName = 'bg-zinc-800',
  heightClassName = 'h-2',
  animated = false,
}) => {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full overflow-hidden ${heightClassName} ${trackClassName}`}>
      <div
        className={`h-full transition-all duration-500 ease-out ${barClassName} ${animated ? 'progress-bar-striped' : ''}`}
        style={{ width: `${safeValue}%` }}
      />
      <style>{`
        .progress-bar-striped {
          background-image: linear-gradient(45deg, rgba(0,0,0,0.25) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.25) 75%, transparent 75%, transparent 100%);
          background-size: 12px 12px;
          animation: progress-bar-move 1s linear infinite;
        }
        @keyframes progress-bar-move {
          from { background-position: 0 0; }
          to { background-position: 12px 0; }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
