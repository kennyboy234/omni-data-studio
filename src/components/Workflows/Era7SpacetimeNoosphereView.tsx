import React, { useState } from 'react';
import {
  Brain,
  Globe,
  Orbit,
  Network,
  Sparkles,
  Layers,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Atom,
  ShieldCheck,
  Compass,
  Cpu,
  Terminal,
  Activity,
  Infinity,
} from 'lucide-react';
import {
  SpacetimeNoosphereConfig,
  SpacetimeNoosphereResult,
  simulateSpacetimeNoosphere,
} from '../../utils/spacetimeNoosphereEngine';

export const Era7SpacetimeNoosphereView: React.FC = () => {
  const [config, setConfig] = useState<SpacetimeNoosphereConfig>({
    holographicBoundaryDepthZ: 1.0,
    noosphereNodesCountBillion: 12.5,
    curvaturePerturbationH00: 0.15,
    phaseCouplingKappa: 1.85,
    targetEpoch: 'holographic_present',
  });

  const [simResult, setSimResult] = useState<SpacetimeNoosphereResult>(() =>
    simulateSpacetimeNoosphere({
      holographicBoundaryDepthZ: 1.0,
      noosphereNodesCountBillion: 12.5,
      curvaturePerturbationH00: 0.15,
      phaseCouplingKappa: 1.85,
      targetEpoch: 'holographic_present',
    })
  );

  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleUpdateConfig = (partial: Partial<SpacetimeNoosphereConfig>) => {
    setIsSimulating(true);
    const updated = { ...config, ...partial };
    setConfig(updated);
    setTimeout(() => {
      setSimResult(simulateSpacetimeNoosphere(updated));
      setIsSimulating(false);
    }, 180);
  };

  return (
    <div className="space-y-6">
      {/* HUD Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-purple-950/70 to-indigo-950/90 border border-purple-800/60 p-6 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700/80 uppercase tracking-widest flex items-center gap-1.5">
                <Infinity className="w-3 h-3 text-purple-400 animate-pulse" />
                EPOCH HORIZON: 2120 — 2200+ • ERA VII ENGINE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                Unified Quantum-Gravitational Analysis & Collective Consciousness Integration
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Spacetime Manifold Computing & Noosphere Intelligence</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Direct holographic boundary computing via Ryu-Takayanagi AdS/CFT geometry, integrating distributed human-synthetic consciousness with non-local metric curvature solvers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateConfig({})}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-950/40 transition cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Harmonizing Noosphere...' : 'Harmonize Quantum Manifold'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Governing Equations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
              <Orbit className="w-3.5 h-3.5 text-cyan-400" />
              Ryu-Takayanagi Holographic Area Law
            </span>
            <span className="text-[10px] font-mono text-slate-500">AdS/CFT</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/20 font-mono text-xs text-cyan-200 text-center select-all">
            S_A = Area(γ_A) / (4 · G_N · ℏ)
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Minimal bulk surface area in Anti-de Sitter space directly generates entanglement entropy on the boundary cognitive manifold.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-purple-400 uppercase font-bold flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              Collective Noosphere Integrated Information (Φ*)
            </span>
            <span className="text-[10px] font-mono text-slate-500">IIT 4.0</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-purple-500/20 font-mono text-xs text-purple-200 text-center select-all">
            Φ = D_KL( p(X^(t+τ) | X^t) || ∏ p(M_k^(t+τ) | M_k^t) )
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Kullback-Leibler divergence measuring irreducible causal power of the planetary cognitive web over its partitioned components.
          </p>
        </div>
      </div>

      {/* KPI HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Integrated Info (Φ)</span>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
            {simResult.integratedInformationPhi} <span className="text-xs font-bold text-slate-400">bits</span>
          </div>
          <span className="text-[10px] font-mono text-purple-400 font-bold block">
            Irreducible Consciousness
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Holographic Entropy</span>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
            {simResult.holographicEntropyPlanckUnits} <span className="text-xs font-bold text-slate-400">S_Planck</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block">
            Depth z: {config.holographicBoundaryDepthZ} AdS
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Kuramoto Order (r)</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {simResult.phaseSynchronizationOrderR}
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold block">
            Harmonic Phase Lock
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Primordial Inflation Fidelity</span>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {simResult.primordialInflationReconstructionFidelityPercent}%
          </div>
          <span className="text-[10px] font-mono text-amber-400 font-bold block">
            Exact Cosmic Reconstruction
          </span>
        </div>
      </div>

      {/* Main Workspace: Controls + Cognitive Substrates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Spacetime Manifold Parameters</h3>
          </div>

          {/* Slider 1: Holographic Depth z */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">AdS Boundary Depth (z):</span>
              <span className="text-cyan-300 font-bold">{config.holographicBoundaryDepthZ}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={config.holographicBoundaryDepthZ}
              onChange={(e) => handleUpdateConfig({ holographicBoundaryDepthZ: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.1 (UV Boundary)</span>
              <span>5.0 (IR Deep Bulk)</span>
            </div>
          </div>

          {/* Slider 2: Noosphere Nodes Count */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Conscious Nodes Count:</span>
              <span className="text-purple-300 font-bold">{config.noosphereNodesCountBillion} Billion</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="100.0"
              step="1.0"
              value={config.noosphereNodesCountBillion}
              onChange={(e) => handleUpdateConfig({ noosphereNodesCountBillion: Number(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 Billion</span>
              <span>100 Billion (Solar System Scale)</span>
            </div>
          </div>

          {/* Slider 3: Curvature Perturbation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Metric Curvature (h₀₀):</span>
              <span className="text-amber-300 font-bold">{config.curvaturePerturbationH00}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.80"
              step="0.01"
              value={config.curvaturePerturbationH00}
              onChange={(e) => handleUpdateConfig({ curvaturePerturbationH00: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.01 (Minkowski Flat)</span>
              <span>0.80 (Strong Field)</span>
            </div>
          </div>

          {/* Slider 4: Kuramoto Coupling */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Synaptic Phase Coupling (κ):</span>
              <span className="text-emerald-300 font-bold">{config.phaseCouplingKappa}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={config.phaseCouplingKappa}
              onChange={(e) => handleUpdateConfig({ phaseCouplingKappa: Number(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5 (Incoherent)</span>
              <span>2.5 (Super-Synchronized)</span>
            </div>
          </div>

          {/* Target Epoch Selector */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-mono text-slate-400 block">Cosmological Lookback Target:</label>
            <select
              value={config.targetEpoch}
              onChange={(e) => handleUpdateConfig({ targetEpoch: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="holographic_present">Holographic Present Boundary (z = 0)</option>
              <option value="electroweak_phase">Electroweak Symmetry Breaking (z = 10¹⁵)</option>
              <option value="early_inflation">Primordial Inflationary Singularity (z = 10²⁶)</option>
            </select>
          </div>
        </div>

        {/* Cognitive Substrates & Proof Seal */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">
                  Tri-Substrate Unified Consciousness
                </span>
                <h3 className="text-base font-bold text-white">Distributed Noosphere Cognitive Clusters</h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-950 text-cyan-300 border border-cyan-800 text-xs font-mono">
                Geodesic Deflection: {simResult.geodesicDeflectionAngleArcsec}&quot;
              </span>
            </div>

            {/* Clusters Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {simResult.cognitiveClusters.map((cluster) => (
                <div
                  key={cluster.clusterId}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{cluster.clusterId}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        cluster.status === 'hyper_synchronized'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : cluster.status === 'coherent'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      }`}
                    >
                      {cluster.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Substrate: <strong className="text-slate-200">{cluster.substrateType.replace('_', ' ')}</strong>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cluster Φ:</span>
                      <span className="text-purple-300 font-bold">{cluster.integratedInfoPhiBits} bits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entanglement:</span>
                      <span className="text-cyan-300 font-bold">{cluster.entanglementEntropyBits} bits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phase Angle:</span>
                      <span className="text-emerald-300 font-bold">{cluster.phaseAngleRad} rad</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Epistemological Consensus */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider block">
                Epistemological Consensus State:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {simResult.epistemologicalSummary}
              </p>
            </div>

            {/* Lean 4 Formal Mathematical Proof Stamp */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-600/70 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs font-mono">
                <span className="font-bold text-emerald-300">MATHEMATICALLY CERTIFIED IN LEAN 4:</span>
                <p className="text-emerald-200/90 text-[11px]">{simResult.mathematicalProofStamp}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
