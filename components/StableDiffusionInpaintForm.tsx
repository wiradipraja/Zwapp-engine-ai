import React, { useState } from 'react';
import { StableDiffusionInpaintInput } from '../types';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';
import { Dropzone } from './ui/Dropzone';
import { uploadAsset } from '../services/supabase';

interface StableDiffusionInpaintFormProps {
  onSubmit: (input: StableDiffusionInpaintInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const StableDiffusionInpaintForm: React.FC<StableDiffusionInpaintFormProps> = ({
  onSubmit,
  isLoading,
  apiKey = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<StableDiffusionInpaintInput>({
    prompt: '',
    imageUrl: '',
    maskUrl: '',
    negative_prompt: '',
    height: 1024,
    width: 1024,
    num_steps: 20,
    guidance: 5,
  });
  const [imageValue, setImageValue] = useState('');
  const [maskValue, setMaskValue] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMask, setUploadingMask] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleChange = (field: keyof StableDiffusionInpaintInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = async (
    file: File,
    setValue: (val: string) => void,
    setUploading: (val: boolean) => void,
    field: 'imageUrl' | 'maskUrl'
  ) => {
    setUploadError('');
    setUploading(true);
    try {
      const url = await uploadAsset(file);
      setValue(url);
      setFormData((prev) => ({ ...prev, [field]: url }));
    } catch (error: any) {
      setUploadError(error?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: StableDiffusionInpaintInput = { ...formData };
    if (!payload.negative_prompt) delete payload.negative_prompt;
    if (!payload.imageUrl) delete payload.imageUrl;
    if (!payload.maskUrl) delete payload.maskUrl;
    if (payload.seed === undefined || payload.seed === null) delete payload.seed;

    onSubmit(payload);
  };

  const canSubmit =
    !!formData.prompt.trim() && !!apiKey && !isLoading && !uploadingImage && !uploadingMask;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-orange-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            STABLE DIFFUSION INPAINTING
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Endpoint: /getImage (Pixazo inpainting)
        </p>
        {!apiKey && (
          <p className="mt-2 text-[10px] font-mono text-red-400">
            Pixazo API key is required. Open Settings to add it.
          </p>
        )}
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          PROMPT <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="Describe the edit you want..."
          rows={3}
          maxLength={2000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-orange-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-orange-500'
          } focus:outline-none`}
          required
        />
      </div>

      {uploadError && (
        <div className="border border-red-800/60 bg-red-950/30 text-[10px] font-mono text-red-400 px-3 py-2">
          {uploadError}
        </div>
      )}

      <Dropzone
        label="Inpaint Image"
        subLabel="PNG/JPG • Max 10MB"
        accept="image/*"
        value={imageValue || formData.imageUrl || ''}
        isUploading={uploadingImage}
        onFileSelect={async (base64, file) => {
          if (!file) return;
          setImageValue(base64);
          await handleUpload(file, setImageValue, setUploadingImage, 'imageUrl');
        }}
        onTextChange={(val) => {
          setImageValue(val);
          handleChange('imageUrl', val);
        }}
      />

      <Dropzone
        label="Mask Image"
        subLabel="PNG/JPG • White = edit, Black = keep"
        accept="image/*"
        value={maskValue || formData.maskUrl || ''}
        isUploading={uploadingMask}
        onFileSelect={async (base64, file) => {
          if (!file) return;
          setMaskValue(base64);
          await handleUpload(file, setMaskValue, setUploadingMask, 'maskUrl');
        }}
        onTextChange={(val) => {
          setMaskValue(val);
          handleChange('maskUrl', val);
        }}
      />

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          NEGATIVE PROMPT
        </label>
        <textarea
          value={formData.negative_prompt || ''}
          onChange={(e) => handleChange('negative_prompt', e.target.value)}
          placeholder="What should be avoided..."
          rows={2}
          maxLength={1000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-orange-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-orange-500'
          } focus:outline-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            WIDTH
          </label>
          <input
            type="number"
            min={256}
            max={2048}
            step={64}
            value={formData.width ?? 1024}
            onChange={(e) => handleChange('width', parseInt(e.target.value, 10))}
            className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-orange-500'
                : 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500'
            } focus:outline-none`}
          />
        </div>
        <div>
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            HEIGHT
          </label>
          <input
            type="number"
            min={256}
            max={2048}
            step={64}
            value={formData.height ?? 1024}
            onChange={(e) => handleChange('height', parseInt(e.target.value, 10))}
            className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-orange-500'
                : 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500'
            } focus:outline-none`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            NUM STEPS
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={formData.num_steps ?? 20}
            onChange={(e) => handleChange('num_steps', parseInt(e.target.value, 10))}
            className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-orange-500'
                : 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500'
            } focus:outline-none`}
          />
        </div>
        <div>
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            GUIDANCE
          </label>
          <input
            type="number"
            min={1}
            max={20}
            step={0.5}
            value={formData.guidance ?? 5}
            onChange={(e) => handleChange('guidance', parseFloat(e.target.value))}
            className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-orange-500'
                : 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500'
            } focus:outline-none`}
          />
        </div>
      </div>

      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          SEED
        </label>
        <input
          type="number"
          placeholder="Optional seed for reproducibility"
          value={formData.seed ?? ''}
          onChange={(e) => handleChange('seed', e.target.value ? parseInt(e.target.value, 10) : undefined)}
          className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-orange-500'
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-orange-500'
          } focus:outline-none`}
        />
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading} disabled={!canSubmit}>
        {apiKey ? 'RUN INPAINT' : 'ADD PIXAZO KEY'}
      </Button>
    </form>
  );
};
