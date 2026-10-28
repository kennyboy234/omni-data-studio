import { CorrelationCell, Dataset, HypothesisTestResult } from '../types';

/**
 * Standard normal error function approximation
 */
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
  return sign * y;
}

/**
 * P-value approximation for Student's T distribution
 */
function tDistributionPValue(t: number, df: number): number {
  const absT = Math.abs(t);
  if (df <= 0) return 1.0;
  // For df >= 30, use standard normal approximation
  if (df >= 30) {
    const z = absT;
    const normalCdf = 0.5 * (1 + erf(z / Math.SQRT2));
    return Math.max(0.0001, Number((2 * (1 - normalCdf)).toFixed(4)));
  }
  // Hill's approximation for moderate df
  const x = df / (df + absT * absT);
  const p = 0.5 * Math.pow(x, df / 2);
  return Math.max(0.0001, Math.min(1.0, Number((2 * p).toFixed(4))));
}

/**
 * P-value approximation for Chi-Square distribution
 */
function chiSquarePValue(chiSq: number, df: number): number {
  if (chiSq <= 0 || df <= 0) return 1.0;
  // Wilson-Hilferty transformation to standard normal
  const s = Math.sqrt(2 / (9 * df));
  const z = (Math.pow(chiSq / df, 1 / 3) - (1 - 2 / (9 * df))) / s;
  const normalCdf = 0.5 * (1 + erf(z / Math.SQRT2));
  return Math.max(0.0001, Math.min(1.0, Number((1 - normalCdf).toFixed(4))));
}

/**
 * P-value approximation for F distribution (ANOVA)
 */
function fDistributionPValue(F: number, df1: number, df2: number): number {
  if (F <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
  // Approximate using standard Fisher transformation
  const z = (Math.log(Math.max(0.0001, F)) - (1 / df1 - 1 / df2)) / Math.sqrt(2 / df1 + 2 / df2);
  const normalCdf = 0.5 * (1 + erf(z / Math.SQRT2));
  return Math.max(0.0001, Math.min(1.0, Number((1 - normalCdf).toFixed(4))));
}

/**
 * Calculate Pearson correlation between two numeric arrays
 */
export function calculatePearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return Number((num / den).toFixed(3));
}

/**
 * Calculate Spearman rank correlation
 */
export function calculateSpearman(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  const getRanks = (arr: number[]) => {
    const indexed = arr.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => a.val - b.val);
    const ranks = new Array(n);
    for (let i = 0; i < n; i++) {
      ranks[indexed[i].idx] = i + 1;
    }
    return ranks;
  };

  const rankX = getRanks(x);
  const rankY = getRanks(y);
  return calculatePearson(rankX, rankY);
}

/**
 * Compute full correlation matrix for all numeric columns in dataset
 */
export function computeCorrelationMatrix(dataset: Dataset): {
  columns: string[];
  matrix: CorrelationCell[][];
} {
  const numericCols = dataset.profile.columns
    .filter((c) => c.type === 'integer' || c.type === 'float')
    .map((c) => c.name);

  const matrix: CorrelationCell[][] = [];

  for (let i = 0; i < numericCols.length; i++) {
    const row: CorrelationCell[] = [];
    const colA = numericCols[i];

    for (let j = 0; j < numericCols.length; j++) {
      const colB = numericCols[j];
      if (i === j) {
        row.push({ colA, colB, pearson: 1.0, spearman: 1.0 });
        continue;
      }

      // Filter paired valid numbers
      const pairs = dataset.data
        .map((r) => [Number(r[colA]), Number(r[colB])])
        .filter(([a, b]) => !isNaN(a) && !isNaN(b) && isFinite(a) && isFinite(b));

      const x = pairs.map((p) => p[0]);
      const y = pairs.map((p) => p[1]);

      const pearson = calculatePearson(x, y);
      const spearman = calculateSpearman(x, y);
      row.push({ colA, colB, pearson, spearman });
    }
    matrix.push(row);
  }

  return { columns: numericCols, matrix };
}

/**
 * Execute Two-Sample Student's/Welch's T-Test
 */
