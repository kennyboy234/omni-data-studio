/**
 * ====================================================================
 * OMNIDATA INDUSTRIAL AUTONOMY: RELIABILITY, SPC, OEE & SIMULATION ENGINE
 * Phase C - Standards-Grounded Formula Implementation
 * References:
 *  - Weibull Analysis: Nelson (1982), ReliaSoft Weibull Reference
 *  - Kaplan-Meier: Kaplan & Meier (1958) JASA, Greenwood variance
 *  - Crow-AMSAA: IEC 61164 / MIL-HDBK-189 Reliability Growth
 *  - SPC: Montgomery (2012) "Introduction to Statistical Quality Control", AIAG SPC Manual
 *  - Process Capability: ISO 22514 / AIAG SPC Manual 2nd Ed
 *  - Gauge R&R: AIAG MSA Manual 4th Ed
 *  - OEE & TEEP: ISO 22400-2 / Semi E10 Hand Calculation
 *  - Erlang C: Gross & Harris "Fundamentals of Queueing Theory"
 * ====================================================================
 */

import {
  WeibullFailureData,
  WeibullResult,
  KaplanMeierPoint,
  ReliabilityKpiResult,
  SpcChartType,
  SpcDataPoint,
  SpcChartResult,
  SpcRunRuleViolation,
  ProcessCapabilityResult,
  GaugeRRInput,
  GaugeRRResult,
  OeeResult,
  OeeWaterfallStage,
  LineBalancingResult,
  QueueingMMcResult,
  DiscreteEventSimConfig,
  DiscreteEventSimResult,
} from '../types/industrial';

// ====================================================================
// 1. WEIBULL MAXIMUM LIKELIHOOD ESTIMATION WITH RIGHT-CENSORING
// ====================================================================

/**
 * Lanczos approximation for the Gamma function Γ(z)
 */
export function gammaLanczos(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gammaLanczos(1 - z));
  }
  z -= 1;
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.138571095836524,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  let x = p[0];
  for (let i = 1; i < p.length; i++) {
    x += p[i] / (z + i);
  }
  const t = z + 7.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Fits 2-Parameter Weibull via Maximum Likelihood Estimation with right-censoring support.
 * Solves: (1/β) + (1/r) * Σ_{failures} ln(t_i) - (Σ t_i^β ln(t_i)) / (Σ t_i^β) = 0
 */
export function fitWeibullMle(
  data: WeibullFailureData[],
  maxIterations: number = 50,
  tolerance: number = 1e-6
): WeibullResult {
  const failures = data.filter((d) => !d.censored && d.time > 0);
  const r = failures.length;

  if (r < 2) {
    throw new Error('Weibull MLE requires at least 2 uncensored failures.');
  }

  // Pre-calculate sum of log times for failures
  const sumLnTFailures = failures.reduce((acc, f) => acc + Math.log(f.time), 0);

  // Initial estimate of beta from mean / stddev ratio heuristic
  let beta = 1.2;

  let converged = false;
  let iterations = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations++;
    let sumTB = 0;
    let sumTBlnT = 0;
    let sumTBlnT2 = 0;

    for (const d of data) {
      if (d.time <= 0) continue;
      const lnT = Math.log(d.time);
      const tb = Math.pow(d.time, beta);
      sumTB += tb;
      sumTBlnT += tb * lnT;
      sumTBlnT2 += tb * lnT * lnT;
    }

    if (sumTB === 0) break;

    // Score function g(beta)
    const g = 1.0 / beta + sumLnTFailures / r - sumTBlnT / sumTB;

    // Derivative g'(beta)
    const gPrime =
      -1.0 / (beta * beta) -
      (sumTBlnT2 * sumTB - sumTBlnT * sumTBlnT) / (sumTB * sumTB);

    if (Math.abs(gPrime) < 1e-12) break;

    const delta = g / gPrime;
    beta = beta - delta;

    if (beta <= 0.05) beta = 0.05; // Prevent divergence into negative beta

    if (Math.abs(delta) < tolerance) {
      converged = true;
      break;
    }
  }

  // Scale parameter eta (characteristic life)
  let sumTBeta = 0;
  for (const d of data) {
    if (d.time > 0) {
      sumTBeta += Math.pow(d.time, beta);
    }
  }
  const eta = Math.pow(sumTBeta / r, 1.0 / beta);

  // MTTF = eta * Gamma(1 + 1/beta)
  const mttf = eta * gammaLanczos(1.0 + 1.0 / beta);

  // B10 life = eta * (-ln(0.9))^(1/beta)
  const b10Life = eta * Math.pow(-Math.log(0.9), 1.0 / beta);

  // Interpretation per standard reliability engineering
  let betaInterpretation: WeibullResult['betaInterpretation'] = 'WEAR_OUT_DEGRADATION';
  if (beta < 0.95) {
    betaInterpretation = 'EARLY_INFANT_MORTALITY';
  } else if (beta <= 1.05) {
    betaInterpretation = 'RANDOM_EXPONENTIAL_FAILURES';
  }

  // Standard errors via Fisher Information asymptotic approximation
  const varBeta = (beta * beta) / r;
  const varLnEta = 1.1 / (r * beta * beta);
  const seBeta = Math.sqrt(varBeta);
  const seLnEta = Math.sqrt(varLnEta);

  const betaLower = Math.max(0.01, beta - 1.96 * seBeta);
  const betaUpper = beta + 1.96 * seBeta;
  const etaLower = eta * Math.exp(-1.96 * seLnEta);
  const etaUpper = eta * Math.exp(1.96 * seLnEta);

  // Generate probability plot data (Bernard's median ranks: (i - 0.3) / (n + 0.4))
  const sortedFailures = [...failures].sort((a, b) => a.time - b.time);
  const n = data.length;
  const probabilityPlot = sortedFailures.map((f, i) => {
    const unreliability = (i + 1 - 0.3) / (n + 0.4);
    const fittedF = 1 - Math.exp(-Math.pow(f.time / eta, beta));
    return {
      t: f.time,
      unreliability,
      fittedF,
    };
  });

  return {
    beta: Number(beta.toFixed(4)),
    eta: Number(eta.toFixed(4)),
    mttf: Number(mttf.toFixed(2)),
    b10Life: Number(b10Life.toFixed(2)),
    betaInterpretation,
    confidenceBounds95: {
      betaLower: Number(betaLower.toFixed(4)),
      betaUpper: Number(betaUpper.toFixed(4)),
      etaLower: Number(etaLower.toFixed(2)),
      etaUpper: Number(etaUpper.toFixed(2)),
    },
    probabilityPlot,
    converged,
    iterations,
  };
}

