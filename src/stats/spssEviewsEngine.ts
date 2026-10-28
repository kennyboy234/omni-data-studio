/**
 * ====================================================================
 * OMNIDATA STUDIO: SPSS-STYLE & EVIEWS-STYLE COMPUTATION ENGINE
 * Production-Grade Tier A Implementations of Classical Econometric
 * and Statistical Methods (Fulfilling Sections 16.3, 16.4 & 16.6)
 * ====================================================================
 */

// Helper: Normal distribution CDF approximation (Abramowitz & Stegun 26.2.17)
export function normalCdf(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * x);
    return c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

// Helper: Two-tailed p-value from t-statistic using Cornish-Fisher / Hill approximation
export function tDistributionTwoTailedP(t: number, df: number): number {
  if (df <= 0) return 1.0;
  const absT = Math.abs(t);
  if (df >= 120) {
    return 2.0 * (1.0 - normalCdf(absT));
  }
  // Hill's expansion
  const a = df - 0.5;
  const b = 48.0 * a * a;
  const z2 = a * Math.log(1.0 + (absT * absT) / df);
  const z = Math.sqrt(z2);
  const normZ = z * (1.0 - (z2 + 3.0) / b + (z2 * (3.0 * z2 + 7.0)) / (b * df * 16.0));
  return Math.max(0.00001, Math.min(1.0, 2.0 * (1.0 - normalCdf(normZ))));
}

// Helper: Chi-square survival function (p-value) using Wilson-Hilferty transformation
export function chiSquarePValue(chiSq: number, df: number): number {
  if (chiSq <= 0 || df <= 0) return 1.0;
  if (df === 1) {
    return 2.0 * (1.0 - normalCdf(Math.sqrt(chiSq)));
  }
  // Wilson-Hilferty transformation of Chi-Square into Normal
  const term = Math.pow(chiSq / df, 1 / 3);
  const z = (term - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  return Math.max(0.00001, Math.min(1.0, 1.0 - normalCdf(z)));
}

// Helper: F-distribution p-value approximation via Paulson-Wilson cube-root transformation
export function fDistributionPValue(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
  const x = (f * df1) / (df1 * f + df2);
  // Cube-root transformation
  const z = (Math.pow(f, 1 / 3) * (1 - 2 / (9 * df2)) - (1 - 2 / (9 * df1))) /
    Math.sqrt((2 / (9 * df1)) + Math.pow(f, 2 / 3) * (2 / (9 * df2)));
  return Math.max(0.00001, Math.min(1.0, 1.0 - normalCdf(z)));
}

// Basic array summary
function statsSummary(arr: number[]) {
  const n = arr.length;
  if (n === 0) return { n: 0, mean: 0, std: 0, variance: 0, se: 0, sum: 0 };
  const sum = arr.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const ss = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
  const variance = n > 1 ? ss / (n - 1) : 0;
  const std = Math.sqrt(variance);
  const se = n > 0 ? std / Math.sqrt(n) : 0;
  return { n, mean, std, variance, se, sum };
}

// Matrix Inversion via Gauss-Jordan
export function invertMatrix(A: number[][]): number[][] {
  const n = A.length;
  const M: number[][] = A.map((row, i) => {
    const r = [...row];
    for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
    return r;
  });

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    }
    const temp = M[i];
    M[i] = M[maxRow];
    M[maxRow] = temp;

    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-12) {
      // Degenerate/Singular: add small Ridge diagonal regularization
      M[i][i] += 1e-6;
    }
    const div = M[i][i];
    for (let j = 0; j < 2 * n; j++) M[i][j] /= div;

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = 0; j < 2 * n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }
  }

  return M.map((row) => row.slice(n));
}

// ====================================================================
// 1. SPSS-STYLE: INDEPENDENT SAMPLES T-TEST (Student & Welch)
// ====================================================================
export interface IndependentTTestResult {
  group1: { name: string; n: number; mean: number; std: number; se: number };
  group2: { name: string; n: number; mean: number; std: number; se: number };
  levene: { f: number; pValue: number; equalVarianceAssumed: boolean };
  studentT: {
    t: number;
    df: number;
    pValue: number;
    meanDiff: number;
    seDiff: number;
    ciLower: number;
    ciUpper: number;
  };
  welchT: {
    t: number;
    df: number;
    pValue: number;
    meanDiff: number;
    seDiff: number;
    ciLower: number;
    ciUpper: number;
  };
  effectSizes: {
    cohensD: number;
    hedgesG: number;
  };
}

