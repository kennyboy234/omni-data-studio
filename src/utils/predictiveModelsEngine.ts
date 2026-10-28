/**
 * ====================================================================
 * OMNIDATA INDUSTRIAL AUTONOMY: PREDICTIVE MODELS & DRIFT ENGINE
 * Phase D (Sections 4.1, 4.6):
 * 1. Population Stability Index (PSI)
 * 2. Two-Sample Kolmogorov-Smirnov (KS) Drift Test
 * 3. Page-Hinkley Streaming Concept Drift Detector
 * 4. Group & Time Leakage Audit Rule for Industrial Time-Series
 * 5. NASA C-MAPSS Asymmetric Remaining Useful Life (RUL) Evaluation
 * 6. Multivariate Mahalanobis Distance Anomaly Detector
 * ====================================================================
 */

import {
  PsiResult,
  PsiBin,
  KolmogorovSmirnovResult,
  PageHinkleyResult,
  PageHinkleyPoint,
  GroupTimeLeakageAuditResult,
  LeakageViolation,
  RulEvaluationResult,
  RulPredictionRecord,
  MultivariateAnomalyResult,
  AnomalyScorePoint,
} from '../types/industrial';

// ====================================================================
// 1. POPULATION STABILITY INDEX (PSI)
// Textbook / Basel Accord Credit & Industrial Drift Standard
// ====================================================================

export function calculatePSI(
  baseline: number[],
  target: number[],
  numBins = 10,
  metricName = 'sensor_telemetry'
): PsiResult {
  if (baseline.length === 0 || target.length === 0) {
    return {
      metricName,
      psi: 0,
      driftLevel: 'STABLE',
      recommendation: 'Insufficient data for PSI evaluation.',
      bins: [],
      baselineSampleSize: baseline.length,
      targetSampleSize: target.length,
    };
  }

  // Sort baseline to determine quantile bin cutoffs
  const sortedBase = [...baseline].sort((a, b) => a - b);
  const cutoffs: number[] = [];
  const baseCount = sortedBase.length;

  for (let i = 1; i < numBins; i++) {
    const idx = Math.min(Math.floor((i / numBins) * baseCount), baseCount - 1);
    cutoffs.push(sortedBase[idx]);
  }

  // Define bins: [-Infinity, cutoffs[0]), [cutoffs[0], cutoffs[1]), ..., [cutoffs[last], Infinity]
  const bins: PsiBin[] = [];
  let totalPsi = 0;
  const eps = 1e-6; // Laplace smoothing to prevent division by zero or ln(0)

  for (let b = 0; b < numBins; b++) {
    const lower = b === 0 ? -Infinity : cutoffs[b - 1];
    const upper = b === numBins - 1 ? Infinity : cutoffs[b];

    const bCount = baseline.filter((x) =>
      b === 0 ? x < upper : b === numBins - 1 ? x >= lower : x >= lower && x < upper
    ).length;

    const tCount = target.filter((x) =>
      b === 0 ? x < upper : b === numBins - 1 ? x >= lower : x >= lower && x < upper
    ).length;

    const basePct = Math.max(eps, bCount / baseline.length);
    const targetPct = Math.max(eps, tCount / target.length);

    // PSI contribution: (Target% - Base%) * ln(Target% / Base%)
    const contribution = (targetPct - basePct) * Math.log(targetPct / basePct);
    totalPsi += contribution;

    bins.push({
      binIndex: b + 1,
      lowerBound: Number.isFinite(lower) ? Number(lower.toFixed(3)) : -999999,
      upperBound: Number.isFinite(upper) ? Number(upper.toFixed(3)) : 999999,
      baselineCount: bCount,
      targetCount: tCount,
      baselinePct: Number(basePct.toFixed(4)),
      targetPct: Number(targetPct.toFixed(4)),
      psiContribution: Number(contribution.toFixed(5)),
    });
  }

  totalPsi = Math.max(0, Number(totalPsi.toFixed(4)));

  let driftLevel: 'STABLE' | 'MODERATE_DRIFT' | 'SIGNIFICANT_DRIFT' = 'STABLE';
  let recommendation = 'Distribution is stable. Predictive models retain statistical validity.';

  if (totalPsi >= 0.25) {
    driftLevel = 'SIGNIFICANT_DRIFT';
    recommendation =
      'CRITICAL: Severe population drift detected (PSI >= 0.25). Immediate model retraining and sensor recalibration required.';
  } else if (totalPsi >= 0.1) {
    driftLevel = 'MODERATE_DRIFT';
    recommendation =
      'WARNING: Moderate population shift detected (0.10 <= PSI < 0.25). Schedule model validation and monitor closely.';
  }

  return {
    metricName,
    psi: totalPsi,
    driftLevel,
    recommendation,
    bins,
    baselineSampleSize: baseline.length,
    targetSampleSize: target.length,
  };
}