// ====================================================================
// 2. KAPLAN-MEIER SURVIVAL ESTIMATOR WITH GREENWOOD VARIANCE
// ====================================================================

export function calculateKaplanMeier(data: WeibullFailureData[]): KaplanMeierPoint[] {
  if (data.length === 0) return [];

  // Group events by distinct time
  const timeMap = new Map<number, { events: number; censored: number }>();
  for (const d of data) {
    const current = timeMap.get(d.time) || { events: 0, censored: 0 };
    if (d.censored) {
      current.censored++;
    } else {
      current.events++;
    }
    timeMap.set(d.time, current);
  }

  const sortedTimes = Array.from(timeMap.keys()).sort((a, b) => a - b);
  let nAtRisk = data.length;
  let survivalProb = 1.0;
  let greenwoodSum = 0;

  const result: KaplanMeierPoint[] = [];

  for (const t of sortedTimes) {
    const group = timeMap.get(t)!;
    const d = group.events;
    const c = group.censored;

    if (nAtRisk > 0) {
      if (d > 0) {
        survivalProb = survivalProb * (1.0 - d / nAtRisk);
        if (nAtRisk - d > 0) {
          greenwoodSum += d / (nAtRisk * (nAtRisk - d));
        }
      }
    }

    const variance = survivalProb * survivalProb * greenwoodSum;
    const se = Math.sqrt(variance);
    const ciLower = Math.max(0, survivalProb - 1.96 * se);
    const ciUpper = Math.min(1, survivalProb + 1.96 * se);

    result.push({
      time: t,
      nAtRisk,
      nEvents: d,
      nCensored: c,
      survivalProbability: Number(survivalProb.toFixed(4)),
      standardErrorGreenwood: Number(se.toFixed(4)),
      confidenceInterval95: [Number(ciLower.toFixed(4)), Number(ciUpper.toFixed(4))],
    });

    nAtRisk -= d + c;
  }

  return result;
}

// ====================================================================
// 3. RELIABILITY KPIS (MTBF, MTTR, AVAILABILITY, CROW-AMSAA, PARETO)
// ====================================================================

export function calculateReliabilityKpis(
  operatingHours: number,
  failuresCount: number,
  repairHours: number,
  downtimeCauses: { cause: string; downtimeMinutes: number }[],
  failureEventCumulativeTimes?: number[] // For Crow-AMSAA tracking
): ReliabilityKpiResult {
  const safeFailures = Math.max(1, failuresCount);
  const mtbfHours = operatingHours / safeFailures;
  const mttrHours = repairHours / safeFailures;
  const inherentAvailabilityPercent = (mtbfHours / (mtbfHours + mttrHours)) * 100;

  // Crow-AMSAA estimation: ln(N(t)) = ln(lambda) + beta * ln(t)
  let crowAmsaaBeta = 1.0;
  let crowAmsaaLambda = 0.01;

  if (failureEventCumulativeTimes && failureEventCumulativeTimes.length >= 3) {
    const validTimes = failureEventCumulativeTimes.filter((t) => t > 0);
    const m = validTimes.length;
    const T = validTimes[validTimes.length - 1];
    const sumLnRatio = validTimes.slice(0, m - 1).reduce((acc, t) => acc + Math.log(T / t), 0);
    if (sumLnRatio > 0) {
      crowAmsaaBeta = (m - 1) / sumLnRatio; // Unbiased MLE estimator for Crow-AMSAA
      crowAmsaaLambda = m / Math.pow(T, crowAmsaaBeta);
    }
  }

  // Pareto of downtime causes
  const totalDowntimeMinutes = downtimeCauses.reduce((acc, c) => acc + c.downtimeMinutes, 0) || 1;
  const sortedCauses = [...downtimeCauses].sort((a, b) => b.downtimeMinutes - a.downtimeMinutes);

  let cumulativeMin = 0;
  const paretoDowntimeCauses = sortedCauses.map((c) => {
    cumulativeMin += c.downtimeMinutes;
    return {
      cause: c.cause,
      downtimeMinutes: c.downtimeMinutes,
      percentage: Number(((c.downtimeMinutes / totalDowntimeMinutes) * 100).toFixed(2)),
      cumulativePercentage: Number(((cumulativeMin / totalDowntimeMinutes) * 100).toFixed(2)),
    };
  });

  return {
    totalOperatingHours: operatingHours,
    totalFailures: failuresCount,
    totalRepairHours: repairHours,
    mtbfHours: Number(mtbfHours.toFixed(2)),
    mttrHours: Number(mttrHours.toFixed(2)),
    inherentAvailabilityPercent: Number(inherentAvailabilityPercent.toFixed(2)),
    crowAmsaaBeta: Number(crowAmsaaBeta.toFixed(3)),
    crowAmsaaLambda: Number(crowAmsaaLambda.toFixed(5)),
    paretoDowntimeCauses,
  };
}