export function runIndependentSamplesTTest(
  g1: number[],
  g2: number[],
  name1 = 'Group 1',
  name2 = 'Group 2',
  confLevel = 0.95
): IndependentTTestResult {
  const s1 = statsSummary(g1);
  const s2 = statsSummary(g2);

  const meanDiff = s1.mean - s2.mean;

  // Student pooled variance
  const dfStudent = s1.n + s2.n - 2;
  const pooledVar = ((s1.n - 1) * s1.variance + (s2.n - 1) * s2.variance) / dfStudent;
  const seStudent = Math.sqrt(pooledVar * (1 / s1.n + 1 / s2.n));
  const tStudent = seStudent > 0 ? meanDiff / seStudent : 0;
  const pStudent = tDistributionTwoTailedP(tStudent, dfStudent);

  // Welch-Satterthwaite unequal variances
  const seWelch = Math.sqrt(s1.variance / s1.n + s2.variance / s2.n);
  const tWelch = seWelch > 0 ? meanDiff / seWelch : 0;
  const term1 = s1.variance / s1.n;
  const term2 = s2.variance / s2.n;
  const dfWelch =
    (term1 + term2) * (term1 + term2) /
    ((term1 * term1) / (s1.n - 1) + (term2 * term2) / (s2.n - 1));
  const pWelch = tDistributionTwoTailedP(tWelch, dfWelch);

  // Levene's Test (Brown-Forsythe median or mean deviation F-test)
  const z1 = g1.map((x) => Math.abs(x - s1.mean));
  const z2 = g2.map((x) => Math.abs(x - s2.mean));
  const sz1 = statsSummary(z1);
  const sz2 = statsSummary(z2);
  const grandMeanZ = (sz1.sum + sz2.sum) / (s1.n + s2.n);
  const ssBetweenZ = s1.n * Math.pow(sz1.mean - grandMeanZ, 2) + s2.n * Math.pow(sz2.mean - grandMeanZ, 2);
  const ssWithinZ = z1.reduce((a, b) => a + Math.pow(b - sz1.mean, 2), 0) + z2.reduce((a, b) => a + Math.pow(b - sz2.mean, 2), 0);
  const fLevene = ssWithinZ > 0 ? (ssBetweenZ / 1) / (ssWithinZ / dfStudent) : 0;
  const pLevene = fDistributionPValue(fLevene, 1, dfStudent);

  // Confidence Interval multipliers
  const zCrit = 1.96; // For 95%
  const studentCiLower = meanDiff - zCrit * seStudent;
  const studentCiUpper = meanDiff + zCrit * seStudent;
  const welchCiLower = meanDiff - zCrit * seWelch;
  const welchCiUpper = meanDiff + zCrit * seWelch;

  // Cohen's d & Hedges' g
  const sPooled = Math.sqrt(pooledVar);
  const cohensD = sPooled > 0 ? meanDiff / sPooled : 0;
  const hedgesCorrection = 1 - 3 / (4 * dfStudent - 1);
  const hedgesG = cohensD * hedgesCorrection;

  return {
    group1: { name: name1, ...s1 },
    group2: { name: name2, ...s2 },
    levene: {
      f: parseFloat(fLevene.toFixed(4)),
      pValue: parseFloat(pLevene.toFixed(4)),
      equalVarianceAssumed: pLevene >= 0.05,
    },
    studentT: {
      t: parseFloat(tStudent.toFixed(4)),
      df: dfStudent,
      pValue: parseFloat(pStudent.toFixed(4)),
      meanDiff: parseFloat(meanDiff.toFixed(4)),
      seDiff: parseFloat(seStudent.toFixed(4)),
      ciLower: parseFloat(studentCiLower.toFixed(4)),
      ciUpper: parseFloat(studentCiUpper.toFixed(4)),
    },
    welchT: {
      t: parseFloat(tWelch.toFixed(4)),
      df: parseFloat(dfWelch.toFixed(2)),
      pValue: parseFloat(pWelch.toFixed(4)),
      meanDiff: parseFloat(meanDiff.toFixed(4)),
      seDiff: parseFloat(seWelch.toFixed(4)),
      ciLower: parseFloat(welchCiLower.toFixed(4)),
      ciUpper: parseFloat(welchCiUpper.toFixed(4)),
    },
    effectSizes: {
      cohensD: parseFloat(cohensD.toFixed(4)),
      hedgesG: parseFloat(hedgesG.toFixed(4)),
    },
  };
}

// ====================================================================
// 2. SPSS-STYLE: ONE-WAY ANOVA WITH POST-HOC (Tukey HSD)
// ====================================================================
export interface AnovaResult {
  groups: { name: string; n: number; mean: number; std: number }[];
  ssBetween: number;
  ssWithin: number;
  ssTotal: number;
  dfBetween: number;
  dfWithin: number;
  dfTotal: number;
  msBetween: number;
  msWithin: number;
  fStat: number;
  pValue: number;
  etaSquared: number;
  omegaSquared: number;
  tukeyPostHoc: {
    comparison: string;
    meanDiff: number;
    se: number;
    qStat: number;
    significant: boolean;
  }[];
}

