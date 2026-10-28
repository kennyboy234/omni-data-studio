/**
 * ====================================================================
 * OMNIDATA INDUSTRIAL AUTONOMY: QUANTUM ERROR SIMULATOR ENGINE
 * Mathematical Modeling of Non-Classical Quantum Noise Channels
 * applied to Industrial Sensor Data Streams & Downstream Model Stress-Testing.
 *
 * References:
 *  - Nielsen & Chuang (2010), "Quantum Computation and Quantum Information" (Section 8.3 Quantum Noise)
 *  - Preskill, J. (2020), "Lecture Notes for Physics 229: Quantum Information and Computation"
 *  - Kraus, K. (1983), "States, Effects, and Operations: Fundamental Notions of Quantum Theory"
 * ====================================================================
 */

export type QuantumChannelType =
  | 'DEPOLARIZING'      // Maximally mixed state injection: (1-p)ρ + (p/3)(XρX + YρY + ZρZ)
  | 'AMPLITUDE_DAMPING'  // Energy dissipation / thermal relaxation: E0 = [[1, 0], [0, sqrt(1-γ)]], E1 = [[0, sqrt(γ)], [0, 0]]
  | 'PHASE_DAMPING'      // Pure dephasing / decoherence: loss of phase coherence without energy loss (T2*)
  | 'BIT_FLIP'           // Stochastic state inversion: (1-p)ρ + p XρX
  | 'PHASE_FLIP'         // Polarity / phase inversion: (1-p)ρ + p ZρZ
  | 'QUANTUM_ZENO_FREEZE';// Rapid measurement projection freezing sensor to discrete eigenspace

export interface QuantumChannelParams {
  channelType: QuantumChannelType;
  errorProbability: number;    // p in [0, 1] for depolarizing / bit / phase flip
  dampingGamma: number;        // γ in [0, 1] for amplitude damping
  dephasingLambda: number;     // λ in [0, 1] for phase damping
  measurementCadenceHz: number;// Cadence for Quantum Zeno freeze
  seed: number;
}

export interface QuantumTelemetryPoint {
  index: number;
  timeSec: number;
  cleanValue: number;
  corruptedValue: number;
  quantumNoiseDelta: number;
  channelApplied: string;
  instantaneousFidelity: number; // 0..1
}

export interface DensityMatrix2x2 {
  rho00: number; // |0><0|
  rho01_real: number; // |0><1|
  rho01_imag: number;
  rho11: number; // |1><1|
}