// ====================================================================
// 4. STATISTICAL PROCESS CONTROL (SPC) CHARTS & RUN RULES
// ====================================================================

// Standard AIAG constants for X-bar and R charts
const SPC_CONSTANTS: Record<number, { A2: number; D3: number; D4: number; d2: number }> = {
  2: { A2: 1.88, D3: 0.0, D4: 3.267, d2: 1.128 },
  3: { A2: 1.023, D3: 0.0, D4: 2.574, d2: 1.693 },
  4: { A2: 0.729, D3: 0.0, D4: 2.282, d2: 2.059 },
  5: { A2: 0.577, D3: 0.0, D4: 2.114, d2: 2.326 },
  6: { A2: 0.483, D3: 0.0, D4: 2.004, d2: 2.534 },
  7: { A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704 },
  8: { A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847 },
  9: { A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.97 },
  10: { A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078 },
};

/**
 * Evaluates Western Electric Rules (1 to 4) on points
 */
export function evaluateRunRules(
  values: number[],
  centerLine: number,
  sigma: number
): SpcRunRuleViolation[] {
  const violations: SpcRunRuleViolation[] = [];
  if (sigma <= 0 || values.length === 0) return violations;

  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    const z = Math.abs(val - centerLine) / sigma;

    // Rule 1: One point beyond 3-sigma (Zone A)
    if (z > 3.0) {
      violations.push({
        pointIndex: i,
        ruleCode: 'RULE_1',
        ruleDescription: `Point ${i + 1} (${val.toFixed(2)}) is beyond 3-sigma limits (z=${z.toFixed(2)})`,
      });
    }

    // Rule 2: 9 points in a row on same side of center line
    if (i >= 8) {
      const window = values.slice(i - 8, i + 1);
      const allAbove = window.every((v) => v > centerLine);
      const allBelow = window.every((v) => v < centerLine);
      if (allAbove || allBelow) {
        violations.push({
          pointIndex: i,
          ruleCode: 'RULE_2',
          ruleDescription: `9 consecutive points ending at point ${i + 1} on the same side of center line`,
        });
      }
    }

    // Rule 3: 6 consecutive points steadily increasing or decreasing
    if (i >= 5) {
      const window = values.slice(i - 5, i + 1);
      let inc = true;
      let dec = true;
      for (let w = 1; w < window.length; w++) {
        if (window[w] <= window[w - 1]) inc = false;
        if (window[w] >= window[w - 1]) dec = false;
      }
      if (inc || dec) {
        violations.push({
          pointIndex: i,
          ruleCode: 'RULE_3',
          ruleDescription: `6 consecutive points trending ${inc ? 'upwards' : 'downwards'} at point ${i + 1}`,
        });
      }
    }

    // Rule 4: 14 consecutive points alternating up and down
    if (i >= 13) {
      const window = values.slice(i - 13, i + 1);
      let alternating = true;
      for (let w = 1; w < window.length - 1; w++) {
        const diff1 = window[w] - window[w - 1];
        const diff2 = window[w + 1] - window[w];
        if (diff1 * diff2 >= 0) {
          alternating = false;
          break;
        }
      }
      if (alternating) {
        violations.push({
          pointIndex: i,
          ruleCode: 'RULE_4',
          ruleDescription: `14 consecutive points alternating up/down ending at point ${i + 1}`,
        });
      }
    }
  }

  return violations;
}