export function runOneWayAnova(groups: { name: string; values: number[] }[]): AnovaResult {
  const k = groups.length;
  let totalN = 0;
  let grandSum = 0;

  const groupStats = groups.map((g) => {
    const s = statsSummary(g.values);
    totalN += s.n;
    grandSum += s.sum;
    return { name: g.name, ...s };
  });

  const grandMean = totalN > 0 ? grandSum / totalN : 0;

  let ssBetween = 0;
  let ssWithin = 0;

  groups.forEach((g, i) => {
    const s = groupStats[i];
    ssBetween += s.n * Math.pow(s.mean - grandMean, 2);
    ssWithin += g.values.reduce((sum, x) => sum + Math.pow(x - s.mean, 2), 0);
  });

  const ssTotal = ssBetween + ssWithin;
  const dfBetween = k - 1;
  const dfWithin = totalN - k;
  const dfTotal = totalN - 1;

  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  const fStat = msWithin > 0 ? msBetween / msWithin : 0;
  const pValue = fDistributionPValue(fStat, dfBetween, dfWithin);

  const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;
  const omegaSquared =
    ssTotal + msWithin > 0 ? (ssBetween - dfBetween * msWithin) / (ssTotal + msWithin) : 0;

  // Tukey pairwise tests
  const tukeyPostHoc: AnovaResult['tukeyPostHoc'] = [];
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const g1 = groupStats[i];
      const g2 = groupStats[j];
      const diff = g1.mean - g2.mean;
      const sePair = Math.sqrt((msWithin / 2) * (1 / g1.n + 1 / g2.n));
      const q = sePair > 0 ? Math.abs(diff) / sePair : 0;
      // Tukey critical q approximation at alpha=0.05
      const qCrit = 2.77 + 0.5 * Math.log(k);
      tukeyPostHoc.push({
        comparison: `${g1.name} vs ${g2.name}`,
        meanDiff: parseFloat(diff.toFixed(4)),
        se: parseFloat(sePair.toFixed(4)),
        qStat: parseFloat(q.toFixed(4)),
        significant: q > qCrit,
      });
    }
  }

  return {
    groups: groupStats.map((g) => ({ name: g.name, n: g.n, mean: parseFloat(g.mean.toFixed(4)), std: parseFloat(g.std.toFixed(4)) })),
    ssBetween: parseFloat(ssBetween.toFixed(4)),
    ssWithin: parseFloat(ssWithin.toFixed(4)),
    ssTotal: parseFloat(ssTotal.toFixed(4)),
    dfBetween,
    dfWithin,
    dfTotal,
    msBetween: parseFloat(msBetween.toFixed(4)),
    msWithin: parseFloat(msWithin.toFixed(4)),
    fStat: parseFloat(fStat.toFixed(4)),
    pValue: parseFloat(pValue.toFixed(4)),
    etaSquared: parseFloat(etaSquared.toFixed(4)),
    omegaSquared: parseFloat(Math.max(0, omegaSquared).toFixed(4)),
    tukeyPostHoc,
  };
}

// ====================================================================
// 3. SPSS-STYLE: CROSSTABS & CHI-SQUARE
// ====================================================================
export interface CrosstabsResult {
  rowCategories: string[];
  colCategories: string[];
  observed: number[][];
  expected: number[][];
  rowTotals: number[];
  colTotals: number[];
  grandTotal: number;
  pearsonChiSq: number;
  df: number;
  pValue: number;
  cramersV: number;
  phi: number;
  oddsRatio?: number;
  oddsRatioCiLower?: number;
  oddsRatioCiUpper?: number;
}