// ====================================================================
// 2. TWO-SAMPLE KOLMOGOROV-SMIRNOV (KS) DRIFT TEST
// Non-parametric goodness-of-fit comparing continuous CDFs
// ====================================================================

export function calculateTwoSampleKS(
  baseline: number[],
  target: number[],
  alpha = 0.05,
  featureName = 'continuous_feature'
): KolmogorovSmirnovResult {
  const n1 = baseline.length;
  const n2 = target.length;

  if (n1 === 0 || n2 === 0) {
    return {
      featureName,
      ksStatisticD: 0,
      criticalValueD: 0,
      pValue: 1.0,
      alpha,
      driftDetected: false,
      baselineSize: n1,
      targetSize: n2,
      maxDiscrepancyX: 0,
    };
  }

  const s1 = [...baseline].sort((a, b) => a - b);
  const s2 = [...target].sort((a, b) => a - b);

  // Pool all distinct values to evaluate empirical CDF supremum
  const allValues = Array.from(new Set([...s1, ...s2])).sort((a, b) => a - b);

  let maxD = 0;
  let maxX = allValues[0] || 0;
  let idx1 = 0;
  let idx2 = 0;

  for (const x of allValues) {
    while (idx1 < n1 && s1[idx1] <= x) idx1++;
    while (idx2 < n2 && s2[idx2] <= x) idx2++;

    const cdf1 = idx1 / n1;
    const cdf2 = idx2 / n2;
    const diff = Math.abs(cdf1 - cdf2);

    if (diff > maxD) {
      maxD = diff;
      maxX = x;
    }
  }

  // Critical value for two-sample KS test: c(alpha) * sqrt((n1 + n2) / (n1 * n2))
  // c(0.05) ~ 1.358, c(0.01) ~ 1.628, general: sqrt(-0.5 * ln(alpha / 2))
  const cAlpha = Math.sqrt(-0.5 * Math.log(alpha / 2));
  const critD = cAlpha * Math.sqrt((n1 + n2) / (n1 * n2));

  let pVal = 1.0;
  if (maxD > 0) {
    const en = Math.sqrt((n1 * n2) / (n1 + n2));
    const lambda = (en + 0.12 + 0.11 / en) * maxD;
    pVal = 0;
    for (let k = 1; k <= 50; k++) {
      const term = 2 * Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
      pVal += term;
      if (Math.abs(term) < 1e-10) break;
    }
    pVal = Math.max(0, Math.min(1, pVal));
  }

  const driftDetected = maxD > 0 && (maxD > critD || pVal < alpha);


  return {
    featureName,
    ksStatisticD: Number(maxD.toFixed(5)),
    criticalValueD: Number(critD.toFixed(5)),
    pValue: Number(pVal.toFixed(6)),
    alpha,
    driftDetected,
    baselineSize: n1,
    targetSize: n2,
    maxDiscrepancyX: Number(maxX.toFixed(4)),
  };
}

// ====================================================================
// 3. PAGE-HINKLEY STREAMING CONCEPT DRIFT DETECTOR
// Sequential test on model residuals / telemetry error streams
// ====================================================================