export function runTwoSampleTTest(
  dataset: Dataset,
  numericCol: string,
  binaryGroupCol: string
): HypothesisTestResult {
  const rows = dataset.data.filter(
    (r) =>
      r[numericCol] !== null &&
      r[numericCol] !== undefined &&
      !isNaN(Number(r[numericCol])) &&
      r[binaryGroupCol] !== null &&
      r[binaryGroupCol] !== undefined
  );

  const groups = Array.from(new Set(rows.map((r) => String(r[binaryGroupCol])))).slice(0, 2);
  const groupA = rows.filter((r) => String(r[binaryGroupCol]) === groups[0]).map((r) => Number(r[numericCol]));
  const groupB = rows.filter((r) => String(r[binaryGroupCol]) === groups[1]).map((r) => Number(r[numericCol]));

  const nA = groupA.length;
  const nB = groupB.length;

  if (nA < 2 || nB < 2) {
    return {
      testType: 't_test_two_sample',
      name: `Two-Sample T-Test: ${numericCol} by ${binaryGroupCol}`,
      hypothesis: {
        nullHypothesis: `Mean of ${numericCol} is identical across ${groups[0] || 'A'} and ${groups[1] || 'B'}.`,
        altHypothesis: `Mean of ${numericCol} differs significantly across ${groups[0] || 'A'} and ${groups[1] || 'B'}.`,
      },
      targetColumn: numericCol,
      groupColumn: binaryGroupCol,
      statisticName: 't-statistic',
      statisticValue: 0,
      pValue: 1.0,
      degreesOfFreedom: 0,
      alpha: 0.05,
      conclusion: 'fail_to_reject_null',
      interpretation: 'Insufficient sample size in one or both subgroups to evaluate t-test.',
    };
  }

  const meanA = groupA.reduce((a, b) => a + b, 0) / nA;
  const meanB = groupB.reduce((a, b) => a + b, 0) / nB;

  const varA = groupA.reduce((acc, v) => acc + Math.pow(v - meanA, 2), 0) / (nA - 1);
  const varB = groupB.reduce((acc, v) => acc + Math.pow(v - meanB, 2), 0) / (nB - 1);

  // Welch's t-test
  const se = Math.sqrt(varA / nA + varB / nB);
  const tStat = se > 0 ? (meanA - meanB) / se : 0;

  // Welch–Satterthwaite degrees of freedom
  const numDf = Math.pow(varA / nA + varB / nB, 2);
  const denDf = Math.pow(varA / nA, 2) / (nA - 1) + Math.pow(varB / nB, 2) / (nB - 1);
  const df = denDf > 0 ? Math.round(numDf / denDf) : nA + nB - 2;

  const pVal = tDistributionPValue(tStat, df);
  const reject = pVal < 0.05;

  return {
    testType: 't_test_two_sample',
    name: `Welch's Two-Sample T-Test: ${numericCol} by ${binaryGroupCol}`,
    hypothesis: {
      nullHypothesis: `H₀: μ(${groups[0]}) = μ(${groups[1]}) (No difference in mean ${numericCol}).`,
      altHypothesis: `H₁: μ(${groups[0]}) ≠ μ(${groups[1]}) (Significant mean divergence).`,
    },
    targetColumn: numericCol,
    groupColumn: binaryGroupCol,
    statisticName: 'Welch t-stat',
    statisticValue: Number(tStat.toFixed(3)),
    pValue: pVal,
    degreesOfFreedom: df,
    alpha: 0.05,
    conclusion: reject ? 'reject_null' : 'fail_to_reject_null',
    interpretation: reject
      ? `Statistically significant difference detected (p = ${pVal} < 0.05). Subgroup "${groups[0]}" (mean: ${meanA.toFixed(2)}) differs from "${groups[1]}" (mean: ${meanB.toFixed(2)}).`
      : `No statistically significant difference observed (p = ${pVal} ≥ 0.05). Variations between groups are consistent with random fluctuation.`,
  };
}

/**
 * Execute Chi-Square Test of Independence for two categorical columns
 */
