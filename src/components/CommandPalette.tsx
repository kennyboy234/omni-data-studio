import React, { useState, useEffect } from 'react';
import {
  Search,
  Command,
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
  Database,
  Play,
  Download,
  X,
  Keyboard,
  ArrowRight,
  Brain,
  ShieldCheck,
  Sigma,
  Radio,
  Infinity,
  Orbit,
} from 'lucide-react';
import { WorkflowId } from './Navigation';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'workflow' | 'action' | 'dataset';
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateWorkflow: (wf: WorkflowId) => void;
  onRunPipeline: () => void;
  onOpenCopilot: () => void;
  onOpenAuth: () => void;
  onOpenBrain?: () => void;
  onOpenSpssEviews?: () => void;
  onOpenExcelTableau?: () => void;
  onSelectDataset?: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateWorkflow,
  onRunPipeline,
  onOpenCopilot,
  onOpenAuth,
  onOpenBrain,
  onOpenSpssEviews,
  onOpenExcelTableau,
  onSelectDataset,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'wf01',
      title: 'WF01: Data Ingestion & Schema Profiling',
      subtitle: 'Upload CSV/JSON, inspect memory footprints & cryptographic source ledger',
      category: 'workflow',
      shortcut: '1',
      icon: FileSpreadsheet,
      action: () => onNavigateWorkflow('WF01'),
    },
    {
      id: 'wf02',
      title: 'WF02: Data Quality Contracts & Validations',
      subtitle: 'dbt & Great Expectations contract assertions with zero-leakage checks',
      category: 'workflow',
      shortcut: '2',
      icon: CheckCircle2,
      action: () => onNavigateWorkflow('WF02'),
    },
    {
      id: 'wf03',
      title: 'WF03: Cleaning & Transformation Audit',
      subtitle: 'Immutable version lineage, outlier capping, null imputation',
      category: 'workflow',
      shortcut: '3',
      icon: Filter,
      action: () => onNavigateWorkflow('WF03'),
    },
    {
      id: 'wf04',
      title: 'WF04: EDA & Statistical Testing',
      subtitle: 'Pearson/Spearman correlation heatmaps, Welch t-tests, ANOVA',
      category: 'workflow',
      shortcut: '4',
      icon: BarChart3,
      action: () => onNavigateWorkflow('WF04'),
    },
    {
      id: 'wf05',
      title: 'WF05: Feature Engineering & Isolation',
      subtitle: 'Strict train/test split with zero scaler data leakage audit',
      category: 'workflow',
      shortcut: '5',
      icon: GitBranch,
      action: () => onNavigateWorkflow('WF05'),
    },
    {
      id: 'wf06',
      title: 'WF06: In-Browser SQL Engine',
      subtitle: 'Query active datasets with relational aggregates and destructive safeguards',
      category: 'workflow',
      shortcut: '6',
      icon: Terminal,
      action: () => onNavigateWorkflow('WF06'),
    },
    {
      id: 'wf07',
      title: 'WF07: Machine Learning & Forecasting',
      subtitle: 'Train Logistic Regression, Decision Trees, Holt-Winters forecasts',
      category: 'workflow',
      shortcut: '7',
      icon: Cpu,
      action: () => onNavigateWorkflow('WF07'),
    },
    {
      id: 'wf08',
      title: 'WF08: Interactive Visualization Canvas',
      subtitle: 'Real-time charts, KPI aggregations, multi-slice visual analytics',
      category: 'workflow',
      shortcut: '8',
      icon: LayoutDashboard,
      action: () => onNavigateWorkflow('WF08'),
    },
    {
      id: 'wf09',
      title: 'WF09: Analysis Manifest & Report Export',
      subtitle: 'Cryptographic lineage JSON, HTML executive summary, Python script',
      category: 'workflow',
      shortcut: '9',
      icon: FileText,
      action: () => onNavigateWorkflow('WF09'),
    },
    {
      id: 'wf10',
      title: 'WF10: Orchestration DAG & Execution Logs',
      subtitle: 'End-to-end pipeline execution monitor and retry status',
      category: 'workflow',
      shortcut: '0',
      icon: Clock,
      action: () => onNavigateWorkflow('WF10'),
    },
    {
      id: 'wf11',
      title: 'WF11: 200-Year Frontier Science & Nexus 2046',
      subtitle: 'Quantum VQE, Pearl SCM, Robotic Wet-Lab, Lean 4 proofs, Nanobot circuits',
      category: 'workflow',
      shortcut: 'F',
      icon: Sparkles,
      action: () => onNavigateWorkflow('WF11'),
    },
    {
      id: 'wf12',
      title: 'WF12: Code Editor & GitHub Cloud Sync Hub',
      subtitle: 'Edit big files in browser, Supabase migrations, GitHub commit & push',
      category: 'workflow',
      shortcut: 'E',
      icon: Code2,
      action: () => onNavigateWorkflow('WF12'),
    },
    {
      id: 'wf13',
      title: 'WF13: Epoch Horizon Analysis (2026–2200+)',
      subtitle: '7-Era Causal World Models, 3D Celestial Holographic Manifold, Dyson & Noosphere Streams',
      category: 'workflow',
      shortcut: 'H',
      icon: Orbit,
      action: () => onNavigateWorkflow('WF13'),
    },
    {
      id: 'act_pipeline',
      title: 'Run Full Autonomous Pipeline',
      subtitle: 'Execute all 10 workflows with automatic audit validation',
      category: 'action',
      shortcut: '⌘↵',
      icon: Play,
      action: onRunPipeline,
    },
    {
      id: 'act_brain',
      title: 'The Brain: Judge & Memory Layer (Section 14)',
      subtitle: 'Audit analytical outputs, inspect v0 vs v1 diffs, browse Memory bank',
      category: 'action',
      shortcut: 'B',
      icon: Brain,
      action: () => {
        if (onOpenBrain) onOpenBrain();
      },
    },
    {
      id: 'act_copilot',
      title: 'Open OmniCopilot AI Advisor',
      subtitle: 'Gemini 3.8 Flash pipeline feedback and actionable suggestions',
      category: 'action',
      shortcut: '⌘J',
      icon: Sparkles,
      action: onOpenCopilot,
    },
    {
      id: 'act_auth',
      title: 'Supabase Authentication & Identity',
      subtitle: 'Sign in, test user sandbox, connect your own Supabase project',
      category: 'action',
      shortcut: '⌘U',
      icon: Database,
      action: onOpenAuth,
    },
    {
      id: 'act_verify_integrity',
      title: 'Verify Dataset Cryptographic Integrity (SHA-256)',
      subtitle: 'Re-hash raw dataset file and compare against stored fingerprint to display pass/fail status',
      category: 'action',
      shortcut: '⌘I',
      icon: ShieldCheck,
      action: () => {
        onNavigateWorkflow('WF01');
      },
    },
    {
      id: 'act_spss_eviews',
      title: 'SPSS & EViews Statistical Methods Studio (Section 16)',
      subtitle: 'Run textbook-validated t-tests, ANOVA, Chi-Square, OLS HAC, and ADF unit root tests',
      category: 'action',
      shortcut: 'S',
      icon: Sigma,
      action: () => {
        if (onOpenSpssEviews) onOpenSpssEviews();
      },
    },
    {
      id: 'act_excel_tableau',
      title: 'Excel Data Grid & Tableau Visual Canvas (Section 17)',
      subtitle: 'Virtualized grid with TSV copy-paste, calculated formula bar, and drag-and-drop shelf canvas',
      category: 'action',
      shortcut: 'G',
      icon: FileSpreadsheet,
      action: () => {
        if (onOpenExcelTableau) onOpenExcelTableau();
      },
    },
    {
      id: 'act_era6_dyson',
      title: 'Era VI: Astro-Scale Dyson Grids & Biosurveillance (2080–2120)',
      subtitle: 'Stellar System Energy Harvesting (Exawatts), Exoplanet Biosignatures & Relativistic Grids',
      category: 'action',
      shortcut: '6',
      icon: Radio,
      action: () => {
        onNavigateWorkflow('WF13');
      },
    },
    {
      id: 'act_era7_noosphere',
      title: 'Era VII: Spacetime Manifold & Noosphere Intelligence (2120–2200+)',
      subtitle: 'Ryu-Takayanagi AdS/CFT Holographic Area Law, Noosphere Φ* Integrated Info, Primordial Metric',
      category: 'action',
      shortcut: '7',
      icon: Infinity,
      action: () => {
        onNavigateWorkflow('WF13');
      },
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      c.shortcut?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation within the palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a workflow name, key (1-9, F, E), or action..."
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm font-sans outline-none"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 text-slate-400 rounded border border-slate-700">
              ESC
            </kbd>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Command List */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No matching workflows or commands found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white shadow-sm ring-1 ring-cyan-500/50'
                      : 'text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-semibold truncate">{item.title}</div>
                      <div className="text-xs text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  {item.shortcut && (
                    <kbd className="px-2 py-1 text-xs font-mono font-bold bg-slate-950 text-cyan-400 rounded border border-slate-800 ml-2">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer Key Hints */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="text-cyan-400">Quick Keypad: 1-9, 0, F, E</span>
        </div>
      </div>
    </div>
  );
};