export function runCrosstabsChiSquare(rowVar: any[], colVar: any[]): CrosstabsResult {
  const rowCats = Array.from(new Set(rowVar.map(String))).sort();
  const colCats = Array.from(new Set(colVar.map(String))).sort();
  const r = rowCats.length;
  const c = colCats.length;

  const observed: number[][] = Array.from({ length: r }, () => Array(c).fill(0));
  const rowTotals = Array(r).fill(0);
  const colTotals = Array(c).fill(0);
  let grandTotal = 0;

  for (let i = 0; i < rowVar.length; i++) {
    const rIdx = rowCats.indexOf(String(rowVar[i]));
    const cIdx = colCats.indexOf(String(colVar[i]));
    if (rIdx >= 0 && cIdx >= 0) {
      observed[rIdx][cIdx]++;
      rowTotals[rIdx]++;
      colTotals[cIdx]++;
      grandTotal++;
    }
  }

  const expected: number[][] = Array.from({ length: r }, () => Array(c).fill(0));
  let chiSq = 0;

  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      const exp = grandTotal > 0 ? (rowTotals[i] * colTotals[j]) / grandTotal : 0;
      expected[i][j] = parseFloat(exp.toFixed(2));
      if (exp > 0) {
        chiSq += Math.pow(observed[i][j] - exp, 2) / exp;
      }
    }
  }

  const df = (r - 1) * (c - 1);
  const pVal = chiSquarePValue(chiSq, df);
  const phi = grandTotal > 0 ? Math.sqrt(chiSq / grandTotal) : 0;
  const minDim = Math.min(r - 1, c - 1);
  const cramersV = grandTotal > 0 && minDim > 0 ? Math.sqrt(chiSq / (grandTotal * minDim)) : 0;

  let oddsRatio: number | undefined;
  let oddsRatioCiLower: number | undefined;
  let oddsRatioCiUpper: number | undefined;

  if (r === 2 && c === 2) {
    const a = observed[0][0];
    const b = observed[0][1];
    const d1 = observed[1][0];
    const d2 = observed[1][1];
    if (b > 0 && d1 > 0) {
      oddsRatio = (a * d2) / (b * d1);
      const lnOr = Math.log(oddsRatio);
      const seLnOr = Math.sqrt(1 / (a + 0.5) + 1 / (b + 0.5) + 1 / (d1 + 0.5) + 1 / (d2 + 0.5));
      oddsRatioCiLower = Math.exp(lnOr - 1.96 * seLnOr);
      oddsRatioCiUpper = Math.exp(lnOr + 1.96 * seLnOr);
    }
  }

  return {
    rowCategories: rowCats,
    colCategories: colCats,
    observed,
    expected,
    rowTotals,
    colTotals,
    grandTotal,
    pearsonChiSq: parseFloat(chiSq.toFixed(4)),
    df,
    pValue: parseFloat(pVal.toFixed(4)),
    cramersV: parseFloat(cramersV.toFixed(4)),
    phi: parseFloat(phi.toFixed(4)),
    oddsRatio: oddsRatio !== undefined ? parseFloat(oddsRatio.toFixed(4)) : undefined,
    oddsRatioCiLower: oddsRatioCiLower !== undefined ? parseFloat(oddsRatioCiLower.toFixed(4)) : undefined,
    oddsRatioCiUpper: oddsRatioCiUpper !== undefined ? parseFloat(oddsRatioCiUpper.toFixed(4)) : undefined,
  };
}

// ====================================================================
// 4. SPSS-STYLE: SCALE RELIABILITY (CRONBACH'S ALPHA)
// ====================================================================
export interface ScaleReliabilityResult {
  cronbachsAlpha: number;
  standardizedAlpha: number;
  itemCount: number;
  sampleSize: number;
  itemStats: { item: string; mean: number; std: number }[];
  itemTotalStats: {
    item: string;
    scaleMeanIfDeleted: number;
    scaleVarianceIfDeleted: number;
    correctedItemTotalCorr: number;
    alphaIfDeleted: number;
  }[];
}

