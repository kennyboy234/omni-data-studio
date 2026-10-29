import React, { useState } from 'react';
import { WF05DriftWatchtower } from './WF05DriftWatchtower';
import { WF06AnomalyPulse } from './WF06AnomalyPulse';
import { WF10CausalGraph } from './WF10CausalGraph';
import { WF11Manifold3DViewer } from './WF11Manifold3DViewer';
import { BrainComponentState } from './types';
import {
  Brain,
  Activity,
  ShieldAlert,
  CheckCircle,
  Zap,
  RotateCcw,
  Sliders,
  Layers,
  Radio,
  GitMerge,
  TrendingUp,
} from 'lucide-react';

export const BrainStudio: React.FC = () => {
  const [globalState, setGlobalState] = useState<BrainComponentState>('idle');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'all' | 'WF05' | 'WF06' | 'WF10' | 'WF11'>('all');

  const handleGlobalStateChange = (state: BrainComponentState) => {
    setGlobalState(state);
  };

  const handleTriggerGlobalAlert = () => {
    setGlobalState('alert');
  };

  const handleTriggerGlobalAnalysis = () => {
    setGlobalState('analyzing');
    setTimeout(() => {
      setGlobalState('idle');
    }, 2500);
  };

  const handleResetAll = () => {
    setGlobalState('idle');
  };

  return (
    <div className="space-y-6">
      {/* Studio 2 - BRAIN Master Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700 uppercase tracking-wider">
                  STUDIO 2 • BRAIN
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                  BRANCH: s2-brain
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  DEMO_MODE=true
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Autonomous Cognitive Intelligence Studio
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time feature drift watchtower, streaming anomaly pulse, Pearl causal DAGs, and 3D manifold embeddings.
              </p>
            </div>
          </div>

          {/* Master 3-State Switcher Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 font-semibold px-2">
              Global State:
            </span>

            <button
              onClick={() => handleGlobalStateChange('idle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                globalState === 'idle'
                  ? 'bg-slate-800 text-slate-200 border border-slate-600 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Idle</span>
            </button>

            <button
              onClick={handleTriggerGlobalAnalysis}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                globalState === 'analyzing'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow animate-pulse'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Analyzing (Pulse)</span>
            </button>

            <button
              onClick={handleTriggerGlobalAlert}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                globalState === 'alert'
                  ? 'bg-rose-950 text-rose-300 border border-rose-600 shadow animate-pulse ring-1 ring-rose-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Alert (Red Glow)</span>
            </button>

            <button
              onClick={handleResetAll}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Reset all units"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Workflow Tab Filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveWorkflowTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
              activeWorkflowTab === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All 4 Units
          </button>
          <button
            onClick={() => setActiveWorkflowTab('WF05')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
              activeWorkflowTab === 'WF05'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>WF05: Drift Watchtower</span>
          </button>
          <button
            onClick={() => setActiveWorkflowTab('WF06')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
              activeWorkflowTab === 'WF06'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>WF06: Anomaly Pulse</span>
          </button>
          <button
            onClick={() => setActiveWorkflowTab('WF10')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
              activeWorkflowTab === 'WF10'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>WF10: Causal Graph</span>
          </button>
          <button
            onClick={() => setActiveWorkflowTab('WF11')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
              activeWorkflowTab === 'WF11'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>WF11: Manifold 3D</span>
          </button>
        </div>
      </div>

      {/* Render Component Panels */}
      <div className="space-y-6">
        {(activeWorkflowTab === 'all' || activeWorkflowTab === 'WF05') && (
          <WF05DriftWatchtower forcedState={globalState} />
        )}

        {(activeWorkflowTab === 'all' || activeWorkflowTab === 'WF06') && (
          <WF06AnomalyPulse forcedState={globalState} />
        )}

        {(activeWorkflowTab === 'all' || activeWorkflowTab === 'WF10') && (
          <WF10CausalGraph forcedState={globalState} />
        )}

        {(activeWorkflowTab === 'all' || activeWorkflowTab === 'WF11') && (
          <WF11Manifold3DViewer forcedState={globalState} />
        )}
      </div>
    </div>
  );
};