export function detectPageHinkley(
  residuals: { timestamp?: string; error: number }[],
  deltaBias = 0.05,
  thresholdLambda = 35
): PageHinkleyResult {
  const points: PageHinkleyPoint[] = [];
  const alarmIndices: number[] = [];

  let runningSum = 0;
  let cumulativeU = 0;
  let minU = 0;

  for (let i = 0; i < residuals.length; i++) {
    const err = residuals[i].error;
    runningSum += err;
    const runningMean = runningSum / (i + 1);

    // Update cumulative deviation: U_t = sum(e_i - mean_i - delta)
    cumulativeU += err - runningMean - deltaBias;
    if (cumulativeU < minU) {
      minU = cumulativeU;
    }

    const phStat = Math.max(0, cumulativeU - minU);
    const isAlarm = phStat > thresholdLambda;

    if (isAlarm) {
      alarmIndices.push(i);
      // Reset detector after alarm to monitor for subsequent drift bursts
      minU = cumulativeU;
    }

    points.push({
      index: i,
      timestamp: residuals[i].timestamp || `T+${i}s`,
      residual: Number(err.toFixed(4)),
      cumulativeU: Number(cumulativeU.toFixed(4)),
      phStatistic: Number(phStat.toFixed(4)),
      isDriftAlarm: isAlarm,
    });
  }

  return {
    driftDetected: alarmIndices.length > 0,
    driftCount: alarmIndices.length,
    alarmIndices,
    firstAlarmIndex: alarmIndices.length > 0 ? alarmIndices[0] : null,
    deltaBias,
    thresholdLambda,
    points,
  };
}

// ====================================================================
// 4. GROUP & TIME LEAKAGE AUDITOR
// Enforces chronological validation & group split isolation
// ====================================================================

export function auditGroupTimeLeakage(
  trainData: { timestamp: string; assetId: string; features: Record<string, any> }[],
  testData: { timestamp: string; assetId: string; features: Record<string, any> }[]
): GroupTimeLeakageAuditResult {
  const violations: LeakageViolation[] = [];

  const trainTimes = trainData.map((d) => new Date(d.timestamp).getTime()).filter((t) => !isNaN(t));
  const testTimes = testData.map((d) => new Date(d.timestamp).getTime()).filter((t) => !isNaN(t));

  const trainMinTime = trainTimes.length > 0 ? Math.min(...trainTimes) : 0;
  const trainMaxTime = trainTimes.length > 0 ? Math.max(...trainTimes) : 0;
  const testMinTime = testTimes.length > 0 ? Math.min(...testTimes) : 0;
  const testMaxTime = testTimes.length > 0 ? Math.max(...testTimes) : 0;

  const trainGroups = Array.from(new Set(trainData.map((d) => d.assetId)));
  const testGroups = Array.from(new Set(testData.map((d) => d.assetId)));

  // Rule 1: Chronological Order Violation
  if (testMinTime < trainMaxTime && testTimes.length > 0 && trainTimes.length > 0) {
    const overlappingRecords = testData.filter(
      (d) => new Date(d.timestamp).getTime() <= trainMaxTime
    ).length;

    violations.push({
      ruleId: 'TIME_ORDER_VIOLATION',
      severity: 'CRITICAL_LEAKAGE',
      description:
        'Test split timestamps precede or overlap train split timestamps. Random splitting on time-series telemetry causes lookahead leakage and false high accuracy.',
      affectedRecords: overlappingRecords,
      evidence: `Train window: [${new Date(trainMinTime).toISOString()} -> ${new Date(trainMaxTime).toISOString()}], Test start: ${new Date(testMinTime).toISOString()}`,
    });
  }

  // Rule 2: Group Leakage (Same asset / machine ID present in both train & test)
  const sharedGroups = trainGroups.filter((g) => testGroups.includes(g));
  if (sharedGroups.length > 0) {
    const affectedTestRecords = testData.filter((d) => sharedGroups.includes(d.assetId)).length;
    violations.push({
      ruleId: 'GROUP_LEAKAGE',
      severity: 'WARNING',
      description:
        'Identical asset or vehicle IDs appear in both train and test partitions. Generalization error to unseen machinery cannot be verified without GroupKFold.',
      affectedRecords: affectedTestRecords,
      evidence: `Shared Asset IDs: ${sharedGroups.join(', ')}`,
    });
  }

  // Rule 3: Lookahead Feature Name Leakage
  const suspectFeatureKeys = ['future_', 'lead_', 'next_', 'target_next', 'label_future'];
  const leakingFeatures: string[] = [];

  const sampleFeatures = trainData[0]?.features || {};
  for (const key of Object.keys(sampleFeatures)) {
    const lower = key.toLowerCase();
    if (suspectFeatureKeys.some((s) => lower.includes(s))) {
      leakingFeatures.push(key);
    }
  }

  if (leakingFeatures.length > 0) {
    violations.push({
      ruleId: 'TARGET_LOOKAHEAD',
      severity: 'CRITICAL_LEAKAGE',
      description: 'Feature dictionary contains explicit future look-ahead or forward-lead metrics.',
      affectedRecords: trainData.length + testData.length,
      evidence: `Leaking features: ${leakingFeatures.join(', ')}`,
    });
  }

  const passed = violations.length === 0;
  const recommendation = passed
    ? 'Temporal and group boundaries are strictly isolated. No data leakage detected.'
    : `AUDIT REJECTED: Found ${violations.length} leakage violation(s). Replace with TimeSeriesSplit or GroupKFold immediately.`;

  return {
    passed,
    violations,
    trainSplitInfo: {
      startTime: new Date(trainMinTime).toISOString(),
      endTime: new Date(trainMaxTime).toISOString(),
      totalRecords: trainData.length,
      groupIds: trainGroups,
    },
    testSplitInfo: {
      startTime: new Date(testMinTime).toISOString(),
      endTime: new Date(testMaxTime).toISOString(),
      totalRecords: testData.length,
      groupIds: testGroups,
    },
    recommendation,
  };
}