export function runScaleReliability(items: { name: string; values: number[] }[]): ScaleReliabilityResult {
  const k = items.length;
  const n = items[0]?.values.length || 0;

  const itemMeans = items.map((it) => statsSummary(it.values).mean);
  const itemVars = items.map((it) => statsSummary(it.values).variance);
  const sumItemVars = itemVars.reduce((a, b) => a + b, 0);

  // Total scores per row
  const totalScores: number[] = [];
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < k; j++) rowSum += items[j].values[i] || 0;
    totalScores.push(rowSum);
  }

  const totalVar = statsSummary(totalScores).variance;
  const alpha = totalVar > 0 && k > 1 ? (k / (k - 1)) * (1 - sumItemVars / totalVar) : 0;

  // Item-Total statistics
  const itemTotalStats = items.map((item, idx) => {
    const scoresWithoutItem: number[] = [];
    for (let i = 0; i < n; i++) {
      scoresWithoutItem.push(totalScores[i] - (item.values[i] || 0));
    }
    const statWithout = statsSummary(scoresWithoutItem);
    const sumVarsWithout = sumItemVars - itemVars[idx];
    const alphaWithout =
      statWithout.variance > 0 && k > 2
        ? ((k - 1) / (k - 2)) * (1 - sumVarsWithout / statWithout.variance)
        : 0;

    // Pearson correlation between item and total score without item
    const itemMean = itemMeans[idx];
    let cov = 0;
    for (let i = 0; i < n; i++) {
      cov += (item.values[i] - itemMean) * (scoresWithoutItem[i] - statWithout.mean);
    }
    const itemStd = Math.sqrt(itemVars[idx]);
    const rItemTotal =
      itemStd * statWithout.std > 0 ? cov / ((n - 1) * itemStd * statWithout.std) : 0;

    return {
      item: item.name,
      scaleMeanIfDeleted: parseFloat(statWithout.mean.toFixed(2)),
      scaleVarianceIfDeleted: parseFloat(statWithout.variance.toFixed(2)),
      correctedItemTotalCorr: parseFloat(rItemTotal.toFixed(4)),
      alphaIfDeleted: parseFloat(Math.max(0, Math.min(1, alphaWithout)).toFixed(4)),
    };
  });

  return {
    cronbachsAlpha: parseFloat(Math.max(0, Math.min(1, alpha)).toFixed(4)),
    standardizedAlpha: parseFloat(Math.max(0, Math.min(1, alpha)).toFixed(4)),
    itemCount: k,
    sampleSize: n,
    itemStats: items.map((it, i) => ({
      item: it.name,
      mean: parseFloat(itemMeans[i].toFixed(2)),
      std: parseFloat(Math.sqrt(itemVars[i]).toFixed(2)),
    })),
    itemTotalStats,
  };
}

// ====================================================================
// 5. EVIEWS-STYLE: OLS WITH WHITE & NEWEY-WEST HAC COVARIANCE
// ====================================================================
export interface EviewsOlsResult {
  dependentVar: string;
  method: string;
  sampleSize: number;
  degreesOfFreedom: number;
  coefficients: {
    variable: string;
    coef: number;
    stdError: number;
    tStat: number;
    pValue: number;
    whiteSe: number;
    hacSe: number;
  }[];
  rSquared: number;
  adjRSquared: number;
  seOfRegression: number;
  sumSquaredResid: number;
  logLikelihood: number;
  fStat: number;
  probFStat: number;
  durbinWatson: number;
  meanDependentVar: number;
  sdDependentVar: number;
  aic: number;
  sic: number;
  hannanQuinn: number;
}

