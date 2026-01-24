import React, { useState } from 'react';
import { Sora2TextToVideoInput } from '../types';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';

interface Sora2TextToVideoFormProps {
  onSubmit: (input: Sora2TextToVideoInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const Sora2TextToVideoForm: React.FC<Sora2TextToVideoFormProps> = ({ onSubmit, isLoading }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<Sora2TextToVideoInput>({
    prompt: '',
    aspect_ratio: 'landscape',
    n_frames: '10',
    remove_watermark: true,
  });

  const handleChange = (field: keyof Sora2TextToVideoInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-pink-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            SORA 2 TEXT→VIDEO
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Model: sora-2-text-to-video • Generate video from text prompt
        </p>
      </div>

      {/* Prompt Input */}
      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          PROMPT <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="Describe the video motion you want to generate..."
          rows={5}
          maxLength={10000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark 
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-pink-500' 
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-pink-500'
          } focus:outline-none`}
          required
        />
        <div className={`text-right text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {formData.prompt.length}/10000
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          ASPECT RATIO
        </label>
        <div className="flex gap-2">
          {[
            { value: 'landscape', label: 'Landscape (16:9)' },
            { value: 'portrait', label: 'Portrait (9:16)' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('aspect_ratio', option.value)}
              className={`flex-1 px-3 py-2 text-xs font-mono border transition-all ${
                formData.aspect_ratio === option.value
                  ? isDark
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                    : 'border-pink-500 bg-pink-50 text-pink-600'
                  : isDark
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                    : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          DURATION
        </label>
        <div className="flex gap-2">
          {[
            { value: '10', label: '10 seconds' },
            { value: '15', label: '15 seconds' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('n_frames', option.value)}
              className={`flex-1 px-3 py-2 text-xs font-mono border transition-all ${
                formData.n_frames === option.value
                  ? isDark
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                    : 'border-pink-500 bg-pink-50 text-pink-600'
                  : isDark
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                    : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Remove Watermark */}
      <div className="flex items-center justify-between">
        <label className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          REMOVE WATERMARK
        </label>
        <button
          type="button"
          onClick={() => handleChange('remove_watermark', !formData.remove_watermark)}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            formData.remove_watermark 
              ? 'bg-pink-500' 
              : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
          }`}
        >
          <span 
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              formData.remove_watermark ? 'left-7' : 'left-1'
            }`} 
          />
        </button>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !formData.prompt}
        className="w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            GENERATING...
          </span>
        ) : (
          'GENERATE VIDEO'
        )}
      </Button>

      {/* API Info */}
      <div className={`text-center text-[10px] font-mono ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>
        API: POST /api/v1/jobs/createTask • Model: sora-2-text-to-video
      </div>
    </form>
  );
};

export default Sora2TextToVideoForm;
