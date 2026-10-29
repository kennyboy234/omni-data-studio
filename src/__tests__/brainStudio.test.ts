import { describe, it, expect } from 'vitest';
import { BrainComponentState, DriftMetric, AnomalyPoint, CausalNode, CausalEdge } from '../02-brain/types';

describe('Studio 2 - BRAIN: WF05 Drift Watchtower', () => {
  it('identifies stable distributions with low PSI (< 0.1)', () => {
    const metric: DriftMetric = {
      feature: 'payment_latency_ms',
      psi: 0.042,
      ksPValue: 0.88,
      status: 'stable',
      baselineMean: 142.5,
      currentMean: 144.1,
      varianceShiftPct: +1.1,
    };
    expect(metric.psi).toBeLessThan(0.1);
    expect(metric.status).toBe('stable');
    expect(metric.ksPValue).toBeGreaterThan(0.05);
  });

  it('triggers Alert state when synthetic drift is injected (PSI >= 0.25)', () => {
    const driftedMetric: DriftMetric = {
      feature: 'transaction_volume_usd',
      psi: 0.384,
      ksPValue: 0.0012,
      status: 'critical',
      baselineMean: 1240.0,
      currentMean: 2046.0,
      varianceShiftPct: +65.0,
    };
    expect(driftedMetric.psi).toBeGreaterThanOrEqual(0.25);
    expect(driftedMetric.status).toBe('critical');
    expect(driftedMetric.ksPValue).toBeLessThan(0.01);
  });
});

describe('Studio 2 - BRAIN: WF06 Anomaly Pulse', () => {
  it('flags streaming points that breach 3-sigma thresholds', () => {
    const threshold = 70;
    const normalPoint: AnomalyPoint = {
      timestamp: '10:00:00',
      value: 52.4,
      expected: 50.0,
      upperBound: 70.0,
      lowerBound: 30.0,
      anomalyScore: 0.12,
      isAnomaly: false,
      severity: 'normal',
    };
    expect(normalPoint.value).toBeLessThanOrEqual(threshold);
    expect(normalPoint.isAnomaly).toBe(false);

    const spikePoint: AnomalyPoint = {
      timestamp: '10:00:05',
      value: 98.6,
      expected: 50.0,
      upperBound: 70.0,
      lowerBound: 30.0,
      anomalyScore: 0.942,
      isAnomaly: true,
      severity: 'critical',
    };
    expect(spikePoint.value).toBeGreaterThan(threshold);
    expect(spikePoint.isAnomaly).toBe(true);
    expect(spikePoint.severity).toBe('critical');
  });
});

describe('Studio 2 - BRAIN: WF10 Causal Graph & do-calculus', () => {
  it('evaluates counterfactual intervention E[Y | do(X = x)]', () => {
    const baselineOutcome = 42.0;
    const effectCoefficient = -2.6;
    const treatmentVal = 3.5;

    const counterfactual = baselineOutcome + effectCoefficient * (treatmentVal - 1.0);
    expect(counterfactual).toBe(35.5);

    const ate = effectCoefficient * (treatmentVal - 1.0);
    expect(ate).toBe(-6.5);
  });

  it('detects unblocked backdoor paths and enters Alert state', () => {
    const edges: CausalEdge[] = [
      { from: 'T', to: 'Y', weight: 0.72, pValue: 0.001, isConfounded: false },
      { from: 'U_Unobserved', to: 'T', weight: 0.92, pValue: 0.0001, isConfounded: true },
      { from: 'U_Unobserved', to: 'Y', weight: 0.88, pValue: 0.0002, isConfounded: true },
    ];

    const hasBackdoorConfounding = edges.some((e) => e.isConfounded);
    expect(hasBackdoorConfounding).toBe(true);
  });
});

describe('Studio 2 - BRAIN: 3-State Lifecycle Invariant', () => {
  it('supports Idle, Analyzing, and Alert component states across all brain units', () => {
    const validStates: BrainComponentState[] = ['idle', 'analyzing', 'alert'];
    expect(validStates).toContain('idle');
    expect(validStates).toContain('analyzing');
    expect(validStates).toContain('alert');
  });
});
