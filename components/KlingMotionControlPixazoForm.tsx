import React, { useState } from 'react';
import { PixazoKlingMotionControlInput } from '../types';
import { Button } from './ui/Button';
import { Dropzone } from './ui/Dropzone';
import { useTheme } from '../contexts/ThemeContext';
import { uploadAsset } from '../services/supabase';

interface KlingMotionControlPixazoFormProps {
  onSubmit: (input: PixazoKlingMotionControlInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const KlingMotionControlPixazoForm: React.FC<KlingMotionControlPixazoFormProps> = ({
  onSubmit,
  isLoading,
  apiKey = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<PixazoKlingMotionControlInput>({
    image_url: '',
    video_url: '',
    character_orientation: 'video',
    keep_original_sound: true,
  });
  const [imageValue, setImageValue] = useState('');
  const [videoValue, setVideoValue] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleChange = (field: keyof PixazoKlingMotionControlInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = async (
    file: File,
    setValue: (val: string) => void,
    setUploading: (val: boolean) => void,
    field: 'image_url' | 'video_url'
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

    const payload: PixazoKlingMotionControlInput = { ...formData };
    if (!payload.character_orientation) delete payload.character_orientation;
    if (payload.keep_original_sound === undefined) delete payload.keep_original_sound;

    onSubmit(payload);
  };

  const canSubmit =
    !!formData.image_url &&
    !!formData.video_url &&
    !!apiKey &&
    !isLoading &&
    !uploadingImage &&
    !uploadingVideo;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-orange-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            KLING 2.6 MOTION CONTROL
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Endpoint: /kling-video-v2-6-standard-motion-control-request (Pixazo)
        </p>
        {!apiKey && (
          <p className="mt-2 text-[10px] font-mono text-red-400">
            Pixazo API key is required. Open Settings to add it.
          </p>
        )}
      </div>

      {uploadError && (
        <div className="border border-red-800/60 bg-red-950/30 text-[10px] font-mono text-red-400 px-3 py-2">
          {uploadError}
        </div>
      )}

      <Dropzone
        label="Character Image"
        subLabel="JPG/PNG - Max 10MB"
        accept="image/*"
        value={imageValue || formData.image_url || ''}
        isUploading={uploadingImage}
        onFileSelect={async (base64, file) => {
          if (!file) return;
          setImageValue(base64);
          await handleUpload(file, setImageValue, setUploadingImage, 'image_url');
        }}
        onTextChange={(val) => {
          setImageValue(val);
          handleChange('image_url', val);
        }}
      />

      <Dropzone
        label="Motion Reference Video"
        subLabel="MP4 - Under 10 seconds"
        accept="video/*"
        maxSizeMB={100}
        value={videoValue || formData.video_url || ''}
        isUploading={uploadingVideo}
        onFileSelect={async (base64, file) => {
          if (!file) return;
          setVideoValue(base64);
          await handleUpload(file, setVideoValue, setUploadingVideo, 'video_url');
        }}
        onTextChange={(val) => {
          setVideoValue(val);
          handleChange('video_url', val);
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            ORIENTATION SOURCE
          </label>
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
          <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            KEEP ORIGINAL SOUND
          </label>
          <label className="flex items-center gap-3 mt-2 cursor-pointer">
            <div className={`w-10 h-5 rounded-full border transition-colors ${formData.keep_original_sound ? 'bg-orange-500/40 border-orange-500' : isDark ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-300 bg-white'}`}>
              <div className={`w-4 h-4 rounded-full transition-transform ${formData.keep_original_sound ? 'translate-x-5 bg-orange-500' : isDark ? 'bg-zinc-600' : 'bg-zinc-400'}`} />
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={!!formData.keep_original_sound}
              onChange={(e) => handleChange('keep_original_sound', e.target.checked)}
            />
            <span className={`text-sm font-mono ${formData.keep_original_sound ? 'text-white' : 'text-zinc-500'}`}>
              {formData.keep_original_sound ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading} disabled={!canSubmit}>
        {apiKey ? 'GENERATE VIDEO' : 'ADD PIXAZO KEY'}
      </Button>
    </form>
  );
};
