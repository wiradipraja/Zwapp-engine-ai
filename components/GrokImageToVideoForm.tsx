import React, { useState } from 'react';
import { GrokImageToVideoInput } from '../types';
import { Button } from './ui/Button';
import { Dropzone } from './ui/Dropzone';
import { uploadImageToKieAI } from '../services/kieFileUpload';
import { useTheme } from '../contexts/ThemeContext';

interface GrokImageToVideoFormProps {
  onSubmit: (input: GrokImageToVideoInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const GrokImageToVideoForm: React.FC<GrokImageToVideoFormProps> = ({ onSubmit, isLoading, apiKey = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<GrokImageToVideoInput>({
    prompt: '',
    image_urls: [],
    mode: 'normal',
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = (field: keyof GrokImageToVideoInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (previewBase64: string, file?: File) => {
    setPreviewUrl(previewBase64);
    setUploadError(null);
    handleChange('image_urls', []);

    if (file) {
      setIsUploading(true);
      try {
        if (!apiKey) throw new Error('API Key required');
        const publicUrl = await uploadImageToKieAI(file, apiKey);
        handleChange('image_urls', [publicUrl]);
      } catch (error: any) {
        setUploadError(error.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.image_urls?.length === 0 || formData.image_urls?.[0]?.startsWith('data:')) {
      setUploadError('WAITING FOR UPLOAD...');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-sky-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            GROK IMAGE→VIDEO
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Model: grok-imagine/image-to-video • Single reference image
        </p>
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          SOURCE IMAGE <span className="text-red-500">*</span>
        </label>
        <Dropzone
          onFileSelect={handleFileSelect}
          previewUrl={previewUrl}
          isUploading={isUploading}
          accept="image/jpeg,image/png,image/webp"
          maxSizeMB={10}
        />
        {uploadError && (
          <p className="text-red-500 text-xs font-mono mt-1">{uploadError}</p>
        )}
        {formData.image_urls && formData.image_urls.length > 0 && !formData.image_urls[0]?.startsWith('data:') && (
          <p className="text-green-500 text-xs font-mono mt-1">✓ Image uploaded</p>
        )}
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          PROMPT
        </label>
        <textarea
          value={formData.prompt || ''}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="Describe the video motion you want to generate..."
          rows={4}
          maxLength={5000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-sky-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-sky-500'
          } focus:outline-none`}
        />
        <div className={`text-right text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {(formData.prompt || '').length}/5000
        </div>
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          MODE
        </label>
        <div className="flex gap-2">
          {(['fun', 'normal', 'spicy'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleChange('mode', mode)}
              className={`flex-1 px-3 py-2 text-xs font-mono border transition-all ${
                formData.mode === mode
                  ? isDark
                    ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                    : 'border-sky-500 bg-sky-50 text-sky-600'
                  : isDark
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                  : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
        <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Note: Spicy only supported with task_id input. External image may fallback to normal.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !formData.image_urls || formData.image_urls.length === 0 || isUploading}
        className="w-full"
      >
        {isLoading ? 'GENERATING...' : 'GENERATE VIDEO'}
      </Button>
    </form>
  );
};
