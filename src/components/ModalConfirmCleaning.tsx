import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { CleaningImpactPreview } from '../utils/cleaner';

interface ModalConfirmCleaningProps {
  isOpen: boolean;
  preview: CleaningImpactPreview | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ModalConfirmCleaning: React.FC<ModalConfirmCleaningProps> = ({
  isOpen,
  preview,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !preview) return null;

  const isHighImpact = preview.rowsAffected > 0 || preview.action.includes('drop');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-750 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isHighImpact ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-indigo-950 text-indigo-400'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Non-Negotiable Rule: Pre-Execution Impact Review</h3>
              <p className="text-xs text-slate-400">Never silently apply high-impact data transformations</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            {preview.details}
          </div>

          {/* Metrics Diff */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-750">
              <span className="text-[11px] text-slate-400 block">Rows Before</span>
              <span className="text-base font-bold text-slate-200 font-mono">{preview.rowsBefore}</span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-750">
              <span className="text-[11px] text-slate-400 block">Rows Affected</span>
              <span className={`text-base font-bold font-mono ${preview.rowsAffected > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                {preview.rowsAffected}
              </span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-750">
              <span className="text-[11px] text-slate-400 block">Rows After</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{preview.rowsAfter}</span>
            </div>
          </div>

          {/* Immutability guarantee callout */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold block">Source Data Integrity Protected</span>
              <p className="text-[11px] text-emerald-300/80">
                Your original raw dataset will remain completely immutable. This will produce a new versioned snapshot with an audit log entry.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-850 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30"
          >
            <span>Approve & Apply Version</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
