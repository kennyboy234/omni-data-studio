import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  Sparkles,
  Play,
  Download,
  HardDrive,
  AlertCircle,
  User,
  LogIn,
  Search,
  Code2,
  Cloud,
  Command,
  Brain,
  Sigma,
  FileSpreadsheet,
  ChevronDown,
  Hash,
  Check,
  Flame,
  Workflow,
  Radio,
} from 'lucide-react';
import { Dataset } from '../types';
import { AuthUser } from './AuthModal';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getShortHash(sha256Hash: string): string {
  return sha256Hash.replace(/^sha256_/, '').slice(0, 8);
}

interface HeaderProps {
  datasets: Dataset[];
  activeDatasetId: string;
  onSelectDataset: (id: string) => void;
  onRunFullPipeline: () => void;
  isPipelineRunning: boolean;
  onOpenReport: () => void;
  onOpenFutureScience?: () => void;
  onOpenCopilot?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenEditor?: () => void;
  onOpenBrain?: () => void;
  onOpenAiReasoning?: () => void;
  onOpenFleetConnectivity?: () => void;
  onOpenSpssEviews?: () => void;
  onOpenExcelTableau?: () => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  aiActive: boolean;
  onOpenFeatureStatus?: () => void;
  onOpenChaosLab?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  datasets,
  activeDatasetId,
  onSelectDataset,
  onRunFullPipeline,
  isPipelineRunning,
  onOpenReport,
  onOpenFutureScience,
  onOpenCopilot,
  onOpenCommandPalette,
  onOpenEditor,
  onOpenBrain,
  onOpenAiReasoning,
  onOpenFleetConnectivity,
  onOpenSpssEviews,
  onOpenExcelTableau,
  currentUser,
  onOpenAuth,
  aiActive,
  onOpenFeatureStatus,
  onOpenChaosLab,
}) => {
  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDatasets = datasets.filter((d) =>
    d.name.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
    d.sourceType.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  const activeRows = activeDataset.profile?.rowCount || activeDataset.data.length;
  const activeBytes = activeDataset.profile?.memoryEstimateBytes || activeDataset.data.length * 128;
  const activeShortHash = getShortHash(activeDataset.sha256Hash);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 sm:px-6 py-3.5 sticky top-0 z-40">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: Branding & Dataset Picker */}
        <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">OmniData Studio</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md uppercase tracking-wider">
                  Autonomous
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                Autonomous Data Science, Supabase Cloud & 200-Year Frontier Engines
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Refactored Dataset Selection Area */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative" ref={dropdownRef}>
              <div className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/60 transition cursor-pointer text-left shadow-sm group-hover:border-cyan-500/40"
                  title={`Active Dataset: ${activeDataset.name}`}
                >
                  <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />

                  {/* Primary Dataset Name: fully visible, never truncated */}
                  <span className="text-xs font-semibold text-white tracking-tight whitespace-nowrap">
                    {activeDataset.name}
                  </span>

                  {/* Small Metadata Badge (Row count, File size, Last modified) */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-900/90 text-slate-300 border border-slate-750 shrink-0">
                    <span className="text-slate-200 font-medium">{activeRows.toLocaleString()} rows</span>
                    <span className="text-slate-600">•</span>
                    <span>{formatBytes(activeBytes)}</span>
                    <span className="text-slate-600 hidden md:inline">•</span>
                    <span className="hidden md:inline">{formatDateShort(activeDataset.createdAt)}</span>
                  </span>

                  {/* First 8 characters of SHA-256 fingerprint revealed seamlessly upon hover */}
                  <span className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity duration-150 items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                    <Hash className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{activeShortHash}</span>
                  </span>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      isDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                {/* Non-intrusive Floating Metadata Card on Hover */}
                <div className="pointer-events-none absolute left-0 top-full mt-2 hidden group-hover:flex z-50 flex-col gap-1.5 p-3 rounded-xl bg-slate-950/95 border border-slate-800 text-xs shadow-2xl backdrop-blur-md min-w-[280px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-white truncate max-w-[190px]">{activeDataset.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">{activeDataset.sourceType}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                    <div>Rows: <strong className="text-white">{activeRows.toLocaleString()}</strong></div>
                    <div>Cols: <strong className="text-white">{activeDataset.columns.length}</strong></div>
                    <div>Size: <strong className="text-white">{formatBytes(activeBytes)}</strong></div>
                    <div>Modified: <strong className="text-white">{formatDateShort(activeDataset.createdAt)}</strong></div>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">SHA-256 (first 8):</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      #{activeShortHash}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Dropdown Menu with Search & Metadata Badges */}
              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-84 sm:w-96 rounded-2xl bg-slate-900 border border-slate-750 shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search datasets..."
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {filteredDatasets.map((ds) => {
                      const isSelected = ds.id === activeDataset.id;
                      const dsRows = ds.profile?.rowCount || ds.data.length;
                      const dsBytes = ds.profile?.memoryEstimateBytes || ds.data.length * 128;
                      const shortHash = getShortHash(ds.sha256Hash);

                      return (
                        <button
                          key={ds.id}
                          type="button"
                          onClick={() => {
                            onSelectDataset(ds.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left border transition flex flex-col gap-1 cursor-pointer group/item ${
                            isSelected
                              ? 'bg-slate-800/90 border-cyan-500/70 shadow-sm'
                              : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-white group-hover/item:text-cyan-300 transition">
                              {ds.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>

                          {/* Metadata Badge & Fingerprint on Hover */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1.5">
                              <span>{dsRows.toLocaleString()} rows</span>
                              <span>•</span>
                              <span>{formatBytes(dsBytes)}</span>
                              <span>•</span>
                              <span>{formatDateShort(ds.createdAt)}</span>
                            </span>

                            <span className="px-1.5 py-0.2 rounded bg-slate-800 group-hover/item:bg-cyan-950 text-slate-400 group-hover/item:text-cyan-300 border border-slate-700 group-hover/item:border-cyan-800 transition">
                              #{shortHash}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Immutability & Status Indicator */}
            {activeDataset.isImmutableSource ? (
              <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Raw Source Immutable
              </span>
            ) : (
              <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800 rounded-lg">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                Cleaned v{activeDataset.version}
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Search, Cloud Status, Orchestration & Auth Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Supabase Status Indicator */}
          <button
            onClick={onOpenAuth}
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/80 transition cursor-pointer"
            title="Supabase PostgreSQL & Auth Connected"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Ready</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
          </button>

          {/* Command Palette / Keypad Search Button */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition cursor-pointer shadow-sm"
              title="Search workflows, keypads, and actions (Ctrl+K or Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Search / Keypad</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 text-slate-400 rounded border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* In-Browser Code & Big File Editor Button */}
          {onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition cursor-pointer shadow-sm"
              title="Open In-Browser Code Editor & GitHub Hub"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Code & GitHub</span>
            </button>
          )}

          {/* 2046 Nexus Button */}
          {onOpenFutureScience && (
            <button
              onClick={onOpenFutureScience}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-gradient-to-r from-indigo-950 to-cyan-950 hover:from-indigo-900 hover:to-cyan-900 border border-cyan-500/50 rounded-xl shadow-sm shadow-cyan-950/50 transition cursor-pointer"
              title="Open 200-Year Frontier Science & Nexus 2046"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Nexus 200Y</span>
            </button>
          )}

          {/* The Brain (Judge & Memory Layer) Button */}
          {onOpenBrain && (
            <button
              onClick={onOpenBrain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 hover:from-cyan-900 hover:to-indigo-900 border border-cyan-500/70 text-cyan-200 transition shadow-sm cursor-pointer ring-1 ring-cyan-500/20"
              title="Open The Brain: Independent Judge & Persistent Memory Layer (Section 14)"
            >
              <Brain className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-semibold">The Brain</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-900/60 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-700/60">
                Judge
              </span>
            </button>
          )}

          {/* AI Reasoning Engine (Visual Computational Logic Path & Derivations) */}
          {onOpenAiReasoning && (
            <button
              onClick={onOpenAiReasoning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-gradient-to-r from-amber-950/80 to-indigo-950/80 hover:from-amber-900 hover:to-indigo-900 border border-amber-500/70 text-amber-200 transition shadow-sm cursor-pointer ring-1 ring-amber-500/20"
              title="Open AI Reasoning Engine: Computational Logic Path, Symbolic Derivations, and Frontier Models"
            >
              <Workflow className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-semibold hidden lg:inline">AI Reasoning</span>
              <span className="font-semibold lg:hidden">Reasoning</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-900/60 text-[10px] font-mono font-bold text-amber-300 border border-amber-700/60">
                DAG
              </span>
            </button>
          )}

          {/* Universal Fleet & Cloud Connectivity Mesh */}
          {onOpenFleetConnectivity && (
            <button
              onClick={onOpenFleetConnectivity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 hover:from-cyan-900 hover:to-indigo-900 border border-cyan-500/70 text-cyan-200 transition shadow-sm cursor-pointer ring-1 ring-cyan-500/20"
              title="Open Universal Fleet, Automotive, Robot & Cloud App Mesh (ROS2, CAN Bus, n8n, Supabase, M365)"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-semibold hidden lg:inline">Fleet &amp; App Mesh</span>
              <span className="font-semibold lg:hidden">Mesh</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-900/60 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-700/60">
                10 Nodes
              </span>
            </button>
          )}

          {/* Feature Status & Veracity Registry */}
          {onOpenFeatureStatus && (
            <button
              onClick={onOpenFeatureStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/60 text-slate-100 transition shadow-sm cursor-pointer"
              title="Open Unified Feature Status & Veracity Registry (WORKING / PARTIAL / SIMULATED / PLANNED)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold hidden lg:inline">Status Registry</span>
              <span className="font-semibold lg:hidden">Status</span>
            </button>
          )}

          {/* Adversarial Stress & Chaos Test Lab */}
          {onOpenChaosLab && (
            <button
              onClick={onOpenChaosLab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-gradient-to-r from-red-950/80 to-amber-950/80 hover:from-red-900 hover:to-amber-900 border border-red-500/60 hover:border-red-400 text-red-200 transition shadow-sm cursor-pointer"
              title="Open Adversarial Stress Test & Chaos Simulator Lab (Worst-case boundary resilience)"
            >
              <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="font-semibold hidden lg:inline">Chaos Lab</span>
              <span className="font-semibold lg:hidden">Chaos</span>
            </button>
          )}

          {/* SPSS / EViews Statistical Studio (Section 16) */}
          {onOpenSpssEviews && (
            <button
              onClick={onOpenSpssEviews}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/60 text-slate-100 transition shadow-sm cursor-pointer"
              title="Open SPSS & EViews Statistical Methods Studio (Section 16)"
            >
              <Sigma className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold hidden xl:inline">SPSS / EViews</span>
              <span className="font-semibold xl:hidden">Stats</span>
            </button>
          )}

          {/* Excel / Tableau Visual Data Studio (Section 17) */}
          {onOpenExcelTableau && (
            <button
              onClick={onOpenExcelTableau}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/60 text-slate-100 transition shadow-sm cursor-pointer"
              title="Open Excel Data Grid & Tableau Visual Canvas (Section 17)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold hidden xl:inline">Excel / Tableau</span>
              <span className="font-semibold xl:hidden">Grid</span>
            </button>
          )}

          {/* AI Status / Copilot Button */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/60 text-slate-100 transition shadow-sm cursor-pointer"
            title="Open OmniCopilot AI Advisor & Feedback"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping" />
            <span className="font-semibold text-cyan-300">OmniCopilot AI</span>
          </button>

          {/* Run Pipeline Button */}
          <button
            onClick={onRunFullPipeline}
            disabled={isPipelineRunning}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer ${
              isPipelineRunning
                ? 'bg-indigo-700/50 text-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isPipelineRunning ? 'animate-spin' : ''}`} />
            <span>{isPipelineRunning ? 'Running...' : 'Run Pipeline'}</span>
          </button>

          {/* User / Supabase Auth Profile Trigger */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition cursor-pointer ${
              currentUser
                ? 'bg-slate-800 hover:bg-slate-750 border-slate-750 text-slate-200'
                : 'bg-emerald-950/80 hover:bg-emerald-900/80 border-emerald-700 text-emerald-300'
            }`}
            title={currentUser ? `Logged in as ${currentUser.name}` : 'Sign in or test with Supabase'}
          >
            {currentUser ? (
              <>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono leading-none">
                    {currentUser.role.split(' ')[0]}
                  </div>
                </div>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-xs">Supabase Auth</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
