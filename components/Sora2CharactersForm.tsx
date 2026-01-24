import React, { useState } from 'react';
import { Sora2CharactersInput } from '../types';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';

interface Sora2CharactersFormProps {
  onSubmit: (input: Sora2CharactersInput) => void;
  isLoading: boolean;
  apiKey?: string;
}

export const Sora2CharactersForm: React.FC<Sora2CharactersFormProps> = ({ onSubmit, isLoading }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<Sora2CharactersInput>({
    character_prompt: '',
    safety_instruction: '',
  });

  const handleChange = (field: keyof Sora2CharactersInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Sora2CharactersInput = {};
    if (formData.character_prompt) payload.character_prompt = formData.character_prompt;
    if (formData.safety_instruction) payload.safety_instruction = formData.safety_instruction;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className={`p-3 border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-pink-500 animate-pulse"></div>
          <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            SORA 2 CHARACTERS
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
          Model: sora-2-characters • Create consistent character definitions
        </p>
      </div>

      {/* Character Prompt */}
      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          CHARACTER PROMPT
        </label>
        <textarea
          value={formData.character_prompt}
          onChange={(e) => handleChange('character_prompt', e.target.value)}
          placeholder="State stable traits (e.g., 'cheerful barista, green apron, warm smile')..."
          rows={4}
          maxLength={5000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark 
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-pink-500' 
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-pink-500'
          } focus:outline-none`}
        />
        <div className={`text-right text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {formData.character_prompt?.length || 0}/5000
        </div>
        <p className={`text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          Avoid camera directions, contradictions, or disallowed celebrity likeness
        </p>
      </div>

      {/* Safety Instruction */}
      <div>
        <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          SAFETY INSTRUCTION
        </label>
        <textarea
          value={formData.safety_instruction}
          onChange={(e) => handleChange('safety_instruction', e.target.value)}
          placeholder="List boundaries (e.g., 'no violence, politics, or alcohol; PG-13 max')..."
          rows={3}
          maxLength={5000}
          className={`w-full px-3 py-2 border font-mono text-sm resize-none transition-colors ${
            isDark 
              ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-pink-500' 
              : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-pink-500'
          } focus:outline-none`}
        />
        <div className={`text-right text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {formData.safety_instruction?.length || 0}/5000
        </div>
        <p className={`text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          Tighter wording helps the model enforce your content limits
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || (!formData.character_prompt && !formData.safety_instruction)}
        className="w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            GENERATING...
          </span>
        ) : (
          'CREATE CHARACTER'
        )}
      </Button>

      {/* API Info */}
      <div className={`text-center text-[10px] font-mono ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>
        API: POST /api/v1/jobs/createTask • Model: sora-2-characters
      </div>
    </form>
  );
};

export default Sora2CharactersForm;
