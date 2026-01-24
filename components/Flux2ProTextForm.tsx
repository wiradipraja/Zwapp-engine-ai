import React, { useState } from 'react';
import { Flux2ProTextInput } from '../types';
import { Button } from './ui/Button';

interface Flux2ProTextFormProps {
  onSubmit: (input: Flux2ProTextInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const Flux2ProTextForm: React.FC<Flux2ProTextFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<Flux2ProTextInput>({
    prompt: '',
    aspect_ratio: '1:1',
    resolution: '2K',
  });

  const handleChange = (field: keyof Flux2ProTextInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt.trim()) {
      alert('Prompt is required');
      return;
    }
    if (formData.prompt.length < 3) {
      alert('Prompt must be at least 3 characters');
      return;
    }
    if (formData.prompt.length > 5000) {
      alert('Prompt must be less than 5000 characters');
      return;
    }
    onSubmit(formData);
  };

  const labelClass = "block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase";
  const inputClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-sm";

  const aspectRatioOptions = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:3', label: '4:3 (Landscape)' },
    { value: '3:4', label: '3:4 (Portrait)' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '9:16', label: '9:16 (Vertical)' },
    { value: '3:2', label: '3:2 (Classic)' },
    { value: '2:3', label: '2:3 (Classic Portrait)' },
  ];

  const resolutionOptions = [
    { value: '1K', label: '1K (Fast)' },
    { value: '2K', label: '2K (High Quality)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/80 p-6 border border-zinc-800 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600"></div>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 bg-orange-500 animate-pulse"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Flux 2 Pro</h2>
        <span className="text-xs text-zinc-500 font-mono ml-auto">TEXT → IMAGE</span>
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700 p-3 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-orange-500">●</span>
          <span>High-quality text-to-image generation with Flux 2 Pro</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          Model: flux-2/pro-text-to-image • Up to 2K resolution
        </div>
      </div>

      {/* Prompt */}
      <div>
        <label className={labelClass}>Prompt *</label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          maxLength={5000}
          className={`${inputClass} h-32 resize-none`}
          placeholder="Describe the image you want to generate (3-5000 characters)..."
          required
        />
        <div className="flex justify-between text-xs text-zinc-600 mt-1 font-mono">
          <span>Min: 3 characters</span>
          <span>{formData.prompt.length}/5000</span>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Aspect Ratio */}
        <div>
          <label className={labelClass}>Aspect Ratio *</label>
          <div className="relative">
            <select 
              value={formData.aspect_ratio}
              onChange={(e) => handleChange('aspect_ratio', e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              {aspectRatioOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-orange-500">▼</div>
          </div>
        </div>

        {/* Resolution */}
        <div>
          <label className={labelClass}>Resolution *</label>
          <div className="flex gap-2 mt-1">
            {resolutionOptions.map((opt) => (
              <label 
                key={opt.value} 
                className={`flex-1 cursor-pointer border p-3 text-center transition-all ${
                  formData.resolution === opt.value 
                    ? 'border-orange-500 bg-orange-500/10 text-white' 
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                }`}
              >
                <input
                  type="radio"
                  name="resolution"
                  className="hidden"
                  checked={formData.resolution === opt.value}
                  onChange={() => handleChange('resolution', opt.value)}
                />
                <span className="text-xs font-bold font-mono uppercase">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Aspect Ratio Visual Preview */}
      <div className="border border-zinc-800 p-4">
        <label className={labelClass}>Preview Ratio</label>
        <div className="flex items-center justify-center mt-2">
          <div 
            className={`border-2 border-orange-500/50 bg-orange-500/5 transition-all flex items-center justify-center ${
              formData.aspect_ratio === '1:1' ? 'w-24 h-24' :
              formData.aspect_ratio === '4:3' ? 'w-32 h-24' :
              formData.aspect_ratio === '3:4' ? 'w-24 h-32' :
              formData.aspect_ratio === '16:9' ? 'w-36 h-20' :
              formData.aspect_ratio === '9:16' ? 'w-20 h-36' :
              formData.aspect_ratio === '3:2' ? 'w-30 h-20' :
              formData.aspect_ratio === '2:3' ? 'w-20 h-30' :
              'w-24 h-24'
            }`}
          >
            <span className="text-orange-500/50 text-xs font-mono">{formData.aspect_ratio}</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button 
        type="submit" 
        variant="primary" 
        isLoading={isLoading}
        className="w-full"
      >
        ⚡ GENERATE IMAGE
      </Button>

      {/* API Info */}
      <div className="text-[10px] text-zinc-600 font-mono text-center border-t border-zinc-800 pt-4">
        API: POST /api/v1/jobs/createTask • Model: flux-2/pro-text-to-image
      </div>
    </form>
  );
};