export function calculateSpcChart(
  chartType: SpcChartType,
  data: number[] | { subgroup: number[] }[] | { count: number; sampleSize: number }[],
  params?: { lambda?: number; L?: number; k?: number; h?: number }
): SpcChartResult {
  const points: SpcDataPoint[] = [];
  let centerLine = 0;
  let ucl = 0;
  let lcl = 0;
  let sigma = 1;

  if (chartType === 'I_MR') {
    const values = data as number[];
    if (values.length < 2) {
      throw new Error('I-MR chart requires at least 2 observations.');
    }
    const n = values.length;
    centerLine = values.reduce((a, b) => a + b, 0) / n;

    // Moving ranges
    const mrValues: number[] = [];
    for (let i = 1; i < n; i++) {
      mrValues.push(Math.abs(values[i] - values[i - 1]));
    }
    const meanMr = mrValues.reduce((a, b) => a + b, 0) / mrValues.length;
    sigma = meanMr / 1.128; // d2 for n=2 is 1.128

    ucl = centerLine + 2.66 * meanMr;
    lcl = centerLine - 2.66 * meanMr;

    const mrUcl = 3.267 * meanMr;
    const mrCenter = meanMr;

    for (let i = 0; i < n; i++) {
      const mr = i === 0 ? undefined : mrValues[i - 1];
      points.push({
        index: i,
        label: `Subgroup ${i + 1}`,
        value: Number(values[i].toFixed(4)),
        secondaryValue: mr !== undefined ? Number(mr.toFixed(4)) : undefined,
        centerLine: Number(centerLine.toFixed(4)),
        ucl: Number(ucl.toFixed(4)),
        lcl: Number(lcl.toFixed(4)),
        secondaryCenterLine: Number(mrCenter.toFixed(4)),
        secondaryUcl: Number(mrUcl.toFixed(4)),
        secondaryLcl: 0,
        violations: [],
      });
    }
  } else if (chartType === 'X_BAR_R') {
    const subgroups = (data as { subgroup: number[] }[]).map((d) => d.subgroup);
    if (subgroups.length === 0) throw new Error('Subgroup data cannot be empty.');
    const subgroupSize = subgroups[0].length;
    const constants = SPC_CONSTANTS[subgroupSize] || SPC_CONSTANTS[5];

    const xBars = subgroups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
    const ranges = subgroups.map((g) => Math.max(...g) - Math.min(...g));

    centerLine = xBars.reduce((a, b) => a + b, 0) / xBars.length;
    const rBar = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    sigma = rBar / constants.d2;

    ucl = centerLine + constants.A2 * rBar;
    lcl = centerLine - constants.A2 * rBar;

    const rUcl = constants.D4 * rBar;
    const rLcl = constants.D3 * rBar;

    for (let i = 0; i < subgroups.length; i++) {
      points.push({
        index: i,
        label: `Subgroup ${i + 1}`,
        value: Number(xBars[i].toFixed(4)),
        secondaryValue: Number(ranges[i].toFixed(4)),
        subgroupSize,
        centerLine: Number(centerLine.toFixed(4)),
        ucl: Number(ucl.toFixed(4)),
        lcl: Number(lcl.toFixed(4)),
        secondaryCenterLine: Number(rBar.toFixed(4)),
        secondaryUcl: Number(rUcl.toFixed(4)),
        secondaryLcl: Number(rLcl.toFixed(4)),
        violations: [],
      });
    }
  } else if (chartType === 'P_CHART') {
    const items = data as { count: number; sampleSize: number }[];
    const totalDefects = items.reduce((a, b) => a + b.count, 0);
    const totalSamples = items.reduce((a, b) => a + b.sampleSize, 0);
    centerLine = totalDefects / Math.max(1, totalSamples);

    for (let i = 0; i < items.length; i++) {
      const p = items[i].count / items[i].sampleSize;
      const seP = Math.sqrt((centerLine * (1 - centerLine)) / items[i].sampleSize);
      const pointUcl = Math.min(1.0, centerLine + 3 * seP);
      const pointLcl = Math.max(0.0, centerLine - 3 * seP);
      points.push({
        index: i,
        label: `Sample ${i + 1}`,
        value: Number(p.toFixed(4)),
        subgroupSize: items[i].sampleSize,
        centerLine: Number(centerLine.toFixed(4)),
        ucl: Number(pointUcl.toFixed(4)),
        lcl: Number(pointLcl.toFixed(4)),
        violations: [],
      });
    }
    ucl = points.length ? points[0].ucl : 1;
    lcl = points.length ? points[0].lcl : 0;
  } else if (chartType === 'C_CHART') {
    const counts = data as number[];
    centerLine = counts.reduce((a, b) => a + b, 0) / counts.length;
    sigma = Math.sqrt(centerLine);
    ucl = centerLine + 3 * sigma;
    lcl = Math.max(0, centerLine - 3 * sigma);

    for (let i = 0; i < counts.length; i++) {
      points.push({
        index: i,
        label: `Unit ${i + 1}`,
        value: counts[i],
        centerLine: Number(centerLine.toFixed(4)),
        ucl: Number(ucl.toFixed(4)),
        lcl: Number(lcl.toFixed(4)),
        violations: [],
      });
    }
  } else if (chartType === 'EWMA') {
    const values = data as number[];
    const lambda = params?.lambda ?? 0.2;
    const L = params?.L ?? 3.0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    centerLine = mean;

    // Approximate within-subgroup or sample std dev
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
    sigma = Math.sqrt(variance);

    let z = mean;
    for (let t = 1; t <= values.length; t++) {
      const x = values[t - 1];
      z = lambda * x + (1 - lambda) * z;
      const seT = sigma * Math.sqrt((lambda / (2 - lambda)) * (1 - Math.pow(1 - lambda, 2 * t)));
      const pointUcl = mean + L * seT;
      const pointLcl = mean - L * seT;

      points.push({
        index: t - 1,
        label: `Time ${t}`,
        value: Number(z.toFixed(4)),
        centerLine: Number(centerLine.toFixed(4)),
        ucl: Number(pointUcl.toFixed(4)),
        lcl: Number(pointLcl.toFixed(4)),
        violations: [],
      });
    }
    ucl = points[points.length - 1].ucl;
    lcl = points[points.length - 1].lcl;
  } else if (chartType === 'CUSUM') {
    const values = data as number[];
    const k = params?.k ?? 0.5; // allowance (slack) in sigma units
    const h = params?.h ?? 4.5; // decision limit in sigma units

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    centerLine = 0;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
    sigma = Math.sqrt(variance);

    ucl = h * sigma;
    lcl = -h * sigma;

    let cPlus = 0;
    let cMinus = 0;

    for (let i = 0; i < values.length; i++) {
      const x = values[i];
      cPlus = Math.max(0, cPlus + (x - (mean + k * sigma)));
      cMinus = Math.min(0, cMinus + (x - (mean - k * sigma)));

      points.push({
        index: i,
        label: `Obs ${i + 1}`,
        value: Number(cPlus.toFixed(4)),
        secondaryValue: Number(cMinus.toFixed(4)),
        centerLine: 0,
        ucl: Number(ucl.toFixed(4)),
        lcl: Number(lcl.toFixed(4)),
        violations: [],
      });
    }
  }

  // Evaluate run rules on the primary plotted values
  const primaryValues = points.map((p) => p.value);
  const violations = evaluateRunRules(primaryValues, centerLine, sigma);

  for (const v of violations) {
    if (points[v.pointIndex]) {
      points[v.pointIndex].violations.push(v.ruleCode);
    }
  }

  const inControl = violations.length === 0;
  const summaryMessage = inControl
    ? `Process is in statistical control (${points.length} subgroups, 0 Western Electric violations).`
    : `SPECIAL CAUSE VARIATION DETECTED: ${violations.length} run rule violation(s) identified.`;

  return {
    chartType,
    inControl,
    points,
    centerLine: Number(centerLine.toFixed(4)),
    ucl: Number(ucl.toFixed(4)),
    lcl: Number(lcl.toFixed(4)),
    violations,
    summaryMessage,
  };
}

