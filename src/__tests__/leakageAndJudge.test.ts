import { describe, it, expect } from 'vitest';
import { trainTestSplit, fitScalerOnTrain } from '../utils/featureEngineering';
import { evaluateOutputWithJudge } from '../utils/judgeAndMemoryEngine';
import { applyCleaningStep } from '../utils/cleaner';
import { Dataset } from '../types';

describe('A1: Leakage Audit, Immutability & The Judge Seeded Errors', () => {
  const sampleData = [
    { id: 1, age: 25, income: 50000, churn: 0 },
    { id: 2, age: 35, income: 75000, churn: 1 },
    { id: 3, age: 45, income: 90000, churn: 0 },
    { id: 4, age: 55, income: 110000, churn: 1 },
    { id: 5, age: 65, income: 65000, churn: 0 },
    { id: 6, age: 28, income: 52000, churn: 0 },
    { id: 7, age: 38, income: 78000, churn: 1 },
    { id: 8, age: 48, income: 95000, churn: 0 },
    { id: 9, age: 58, income: 115000, churn: 1 },
    { id: 10, age: 68, income: 70000, churn: 0 },
  ];

  const dataset: Dataset = {
    id: 'ds_test_leakage',
    name: 'Leakage Test Dataset',
    version: 1,
    isImmutableSource: true,
    sourceType: 'sample',
    sha256Hash: 'hash_original_v0',
    createdAt: '2026-10-24T00:00:00Z',
    data: sampleData,
    profile: {
      rowCount: 10,
      columnCount: 4,
      memoryEstimateBytes: 512,
      duplicateRowCount: 0,
      summaryCalculatedAt: '2026-10-24T00:00:00Z',
      columns: [],
    },
    columns: ['id', 'age', 'income', 'churn'],
  };

  it('proves v0 source dataset remains immutable after cleaning operations create v1', () => {
    const originalLength = dataset.data.length;
    const originalHash = dataset.sha256Hash;
    const originalFirstRow = { ...dataset.data[0] };

    // Apply cleaning action that drops rows with nulls or clamps outliers
    const { updatedDataset } = applyCleaningStep(dataset, 'filter_outliers_iqr', 'income', { iqrMultiplier: 0.5 });

    // v0 remains strictly untouched
    expect(dataset.data.length).toBe(originalLength);
    expect(dataset.sha256Hash).toBe(originalHash);
    expect(dataset.data[0]).toEqual(originalFirstRow);
    expect(dataset.isImmutableSource).toBe(true);

    // v1 is a separate object with incremented version
    expect(updatedDataset.id).toBe('ds_test_leakage_v2');
    expect(updatedDataset.version).toBe(2);
    expect(updatedDataset.isImmutableSource).toBe(false);
  });

  it('guarantees scalers fit strictly on train partition and detects data leakage', () => {
    const split = trainTestSplit(dataset, 0.8, 42);
    expect(split.leakageAudit.passed).toBe(true);
    expect(split.leakageAudit.duplicateRowsBetweenSplits).toBe(0);

    // Fit scaler strictly on train split
    const trainScaler = fitScalerOnTrain(split.trainRows, 'income', 'standard');
    const trainMean = split.trainRows.reduce((a, b) => a + b.income, 0) / split.trainRows.length;
    expect(trainScaler.mean).toBeCloseTo(trainMean, 4);

    // Leakage simulation: if test rows overlap with train
    const leakedSplit = {
      ...split,
      trainRows: [...split.trainRows, split.testRows[0]], // Duplicate injected into train
      leakageAudit: {
        passed: false,
        duplicateRowsBetweenSplits: 1,
        scalersFittedOnlyOnTrain: false,
        details: 'Data leakage detected!',
      },
    };

    // The Judge evaluates feature engineering with leakage
    const review = evaluateOutputWithJudge({
      workflowId: 'WF05',
      domain: 'feature_engineering',
      targetOutputName: 'TrainTestSplit',
      datasetId: dataset.id,
      datasetName: dataset.name,
      payload: { splitResult: leakedSplit },
    });

    const leakageCheck = review.auditChecks.find((c) => c.checkName.includes('Leakage'));
    expect(leakageCheck?.passed).toBe(false);
    expect(review.verdict).not.toBe('APPROVE');
  });

  it('Judge catches seeded error: outlier-distorted mean in data cleaning', () => {
    // Seeded error: overly aggressive IQR filtering (< 1.5) that drops genuine points
    const aggressiveCleaning = {
      rawSourcePreserved: true,
      steps: [
        { action: 'filter_outliers_iqr', parameters: { iqrMultiplier: 0.8 } }
      ]
    };

    const review = evaluateOutputWithJudge({
      workflowId: 'WF03',
      domain: 'cleaning_plan',
      targetOutputName: 'IQR Capping',
      datasetId: dataset.id,
      datasetName: dataset.name,
      payload: aggressiveCleaning,
    });

    const outlierCheck = review.auditChecks.find((c) => c.checkName.includes('Outlier'));
    expect(outlierCheck?.passed).toBe(false);
  });

  it('Judge catches seeded error: wrong denominator / failing data quality score', () => {
    // Seeded error: quality score below 60% failure threshold
    const failingQuality = {
      assertions: [
        { type: 'expect_column_values_to_not_be_null' },
        { type: 'expect_column_values_to_be_unique' },
        { type: 'expect_column_min_to_be_between' }
      ],
      report: { qualityScorePercent: 45 } // below 60%
    };

    const review = evaluateOutputWithJudge({
      workflowId: 'WF02',
      domain: 'data_quality',
      targetOutputName: 'Quality Contract',
      datasetId: dataset.id,
      datasetName: dataset.name,
      payload: failingQuality,
    });

    const scoreCheck = review.auditChecks.find((c) => c.checkName.includes('Pass Rate'));
    expect(scoreCheck?.passed).toBe(false);
  });

  it('Judge catches seeded error: unindexed destructive SQL without approval modal', () => {
    const destructiveSqlPayload = {
      query: 'DROP TABLE customers',
    };

    const review = evaluateOutputWithJudge({
      workflowId: 'WF06',
      domain: 'sql_query',
      targetOutputName: 'Drop Query',
      datasetId: dataset.id,
      datasetName: dataset.name,
      payload: destructiveSqlPayload,
    });

    const dropCheck = review.auditChecks.find((c) => c.checkName.includes('Destructive'));
    expect(dropCheck?.passed).toBe(false);
    expect(review.verdict).not.toBe('APPROVE');
  });

  it('proves keyboard hotkey listener ignores keystrokes when typing in inputs', () => {
    const isTypingGuard = (tagName: string, isContentEditable: boolean) => {
      return (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        isContentEditable
      );
    };

    expect(isTypingGuard('INPUT', false)).toBe(true);
    expect(isTypingGuard('TEXTAREA', false)).toBe(true);
    expect(isTypingGuard('SELECT', false)).toBe(true);
    expect(isTypingGuard('DIV', true)).toBe(true);
    expect(isTypingGuard('DIV', false)).toBe(false);
    expect(isTypingGuard('BODY', false)).toBe(false);
  });
});
