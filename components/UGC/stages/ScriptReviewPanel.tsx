// components/UGC/stages/ScriptReviewPanel.tsx

import React, { useState } from 'react';
import { useUGCStore } from '../../../store/ugcStore';

const ScriptReviewPanel: React.FC = () => {
  const store = useUGCStore();
  const [editMode, setEditMode] = useState(false);
  const [editedScript, setEditedScript] = useState<any>(null);

  if (!store.currentProject?.generatedContent.script) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <p className="text-zinc-400 font-mono mb-2">No script generated yet</p>
        <p className="text-xs text-zinc-600 font-mono">
          Script will be automatically generated after analyzing your inputs
        </p>
      </div>
    );
  }

  const script = store.currentProject.generatedContent.script;
  const scenes = script.scenes || script.sceneBreakdown?.map((s: any) => ({
    sceneNumber: s.sceneNumber,
    setting: s.backgroundDescription,
    action: s.modelAction,
    dialogue: s.narrativePoint,
    productPlacement: s.productPlacement,
    emotionalBeat: s.modelExpression,
  })) || [];

  const handleEditToggle = () => {
    if (!editMode) setEditedScript({ ...script });
    setEditMode(!editMode);
  };

  const handleSaveEdit = () => {
    if (editedScript) store.setGeneratedScript(editedScript);
    setEditMode(false);
  };

  const labelClass = "block text-xs font-mono text-orange-500 mb-1 tracking-widest uppercase";
  const textareaClass = "w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono text-sm resize-none";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-orange-500"></div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-white">
              {script.title || 'UGC Script'}
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Duration: ~{script.duration || 24}s | {scenes.length} scenes
          </p>
        </div>
        <button
          onClick={handleEditToggle}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-orange-500 border border-orange-500/30 font-mono text-xs uppercase tracking-wider transition-colors"
        >
          {editMode ? '❌ Cancel' : '✏️ Edit'}
        </button>
      </div>

      {/* Script Overview - H-P-S-CTA */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800 border border-zinc-700 p-4">
          <label className={labelClass}>🎣 Hook</label>
          {editMode ? (
            <textarea
              value={editedScript?.hook || script.hook}
              onChange={(e) => setEditedScript({ ...editedScript, hook: e.target.value })}
              className={textareaClass}
              rows={2}
            />
          ) : (
            <p className="text-sm text-zinc-300">{script.hook}</p>
          )}
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 p-4">
          <label className={labelClass}>❓ Problem</label>
          {editMode ? (
            <textarea
              value={editedScript?.problemStatement || script.problemStatement}
              onChange={(e) => setEditedScript({ ...editedScript, problemStatement: e.target.value })}
              className={textareaClass}
              rows={2}
            />
          ) : (
            <p className="text-sm text-zinc-300">{script.problemStatement}</p>
          )}
        </div>

        <div className="bg-zinc-800 border border-zinc-700 p-4">
          <label className={labelClass}>💡 Solution</label>
          {editMode ? (
            <textarea
              value={editedScript?.solution || script.solution}
              onChange={(e) => setEditedScript({ ...editedScript, solution: e.target.value })}
              className={textareaClass}
              rows={2}
            />
          ) : (
            <p className="text-sm text-zinc-300">{script.solution}</p>
          )}
        </div>

        <div className="bg-zinc-800 border border-zinc-700 p-4">
          <label className={labelClass}>🎯 CTA</label>
          {editMode ? (
            <textarea
              value={editedScript?.cta || script.cta}
              onChange={(e) => setEditedScript({ ...editedScript, cta: e.target.value })}
              className={textareaClass}
              rows={2}
            />
          ) : (
            <p className="text-sm text-zinc-300">{script.cta}</p>
          )}
        </div>
      </div>

      {/* Scene Breakdown */}
      <div className="border border-zinc-700">
        <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-800">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">🎬 Scene Breakdown</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {scenes.map((scene: any, index: number) => (
            <div key={scene.sceneNumber || index} className="p-4 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-black font-bold text-sm">
                  {scene.sceneNumber || index + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono text-orange-500 uppercase tracking-widest">Setting</span>
                    <p className="text-zinc-300 text-sm">{scene.setting}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-orange-500 uppercase tracking-widest">Action</span>
                      <p className="text-zinc-400 text-xs">{scene.action}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-orange-500 uppercase tracking-widest">Dialogue</span>
                      <p className="text-zinc-400 text-xs italic">"{scene.dialogue}"</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Product</span>
                      <p className="text-zinc-500 text-xs">{scene.productPlacement}</p>
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Emotion</span>
                      <p className="text-zinc-500 text-xs">{scene.emotionalBeat}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voiceover */}
      {script.voiceoverText && (
        <div className="bg-zinc-800 border border-zinc-700 p-4">
          <label className={labelClass}>🎙️ Voiceover / Narration</label>
          <p className="text-zinc-400 text-sm">{script.voiceoverText}</p>
        </div>
      )}

      {/* AI Model Info */}
      {script.model && (
        <div className="text-[10px] text-zinc-600 font-mono flex items-center gap-2">
          <span>Generated with: {script.model}</span>
          {script.generatedAt && <span>• {new Date(script.generatedAt).toLocaleString()}</span>}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
        <button
          onClick={() => store.setCurrentStage('INPUT')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors"
        >
          ← Back
        </button>
        {editMode ? (
          <button
            onClick={handleSaveEdit}
            className="relative font-bold uppercase tracking-wider py-2 px-4 bg-green-600 hover:bg-green-500 text-black transition-all"
          >
            💾 Save Changes
          </button>
        ) : (
          <button
            onClick={() => store.setCurrentStage('PROMPTING')}
            className="relative font-bold uppercase tracking-wider py-3 px-6 bg-orange-600 hover:bg-orange-500 text-black border-l-4 border-orange-800 transition-all"
          >
            ✨ APPROVE & CONTINUE →
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ScriptReviewPanel;