// ====================================================================
// 5. PROCESS CAPABILITY (Cp, Cpk, Pp, Ppk) WITH MANDATORY GATING
// ====================================================================

/**
 * Complementary error function erfc(x) approximation (Abramowitz & Stegun 7.1.26)
 * Maximum error: 1.5e-7
 */
export function erfc(x: number): number {
  if (x < 0) {
    return 2.0 - erfc(-x);
  }
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1.0 / (1.0 + p * x);
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  return poly * Math.exp(-x * x);
}

/**
 * Computes skewness and kurtosis for D'Agostino-Pearson omnibus normality check
 */
export function checkNormality(values: number[]): { isNormal: boolean; pValue: number } {
  if (values.length < 8) return { isNormal: true, pValue: 0.5 };
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const m2 = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const m3 = values.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
  const m4 = values.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;

  if (m2 === 0) return { isNormal: false, pValue: 0.0 };

  const s = Math.sqrt(m2);
  const skewness = m3 / Math.pow(s, 3);
  const kurtosis = m4 / Math.pow(s, 4) - 3.0; // Excess kurtosis

  // Test statistic K2 ~ Chi2(2)
  const zSkew = skewness / Math.sqrt(6 / n);
  const zKurt = kurtosis / Math.sqrt(24 / n);
  const k2 = zSkew * zSkew + zKurt * zKurt;

  // p-value = exp(-k2 / 2)
  const pValue = Math.exp(-k2 / 2.0);
  const isNormal = pValue >= 0.05;

  return { isNormal, pValue: Number(pValue.toFixed(4)) };
}

export function calculateProcessCapability(
  values: number[],
  usl: number,
  lsl: number,
  isProcessInControl: boolean,
  target?: number
): ProcessCapabilityResult {
  const n = values.length;
  if (n < 5) {
    return {
      usl,
      lsl,
      target,
      mean: 0,
      sigmaWithin: 0,
      sigmaOverall: 0,
      cp: null,
      cpk: null,
      pp: null,
      ppk: null,
      isStable: false,
      isNormal: false,
      normalityPValue: 0,
      isBlocked: true,
      blockedReason: 'Sample size insufficient (n < 5) for process capability analysis.',
      expectedDpmOverall: 0,
    };
  }

  const mean = values.reduce((a, b) => a + b, 0) / n;

  // Overall standard deviation (sample s)
  const s2 = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  const sigmaOverall = Math.sqrt(s2);

  // Within-subgroup standard deviation via average moving range
  let sumMr = 0;
  for (let i = 1; i < n; i++) {
    sumMr += Math.abs(values[i] - values[i - 1]);
  }
  const meanMr = sumMr / (n - 1);
  const sigmaWithin = meanMr / 1.128; // d2 = 1.128

  const { isNormal, pValue: normalityPValue } = checkNormality(values);

  // Gating rule: AIAG & ISO 22514 require stability and normality before capability reporting
  let isBlocked = false;
  let blockedReason: string | undefined = undefined;

  if (!isProcessInControl) {
    isBlocked = true;
    blockedReason =
      'BLOCKED: Process is not in statistical control (active run rule violations). Capability indices (Cp, Cpk) are statistically invalid on unstable processes.';
  } else if (!isNormal) {
    isBlocked = true;
    blockedReason = `BLOCKED: Normality assumption violated (p-value = ${normalityPValue} < 0.05). Standard Gaussian capability indices are invalid without Box-Cox transformation.`;
  }

  // Capability calculations
  const tolerance = usl - lsl;
  const cp = sigmaWithin > 0 ? tolerance / (6 * sigmaWithin) : null;
  const cpu = sigmaWithin > 0 ? (usl - mean) / (3 * sigmaWithin) : null;
  const cpl = sigmaWithin > 0 ? (mean - lsl) / (3 * sigmaWithin) : null;
  const cpk = cpu !== null && cpl !== null ? Math.min(cpu, cpl) : null;

  const pp = sigmaOverall > 0 ? tolerance / (6 * sigmaOverall) : null;
  const ppu = sigmaOverall > 0 ? (usl - mean) / (3 * sigmaOverall) : null;
  const ppl = sigmaOverall > 0 ? (mean - lsl) / (3 * sigmaOverall) : null;
  const ppk = ppu !== null && ppl !== null ? Math.min(ppu, ppl) : null;

  // Expected Defects Per Million (DPM) based on normal cumulative distribution
  const zUpper = sigmaOverall > 0 ? (usl - mean) / sigmaOverall : 0;
  const zLower = sigmaOverall > 0 ? (mean - lsl) / sigmaOverall : 0;
  const pDefectUpper = 0.5 * erfc(zUpper / Math.SQRT2);
  const pDefectLower = 0.5 * erfc(zLower / Math.SQRT2);
  const expectedDpmOverall = Math.round((pDefectUpper + pDefectLower) * 1e6);

  return {
    usl,
    lsl,
    target,
    mean: Number(mean.toFixed(4)),
    sigmaWithin: Number(sigmaWithin.toFixed(4)),
    sigmaOverall: Number(sigmaOverall.toFixed(4)),
    cp: isBlocked || cp === null ? null : Number(cp.toFixed(3)),
    cpk: isBlocked || cpk === null ? null : Number(cpk.toFixed(3)),
    pp: isBlocked || pp === null ? null : Number(pp.toFixed(3)),
    ppk: isBlocked || ppk === null ? null : Number(ppk.toFixed(3)),
    isStable: isProcessInControl,
    isNormal,
    normalityPValue,
    isBlocked,
    blockedReason,
    expectedDpmOverall,
  };
}

