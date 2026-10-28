import React, { useState } from 'react';
import {
  Orbit,
  Network,
  Sparkles,
  Sliders,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Download,
  Code2,
  Terminal,
  Activity,
  Flame,
  Radio,
  FileCode,
  Check,
  Send,
  Loader2,
  Cpu,
  Compass,
  Atom,
  TestTube,
  Globe,
  Database,
  Dna,
  Play,
  RotateCcw,
  Infinity,
  Zap,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Dataset, CausalModel } from '../../types';
import { inferCausalModel } from '../../utils/causalDiscovery';
import {
  projectCausalModelAcrossEras,
  EpochHorizonProjectionResult,
  EpochCausalProjection,
} from '../../utils/epochHorizonEngine';
import { EXOPLANET_TARGETS } from '../../utils/dysonAstroEngine';
import { EpochHorizon3DCanvas } from './EpochHorizon3DCanvas';

interface WF13Props {
  dataset: Dataset;
  onGoToPipeline: () => void;
  onGoToExport: () => void;
}

export const WF13EpochHorizon: React.FC<WF13Props> = ({
  dataset,
  onGoToPipeline,
  onGoToExport,
}) => {
  // 1. Causal Model State
  const [causalModel] = useState<CausalModel>(() => inferCausalModel(dataset));
  const treatmentNode = causalModel.nodes.find((n) => n.type === 'treatment') || causalModel.nodes[0];
  const [intervenedVal, setIntervenedVal] = useState<number>(treatmentNode.baselineMean);
  const [selectedExoplanet, setSelectedExoplanet] = useState<string>(EXOPLANET_TARGETS[0].name);
  const [activeEraIndex, setActiveEraIndex] = useState<number>(1);
  const [isPipelineIntegrated, setIsPipelineIntegrated] = useState<boolean>(true);

  // 2. Computed Projection Result
  const projectionResult: EpochHorizonProjectionResult = projectCausalModelAcrossEras(
    causalModel,
    intervenedVal,
    selectedExoplanet
  );

  const activeProjection: EpochCausalProjection =
    projectionResult.projections[activeEraIndex - 1] || projectionResult.projections[0];

  return (
    <div className="space-y-6">
      {/* HUD Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border border-indigo-800/60 p-6 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/80 uppercase tracking-widest flex items-center gap-1.5">
                <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                WF13 • EPOCH HORIZON ANALYSIS ENGINE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                2026 — 2200+ Causal Projections & Telemetry Pipeline
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Causal World Model Projection Across 7 Scientific Eras</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Projects structural causal interventions $P(Y \mid do(X = x))$ through the evolution of science: from AlphaFold molecular kinetics to self-driving robotic labs, quantum exact VQE eigensolvers, Era VI orbital Dyson sensor grids, and Era VII holographic Noosphere computing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onGoToPipeline}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-950/40 transition cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Pipeline DAG (WF10)</span>
            </button>

            <button
              onClick={onGoToExport}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 rounded-xl transition shadow-lg shadow-cyan-950/20 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Certified Report (WF09)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3D WebGL Three.js Interactive Scene */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Three.js 3D Celestial Manifold & Spacetime Orbit</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Damped 60fps Loop • Drag to Orbit • Scroll to Zoom
          </span>
        </div>

        <EpochHorizon3DCanvas
          activeEraIndex={activeEraIndex}
          onSelectEra={setActiveEraIndex}
          causalEfficacy={activeProjection.causalEfficacyGainPercent}
        />
      </div>

      {/* Main Causal Intervention Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interventional Do-Calculus Control */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Interventional do(X) Control</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
              Treatment Node
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Selected Target:</span>
              <span className="text-sm font-bold text-white font-mono">{treatmentNode.name}</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-500">Min: {treatmentNode.min}</span>
                <span className="text-cyan-300 font-bold">Intervened: {intervenedVal}</span>
                <span className="text-slate-500">Max: {treatmentNode.max}</span>
              </div>
              <input
                type="range"
                min={treatmentNode.min}
                max={treatmentNode.max}
                step={(treatmentNode.max - treatmentNode.min) / 50 || 1}
                value={intervenedVal}
                onChange={(e) => setIntervenedVal(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Natural mean: {treatmentNode.baselineMean}</span>
                <button
                  onClick={() => setIntervenedVal(treatmentNode.baselineMean)}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Reset Baseline
                </button>
              </div>
            </div>

            {/* Target Exoplanet for Era VI Stream */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-mono text-slate-400 block">
                Era VI Biosurveillance Target Exoplanet:
              </label>
              <select
                value={selectedExoplanet}
                onChange={(e) => setSelectedExoplanet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {EXOPLANET_TARGETS.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.distanceLightYears} ly)
                  </option>
                ))}
              </select>
            </div>

            {/* Natural Baseline Comparison */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Target Outcome (Y):</span>
                <span className="text-white font-bold">{projectionResult.outcomeNodeName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Natural Baseline Outcome:</span>
                <span className="text-slate-200">{projectionResult.baselineOutcome}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Causal Model ATE:</span>
                <span className="text-emerald-400 font-bold">{causalModel.ate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Active Era Deep Projection Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  Epoch Horizon Projection • {activeProjection.years}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{activeProjection.eraName}</h3>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 self-start sm:self-auto">
                {activeProjection.status.toUpperCase()}
              </span>
            </div>

            {/* Projected Outcome Key Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Projected Outcome Y</span>
                <span className="text-white font-black text-xl">{activeProjection.projectedOutcomeValue}</span>
                <span
                  className={`block text-[11px] font-bold ${
                    activeProjection.deltaPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeProjection.deltaPercent >= 0 ? '+' : ''}{activeProjection.deltaPercent}%
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Confidence Bounds</span>
                <span className="text-cyan-300 font-bold text-sm block">
                  [{activeProjection.confidenceInterval[0]}, {activeProjection.confidenceInterval[1]}]
                </span>
                <span className="text-slate-500 text-[10px]">Bayesian 95% Interval</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Causal Efficacy Gain</span>
                <span className="text-emerald-300 font-black text-xl">
                  +{activeProjection.causalEfficacyGainPercent}%
                </span>
                <span className="text-slate-500 text-[10px]">Over Classical Trial</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Epistemic Uncertainty</span>
                <span className="text-purple-300 font-bold text-xl">{activeProjection.epistemicUncertaintyBits}</span>
                <span className="text-slate-500 text-[10px]">Shannon Entropy Bits</span>
              </div>
            </div>

            {/* Governing Formula in this Era */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/20 font-mono text-xs space-y-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase block">
                Governing Equation & Proof Constraint:
              </span>
              <div className="text-cyan-200 font-bold select-all">{activeProjection.governingFormula}</div>
            </div>

            {/* Bioscience / Physical Mechanism */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                Bioscience & Molecular Mechanics Context:
              </span>
              <p className="text-slate-300 leading-relaxed font-sans">
                {activeProjection.molecularOrBioscienceContext}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Epoch Timeline Trajectory Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Full 7-Epoch Causal Trajectory Grid</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Click any era to inspect & rotate 3D canvas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
          {projectionResult.projections.map((p) => {
            const isSelected = p.eraIndex === activeEraIndex;
            return (
              <button
                key={p.eraIndex}
                onClick={() => setActiveEraIndex(p.eraIndex)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold block">{p.years}</span>
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-1 mt-0.5">{p.eraName.split(':')[1]}</h4>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-850 font-mono text-xs flex justify-between items-baseline">
                  <span className="text-white font-bold">{p.projectedOutcomeValue}</span>
                  <span className="text-emerald-400 text-[10px] font-bold">+{p.causalEfficacyGainPercent}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-Time Era VI & VII Integrated Telemetry Streams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Era VI: Dyson Astrobiological Telemetry Stream */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-800/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Era VI: Dyson Astrobiological Stream</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Pipeline Node Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Stellar Power</span>
              <span className="text-amber-300 font-bold text-lg">
                {projectionResult.dysonStreamIntegration.solarHarvestPowerExawatts} Exawatts
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Disequilibrium ΔG</span>
              <span className="text-emerald-400 font-bold text-lg">
                {projectionResult.dysonStreamIntegration.photochemicalDisequilibriumDeltaG} kJ/mol
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Target Exoplanet</span>
              <span className="text-white font-bold text-xs truncate block">
                {projectionResult.dysonStreamIntegration.targetExoplanet}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Biomarker Confidence</span>
              <span className="text-purple-300 font-bold text-lg">
                {projectionResult.dysonStreamIntegration.biosignatureScorePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Era VII: Spacetime Holographic Geometrodynamics Stream */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-purple-800/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Infinity className="w-4 h-4 text-purple-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Era VII: Spacetime Holographic Stream</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
              Pipeline Node Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Noosphere Info (Φ)</span>
              <span className="text-purple-300 font-bold text-lg">
                {projectionResult.noosphereStreamIntegration.integratedInformationPhi} bits
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Kuramoto Phase Sync</span>
              <span className="text-emerald-400 font-bold text-lg">
                r = {projectionResult.noosphereStreamIntegration.kuramotoPhaseSyncOrder}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">AdS Holographic Entropy</span>
              <span className="text-cyan-300 font-bold text-lg">
                {projectionResult.noosphereStreamIntegration.holographicEntropyPlanck} S_Pl
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Inflationary Fidelity</span>
              <span className="text-amber-300 font-bold text-lg">
                {projectionResult.noosphereStreamIntegration.primordialInflationFidelity}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
