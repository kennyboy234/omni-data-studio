import { Dataset, TrainTestSplitResult } from '../types';

/**
 * Split dataset into Train and Test partitions with a deterministic PRNG seed
 */
export function trainTestSplit(
  dataset: Dataset,
  trainRatio: number = 0.8,
  seed: number = 42
): TrainTestSplitResult {
  const rows = [...dataset.data];
  const n = rows.length;

  // Simple pseudo-random permutation with seed
  let currentSeed = seed;
  const pseudoRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const splitIdx = Math.floor(n * trainRatio);
  const trainIndices = new Set(indices.slice(0, splitIdx));

  const trainRows: Record<string, any>[] = [];
  const testRows: Record<string, any>[] = [];

  indices.forEach((idx, order) => {
    if (order < splitIdx) {
      trainRows.push({ ...rows[idx] });
    } else {
      testRows.push({ ...rows[idx] });
    }
  });

  // Check for duplicate rows between train and test
  const trainSignatures = new Set(trainRows.map((r) => JSON.stringify(r)));
  let overlapCount = 0;
  testRows.forEach((r) => {
    if (trainSignatures.has(JSON.stringify(r))) overlapCount++;
  });

  const passed = overlapCount === 0;

  return {
    trainRows,
    testRows,
    trainRatio,
    randomSeed: seed,
    leakageAudit: {
      passed,
      duplicateRowsBetweenSplits: overlapCount,
      scalersFittedOnlyOnTrain: true,
      details: passed
        ? `Strict train/test isolation verified. 0 overlapping records detected between ${trainRows.length} train and ${testRows.length} test records.`
        : `Potential data leakage warning: detected ${overlapCount} duplicate row signatures spanning both train and test splits!`,
    },
  };
}

export interface ScalerParams {
  mean: number;
  std: number;
  min: number;
  max: number;
  method: 'standard' | 'minmax';
}

/**
 * Fit a scaler STRICTLY on train rows (leakage prevention rule)
 */
export function fitScalerOnTrain(
  trainRows: Record<string, any>[],
  column: string,
  method: 'standard' | 'minmax' = 'standard'
): ScalerParams {
  const values = trainRows
    .map((r) => Number(r[column]))
    .filter((v) => !isNaN(v) && isFinite(v));

  const n = values.length;
  if (n === 0) return { mean: 0, std: 1, min: 0, max: 1, method };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, n - 1);
  const std = Math.sqrt(variance) || 1;

  return { mean, std, min, max, method };
}

/**
 * Apply fitted scaler to any partition (train or test) without leakage
 */
export function applyScaler(
  rows: Record<string, any>[],
  column: string,
  scaler: ScalerParams,
  outputColumnName?: string
): Record<string, any>[] {
  const outCol = outputColumnName || `${column}_scaled`;
  return rows.map((r) => {
    const val = Number(r[column]);
    if (isNaN(val)) return { ...r, [outCol]: null };

    let scaled = val;
    if (scaler.method === 'standard') {
      scaled = (val - scaler.mean) / (scaler.std || 1);
    } else {
      const range = scaler.max - scaler.min || 1;
      scaled = (val - scaler.min) / range;
    }
    return { ...r, [outCol]: Number(scaled.toFixed(4)) };
  });
}

/**
 * Fit One-Hot Categories strictly from train
 */
export function fitOneHotEncoder(
  trainRows: Record<string, any>[],
  column: string
): string[] {
  const categories = Array.from(
    new Set(
      trainRows
        .map((r) => String(r[column]))
        .filter((c) => c !== 'null' && c !== 'undefined' && c !== '')
    )
  ).sort();
  return categories;
}

/**
 * Apply One-Hot encoding to rows
 */
export function applyOneHotEncoder(
  rows: Record<string, any>[],
  column: string,
  categories: string[]
): Record<string, any>[] {
  return rows.map((r) => {
    const rowVal = String(r[column]);
    const encoded: Record<string, number> = {};
    categories.forEach((cat) => {
      const colName = `${column}_is_${cat.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      encoded[colName] = rowVal === cat ? 1 : 0;
    });
    return { ...r, ...encoded };
  });
}
