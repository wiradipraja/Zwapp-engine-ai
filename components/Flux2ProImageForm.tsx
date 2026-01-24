import React, { useState } from 'react';
import { Flux2ProImageInput } from '../types';
import { Button } from './ui/Button';
import { uploadImageToKieAI } from '../services/kieFileUpload';

interface Flux2ProImageFormProps {
  onSubmit: (input: Flux2ProImageInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const Flux2ProImageForm: React.FC<Flux2ProImageFormProps> = ({ onSubmit, isLoading, apiKey = '' }) => {
  const [formData, setFormData] = useState<Flux2ProImageInput>({
    prompt: '',
    image_url: '',
    strength: 0.95,
    image_size: 'landscape_4_3',
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
    sync_mode: false,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);

  const handleChange = (field: keyof Flux2ProImageInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File) => {
    if (!apiKey) {
      alert('API Key required for upload');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, WEBP files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const supabaseUrl = await uploadImageToKieAI(file, apiKey);
      handleChange('image_url', supabaseUrl);
      setUploadedFileName(file.name);
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt.trim()) {
      alert('Prompt is required');
      return;
    }
    if (!formData.image_url) {
      alert('Source image is required');
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
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600"></div>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 bg-pink-500 animate-pulse"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Flux 2 Pro</h2>
        <span className="text-xs text-zinc-500 font-mono ml-auto">Image to Image</span>
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700 p-3 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-pink-500">●</span>
          <span>Transform images with Flux 2 Pro image-to-image</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          Upload source image • Adjust strength • Generate variations
        </div>
      </div>

      {/* Source Image Upload */}
      <div>
        <label className={labelClass}>Source Image *</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all min-h-[150px] flex flex-col items-center justify-center ${
            dragOver 
              ? 'border-purple-500 bg-purple-500/10' 
              : formData.image_url 
                ? 'border-green-600 bg-green-900/20' 
                : 'border-zinc-700 hover:border-zinc-600'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs text-purple-400 font-mono">Uploading...</span>
            </div>
          ) : formData.image_url ? (
            <div className="relative">
              <img 
                src={formData.image_url} 
                alt="Source"
                className="max-h-32 object-contain rounded"
              />
              <button
                type="button"
                onClick={() => { handleChange('image_url', ''); setUploadedFileName(''); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-sm flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
              <p className="text-[10px] text-green-400 font-mono mt-2 truncate max-w-[200px]">
                {uploadedFileName || 'Uploaded'}
              </p>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="flux2pro-image-upload"
              />
              <label htmlFor="flux2pro-image-upload" className="cursor-pointer flex flex-col items-center">
                <div className="text-3xl mb-2">🖼️</div>
                <p className="text-zinc-400 text-sm font-mono">Drop image or click to upload</p>
                <p className="text-zinc-600 text-[10px] font-mono mt-1">JPG, PNG, WEBP (max 10MB)</p>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div>
        <label className={labelClass}>Prompt *</label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          maxLength={20000}
          className={`${inputClass} h-24 resize-none`}
          placeholder="Describe how to transform the image..."
          required
        />
        <div className="text-right text-xs text-zinc-600 mt-1 font-mono">{formData.prompt.length}/20000</div>
      </div>

      {/* Strength Slider */}
      <div>
        <label className={labelClass}>Transformation Strength: {formData.strength?.toFixed(2)}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={formData.strength}
          onChange={(e) => handleChange('strength', parseFloat(e.target.value))}
          className="w-full accent-purple-500 mt-2"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
          <span>0 - Keep original</span>
          <span>1 - Full transformation</span>
        </div>
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
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-zinc-800">
        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-500" 
          isLoading={isLoading}
          disabled={!formData.image_url || !formData.prompt.trim()}
        >
          {!formData.image_url ? 'UPLOAD SOURCE IMAGE FIRST' : 'TRANSFORM WITH FLUX 2 PRO'}
        </Button>
      </div>
    </form>
  );
};