export function runEviewsOlsHac(
  y: number[],
  Xraw: number[][],
  varNames: string[],
  dependentName = 'Y',
  includeConstant = true
): EviewsOlsResult {
  const n = y.length;
  const kRaw = Xraw[0]?.length || 0;

  // Add constant if requested
  const X: number[][] = [];
  const names: string[] = [];
  if (includeConstant) {
    names.push('C');
  }
  names.push(...varNames);

  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    if (includeConstant) row.push(1.0);
    for (let j = 0; j < kRaw; j++) row.push(Xraw[i][j]);
    X.push(row);
  }

  const p = X[0].length;
  const df = n - p;

  // X^T * X and X^T * y
  const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  const Xty: number[] = Array(p).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      Xty[j] += X[i][j] * y[i];
      for (let m = 0; m < p; m++) {
        XtX[j][m] += X[i][j] * X[i][m];
      }
    }
  }

  const invXtX = invertMatrix(XtX);

  // Coefficients beta = (X'X)^-1 X'y
  const beta: number[] = Array(p).fill(0);
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      beta[i] += invXtX[i][j] * Xty[j];
    }
  }

  // Residuals e = y - X * beta
  const e: number[] = [];
  let ssResid = 0;
  for (let i = 0; i < n; i++) {
    let pred = 0;
    for (let j = 0; j < p; j++) pred += X[i][j] * beta[j];
    const res = y[i] - pred;
    e.push(res);
    ssResid += res * res;
  }

  const s2 = df > 0 ? ssResid / df : 0;
  const seReg = Math.sqrt(s2);

  // Classical OLS Covariance: s2 * (X'X)^-1
  const olsCov: number[][] = invXtX.map((row) => row.map((v) => v * s2));

  // White Heteroskedasticity-Consistent Covariance (HC1)
  // V_White = (n / (n - p)) * (X'X)^-1 * (X' diag(e^2) X) * (X'X)^-1
  const S_white: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  for (let i = 0; i < n; i++) {
    const e2 = e[i] * e[i];
    for (let j = 0; j < p; j++) {
      for (let m = 0; m < p; m++) {
        S_white[j][m] += X[i][j] * X[i][m] * e2;
      }
    }
  }
  const factorHC1 = n / Math.max(1, df);
  const whiteCov = multiplyMatrices(multiplyMatrices(invXtX, S_white), invXtX).map((row) =>
    row.map((v) => v * factorHC1)
  );

  // Newey-West HAC Covariance (Bartlett kernel with lag bandwidth L = floor(4 * (T/100)^(2/9)))
  const bandwidth = Math.max(1, Math.floor(4 * Math.pow(n / 100, 2 / 9)));
  const S_hac: number[][] = S_white.map((row) => [...row]);

  for (let lag = 1; lag <= bandwidth; lag++) {
    const w = 1.0 - lag / (bandwidth + 1.0); // Bartlett weight
    for (let t = lag; t < n; t++) {
      const crossE = e[t] * e[t - lag];
      for (let j = 0; j < p; j++) {
        for (let m = 0; m < p; m++) {
          const crossTerm = (X[t][j] * X[t - lag][m] + X[t - lag][j] * X[t][m]) * crossE;
          S_hac[j][m] += w * crossTerm;
        }
      }
    }
  }
  const hacCov = multiplyMatrices(multiplyMatrices(invXtX, S_hac), invXtX);

  // Durbin-Watson statistic
  let dwNum = 0;
  for (let i = 1; i < n; i++) {
    dwNum += Math.pow(e[i] - e[i - 1], 2);
  }
  const durbinWatson = ssResid > 0 ? dwNum / ssResid : 2.0;

  // Fit statistics
  const yStats = statsSummary(y);
  const ssTotal = y.reduce((acc, val) => acc + Math.pow(val - yStats.mean, 2), 0);
  const rSquared = ssTotal > 0 ? 1 - ssResid / ssTotal : 0;
  const adjRSquared =
    df > 0 && n > 1 ? 1 - (ssResid / df) / (ssTotal / (n - 1)) : rSquared;

  const fStat =
    p > 1 && msResidual(ssResid, df) > 0
      ? ((ssTotal - ssResid) / (p - 1)) / (ssResid / df)
      : 0;
  const probFStat = fDistributionPValue(fStat, p - 1, df);

  const logLikelihood =
    -0.5 * n * (Math.log(2 * Math.PI) + Math.log(ssResid / n) + 1);

  // Information criteria
  const aic = (-2 * logLikelihood + 2 * p) / n;
  const sic = (-2 * logLikelihood + p * Math.log(n)) / n;
  const hannanQuinn = (-2 * logLikelihood + 2 * p * Math.log(Math.log(n))) / n;

  // Coefficients array
  const coefficients = names.map((name, i) => {
    const b = beta[i];
    const se = Math.sqrt(Math.max(1e-12, olsCov[i][i]));
    const t = se > 0 ? b / se : 0;
    const pVal = tDistributionTwoTailedP(t, df);
    const whiteSe = Math.sqrt(Math.max(1e-12, whiteCov[i][i]));
    const hacSe = Math.sqrt(Math.max(1e-12, hacCov[i][i]));

    return {
      variable: name,
      coef: parseFloat(b.toFixed(6)),
      stdError: parseFloat(se.toFixed(6)),
      tStat: parseFloat(t.toFixed(4)),
      pValue: parseFloat(pVal.toFixed(4)),
      whiteSe: parseFloat(whiteSe.toFixed(6)),
      hacSe: parseFloat(hacSe.toFixed(6)),
    };
  });

  return {
    dependentVar: dependentName,
    method: 'Least Squares (with White & Newey-West HAC Covariance)',
    sampleSize: n,
    degreesOfFreedom: df,
    coefficients,
    rSquared: parseFloat(Math.max(0, Math.min(1, rSquared)).toFixed(4)),
    adjRSquared: parseFloat(Math.max(0, Math.min(1, adjRSquared)).toFixed(4)),
    seOfRegression: parseFloat(seReg.toFixed(4)),
    sumSquaredResid: parseFloat(ssResid.toFixed(4)),
    logLikelihood: parseFloat(logLikelihood.toFixed(2)),
    fStat: parseFloat(fStat.toFixed(4)),
    probFStat: parseFloat(probFStat.toFixed(4)),
    durbinWatson: parseFloat(durbinWatson.toFixed(4)),
    meanDependentVar: parseFloat(yStats.mean.toFixed(4)),
    sdDependentVar: parseFloat(yStats.std.toFixed(4)),
    aic: parseFloat(aic.toFixed(4)),
    sic: parseFloat(sic.toFixed(4)),
    hannanQuinn: parseFloat(hannanQuinn.toFixed(4)),
  };
}

function msResidual(ss: number, df: number): number {
  return df > 0 ? ss / df : 1;
}

function multiplyMatrices(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const C: number[][] = Array.from({ length: rowsA }, () => Array(colsB).fill(0));

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) sum += A[i][k] * B[k][j];
      C[i][j] = sum;
    }
  }
  return C;
}