// ====================================================================
// 5. NASA C-MAPSS ASYMMETRIC REMAINING USEFUL LIFE (RUL) EVALUATOR
// Penalizes late predictions (catastrophic in-flight failure) > early predictions
// d = predicted - true
// if d < 0: S_i = exp(-d / 13) - 1
// if d >= 0: S_i = exp(d / 10) - 1
// ====================================================================

export function evaluateRulPredictions(
  inputs: { unitId: string; cycle: number; trueRul: number; predictedRul: number }[]
): RulEvaluationResult {
  if (inputs.length === 0) {
    return {
      sampleCount: 0,
      cmapssTotalScore: 0,
      meanCmapssScore: 0,
      mae: 0,
      rmse: 0,
      mape: 0,
      r2: 0,
      earlyPredictionCount: 0,
      latePredictionCount: 0,
      maxLateError: 0,
      maxEarlyError: 0,
      records: [],
    };
  }

  let totalScore = 0;
  let sumAbsErr = 0;
  let sumSqErr = 0;
  let sumPctErr = 0;
  let earlyCount = 0;
  let lateCount = 0;
  let maxLate = 0;
  let maxEarly = 0;

  const trueRuls = inputs.map((d) => d.trueRul);
  const meanTrue = trueRuls.reduce((a, b) => a + b, 0) / inputs.length;
  let ssTotal = 0;

  const records: RulPredictionRecord[] = [];

  for (const item of inputs) {
    const error = item.predictedRul - item.trueRul;
    let score = 0;

    if (error < 0) {
      // Early prediction (conservative maintenance)
      score = Math.exp(-error / 13) - 1;
      earlyCount++;
      if (Math.abs(error) > maxEarly) maxEarly = Math.abs(error);
    } else {
      // Late prediction (catastrophic failure risk - heavily penalized)
      score = Math.exp(error / 10) - 1;
      lateCount++;
      if (error > maxLate) maxLate = error;
    }

    totalScore += score;
    sumAbsErr += Math.abs(error);
    sumSqErr += error * error;
    if (item.trueRul !== 0) {
      sumPctErr += Math.abs(error / item.trueRul);
    }
    ssTotal += Math.pow(item.trueRul - meanTrue, 2);

    records.push({
      unitId: item.unitId,
      cycle: item.cycle,
      trueRul: item.trueRul,
      predictedRul: item.predictedRul,
      error: Number(error.toFixed(2)),
      cmapssScore: Number(score.toFixed(3)),
    });
  }

  const n = inputs.length;
  const mae = sumAbsErr / n;
  const rmse = Math.sqrt(sumSqErr / n);
  const mape = (sumPctErr / n) * 100;
  const r2 = ssTotal > 0 ? Math.max(0, 1 - sumSqErr / ssTotal) : 0;

  return {
    sampleCount: n,
    cmapssTotalScore: Number(totalScore.toFixed(2)),
    meanCmapssScore: Number((totalScore / n).toFixed(2)),
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    mape: Number(mape.toFixed(2)),
    r2: Number(r2.toFixed(4)),
    earlyPredictionCount: earlyCount,
    latePredictionCount: lateCount,
    maxLateError: Number(maxLate.toFixed(2)),
    maxEarlyError: Number(maxEarly.toFixed(2)),
    records,
  };
}