// ====================================================================
// 6. GAUGE REPEATABILITY & REPRODUCIBILITY (ANOVA METHOD)
// ====================================================================

export function calculateGaugeRR(input: GaugeRRInput): GaugeRRResult {
  const { operators, parts, trials, measurements } = input;
  const p = parts.length;
  const o = operators.length;
  const t = trials;
  const totalN = p * o * t;

  let grandTotal = 0;
  const partTotals = new Array(p).fill(0);
  const operatorTotals = new Array(o).fill(0);
  const cellTotals: number[][] = Array.from({ length: o }, () => new Array(p).fill(0));

  for (let opIdx = 0; opIdx < o; opIdx++) {
    for (let partIdx = 0; partIdx < p; partIdx++) {
      for (let trIdx = 0; trIdx < t; trIdx++) {
        const val = measurements[opIdx][partIdx][trIdx];
        grandTotal += val;
        partTotals[partIdx] += val;
        operatorTotals[opIdx] += val;
        cellTotals[opIdx][partIdx] += val;
      }
    }
  }

  const grandMean = grandTotal / totalN;

  // Sum of Squares
  let ssTotal = 0;
  for (let opIdx = 0; opIdx < o; opIdx++) {
    for (let partIdx = 0; partIdx < p; partIdx++) {
      for (let trIdx = 0; trIdx < t; trIdx++) {
        ssTotal += Math.pow(measurements[opIdx][partIdx][trIdx] - grandMean, 2);
      }
    }
  }

  // SS Parts
  const ssParts =
    partTotals.reduce((acc, sum) => acc + Math.pow(sum, 2), 0) / (o * t) -
    Math.pow(grandTotal, 2) / totalN;

  // SS Operators
  const ssOperators =
    operatorTotals.reduce((acc, sum) => acc + Math.pow(sum, 2), 0) / (p * t) -
    Math.pow(grandTotal, 2) / totalN;

  // SS Repeatability (Within cells)
  let ssRepeatability = 0;
  for (let opIdx = 0; opIdx < o; opIdx++) {
    for (let partIdx = 0; partIdx < p; partIdx++) {
      const cellMean = cellTotals[opIdx][partIdx] / t;
      for (let trIdx = 0; trIdx < t; trIdx++) {
        ssRepeatability += Math.pow(measurements[opIdx][partIdx][trIdx] - cellMean, 2);
      }
    }
  }

  const dfRepeatability = o * p * (t - 1);
  const msRepeatability = dfRepeatability > 0 ? ssRepeatability / dfRepeatability : 0;

  const dfOperators = o - 1;
  const msOperators = dfOperators > 0 ? ssOperators / dfOperators : 0;

  const dfParts = p - 1;
  const msParts = dfParts > 0 ? ssParts / dfParts : 0;

  // Variance components per AIAG MSA 4th Ed
  const varRepeatability = msRepeatability; // Equipment Variation EV^2
  const varReproducibility = Math.max(0, (msOperators - msRepeatability) / (p * t)); // Appraiser Variation AV^2
  const varGaugeRR = varRepeatability + varReproducibility;
  const varPart = Math.max(0, (msParts - msRepeatability) / (o * t));
  const varTotal = varGaugeRR + varPart;

  const ev = Math.sqrt(varRepeatability);
  const av = Math.sqrt(varReproducibility);
  const grr = Math.sqrt(varGaugeRR);
  const pv = Math.sqrt(varPart);
  const tv = Math.sqrt(varTotal);

  const percentStudyVarGRR = tv > 0 ? (grr / tv) * 100 : 0;
  const percentStudyVarPart = tv > 0 ? (pv / tv) * 100 : 0;
  const ndc = grr > 0 ? Math.floor(1.41 * (pv / grr)) : 0;

  let verdict: GaugeRRResult['verdict'] = 'ACCEPTABLE (<10%)';
  if (percentStudyVarGRR > 30) {
    verdict = 'UNACCEPTABLE (>30%)';
  } else if (percentStudyVarGRR >= 10) {
    verdict = 'MARGINAL (10-30%)';
  }

  const ndcVerdict: GaugeRRResult['ndcVerdict'] = ndc >= 5 ? 'ADEQUATE (NDC >= 5)' : 'INADEQUATE (NDC < 5)';

  return {
    equipmentVariationEV: Number(ev.toFixed(4)),
    appraiserVariationAV: Number(av.toFixed(4)),
    gaugeRRGRR: Number(grr.toFixed(4)),
    partVariationPV: Number(pv.toFixed(4)),
    totalVariationTV: Number(tv.toFixed(4)),
    percentStudyVarGRR: Number(percentStudyVarGRR.toFixed(2)),
    percentStudyVarPart: Number(percentStudyVarPart.toFixed(2)),
    numberOfDistinctCategoriesNDC: ndc,
    verdict,
    ndcVerdict,
  };
}

// ====================================================================
// 7. OEE & TEEP WITH LOSS WATERFALL (ISO 22400)
// ====================================================================

