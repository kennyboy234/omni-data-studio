import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardWidget, WidgetType } from './types';
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Move,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit3,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Lock,
  Share2,
  Check,
  Download,
  Flame,
  Activity,
  Layers,
  FileCheck,
} from 'lucide-react';

interface WF07DashboardBuilderProps {
  totalSavingsUsd?: number;
  preventedCount?: number;
  onSimulateFault?: () => void;
  onDownloadPdf?: () => void;
}

const PRESET_BOARDROOM: DashboardWidget[] = [
  { id: 'w-1', title: 'Hard-Dollar Loss Prevention', type: 'kpi_roi', w: 6, h: 1 },
  { id: 'w-2', title: 'Autonomous Threat Interception', type: 'kpi_faults', w: 6, h: 1 },
  { id: 'w-3', title: 'Cumulative ROI Velocity (30-Day)', type: 'chart_savings', w: 12, h: 2 },
  { id: 'w-4', title: 'Loss Distribution by Failure Mode', type: 'chart_drift', w: 6, h: 2 },
  { id: 'w-5', title: 'Tactical Health & Risk Suppression', type: 'gauge_health', w: 6, h: 2 },
  { id: 'w-6', title: 'Verified Incident Audit Log', type: 'table_incidents', w: 12, h: 2 },
  { id: 'w-7', title: 'Boss Whisper Executive Flash Memo', type: 'boss_whisper_card', w: 6, h: 1 },
  { id: 'w-8', title: 'Cryptographic SHA-256 Air-Gap Seal', type: 'crypto_seal', w: 6, h: 1 },
];

const PRESET_CFO: DashboardWidget[] = [
  { id: 'c-1', title: 'Hard-Dollar Loss Prevention', type: 'kpi_roi', w: 12, h: 1 },
  { id: 'c-2', title: 'Cumulative ROI Velocity (30-Day)', type: 'chart_savings', w: 12, h: 2 },
  { id: 'c-3', title: 'Loss Distribution by Failure Mode', type: 'chart_drift', w: 6, h: 2 },
  { id: 'c-4', title: 'Boss Whisper Executive Flash Memo', type: 'boss_whisper_card', w: 6, h: 2 },
  { id: 'c-5', title: 'Verified Incident Audit Log', type: 'table_incidents', w: 12, h: 2 },
];

const PRESET_COMMAND: DashboardWidget[] = [
  { id: 't-1', title: 'Autonomous Threat Interception', type: 'kpi_faults', w: 6, h: 1 },
  { id: 't-2', title: 'Tactical Health & Risk Suppression', type: 'gauge_health', w: 6, h: 1 },
  { id: 't-3', title: 'Verified Incident Audit Log', type: 'table_incidents', w: 12, h: 2 },
  { id: 't-4', title: 'Cryptographic SHA-256 Air-Gap Seal', type: 'crypto_seal', w: 12, h: 1 },
  { id: 't-5', title: 'Loss Distribution by Failure Mode', type: 'chart_drift', w: 12, h: 2 },
];

const WIDGET_CATALOG: { type: WidgetType; label: string; defaultTitle: string; icon: any; defaultW: number }[] = [
  { type: 'kpi_roi', label: 'ROI Dollar Preserved', defaultTitle: 'Hard-Dollar Loss Prevention', icon: DollarSign, defaultW: 6 },
  { type: 'kpi_faults', label: 'Faults Intercepted', defaultTitle: 'Autonomous Threat Interception', icon: AlertTriangle, defaultW: 6 },
  { type: 'chart_savings', label: '30-Day ROI Curve', defaultTitle: 'Cumulative ROI Velocity (30-Day)', icon: TrendingUp, defaultW: 12 },
  { type: 'chart_drift', label: 'Failure Distribution', defaultTitle: 'Loss Distribution by Failure Mode', icon: Layers, defaultW: 6 },
  { type: 'gauge_health', label: 'System Health Index', defaultTitle: 'Tactical Health & Risk Suppression', icon: Activity, defaultW: 6 },
  { type: 'table_incidents', label: 'Audit Incident Table', defaultTitle: 'Verified Incident Audit Log', icon: FileCheck, defaultW: 12 },
  { type: 'boss_whisper_card', label: 'Boss Whisper Memo', defaultTitle: 'Boss Whisper Executive Flash Memo', icon: Share2, defaultW: 6 },
  { type: 'crypto_seal', label: 'Cryptographic Seal', defaultTitle: 'Cryptographic SHA-256 Air-Gap Seal', icon: Lock, defaultW: 6 },
];

