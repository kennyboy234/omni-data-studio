import { describe, it, expect } from 'vitest';
import { calculatePearson, calculateSpearman, runTwoSampleTTest } from '../utils/stats';
import {
  runOneWayAnova,
  runCrosstabsChiSquare,
  runScaleReliability,
  runAdfUnitRootTest,
  runForecastEvaluation,
  runEviewsOlsHac,
} from '../stats/spssEviewsEngine';
import { Dataset } from '../types';

describe('A1: Statistical Analysis & Hypothesis Testing', () => {
  it('calculates Pearson correlation coefficient matching textbook worked example', () => {
    // Textbook dataset: x = [1, 2, 3, 4, 5], y = [2, 4, 6, 8, 10] -> perfect r = 1.0
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    const r = calculatePearson(x, y);
    expect(r).toBe(1.0);

    // Negative correlation: y = [10, 8, 6, 4, 2] -> r = -1.0
    const yNeg = [10, 8, 6, 4, 2];
    expect(calculatePearson(x, yNeg)).toBe(-1.0);
  });

  it('calculates Spearman rank correlation coefficient for monotonic nonlinear data', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [1, 8, 27, 64, 125]; // cubic function, non-linear but strictly monotonic
    const spearman = calculateSpearman(x, y);
    expect(spearman).toBe(1.0);
  });

  it('evaluates Welch Two-Sample T-Test with unequal variances', () => {
    const mockDataset: Dataset = {
      id: 'test_ds',
      name: 'Test Dataset',
      version: 1,
      isImmutableSource: true,
      sourceType: 'sample',
      sha256Hash: 'testhash',
      createdAt: '2026-10-24T00:00:00Z',
      data: [
        { score: 20, group: 'A' },
        { score: 22, group: 'A' },
        { score: 19, group: 'A' },
        { score: 24, group: 'A' },
        { score: 25, group: 'A' },
        { score: 10, group: 'B' },
        { score: 12, group: 'B' },
        { score: 11, group: 'B' },
        { score: 14, group: 'B' },
        { score: 13, group: 'B' },
      ],
      profile: {
        rowCount: 10,
        columnCount: 2,
        memoryEstimateBytes: 256,
        duplicateRowCount: 0,
        summaryCalculatedAt: '2026-10-24T00:00:00Z',
        columns: [],
      },
      columns: ['score', 'group'],
    };

    const result = runTwoSampleTTest(mockDataset, 'score', 'group');
    expect(result.testType).toBe('t_test_two_sample');
    expect(result.statisticValue).toBeGreaterThan(5.0); // Large separation between Group A (mean=22) and Group B (mean=12)
    expect(result.pValue).toBeLessThan(0.005);
    expect(result.conclusion).toBe('reject_null');
    expect(result.degreesOfFreedom).toBeGreaterThan(0);
  });

  it('evaluates One-Way ANOVA across multiple categorical cohorts', () => {
    const groups = [
      { name: 'ctrl', values: [50, 52, 49] },
      { name: 'trt1', values: [75, 77, 74] },
      { name: 'trt2', values: [95, 98, 92] },
    ];

    const result = runOneWayAnova(groups);
    expect(result.fStat).toBeGreaterThan(100.0); // Extreme between-group separation
    expect(result.pValue).toBeLessThan(0.001);
    expect(result.etaSquared).toBeGreaterThan(0.95);
    expect(result.tukeyPostHoc.length).toBe(3); // 3 pairwise comparisons
  });

  it('computes Chi-Square and Cramer\'s V measure of nominal association', () => {
    // 2x2 contingency table: perfect association
    const row = ['A', 'A', 'A', 'B', 'B', 'B'];
    const col = ['X', 'X', 'X', 'Y', 'Y', 'Y'];
    const result = runCrosstabsChiSquare(row, col);
    expect(result.pearsonChiSq).toBe(6.0);
    expect(result.cramersV).toBe(1.0); // Perfect association
    expect(result.df).toBe(1);
    expect(result.pValue).toBeLessThan(0.05);
  });

  it('computes Cronbach\'s alpha scale reliability with item-total correlations', () => {
    // High internal consistency test items
    const items = [
      { name: 'Q1', values: [5, 4, 5, 4, 5, 2, 1, 2] },
      { name: 'Q2', values: [5, 5, 4, 4, 5, 2, 1, 1] },
      { name: 'Q3', values: [4, 5, 5, 4, 4, 1, 2, 2] },
      { name: 'Q4', values: [5, 4, 4, 5, 5, 2, 2, 1] },
    ];
    const result = runScaleReliability(items);
    expect(result.cronbachsAlpha).toBeGreaterThan(0.9); // High internal consistency
    expect(result.itemTotalStats.length).toBe(4);
    expect(result.itemTotalStats[0].correctedItemTotalCorr).toBeGreaterThan(0.7);
  });

  it('evaluates Augmented Dickey-Fuller (ADF) stationarity test against MacKinnon critical values', () => {
    // Mean-reverting stationary series (white noise + AR(1) stationary)
    const stationarySeries = [
      0.1, -0.2, 0.4, -0.3, 0.5, -0.4, 0.2, -0.1, 0.3, -0.5,
      0.2, -0.3, 0.1, -0.2, 0.4, -0.1, 0.3, -0.4, 0.2, -0.1,
      0.3, -0.2, 0.4, -0.3, 0.5, -0.4, 0.1, -0.2, 0.3, -0.1
    ];
    const result = runAdfUnitRootTest(stationarySeries, 'StationarySeries', 1);
    expect(result.criticalValues.p5).toBe(-2.89);
    expect(result.criticalValues.p1).toBe(-3.51);
    expect(result.adfStat).toBeLessThan(0); // Negative test statistic
  });

  it('computes Forecast Accuracy and Theil Inequality Coefficient U bounded in [0, 1]', () => {
    const actual = [100, 105, 110, 115, 120, 125, 130];
    const forecast = [102, 104, 112, 114, 121, 123, 131]; // Very close predictions
    const evalRes = runForecastEvaluation(actual, forecast);

    expect(evalRes.rmse).toBeGreaterThan(0);
    expect(evalRes.theilU).toBeGreaterThan(0);
    expect(evalRes.theilU).toBeLessThan(0.05); // Outstanding accuracy (U close to 0)
    // Decompositions sum to ~1.0
    const sumProportions = evalRes.biasProportion + evalRes.varianceProportion + evalRes.covarianceProportion;
    expect(sumProportions).toBeCloseTo(1.0, 1);
  });

  it('computes OLS regression with White and Newey-West HAC covariance matrices', () => {
    const y = [10, 12, 15, 18, 20, 22, 25, 28, 30, 32];
    const X = [
      [1], [2], [3], [4], [5], [6], [7], [8], [9], [10]
    ];
    const regRes = runEviewsOlsHac(y, X, ['X1']);

    expect(regRes.rSquared).toBeGreaterThan(0.98); // High linear fit
    expect(regRes.coefficients.length).toBe(2); // Intercept + X1
    const x1Coef = regRes.coefficients.find((c) => c.variable === 'X1');
    expect(x1Coef?.coef).toBeCloseTo(2.47, 1);
    expect(x1Coef?.whiteSe).toBeGreaterThan(0);
    expect(x1Coef?.hacSe).toBeGreaterThan(0);
  });
});
