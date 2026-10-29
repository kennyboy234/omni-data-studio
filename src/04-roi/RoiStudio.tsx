import React, { useState } from 'react';
import { WF15MoneyPrinter } from './WF15MoneyPrinter';
import { WF13BossWhisper } from './WF13BossWhisper';
import { WF07DashboardBuilder } from './WF07DashboardBuilder';
import { DollarSign, FileText, Layout, ShieldCheck, Zap, TrendingUp, Sparkles } from 'lucide-react';

export const RoiStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'printer' | 'whisper' | 'builder'>('printer');
  const [currentSavings, setCurrentSavings] = useState<number>(1249000);
  const [preventedCount, setPreventedCount] = useState<number>(5);

  return (
    <div className="space-y-6">
      {/* Studio Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-xs font-mono font-semibold tracking-wider uppercase">
                Studio 4 · ROI Engine
              </span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono">
                DEMO_MODE=true
              </span>
              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-xs font-mono">
                Branch: s4-roi
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
              Hard-Dollar ROI & Defense Briefing Engine
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              WF15 Money Printer dynamic loss prevention modeling, WF13 Boss Whisper defense-grade export, and WF07 modular dashboard canvas.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono">PREVENTED LOSSES</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                ${currentSavings.toLocaleString()}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono">INTERCEPTIONS</div>
              <div className="text-xl font-bold font-mono text-cyan-400">
                {preventedCount} Faults
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pt-2">
          <button
            onClick={() => setActiveTab('printer')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'printer'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            WF15 Money Printer
          </button>

          <button
            onClick={() => setActiveTab('whisper')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'whisper'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            WF13 Boss Whisper (PDF & WhatsApp)
          </button>

          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'builder'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layout className="w-4 h-4" />
            WF07 Dashboard Builder
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="transition-all">
        {activeTab === 'printer' && <WF15MoneyPrinter />}
        {activeTab === 'whisper' && (
          <WF13BossWhisper totalSavingsUsd={currentSavings} preventedCount={preventedCount} />
        )}
        {activeTab === 'builder' && <WF07DashboardBuilder />}
      </div>
    </div>
  );
};