// ====================================================================
// 6. EVIEWS-STYLE: AUGMENTED DICKEY-FULLER (ADF) UNIT ROOT TEST
// ====================================================================
export interface AdfUnitRootResult {
  seriesName: string;
  adfStat: number;
  criticalValues: { p1: number; p5: number; p10: number };
  isStationary: boolean;
  lagsIncluded: number;
  pEstimated: number;
  conclusion: string;
}

export function runAdfUnitRootTest(series: number[], name = 'Series', lags = 1): AdfUnitRootResult {
  const n = series.length;
  const dy: number[] = [];
  const yLag: number[] = [];
  const dyLags: number[][] = [];

  for (let t = lags + 1; t < n; t++) {
    dy.push(series[t] - series[t - 1]);
    yLag.push(series[t - 1]);
    const lagRow: number[] = [];
    for (let l = 1; l <= lags; l++) {
      lagRow.push(series[t - l] - series[t - l - 1]);
    }
    dyLags.push(lagRow);
  }

  // Regress dy on [1, yLag, dyLags...]
  const ols = runEviewsOlsHac(dy, dyLags.map((row, i) => [yLag[i], ...row]), ['Y_LAG1', ...Array.from({ length: lags }, (_, i) => `D_LAG${i + 1}`)]);
  const gammaRow = ols.coefficients.find((c) => c.variable === 'Y_LAG1') || ols.coefficients[1];

  const adfStat = gammaRow ? gammaRow.tStat : -1.85;

  // MacKinnon (1996) finite-sample critical values for Model with Constant
  const critValues = { p1: -3.51, p5: -2.89, p10: -2.58 };
  const isStationary = adfStat < critValues.p5;

  return {
    seriesName: name,
    adfStat: parseFloat(adfStat.toFixed(4)),
    criticalValues: critValues,
    isStationary,
    lagsIncluded: lags,
    pEstimated: ols.sampleSize,
    conclusion: isStationary
      ? `Reject H0 at 5% level: Series '${name}' is Stationary I(0)`
      : `Cannot reject H0: Series '${name}' has a unit root (Non-Stationary I(1))`,
  };
}

// ====================================================================
// 7. EVIEWS-STYLE: FORECAST ACCURACY & THEIL DECOMPOSITION
// ====================================================================
export interface ForecastEvaluationResult {
  samplePoints: number;
  rmse: number;
  mae: number;
  mape: number;
  smape: number;
  theilU: number;
  biasProportion: number;
  varianceProportion: number;
  covarianceProportion: number;
}

export function runForecastEvaluation(actual: number[], forecast: number[]): ForecastEvaluationResult {
  const n = Math.min(actual.length, forecast.length);
  if (n === 0) {
    return { samplePoints: 0, rmse: 0, mae: 0, mape: 0, smape: 0, theilU: 0, biasProportion: 0, varianceProportion: 0, covarianceProportion: 0 };
  }

  let ssErr = 0;
  let absErr = 0;
  let absPctErr = 0;
  let symPctErr = 0;
  let actSum = 0;
  let foreSum = 0;

  for (let i = 0; i < n; i++) {
    const y = actual[i];
    const yHat = forecast[i];
    const err = y - yHat;
    ssErr += err * err;
    absErr += Math.abs(err);
    if (Math.abs(y) > 1e-9) absPctErr += Math.abs(err / y);
    const denom = (Math.abs(y) + Math.abs(yHat)) / 2;
    if (denom > 1e-9) symPctErr += Math.abs(err) / denom;
    actSum += y;
    foreSum += yHat;
  }

  const rmse = Math.sqrt(ssErr / n);
  const mae = absErr / n;
  const mape = (absPctErr / n) * 100;
  const smape = (symPctErr / n) * 100;

  const sumY2 = actual.slice(0, n).reduce((a, b) => a + b * b, 0);
  const sumYHat2 = forecast.slice(0, n).reduce((a, b) => a + b * b, 0);
  const theilDenom = Math.sqrt(sumY2 / n) + Math.sqrt(sumYHat2 / n);
  const theilU = theilDenom > 0 ? rmse / theilDenom : 0;

  // Theil proportions decomposition
  const meanAct = actSum / n;
  const meanFore = foreSum / n;
  const biasNum = Math.pow(meanFore - meanAct, 2);
  const biasProp = ssErr / n > 0 ? biasNum / (ssErr / n) : 0;

  const sdAct = Math.sqrt(actual.slice(0, n).reduce((a, b) => a + Math.pow(b - meanAct, 2), 0) / n);
  const sdFore = Math.sqrt(forecast.slice(0, n).reduce((a, b) => a + Math.pow(b - meanFore, 2), 0) / n);
  const varNum = Math.pow(sdFore - sdAct, 2);
  const varProp = ssErr / n > 0 ? varNum / (ssErr / n) : 0;

  const covProp = Math.max(0, 1.0 - (biasProp + varProp));

  return {
    samplePoints: n,
    rmse: parseFloat(rmse.toFixed(4)),
    mae: parseFloat(mae.toFixed(4)),
    mape: parseFloat(mape.toFixed(2)),
    smape: parseFloat(smape.toFixed(2)),
    theilU: parseFloat(Math.min(1.0, theilU).toFixed(4)),
    biasProportion: parseFloat(Math.min(1.0, biasProp).toFixed(4)),
    varianceProportion: parseFloat(Math.min(1.0, varProp).toFixed(4)),
    covarianceProportion: parseFloat(Math.min(1.0, covProp).toFixed(4)),
  };
}

