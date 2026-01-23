import React, { useState } from 'react';
import { FlexImageInput } from '../types';
import { Button } from './ui/Button';
import { uploadImageToKieAI } from '../services/kieFileUpload';

interface FlexImageFormProps {
  onSubmit: (input: FlexImageInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const FlexImageForm: React.FC<FlexImageFormProps> = ({ onSubmit, isLoading, apiKey = '' }) => {
  const [formData, setFormData] = useState<FlexImageInput>({
    prompt: 'A professional photo of a person holding a product, studio lighting, clean background',
    image_urls: [],
    aspect_ratio: '1:1',
    output_format: 'png',
    safety_tolerance: 2,
  });

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);

  const handleChange = (field: keyof FlexImageInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, index: number) => {
    if (!apiKey) {
      alert('API Key required for upload');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, WEBP files are allowed');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingIndex(index);
    try {
      // Upload to Supabase and get public URL
      const supabaseUrl = await uploadImageToKieAI(file, apiKey);
      
      // Update form data with new URL
      const newUrls = [...formData.image_urls];
      newUrls[index] = supabaseUrl;
      handleChange('image_urls', newUrls.filter(url => url)); // Remove empty entries

      // Track uploaded file info
      const newFiles = [...uploadedFiles];
      newFiles[index] = { name: file.name, url: supabaseUrl };
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
    const newUrls = formData.image_urls.filter((_, i) => i !== index);
    handleChange('image_urls', newUrls);
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt.trim()) {
      alert('Prompt is required');
      return;
    }
    if (formData.image_urls.length === 0) {
      alert('At least one reference image is required');
      return;
    }
    onSubmit(formData);
  };

  const labelClass = "block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase";
  const inputClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-sm";
  const selectClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-orange-500 focus:outline-none font-mono text-sm appearance-none";

  const aspectRatioOptions = ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', '9:21'] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/80 p-6 border border-zinc-800 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-600"></div>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 bg-cyan-500 animate-pulse"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">Flex Image</h2>
        <span className="text-xs text-zinc-500 font-mono ml-auto">Reference-Based</span>
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700 p-3 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-cyan-500">●</span>
          <span>Generate images with reference image guidance</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          Upload up to 4 reference images • Images stored in Supabase • URLs sent to API
        </div>
      </div>

      {/* Reference Images Upload Section */}
      <div>
        <label className={labelClass}>Reference Images (Max 4) *</label>
        <p className="text-[10px] text-zinc-600 font-mono mb-3">
          Upload reference images to guide the generation. Images are uploaded to Supabase.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              onDragOver={(e) => { e.preventDefault(); setDragOver(index); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, index)}
              className={`border-2 border-dashed p-3 text-center cursor-pointer transition-all min-h-[120px] flex flex-col items-center justify-center ${
                dragOver === index 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : formData.image_urls[index] 
                    ? 'border-green-600 bg-green-900/20' 
                    : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {uploadingIndex === index ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs text-cyan-400 font-mono">Uploading...</span>
                </div>
              ) : formData.image_urls[index] ? (
                <div className="relative w-full h-full">
                  <img 
                    src={formData.image_urls[index]} 
                    alt={`Reference ${index + 1}`}
                    className="w-full h-20 object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    ✕
                  </button>
                  <p className="text-[9px] text-green-400 font-mono mt-1 truncate">
                    {uploadedFiles[index]?.name || 'Uploaded'}
                  </p>
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
                    id={`flex-image-upload-${index}`}
                  />
                  <label htmlFor={`flex-image-upload-${index}`} className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                    <div className="text-2xl mb-1">{index === 0 ? '🖼️' : '➕'}</div>
                    <p className="text-zinc-500 text-[10px] font-mono">
                      {index === 0 ? 'Primary Ref' : `Ref ${index + 1}`}
                    </p>
                    <p className="text-zinc-600 text-[9px] font-mono">Drop or click</p>
                  </label>
                </>
              )}
            </div>
          ))}
        </div>

        {formData.image_urls.length > 0 && (
          <div className="mt-2 text-xs text-green-500 font-mono">
            ✓ {formData.image_urls.length} image(s) uploaded to Supabase
          </div>
        )}
      </div>

      {/* Prompt */}
      <div>
        <label className={labelClass}>Prompt *</label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          maxLength={20000}
          className={`${inputClass} h-24 resize-none`}
          placeholder="Describe the image you want to generate based on references..."
          required
        />
        <div className="text-right text-xs text-zinc-600 mt-1 font-mono">{formData.prompt.length}/20000</div>
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
            <div className="absolute right-3 top-3 pointer-events-none text-orange-500">▼</div>
          </div>
        </div>

        {/* Output Format */}
        <div>
          <label className={labelClass}>Format</label>
          <div className="flex gap-2 mt-1">
            {['png', 'jpeg'].map((fmt) => (
              <label key={fmt} className={`flex-1 cursor-pointer border p-2 text-center transition-all ${formData.output_format === fmt ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
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

        {/* Safety Tolerance */}
        <div>
          <label className={labelClass}>Safety Level</label>
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
            <div className="absolute right-3 top-3 pointer-events-none text-orange-500">▼</div>
          </div>
        </div>
      </div>

      {/* API Info */}
      <div className="bg-zinc-950 border border-zinc-800 p-3">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Upload Flow</div>
        <div className="space-y-1 text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="text-cyan-500">1.</span>
            <span>Image uploaded to Supabase Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-500">2.</span>
            <span>Supabase URL sent to KIE.AI Flex Image API</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-500">3.</span>
            <span>Generated image returned & stored</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-zinc-800">
        <Button 
          type="submit" 
          className="w-full" 
          isLoading={isLoading}
          disabled={formData.image_urls.length === 0}
        >
          {formData.image_urls.length === 0 
            ? 'UPLOAD REFERENCE IMAGE FIRST' 
            : `GENERATE WITH ${formData.image_urls.length} REFERENCE${formData.image_urls.length > 1 ? 'S' : ''}`
          }
        </Button>
      </div>
    </form>
  );
};
