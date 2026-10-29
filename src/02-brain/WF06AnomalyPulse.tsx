import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { BrainComponentState, AnomalyPoint } from './types';
import {
  Radio,
  Activity,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

interface WF06AnomalyPulseProps {
  forcedState?: BrainComponentState;
  onStateChange?: (state: BrainComponentState) => void;
}

const generateNormalStream = (): AnomalyPoint[] => {
  const points: AnomalyPoint[] = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const t = new Date(now - i * 5000);
    const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const base = 50 + Math.sin(i * 0.4) * 8 + (Math.random() - 0.5) * 4;
    points.push({
      timestamp: timeStr,
      value: Number(base.toFixed(2)),
      expected: 50,
      upperBound: 70,
      lowerBound: 30,
      anomalyScore: Number((Math.random() * 0.25).toFixed(3)),
      isAnomaly: false,
      severity: 'normal',
    });
  }
  return points;
};

export const WF06AnomalyPulse: React.FC<WF06AnomalyPulseProps> = ({
  forcedState,
  onStateChange,
}) => {
  const [componentState, setComponentState] = useState<BrainComponentState>(forcedState || 'idle');
  const [dataPoints, setDataPoints] = useState<AnomalyPoint[]>(generateNormalStream);
  const [threshold, setThreshold] = useState<number>(70);
  const [anomalyCount, setAnomalyCount] = useState<number>(0);
  const [heartbeatBeat, setHeartbeatBeat] = useState<boolean>(false);

  useEffect(() => {
    if (forcedState) {
      setComponentState(forcedState);
    }
  }, [forcedState]);

  // Simulating live heartbeat ticking during analyzing
  useEffect(() => {
    let interval: any;
    if (componentState === 'analyzing') {
      interval = setInterval(() => {
        setHeartbeatBeat((prev) => !prev);
      }, 500);
    } else {
      setHeartbeatBeat(false);
    }
    return () => clearInterval(interval);
  }, [componentState]);

  const updateState = (newState: BrainComponentState) => {
    setComponentState(newState);
    onStateChange?.(newState);
  };

  const handleRunPulseAudit = () => {
    updateState('analyzing');
    setTimeout(() => {
      updateState('idle');
    }, 1800);
  };

  const handleInjectOutlierBurst = () => {
    updateState('analyzing');
    setTimeout(() => {
      const updated = [...dataPoints];
      // Inject 3 high outlier spikes
      const indicesToSpike = [updated.length - 4, updated.length - 3, updated.length - 1];
      indicesToSpike.forEach((idx) => {
        if (updated[idx]) {
          updated[idx] = {
            ...updated[idx],
            value: Number((88 + Math.random() * 25).toFixed(2)),
            anomalyScore: 0.942,
            isAnomaly: true,
            severity: 'critical',
          };
        }
      });
      setDataPoints(updated);
      setAnomalyCount(3);
      updateState('alert');
    }, 1200);
  };

  const handleReset = () => {
    setDataPoints(generateNormalStream());
    setAnomalyCount(0);
    updateState('idle');
  };

  const isAlertState = componentState === 'alert';
  const isAnalyzing = componentState === 'analyzing';

  return (
    <div
      className={`rounded-2xl transition-all duration-500 border ${
        isAlertState
          ? 'bg-rose-950/20 border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/60'
          : isAnalyzing
          ? 'bg-slate-900/90 border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      } p-6`}
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl transition-colors ${
                isAlertState
                  ? 'bg-rose-500/20 text-rose-400'
                  : isAnalyzing
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-400">
                  WF06 • Sensor & Stream Guard
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                    isAlertState
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 animate-pulse'
                      : isAnalyzing
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {componentState.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Anomaly Pulse</h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic Mahalanobis distance & Isolation Forest streaming envelope detector.
          </p>
        </div>

        {/* State Badges & Heartbeat Indicator */}
        <div className="flex items-center gap-3">
          {isAnalyzing && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-mono transition-transform ${
                heartbeatBeat ? 'scale-105' : 'scale-100'
              }`}
            >
              <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>PULSE HEARTBEAT ACTIVE</span>
            </div>
          )}

          {isAlertState && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-mono animate-pulse">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{anomalyCount} ANOMALIES INTERCEPTED</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRunPulseAudit}
              disabled={isAnalyzing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Run Pulse Audit"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Audit</span>
            </button>
            <button
              onClick={handleInjectOutlierBurst}
              disabled={isAnalyzing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800 transition"
              title="Inject sudden spike anomaly burst"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Inject Burst</span>
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Reset stream"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="mt-5 space-y-4">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                Live Sensor Telemetry Waveform (3-Sigma Envelope)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Threshold:</span>
                <input
                  type="range"
                  min="60"
                  max="90"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-24 accent-amber-500 cursor-pointer"
                />
                <span className="text-slate-200 font-bold">{threshold}</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pulseGradientNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pulseGradientAlert" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[20, 115]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <ReferenceLine y={threshold} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'UPPER BOUND', fill: '#f43f5e', fontSize: 9 }} />
                <ReferenceLine y={30} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'LOWER BOUND', fill: '#3b82f6', fontSize: 9 }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isAlertState ? '#f43f5e' : isAnalyzing ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={2.5}
                  fill={isAlertState ? 'url(#pulseGradientAlert)' : 'url(#pulseGradientNormal)'}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isAnomaly || payload.value > threshold) {
                      return (
                        <circle
                          key={`dot-${payload.timestamp}`}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#f43f5e"
                          stroke="#ffffff"
                          strokeWidth={2}
                          className="animate-ping"
                        />
                      );
                    }
                    return null;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-500">Anomaly Rate</div>
            <div className={`text-base font-bold font-mono ${isAlertState ? 'text-rose-400' : 'text-slate-200'}`}>
              {isAlertState ? '12.0%' : '0.0%'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-500">Streaming Confidence</div>
            <div className="text-base font-bold font-mono text-emerald-400">99.4%</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-500">False Positive Guard</div>
            <div className="text-base font-bold font-mono text-cyan-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
