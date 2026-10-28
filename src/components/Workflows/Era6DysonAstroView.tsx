import React, { useState } from 'react';
import {
  Radio,
  Sun,
  Satellite,
  Telescope,
  Zap,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Flame,
  CheckCircle2,
  Clock,
  Compass,
} from 'lucide-react';
import {
  EXOPLANET_TARGETS,
  DysonSwarmConfig,
  DysonAstroSimulationResult,
  simulateDysonAstroGrid,
} from '../../utils/dysonAstroEngine';

export const Era6DysonAstroView: React.FC = () => {
  const [config, setConfig] = useState<DysonSwarmConfig>({
    collectorNodesCount: 24000,
    orbitalRadiusAU: 0.72,
    quantumHarvestEfficiency: 0.85,
    selectedTargetName: EXOPLANET_TARGETS[0].name,
    interferometerBaselineKm: 45000000,
  });

  const [simResult, setSimResult] = useState<DysonAstroSimulationResult>(() =>
    simulateDysonAstroGrid({
      collectorNodesCount: 24000,
      orbitalRadiusAU: 0.72,
      quantumHarvestEfficiency: 0.85,
      selectedTargetName: EXOPLANET_TARGETS[0].name,
      interferometerBaselineKm: 45000000,
    })
  );

  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleRunSimulation = (newConfig?: Partial<DysonSwarmConfig>) => {
    setIsSimulating(true);
    const updated = { ...config, ...(newConfig || {}) };
    setConfig(updated);
    setTimeout(() => {
      setSimResult(simulateDysonAstroGrid(updated));
      setIsSimulating(false);
    }, 180);
  };

  const selectedTarget =
    EXOPLANET_TARGETS.find((t) => t.name === config.selectedTargetName) || EXOPLANET_TARGETS[0];

  return (
    <div className="space-y-6">
      {/* HUD Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border border-cyan-800/60 p-6 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/80 uppercase tracking-widest flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                EPOCH HORIZON: 2080 — 2120 • ERA VI ENGINE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                Stellar System Energy Harvesting & Interstellar Biosurveillance
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Astro-Scale Dyson Sensor Grids & Astrobiological Streams</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Autonomous orbital Dyson swarm harvesting stellar photons at relativistic baselines, powering continuous deep-space spectroscopy across exoplanetary biospheres.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunSimulation()}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-cyan-950/40 transition cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Synchronizing Swarm...' : 'Recalculate Relativistic Grid'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mathematical Governing Equations Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Stellar Harvesting Formula (Carnot Limit)
            </span>
            <span className="text-[10px] font-mono text-slate-500">Thermodynamics</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/20 font-mono text-xs text-cyan-200 text-center select-all">
            P = (1 - T_sink / T_source) · [L_☉ / (4π R²)] · N_nodes · A_collector
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Stefan-Boltzmann flux attenuated by heliocentric radius R, converted via quantum graphene sails under deep-space thermal dissipation (3 Kelvin).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Photochemical Disequilibrium Metric (ΔG)
            </span>
            <span className="text-[10px] font-mono text-slate-500">Astrobiology</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/20 font-mono text-xs text-emerald-200 text-center select-all">
            ΔG = RT · [ x_CH4 · ln(x_CH4 / x_eq) + x_O2 · ln(x_O2 / x_eq) ]
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Quantifies departure from abiotic equilibrium: concurrent existence of reducing CH4 and oxidizing O2/O3 proves active biological metabolism.
          </p>
        </div>
      </div>

      {/* KPI HUD Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Power Harvested</span>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {simResult.totalPowerOutputExawatts} <span className="text-xs font-bold text-slate-400">EW</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block">
            {(simResult.totalPowerOutputWatts / 1e18).toFixed(3)} × 10¹⁸ Watts
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Solar Flux @ Radius</span>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
            {simResult.solarFluxWm2} <span className="text-xs font-bold text-slate-400">W/m²</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block">
            Radius: {config.orbitalRadiusAU} AU from Sun
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Chemical Disequilibrium ΔG</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {simResult.targetAnalysis.photochemicalDisequilibriumDeltaG} <span className="text-xs font-bold text-slate-400">kJ/mol</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold block">
            Target: {config.selectedTargetName.split(' ')[0]}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Biosignature Confidence</span>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
            {simResult.targetAnalysis.biosignatureScorePercent}%
          </div>
          <span className="text-[10px] font-mono text-purple-400 font-bold block">
            SNR: {simResult.targetAnalysis.spectroscopicSNR} : 1
          </span>
        </div>
      </div>

      {/* Main Workspace: Controls + Exoplanet Target Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Swarm Parameter Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Dyson Swarm Orbital Parameters</h3>
          </div>

          {/* Slider 1: Collector Nodes Count */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Collector Nodes:</span>
              <span className="text-cyan-300 font-bold">{config.collectorNodesCount.toLocaleString()} sails</span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={config.collectorNodesCount}
              onChange={(e) => handleRunSimulation({ collectorNodesCount: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1,000 nodes</span>
              <span>100,000 nodes (Full Swarm)</span>
            </div>
          </div>

          {/* Slider 2: Orbital Radius AU */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Heliocentric Radius (AU):</span>
              <span className="text-amber-300 font-bold">{config.orbitalRadiusAU} AU</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="1.50"
              step="0.02"
              value={config.orbitalRadiusAU}
              onChange={(e) => handleRunSimulation({ orbitalRadiusAU: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.30 AU (Mercury Orbit)</span>
              <span>1.50 AU (Mars Orbit)</span>
            </div>
          </div>

          {/* Slider 3: Quantum Harvest Efficiency */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Quantum Conversion Efficiency:</span>
              <span className="text-emerald-300 font-bold">{(config.quantumHarvestEfficiency * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.40"
              max="0.95"
              step="0.01"
              value={config.quantumHarvestEfficiency}
              onChange={(e) => handleRunSimulation({ quantumHarvestEfficiency: Number(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>40% (Classical Photovoltaic)</span>
              <span>95% (Exascale Superconducting)</span>
            </div>
          </div>

          {/* Slider 4: Interferometer Baseline */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Interferometer Baseline:</span>
              <span className="text-purple-300 font-bold">{(config.interferometerBaselineKm / 1e6).toFixed(1)}M km</span>
            </div>
            <input
              type="range"
              min="1000000"
              max="150000000"
              step="1000000"
              value={config.interferometerBaselineKm}
              onChange={(e) => handleRunSimulation({ interferometerBaselineKm: Number(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1M km (Lunar scale)</span>
              <span>150M km (1 AU Baseline)</span>
            </div>
          </div>

          {/* Relativistic Time Dilation Metric */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Relativistic Metric Dilation:</span>
              <span className="text-cyan-300 font-bold">{simResult.relativisticDelayMicrosec} μs</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Quantum Swarm Coherence:</span>
              <span className="text-emerald-300 font-bold">{(simResult.quantumArrayCoherenceMetric * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Right: Astrobiological Biosurveillance Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  Interstellar Astrobiological Spectroscopy
                </span>
                <h3 className="text-base font-bold text-white">Target Exoplanet Biosignature Matrix</h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800 text-xs font-mono font-bold">
                Synthesized 50,000 Catalog Feed
              </span>
            </div>

            {/* Target Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EXOPLANET_TARGETS.map((t) => {
                const isSelected = t.name === config.selectedTargetName;
                return (
                  <button
                    key={t.name}
                    onClick={() => handleRunSimulation({ selectedTargetName: t.name })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-400 shadow-lg shadow-cyan-950/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{t.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400">{t.distanceLightYears} ly</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{t.starType}</span>
                      <span className="text-emerald-400 font-bold">{t.biosignatureProbability}% Prob</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Target Deep Atmospheric Composition */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Telescope className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">{selectedTarget.name} Atmospheric Spectrum</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Equilibrium Temp: <strong className="text-slate-200">{selectedTarget.equilibriumTempK} K</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Methane (CH₄)</span>
                  <span className="text-cyan-300 font-bold text-xs">{selectedTarget.spectralFeatures.ch4Ppm} ppm</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Oxygen (O₂)</span>
                  <span className="text-emerald-300 font-bold text-xs">{selectedTarget.spectralFeatures.o2Percent}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Carbon Dioxide (CO₂)</span>
                  <span className="text-slate-300 font-bold text-xs">{selectedTarget.spectralFeatures.co2Ppm} ppm</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Ozone Absorption Index</span>
                  <span className="text-purple-300 font-bold text-xs">{selectedTarget.spectralFeatures.ozoneAbsorptionIndex}</span>
                </div>
              </div>
            </div>

            {/* Biosurveillance Assessment Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                simResult.targetAnalysis.biosignatureScorePercent >= 90
                  ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                  : 'bg-indigo-950/40 border-indigo-700/80 text-indigo-200'
              }`}
            >
              <Activity className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold uppercase font-mono tracking-wider block">
                  Automated Biosurveillance Verdict:
                </span>
                <p className="leading-relaxed font-sans">{simResult.targetAnalysis.atmosphericAssessment}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Relativistic Telemetry Stream Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Live Dyson Swarm Orbital Node Telemetry Stream</h3>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            {config.collectorNodesCount.toLocaleString()} Active Nodes in Orbital Synchronization
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2 px-3">Node Identifier</th>
                <th className="py-2 px-3">Orbital Anomaly</th>
                <th className="py-2 px-3">Power (Petawatts)</th>
                <th className="py-2 px-3">Qubit Coherence</th>
                <th className="py-2 px-3">One-Way Delay</th>
                <th className="py-2 px-3 text-right">Cluster Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {simResult.telemetryStream.map((packet) => (
                <tr key={packet.nodeId} className="hover:bg-slate-850/50">
                  <td className="py-2.5 px-3 font-bold text-white">{packet.nodeId}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{packet.orbitAnomalyDeg}°</td>
                  <td className="py-2.5 px-3 text-amber-300 font-bold">{packet.powerOutputExawatts} PW</td>
                  <td className="py-2.5 px-3 text-emerald-400">{packet.quantumQubitCoherenceSec} s</td>
                  <td className="py-2.5 px-3 text-slate-400">{packet.telemetryDelaySec} s</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        packet.status === 'nominal'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {packet.status.replace('_', ' ')}
                    </span>
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
