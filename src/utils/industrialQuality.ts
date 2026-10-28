/**
 * ====================================================================
 * OMNIDATA INDUSTRIAL AUTONOMY: SENSOR DATA QUALITY ENGINE
 * Section 2 & Phase B4: Robust Z-Score (Median/MAD), Stuck-Values,
 * Dropouts, Clock Skew, Out-of-Range, and Critical Gating
 * ====================================================================
 */

export interface TelemetryReading {
  timestamp: string; // ISO-8601 or unix ms
  value: number;
  tagId: string;
  tagName: string;
}

export interface SensorQualityCheckResult {
  checkName: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  summary: string;
  metricValue: number;
  threshold: number;
  failingRowsCount: number;
  sampleFailingRows: { timestamp: string; value: number; reason: string }[];
  isCriticalBlocking: boolean;
}

export interface SensorTelemetryAuditReport {
  tagId: string;
  tagName: string;
  overallStatus: 'PASS' | 'WARNING' | 'FAIL';
  totalReadingsEvaluated: number;
  checks: SensorQualityCheckResult[];
  blocksDownstreamAnalysis: boolean;
}

// Robust Median and MAD (Median Absolute Deviation)
export function computeMedianAndMad(values: number[]): { median: number; mad: number } {
  if (values.length === 0) return { median: 0, mad: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const deviations = sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
  const madMid = Math.floor(deviations.length / 2);
  const rawMad = deviations.length % 2 !== 0 ? deviations[madMid] : (deviations[madMid - 1] + deviations[madMid]) / 2;
  // Normalized MAD for Gaussian consistency (1.4826 * rawMad)
  const mad = Math.max(1e-6, 1.4826 * rawMad);

  return { median, mad };
}

/**
 * Evaluates comprehensive sensor quality checks against a telemetry stream
 */
export function auditSensorTelemetryStream(
  readings: TelemetryReading[],
  tagConfig: {
    tagId: string;
    tagName: string;
    validRange: [number, number];
    samplingRateHz: number;
  }
): SensorTelemetryAuditReport {
  const checks: SensorQualityCheckResult[] = [];
  const n = readings.length;

  if (n === 0) {
    return {
      tagId: tagConfig.tagId,
      tagName: tagConfig.tagName,
      overallStatus: 'FAIL',
      totalReadingsEvaluated: 0,
      checks: [
        {
          checkName: 'Stream Liveness Check',
          status: 'FAIL',
          summary: 'Telemetry stream contains zero data points.',
          metricValue: 0,
          threshold: 1,
          failingRowsCount: 0,
          sampleFailingRows: [],
          isCriticalBlocking: true,
        },
      ],
      blocksDownstreamAnalysis: true,
    };
  }

  const values = readings.map((r) => r.value);
  const { median, mad } = computeMedianAndMad(values);

  // 1. Stuck / Flat-line Detection: Check if value does not change for > 8 consecutive readings
  let maxConsecutiveStuck = 1;
  let currentStuck = 1;
  const stuckSamples: { timestamp: string; value: number; reason: string }[] = [];

  for (let i = 1; i < n; i++) {
    if (Math.abs(values[i] - values[i - 1]) < 1e-6) {
      currentStuck++;
      if (currentStuck >= 8) {
        stuckSamples.push({
          timestamp: readings[i].timestamp,
          value: values[i],
          reason: `Stuck flat-line value repeated for ${currentStuck} consecutive intervals`,
        });
      }
    } else {
      currentStuck = 1;
    }
    if (currentStuck > maxConsecutiveStuck) maxConsecutiveStuck = currentStuck;
  }

  const stuckStatus = maxConsecutiveStuck >= 10 ? 'FAIL' : maxConsecutiveStuck >= 6 ? 'WARNING' : 'PASS';
  checks.push({
    checkName: 'Flat-line / Stuck Value Check',
    status: stuckStatus,
    summary:
      stuckStatus === 'PASS'
        ? `No persistent flat-line detected (max consecutive repeats: ${maxConsecutiveStuck})`
        : `Stuck sensor detected: constant value repeated for ${maxConsecutiveStuck} consecutive intervals`,
    metricValue: maxConsecutiveStuck,
    threshold: 8,
    failingRowsCount: stuckSamples.length,
    sampleFailingRows: stuckSamples.slice(0, 3),
    isCriticalBlocking: stuckStatus === 'FAIL',
  });

  // 2. Spike Detection via Robust Z-Score (Median/MAD)
  const spikeSamples: { timestamp: string; value: number; reason: string }[] = [];
  const spikeZThreshold = 4.5;

  for (let i = 0; i < n; i++) {
    const robustZ = Math.abs(values[i] - median) / mad;
    if (robustZ > spikeZThreshold) {
      spikeSamples.push({
        timestamp: readings[i].timestamp,
        value: values[i],
        reason: `Robust Z-score ${robustZ.toFixed(2)} exceeds critical outlier threshold ${spikeZThreshold}`,
      });
    }
  }

  const spikeStatus = spikeSamples.length > 5 ? 'FAIL' : spikeSamples.length > 0 ? 'WARNING' : 'PASS';
  checks.push({
    checkName: 'Transient Spike Anomaly Check',
    status: spikeStatus,
    summary:
      spikeStatus === 'PASS'
        ? 'Zero statistical outliers detected by Median Absolute Deviation.'
        : `Detected ${spikeSamples.length} outlier spike(s) deviating beyond 4.5 MAD bounds.`,
    metricValue: spikeSamples.length,
    threshold: 0,
    failingRowsCount: spikeSamples.length,
    sampleFailingRows: spikeSamples.slice(0, 3),
    isCriticalBlocking: false,
  });

  // 3. Out-of-Range Bounds Check (Physical Sensor Limits)
  const [minBound, maxBound] = tagConfig.validRange;
  const outOfRangeSamples: { timestamp: string; value: number; reason: string }[] = [];

  for (let i = 0; i < n; i++) {
    if (values[i] < minBound || values[i] > maxBound) {
      outOfRangeSamples.push({
        timestamp: readings[i].timestamp,
        value: values[i],
        reason: `Value ${values[i]} is outside physical operational envelope [${minBound}, ${maxBound}]`,
      });
    }
  }

  const rangeStatus = outOfRangeSamples.length > 0 ? 'FAIL' : 'PASS';
  checks.push({
    checkName: 'Physical Range Envelope Check',
    status: rangeStatus,
    summary:
      rangeStatus === 'PASS'
        ? `All ${n} points conform to valid envelope [${minBound}, ${maxBound}]`
        : `${outOfRangeSamples.length} readings violated physical bounds [${minBound}, ${maxBound}]`,
    metricValue: outOfRangeSamples.length,
    threshold: 0,
    failingRowsCount: outOfRangeSamples.length,
    sampleFailingRows: outOfRangeSamples.slice(0, 3),
    isCriticalBlocking: rangeStatus === 'FAIL',
  });

  // 4. Timestamp Monotonicity & Clock Skew
  const expectedIntervalMs = (1.0 / tagConfig.samplingRateHz) * 1000;
  const timingSamples: { timestamp: string; value: number; reason: string }[] = [];

  for (let i = 1; i < n; i++) {
    const tPrev = new Date(readings[i - 1].timestamp).getTime();
    const tCurr = new Date(readings[i].timestamp).getTime();
    const delta = tCurr - tPrev;

    if (delta <= 0) {
      timingSamples.push({
        timestamp: readings[i].timestamp,
        value: values[i],
        reason: delta === 0 ? 'Duplicate timestamp detected' : 'Non-monotonic retrograde clock skew',
      });
    } else if (delta > expectedIntervalMs * 4.0) {
      timingSamples.push({
        timestamp: readings[i].timestamp,
        value: values[i],
        reason: `Data dropout gap: interval ${delta}ms exceeds 4x expected ${expectedIntervalMs}ms`,
      });
    }
  }

  const timingStatus = timingSamples.length > 3 ? 'FAIL' : timingSamples.length > 0 ? 'WARNING' : 'PASS';
  checks.push({
    checkName: 'Timestamp Monotonicity & Dropout Gap Check',
    status: timingStatus,
    summary:
      timingStatus === 'PASS'
        ? `Sampling interval cadence consistent with ${tagConfig.samplingRateHz} Hz`
        : `Detected ${timingSamples.length} timestamp anomaly / gap dropout event(s)`,
    metricValue: timingSamples.length,
    threshold: 0,
    failingRowsCount: timingSamples.length,
    sampleFailingRows: timingSamples.slice(0, 3),
    isCriticalBlocking: timingStatus === 'FAIL',
  });

  const hasCriticalFail = checks.some((c) => c.status === 'FAIL' && c.isCriticalBlocking);
  const hasWarning = checks.some((c) => c.status === 'WARNING');
  const overallStatus = hasCriticalFail ? 'FAIL' : hasWarning ? 'WARNING' : 'PASS';

  return {
    tagId: tagConfig.tagId,
    tagName: tagConfig.tagName,
    overallStatus,
    totalReadingsEvaluated: n,
    checks,
    blocksDownstreamAnalysis: hasCriticalFail,
  };
}
