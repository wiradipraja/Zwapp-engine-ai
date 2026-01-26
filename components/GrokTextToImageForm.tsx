import React, { useState } from 'react';
import { GrokTextToImageInput } from '../types';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';

interface GrokTextToImageFormProps {
  onSubmit: (input: GrokTextToImageInput) => void;
  isLoading: boolean;
}

export const GrokTextToImageForm: React.FC<GrokTextToImageFormProps> = ({ onSubmit, isLoading }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<GrokTextToImageInput>({
    prompt: '',
    aspect_ratio: '1:1',
  });

  const handleChange = (field: keyof GrokTextToImageInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = formData.prompt.trim();
    if (!prompt) return;

    onSubmit({
      prompt,
      aspect_ratio: formData.aspect_ratio || '1:1',
    });
  };

  const aspectOptions: Array<{ value: GrokTextToImageInput['aspect_ratio']; label: string }> = [
    { value: '1:1', label: '1:1' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '2:3', label: '2:3' },
    { value: '3:2', label: '3:2' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-fuchsia-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            GROK TEXT→IMAGE
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Model: grok-imagine/text-to-image • Fast text-only generation
        </p>
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          PROMPT <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="Describe the image you want to generate..."
          rows={4}
          maxLength={5000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-fuchsia-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-fuchsia-500'
          } focus:outline-none`}
          required
        />
        <div className={`text-right text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {formData.prompt.length}/5000
        </div>
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          ASPECT RATIO
        </label>
        <div className="grid grid-cols-3 gap-2">
          {aspectOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('aspect_ratio', option.value)}
              className={`px-3 py-2 text-xs font-mono border transition-all ${
                formData.aspect_ratio === option.value
                  ? isDark
                    ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300'
                    : 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600'
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

      <Button type="submit" disabled={isLoading || !formData.prompt.trim()} className="w-full">
        {isLoading ? 'GENERATING...' : 'GENERATE IMAGE'}
      </Button>
    </form>
  );
};

export default GrokTextToImageForm;
