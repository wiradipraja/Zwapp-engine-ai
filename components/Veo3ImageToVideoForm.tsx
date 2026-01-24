import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Veo3ImageToVideoInput, Veo3Model, Veo3AspectRatio } from '../types';
import { Dropzone } from './ui/Dropzone';
import { uploadImageToKieAI } from '../services/kieFileUpload';

interface Veo3ImageToVideoFormProps {
  onSubmit: (input: Veo3ImageToVideoInput) => void;
  isLoading: boolean;
}

const Veo3ImageToVideoForm: React.FC<Veo3ImageToVideoFormProps> = ({ onSubmit, isLoading }) => {
  const { isDark } = useTheme();
  const apiKey = localStorage.getItem('kie_api_key') || '';

  const [formData, setFormData] = useState<Veo3ImageToVideoInput>({
    prompt: '',
    imageUrls: [],
    model: 'veo3_fast',
    generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
    aspect_ratio: '16:9',
    enableTranslation: true,
    watermark: '',
  });
  
  // Image 1 (First frame)
  const [preview1, setPreview1] = useState('');
  const [imageUrl1, setImageUrl1] = useState('');
  const [uploading1, setUploading1] = useState(false);
  const [uploadError1, setUploadError1] = useState<string | null>(null);
  
  // Image 2 (Last frame - optional)
  const [preview2, setPreview2] = useState('');
  const [imageUrl2, setImageUrl2] = useState('');
  const [uploading2, setUploading2] = useState(false);
  const [uploadError2, setUploadError2] = useState<string | null>(null);
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof Veo3ImageToVideoInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update imageUrls when individual image URLs change
  const updateImageUrls = (url1: string, url2: string) => {
    const urls = [url1, url2].filter(url => url && !url.startsWith('data:'));
    handleChange('imageUrls', urls);
  };

  const handleFileSelect1 = async (previewBase64: string, file?: File) => {
    setPreview1(previewBase64);
    setUploadError1(null);
    setImageUrl1('');
    updateImageUrls('', imageUrl2);

    if (file) {
      setUploading1(true);
      try {
        if (!apiKey) throw new Error('API Key required');
        const publicUrl = await uploadImageToKieAI(file, apiKey);
        setImageUrl1(publicUrl);
        updateImageUrls(publicUrl, imageUrl2);
      } catch (error: any) {
        setUploadError1(error.message);
      } finally {
        setUploading1(false);
      }
    }
  };

  const handleFileSelect2 = async (previewBase64: string, file?: File) => {
    setPreview2(previewBase64);
    setUploadError2(null);
    setImageUrl2('');
    updateImageUrls(imageUrl1, '');

    if (file) {
      setUploading2(true);
      try {
        if (!apiKey) throw new Error('API Key required');
        const publicUrl = await uploadImageToKieAI(file, apiKey);
        setImageUrl2(publicUrl);
        updateImageUrls(imageUrl1, publicUrl);
      } catch (error: any) {
        setUploadError2(error.message);
      } finally {
        setUploading2(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.imageUrls.length === 0) {
      setUploadError1('At least one image required');
      return;
    }
    const submitData: Veo3ImageToVideoInput = {
      ...formData,
      generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
    };
    // Remove empty optional fields
    if (!submitData.watermark) delete submitData.watermark;
    if (!submitData.seeds) delete submitData.seeds;
    onSubmit(submitData);
  };

  const modelOptions: { value: Veo3Model; label: string; desc: string }[] = [
    { value: 'veo3', label: 'Veo 3.1 Quality', desc: 'Flagship model, highest fidelity' },
    { value: 'veo3_fast', label: 'Veo 3.1 Fast', desc: 'Cost-efficient, strong results' },
  ];

  const aspectRatioOptions: { value: Veo3AspectRatio; label: string }[] = [
    { value: '16:9', label: '16:9 Landscape' },
    { value: '9:16', label: '9:16 Portrait' },
    { value: 'Auto', label: 'Auto' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-cyan-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            VEO 3.1 IMAGE→VIDEO
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          API: /api/v1/veo/generate • First/Last frame transition
        </p>
      </div>

      {/* Model Selection */}
      <div>
        <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
          Model
        </label>
        <div className="grid grid-cols-1 gap-3">
          {modelOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                formData.model === option.value
                  ? isDark
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-cyan-500 bg-cyan-50'
                  : isDark
                  ? 'border-gray-600 hover:border-gray-500'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="model"
                value={option.value}
                checked={formData.model === option.value}
                onChange={(e) => handleChange('model', e.target.value as Veo3Model)}
                className="mt-1 mr-3"
              />
              <div>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {option.label}
                </span>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {option.desc}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Image 1 - First Frame */}
      <div>
        <Dropzone
          label="FIRST FRAME IMAGE *"
          accept="image/jpeg,image/png,image/webp"
          onFileSelect={handleFileSelect1}
          value={imageUrl1 || preview1}
          onTextChange={(val) => {
            setImageUrl1(val);
            setPreview1(val);
            updateImageUrls(val, imageUrl2);
          }}
          isUploading={uploading1}
          subLabel="Required • Video unfolds around this image"
        />
        {uploadError1 && (
          <p className="text-red-500 text-xs font-mono mt-1">{uploadError1}</p>
        )}
        {imageUrl1 && !imageUrl1.startsWith('data:') && (
          <p className="text-green-500 text-xs font-mono mt-1">✓ First frame uploaded</p>
        )}
      </div>

      {/* Image 2 - Last Frame (Optional) */}
      <div>
        <Dropzone
          label="LAST FRAME IMAGE (OPTIONAL)"
          accept="image/jpeg,image/png,image/webp"
          onFileSelect={handleFileSelect2}
          value={imageUrl2 || preview2}
          onTextChange={(val) => {
            setImageUrl2(val);
            setPreview2(val);
            updateImageUrls(imageUrl1, val);
          }}
          isUploading={uploading2}
          subLabel="Optional • Video transitions to this frame"
        />
        {uploadError2 && (
          <p className="text-red-500 text-xs font-mono mt-1">{uploadError2}</p>
        )}
        {imageUrl2 && !imageUrl2.startsWith('data:') && (
          <p className="text-green-500 text-xs font-mono mt-1">✓ Last frame uploaded</p>
        )}
      </div>

      {/* Prompt */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
          Prompt <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="Describe how you want the image to come alive..."
          rows={4}
          className={`w-full px-4 py-3 rounded-lg border ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500'
          } focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors`}
          required
        />
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
          Aspect Ratio
        </label>
        <div className="grid grid-cols-3 gap-2">
          {aspectRatioOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('aspect_ratio', option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                formData.aspect_ratio === option.value
                  ? isDark
                    ? 'bg-cyan-600 text-white'
                    : 'bg-cyan-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={`flex items-center gap-2 text-sm font-medium ${
          isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'
        }`}
      >
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
        Advanced Settings
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className={`space-y-4 p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          {/* Seed */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Seed (Optional)
            </label>
            <input
              type="number"
              min={10000}
              max={99999}
              value={formData.seeds || ''}
              onChange={(e) => handleChange('seeds', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="10000-99999"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500/20`}
            />
          </div>

          {/* Enable Translation */}
          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Auto Translate to English
              </label>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Translate prompts for better results
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('enableTranslation', !formData.enableTranslation)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.enableTranslation
                  ? 'bg-cyan-500'
                  : isDark
                  ? 'bg-gray-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.enableTranslation ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Watermark */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Watermark (Optional)
            </label>
            <input
              type="text"
              value={formData.watermark || ''}
              onChange={(e) => handleChange('watermark', e.target.value)}
              placeholder="Your brand name"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500/20`}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !formData.prompt.trim() || formData.imageUrls.length === 0 || uploading1 || uploading2}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
          isLoading || !formData.prompt.trim() || formData.imageUrls.length === 0 || uploading1 || uploading2
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg hover:shadow-cyan-500/25'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </span>
        ) : uploading1 || uploading2 ? (
          'Uploading...'
        ) : (
          'Generate Video'
        )}
      </button>

      {/* Info */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-cyan-900/30 border border-cyan-700' : 'bg-cyan-50 border border-cyan-200'}`}>
        <div className="flex gap-3">
          <svg className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className={`text-sm ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
            <p className="font-medium">Image→Video Mode:</p>
            <ul className="mt-1 list-disc list-inside text-xs space-y-1">
              <li><strong>1 image:</strong> Video unfolds around this image</li>
              <li><strong>2 images:</strong> Transition from first to last frame</li>
              <li>Background audio included by default</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
};

export { Veo3ImageToVideoForm };
