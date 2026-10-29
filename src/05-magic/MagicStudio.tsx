import React, { useState } from 'react';
import { WF51JarvisVoice } from './WF51JarvisVoice';
import { WF52MatrixRain } from './WF52MatrixRain';
import { WF53WhatsAppBot } from './WF53WhatsAppBot';
import { Sparkles, Mic, Code2, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

export const MagicStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jarvis' | 'matrix' | 'whatsapp'>('jarvis');

  return (
    <div className="space-y-6">
      {/* Studio 5 Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded text-xs font-mono font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Studio 5 · The Closer (Magic Moat)
              </span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono">
                DEMO_MODE=true
              </span>
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs font-mono">
                Branch: s5-magic
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
              Autonomous Moat & Magic Features
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              WF51 JARVIS voice command runner, WF52 Matrix Rain 1M rows/s loading backdrop, and WF53 WhatsApp executive command bot.
            </p>
          </div>

          {/* Quick Moat Highlights */}
          <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono">VOICE CADENCE</div>
              <div className="text-xl font-bold font-mono text-cyan-400">Zero-Click</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono">DISPATCH CHANNEL</div>
              <div className="text-xl font-bold font-mono text-emerald-400">WhatsApp + Webhook</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pt-2">
          <button
            onClick={() => setActiveTab('jarvis')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'jarvis'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Mic className="w-4 h-4" />
            WF51 JARVIS Voice ("Hey Omni")
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            WF52 Matrix Rain Loading Screen
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'whatsapp'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WF53 WhatsApp Command Bot
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="transition-all">
        {activeTab === 'jarvis' && <WF51JarvisVoice />}
        {activeTab === 'matrix' && <WF52MatrixRain />}
        {activeTab === 'whatsapp' && <WF53WhatsAppBot />}
      </div>
    </div>
  );
};
