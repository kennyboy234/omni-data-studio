// Helper functions
export function getMean(arr) {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum / arr.length;
}

export function getMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export function getStd(arr) {
  if (!arr || arr.length < 2) return 0;
  const mean = getMean(arr);
  const variance = arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function getMode(arr) {
  const counts = {};
  let maxCount = 0;
  let mode = arr[0];
  arr.forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > maxCount) { maxCount = counts[v]; mode = v; }
  });
  return mode;
}

export function getQuartile(sorted, q) {
  if (!sorted || sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base] ?? 0;
}

// A. FREQUENCIES
export function runFrequencies(data, variable) {
  const total = data.length;
  const validValues = data.map((row) => row[variable]).filter((v) => v !== null && v !== undefined && v !== "");
  const valid = validValues.length;
  const missing = total - valid;
  const counts = {};
  validValues.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  let cumulative = 0;
  const table = Object.keys(counts).map((value) => {
    const freq = counts[value];
    const percent = (freq / total) * 100;
    const validPercent = valid > 0 ? (freq / valid) * 100 : 0;
    cumulative += validPercent;
    return { Value: value, Frequency: freq, Percent: Number(percent.toFixed(1)), ValidPercent: Number(validPercent.toFixed(1)), CumulativePercent: Number(cumulative.toFixed(1)) };
  });
  table.sort((a, b) => b.Frequency - a.Frequency);
  return { table, Total: total, Valid: valid, Missing: missing };
}

// B. DESCRIPTIVES
export function runDescriptives(data, variable) {
  const values = data.map((row) => Number(row[variable])).filter((v) => !isNaN(v));
  if (values.length === 0) {
    return {
      N: 0, Missing: data.length, Mean: 0, Median: 0, Mode: "-", Std: 0, Variance: 0, Min: 0, Max: 0, Range: 0, Q1: 0, Q3: 0
    };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mean = getMean(values);
  const std = getStd(values);
  const q1 = getQuartile(sorted, 0.25) ?? 0;
  const q3 = getQuartile(sorted, 0.75) ?? 0;
  const minVal = sorted[0] ?? 0;
  const maxVal = sorted[sorted.length - 1] ?? 0;
  return {
    N: values.length,
    Missing: data.length - values.length,
    Mean: Number(mean.toFixed(2)),
    Median: Number((getMedian(values) ?? 0).toFixed(2)),
    Mode: getMode(values) ?? "-",
    Std: Number(std.toFixed(2)),
    Variance: Number(Math.pow(std, 2).toFixed(2)),
    Min: minVal,
    Max: maxVal,
    Range: Number((maxVal - minVal).toFixed(2)),
    Q1: Number(q1.toFixed(2)),
    Q3: Number(q3.toFixed(2))
  };
}

// C. EXPLORE
export function runExplore(data, variable) {
  const desc = runDescriptives(data, variable);
  const values = data.map((row) => Number(row[variable])).filter((v) => !isNaN(v));
  if (values.length === 0) {
    return { ...desc, Skewness: 0, Kurtosis: 0, Outliers: [], OutlierCount: 0, Histogram: [], LowerBound: 0, UpperBound: 0 };
  }
  const mean = getMean(values);
  const std = getStd(values);
  // Handle case where std is 0 (all values same)
  const safeStd = std === 0 ? 1 : std;
  let skewSum = 0;
  values.forEach((x) => { skewSum += Math.pow((x - mean) / safeStd, 3); });
  const skewness = Number((skewSum / values.length).toFixed(2));
  let kurtSum = 0;
  values.forEach((x) => { kurtSum += Math.pow((x - mean) / safeStd, 4); });
  const kurtosis = Number(((kurtSum / values.length) - 3).toFixed(2));
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = getQuartile(sorted, 0.25);
  const q3 = getQuartile(sorted, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const outliers = values.filter((v) => v < lower || v > upper);
  // Histogram 5 bins
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const binWidth = (max - min) / 5;
  const histogram = [];
  for (let i = 0; i < 5; i++) {
    const binMin = min + i * binWidth;
    const binMax = min + (i + 1) * binWidth;
    const count = values.filter((v) => v >= binMin && (i === 4 ? v <= binMax : v < binMax)).length;
    histogram.push({ Bin: `${binMin.toFixed(1)} - ${binMax.toFixed(1)}`, Count: count });
  }
  return { ...desc, Skewness: skewness, Kurtosis: kurtosis, Outliers: outliers, OutlierCount: outliers.length, Histogram: histogram, LowerBound: Number(lower.toFixed(2)), UpperBound: Number(upper.toFixed(2)) };
}

// D. CROSSTABS
export function runCrosstabs(data, rowVar, colVar) {
  const rowValues = [...new Set(data.map((r) => r[rowVar]))];
  const colValues = [...new Set(data.map((r) => r[colVar]))];
  const table = [];
  rowValues.forEach((rowVal) => {
    const rowData = data.filter((r) => r[rowVar] === rowVal);
    const rowObj = { Row: rowVal, Total: rowData.length };
    colValues.forEach((colVal) => {
      const count = rowData.filter((r) => r[colVar] === colVal).length;
      rowObj[colVal] = count;
      rowObj[colVal + "_RowPct"] = rowData.length > 0 ? Number(((count / rowData.length) * 100).toFixed(1)) : 0;
    });
    table.push(rowObj);
  });
  const colTotals = {};
  colValues.forEach((colVal) => { colTotals[colVal] = data.filter((r) => r[colVar] === colVal).length; });
  return { table, RowValues: rowValues, ColValues: colValues, ColTotals: colTotals, Total: data.length, Valid: data.length, Missing: 0 };
}

export function getMissingCount(data, variable) {
  return data.filter((row) => row[variable] === null || row[variable] === undefined || row[variable] === "").length;
}