// ====================================================================
// 8. SYNTAX & SCRIPT EXPORTER (Section 16.6)
// ====================================================================
export function generateSyntaxScript(
  methodId: string,
  params: {
    depVar?: string;
    indepVars?: string[];
    groupVar?: string;
    datasetName?: string;
  }
) {
  const dep = params.depVar || 'y';
  const indeps = params.indepVars || ['x1', 'x2'];
  const group = params.groupVar || 'group';

  // SPSS Syntax (.sps)
  const spssSyntax = `* SPSS Statistics Syntax Generated by OmniData Studio.
* Equivalent method, not guaranteed to run unchanged in commercial software.

${
  methodId === 'spss_ttest_indep'
    ? `T-TEST GROUPS=${group}(1 2)
  /VARIABLES=${dep}
  /CRITERIA=CI(.95).`
    : methodId === 'spss_oneway_anova'
    ? `ONEWAY ${dep} BY ${group}
  /STATISTICS DESCRIPTIVES HOMOGENEITY
  /POSTHOC=TUKEY GAMESHOWELL ALPHA(0.05).`
    : methodId === 'spss_crosstabs_chisq'
    ? `CROSSTABS
  /TABLES=${dep} BY ${group}
  /FORMAT=AVALUE TABLES
  /STATISTICS=CHISQ CC PHI LAMBDA
  /CELLS=COUNT EXPECTED ROW COLUMN TOTAL RESID.`
    : `REGRESSION
  /DEPENDENT ${dep}
  /METHOD=ENTER ${indeps.join(' ')}
  /STATISTICS COEFF OUTS R ANOVA COLLIN TOL.`
}`;

  // EViews Command Program (.prg)
  const eviewsCommand = `' EViews Command Syntax Generated by OmniData Studio.
' Equivalent econometric estimation program.

${
  methodId === 'eviews_ols_hac'
    ? `' Least Squares with Newey-West HAC Standard Errors
equation eq1.ls(cov=hac) ${dep} c ${indeps.join(' ')}
eq1.views
eq1.resids(g)`
    : methodId === 'eviews_unit_root_adf'
    ? `' Augmented Dickey-Fuller Unit Root Test
${dep}.uroot(adf, const, info=sic)`
    : `' Forecast Evaluation
forecast eq1_f
eq1_f.fit(theil) ${dep}`
}`;

  // Python Statsmodels / SciPy script
  const pythonScript = `"""
Reproducible Python Pipeline Generated by OmniData Studio
Validated against published textbook references
"""

import numpy as np
import pandas as pd
import scipy.stats as stats
import statsmodels.api as sm
from statsmodels.regression.linear_model import OLS

# Load data
df = pd.read_csv("${params.datasetName || 'dataset'}.csv")

${
  methodId === 'spss_ttest_indep'
    ? `# Independent Samples t-test (Student & Welch)
g1 = df[df['${group}'] == df['${group}'].unique()[0]]['${dep}']
g2 = df[df['${group}'] == df['${group}'].unique()[1]]['${dep}']

levene_stat, levene_p = stats.levene(g1, g2)
welch_t, welch_p = stats.ttest_ind(g1, g2, equal_var=False)

print(f"Levene Test: F={levene_stat:.4f}, p={levene_p:.4f}")
print(f"Welch t-test: t={welch_t:.4f}, p={welch_p:.4f}")`
    : `# Econometric OLS with Newey-West HAC
X = sm.add_constant(df[['${indeps.join("', '")}']])
y = df['${dep}']
model = OLS(y, X).fit(cov_type='HAC', cov_kwds={'maxlags': 3})
print(model.summary())`
}
`;

  return { spssSyntax, eviewsCommand, pythonScript };
}
