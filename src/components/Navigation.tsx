import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  BarChart3,
  GitBranch,
  Terminal,
  Cpu,
  LayoutDashboard,
  FileText,
  Clock,
  Sparkles,
  Code2,
  Orbit,
  Bot,
  Zap,
} from 'lucide-react';

export type WorkflowId =
  | 'S3_FLEET'
  | 'WF01'
  | 'WF02'
  | 'WF03'
  | 'WF04'
  | 'WF05'
  | 'WF06'
  | 'WF07'
  | 'WF08'
  | 'WF09'
  | 'WF10'
  | 'WF11'
  | 'WF12'
  | 'WF13'
  | 'WF14';

interface NavItem {
  id: WorkflowId;
  code: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  keyShortcut: string;
  isFlagship?: boolean;
}

const navItems: NavItem[] = [
  { id: 'S3_FLEET', code: 'S3', label: 'Fleet Mesh (The WOW)', icon: Zap, keyShortcut: 'M', isFlagship: true },
  { id: 'WF01', code: 'WF01', label: 'Ingestion & Profile', icon: FileSpreadsheet, keyShortcut: '1' },
  { id: 'WF02', code: 'WF02', label: 'Quality & Contracts', icon: CheckCircle2, keyShortcut: '2' },
  { id: 'WF03', code: 'WF03', label: 'Cleaning & Audit', icon: Filter, keyShortcut: '3' },
  { id: 'WF04', code: 'WF04', label: 'EDA & Statistics', icon: BarChart3, keyShortcut: '4' },
  { id: 'WF05', code: 'WF05', label: 'Feature Engineering', icon: GitBranch, keyShortcut: '5' },
  { id: 'WF06', code: 'WF06', label: 'SQL Engine', icon: Terminal, keyShortcut: '6' },
  { id: 'WF07', code: 'WF07', label: 'ML & Forecast', icon: Cpu, keyShortcut: '7' },
  { id: 'WF08', code: 'WF08', label: 'Charts & Dashboard', icon: LayoutDashboard, keyShortcut: '8' },
  { id: 'WF09', code: 'WF09', label: 'Report & Export', icon: FileText, keyShortcut: '9' },
  { id: 'WF10', code: 'WF10', label: 'Orchestration & Logs', icon: Clock, keyShortcut: '0' },
  { id: 'WF11', code: 'WF11', label: '200-Year Frontier Science', icon: Sparkles, keyShortcut: 'F', isFlagship: true },
  { id: 'WF12', code: 'WF12', label: 'Code Editor & GitHub', icon: Code2, keyShortcut: 'E' },
  { id: 'WF13', code: 'WF13', label: 'Epoch Horizon Analysis', icon: Orbit, keyShortcut: 'H', isFlagship: true },
  { id: 'WF14', code: 'WF14', label: 'Industrial & Robot Brain', icon: Bot, keyShortcut: 'I', isFlagship: true },
];

interface NavigationProps {
  activeTab: WorkflowId;
  onSelectTab: (tab: WorkflowId) => void;
  cleaningStepCount: number;
  qualityFailCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  cleaningStepCount,
  qualityFailCount,
}) => {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4 overflow-x-auto scrollbar-thin">
      <div className="flex items-center space-x-1.5 min-w-max py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                item.isFlagship
                  ? isActive
                    ? 'bg-gradient-to-r from-indigo-900 to-cyan-950 text-cyan-300 border border-cyan-500/80 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : 'bg-indigo-950/50 text-cyan-300 hover:bg-indigo-900/50 border border-indigo-800/60'
                  : item.id === 'WF12'
                  ? isActive
                    ? 'bg-slate-800 text-indigo-300 border border-indigo-500/80 shadow-sm ring-1 ring-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-850 border border-slate-800'
                  : isActive
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : item.isFlagship ? 'text-cyan-400 animate-pulse' : item.id === 'WF12' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className={`font-mono text-xs font-bold ${item.isFlagship ? 'text-cyan-400' : 'text-slate-400'}`}>{item.code}</span>
              <span className="text-xs">{item.label}</span>

              {/* Keypad Shortcut Badge */}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-400 border border-slate-800 ml-0.5">
                {item.keyShortcut}
              </span>

              {item.isFlagship && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                  {item.id === 'S3_FLEET' ? 'THE WOW' : '2046-2246'}
                </span>
              )}

              {/* Dynamic badge counters */}
              {item.id === 'WF02' && qualityFailCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                  {qualityFailCount}
                </span>
              )}
              {item.id === 'WF03' && cleaningStepCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {cleaningStepCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
