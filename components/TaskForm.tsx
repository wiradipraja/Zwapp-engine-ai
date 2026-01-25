import React, { useState } from 'react';
import { MotionControlInput } from '../types';
import { Button } from './ui/Button';
import { Dropzone } from './ui/Dropzone';
import { uploadImageToKieAI, uploadVideoToKieAI } from '../services/kieFileUpload';

interface ImagePreview {
  dataUrl: string;
  url: string;
  fileName: string;
  isUploading: boolean;
}

interface VideoPreview {
  dataUrl: string;
  url: string;
  fileName: string;
  isUploading: boolean;
}

interface TaskFormProps {
  onSubmit: (input: MotionControlInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, isLoading, apiKey = '' }) => {
  const [formData, setFormData] = useState<MotionControlInput>({
    prompt: 'The cartoon character is dancing.',
    input_urls: [],
    video_urls: [],
    character_orientation: 'video',
    mode: '720p',
  });

  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreview[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [showSaveOption, setShowSaveOption] = useState(false);
  const [saveOutput, setSaveOutput] = useState(false);

  const handleChange = (field: keyof MotionControlInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Dropzone callback: (base64: string, originalFile?: File)
  const handleImageSelect = async (base64: string, file?: File) => {
    setUploadError('');
    
    if (!file) {
      setUploadError('No file selected');
      return;
    }
    
    try {
      // Use base64 from Dropzone for preview (already read)
      const previewItem: ImagePreview = {
        dataUrl: base64,
        url: '',
        fileName: file.name,
        isUploading: true,
      };
      setImagePreviews([previewItem]);

      // Upload to KIE.AI
      if (!apiKey) {
        throw new Error('API Key required');
      }
      const publicUrl = await uploadImageToKieAI(file, apiKey);

      // Update preview with URL
      setImagePreviews([{
        dataUrl: base64,
        url: publicUrl,
        fileName: file.name,
        isUploading: false,
      }]);

      // Update form data with public URL
      setFormData(prev => ({
        ...prev,
        input_urls: [publicUrl]
      }));
    } catch (error: any) {
      setUploadError(error.message);
      setImagePreviews([]);
    }
  };

  // Dropzone callback: (base64: string, originalFile?: File)
  const handleVideoSelect = async (base64: string, file?: File) => {
    setUploadError('');
    
    if (!file) {
      setUploadError('No file selected');
      return;
    }
    
    try {
      // Use base64 from Dropzone for preview (already read)
      const previewItem: VideoPreview = {
        dataUrl: base64,
        url: '',
        fileName: file.name,
        isUploading: true,
      };
      setVideoPreviews([previewItem]);

      // Upload to KIE.AI
      if (!apiKey) {
        throw new Error('API Key required');
      }
      const publicUrl = await uploadVideoToKieAI(file, apiKey);

      // Update preview with URL
      setVideoPreviews([{
        dataUrl: base64,
        url: publicUrl,
        fileName: file.name,
        isUploading: false,
      }]);

      // Update form data with public URL
      setFormData(prev => ({
        ...prev,
        video_urls: [publicUrl]
      }));
    } catch (error: any) {
      setUploadError(error.message);
      setVideoPreviews([]);
    }
  };

  const isUploading = imagePreviews.some(p => p.isUploading) || videoPreviews.some(p => p.isUploading);
  const canSubmit = formData.input_urls.length > 0 && formData.video_urls.length > 0 && !isUploading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit(formData);
      setShowSaveOption(true);
    }
  };

  const labelClass = "block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase";
  const inputClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/80 p-6 border border-zinc-800 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600"></div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 animate-pulse"></div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-white">Task Configuration</h2>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-900/30 border border-red-700/50 rounded p-3">
          <p className="text-red-400 text-sm font-mono">{uploadError}</p>
        </div>
      )}

      <div>
        <label className={labelClass}>Prompt Description</label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          maxLength={2500}
          className={`${inputClass} h-24 resize-none`}
          placeholder="Describe the desired output..."
          required
        />
        <div className="text-right text-xs text-zinc-600 mt-1 font-mono">{formData.prompt.length}/2500</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Dropzone 
            label="Reference Image"
            subLabel="JPG/PNG, Max 10MB, >300px"
            accept="image/*"
            onFileSelect={handleImageSelect}
          />
          {imagePreviews.length > 0 && (
            <div className="mt-3 relative">
              <img 
                src={imagePreviews[0].dataUrl} 
                alt="preview" 
                className="w-full h-32 object-cover rounded border border-zinc-700"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {imagePreviews[0].isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin border-2 border-orange-500/30 border-t-orange-500 w-6 h-6 rounded-full"></div>
                    <p className="text-xs text-orange-400 font-mono">Uploading...</p>
                  </div>
                ) : imagePreviews[0].url ? (
                  <div className="flex flex-col items-center gap-2 bg-black/70 p-2 rounded">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-green-400 font-mono">Uploaded</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div>
          <Dropzone 
            label="Reference Video"
            subLabel="MP4/MOV, Max 100MB"
            accept="video/*"
            onFileSelect={handleVideoSelect}
          />
          {videoPreviews.length > 0 && (
            <div className="mt-3 relative">
              <video 
                src={videoPreviews[0].dataUrl} 
                className="w-full h-32 object-cover rounded border border-zinc-700 bg-zinc-950"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {videoPreviews[0].isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin border-2 border-orange-500/30 border-t-orange-500 w-6 h-6 rounded-full"></div>
                    <p className="text-xs text-orange-400 font-mono">Uploading...</p>
                  </div>
                ) : videoPreviews[0].url ? (
                  <div className="flex flex-col items-center gap-2 bg-black/70 p-2 rounded">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-green-400 font-mono">Uploaded</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Orientation Source</label>
          <div className="flex gap-4 mt-2">
            {(['image', 'video'] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${formData.character_orientation === opt ? 'border-orange-500 bg-orange-500/20' : 'border-zinc-600'}`}>
                  {formData.character_orientation === opt && <div className="w-2 h-2 bg-orange-500"></div>}
                </div>
                <input
                  type="radio"
                  name="orientation"
                  className="hidden"
                  checked={formData.character_orientation === opt}
                  onChange={() => handleChange('character_orientation', opt)}
                />
                <span className={`text-sm uppercase font-mono ${formData.character_orientation === opt ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Resolution Mode</label>
          <div className="flex gap-4 mt-2">
            {(['720p', '1080p'] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${formData.mode === opt ? 'border-orange-500 bg-orange-500/20' : 'border-zinc-600'}`}>
                  {formData.mode === opt && <div className="w-2 h-2 bg-orange-500"></div>}
                </div>
                <input
                  type="radio"
                  name="mode"
                  className="hidden"
                  checked={formData.mode === opt}
                  onChange={() => handleChange('mode', opt)}
                />
                <span className={`text-sm uppercase font-mono ${formData.mode === opt ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <Button 
          type="submit" 
          className="w-full" 
          isLoading={isLoading || isUploading}
          disabled={!canSubmit}
        >
          {!canSubmit ? (isUploading ? 'UPLOADING...' : 'SELECT IMAGE & VIDEO') : 'INITIATE SEQUENCE'}
        </Button>
      </div>
    </form>
  );
};