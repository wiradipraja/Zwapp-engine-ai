import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kieKey: string, pixazoKey: string) => void;
  currentKieKey: string;
  currentPixazoKey: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentKieKey,
  currentPixazoKey,
}) => {
  const [tempKieKey, setTempKieKey] = useState('');
  const [tempPixazoKey, setTempPixazoKey] = useState('');

  useEffect(() => {
    if (isOpen) {
        setTempKieKey(currentKieKey);
        setTempPixazoKey(currentPixazoKey);
    }
  }, [isOpen, currentKieKey, currentPixazoKey]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tempKieKey, tempPixazoKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 animate-pulse"></div>
              <h3 className="text-white font-bold uppercase tracking-widest text-sm">System Configuration</h3>
           </div>
           <button onClick={onClose} className="text-zinc-500 hover:text-red-500 transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
           {/* KIE.AI API Key */}
           <div>
              <label className="block text-xs text-orange-500 mb-2 font-mono uppercase">KIE.AI API Key</label>
              <p className="mb-3 text-[10px] text-zinc-400 font-mono">
                If you don&apos;t have an API KEY <a
                  href="https://kie.ai?ref=8f1f806be6c8f38ff8ef3d6fc4567944"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-400 hover:text-orange-300 underline"
                >CLICK HERE</a>
                <span className="ml-2">Kalau mau dapat 100 kredit gratis klik link ini.</span>
              </p>
              <div className="relative">
                <input 
                    type="password" 
                    value={tempKieKey}
                    onChange={(e) => setTempKieKey(e.target.value)}
                    className="w-full bg-black border border-zinc-700 p-3 pr-10 text-white focus:border-orange-500 focus:outline-none font-mono text-sm"
                    placeholder="sk-..."
                />
                <div className="absolute right-3 top-3 text-zinc-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 19l-1 1-1 1-2-2 2-2 2-2 2-2-4-4m9 9a2 2 0 01-2-2m-2-2l-4-4"></path></svg>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-zinc-500 font-mono">
                  This key is stored locally in your browser. It is never saved to our database.
              </p>
           </div>

           {/* Pixazo API Key */}
           <div>
              <label className="block text-xs text-orange-500 mb-2 font-mono uppercase">Pixazo API Key</label>
              <p className="mb-3 text-[10px] text-zinc-400 font-mono">
                Use your Pixazo subscription key for Stable Diffusion endpoints.
              </p>
              <div className="relative">
                <input 
                    type="password" 
                    value={tempPixazoKey}
                    onChange={(e) => setTempPixazoKey(e.target.value)}
                    className="w-full bg-black border border-zinc-700 p-3 pr-10 text-white focus:border-orange-500 focus:outline-none font-mono text-sm"
                    placeholder="pixazo-..."
                />
                <div className="absolute right-3 top-3 text-zinc-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 19l-1 1-1 1-2-2 2-2 2-2 2-2-4-4m9 9a2 2 0 01-2-2m-2-2l-4-4"></path></svg>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-zinc-500 font-mono">
                  This key is stored locally in your browser. It is never saved to our database.
              </p>
           </div>

           <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
               <button 
                 type="button" 
                 onClick={onClose}
                 className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider"
               >
                 Cancel
               </button>
               <Button type="submit" className="py-2 px-6 text-xs">
                 Save Configuration
               </Button>
           </div>
        </form>
      </div>
    </div>
  );
};
