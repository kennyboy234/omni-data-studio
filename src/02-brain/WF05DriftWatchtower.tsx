import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { BrainComponentState, DriftMetric } from './types';
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  TrendingUp,
  BarChart2,
} from 'lucide-react';

interface WF05DriftWatchtowerProps {
  forcedState?: BrainComponentState;
  onStateChange?: (state: BrainComponentState) => void;
}

const INITIAL_DRIFT_METRICS: DriftMetric[] = [
  {
    feature: 'payment_latency_ms',
    psi: 0.042,
    ksPValue: 0.88,
    status: 'stable',
    baselineMean: 142.5,
    currentMean: 144.1,
    varianceShiftPct: +1.1,
  },
  {
    feature: 'session_duration_sec',
    psi: 0.078,
    ksPValue: 0.45,
    status: 'stable',
    baselineMean: 380.0,
    currentMean: 395.2,
    varianceShiftPct: +4.0,
  },
  {
    feature: 'transaction_volume_usd',
    psi: 0.115,
    ksPValue: 0.09,
    status: 'moderate',
    baselineMean: 1240.0,
    currentMean: 1390.5,
    varianceShiftPct: +12.1,
  },
  {
    feature: 'api_error_rate_pct',
    psi: 0.018,
    ksPValue: 0.94,
    status: 'stable',
    baselineMean: 0.42,
    currentMean: 0.44,
    varianceShiftPct: +0.5,
  },
  {
    feature: 'customer_risk_score',
    psi: 0.035,
    ksPValue: 0.72,
    status: 'stable',
    baselineMean: 48.2,
    currentMean: 49.0,
    varianceShiftPct: +1.6,
  },
];

const BASELINE_HISTOGRAM = [
  { bin: '0-10%', baseline: 8.5, current: 8.3 },
  { bin: '10-20%', baseline: 14.2, current: 13.9 },
  { bin: '20-30%', baseline: 22.0, current: 21.8 },
  { bin: '30-40%', baseline: 26.5, current: 27.1 },
  { bin: '40-50%', baseline: 16.8, current: 16.5 },
  { bin: '50-60%', baseline: 7.2, current: 7.4 },
  { bin: '60-70%', baseline: 3.2, current: 3.3 },
  { bin: '70-80%', baseline: 1.1, current: 1.2 },
  { bin: '80-100%', baseline: 0.5, current: 0.5 },
];

