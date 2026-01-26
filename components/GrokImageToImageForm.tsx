import React, { useState } from 'react';
import { GrokImageToImageInput } from '../types';
import { Button } from './ui/Button';
import { Dropzone } from './ui/Dropzone';
import { uploadImageToKieAI } from '../services/kieFileUpload';
import { useTheme } from '../contexts/ThemeContext';

interface GrokImageToImageFormProps {
  onSubmit: (input: GrokImageToImageInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const GrokImageToImageForm: React.FC<GrokImageToImageFormProps> = ({ onSubmit, isLoading, apiKey = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<GrokImageToImageInput>({
    prompt: '',
    image_urls: [],
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = (field: keyof GrokImageToImageInput, value: any) => {
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
    const hasImageSource = (formData.image_urls?.length || 0) > 0 && !formData.image_urls?.[0]?.startsWith('data:');
    if (!hasImageSource) {
      setUploadError('Upload a reference image first.');
      return;
    }
    onSubmit({
      prompt: formData.prompt?.trim() || undefined,
      image_urls: formData.image_urls,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-fuchsia-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            GROK IMAGE→IMAGE
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Model: grok-imagine/image-to-image • Single reference image
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
          placeholder="Describe the edit or style..."
          rows={4}
          maxLength={5000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-fuchsia-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-fuchsia-500'
          } focus:outline-none`}
        />
        <div className={`text-right text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {(formData.prompt || '').length}/5000
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || isUploading}
        className="w-full"
      >
        {isLoading ? 'GENERATING...' : 'GENERATE IMAGE'}
      </Button>
    </form>
  );
};

export default GrokImageToImageForm;
