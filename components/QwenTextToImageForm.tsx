import React, { useState } from 'react';
import { QwenTextToImageInput } from '../types';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';

interface QwenTextToImageFormProps {
  onSubmit: (input: QwenTextToImageInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const QwenTextToImageForm: React.FC<QwenTextToImageFormProps> = ({ onSubmit, isLoading }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<QwenTextToImageInput>({
    prompt: '',
    image_size: 'square_hd',
    num_inference_steps: 30,
    guidance_scale: 2.5,
    enable_safety_checker: true,
    output_format: 'png',
    negative_prompt: '',
    acceleration: 'none',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof QwenTextToImageInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = { ...formData };
    // Remove default/empty values
    if (payload.seed === undefined || payload.seed === -1) {
      delete payload.seed;
    }
    if (!payload.negative_prompt) {
      delete payload.negative_prompt;
    }
    
    onSubmit(payload);
  };

  const imageSizeOptions = [
    { value: 'square', label: 'Square (512×512)' },
    { value: 'square_hd', label: 'Square HD (1024×1024)' },
    { value: 'portrait_4_3', label: 'Portrait 3:4 (768×1024)' },
    { value: 'portrait_16_9', label: 'Portrait 9:16 (576×1024)' },
    { value: 'landscape_4_3', label: 'Landscape 4:3 (1024×768)' },
    { value: 'landscape_16_9', label: 'Landscape 16:9 (1024×576)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-cyan-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            QWEN TEXT→IMAGE
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Model: qwen/text-to-image • Generate images from text prompts
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
          placeholder="Describe the image you want to generate..."
          rows={4}
          maxLength={5000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark 
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-cyan-500' 
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-cyan-500'
          } focus:outline-none`}
          required
        />
        <div className={`text-right text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {formData.prompt.length}/5000
        </div>
      </div>

      {/* Image Size */}
      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          IMAGE SIZE
        </label>
        <div className="grid grid-cols-2 gap-2">
          {imageSizeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('image_size', option.value)}
              className={`px-3 py-2 text-xs font-mono border transition-all ${
                formData.image_size === option.value
                  ? isDark
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-cyan-500 bg-cyan-50 text-cyan-600'
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

      {/* Output Format */}
      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          OUTPUT FORMAT
        </label>
        <div className="flex gap-2">
          {['png', 'jpeg'].map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => handleChange('output_format', format)}
              className={`flex-1 px-3 py-2 text-xs font-mono border transition-all ${
                formData.output_format === format
                  ? isDark
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-cyan-500 bg-cyan-50 text-cyan-600'
                  : isDark
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                    : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400'
              }`}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Acceleration */}
      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          ACCELERATION
        </label>
        <div className="flex gap-2">
          {[
            { value: 'none', label: 'None' },
            { value: 'regular', label: 'Regular' },
            { value: 'high', label: 'High' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('acceleration', option.value)}
              className={`flex-1 px-3 py-2 text-xs font-mono border transition-all ${
                formData.acceleration === option.value
                  ? isDark
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-cyan-500 bg-cyan-50 text-cyan-600'
                  : isDark
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                    : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className={`text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          'High' recommended for images without text
        </p>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={`w-full flex items-center justify-between px-3 py-2 border text-xs font-mono transition-colors ${
          isDark 
            ? 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300' 
            : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:text-zinc-700'
        }`}
      >
        <span>ADVANCED SETTINGS</span>
        <svg 
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Advanced Settings Panel */}
      {showAdvanced && (
        <div className={`space-y-4 p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-50/50'}`}>
          {/* Negative Prompt */}
          <div>
            <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              NEGATIVE PROMPT
            </label>
            <textarea
              value={formData.negative_prompt || ''}
              onChange={(e) => handleChange('negative_prompt', e.target.value)}
              placeholder="What to avoid in the image..."
              rows={2}
              maxLength={500}
              className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-cyan-500' 
                  : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-cyan-500'
              } focus:outline-none`}
            />
          </div>

          {/* Inference Steps */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                INFERENCE STEPS
              </label>
              <span className={`text-xs font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {formData.num_inference_steps}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="250"
              step="1"
              value={formData.num_inference_steps}
              onChange={(e) => handleChange('num_inference_steps', parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <span>2</span>
              <span>250</span>
            </div>
          </div>

          {/* Guidance Scale */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                GUIDANCE SCALE (CFG)
              </label>
              <span className={`text-xs font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {formData.guidance_scale?.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.1"
              value={formData.guidance_scale}
              onChange={(e) => handleChange('guidance_scale', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <span>0</span>
              <span>20</span>
            </div>
          </div>

          {/* Seed */}
          <div>
            <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              SEED (optional)
            </label>
            <input
              type="number"
              value={formData.seed ?? ''}
              onChange={(e) => handleChange('seed', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Random seed for reproducibility"
              className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-cyan-500' 
                  : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-cyan-500'
              } focus:outline-none`}
            />
          </div>

          {/* Safety Checker */}
          <div className="flex items-center justify-between">
            <label className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              SAFETY CHECKER
            </label>
            <button
              type="button"
              onClick={() => handleChange('enable_safety_checker', !formData.enable_safety_checker)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                formData.enable_safety_checker 
                  ? 'bg-cyan-500' 
                  : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
              }`}
            >
              <span 
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.enable_safety_checker ? 'left-7' : 'left-1'
                }`} 
              />
            </button>
          </div>
        </div>
      )}

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
          'GENERATE IMAGE'
        )}
      </Button>

      {/* API Info */}
      <div className={`text-center text-[10px] font-mono ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>
        API: POST /api/v1/jobs/createTask • Model: qwen/text-to-image
      </div>
    </form>
  );
};

export default QwenTextToImageForm;