export const WF05DriftWatchtower: React.FC<WF05DriftWatchtowerProps> = ({
  forcedState,
  onStateChange,
}) => {
  const [componentState, setComponentState] = useState<BrainComponentState>(forcedState || 'idle');
  const [metrics, setMetrics] = useState<DriftMetric[]>(INITIAL_DRIFT_METRICS);
  const [histData, setHistData] = useState(BASELINE_HISTOGRAM);
  const [selectedFeature, setSelectedFeature] = useState<string>('transaction_volume_usd');
  const [analyzingProgress, setAnalyzingProgress] = useState<number>(0);

  useEffect(() => {
    if (forcedState) {
      setComponentState(forcedState);
    }
  }, [forcedState]);

  const updateState = (newState: BrainComponentState) => {
    setComponentState(newState);
    onStateChange?.(newState);
  };

  const handleRunAnalysis = () => {
    updateState('analyzing');
    setAnalyzingProgress(10);
    const interval = setInterval(() => {
      setAnalyzingProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          updateState('idle');
          return 100;
        }
        return p + 25;
      });
    }, 400);
  };

  const handleInjectDrift = () => {
    updateState('analyzing');
    setAnalyzingProgress(20);
    setTimeout(() => {
      // Shift distribution heavily
      const drifted = metrics.map((m) => {
        if (m.feature === 'transaction_volume_usd' || m.feature === 'payment_latency_ms') {
          return {
            ...m,
            psi: 0.384,
            ksPValue: 0.0012,
            status: 'critical' as const,
            currentMean: m.baselineMean * 1.65,
            varianceShiftPct: +64.5,
          };
        }
        return m;
      });
      setMetrics(drifted);

      // Skew histogram
      setHistData([
        { bin: '0-10%', baseline: 8.5, current: 2.1 },
        { bin: '10-20%', baseline: 14.2, current: 4.8 },
        { bin: '20-30%', baseline: 22.0, current: 8.5 },
        { bin: '30-40%', baseline: 26.5, current: 14.2 },
        { bin: '40-50%', baseline: 16.8, current: 22.4 },
        { bin: '50-60%', baseline: 7.2, current: 24.1 },
        { bin: '60-70%', baseline: 3.2, current: 14.9 },
        { bin: '70-80%', baseline: 1.1, current: 6.8 },
        { bin: '80-100%', baseline: 0.5, current: 2.2 },
      ]);

      setAnalyzingProgress(100);
      updateState('alert');
    }, 1200);
  };

  const handleResetBaseline = () => {
    setMetrics(INITIAL_DRIFT_METRICS);
    setHistData(BASELINE_HISTOGRAM);
    updateState('idle');
    setAnalyzingProgress(0);
  };

  const maxPsi = Math.max(...metrics.map((m) => m.psi));
  const isAlertState = componentState === 'alert';
  const isAnalyzing = componentState === 'analyzing';

  return (
    <div
      className={`rounded-2xl transition-all duration-500 border ${
        isAlertState
          ? 'bg-rose-950/20 border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/60'
          : isAnalyzing
          ? 'bg-slate-900/90 border-cyan-500/70 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      } p-6`}
    >
      {/* Header & State Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl transition-colors ${
                isAlertState
                  ? 'bg-rose-500/20 text-rose-400'
                  : isAnalyzing
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-cyan-400">
                  WF05 • Brain Telemetry
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                    isAlertState
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 animate-pulse'
                      : isAnalyzing
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {componentState.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Drift Watchtower</h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Continuous Population Stability Index (PSI) & 2-sample Kolmogorov-Smirnov drift surveillance.
          </p>
        </div>

        {/* Heartbeat pulse animation during Analyzing / Alert */}
        <div className="flex items-center gap-3">
          {isAnalyzing && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs font-mono">
              <Activity className="w-4 h-4 animate-bounce text-cyan-400" />
              <span>Scanning Telemetry ({analyzingProgress}%)</span>
            </div>
          )}

          {isAlertState && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-mono animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>CRITICAL DRIFT DETECTED (PSI: {maxPsi.toFixed(3)})</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Run live scan"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scan</span>
            </button>
            <button
              onClick={handleInjectDrift}
              disabled={isAnalyzing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800 transition"
              title="Inject synthetic concept drift"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Inject Drift</span>
            </button>
            <button
              onClick={handleResetBaseline}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Reset to baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Recharts Distribution Comparison (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">
                Density Distribution: Baseline vs. Current Batch
              </span>
            </div>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 font-mono"
            >
              {metrics.map((m) => (
                <option key={m.feature} value={m.feature}>
                  {m.feature}
                </option>
              ))}
            </select>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="bin" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="baseline" name="Baseline (Reference)" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar
                  dataKey="current"
                  name="Current Stream"
                  fill={isAlertState ? '#f43f5e' : '#06b6d4'}
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Drift Scorecard Table (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">Feature Drift Matrix</span>
              <span className="text-[10px] font-mono text-slate-500">Threshold: PSI &gt; 0.25 (Alert)</span>
            </div>

            <div className="space-y-2">
              {metrics.map((m) => {
                const isCritical = m.status === 'critical';
                const isModerate = m.status === 'moderate';
                return (
                  <div
                    key={m.feature}
                    onClick={() => setSelectedFeature(m.feature)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                      m.feature === selectedFeature
                        ? 'bg-slate-800/70 border-cyan-500/50'
                        : 'bg-slate-900/50 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono font-medium text-slate-200 truncate max-w-[150px]">
                        {m.feature}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Shift: {m.varianceShiftPct >= 0 ? `+${m.varianceShiftPct.toFixed(1)}%` : `${m.varianceShiftPct.toFixed(1)}%`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {m.psi.toFixed(3)}
                        </span>
                        {isCritical ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        ) : isModerate ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          isCritical
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : isModerate
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Overall Dataset Drift</span>
            <span
              className={`font-bold ${
                isAlertState ? 'text-rose-400' : isAnalyzing ? 'text-cyan-400' : 'text-emerald-400'
              }`}
            >
              {isAlertState ? 'CRITICAL (PSI: 0.384)' : 'STABLE (PSI: 0.042)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
