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
    input_urls: [],
    prompt: '',
    aspect_ratio: '1:1',
    resolution: '2K',
  });

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);

  const handleChange = (field: keyof Flux2FlexImageInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, index: number) => {
    if (!apiKey) {
      alert('API Key required for upload. Please set it in Settings.');
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

    setUploadingIndex(index);
    try {
      const uploadedUrl = await uploadImageToKieAI(file, apiKey);
      
      const newUrls = [...formData.input_urls];
      newUrls[index] = uploadedUrl;
      handleChange('input_urls', newUrls.filter(url => url));

      const newFiles = [...uploadedFiles];
      newFiles[index] = { name: file.name, url: uploadedUrl };
      setUploadedFiles(newFiles.filter(f => f));

    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file, index);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newUrls = formData.input_urls.filter((_, i) => i !== index);
    handleChange('input_urls', newUrls);
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
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
    if (formData.input_urls.length === 0) {
      alert('At least one input image is required');
      return;
    }
    onSubmit(formData);
  };

  const labelClass = "block text-xs font-mono text-teal-500 mb-1 tracking-widest uppercase";
  const inputClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors font-mono text-sm";

  const aspectRatioOptions = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:3', label: '4:3 (Landscape)' },
    { value: '3:4', label: '3:4 (Portrait)' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '9:16', label: '9:16 (Vertical)' },
    { value: '3:2', label: '3:2 (Classic)' },
    { value: '2:3', label: '2:3 (Classic Portrait)' },
    { value: 'auto', label: 'Auto (Based on first image)' },
  ];

  const resolutionOptions = [
    { value: '1K', label: '1K (Fast)' },
    { value: '2K', label: '2K (High Quality)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/80 p-6 border border-zinc-800 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-600 via-cyan-500 to-teal-600"></div>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 bg-teal-500 animate-pulse"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Flux 2 Flex</h2>
        <span className="text-xs text-zinc-500 font-mono ml-auto">IMAGE → IMAGE</span>
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700 p-3 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-teal-500">●</span>
          <span>Transform images with Flux 2 Flex image-to-image</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          Model: flux-2/flex-image-to-image • Upload 1-8 reference images
        </div>
      </div>

      {/* Input Images Upload Section */}
      <div>
        <label className={labelClass}>Input Images (1-8) *</label>
        <p className="text-[10px] text-zinc-600 font-mono mb-3">
          Upload reference images for transformation. Max 10MB each.
        </p>
        
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <div
              key={index}
              onDragOver={(e) => { e.preventDefault(); setDragOver(index); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, index)}
              className={`border-2 border-dashed p-2 text-center cursor-pointer transition-all min-h-[100px] flex flex-col items-center justify-center ${
                dragOver === index 
                  ? 'border-teal-500 bg-teal-500/10' 
                  : formData.input_urls[index] 
                    ? 'border-green-600 bg-green-900/20' 
                    : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {uploadingIndex === index ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : formData.input_urls[index] ? (
                <div className="relative w-full h-full">
                  <img 
                    src={formData.input_urls[index]} 
                    alt={`Input ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-500"
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
                      if (file) handleFileUpload(file, index);
                    }}
                    className="hidden"
                    id={`flux2flex-img-upload-${index}`}
                  />
                  <label htmlFor={`flux2flex-img-upload-${index}`} className="cursor-pointer flex flex-col items-center">
                    <span className="text-xl mb-1">📷</span>
                    <span className="text-[9px] text-zinc-600 font-mono">#{index + 1}</span>
                  </label>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500 font-mono mt-2">
          Uploaded: {formData.input_urls.length}/8 images
        </p>
      </div>

      {/* Prompt */}
      <div>
        <label className={labelClass}>Prompt *</label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          maxLength={5000}
          className={`${inputClass} h-24 resize-none`}
          placeholder="Describe how to transform the images (e.g., 'Replace the can in image 2 with the can from image 1')..."
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
            <div className="absolute right-3 top-3 pointer-events-none text-teal-500">▼</div>
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
                    ? 'border-teal-500 bg-teal-500/10 text-white' 
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                }`}
              >
                <input
                  type="radio"
                  name="resolution_flex_img"
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

      {/* Submit Button */}
      <Button 
        type="submit" 
        variant="primary"
        className="w-full" 
        isLoading={isLoading}
        disabled={formData.input_urls.length === 0 || !formData.prompt.trim()}
      >
        {formData.input_urls.length === 0 ? 'UPLOAD IMAGES FIRST' : '⚡ TRANSFORM IMAGES'}
      </Button>

      {/* API Info */}
      <div className="text-[10px] text-zinc-600 font-mono text-center border-t border-zinc-800 pt-4">
        API: POST /api/v1/jobs/createTask • Model: flux-2/flex-image-to-image
      </div>
    </form>
  );
};