export function calculateOeeWaterfall(
  calendarHours: number,
  plannedProductionHours: number,
  operatingTimeHours: number,
  idealCycleTimeSeconds: number,
  totalUnitsProduced: number,
  goodUnitsProduced: number
): OeeResult {
  if (plannedProductionHours <= 0) {
    throw new Error('Planned production hours must be greater than zero.');
  }

  // 1. Availability Rate = Operating Time / Planned Production Time
  const availabilityRate = Math.min(1.0, operatingTimeHours / plannedProductionHours);

  // 2. Performance Rate = (Ideal Cycle Time * Total Count) / Operating Time
  const operatingSeconds = operatingTimeHours * 3600;
  const idealProductionSeconds = totalUnitsProduced * idealCycleTimeSeconds;
  const performanceRate = operatingSeconds > 0 ? Math.min(1.0, idealProductionSeconds / operatingSeconds) : 0;

  // 3. Quality Rate = Good Count / Total Count
  const qualityRate = totalUnitsProduced > 0 ? Math.min(1.0, goodUnitsProduced / totalUnitsProduced) : 0;

  const oeePercent = availabilityRate * performanceRate * qualityRate * 100;
  const teepPercent = (oeePercent * plannedProductionHours) / calendarHours;

  // Loss waterfall decomposition
  const unscheduledLossHours = Math.max(0, calendarHours - plannedProductionHours);
  const downtimeLossHours = Math.max(0, plannedProductionHours - operatingTimeHours);
  const speedLossHours = Math.max(0, operatingTimeHours - idealProductionSeconds / 3600);
  const netOperatingHours = operatingTimeHours - speedLossHours;
  const scrapLossHours = totalUnitsProduced > 0 ? (idealProductionSeconds / 3600) * (1 - qualityRate) : 0;
  const fullyProductiveHours = netOperatingHours - scrapLossHours;

  const waterfall: OeeWaterfallStage[] = [
    { stage: 'Calendar Time', hours: calendarHours, lossHours: 0 },
    { stage: 'Planned Production Time', hours: plannedProductionHours, lossHours: unscheduledLossHours, lossReason: 'Unscheduled / Planned Shutdown' },
    { stage: 'Operating Time', hours: operatingTimeHours, lossHours: downtimeLossHours, lossReason: 'Breakdowns, Setups, Equipment Failures' },
    { stage: 'Net Operating Time', hours: Number(netOperatingHours.toFixed(2)), lossHours: Number(speedLossHours.toFixed(2)), lossReason: 'Minor Stops, Speed Reductions' },
    { stage: 'Fully Productive Time', hours: Number(fullyProductiveHours.toFixed(2)), lossHours: Number(scrapLossHours.toFixed(2)), lossReason: 'Scrap, Rework, Startup Defects' },
  ];

  return {
    calendarHours,
    plannedProductionTimeHours: plannedProductionHours,
    operatingTimeHours,
    idealCycleTimeSeconds,
    totalUnitsProduced,
    goodUnitsProduced,
    availabilityRate: Number(availabilityRate.toFixed(4)),
    performanceRate: Number(performanceRate.toFixed(4)),
    qualityRate: Number(qualityRate.toFixed(4)),
    oeePercent: Number(oeePercent.toFixed(2)),
    teepPercent: Number(teepPercent.toFixed(2)),
    waterfall,
  };
}

// ====================================================================
// 8. TAKT TIME, LINE BALANCING & M/M/c QUEUEING MODEL
// ====================================================================

export function calculateLineBalancing(
  customerDemandPerShift: number,
  shiftDurationSec: number,
  stations: { id: string; name: string; taskDurationSec: number }[]
): LineBalancingResult {
  if (customerDemandPerShift <= 0) throw new Error('Customer demand must be > 0.');
  if (stations.length === 0) throw new Error('Must specify at least one station.');

  const taktTimeSec = shiftDurationSec / customerDemandPerShift;
  const cycleTimes = stations.map((s) => s.taskDurationSec);
  const maxCycleTime = Math.max(...cycleTimes);
  const bottleneckIndex = cycleTimes.indexOf(maxCycleTime);

  const totalTaskTime = cycleTimes.reduce((a, b) => a + b, 0);
  const lineBalanceEfficiencyPercent = (totalTaskTime / (stations.length * maxCycleTime)) * 100;

  // Smoothness Index = sqrt(Σ (maxCycleTime - t_i)^2)
  const smoothnessIndex = Math.sqrt(
    cycleTimes.reduce((acc, t) => acc + Math.pow(maxCycleTime - t, 2), 0)
  );

  const evaluatedStations = stations.map((s, idx) => ({
    stationId: s.id,
    stationName: s.name,
    taskDurationSec: s.taskDurationSec,
    isBottleneck: idx === bottleneckIndex,
    utilizationPercent: Number(((s.taskDurationSec / maxCycleTime) * 100).toFixed(1)),
  }));

  return {
    customerDemandPerShift,
    shiftDurationSec,
    taktTimeSec: Number(taktTimeSec.toFixed(2)),
    bottleneckStation: stations[bottleneckIndex].name,
    bottleneckCycleTimeSec: Number(maxCycleTime.toFixed(2)),
    lineBalanceEfficiencyPercent: Number(lineBalanceEfficiencyPercent.toFixed(2)),
    smoothnessIndex: Number(smoothnessIndex.toFixed(2)),
    stations: evaluatedStations,
  };
}

/**
 * M/M/c Queueing model with Erlang-C formula
 */
