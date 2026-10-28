import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Clock, HelpCircle, Search, Filter } from 'lucide-react';
import {
  FEATURE_STATUS_REGISTRY,
  FeatureRecord,
  FeatureStatus,
  getFeatureStatusStats,
} from '../utils/featureStatusRegistry';

interface FeatureStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureStatusModal: React.FC<FeatureStatusModalProps> = ({ isOpen, onClose }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const stats = getFeatureStatusStats();

  const filteredFeatures = FEATURE_STATUS_REGISTRY.filter((f) => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.code.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.evidence.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case 'WORKING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            WORKING
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            PARTIAL
          </span>
        );
      case 'SIMULATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            SIMULATED
          </span>
        );
      case 'PLANNED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-purple-400" />
            PLANNED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase tracking-wider">
                FEATURE STATUS &amp; VERACITY REGISTRY
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Single Source of Truth • Non-Drifting Reality
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>OmniData In-App Capability &amp; Evidence Audit</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-950 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Tracked</span>
            <span className="text-xl font-bold text-white font-mono">{stats.total}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center">
            <span className="text-[10px] text-emerald-400 block uppercase font-mono">WORKING (Proven)</span>
            <span className="text-xl font-bold text-emerald-300 font-mono">{stats.working}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-center">
            <span className="text-[10px] text-amber-400 block uppercase font-mono">PARTIAL (In-Dev)</span>
            <span className="text-xl font-bold text-amber-300 font-mono">{stats.partial}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-center">
            <span className="text-[10px] text-cyan-400 block uppercase font-mono">SIMULATED (Synthetic)</span>
            <span className="text-xl font-bold text-cyan-300 font-mono">{stats.simulated}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-center">
            <span className="text-[10px] text-purple-400 block uppercase font-mono">PLANNED (Roadmap)</span>
            <span className="text-xl font-bold text-purple-300 font-mono">{stats.planned}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search feature code, title, formula, or evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            {(['all', 'WORKING', 'PARTIAL', 'SIMULATED', 'PLANNED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Feature List Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Feature Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Standard / Formula</th>
                  <th className="py-2.5 px-3">Evidence / Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {filteredFeatures.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {f.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white max-w-xs">
                      <div>{f.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal leading-relaxed mt-0.5">
                        {f.description}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{getStatusBadge(f.status)}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 uppercase">
                      {f.category}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-cyan-300 max-w-[200px] break-words">
                      {f.formulaOrStandard || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-slate-300 max-w-sm leading-relaxed">
                      {f.evidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 font-mono px-5">
          <span>Rule: Mark WORKING only if an automated test or executed pipeline run proves it.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
          >
            Close Registry
          </button>
        </div>
      </div>
    </div>
  );
};
