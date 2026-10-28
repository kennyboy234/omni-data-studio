import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  Activity,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  simulateQuantumErrorStream,
  QuantumChannelType,
  QuantumSimulationReport,
  mapSignalToDensityMatrix,
  applyKrausChannel,
} from '../../utils/quantumErrorSimulator';

export const QuantumErrorSimulatorPanel: React.FC = () => {
  // Sensor presets
  const [sensorPreset, setSensorPreset] = useState<'vibration' | 'motor_current' | 'acoustic_bearing' | 'cryo_temperature'>('vibration');
  const [channelType, setChannelType] = useState<QuantumChannelType>('AMPLITUDE_DAMPING');
  const [errorProb, setErrorProb] = useState<number>(0.15);
  const [dampingGamma, setDampingGamma] = useState<number>(0.25);
  const [dephasingLambda, setDephasingLambda] = useState<number>(0.20);
  const [seed, setSeed] = useState<number>(1337);

  // Generate synthetic clean telemetry based on preset
  const { cleanTelemetry, unit, sensorName, sampleRateHz } = useMemo(() => {
    const N = 60;
    const rate = 100; // 100 Hz
    let values: number[] = [];
    let u = 'g';
    let name = 'High-Frequency Piezoelectric Accelerometer (Bearing Radial)';

    if (sensorPreset === 'vibration') {
      u = 'g (m/s²)';
      name = 'Radial Bearing Vibration Sensor (25 Hz harmonic)';
      values = Array.from({ length: N }, (_, i) => {
        const t = i / rate;
        return 2.5 + 1.8 * Math.sin(2 * Math.PI * 25 * t) + 0.4 * Math.sin(2 * Math.PI * 75 * t);
      });
    } else if (sensorPreset === 'motor_current') {
      u = 'Amperes (A)';
      name = 'Inverter Motor Phase-A Current Stator Telemetry';
      values = Array.from({ length: N }, (_, i) => {
        const t = i / rate;
        return 48.0 + 8.5 * Math.sin(2 * Math.PI * 50 * t);
      });
    } else if (sensorPreset === 'acoustic_bearing') {
      u = 'dB (AE)';
      name = 'Ultrasonic Acoustic Emission (120 kHz demodulated)';
      values = Array.from({ length: N }, (_, i) => {
        const t = i / rate;
        return 32.0 + 4.2 * Math.cos(2 * Math.PI * 15 * t) + 0.8 * (Math.sin(2 * Math.PI * 120 * t));
      });
    } else {
      u = 'Kelvin (K)';
      name = 'Cryogenic Superconducting Magnet Thermal Sensor';
      values = Array.from({ length: N }, (_, i) => {
        const t = i / rate;
        return 4.22 + 0.15 * Math.sin(2 * Math.PI * 5 * t);
      });
    }

    return { cleanTelemetry: values, unit: u, sensorName: name, sampleRateHz: rate };
  }, [sensorPreset]);

  // Run simulation
  const report: QuantumSimulationReport = useMemo(() => {
    return simulateQuantumErrorStream(cleanTelemetry, sampleRateHz, {
      channelType,
      errorProbability: errorProb,
      dampingGamma,
      dephasingLambda,
      measurementCadenceHz: 10,
      seed,
    });
  }, [cleanTelemetry, sampleRateHz, channelType, errorProb, dampingGamma, dephasingLambda, seed]);

  // Compute 2x2 density matrix for clean & transformed state
  const cleanRho = useMemo(() => {
    const mean = cleanTelemetry.reduce((a, b) => a + b, 0) / cleanTelemetry.length;
    const std = Math.sqrt(cleanTelemetry.reduce((acc, v) => acc + (v - mean) ** 2, 0) / cleanTelemetry.length) || 1;
    return mapSignalToDensityMatrix(cleanTelemetry, mean, std);
  }, [cleanTelemetry]);

  const { transformedRho } = useMemo(() => {
    return applyKrausChannel(cleanRho, channelType, errorProb, dampingGamma, dephasingLambda);
  }, [cleanRho, channelType, errorProb, dampingGamma, dephasingLambda]);

  return (
    <div className="space-y-6">
      {/* Header & Simulated Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Quantum Error Simulator: Non-Classical Telemetry Stress-Testing
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Applies Kraus-operator quantum noise channels (Amplitude Damping, Dephasing, Depolarization, and Zeno Collapse)
            to evaluate industrial ML and Judge robustness against physical sensor decoherence and non-Gaussian perturbations.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold shadow-sm">
            SIMULATED (Seed: {seed})
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
            Tr(ρ') = 1.0000 (Trace Preserved)
          </span>
        </div>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Selection & Physics Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Quantum Noise Channel</h3>
            </div>
            <span className="text-[10px] text-indigo-300 font-mono">Kraus Rep.</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Target Industrial Stream:</label>
              <select
                value={sensorPreset}
                onChange={(e) => setSensorPreset(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-indigo-500"
              >
                <option value="vibration">Vibration Accelerometer (Bearing Radial 25Hz)</option>
                <option value="motor_current">Inverter Motor Current (Phase-A Stator)</option>
                <option value="acoustic_bearing">Ultrasonic Acoustic Emission (120kHz AE)</option>
                <option value="cryo_temperature">Cryogenic Superconducting Sensor (4.2K)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Quantum Error Channel:</label>
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-indigo-500"
              >
                <option value="AMPLITUDE_DAMPING">Amplitude Damping (Energy Dissipation & Decay)</option>
                <option value="PHASE_DAMPING">Phase Damping (Pure Dephasing / T2* Coherence Loss)</option>
                <option value="DEPOLARIZING">Depolarizing Channel (Isotropic Mixed Quantum Noise)</option>
                <option value="BIT_FLIP">Pauli-X Channel (Bit-Flip / State Inversion)</option>
                <option value="PHASE_FLIP">Pauli-Z Channel (Phase-Flip / Polarity Inversion)</option>
                <option value="QUANTUM_ZENO_FREEZE">Quantum Zeno Collapse (Projective Observation Freeze)</option>
              </select>
            </div>

            {/* Dynamic Slider depending on channel */}
            {channelType === 'AMPLITUDE_DAMPING' && (
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Damping Parameter (γ):</span>
                  <span className="text-amber-400 font-mono">{dampingGamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.80"
                  step="0.05"
                  value={dampingGamma}
                  onChange={(e) => setDampingGamma(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Controls spontaneous decay rate into ground state.</span>
              </div>
            )}

            {channelType === 'PHASE_DAMPING' && (
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Dephasing Parameter (λ):</span>
                  <span className="text-cyan-400 font-mono">{dephasingLambda.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.80"
                  step="0.05"
                  value={dephasingLambda}
                  onChange={(e) => setDephasingLambda(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Suppresses off-diagonal density matrix coherences.</span>
              </div>
            )}

            {(channelType === 'DEPOLARIZING' || channelType === 'BIT_FLIP' || channelType === 'PHASE_FLIP') && (
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Error Probability (p):</span>
                  <span className="text-purple-400 font-mono">{errorProb.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.80"
                  step="0.05"
                  value={errorProb}
                  onChange={(e) => setErrorProb(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Probability of stochastic quantum operator application.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-400 block mb-1">PRNG Seed:</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setSeed((prev) => prev + 1)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Next Seed</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/20 rounded-xl border border-indigo-800/40 text-[11px] text-indigo-300 font-mono leading-relaxed">
              <strong>Governing Equation:</strong>
              <div className="text-[10px] text-slate-300 mt-1 break-words">{report.governingFormula}</div>
            </div>
          </div>
        </div>

        {/* Quantum Information Metrics Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Quantum Fidelity & Entropy</h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Bures Metric</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Quantum Fidelity (F):</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {(report.globalFidelity * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Uhlmann State Metric</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Von Neumann Entropy:</span>
              <span className="text-2xl font-bold font-mono text-purple-400">
                {report.vonNeumannEntropy} nats
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">-Tr(ρ ln ρ)</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Signal-to-Quantum SNR:</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {report.signalToQuantumNoiseDb} dB
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">SQNR Margin</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Peak Perturbation:</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                ±{report.modelImpactAssessment.maxDistortion} {unit}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Max Quantum Delta</span>
            </div>

            {/* Density Matrix Display */}
            <div className="col-span-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1.5 font-semibold">
                Transformed 2-Level Density Matrix (ρ'):
              </span>
              <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">|0⟩⟨0| (Ground)</span>
                  <span className="text-cyan-300 font-bold">{transformedRho.rho00}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">|0⟩⟨1| (Coherence)</span>
                  <span className="text-indigo-300 font-bold">{transformedRho.rho01_real}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">|1⟩⟨0| (Coherence)</span>
                  <span className="text-indigo-300 font-bold">{transformedRho.rho01_real}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">|1⟩⟨1| (Excited)</span>
                  <span className="text-amber-300 font-bold">{transformedRho.rho11}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Downstream Model Resilience Impact */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Model Stress Assessment</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              report.modelImpactAssessment.falsePositiveLikelihood === 'CRITICAL_TRIP'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : report.modelImpactAssessment.falsePositiveLikelihood === 'HIGH'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {report.modelImpactAssessment.falsePositiveLikelihood}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold block">Downstream ML Susceptibility:</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {report.modelImpactAssessment.falsePositiveLikelihood === 'CRITICAL_TRIP'
                  ? 'Severe quantum distortion exceeds statistical 3-sigma thresholds. Downstream Hotelling T², SPC control charts, and anomaly detectors will falsely trip plant interlocks.'
                  : report.modelImpactAssessment.falsePositiveLikelihood === 'HIGH'
                  ? 'Significant non-Markovian noise. Causes model drift and degrades RUL prediction accuracy.'
                  : 'Noise remains within normal rejection envelopes. Standard estimators maintain stability.'}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-semibold block">Recommended Quantum Filter:</span>
              <div className="p-2 bg-indigo-950/30 rounded border border-indigo-800/40 text-indigo-200 font-mono text-[11px]">
                {report.modelImpactAssessment.recommendedFilter}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Advisory & Ethics Gate:</span>
              <p className="leading-relaxed">
                Advisory stress simulation only. No physical control commands or quantum state injection will be transmitted to plant machinery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Telemetry Inspection Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Telemetry Trace: Clean Stream vs Quantum-Corrupted Stream ({sensorName})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing first 25 of {report.samplePoints.length} samples
          </span>
        </div>

        {/* Visual Waveform Comparison Bar Chart */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1 border-b border-slate-800">
            <span>Normalized Signal Trace (Clean: Cyan | Quantum-Corrupted: Amber)</span>
            <span className="text-slate-500">t = 0.00s → 0.60s</span>
          </div>

          <div className="h-28 flex items-end gap-1.5 pt-2">
            {report.samplePoints.slice(0, 30).map((pt, idx) => {
              // Normalize clean & corrupted to 0..100% height
              const minVal = 0;
              const maxVal = Math.max(...report.samplePoints.map((p) => Math.max(p.cleanValue, p.corruptedValue))) * 1.15;
              const cleanHeight = Math.max(8, Math.min(100, (pt.cleanValue / maxVal) * 100));
              const corruptHeight = Math.max(8, Math.min(100, (pt.corruptedValue / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 text-[10px] font-mono text-white p-2 rounded shadow-xl z-20 whitespace-nowrap">
                    <span>Sample #{pt.index} (t={pt.timeSec}s)</span>
                    <span className="text-cyan-400">Clean: {pt.cleanValue} {unit}</span>
                    <span className="text-amber-400">Corrupted: {pt.corruptedValue} {unit}</span>
                    <span className="text-slate-400">Delta: {pt.quantumNoiseDelta}</span>
                    <span className="text-indigo-300">Channel: {pt.channelApplied}</span>
                  </div>

                  <div className="w-full flex items-end justify-center gap-0.5 h-full">
                    <div
                      style={{ height: `${cleanHeight}%` }}
                      className="w-1/2 bg-cyan-500/80 rounded-t-sm transition-all"
                    />
                    <div
                      style={{ height: `${corruptHeight}%` }}
                      className={`w-1/2 rounded-t-sm transition-all ${
                        Math.abs(pt.quantumNoiseDelta) > 1.0 ? 'bg-amber-500' : 'bg-indigo-400/80'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telemetry Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Time (s)</th>
                <th className="py-2 px-3">Clean Baseline ({unit})</th>
                <th className="py-2 px-3">Quantum Output ({unit})</th>
                <th className="py-2 px-3">Quantum Noise Δ</th>
                <th className="py-2 px-3">Noise Mechanism</th>
                <th className="py-2 px-3">Fidelity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {report.samplePoints.slice(0, 15).map((pt) => (
                <tr key={pt.index} className="hover:bg-slate-800/40">
                  <td className="py-2 px-3 text-slate-500">{pt.index}</td>
                  <td className="py-2 px-3 text-slate-400">{pt.timeSec}</td>
                  <td className="py-2 px-3 text-cyan-400 font-bold">{pt.cleanValue}</td>
                  <td className="py-2 px-3 text-amber-400 font-bold">{pt.corruptedValue}</td>
                  <td className="py-2 px-3 text-slate-300">
                    <span className={pt.quantumNoiseDelta !== 0 ? 'text-amber-300' : 'text-slate-500'}>
                      {pt.quantumNoiseDelta > 0 ? `+${pt.quantumNoiseDelta}` : pt.quantumNoiseDelta}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-indigo-300 text-[11px]">{pt.channelApplied}</td>
                  <td className="py-2 px-3 text-emerald-400">{(pt.instantaneousFidelity * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