export function calculateQueueingMMc(
  arrivalRateLambda: number,
  serviceRateMu: number,
  c: number
): QueueingMMcResult {
  if (arrivalRateLambda <= 0 || serviceRateMu <= 0 || c < 1) {
    throw new Error('Arrival rate, service rate must be > 0 and servers c >= 1.');
  }

  const r = arrivalRateLambda / serviceRateMu;
  const rho = r / c;

  if (rho >= 1.0) {
    // Unstable queue
    return {
      arrivalRateLambda,
      serviceRateMu,
      numServersC: c,
      trafficIntensityRho: Number(rho.toFixed(4)),
      probZeroInSystemP0: 0,
      probWaitingErlangC: 1.0,
      avgQueueLengthLq: Infinity,
      avgTimeInQueueWq: Infinity,
      avgTotalInSystemL: Infinity,
      avgTotalTimeW: Infinity,
      isStable: false,
    };
  }

  // Calculate P0 (Probability of 0 entities in system)
  let sumTerms = 0;
  let factorial = 1;
  for (let n = 0; n < c; n++) {
    if (n > 0) factorial *= n;
    sumTerms += Math.pow(r, n) / factorial;
  }
  factorial *= c;
  const lastTerm = Math.pow(r, c) / (factorial * (1.0 - rho));
  const p0 = 1.0 / (sumTerms + lastTerm);

  // Erlang C formula: Probability an arrival must wait in queue
  const erlangC = lastTerm * p0;

  // Lq: Average queue length
  const lq = (erlangC * rho) / (1.0 - rho);
  // Wq: Average waiting time in queue (Little's Law: Lq = lambda * Wq)
  const wq = lq / arrivalRateLambda;
  // W: Total time in system (waiting + service)
  const w = wq + 1.0 / serviceRateMu;
  // L: Total entities in system
  const l = arrivalRateLambda * w;

  return {
    arrivalRateLambda,
    serviceRateMu,
    numServersC: c,
    trafficIntensityRho: Number(rho.toFixed(4)),
    probZeroInSystemP0: Number(p0.toFixed(4)),
    probWaitingErlangC: Number(erlangC.toFixed(4)),
    avgQueueLengthLq: Number(lq.toFixed(2)),
    avgTimeInQueueWq: Number(wq.toFixed(4)),
    avgTotalInSystemL: Number(l.toFixed(2)),
    avgTotalTimeW: Number(w.toFixed(4)),
    isStable: true,
  };
}

// ====================================================================
// 9. SEEDED DISCRETE-EVENT LINE SIMULATION (DES)
// ====================================================================

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function runDiscreteEventSimulation(config: DiscreteEventSimConfig): DiscreteEventSimResult {
  const {
    seed,
    numStations,
    stationNominalCycleTimesSec,
    simulationDurationHours,
    numMonteCarloRuns,
    mtbfHours,
    mttrHours,
  } = config;

  const prng = mulberry32(seed);
  const simDurationSec = simulationDurationHours * 3600;
  const runTotals: number[] = [];

  const totalBusyTimePerStation = new Array(numStations).fill(0);

  for (let run = 0; run < numMonteCarloRuns; run++) {
    let currentPartsProduced = 0;
    let simTime = 0;

    // Station state: availableAt
    const stationAvailableAt = new Array(numStations).fill(0);
    const stationFailUntil = new Array(numStations).fill(0);

    // Schedule next failure for each station
    const stationNextFailureAt = new Array(numStations).fill(0).map(() => {
      // Exponential time to failure
      return -Math.log(Math.max(1e-6, prng())) * mtbfHours * 3600;
    });

    while (simTime < simDurationSec) {
      // Simulate flow through serial line
      let partTime = simTime;

      for (let s = 0; s < numStations; s++) {
        // Check if breakdown occurs
        if (partTime >= stationNextFailureAt[s]) {
          const repairDuration = -Math.log(Math.max(1e-6, prng())) * mttrHours * 3600;
          stationFailUntil[s] = partTime + repairDuration;
          stationNextFailureAt[s] = stationFailUntil[s] + -Math.log(Math.max(1e-6, prng())) * mtbfHours * 3600;
        }

        const startAt = Math.max(partTime, stationAvailableAt[s], stationFailUntil[s]);
        // Stochastic cycle time: nominal +/- 15% Gaussian jitter
        const jitter = (prng() + prng() - 1.0) * 0.15;
        const actualCycle = stationNominalCycleTimesSec[s] * (1.0 + jitter);

        totalBusyTimePerStation[s] += actualCycle;
        stationAvailableAt[s] = startAt + actualCycle;
        partTime = stationAvailableAt[s];
      }

      if (partTime <= simDurationSec) {
        currentPartsProduced++;
        simTime = stationAvailableAt[0]; // Line cadence paced by entrance
      } else {
        break;
      }
    }

    runTotals.push(currentPartsProduced);
  }

  const meanTotal = runTotals.reduce((a, b) => a + b, 0) / runTotals.length;
  const throughputPerHourMean = meanTotal / simulationDurationHours;

  // 95% Confidence Interval
  const variance = runTotals.reduce((acc, t) => acc + Math.pow(t - meanTotal, 2), 0) / Math.max(1, runTotals.length - 1);
  const se = Math.sqrt(variance / runTotals.length);
  const ciLower = Math.max(0, throughputPerHourMean - (1.96 * se) / simulationDurationHours);
  const ciUpper = throughputPerHourMean + (1.96 * se) / simulationDurationHours;

  // Station utilization
  const totalSimSecondsAllRuns = numMonteCarloRuns * simDurationSec;
  const stationUtilizationPercentages = totalBusyTimePerStation.map((busy) =>
    Number(Math.min(100, (busy / totalSimSecondsAllRuns) * 100).toFixed(1))
  );

  const maxUtil = Math.max(...stationUtilizationPercentages);
  const bottleneckStationIndex = stationUtilizationPercentages.indexOf(maxUtil);

  return {
    seed,
    totalPartsProducedMean: Math.round(meanTotal),
    throughputPerHourMean: Number(throughputPerHourMean.toFixed(2)),
    confidenceInterval95: [Number(ciLower.toFixed(2)), Number(ciUpper.toFixed(2))],
    stationUtilizationPercentages,
    bottleneckStationIndex,
    monteCarloRunTotals: runTotals,
  };
}
