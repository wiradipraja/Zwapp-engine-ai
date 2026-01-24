import React, { useState } from 'react';
import { Flux2FlexImageInput } from '../types';
import { Button } from './ui/Button';
import { uploadImageToKieAI } from '../services/kieFileUpload';

interface Flux2FlexImageFormProps {
  onSubmit: (input: Flux2FlexImageInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const Flux2FlexImageForm: React.FC<Flux2FlexImageFormProps> = ({ onSubmit, isLoading, apiKey = '' }) => {
  const [formData, setFormData] = useState<Flux2FlexImageInput>({
    prompt: '',
    image_url: '',
    image_urls: [],
    strength: 0.75,
    aspect_ratio: '1:1',
    num_images: 1,
    enable_safety_checker: true,
    safety_tolerance: 2,
    output_format: 'png',
    sync_mode: false,
  });

  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [mainFileName, setMainFileName] = useState<string>('');
  const [dragOverMain, setDragOverMain] = useState(false);
  
  const [uploadingRefIndex, setUploadingRefIndex] = useState<number | null>(null);
  const [dragOverRef, setDragOverRef] = useState<number | null>(null);
  const [uploadedRefFiles, setUploadedRefFiles] = useState<{ name: string; url: string }[]>([]);

  const handleChange = (field: keyof Flux2FlexImageInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Main image upload
  const handleMainFileUpload = async (file: File) => {
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

    setIsUploadingMain(true);
    try {
      const supabaseUrl = await uploadImageToKieAI(file, apiKey);
      handleChange('image_url', supabaseUrl);
      setMainFileName(file.name);
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploadingMain(false);
    }
  };

  const handleMainDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverMain(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleMainFileUpload(file);
    }
  };

  // Reference images upload
  const handleRefFileUpload = async (file: File, index: number) => {
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

    setUploadingRefIndex(index);
    try {
      const supabaseUrl = await uploadImageToKieAI(file, apiKey);
      
      const newUrls = [...(formData.image_urls || [])];
      newUrls[index] = supabaseUrl;
      handleChange('image_urls', newUrls.filter(url => url));

      const newFiles = [...uploadedRefFiles];
      newFiles[index] = { name: file.name, url: supabaseUrl };
      setUploadedRefFiles(newFiles.filter(f => f));

    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploadingRefIndex(null);
    }
  };

  const handleRefDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOverRef(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleRefFileUpload(file, index);
    }
  };

  const handleRemoveRefImage = (index: number) => {
    const newUrls = (formData.image_urls || []).filter((_, i) => i !== index);
    handleChange('image_urls', newUrls);
    const newFiles = uploadedRefFiles.filter((_, i) => i !== index);
    setUploadedRefFiles(newFiles);
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

  const labelClass = "block text-xs font-mono text-teal-500 mb-1 tracking-widest uppercase";
  const inputClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors font-mono text-sm";
  const selectClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-teal-500 focus:outline-none font-mono text-sm appearance-none";

  const aspectRatioOptions = ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', '9:21'] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/80 p-6 border border-zinc-800 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-600 via-cyan-500 to-teal-600"></div>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 bg-teal-500 animate-pulse"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Flux 2 Flex</h2>
        <span className="text-xs text-zinc-500 font-mono ml-auto">Image to Image</span>
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700 p-3 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-teal-500">●</span>
          <span>Transform images with Flux 2 Flex + optional references</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          Upload source image • Add optional references • Adjust strength
        </div>
      </div>

      {/* Source Image Upload */}
      <div>
        <label className={labelClass}>Source Image *</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOverMain(true); }}
          onDragLeave={() => setDragOverMain(false)}
          onDrop={handleMainDrop}
          className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all min-h-[150px] flex flex-col items-center justify-center ${
            dragOverMain 
              ? 'border-teal-500 bg-teal-500/10' 
              : formData.image_url 
                ? 'border-green-600 bg-green-900/20' 
                : 'border-zinc-700 hover:border-zinc-600'
          }`}
        >
          {isUploadingMain ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs text-teal-400 font-mono">Uploading...</span>
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
                onClick={() => { handleChange('image_url', ''); setMainFileName(''); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-sm flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
              <p className="text-[10px] text-green-400 font-mono mt-2 truncate max-w-[200px]">
                {mainFileName || 'Uploaded'}
              </p>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMainFileUpload(file);
                }}
                className="hidden"
                id="flux2flex-image-main-upload"
              />
              <label htmlFor="flux2flex-image-main-upload" className="cursor-pointer flex flex-col items-center">
                <div className="text-3xl mb-2">🖼️</div>
                <p className="text-zinc-400 text-sm font-mono">Drop source image or click to upload</p>
                <p className="text-zinc-600 text-[10px] font-mono mt-1">JPG, PNG, WEBP (max 10MB)</p>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Optional Reference Images */}
      <div>
        <label className={labelClass}>Reference Images (Optional, Max 4)</label>
        <p className="text-[10px] text-zinc-600 font-mono mb-3">
          Additional style references for transformation.
        </p>
        
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              onDragOver={(e) => { e.preventDefault(); setDragOverRef(index); }}
              onDragLeave={() => setDragOverRef(null)}
              onDrop={(e) => handleRefDrop(e, index)}
              className={`border-2 border-dashed p-2 text-center cursor-pointer transition-all min-h-[80px] flex flex-col items-center justify-center ${
                dragOverRef === index 
                  ? 'border-teal-500 bg-teal-500/10' 
                  : (formData.image_urls || [])[index] 
                    ? 'border-green-600 bg-green-900/20' 
                    : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {uploadingRefIndex === index ? (
                <svg className="animate-spin h-5 w-5 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (formData.image_urls || [])[index] ? (
                <div className="relative w-full h-full">
                  <img 
                    src={(formData.image_urls || [])[index]} 
                    alt={`Ref ${index + 1}`}
                    className="w-full h-14 object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRefImage(index)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center hover:bg-red-500"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleRefFileUpload(file, index);
                    }}
                    className="hidden"
                    id={`flux2flex-image-ref-${index}`}
                  />
                  <label htmlFor={`flux2flex-image-ref-${index}`} className="cursor-pointer text-zinc-600 text-[10px] font-mono">
                    ➕ Ref {index + 1}
                  </label>
                </>
              )}
            </div>
          ))}
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
          className="w-full accent-teal-500 mt-2"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
          <span>0 - Keep original</span>
          <span>1 - Full transformation</span>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Aspect Ratio */}
        <div>
          <label className={labelClass}>Aspect Ratio</label>
          <div className="relative">
            <select 
              value={formData.aspect_ratio}
              onChange={(e) => handleChange('aspect_ratio', e.target.value)}
              className={selectClass}
            >
              {aspectRatioOptions.map(ratio => (
                <option key={ratio} value={ratio}>{ratio}</option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-teal-500">▼</div>
          </div>
        </div>

        {/* Output Format */}
        <div>
          <label className={labelClass}>Format</label>
          <div className="flex gap-2 mt-1">
            {['png', 'jpeg'].map((fmt) => (
              <label key={fmt} className={`flex-1 cursor-pointer border p-2 text-center transition-all ${formData.output_format === fmt ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                <input
                  type="radio"
                  name="output_format_flex_img"
                  className="hidden"
                  checked={formData.output_format === fmt}
                  onChange={() => handleChange('output_format', fmt)}
                />
                <span className="text-xs font-bold font-mono uppercase">{fmt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Safety Tolerance */}
        <div>
          <label className={labelClass}>Safety</label>
          <div className="relative">
            <select 
              value={formData.safety_tolerance}
              onChange={(e) => handleChange('safety_tolerance', parseInt(e.target.value))}
              className={selectClass}
            >
              <option value={1}>1 - Strict</option>
              <option value={2}>2 - Safe</option>
              <option value={3}>3 - Moderate</option>
              <option value={4}>4 - Relaxed</option>
              <option value={5}>5 - Lenient</option>
              <option value={6}>6 - Permissive</option>
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-teal-500">▼</div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-zinc-800">
        <Button 
          type="submit" 
          className="w-full bg-teal-600 hover:bg-teal-500" 
          isLoading={isLoading}
          disabled={!formData.image_url || !formData.prompt.trim()}
        >
          {!formData.image_url ? 'UPLOAD SOURCE IMAGE FIRST' : 'TRANSFORM WITH FLUX 2 FLEX'}
        </Button>
      </div>
    </form>
  );
};
