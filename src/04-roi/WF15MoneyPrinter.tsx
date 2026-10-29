import React, { useState, useMemo } from 'react';
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
  Legend,
} from 'recharts';
import { CostConfig, PreventedFaultItem } from './types';
import {
  DollarSign,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Zap,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

const INITIAL_COST_CONFIG: CostConfig = {
  downtimeCostPerHour: 28500,
  dataCorruptionCostPerRecord: 145,
  criticalIncidentCost: 65000,
  engineeringHourCost: 185,
  falsePositiveCost: 450,
};

const BASELINE_PREVENTED_FAULTS: PreventedFaultItem[] = [
  {
    id: 'FLT-101',
    timestamp: '2026-10-24 08:14',
    type: 'downtime',
    title: 'High-Gantry Robot Arm Singular Jerk Intercepted',
    severity: 'critical',
    costPreventedUsd: 114000, // 4 hrs downtime prevented
    detectedBy: 'WF14 Robot Kinematics Guard',
    mitigationTimeSec: 1.2,
  },
  {
    id: 'FLT-102',
    timestamp: '2026-10-24 11:28',
    type: 'corruption',
    title: '5,200 Corrupt Null Sensor Payloads Blocked at Ingest',
    severity: 'high',
    costPreventedUsd: 754000, // 5,200 * $145
    detectedBy: 'WF02 Quality Contract Pills',
    mitigationTimeSec: 0.4,
  },
  {
    id: 'FLT-103',
    timestamp: '2026-10-25 04:02',
    type: 'leakage',
    title: 'Data Leakage in Feature Scaler Blocked Before Train',
    severity: 'high',
    costPreventedUsd: 130000, // 2 critical production model retrains
    detectedBy: 'The Brain (Judge Audit)',
    mitigationTimeSec: 0.8,
  },
  {
    id: 'FLT-104',
    timestamp: '2026-10-25 15:45',
    type: 'incident',
    title: 'CAN Bus Inverter Thermal Runaway Drift Alert',
    severity: 'critical',
    costPreventedUsd: 195000, // 3x critical incidents
    detectedBy: 'WF05 Drift Watchtower',
    mitigationTimeSec: 2.1,
  },
  {
    id: 'FLT-105',
    timestamp: '2026-10-26 09:12',
    type: 'drift',
    title: 'Population Distribution Shift Detected (PSI 0.384)',
    severity: 'medium',
    costPreventedUsd: 55500, // 300 engineering triage hours
    detectedBy: 'WF06 Anomaly Pulse',
    mitigationTimeSec: 0.6,
  },
];

export const WF15MoneyPrinter: React.FC = () => {
  const [config, setConfig] = useState<CostConfig>(INITIAL_COST_CONFIG);
  const [faults, setFaults] = useState<PreventedFaultItem[]>(BASELINE_PREVENTED_FAULTS);
  const [printerTickPulse, setPrinterTickPulse] = useState(false);

  // Recalculate financial ROI based on dynamic inputs
  const calculatedSavings = useMemo(() => {
    let total = 0;
    faults.forEach((f) => {
      if (f.type === 'downtime') {
        total += config.downtimeCostPerHour * 4;
      } else if (f.type === 'corruption') {
        total += config.dataCorruptionCostPerRecord * 5200;
      } else if (f.type === 'incident') {
        total += config.criticalIncidentCost * 3;
      } else if (f.type === 'leakage') {
        total += config.criticalIncidentCost * 2;
      } else {
        total += config.engineeringHourCost * 300;
      }
    });
    return total;
  }, [config, faults]);

  // Platform Subscription cost benchmark
  const platformCostAnnual = 120000;
  const netRoiPercent = Math.round(((calculatedSavings - platformCostAnnual) / platformCostAnnual) * 100);
  const paybackDays = Math.max(2, Math.round((platformCostAnnual / (calculatedSavings / 365))));

  // Timeline cumulative savings curve
  const timelineData = useMemo(() => {
    let cumulative = 0;
    const days = ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'];
    return days.map((day, idx) => {
      const step = (calculatedSavings / days.length) * (idx + 1);
      cumulative = Math.round(step);
      return {
        day,
        savings: cumulative,
        baselineCost: Math.round((platformCostAnnual / 12) * ((idx + 1) / days.length)),
      };
    });
  }, [calculatedSavings]);

  // Category breakdown for waterfall bar chart
  const categoryData = useMemo(() => {
    return [
      { category: 'Downtime Averted', amount: Math.round(config.downtimeCostPerHour * 4) },
      { category: 'Data Corruption', amount: Math.round(config.dataCorruptionCostPerRecord * 5200) },
      { category: 'Critical Incidents', amount: Math.round(config.criticalIncidentCost * 5) },
      { category: 'Engineering Hours', amount: Math.round(config.engineeringHourCost * 300) },
    ];
  }, [config]);

  // One-click fault injector that stimulates Money Printer
  const handlePrintMoreMoney = () => {
    setPrinterTickPulse(true);
    const newFault: PreventedFaultItem = {
      id: `FLT-${106 + faults.length}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'incident',
      title: 'High-Voltage Battery Overheat Telemetry Spike Intercepted',
      severity: 'critical',
      costPreventedUsd: config.criticalIncidentCost,
      detectedBy: 'WF06 Anomaly Pulse',
      mitigationTimeSec: 0.9,
    };
    setFaults([newFault, ...faults]);
    setTimeout(() => setPrinterTickPulse(false), 800);
  };

  const handleReset = () => {
    setConfig(INITIAL_COST_CONFIG);
    setFaults(BASELINE_PREVENTED_FAULTS);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-emerald-400" />
              WF15 • Financial Intelligence
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
              REAL-TIME ROI CALCULATOR
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Money Printer & Fault Prevention Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamically adjust organizational cost parameters per failure mode to calculate certified hard-dollar ROI.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintMoreMoney}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" />
            <span>Simulate Intercepted Failure (+$$$)</span>
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Reset parameters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Financial Ticker Displays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Dollars Prevented */}
        <div
          className={`p-4 rounded-xl border transition-all duration-300 ${
            printerTickPulse
              ? 'bg-emerald-950/80 border-emerald-400 scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.35)]'
              : 'bg-gradient-to-br from-emerald-950/40 to-slate-950 border-emerald-600/40'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center justify-between">
            <span>Hard Dollar Losses Prevented</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
            ${calculatedSavings.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400/90 flex items-center gap-1 mt-1 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{faults.length} Critical Faults Blocked</span>
          </div>
        </div>

        {/* Metric 2: Net ROI % */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center justify-between">
            <span>Net Platform ROI</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 mt-1">
            {netRoiPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Over $120k/yr platform contract
          </div>
        </div>

        {/* Metric 3: Payback Horizon */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center justify-between">
            <span>Breakeven Velocity</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-300 mt-1">
            {paybackDays} Days
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Time to 100% investment recovery
          </div>
        </div>

        {/* Metric 4: Mean Time to Mitigation */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between">
            <span>Automated Mitigation Time</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-1">
            0.94 sec
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Zero human intervention required
          </div>
        </div>
      </div>

      {/* Main Interactive Grid: Sliders on Left, Charts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Cost per Fault Sliders (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Cost Per Fault Parameters
            </span>
            <span className="text-[10px] font-mono text-slate-500">Live Calibration</span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Slider 1: Downtime Cost Per Hour */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Downtime Cost / Hour:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  ${config.downtimeCostPerHour.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="2500"
                value={config.downtimeCostPerHour}
                onChange={(e) =>
                  setConfig({ ...config, downtimeCostPerHour: Number(e.target.value) })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>$5k/hr (Light)</span>
                <span>$50k/hr (Auto Plant)</span>
                <span>$100k/hr (Semiconductor)</span>
              </div>
            </div>

            {/* Slider 2: Corrupted Record Cost */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Cost / Bad Data Record:</span>
                <span className="text-cyan-400 font-bold font-mono">
                  ${config.dataCorruptionCostPerRecord.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={config.dataCorruptionCostPerRecord}
                onChange={(e) =>
                  setConfig({ ...config, dataCorruptionCostPerRecord: Number(e.target.value) })
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>$20 (Telemetry)</span>
                <span>$150 (Fintech / KYC)</span>
                <span>$500 (Clinical Trial)</span>
              </div>
            </div>

            {/* Slider 3: Critical Incident Cost */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Critical Incident Outage:</span>
                <span className="text-rose-400 font-bold font-mono">
                  ${config.criticalIncidentCost.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="250000"
                step="5000"
                value={config.criticalIncidentCost}
                onChange={(e) =>
                  setConfig({ ...config, criticalIncidentCost: Number(e.target.value) })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>$10k (Tier 3)</span>
                <span>$65k (Tier 1)</span>
                <span>$250k (Total Blackout)</span>
              </div>
            </div>

            {/* Slider 4: Engineering Triage Hour Cost */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Eng/Data Scientist Rate / Hr:</span>
                <span className="text-indigo-400 font-bold font-mono">
                  ${config.engineeringHourCost}/hr
                </span>
              </div>
              <input
                type="range"
                min="75"
                max="350"
                step="15"
                value={config.engineeringHourCost}
                onChange={(e) =>
                  setConfig({ ...config, engineeringHourCost: Number(e.target.value) })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: Financial Cumulative & Breakdown Charts (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Cumulative ROI vs. Platform Investment
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              Net Surplus: ${(calculatedSavings - platformCostAnnual).toLocaleString()}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
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
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="savings"
                  name="Cumulative Savings ($)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#savingsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Savings by Category Bar */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-300 mb-2">
              Value Preserved By Failure Mode:
            </div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="category" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Saved']}
                  />
                  <Bar dataKey="amount" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Log of Prevented Failures Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Prevented Faults Audit Log ({faults.length} Events)
          </span>
          <span className="text-[10px] font-mono text-slate-500">Cryptographically Signed</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Fault ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Failure Mode Prevented</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Autonomous Interceptor</th>
                <th className="py-2.5 px-3 text-right">Value Preserved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[11px]">
              {faults.map((f) => (
                <tr key={f.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-2 px-3 text-cyan-300 font-bold">{f.id}</td>
                  <td className="py-2 px-3 text-slate-500">{f.timestamp}</td>
                  <td className="py-2 px-3 text-slate-200">{f.title}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.severity === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : f.severity === 'high'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {f.severity}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">{f.detectedBy}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">
                    +${f.costPreventedUsd.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
