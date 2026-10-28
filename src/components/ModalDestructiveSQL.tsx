import React from 'react';
import { AlertOctagon, ShieldAlert, X } from 'lucide-react';

interface ModalDestructiveSQLProps {
  isOpen: boolean;
  commandName: string;
  query: string;
  onAuthorize: () => void;
  onCancel: () => void;
}

export const ModalDestructiveSQL: React.FC<ModalDestructiveSQLProps> = ({
  isOpen,
  commandName,
  query,
  onAuthorize,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-rose-800/80 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-rose-900/50 flex items-center justify-between bg-rose-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-900/60 text-rose-300 border border-rose-700">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-200">Destructive SQL Interceptor</h3>
              <p className="text-xs text-rose-300/80">Non-negotiable rule: approval required</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg text-xs text-rose-200 leading-relaxed">
            The SQL command you submitted contains a potentially destructive keyword:
            <strong className="text-rose-400 font-mono ml-1 px-1 py-0.5 bg-rose-950 rounded border border-rose-800">
              {commandName}
            </strong>
            . In accordance with safety policies, running destructive SQL statements against tables requires explicit authorization.
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-32 overflow-y-auto">
            {query}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-850 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg"
          >
            Abort Execution
          </button>
          <button
            onClick={onAuthorize}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-600/30"
          >
            Explicitly Authorize & Execute
          </button>
        </div>
      </div>
    </div>
  );
};