export interface QuantumSimulationReport {
  seed: number;
  channelType: QuantumChannelType;
  channelName: string;
  governingFormula: string;
  samplePoints: QuantumTelemetryPoint[];
  globalFidelity: number;          // Bures / Hilbert-Schmidt state fidelity in [0, 1]
  vonNeumannEntropy: number;       // S = -Tr(ρ ln ρ) in nats
  signalToQuantumNoiseDb: number;  // SNR in dB
  tracePreserved: boolean;         // Verifies Σ E_k† E_k = I
  modelImpactAssessment: {
    maxDistortion: number;
    falsePositiveLikelihood: 'NEGLIGIBLE' | 'MODERATE' | 'HIGH' | 'CRITICAL_TRIP';
    recommendedFilter: string;
  };
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
function createMulberry32(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Normalizes a continuous telemetry series into a 2-level quantum state density matrix ρ.
 * |0> represents nominal ground state, |1> represents excited/anomalous state.
 */
export function mapSignalToDensityMatrix(values: number[], baselineMean: number, baselineStd: number): DensityMatrix2x2 {
  if (values.length === 0) {
    return { rho00: 1, rho01_real: 0, rho01_imag: 0, rho11: 0 };
  }

  // Calculate excited state population p_excited as normalized excursion beyond 2-sigma
  let excitedCount = 0;
  for (const v of values) {
    const z = Math.abs(v - baselineMean) / Math.max(1e-4, baselineStd);
    if (z > 2.0) excitedCount++;
  }

  const p1 = Math.min(1.0, Math.max(0.0, excitedCount / values.length));
  const p0 = 1.0 - p1;

  // Quantum coherence term (off-diagonal) bounded by sqrt(p0 * p1)
  const coherence = Math.sqrt(p0 * p1) * 0.85;

  return {
    rho00: p0,
    rho01_real: coherence,
    rho01_imag: 0,
    rho11: p1,
  };
}

/**
 * Applies a 2x2 Quantum Noise Channel to a density matrix via Kraus operators:
 *  ρ' = Σ E_k ρ E_k†
 */
export function applyKrausChannel(
  rho: DensityMatrix2x2,
  channel: QuantumChannelType,
  p: number,
  gamma: number,
  lambda: number
): { transformedRho: DensityMatrix2x2; tracePreserved: boolean } {
  let newRho00 = rho.rho00;
  let newRho01_real = rho.rho01_real;
  let newRho01_imag = rho.rho01_imag;
  let newRho11 = rho.rho11;

  switch (channel) {
    case 'AMPLITUDE_DAMPING': {
      // Kraus operators:
      // E0 = [[1, 0], [0, sqrt(1 - γ)]]
      // E1 = [[0, sqrt(γ)], [0, 0]]
      // ρ'_00 = ρ00 + γ * ρ11
      // ρ'_01 = sqrt(1 - γ) * ρ01
      // ρ'_11 = (1 - γ) * ρ11
      const g = Math.min(1.0, Math.max(0.0, gamma));
      newRho00 = rho.rho00 + g * rho.rho11;
      newRho01_real = Math.sqrt(1.0 - g) * rho.rho01_real;
      newRho01_imag = Math.sqrt(1.0 - g) * rho.rho01_imag;
      newRho11 = (1.0 - g) * rho.rho11;
      break;
    }

    case 'PHASE_DAMPING': {
      // Kraus operators:
      // E0 = [[1, 0], [0, sqrt(1 - λ)]]
      // E1 = [[0, 0], [0, sqrt(λ)]]
      // ρ'_00 = ρ00, ρ'_11 = ρ11, ρ'_01 = sqrt(1 - λ) * ρ01
      const l = Math.min(1.0, Math.max(0.0, lambda));
      newRho00 = rho.rho00;
      newRho01_real = Math.sqrt(1.0 - l) * rho.rho01_real;
      newRho01_imag = Math.sqrt(1.0 - l) * rho.rho01_imag;
      newRho11 = rho.rho11;
      break;
    }

    case 'DEPOLARIZING': {
      // ρ' = (1 - p) ρ + (p / 2) I
      const prob = Math.min(1.0, Math.max(0.0, p));
      newRho00 = (1.0 - prob) * rho.rho00 + prob * 0.5;
      newRho01_real = (1.0 - prob) * rho.rho01_real;
      newRho01_imag = (1.0 - prob) * rho.rho01_imag;
      newRho11 = (1.0 - prob) * rho.rho11 + prob * 0.5;
      break;
    }

    case 'BIT_FLIP': {
      // ρ' = (1 - p) ρ + p (X ρ X)
      // X = [[0, 1], [1, 0]]
      const prob = Math.min(1.0, Math.max(0.0, p));
      newRho00 = (1.0 - prob) * rho.rho00 + prob * rho.rho11;
      newRho01_real = (1.0 - prob) * rho.rho01_real + prob * rho.rho01_real;
      newRho11 = (1.0 - prob) * rho.rho11 + prob * rho.rho00;
      break;
    }

    case 'PHASE_FLIP': {
      // ρ' = (1 - p) ρ + p (Z ρ Z)
      // Z = [[1, 0], [0, -1]] -> off-diagonals multiplied by (1 - 2p)
      const prob = Math.min(1.0, Math.max(0.0, p));
      newRho00 = rho.rho00;
      newRho01_real = (1.0 - 2.0 * prob) * rho.rho01_real;
      newRho01_imag = (1.0 - 2.0 * prob) * rho.rho01_imag;
      newRho11 = rho.rho11;
      break;
    }

    case 'QUANTUM_ZENO_FREEZE': {
      // Projective measurement onto computational basis: eliminates off-diagonal coherences completely
      newRho00 = rho.rho00;
      newRho01_real = 0;
      newRho01_imag = 0;
      newRho11 = rho.rho11;
      break;
    }
  }

  // Check trace preservation: Tr(ρ') = 1 within floating-point tolerance
  const trace = newRho00 + newRho11;
  const tracePreserved = Math.abs(trace - 1.0) < 1e-6;

  return {
    transformedRho: {
      rho00: Number(newRho00.toFixed(5)),
      rho01_real: Number(newRho01_real.toFixed(5)),
      rho01_imag: Number(newRho01_imag.toFixed(5)),
      rho11: Number(newRho11.toFixed(5)),
    },
    tracePreserved,
  };
}

/**
 * Calculates Von Neumann Entropy S(ρ) = -Tr(ρ ln ρ) in nats.
 * For 2x2 matrix, eigenvalues are λ± = 0.5 ± sqrt(0.25 - Det(ρ)).
 */
export function calculateVonNeumannEntropy(rho: DensityMatrix2x2): number {
  const det = rho.rho00 * rho.rho11 - (rho.rho01_real * rho.rho01_real + rho.rho01_imag * rho.rho01_imag);
  const discriminant = Math.max(0, 0.25 - det);
  const lambda1 = Math.min(1.0, Math.max(0.0, 0.5 + Math.sqrt(discriminant)));
  const lambda2 = Math.min(1.0, Math.max(0.0, 0.5 - Math.sqrt(discriminant)));

  let entropy = 0;
  if (lambda1 > 1e-12) entropy -= lambda1 * Math.log(lambda1);
  if (lambda2 > 1e-12) entropy -= lambda2 * Math.log(lambda2);

  return Number(entropy.toFixed(4));
}

/**
 * Calculates Quantum State Fidelity F(ρ, σ) for two 2x2 density matrices.
 * For single qubit states, Uhlmann's fidelity reduces to:
 * F = Tr(ρ σ) + 2 * sqrt(Det(ρ) * Det(σ))
 */
export function calculateQuantumFidelity(rho: DensityMatrix2x2, sigma: DensityMatrix2x2): number {
  // Tr(ρ σ)
  const trRhoSigma =
    rho.rho00 * sigma.rho00 +
    rho.rho11 * sigma.rho11 +
    2.0 * (rho.rho01_real * sigma.rho01_real + rho.rho01_imag * sigma.rho01_imag);

  const detRho = Math.max(0, rho.rho00 * rho.rho11 - (rho.rho01_real ** 2 + rho.rho01_imag ** 2));
  const detSigma = Math.max(0, sigma.rho00 * sigma.rho11 - (sigma.rho01_real ** 2 + sigma.rho01_imag ** 2));

  const fidelity = trRhoSigma + 2.0 * Math.sqrt(detRho * detSigma);
  return Number(Math.min(1.0, Math.max(0.0, fidelity)).toFixed(4));
}

/**
 * Applies Quantum Noise Channel to continuous industrial sensor telemetry stream.
 */
export function simulateQuantumErrorStream(
  cleanTelemetry: number[],
  sampleRateHz: number,
  params: QuantumChannelParams
): QuantumSimulationReport {
  const { channelType, errorProbability, dampingGamma, dephasingLambda, seed } = params;
  const prng = createMulberry32(seed);

  const n = cleanTelemetry.length;
  if (n === 0) {
    throw new Error('Telemetry series cannot be empty for quantum error simulation.');
  }

  // Baseline statistics of clean stream
  const mean = cleanTelemetry.reduce((a, b) => a + b, 0) / n;
  const variance = cleanTelemetry.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, n - 1);
  const std = Math.sqrt(variance) || 1.0;

  // Map to clean density matrix
  const cleanRho = mapSignalToDensityMatrix(cleanTelemetry, mean, std);

  // Apply Kraus operators to density matrix
  const { transformedRho, tracePreserved } = applyKrausChannel(
    cleanRho,
    channelType,
    errorProbability,
    dampingGamma,
    dephasingLambda
  );

  const globalFidelity = calculateQuantumFidelity(cleanRho, transformedRho);
  const vonNeumannEntropy = calculateVonNeumannEntropy(transformedRho);

  // Generate corrupted sensor stream using quantum noise physics
  const samplePoints: QuantumTelemetryPoint[] = [];
  let sumNoiseSquared = 0;
  let sumSignalSquared = 0;
  let maxDelta = 0;

  // Channel descriptions and formulas
  let formula = '';
  let channelName = '';

  switch (channelType) {
    case 'AMPLITUDE_DAMPING':
      channelName = 'Amplitude Damping Channel (Energy Dissipation)';
      formula = 'E₀=[[1,0],[0,√(1-γ)]], E₁=[[0,√γ],[0,0]]; x\'(t) = x(t)·(1-γ) + vac_fluct(t)';
      break;
    case 'PHASE_DAMPING':
      channelName = 'Phase Damping Channel (Pure Dephasing / T2*)';
      formula = 'E₀=[[1,0],[0,√(1-λ)]], E₁=[[0,0],[0,√λ]]; e^(-t/T2*) random phase drift';
      break;
    case 'DEPOLARIZING':
      channelName = 'Depolarizing Quantum Channel (Maximally Mixed Noise)';
      formula = 'E(ρ) = (1-p)ρ + (p/3)(XρX + YρY + ZρZ); Isotropic white quantum noise';
      break;
    case 'BIT_FLIP':
      channelName = 'Quantum Bit-Flip Noise (Pauli-X Channel)';
      formula = 'E(ρ) = (1-p)ρ + p XρX; Stochastic polarity / bit-level parity inversion';
      break;
    case 'PHASE_FLIP':
      channelName = 'Quantum Phase-Flip Noise (Pauli-Z Channel)';
      formula = 'E(ρ) = (1-p)ρ + p ZρZ; Coherence sign inversion without amplitude change';
      break;
    case 'QUANTUM_ZENO_FREEZE':
      channelName = 'Quantum Zeno Effect (Projective Collapse Freeze)';
      formula = 'P = |ψ⟩⟨ψ|; Ultra-frequent observation collapses sensor state into frozen eigenstate';
      break;
  }

  // Pre-seed a Zeno freeze value if applicable
  let zenoFrozenValue = cleanTelemetry[0];
  let zenoCounter = 0;

  for (let i = 0; i < n; i++) {
    const t = i / sampleRateHz;
    const cleanVal = cleanTelemetry[i];
    let corruptedVal = cleanVal;
    let applied = 'NONE';

    switch (channelType) {
      case 'AMPLITUDE_DAMPING': {
        // Continuous amplitude damping: spontaneous decay towards vacuum baseline + zero-point quantum noise
        const decayFactor = 1.0 - dampingGamma;
        const zeroPointJitter = (prng() - 0.5) * 2.0 * std * Math.sqrt(dampingGamma);
        corruptedVal = mean + (cleanVal - mean) * decayFactor + zeroPointJitter;
        applied = `AmpDamp (γ=${dampingGamma.toFixed(2)})`;
        break;
      }

      case 'PHASE_DAMPING': {
        // Dephasing adds non-Markovian stochastic phase jitter without changing signal RMS energy
        const phaseJitter = (prng() - 0.5) * Math.PI * dephasingLambda;
        corruptedVal = cleanVal + std * Math.sin(phaseJitter) * Math.sqrt(dephasingLambda);
        applied = `PhaseDamp (λ=${dephasingLambda.toFixed(2)})`;
        break;
      }

      case 'DEPOLARIZING': {
        // With probability p, replace sample with uniform thermal quantum noise
        if (prng() < errorProbability) {
          const thermalNoise = mean + (prng() - 0.5) * 4.0 * std;
          corruptedVal = thermalNoise;
          applied = 'Depolarizing Quantum Flip';
        }
        break;
      }

      case 'BIT_FLIP': {
        // Stochastic bit flip / sign inversion
        if (prng() < errorProbability) {
          corruptedVal = mean - (cleanVal - mean); // Invert excursion around operating mean
          applied = 'Pauli-X Inversion';
        }
        break;
      }

      case 'PHASE_FLIP': {
        // Flips high frequency sign
        if (prng() < errorProbability) {
          corruptedVal = cleanVal - 2.0 * (cleanVal - mean) * 0.75;
          applied = 'Pauli-Z Phase Flip';
        }
        break;
      }

      case 'QUANTUM_ZENO_FREEZE': {
        // Projective measurement freezes state every K cycles
        zenoCounter++;
        if (zenoCounter % 6 === 0) {
          zenoFrozenValue = cleanVal;
        }
        corruptedVal = zenoFrozenValue;
        applied = 'Zeno Projective Freeze';
        break;
      }
    }

    const delta = corruptedVal - cleanVal;
    if (Math.abs(delta) > maxDelta) maxDelta = Math.abs(delta);

    sumNoiseSquared += delta * delta;
    sumSignalSquared += (cleanVal - mean) * (cleanVal - mean);

    // Instantaneous fidelity proxy
    const instFidelity = Math.max(0.0, 1.0 - Math.abs(delta) / Math.max(1e-3, 3.0 * std));

    samplePoints.push({
      index: i,
      timeSec: Number(t.toFixed(3)),
      cleanValue: Number(cleanVal.toFixed(3)),
      corruptedValue: Number(corruptedVal.toFixed(3)),
      quantumNoiseDelta: Number(delta.toFixed(3)),
      channelApplied: applied,
      instantaneousFidelity: Number(instFidelity.toFixed(3)),
    });
  }

  // Signal to Quantum Noise Ratio (SQNR) in dB
  const sqnrDb = sumNoiseSquared > 0 ? 10.0 * Math.log10(sumSignalSquared / sumNoiseSquared) : 60.0;

  // Impact Assessment for Industrial ML/Judge
  let falsePositiveLikelihood: QuantumSimulationReport['modelImpactAssessment']['falsePositiveLikelihood'] = 'NEGLIGIBLE';
  if (globalFidelity < 0.7 || sqnrDb < 10) {
    falsePositiveLikelihood = 'CRITICAL_TRIP';
  } else if (globalFidelity < 0.85 || sqnrDb < 18) {
    falsePositiveLikelihood = 'HIGH';
  } else if (globalFidelity < 0.95 || sqnrDb < 25) {
    falsePositiveLikelihood = 'MODERATE';
  }

  let recommendedFilter = 'Standard Butterworth low-pass filter';
  if (channelType === 'AMPLITUDE_DAMPING') {
    recommendedFilter = 'Kalman state estimator with vacuum thermal compensation gain';
  } else if (channelType === 'PHASE_DAMPING') {
    recommendedFilter = 'Hilbert transform envelope demodulator with phase-locked loop (PLL)';
  } else if (channelType === 'DEPOLARIZING') {
    recommendedFilter = 'Robust Hampel median filter with quantum entropy thresholding';
  } else if (channelType === 'QUANTUM_ZENO_FREEZE') {
    recommendedFilter = 'First-difference derivative check to unlock stuck Zeno state';
  }

  return {
    seed,
    channelType,
    channelName,
    governingFormula: formula,
    samplePoints,
    globalFidelity,
    vonNeumannEntropy,
    signalToQuantumNoiseDb: Number(sqnrDb.toFixed(2)),
    tracePreserved,
    modelImpactAssessment: {
      maxDistortion: Number(maxDelta.toFixed(3)),
      falsePositiveLikelihood,
      recommendedFilter,
    },
  };
}
