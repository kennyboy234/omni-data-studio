import React, { useState } from 'react';
import {
  Sigma,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  Calculator,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { FutureEraMilestone, EraFormula } from '../../types';

interface EraFormulaExplorerProps {
  era: FutureEraMilestone;
  onLaunchLab?: (subTabId: string) => void;
}

export const EraFormulaExplorer: React.FC<EraFormulaExplorerProps> = ({
  era,
  onLaunchLab,
}) => {
  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState<number>(0);

  if (!era.formulae || era.formulae.length === 0) {
    return null;
  }

  const activeFormula = era.formulae[selectedFormulaIndex] || era.formulae[0];

  // Map era to corresponding dedicated interactive lab subTab
  const getSubTabForEra = (eraYears: string): { tabId: string; label: string } | null => {
    if (eraYears.includes('2026')) return { tabId: 'causal_counterfactual', label: 'Era I: Causal do(X) Engine' };
    if (eraYears.includes('2031')) return { tabId: 'symbolic_lean4', label: 'Era II: Lean 4 Proof Verifier' };
    if (eraYears.includes('2036')) return { tabId: 'robotic_lab', label: 'Era III: Robotic Wet-Lab' };
    if (eraYears.includes('2041')) return { tabId: 'quantum_vqe', label: 'Era IV: Quantum VQE QPU' };
    if (eraYears.includes('2046')) return { tabId: 'nanobot_bio', label: 'Era V: DNA Nanobot Compiler' };
    if (eraYears.includes('2080')) return { tabId: 'era6_dyson_astro', label: 'Era VI: Astro-Scale Dyson Grids' };
    if (eraYears.includes('2120')) return { tabId: 'era7_spacetime_noosphere', label: 'Era VII: Spacetime & Noosphere' };
    return null;
  };

  const targetLab = getSubTabForEra(era.years);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sigma className="w-3 h-3 text-cyan-400" />
              MATHEMATICAL FORMULAE & GOVERNING LAWS
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">{era.years}</span>
          </div>
          <h3 className="text-base font-bold text-white">Governing Mathematical Equations & Physics Models</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Theoretical derivations and mathematical laws implemented in the computational core.
          </p>
        </div>

        {targetLab && onLaunchLab && (
          <button
            onClick={() => onLaunchLab(targetLab.tabId)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>Launch Live {targetLab.label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Formula Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {era.formulae.map((f, idx) => {
          const isSelected = idx === selectedFormulaIndex;
          return (
            <button
              key={f.name}
              onClick={() => setSelectedFormulaIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-md shadow-cyan-950/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>{f.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Formula Deep Dive Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-850 pb-3">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
              Formula {selectedFormulaIndex + 1} of {era.formulae.length}
            </span>
            <h4 className="text-sm font-bold text-white mt-0.5">{activeFormula.name}</h4>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            Validated in OmniData Engine
          </span>
        </div>

        {/* LaTeX Math Box */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-500/30 text-center shadow-inner overflow-x-auto">
          <div className="font-mono text-base sm:text-lg font-bold text-cyan-200 tracking-wide select-all py-1">
            {activeFormula.latex}
          </div>
        </div>

        {/* Description & Significance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Mathematical Formulation:
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              {activeFormula.description}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/60 space-y-1.5">
            <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Physical & Analytical Significance:
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              {activeFormula.physicalSignificance}
            </p>
          </div>
        </div>

        {/* Variables Table */}
        <div className="space-y-2 pt-2 border-t border-slate-850">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
            Variables & Parameter Index:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeFormula.variables.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 text-[10px]">
                    {v.symbol}
                  </span>
                  <span className="text-slate-200">{v.label}</span>
                </div>
                <span className="text-slate-500 text-[10px]">{v.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
