// components/UGC/stages/QAResultsPanel.tsx

import React, { useState } from 'react';
import { useUGCStore } from '../../../store/ugcStore';
import { QAResult } from '../../../types/ugc';

interface QAResultsPanelProps {
  onContinue?: () => void;
}

const QAResultsPanel: React.FC<QAResultsPanelProps> = ({ onContinue }) => {
  const store = useUGCStore();
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  if (!store.currentProject) return null;

  const qaResultsObj = store.currentProject.qaResults;
  const qaResults: QAResult[] = qaResultsObj.imageQA || 
    Object.entries(qaResultsObj)
      .filter(([key]) => key !== 'imageQA' && key !== 'overallPassRate')
      .map(([_, value]) => value as QAResult);
  
  const passedCount = qaResults.filter(r => r.overallStatus === 'passed').length;
  const overallPassRate = qaResults.length > 0 
    ? Math.round((passedCount / qaResults.length) * 100) 
    : (qaResultsObj.overallPassRate || 0);

  const images = store.currentProject.generatedContent.images;

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      store.setCurrentStage('VIDEO_GENERATION');
    }
  };

  const getImageForResult = (result: QAResult) => images.find(img => img.id === result.imageId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-orange-500"></div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-white">Quality Assurance</h2>
        </div>
        <p className="text-xs text-zinc-500 font-mono">
          Consistency checks and hallucination detection • {qaResults.length} images analyzed
        </p>
      </div>

      {/* Loading State */}
      {store.isLoading && qaResults.length === 0 && (
        <div className="bg-zinc-800 border border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 border-4 border-zinc-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-mono mb-2">ANALYZING IMAGES...</p>
          <p className="text-xs text-zinc-500 font-mono">{store.progressMessage || 'Running quality assurance checks'}</p>
          {store.progressPercent > 0 && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="w-full bg-zinc-700 h-1">
                <div className="bg-orange-500 h-1 transition-all" style={{ width: `${store.progressPercent}%` }} />
              </div>
              <p className="text-xs text-orange-500 font-mono mt-1">{store.progressPercent}%</p>
            </div>
          )}
        </div>
      )}

      {/* Overall Pass Rate Card */}
      {qaResults.length > 0 && (
        <div className="bg-zinc-800 border border-zinc-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-orange-500 uppercase tracking-widest">Overall Pass Rate</p>
              <p className="text-4xl font-bold text-white font-mono mt-2">
                {overallPassRate}<span className="text-xl text-zinc-500">%</span>
              </p>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                {passedCount} of {qaResults.length} images passed
              </p>
            </div>
            <div className="w-24 h-24 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-700" />
                <circle
                  cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6"
                  strokeDasharray={`${(overallPassRate / 100) * 251.2} 251.2`}
                  className={`${overallPassRate >= 80 ? 'text-green-500' : overallPassRate >= 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-500`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                {overallPassRate >= 80 ? '✓' : overallPassRate >= 50 ? '!' : '✕'}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-zinc-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500 font-mono">{passedCount}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Passed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500 font-mono">
                {qaResults.filter(r => r.overallStatus === 'needs_review').length}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Review</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500 font-mono">
                {qaResults.filter(r => r.overallStatus === 'failed').length}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Failed</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {qaResults.length === 0 && !store.isLoading && (
        <div className="bg-zinc-800 border border-zinc-700 p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white font-mono mb-2">No QA results yet</p>
          <p className="text-xs text-zinc-500 font-mono">QA analysis will be performed on your generated images</p>
        </div>
      )}

      {/* Results List */}
      {qaResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Detailed Results</h3>
          
          {qaResults.map((result, index) => {
            const image = getImageForResult(result);
            const isExpanded = expandedResult === result.id;
            
            return (
              <div
                key={result.id || index}
                className={`border-l-4 ${
                  result.overallStatus === 'passed' ? 'border-green-500 bg-green-500/5' :
                  result.overallStatus === 'failed' ? 'border-red-500 bg-red-500/5' :
                  'border-yellow-500 bg-yellow-500/5'
                }`}
              >
                <button
                  onClick={() => setExpandedResult(isExpanded ? null : (result.id || String(index)))}
                  className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {image && (
                      <img 
                        src={image.imageUrl} 
                        alt={`Scene ${result.sceneNumber}`}
                        className="w-12 h-12 object-cover border border-zinc-700"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/1a1a2e/eee?text=?'; }}
                      />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Scene {result.sceneNumber || index + 1}</p>
                      <p className="text-xs text-zinc-500 font-mono">
                        Quality: {result.qualityScore || 
                          (result.checks ? Math.round(
                            ((result.checks.modelConsistency?.confidence || 0) +
                            (result.checks.productPlacement?.confidence || 0) +
                            (result.checks.styleCohesion?.confidence || 0)) / 3 * 100
                          ) : 0)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 uppercase tracking-wider ${
                      result.overallStatus === 'passed' ? 'bg-green-500/20 text-green-400' :
                      result.overallStatus === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {result.overallStatus === 'passed' ? '✓ PASS' : result.overallStatus === 'failed' ? '✕ FAIL' : '⚠ REVIEW'}
                    </span>
                    <span className="text-zinc-500 text-sm">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {result.checks && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Model', check: result.checks.modelConsistency },
                          { label: 'Product', check: result.checks.productPlacement },
                          { label: 'Style', check: result.checks.styleCohesion },
                          { label: 'No Hallucination', check: result.checks.noHallucinations },
                        ].map(({ label, check }) => (
                          <div key={label} className={`p-3 border ${check?.passed ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{label}</p>
                            <p className={`text-sm font-bold ${check?.passed ? 'text-green-400' : 'text-red-400'}`}>
                              {check?.passed ? '✓ Pass' : '✕ Fail'}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {Math.round((check?.confidence || 0) * 100)}% conf.
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {result.suggestedFixes && result.suggestedFixes.length > 0 && (
                      <div className="bg-zinc-900 border border-zinc-700 p-3">
                        <p className="text-[10px] font-mono text-orange-500 uppercase tracking-widest mb-2">💡 Suggested Fixes</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                          {result.suggestedFixes.map((fix, idx) => <li key={idx}>{fix}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
        <button
          onClick={() => store.setCurrentStage('GENERATING')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-mono text-sm uppercase tracking-wider transition-colors"
        >← Back</button>
        <button
          onClick={handleContinue}
          disabled={store.isLoading}
          className="relative font-bold uppercase tracking-wider py-3 px-6 bg-orange-600 hover:bg-orange-500 text-black border-l-4 border-orange-800 transition-all disabled:opacity-50"
        >
          🎬 CONTINUE TO VIDEO →
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50"></div>
        </button>
      </div>
    </div>
  );
};

export default QAResultsPanel;
