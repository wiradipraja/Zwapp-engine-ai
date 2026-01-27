import React, { useState } from 'react';
import { GrokUpscaleInput } from '../types';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';

interface GrokUpscaleFormProps {
  onSubmit: (input: GrokUpscaleInput) => void;
  isLoading: boolean;
}

export const GrokUpscaleForm: React.FC<GrokUpscaleFormProps> = ({ onSubmit, isLoading }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [taskId, setTaskId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = taskId.trim();
    if (!trimmed) {
      setError('Task ID is required.');
      return;
    }
    setError(null);
    onSubmit({ task_id: trimmed });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-amber-400 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            GROK UPSCALE
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Model: grok-imagine/upscale - Requires Grok task_id
        </p>
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          GROK TASK ID <span className="text-red-500">*</span>
        </label>
        <input
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          placeholder="Paste Grok task_id (from image generation)"
          className={`w-full px-3 py-2 rounded-lg text-xs border ${
            isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-200'
          }`}
        />
        <p className={`text-[10px] mt-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Use a Kie AI-generated task_id (e.g. from Grok Text->Image or Image->Image).
        </p>
        {error && <p className="text-red-500 text-xs font-mono mt-1">{error}</p>}
      </div>

      <Button type="submit" disabled={isLoading || !taskId.trim()} className="w-full">
        {isLoading ? 'UPSCALING...' : 'UPSCALE IMAGE'}
      </Button>
    </form>
  );
};

export default GrokUpscaleForm;
