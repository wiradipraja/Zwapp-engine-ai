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
    image_size: 'landscape_4_3',
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
    sync_mode: false,
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
    onSubmit(formData);
  };

  const labelClass = "block text-xs font-mono text-purple-500 mb-1 tracking-widest uppercase";
  const inputClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors font-mono text-sm";
  const selectClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-purple-500 focus:outline-none font-mono text-sm appearance-none";

  const imageSizeOptions = [
    { value: 'square_hd', label: 'Square HD (1024x1024)' },
    { value: 'square', label: 'Square (512x512)' },
    { value: 'portrait_4_3', label: 'Portrait 4:3' },
    { value: 'portrait_16_9', label: 'Portrait 16:9' },
    { value: 'landscape_4_3', label: 'Landscape 4:3' },
    { value: 'landscape_16_9', label: 'Landscape 16:9' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/80 p-6 border border-zinc-800 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600"></div>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 bg-purple-500 animate-pulse"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Flux 2 Pro</h2>
        <span className="text-xs text-zinc-500 font-mono ml-auto">Text to Image</span>
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700 p-3 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-purple-500">●</span>
          <span>High-quality text-to-image generation with Flux 2 Pro</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          Advanced model • Up to 4 images per request • Multiple aspect ratios
        </div>
      </div>

      {/* Prompt */}
      <div>
        <label className={labelClass}>Prompt *</label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          maxLength={20000}
          className={`${inputClass} h-32 resize-none`}
          placeholder="Describe the image you want to generate..."
          required
        />
        <div className="text-right text-xs text-zinc-600 mt-1 font-mono">{formData.prompt.length}/20000</div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Image Size */}
        <div>
          <label className={labelClass}>Image Size</label>
          <div className="relative">
            <select 
              value={formData.image_size}
              onChange={(e) => handleChange('image_size', e.target.value)}
              className={selectClass}
            >
              {imageSizeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-purple-500">▼</div>
          </div>
        </div>

        {/* Output Format */}
        <div>
          <label className={labelClass}>Format</label>
          <div className="flex gap-2 mt-1">
            {['png', 'jpeg'].map((fmt) => (
              <label key={fmt} className={`flex-1 cursor-pointer border p-2 text-center transition-all ${formData.output_format === fmt ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                <input
                  type="radio"
                  name="output_format"
                  className="hidden"
                  checked={formData.output_format === fmt}
                  onChange={() => handleChange('output_format', fmt)}
                />
                <span className="text-xs font-bold font-mono uppercase">{fmt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Number of Images */}
        <div>
          <label className={labelClass}>Num Images</label>
          <div className="flex gap-2 mt-1">
            {[1, 2, 3, 4].map((num) => (
              <label key={num} className={`flex-1 cursor-pointer border p-2 text-center transition-all ${formData.num_images === num ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                <input
                  type="radio"
                  name="num_images"
                  className="hidden"
                  checked={formData.num_images === num}
                  onChange={() => handleChange('num_images', num)}
                />
                <span className="text-xs font-bold font-mono">{num}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Inference Steps */}
        <div>
          <label className={labelClass}>Steps: {formData.num_inference_steps}</label>
          <input
            type="range"
            min="1"
            max="50"
            value={formData.num_inference_steps}
            onChange={(e) => handleChange('num_inference_steps', parseInt(e.target.value))}
            className="w-full accent-purple-500 mt-2"
          />
        </div>

        {/* Guidance Scale */}
        <div className="col-span-2">
          <label className={labelClass}>Guidance Scale: {formData.guidance_scale}</label>
          <input
            type="range"
            min="1.5"
            max="5"
            step="0.1"
            value={formData.guidance_scale}
            onChange={(e) => handleChange('guidance_scale', parseFloat(e.target.value))}
            className="w-full accent-purple-500 mt-2"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
            <span>1.5 - Creative</span>
            <span>5.0 - Strict</span>
          </div>
        </div>
      </div>

      {/* Safety Checker */}
      <div className="flex items-center gap-3 p-3 border border-zinc-800 bg-zinc-950">
        <input
          type="checkbox"
          id="safety_checker"
          checked={formData.enable_safety_checker}
          onChange={(e) => handleChange('enable_safety_checker', e.target.checked)}
          className="w-4 h-4 accent-purple-500"
        />
        <label htmlFor="safety_checker" className="text-sm text-zinc-400 cursor-pointer">
          Enable Safety Checker
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-zinc-800">
        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-500" 
          isLoading={isLoading}
          disabled={!formData.prompt.trim()}
        >
          GENERATE WITH FLUX 2 PRO
        </Button>
      </div>
    </form>
  );
};
