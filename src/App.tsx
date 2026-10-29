import React, { useState } from 'react';
import { FoundationStudio } from './01-foundation/FoundationStudio';
import { BrainStudio } from './02-brain/BrainStudio';
import { RoiStudio } from './04-roi/RoiStudio';
import { MagicStudio } from './05-magic/MagicStudio';
import { WF52MatrixRain } from './05-magic/WF52MatrixRain';
import { FleetStudio } from './03-fleet/FleetStudio';
import {
  Database,
  Brain,
  DollarSign,
  Sparkles,
  Shield,
  Activity,
  Layers,
  Terminal,
  FileText,
  Mic,
  Code2,
  CheckCircle2,
  Cpu,
  Radio,
  Navigation,
} from 'lucide-react';

export type StudioTab = 'fleet' | 'foundation' | 'brain' | 'roi' | 'magic';

export default function App() {
  const [activeStudio, setActiveStudio] = useState<StudioTab>('fleet');
  const [showMatrixOverlay, setShowMatrixOverlay] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  OmniData Studio
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  MAIN · GREEN
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono hidden md:block">
                Unified Autonomous Data Defense Mesh
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden lg:block" />

          {/* Studio Selector Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {/* Fleet Map Tab (Homepage) */}
            <button
              onClick={() => setActiveStudio('fleet')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                activeStudio === 'fleet'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-300" />
              <span>FLEET MAP</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">(WF14 · S3)</span>
            </button>

            {/* Studio 1: FOUNDATION */}
            <button
              onClick={() => setActiveStudio('foundation')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer shrink-0 ${
                activeStudio === 'foundation'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>S1 · FOUNDATION</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">(WF01-04)</span>
            </button>

            {/* Studio 2: BRAIN */}
            <button
              onClick={() => setActiveStudio('brain')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer shrink-0 ${
                activeStudio === 'brain'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>S2 · BRAIN</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">(WF05-11)</span>
            </button>

            {/* Studio 4: ROI */}
            <button
              onClick={() => setActiveStudio('roi')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer shrink-0 ${
                activeStudio === 'roi'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>S4 · ROI ENGINE</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">(WF15,13,07)</span>
            </button>

            {/* Studio 5: THE CLOSER (MAGIC) */}
            <button
              onClick={() => setActiveStudio('magic')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer shrink-0 ${
                activeStudio === 'magic'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>S5 · THE CLOSER (MAGIC)</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">(WF51-53)</span>
            </button>
          </nav>
        </div>

        {/* Global Controls & Status Badges */}
        <div className="flex items-center gap-3">
          {/* Matrix Rain Toggle */}
          <button
            onClick={() => setShowMatrixOverlay(!showMatrixOverlay)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              showMatrixOverlay
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Matrix Digital Rain Loading Backdrop"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MATRIX RAIN</span>
          </button>

          {/* Demo Mode & Main Status */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              DEMO_MODE=true
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 hidden md:inline">
              BRANCH: main
            </span>
          </div>
        </div>
      </header>

      {/* Optional Matrix Rain Loading Screen Interstitial */}
      {showMatrixOverlay && (
        <div className="relative border-b border-emerald-500/30">
          <WF52MatrixRain embeddedHeight={280} onFinishedLoading={() => setShowMatrixOverlay(false)} />
        </div>
      )}

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeStudio === 'fleet' && <FleetStudio />}
        {activeStudio === 'foundation' && <FoundationStudio />}
        {activeStudio === 'brain' && <BrainStudio />}
        {activeStudio === 'roi' && <RoiStudio />}
        {activeStudio === 'magic' && <MagicStudio />}
      </main>

      {/* Global Defense Mesh Telemetry Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 py-3 text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>KEEPER OF MAIN: 100% GREEN</span>
          </div>
          <span className="text-slate-600">·</span>
          <span>S3 Fleet (WF08, 09, 12, 14)</span>
          <span className="text-slate-600">·</span>
          <span>S1 Foundation (WF01-04)</span>
          <span className="text-slate-600">·</span>
          <span>S2 Brain (WF05-11)</span>
          <span className="text-slate-600">·</span>
          <span>S4 ROI (WF15, 13, 07)</span>
          <span className="text-slate-600">·</span>
          <span>S5 Magic (WF51-53)</span>
        </div>

        <div className="flex items-center gap-4 text-slate-500 text-[11px]">
          <span>SHA-256 ROOT: e3b0c44298fc1c14...</span>
          <span>LATENCY: 11.4ms</span>
          <span>UPTIME: 99.998%</span>
        </div>
      </footer>
    </div>
  );
}
