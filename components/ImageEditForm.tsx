import React, { useState } from 'react';
import { ImageEditInput } from '../types';
import { Button } from './ui/Button';
import { Dropzone } from './ui/Dropzone';
import { uploadImageToKieAI, fileToDataURL } from '../services/kieFileUpload';

interface ImageEditFormProps {
  onSubmit: (input: ImageEditInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const ImageEditForm: React.FC<ImageEditFormProps> = ({ onSubmit, isLoading, apiKey = '' }) => {
  const [formData, setFormData] = useState<ImageEditInput>({
    prompt: '',
    image_url: '',
    strength: 0.8,
    negative_prompt: 'blurry, ugly',
    image_size: 'landscape_4_3',
    output_format: 'png',
    acceleration: 'none',
    num_inference_steps: 30, // API default: 30, range: 2-250
    guidance_scale: 2.5, // API default: 2.5, range: 0-20
    seed: -1, 
    enable_safety_checker: true,
    num_images: '1'
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = (field: keyof ImageEditInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (previewBase64: string, file?: File) => {
    // 1. Set preview immediately for UI
    setPreviewUrl(previewBase64);
    setUploadError(null);
    // Clear previous URL so user can't submit before new upload finishes
    handleChange('image_url', '');

    // 2. If valid file, upload to KIE.AI
    if (file) {
        setIsUploading(true);
        try {
            if (!apiKey) {
              throw new Error('API Key required');
            }
            const publicUrl = await uploadImageToKieAI(file, apiKey);
            console.log("KIE.AI URL:", publicUrl);
            // Replace base64 with real URL
            handleChange('image_url', publicUrl);
        } catch (error: any) {
            console.error("Upload failed", error);
            setUploadError(error.message);
        } finally {
            setIsUploading(false);
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check: Don't send Base64 strings to API
    if (formData.image_url.startsWith('data:')) {
        setUploadError("WAITING FOR UPLOAD...");
        return;
    }

    const payload = { ...formData };
    // Remove default/empty values to keep payload clean
    if (payload.seed === -1) {
        delete payload.seed;
    }
    if (payload.num_images === '1') {
        delete payload.num_images;
    }
    onSubmit(payload);
  };

  const labelClass = "block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase";
  const inputClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-sm";
  const selectClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-orange-500 focus:outline-none font-mono text-sm appearance-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/80 p-6 border border-zinc-800 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600"></div>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 bg-orange-500 animate-pulse"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Image Edit Matrix</h2>
      </div>

      {/* Primary Inputs */}
      <div>
        <Dropzone 
            label="Source Image (Required)"
            subLabel="Supported: JPG, PNG, WEBP (Max 10MB)"
            accept="image/png, image/jpeg, image/webp"
            value={previewUrl}
            onFileSelect={handleFileSelect}
            onTextChange={(val) => {
                setPreviewUrl(val);
                handleChange('image_url', val); // Direct URL input is fine
            }}
            isUploading={isUploading}
        />
        <div className="mt-1 flex justify-between items-center">
             <div className="text-[10px] text-zinc-600 font-mono">
                * Auto-syncs to Supabase Storage for high-speed processing.
            </div>
            {uploadError && (
                <div className="text-[10px] text-red-500 font-bold font-mono animate-pulse">
                    {uploadError}
                </div>
            )}
        </div>
      </div>

      <div>
        <label className={labelClass}>Edit Prompt</label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          maxLength={2000}
          className={`${inputClass} h-24 resize-none`}
          placeholder="Describe how to modify the image..."
          required
        />
        <div className="text-right text-xs text-zinc-600 mt-1 font-mono">{formData.prompt.length}/2000</div>
      </div>

      <div className="grid grid-cols-2 gap-6">
         <div>
          <label className={labelClass}>Dimensions</label>
          <div className="relative">
            <select 
                value={formData.image_size}
                onChange={(e) => handleChange('image_size', e.target.value)}
                className={selectClass}
            >
                {['square', 'square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'].map(r => (
                    <option key={r} value={r}>{r}</option>
                ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-orange-500">▼</div>
          </div>
         </div>
         
         <div>
            <label className={labelClass}>Negative Prompt</label>
            <input 
                type="text"
                value={formData.negative_prompt}
                onChange={(e) => handleChange('negative_prompt', e.target.value)}
                className={inputClass}
                placeholder="blurry, ugly"
            />
         </div>
      </div>

      {/* Advanced Toggle */}
      <div className="border-t border-zinc-800 pt-4">
        <button 
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-orange-500 transition-colors uppercase tracking-wider"
        >
            <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
            Advanced Configuration
        </button>

        {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                
                <div>
                  <label className={labelClass}>Strength (Denoising)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0" 
                      max="1"
                      step="0.01" 
                      value={formData.strength ?? 0.8} 
                      onChange={(e) => handleChange('strength', parseFloat(e.target.value))}
                      className="w-full accent-orange-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-orange-500 font-mono text-sm w-10">{(formData.strength ?? 0.8).toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">1.0 = fully remake, 0.0 = preserve original</div>
                </div>

                <div>
                  <label className={labelClass}>Acceleration Mode</label>
                  <div className="flex gap-2 mt-1">
                    {['none', 'regular', 'high'].map((acc) => (
                      <label key={acc} className={`flex-1 cursor-pointer border p-2 text-center transition-all ${formData.acceleration === acc ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                        <input
                          type="radio"
                          name="acceleration"
                          className="hidden"
                          checked={formData.acceleration === acc}
                          onChange={() => handleChange('acceleration', acc)}
                        />
                        <span className="text-[10px] font-bold font-mono uppercase">{acc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                    <label className={labelClass}>Output Format</label>
                     <div className="flex gap-2 mt-1">
                        {['png', 'jpeg'].map((fmt) => (
                        <label key={fmt} className={`flex-1 cursor-pointer border p-2 text-center transition-all ${formData.output_format === fmt ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                            <input
                            type="radio"
                            name="output_format"
                            className="hidden"
                            checked={formData.output_format === fmt}
                            onChange={() => handleChange('output_format', fmt)}
                            />
                            <span className="text-[10px] font-bold font-mono uppercase">{fmt}</span>
                        </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Inference Steps (2-250)</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="range" 
                            min="2" 
                            max="250" 
                            value={formData.num_inference_steps} 
                            onChange={(e) => handleChange('num_inference_steps', parseInt(e.target.value))}
                            className="w-full accent-orange-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-orange-500 font-mono text-sm w-10">{formData.num_inference_steps}</span>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Guidance Scale (CFG)</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="range" 
                            min="0" 
                            max="20"
                            step="0.1" 
                            value={formData.guidance_scale} 
                            onChange={(e) => handleChange('guidance_scale', parseFloat(e.target.value))}
                            className="w-full accent-orange-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-orange-500 font-mono text-sm w-8">{formData.guidance_scale}</span>
                    </div>
                </div>

                <div>
                   <label className={labelClass}>Seed (-1 for Random)</label>
                   <input 
                        type="number"
                        value={formData.seed}
                        onChange={(e) => handleChange('seed', parseInt(e.target.value))}
                        className={inputClass}
                   />
                </div>

                <div className="flex items-center gap-4 mt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-mono text-zinc-400 hover:text-white transition-colors">
                        <input 
                            type="checkbox"
                            checked={formData.enable_safety_checker}
                            onChange={(e) => handleChange('enable_safety_checker', e.target.checked)}
                            className="w-4 h-4 accent-orange-500 bg-zinc-900 border-zinc-700 rounded focus:ring-orange-500 focus:ring-offset-0"
                        />
                        Safety Checker
                    </label>
                </div>

            </div>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <Button type="submit" className="w-full" isLoading={isLoading} disabled={!formData.image_url || isUploading}>
          {isUploading ? 'WAITING FOR UPLOAD...' : 'INITIATE EDIT SEQUENCE'}
        </Button>
      </div>
    </form>
  );
};