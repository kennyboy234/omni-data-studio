/**
 * ====================================================================
 * OMNIDATA TEST SUITE: QUANTUM ERROR SIMULATOR
 * Verification of Kraus Operator Noise Channels, Trace Preservation,
 * Von Neumann Entropy, and Quantum State Fidelity
 * References:
 *  - Nielsen & Chuang (2010), Chapter 8
 *  - Preskill Quantum Information Lecture Notes
 * ====================================================================
 */

import { describe, it, expect } from 'vitest';
import {
  applyKrausChannel,
  calculateQuantumFidelity,
  calculateVonNeumannEntropy,
  simulateQuantumErrorStream,
  mapSignalToDensityMatrix,
  DensityMatrix2x2,
} from '../utils/quantumErrorSimulator';

describe('Quantum Error Simulator: Kraus Channels & State Physics', () => {
  const pureGroundState: DensityMatrix2x2 = {
    rho00: 1.0,
    rho01_real: 0.0,
    rho01_imag: 0.0,
    rho11: 0.0,
  };

  const superpositionState: DensityMatrix2x2 = {
    rho00: 0.5,
    rho01_real: 0.5,
    rho01_imag: 0.0,
    rho11: 0.5,
  };

  it('preserves trace Tr(ρ\') = 1 across all quantum noise channels', () => {
    const channels = [
      'AMPLITUDE_DAMPING',
      'PHASE_DAMPING',
      'DEPOLARIZING',
      'BIT_FLIP',
      'PHASE_FLIP',
      'QUANTUM_ZENO_FREEZE',
    ] as const;

    for (const ch of channels) {
      const { transformedRho, tracePreserved } = applyKrausChannel(
        superpositionState,
        ch,
        0.35, // p
        0.4,  // gamma
        0.4   // lambda
      );

      expect(tracePreserved).toBe(true);
      const trace = transformedRho.rho00 + transformedRho.rho11;
      expect(trace).toBeCloseTo(1.0, 4);
    }
  });

  it('amplitude damping with gamma=0 preserves state fidelity exactly F=1.0', () => {
    const { transformedRho } = applyKrausChannel(
      superpositionState,
      'AMPLITUDE_DAMPING',
      0,
      0, // gamma = 0 -> no dissipation
      0
    );

    const fidelity = calculateQuantumFidelity(superpositionState, transformedRho);
    expect(fidelity).toBeCloseTo(1.0, 4);
  });

  it('amplitude damping with gamma=1 drives any state to the ground state |0><0|', () => {
    const excitedState: DensityMatrix2x2 = {
      rho00: 0.0,
      rho01_real: 0.0,
      rho01_imag: 0.0,
      rho11: 1.0,
    };

    const { transformedRho } = applyKrausChannel(
      excitedState,
      'AMPLITUDE_DAMPING',
      0,
      1.0, // full damping to ground state
      0
    );

    expect(transformedRho.rho00).toBeCloseTo(1.0, 4);
    expect(transformedRho.rho11).toBeCloseTo(0.0, 4);
  });

  it('depolarizing channel maximizes Von Neumann entropy towards ln(2) ~ 0.6931 nats', () => {
    const { transformedRho } = applyKrausChannel(
      pureGroundState,
      'DEPOLARIZING',
      1.0, // full depolarization to I/2
      0,
      0
    );

    expect(transformedRho.rho00).toBeCloseTo(0.5, 4);
    expect(transformedRho.rho11).toBeCloseTo(0.5, 4);

    const entropy = calculateVonNeumannEntropy(transformedRho);
    // S = - (0.5 ln 0.5 + 0.5 ln 0.5) = ln(2) = 0.6931 nats
    expect(entropy).toBeCloseTo(Math.LN2, 3);
  });

  it('dephasing channel removes off-diagonal coherences without altering diagonal populations', () => {
    const { transformedRho } = applyKrausChannel(
      superpositionState,
      'PHASE_DAMPING',
      0,
      0,
      1.0 // lambda = 1.0 -> complete phase decoherence
    );

    // Diagonals unchanged
    expect(transformedRho.rho00).toBeCloseTo(0.5, 4);
    expect(transformedRho.rho11).toBeCloseTo(0.5, 4);
    // Off-diagonals eliminated
    expect(transformedRho.rho01_real).toBeCloseTo(0.0, 4);
  });
});

describe('Quantum Error Simulator: Industrial Sensor Telemetry Stream Simulation', () => {
  // 50-point synthetic sinusoidal vibration sensor reading (20 Hz, 100 Hz sampling)
  const cleanVibration = Array.from({ length: 50 }, (_, i) => {
    const t = i / 100.0;
    return 10.0 + 2.5 * Math.sin(2 * Math.PI * 20 * t);
  });

  it('simulates quantum amplitude damping with reproducible deterministic PRNG seed', () => {
    const params = {
      channelType: 'AMPLITUDE_DAMPING' as const,
      errorProbability: 0.1,
      dampingGamma: 0.35,
      dephasingLambda: 0.2,
      measurementCadenceHz: 10,
      seed: 1337,
    };

    const sim1 = simulateQuantumErrorStream(cleanVibration, 100, params);
    const sim2 = simulateQuantumErrorStream(cleanVibration, 100, params);

    expect(sim1.seed).toBe(1337);
    expect(sim1.tracePreserved).toBe(true);
    expect(sim1.samplePoints.length).toBe(50);
    // Identical output with fixed seed
    expect(sim1.globalFidelity).toBe(sim2.globalFidelity);
    expect(sim1.signalToQuantumNoiseDb).toBe(sim2.signalToQuantumNoiseDb);
    expect(sim1.samplePoints[10].corruptedValue).toBe(sim2.samplePoints[10].corruptedValue);
  });

  it('higher quantum error probability causes monotonically lower SQNR and fidelity', () => {
    const lowNoise = simulateQuantumErrorStream(cleanVibration, 100, {
      channelType: 'DEPOLARIZING',
      errorProbability: 0.05,
      dampingGamma: 0.05,
      dephasingLambda: 0.05,
      measurementCadenceHz: 10,
      seed: 42,
    });

    const highNoise = simulateQuantumErrorStream(cleanVibration, 100, {
      channelType: 'DEPOLARIZING',
      errorProbability: 0.60,
      dampingGamma: 0.60,
      dephasingLambda: 0.60,
      measurementCadenceHz: 10,
      seed: 42,
    });

    expect(lowNoise.globalFidelity).toBeGreaterThan(highNoise.globalFidelity);
    expect(lowNoise.signalToQuantumNoiseDb).toBeGreaterThan(highNoise.signalToQuantumNoiseDb);
    expect(highNoise.modelImpactAssessment.falsePositiveLikelihood).toBe('CRITICAL_TRIP');
  });

  it('quantum zeno freeze creates discrete step plateaus in telemetry', () => {
    const zenoSim = simulateQuantumErrorStream(cleanVibration, 100, {
      channelType: 'QUANTUM_ZENO_FREEZE',
      errorProbability: 0.2,
      dampingGamma: 0.2,
      dephasingLambda: 0.2,
      measurementCadenceHz: 10,
      seed: 99,
    });

    expect(zenoSim.channelType).toBe('QUANTUM_ZENO_FREEZE');
    expect(zenoSim.samplePoints.length).toBe(50);
    // In Zeno freeze, points within a 6-step window have identical values
    expect(zenoSim.samplePoints[1].corruptedValue).toBe(zenoSim.samplePoints[2].corruptedValue);
  });
});
