import React from 'react';
import { DatasetQualityReport } from './quality';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface QualityPillsProps {
  report: DatasetQualityReport;
  onInjectFault?: (type: 'nulls' | 'duplicates' | 'drift') => void;
  onClearFaults?: () => void;
}

export const QualityPills: React.FC<QualityPillsProps> = ({
  report,
  onInjectFault,
  onClearFaults,
}) => {
  const { nulls, duplicates, drift, overallPassed } = report;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-emerald-400">
              WF02 • Data Contracts
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                overallPassed
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}
            >
              {overallPassed ? 'ALL CONTRACTS PASSED' : 'FAULT DETECTED'}
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight mt-0.5">Quality Pills</h3>
        </div>

        {/* Fault Injection Actions */}
        {onInjectFault && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-500 mr-1">Inject Fault:</span>
            <button
              onClick={() => onInjectFault('nulls')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-rose-300 border border-slate-700 hover:border-rose-800 transition"
              title="Inject Missing / Null Values"
            >
              <Zap className="w-3 h-3 text-rose-400" />
              <span>+Nulls</span>
            </button>
            <button
              onClick={() => onInjectFault('duplicates')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 hover:border-amber-800 transition"
              title="Inject Duplicate Records"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>+Duplicates</span>
            </button>
            <button
              onClick={() => onInjectFault('drift')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-purple-300 border border-slate-700 hover:border-purple-800 transition"
              title="Inject Statistical Drift"
            >
              <Zap className="w-3 h-3 text-purple-400" />
              <span>+Drift</span>
            </button>
            {onClearFaults && (
              <button
                onClick={onClearFaults}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3 Quality Pills (Nulls, Duplicates, Drift) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Pill 1: Nulls */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            nulls.hasFault
              ? 'bg-rose-950/30 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : 'bg-emerald-950/20 border-emerald-600/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Nulls & Missing</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase transition ${
                nulls.hasFault
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-900'
                  : 'bg-emerald-500 text-white shadow-sm shadow-emerald-900'
              }`}
            >
              {nulls.hasFault ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              <span>{nulls.hasFault ? 'FAIL' : 'PASS'}</span>
            </span>
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-white">
            {nulls.count} <span className="text-xs font-normal text-slate-400">({nulls.pct}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{nulls.details}</p>
        </div>

        {/* Pill 2: Duplicates */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            duplicates.hasFault
              ? 'bg-rose-950/30 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : 'bg-emerald-950/20 border-emerald-600/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Duplicate Records</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase transition ${
                duplicates.hasFault
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-900'
                  : 'bg-emerald-500 text-white shadow-sm shadow-emerald-900'
              }`}
            >
              {duplicates.hasFault ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              <span>{duplicates.hasFault ? 'FAIL' : 'PASS'}</span>
            </span>
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-white">
            {duplicates.count} <span className="text-xs font-normal text-slate-400">({duplicates.pct}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{duplicates.details}</p>
        </div>

        {/* Pill 3: Drift */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            drift.hasFault
              ? 'bg-rose-950/30 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : 'bg-emerald-950/20 border-emerald-600/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Distribution Drift</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase transition ${
                drift.hasFault
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-900'
                  : 'bg-emerald-500 text-white shadow-sm shadow-emerald-900'
              }`}
            >
              {drift.hasFault ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              <span>{drift.hasFault ? 'FAIL' : 'PASS'}</span>
            </span>
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-white">
            {drift.hasFault ? 'SHIFT' : 'STABLE'} <span className="text-xs font-normal text-slate-400">({drift.pct}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{drift.details}</p>
        </div>
      </div>
    </div>
  );
};