export function runChiSquareTest(
  dataset: Dataset,
  catColA: string,
  catColB: string
): HypothesisTestResult {
  const rows = dataset.data.filter(
    (r) => r[catColA] !== null && r[catColB] !== null && r[catColA] !== '' && r[catColB] !== ''
  );

  const valuesA = Array.from(new Set(rows.map((r) => String(r[catColA]))));
  const valuesB = Array.from(new Set(rows.map((r) => String(r[catColB]))));

  const totalN = rows.length;
  if (valuesA.length < 2 || valuesB.length < 2 || totalN < 10) {
    return {
      testType: 'chi_square_independence',
      name: `Chi-Square Test: ${catColA} ⨉ ${catColB}`,
      hypothesis: {
        nullHypothesis: `${catColA} and ${catColB} are mutually independent.`,
        altHypothesis: `${catColA} and ${catColB} exhibit a significant association.`,
      },
      targetColumn: catColA,
      secondaryColumn: catColB,
      statisticName: 'χ² statistic',
      statisticValue: 0,
      pValue: 1.0,
      degreesOfFreedom: 0,
      alpha: 0.05,
      conclusion: 'fail_to_reject_null',
      interpretation: 'Insufficient categorical variations to compute contingency table.',
    };
  }

  // Build observed frequency matrix
  const observed: Record<string, Record<string, number>> = {};
  const rowSums: Record<string, number> = {};
  const colSums: Record<string, number> = {};

  valuesA.forEach((a) => {
    observed[a] = {};
    valuesB.forEach((b) => {
      observed[a][b] = 0;
    });
  });

  rows.forEach((r) => {
    const a = String(r[catColA]);
    const b = String(r[catColB]);
    observed[a][b] = (observed[a][b] || 0) + 1;
    rowSums[a] = (rowSums[a] || 0) + 1;
    colSums[b] = (colSums[b] || 0) + 1;
  });

  let chiSq = 0;
  valuesA.forEach((a) => {
    valuesB.forEach((b) => {
      const exp = (rowSums[a] * colSums[b]) / totalN;
      if (exp > 0) {
        const obs = observed[a][b];
        chiSq += Math.pow(obs - exp, 2) / exp;
      }
    });
  });

  const df = (valuesA.length - 1) * (valuesB.length - 1);
  const pVal = chiSquarePValue(chiSq, df);
  const reject = pVal < 0.05;

  return {
    testType: 'chi_square_independence',
    name: `Chi-Square Test of Independence: ${catColA} ⨉ ${catColB}`,
    hypothesis: {
      nullHypothesis: `H₀: ${catColA} and ${catColB} are completely independent.`,
      altHypothesis: `H₁: There is a statistically significant dependency between ${catColA} and ${catColB}.`,
    },
    targetColumn: catColA,
    secondaryColumn: catColB,
    statisticName: 'χ² stat',
    statisticValue: Number(chiSq.toFixed(3)),
    pValue: pVal,
    degreesOfFreedom: df,
    alpha: 0.05,
    conclusion: reject ? 'reject_null' : 'fail_to_reject_null',
    interpretation: reject
      ? `Strong statistical association identified (χ² = ${chiSq.toFixed(2)}, df = ${df}, p = ${pVal} < 0.05). Category distributions are non-randomly correlated.`
      : `Variables appear independent (χ² = ${chiSq.toFixed(2)}, p = ${pVal} ≥ 0.05). No evidence of systematic co-occurrence.`,
  };
}

/**
 * Generate frequency distribution histogram bins
 */
export function generateHistogramBins(
  numbers: number[],
  binCount: number = 10
): { binLabel: string; count: number; min: number; max: number }[] {
  if (numbers.length === 0) return [];
  const valid = numbers.filter((n) => !isNaN(n) && isFinite(n)).sort((a, b) => a - b);
  if (valid.length === 0) return [];

  const min = valid[0];
  const max = valid[valid.length - 1];
  if (min === max) {
    return [{ binLabel: `${min}`, count: valid.length, min, max }];
  }

  const range = max - min;
  const binWidth = range / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => {
    const bMin = min + i * binWidth;
    const bMax = i === binCount - 1 ? max : min + (i + 1) * binWidth;
    return {
      binLabel: `${bMin.toFixed(1)}-${bMax.toFixed(1)}`,
      min: bMin,
      max: bMax,
      count: 0,
    };
  });

  valid.forEach((num) => {
    for (let i = 0; i < bins.length; i++) {
      if (num >= bins[i].min && (i === bins.length - 1 ? num <= bins[i].max : num < bins[i].max)) {
        bins[i].count++;
        break;
      }
    }
  });

  return bins;
}