// ====================================================================
// 6. MULTIVARIATE MAHALANOBIS DISTANCE ANOMALY DETECTOR
// Evaluates multi-sensor telemetry vectors (vibration, temp, pressure, acoustic)
// ====================================================================

export function detectMultivariateAnomalies(
  data: { timestamp: string; assetId: string; features: Record<string, number> }[],
  baselineData?: { timestamp: string; assetId: string; features: Record<string, number> }[],
  chiSquareThreshold = 13.82 // Default p=4, alpha=0.01 threshold
): MultivariateAnomalyResult {
  if (data.length === 0) {
    return {
      totalAnalyzed: 0,
      anomaliesDetected: 0,
      anomalyRatePct: 0,
      chiSquareThreshold,
      points: [],
      featureWeights: {},
    };
  }

  const featureKeys = Object.keys(data[0].features);
  const p = featureKeys.length;
  const refSet = baselineData && baselineData.length > p ? baselineData : data;

  // 1. Calculate Mean Vector
  const meanVector: number[] = new Array(p).fill(0);
  for (const item of refSet) {
    featureKeys.forEach((key, j) => {
      meanVector[j] += item.features[key] || 0;
    });
  }
  for (let j = 0; j < p; j++) {
    meanVector[j] /= refSet.length;
  }

  // 2. Calculate Covariance Matrix with Tikhonov regularization for invertibility
  const cov: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (const item of refSet) {
    const diff = featureKeys.map((k, j) => (item.features[k] || 0) - meanVector[j]);
    for (let r = 0; r < p; r++) {
      for (let c = 0; c < p; c++) {
        cov[r][c] += diff[r] * diff[c];
      }
    }
  }
  const regLambda = 1e-4;
  for (let r = 0; r < p; r++) {
    for (let c = 0; c < p; c++) {
      cov[r][c] /= Math.max(1, refSet.length - 1);
      if (r === c) cov[r][c] += regLambda;
    }
  }

  // 3. Invert Covariance Matrix (Gaussian Elimination)
  const invCov = invertMatrix(cov);

  // 4. Compute Mahalanobis Distance for each data point
  let anomaliesCount = 0;
  const points: AnomalyScorePoint[] = [];

  for (const item of data) {
    const diff = featureKeys.map((k, j) => (item.features[k] || 0) - meanVector[j]);

    // d^2 = diff^T * invCov * diff
    let dSquared = 0;
    for (let r = 0; r < p; r++) {
      let rowSum = 0;
      for (let c = 0; c < p; c++) {
        rowSum += invCov[r][c] * diff[c];
      }
      dSquared += diff[r] * rowSum;
    }

    const dMahalanobis = Math.sqrt(Math.max(0, dSquared));
    const isAnomaly = dSquared > chiSquareThreshold;
    if (isAnomaly) anomaliesCount++;

    points.push({
      timestamp: item.timestamp,
      assetId: item.assetId,
      features: item.features,
      mahalanobisDistance: Number(dMahalanobis.toFixed(3)),
      isAnomaly,
      reconstructionError: Number((dMahalanobis / Math.sqrt(p)).toFixed(3)),
    });
  }

  const featureWeights: Record<string, number> = {};
  featureKeys.forEach((key, j) => {
    // Variance proxy
    featureWeights[key] = Number(cov[j][j].toFixed(4));
  });

  return {
    totalAnalyzed: data.length,
    anomaliesDetected: anomaliesCount,
    anomalyRatePct: Number(((anomaliesCount / data.length) * 100).toFixed(2)),
    chiSquareThreshold,
    points,
    featureWeights,
  };
}

/**
 * Matrix inversion helper via Gauss-Jordan elimination
 */
function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  // Augment matrix with identity
  const aug: number[][] = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
        maxRow = k;
      }
    }
    const temp = aug[i];
    aug[i] = aug[maxRow];
    aug[maxRow] = temp;

    const pivot = aug[i][i] || 1e-8;
    for (let j = 0; j < 2 * n; j++) {
      aug[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }
  }

  return aug.map((row) => row.slice(n));
}
