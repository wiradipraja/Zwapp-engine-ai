import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Veo3TextToVideoInput, Veo3Model, Veo3AspectRatio } from '../types';

interface Veo3TextToVideoFormProps {
  onSubmit: (input: Veo3TextToVideoInput) => void;
  isLoading: boolean;
}

const Veo3TextToVideoForm: React.FC<Veo3TextToVideoFormProps> = ({ onSubmit, isLoading }) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<Veo3TextToVideoInput>({
    prompt: '',
    model: 'veo3_fast',
    generationType: 'TEXT_2_VIDEO',
    aspect_ratio: '16:9',
    enableTranslation: true,
    watermark: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: Veo3TextToVideoInput = {
      ...formData,
      generationType: 'TEXT_2_VIDEO',
    };
    // Remove empty optional fields
    if (!submitData.watermark) delete submitData.watermark;
    if (!submitData.seeds) delete submitData.seeds;
    onSubmit(submitData);
  };

  const handleChange = (field: keyof Veo3TextToVideoInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

      {/* Prompt */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
          Prompt <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="A dog playing in a park with golden sunlight..."
          rows={4}
          className={`w-full px-4 py-3 rounded-lg border ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500'
          } focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors`}
          required
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Be detailed and specific. Include actions, scenes, style, and atmosphere.
        </p>
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
            <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Same seed generates similar content
            </p>
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
        disabled={isLoading || !formData.prompt.trim()}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
          isLoading || !formData.prompt.trim()
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
            <p className="font-medium">Veo 3.1 Features:</p>
            <ul className="mt-1 list-disc list-inside text-xs space-y-1">
              <li>Native 9:16 vertical video support</li>
              <li>Background audio included by default</li>
              <li>1080P and 4K output quality</li>
              <li>Multilingual prompt support</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
};

export { Veo3TextToVideoForm };