export const WF07DashboardBuilder: React.FC<WF07DashboardBuilderProps> = ({
  totalSavingsUsd = 1249000,
  preventedCount = 5,
  onSimulateFault,
  onDownloadPdf,
}) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(PRESET_BOARDROOM);
  const [isDesignMode, setIsDesignMode] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [copiedMemo, setCopiedMemo] = useState(false);

  // Recharts baseline savings curve
  const savingsData = [
    { day: 'Day 1', savings: Math.round(totalSavingsUsd * 0.12), platform: 10000 },
    { day: 'Day 5', savings: Math.round(totalSavingsUsd * 0.28), platform: 20000 },
    { day: 'Day 10', savings: Math.round(totalSavingsUsd * 0.45), platform: 40000 },
    { day: 'Day 15', savings: Math.round(totalSavingsUsd * 0.62), platform: 60000 },
    { day: 'Day 20', savings: Math.round(totalSavingsUsd * 0.78), platform: 80000 },
    { day: 'Day 25', savings: Math.round(totalSavingsUsd * 0.91), platform: 100000 },
    { day: 'Day 30', savings: totalSavingsUsd, platform: 120000 },
  ];

  // Failure mode bar breakdown
  const categoryBarData = [
    { category: 'Downtime', amount: 114000 },
    { category: 'Corrupt Data', amount: 754000 },
    { category: 'Model Leakage', amount: 130000 },
    { category: 'Thermal Runaway', amount: 195000 },
    { category: 'Drift Shift', amount: 55500 },
  ];

  // Drag and drop handlers
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const currentIndex = widgets.findIndex((w) => w.id === draggedId);
    const targetIndex = widgets.findIndex((w) => w.id === targetId);

    if (currentIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [moved] = newWidgets.splice(currentIndex, 1);
    newWidgets.splice(targetIndex, 0, moved);

    setWidgets(newWidgets);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const newWidgets = [...widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;
    setWidgets(newWidgets);
  };

  const handleToggleWidth = (id: string) => {
    setWidgets(
      widgets.map((w) => (w.id === id ? { ...w, w: w.w === 12 ? 6 : 12 } : w))
    );
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const handleAddWidget = (catalogItem: (typeof WIDGET_CATALOG)[0]) => {
    const newWidget: DashboardWidget = {
      id: `w-${Date.now().toString(36)}`,
      title: catalogItem.defaultTitle,
      type: catalogItem.type,
      w: catalogItem.defaultW,
      h: 1,
    };
    setWidgets([...widgets, newWidget]);
  };

  const handleCopyQuickMemo = () => {
    const msg = `🚀 OmniData ROI Briefing: Autonomous Defense intercepted ${preventedCount} critical system failures, saving $${totalSavingsUsd.toLocaleString()} in losses. Verified with SHA-256 tamper-evident ledger.`;
    navigator.clipboard.writeText(msg);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  // Render individual widget component
  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'kpi_roi':
        return (
          <div className="flex flex-col justify-between h-full py-2">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center justify-between">
                <span>Hard-Dollar Capital Preserved</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-white mt-2">
                ${totalSavingsUsd.toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block">Net Platform ROI:</span>
                <span className="text-cyan-400 font-bold">+840% Net Surplus</span>
              </div>
              <div>
                <span className="text-slate-500 block">Breakeven Horizon:</span>
                <span className="text-indigo-400 font-bold">18 Days Velocity</span>
              </div>
            </div>
          </div>
        );

      case 'kpi_faults':
        return (
          <div className="flex flex-col justify-between h-full py-2">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center justify-between">
                <span>Autonomous Threat Interceptions</span>
                <ShieldCheck className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-white mt-2 flex items-baseline gap-2">
                <span>{preventedCount}</span>
                <span className="text-xs text-rose-400 uppercase font-bold tracking-wider">
                  Critical Faults
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-center">
              <div className="p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300">
                <span className="block font-bold">2 LETHAL</span>
                <span className="text-[9px] text-rose-400">Robot & Bus</span>
              </div>
              <div className="p-1.5 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300">
                <span className="block font-bold">2 HIGH</span>
                <span className="text-[9px] text-amber-400">Leakage & Nulls</span>
              </div>
              <div className="p-1.5 rounded bg-blue-950/60 border border-blue-800/80 text-blue-300">
                <span className="block font-bold">1 MEDIUM</span>
                <span className="text-[9px] text-blue-400">PSI Drift</span>
              </div>
            </div>
          </div>
        );

      case 'chart_savings':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Cumulative Avoided Loss vs. Annual Platform Fee ($120k)</span>
              <span className="text-emerald-400 font-bold">
                Net Preserved: ${(totalSavingsUsd - 120000).toLocaleString()}
              </span>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="widgetSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    name="Losses Prevented"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#widgetSavingsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'chart_drift':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Preserved Capital by Incident Mode</span>
              <span className="text-cyan-400 font-bold">5 Attack Vectors Intercepted</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBarData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 30, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Preserved']}
                  />
                  <Bar dataKey="amount" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'gauge_health':
        return (
          <div className="flex flex-col justify-between h-full py-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">
                  Industrial Autonomy Health Index
                </div>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                  99.84%
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-600/50 text-emerald-300">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Autonomous Threat Shield</span>
                <span className="text-emerald-400 font-bold">ACTIVE (0 FAILTHROUGHS)</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 w-[99.84%]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/70">
              <div>
                <span className="text-slate-500 block">Zero-Write Isolation:</span>
                <span className="text-slate-200 font-bold">Air-Gapped PLC Read</span>
              </div>
              <div>
                <span className="text-slate-500 block">False Positive Rate:</span>
                <span className="text-emerald-400 font-bold">&lt; 0.02% (3-Sigma)</span>
              </div>
            </div>
          </div>
        );

      case 'table_incidents':
        return (
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px]">
                  <th className="py-2 px-3">Audit ID</th>
                  <th className="py-2 px-3">Failure Mode Prevented</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Autonomous Interceptor</th>
                  <th className="py-2 px-3 text-right">Value Preserved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-[11px]">
                <tr className="hover:bg-slate-900/30">
                  <td className="py-2 px-3 text-cyan-400 font-bold">FLT-101</td>
                  <td className="py-2 px-3 text-slate-200">Robot Arm Singular Jerk (4h downtime averted)</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      CRITICAL
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">WF14 Robot Guard</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">+$114,000</td>
                </tr>
                <tr className="hover:bg-slate-900/30">
                  <td className="py-2 px-3 text-cyan-400 font-bold">FLT-102</td>
                  <td className="py-2 px-3 text-slate-200">5,200 Corrupt Null Records Purged at Gateway</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      HIGH
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">WF02 Quality Pills</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">+$754,000</td>
                </tr>
                <tr className="hover:bg-slate-900/30">
                  <td className="py-2 px-3 text-cyan-400 font-bold">FLT-103</td>
                  <td className="py-2 px-3 text-slate-200">Feature Scaler Data Leakage Blocked on Train</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      HIGH
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">The Brain (Judge)</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">+$130,000</td>
                </tr>
                <tr className="hover:bg-slate-900/30">
                  <td className="py-2 px-3 text-cyan-400 font-bold">FLT-104</td>
                  <td className="py-2 px-3 text-slate-200">CAN Bus Inverter Thermal Runaway Drift Alert</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      CRITICAL
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">WF05 Drift Tower</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">+$195,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'boss_whisper_card':
        return (
          <div className="flex flex-col justify-between h-full py-1 space-y-3">
            <div className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">
                Executive Memo: "We prevented ${totalSavingsUsd.toLocaleString()}"
              </span>
              Auto-formatted for C-suite WhatsApp and Anduril tactical PDF export.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyQuickMemo}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition cursor-pointer"
              >
                {copiedMemo ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedMemo ? 'Copied Memo!' : 'WhatsApp Memo'}</span>
              </button>
              {onDownloadPdf && (
                <button
                  onClick={onDownloadPdf}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PDF Export</span>
                </button>
              )}
            </div>
          </div>
        );

      case 'crypto_seal':
        return (
          <div className="flex flex-col justify-between h-full py-1 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>Air-Gap Ledger Block #142 [IMMUTABLE]</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 break-all">
              ROOT: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Scientific Judge Certified</span>
              <span className="text-emerald-400 font-bold">0 Tamper Flag</span>
            </div>
          </div>
        );

      default:
        return <div className="text-slate-400 text-xs">Widget Content</div>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase tracking-wider flex items-center gap-1">
              <LayoutDashboard className="w-3 h-3 text-cyan-400" />
              WF07 • Interactive Canvas
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
              DRAG-AND-DROP DASHBOARD BUILDER
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Executive Command & Canvas Studio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Construct tailored executive presentations, reorder tactical widgets, and toggle between builder & boardroom presentation modes.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setIsDesignMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                isDesignMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Builder Mode</span>
            </button>
            <button
              onClick={() => setIsDesignMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                !isDesignMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Presentation Mode</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setWidgets(PRESET_BOARDROOM)}
              className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Boardroom Layout"
            >
              Boardroom
            </button>
            <button
              onClick={() => setWidgets(PRESET_CFO)}
              className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="CFO Audit Layout"
            >
              CFO
            </button>
            <button
              onClick={() => setWidgets(PRESET_COMMAND)}
              className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Tactical Command Layout"
            >
              Command
            </button>
          </div>

          {/* Simulate Action */}
          {onSimulateFault && (
            <button
              onClick={onSimulateFault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-900/60 transition cursor-pointer"
              title="Simulate Interception (+ROI)"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Inject Incident</span>
            </button>
          )}
        </div>
      </div>

      {/* Widget Catalog Palette (Shown in Builder Mode) */}
      {isDesignMode && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Widget Library (Click to Add to Canvas)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Active Widgets on Canvas: {widgets.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {WIDGET_CATALOG.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.type}
                  onClick={() => handleAddWidget(cat)}
                  className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition group cursor-pointer text-center"
                >
                  <Icon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition mb-1" />
                  <span className="text-[10px] font-mono font-medium leading-tight line-clamp-1">
                    {cat.label}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                    +{cat.defaultW === 12 ? 'Full' : 'Half'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Drag-and-Drop Canvas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {widgets.map((widget, index) => {
          const isOver = dragOverId === widget.id;
          const isDragging = draggedId === widget.id;
          const colSpanClass = widget.w === 12 ? 'lg:col-span-12' : 'lg:col-span-6';

          return (
            <div
              key={widget.id}
              draggable={isDesignMode}
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDrop={() => handleDrop(widget.id)}
              className={`${colSpanClass} relative rounded-xl border transition-all duration-200 ${
                isDragging
                  ? 'opacity-40 scale-95 border-dashed border-indigo-500'
                  : isOver
                  ? 'border-indigo-400 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-750'
              } p-4 flex flex-col justify-between`}
            >
              {/* Widget Title Bar & Builder Controls */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  {isDesignMode && (
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400"
                      title="Drag to reorder"
                    >
                      <Move className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="text-xs font-bold font-mono text-slate-200 tracking-wide uppercase">
                    {widget.title}
                  </span>
                </div>

                {/* Builder Mode Action Buttons */}
                {isDesignMode && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleWidth(widget.id)}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                      title={widget.w === 12 ? 'Make Half Width' : 'Make Full Width'}
                    >
                      {widget.w === 12 ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-20 transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === widgets.length - 1}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-20 transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveWidget(widget.id)}
                      className="p-1 rounded text-rose-500/70 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="Remove Widget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Widget Body */}
              <div className="flex-1">{renderWidgetContent(widget)}</div>
            </div>
          );
        })}
      </div>

      {/* Canvas Summary Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Layout: {widgets.length} Widgets Configured • Zero Data Leaks</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Mode: {isDesignMode ? 'Builder (Editable)' : 'Executive Presentation'}</span>
          <button
            onClick={() => setWidgets(PRESET_BOARDROOM)}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
