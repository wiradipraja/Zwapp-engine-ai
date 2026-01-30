import React, { useState } from 'react';
import { StableDiffusionTextInput } from '../types';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';

interface StableDiffusionTextFormProps {
  onSubmit: (input: StableDiffusionTextInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const StableDiffusionTextForm: React.FC<StableDiffusionTextFormProps> = ({
  onSubmit,
  isLoading,
  apiKey = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<StableDiffusionTextInput>({
    prompt: '',
    negative_prompt: '',
    height: 1024,
    width: 1024,
    num_steps: 20,
    guidance_scale: 5,
  });

  const handleChange = (field: keyof StableDiffusionTextInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: StableDiffusionTextInput = { ...formData };
    if (!payload.negative_prompt) delete payload.negative_prompt;
    if (payload.seed === undefined || payload.seed === null) delete payload.seed;

    onSubmit(payload);
  };

  const canSubmit = !!formData.prompt.trim() && !!apiKey && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-orange-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            STABLE DIFFUSION SDXL
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Endpoint: /getSDXLImage (Pixazo)
        </p>
        {!apiKey && (
          <p className="mt-2 text-[10px] font-mono text-red-400">
            Pixazo API key is required. Open Settings to add it.
          </p>
        )}
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
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-orange-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-orange-500'
          } focus:outline-none`}
          required
        />
        <div className={`text-right text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {formData.prompt.length}/5000
        </div>
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          NEGATIVE PROMPT
        </label>
        <textarea
          value={formData.negative_prompt || ''}
          onChange={(e) => handleChange('negative_prompt', e.target.value)}
          placeholder="What should be avoided..."
          rows={3}
          maxLength={2000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-orange-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-orange-500'
          } focus:outline-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            WIDTH
          </label>
          <input
            type="number"
            min={256}
            max={2048}
            step={64}
            value={formData.width ?? 1024}
            onChange={(e) => handleChange('width', parseInt(e.target.value, 10))}
            className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-orange-500'
                : 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500'
            } focus:outline-none`}
          />
        </div>
        <div>
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            HEIGHT
          </label>
          <input
            type="number"
            min={256}
            max={2048}
            step={64}
            value={formData.height ?? 1024}
            onChange={(e) => handleChange('height', parseInt(e.target.value, 10))}
            className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-orange-500'
                : 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500'
            } focus:outline-none`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            NUM STEPS
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={formData.num_steps ?? 20}
            onChange={(e) => handleChange('num_steps', parseInt(e.target.value, 10))}
            className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-orange-500'
                : 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500'
            } focus:outline-none`}
          />
        </div>
        <div>
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            GUIDANCE SCALE
          </label>
          <input
            type="number"
            min={1}
            max={20}
            step={0.5}
            value={formData.guidance_scale ?? 5}
            onChange={(e) => handleChange('guidance_scale', parseFloat(e.target.value))}
            className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-orange-500'
                : 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500'
            } focus:outline-none`}
          />
        </div>
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          SEED
        </label>
        <input
          type="number"
          placeholder="Optional seed for reproducibility"
          value={formData.seed ?? ''}
          onChange={(e) => handleChange('seed', e.target.value ? parseInt(e.target.value, 10) : undefined)}
          className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-orange-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-orange-500'
          } focus:outline-none`}
        />
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading} disabled={!canSubmit}>
        {apiKey ? 'GENERATE IMAGE' : 'ADD PIXAZO KEY'}
      </Button>
    </form>
  );
};
