import { describe, it, expect } from 'vitest';
import {
  calculatePSI,
  calculateTwoSampleKS,
  detectPageHinkley,
  auditGroupTimeLeakage,
  evaluateRulPredictions,
  detectMultivariateAnomalies,
} from '../utils/predictiveModelsEngine';

describe('Phase D: Predictive Models, Drift & Leakage Audit Suite', () => {
  // 1. Population Stability Index (PSI)
  describe('calculatePSI', () => {
    it('returns near-zero PSI and STABLE for identical baseline and target distributions', () => {
      const baseline = [10, 12, 14, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45];
      const target = [...baseline];
      const result = calculatePSI(baseline, target, 5, 'inverter_temp');

      expect(result.psi).toBeLessThan(0.02);
      expect(result.driftLevel).toBe('STABLE');
      expect(result.bins.length).toBe(5);
    });

    it('detects SIGNIFICANT_DRIFT when target distribution has large mean shift', () => {
      // Baseline centered around 10
      const baseline = Array.from({ length: 100 }, (_, i) => 10 + Math.sin(i) * 2);
      // Target centered around 25 (severe shift)
      const target = Array.from({ length: 100 }, (_, i) => 25 + Math.sin(i) * 2);

      const result = calculatePSI(baseline, target, 10, 'joint_torque');
      expect(result.psi).toBeGreaterThanOrEqual(0.25);
      expect(result.driftLevel).toBe('SIGNIFICANT_DRIFT');
      expect(result.recommendation).toContain('CRITICAL');
    });

    it('handles Laplace smoothing gracefully with no NaN values', () => {
      const baseline = [1, 2, 3, 4, 5];
      const target = [10, 20, 30, 40, 50];
      const result = calculatePSI(baseline, target, 4, 'pressure');
      expect(Number.isFinite(result.psi)).toBe(true);
      expect(result.psi).toBeGreaterThan(0);
      result.bins.forEach((b) => {
        expect(Number.isFinite(b.psiContribution)).toBe(true);
      });
    });
  });

  // 2. Two-Sample Kolmogorov-Smirnov (KS) Drift Test
  describe('calculateTwoSampleKS', () => {
    it('returns D=0 and p=1.0 for identical sample sets', () => {
      const sample = [1.5, 2.7, 3.8, 4.2, 5.9, 7.1, 8.4];
      const result = calculateTwoSampleKS(sample, sample, 0.05, 'vibration_rms');

      expect(result.ksStatisticD).toBe(0);
      expect(result.driftDetected).toBe(false);
      expect(result.pValue).toBeGreaterThan(0.99);
    });

    it('detects drift when two samples are strictly separated', () => {
      const s1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const s2 = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      const result = calculateTwoSampleKS(s1, s2, 0.05, 'motor_current');

      expect(result.ksStatisticD).toBe(1.0);
      expect(result.driftDetected).toBe(true);
      expect(result.pValue).toBeLessThan(0.001);
    });
  });

  // 3. Page-Hinkley Streaming Concept Drift Detector
  describe('detectPageHinkley', () => {
    it('remains calm without false alarms during zero-mean stationary noise', () => {
      const residuals = Array.from({ length: 60 }, (_, i) => ({
        timestamp: `2026-10-26T10:${i < 10 ? '0' + i : i}:00Z`,
        error: (Math.sin(i * 3) * 0.1),
      }));

      const result = detectPageHinkley(residuals, 0.05, 30);
      expect(result.driftDetected).toBe(false);
      expect(result.alarmIndices.length).toBe(0);
    });

    it('fires drift alarm when sudden persistent error shift occurs', () => {
      // 30 normal points, followed by 30 high-error shifted points
      const residuals = [
        ...Array.from({ length: 30 }, (_, i) => ({ error: 0.1 + (i % 3) * 0.05 })),
        ...Array.from({ length: 30 }, () => ({ error: 5.5 })), // Sustained high error
      ];

      const result = detectPageHinkley(residuals, 0.05, 25);
      expect(result.driftDetected).toBe(true);
      expect(result.firstAlarmIndex).not.toBeNull();
      expect(result.firstAlarmIndex!).toBeGreaterThanOrEqual(30);
    });
  });

  // 4. Group & Time Leakage Audit Rule
  describe('auditGroupTimeLeakage', () => {
    it('approves strictly chronological split with disjoint group IDs', () => {
      const trainData = [
        { timestamp: '2026-10-01T00:00:00Z', assetId: 'ROBOT_01', features: { temp: 45 } },
        { timestamp: '2026-10-15T00:00:00Z', assetId: 'ROBOT_01', features: { temp: 48 } },
      ];
      const testData = [
        { timestamp: '2026-10-20T00:00:00Z', assetId: 'ROBOT_02', features: { temp: 50 } },
        { timestamp: '2026-10-25T00:00:00Z', assetId: 'ROBOT_02', features: { temp: 52 } },
      ];

      const audit = auditGroupTimeLeakage(trainData, testData);
      expect(audit.passed).toBe(true);
      expect(audit.violations.length).toBe(0);
    });

    it('flags TIME_ORDER_VIOLATION when test timestamps precede train window', () => {
      const trainData = [
        { timestamp: '2026-10-10T00:00:00Z', assetId: 'ROBOT_01', features: { temp: 45 } },
        { timestamp: '2026-10-20T00:00:00Z', assetId: 'ROBOT_01', features: { temp: 48 } },
      ];
      const testData = [
        // Leaking test point occurring BEFORE train end
        { timestamp: '2026-10-15T00:00:00Z', assetId: 'ROBOT_02', features: { temp: 50 } },
      ];

      const audit = auditGroupTimeLeakage(trainData, testData);
      expect(audit.passed).toBe(false);
      expect(audit.violations.some((v) => v.ruleId === 'TIME_ORDER_VIOLATION')).toBe(true);
    });

    it('flags GROUP_LEAKAGE and TARGET_LOOKAHEAD features', () => {
      const trainData = [
        {
          timestamp: '2026-10-01T00:00:00Z',
          assetId: 'SHARED_ASSET_A',
          features: { future_pressure_10s: 120, temp: 50 },
        },
      ];
      const testData = [
        {
          timestamp: '2026-10-05T00:00:00Z',
          assetId: 'SHARED_ASSET_A',
          features: { future_pressure_10s: 125, temp: 52 },
        },
      ];

      const audit = auditGroupTimeLeakage(trainData, testData);
      expect(audit.passed).toBe(false);
      expect(audit.violations.some((v) => v.ruleId === 'GROUP_LEAKAGE')).toBe(true);
      expect(audit.violations.some((v) => v.ruleId === 'TARGET_LOOKAHEAD')).toBe(true);
    });
  });

  // 5. NASA C-MAPSS Asymmetric RUL Evaluation
  describe('evaluateRulPredictions', () => {
    it('applies asymmetric penalty penalizing late predictions much more severely than early predictions', () => {
      const inputs = [
        // Early prediction: error = -10 (conservative)
        { unitId: 'TURBO_01', cycle: 100, trueRul: 50, predictedRul: 40 },
        // Late prediction: error = +10 (dangerous!)
        { unitId: 'TURBO_02', cycle: 100, trueRul: 50, predictedRul: 60 },
      ];

      const result = evaluateRulPredictions(inputs);
      expect(result.sampleCount).toBe(2);
      expect(result.earlyPredictionCount).toBe(1);
      expect(result.latePredictionCount).toBe(1);

      const earlyScore = result.records[0].cmapssScore; // exp(10/13) - 1 ~ 1.158
      const lateScore = result.records[1].cmapssScore;  // exp(10/10) - 1 ~ 1.718

      expect(lateScore).toBeGreaterThan(earlyScore);
      expect(earlyScore).toBeCloseTo(1.158, 2);
      expect(lateScore).toBeCloseTo(1.718, 2);
      expect(result.mae).toBe(10);
      expect(result.rmse).toBe(10);
    });
  });

  // 6. Multivariate Mahalanobis Distance Anomaly Detector
  describe('detectMultivariateAnomalies', () => {
    it('detects multi-sensor covariance outliers beyond Chi-Square threshold', () => {
      // Normal baseline operating points
      const normalData = [
        { timestamp: 'T1', assetId: 'PUMP_01', features: { vib: 1.0, temp: 50, press: 100 } },
        { timestamp: 'T2', assetId: 'PUMP_01', features: { vib: 1.1, temp: 51, press: 102 } },
        { timestamp: 'T3', assetId: 'PUMP_01', features: { vib: 0.9, temp: 49, press: 98 } },
        { timestamp: 'T4', assetId: 'PUMP_01', features: { vib: 1.2, temp: 52, press: 104 } },
        { timestamp: 'T5', assetId: 'PUMP_01', features: { vib: 1.0, temp: 50, press: 101 } },
      ];

      // Evaluation data including one extreme outlier
      const evalData = [
        { timestamp: 'T6', assetId: 'PUMP_01', features: { vib: 1.05, temp: 50.5, press: 101 } },
        { timestamp: 'T7', assetId: 'PUMP_01', features: { vib: 8.5, temp: 110, press: 350 } }, // Severe anomaly
      ];

      const result = detectMultivariateAnomalies(evalData, normalData, 11.34); // p=3, alpha=0.01 is 11.34
      expect(result.totalAnalyzed).toBe(2);
      expect(result.anomaliesDetected).toBe(1);
      expect(result.points[0].isAnomaly).toBe(false);
      expect(result.points[1].isAnomaly).toBe(true);
      expect(result.points[1].mahalanobisDistance).toBeGreaterThan(result.points[0].mahalanobisDistance);
    });
  });
});
