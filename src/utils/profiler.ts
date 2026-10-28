import { ColumnProfile, DatasetProfile, DataType } from '../types';

/**
 * Infer data type of a column based on sample non-null values
 */
export function inferDataType(values: any[]): DataType {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'string';

  let boolCount = 0;
  let intCount = 0;
  let floatCount = 0;
  let dateCount = 0;

  for (const val of nonNulls.slice(0, 100)) {
    if (typeof val === 'boolean' || val === 'true' || val === 'false') {
      boolCount++;
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) intCount++;
      else floatCount++;
    } else if (typeof val === 'string') {
      const trimmed = val.trim();
      if (/^-?\d+$/.test(trimmed)) {
        intCount++;
      } else if (/^-?\d+\.\d+$/.test(trimmed)) {
        floatCount++;
      } else if (
        /^\d{4}-\d{2}-\d{2}/.test(trimmed) ||
        !isNaN(Date.parse(trimmed)) && trimmed.length > 5 && (trimmed.includes('-') || trimmed.includes('/'))
      ) {
        dateCount++;
      }
    }
  }

  const sampleSize = Math.min(nonNulls.length, 100);
  if (boolCount / sampleSize > 0.8) return 'boolean';
  if (intCount / sampleSize > 0.8) return 'integer';
  if ((intCount + floatCount) / sampleSize > 0.8) return 'float';
  if (dateCount / sampleSize > 0.8) return 'datetime';

  // Check if categorical (low cardinality)
  const uniqueSet = new Set(nonNulls.slice(0, 200));
  if (uniqueSet.size <= Math.min(10, Math.floor(sampleSize * 0.2))) {
    return 'categorical';
  }

  return 'string';
}

/**
 * Calculate statistical profile for a numeric array
 */
function calculateNumericStats(numbers: number[]) {
  if (numbers.length === 0) return {};
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];

  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / n;

  // Quartiles
  const getQuantile = (q: number) => {
    const pos = (n - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  const q1 = getQuantile(0.25);
  const median = getQuantile(0.5);
  const q3 = getQuantile(0.75);
  const iqr = q3 - q1;

  // Standard deviation, skewness, kurtosis
  const variance =
    n > 1
      ? sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
      : 0;
  const std = Math.sqrt(variance);

  let skewness = 0;
  let kurtosis = 0;
  if (std > 0 && n > 2) {
    const m3 = sorted.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0) / n;
    const m4 = sorted.reduce((acc, v) => acc + Math.pow((v - mean) / std, 4), 0) / n;
    skewness = Number(m3.toFixed(3));
    kurtosis = Number((m4 - 3).toFixed(3)); // Excess kurtosis
  }

  return {
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    std: Number(std.toFixed(4)),
    q1: Number(q1.toFixed(4)),
    q3: Number(q3.toFixed(4)),
    iqr: Number(iqr.toFixed(4)),
    skewness,
    kurtosis,
  };
}

/**
 * Profile an entire dataset
 */
export function profileDataset(data: Record<string, any>[]): DatasetProfile {
  const rowCount = data.length;
  if (rowCount === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      memoryEstimateBytes: 0,
      duplicateRowCount: 0,
      columns: [],
      summaryCalculatedAt: new Date().toISOString(),
    };
  }

  const columnNames = Object.keys(data[0] || {});
  const columnCount = columnNames.length;

  // Estimate memory
  const jsonString = JSON.stringify(data.slice(0, 50));
  const avgRowBytes = jsonString.length / Math.min(50, rowCount);
  const memoryEstimateBytes = Math.round(avgRowBytes * rowCount);

  // Check duplicate rows using a sample or set
  const rowSignatures = new Set<string>();
  let duplicateRowCount = 0;
  for (let i = 0; i < rowCount; i++) {
    const sig = JSON.stringify(data[i]);
    if (rowSignatures.has(sig)) {
      duplicateRowCount++;
    } else {
      rowSignatures.add(sig);
    }
  }

  const columns: ColumnProfile[] = columnNames.map((colName) => {
    const rawValues = data.map((row) => row[colName]);
    const totalCount = rawValues.length;
    const nullCount = rawValues.filter(
      (v) => v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v))
    ).length;
    const nullPercentage = Number(((nullCount / totalCount) * 100).toFixed(2));

    const nonNullValues = rawValues.filter(
      (v) => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && isNaN(v))
    );

    const type = inferDataType(nonNullValues);

    const uniqueSet = new Set(nonNullValues.map((v) => String(v)));
    const distinctCount = uniqueSet.size;
    const uniquePercentage = Number(((distinctCount / Math.max(1, nonNullValues.length)) * 100).toFixed(2));

    const sampleValues = nonNullValues.slice(0, 5);

    let numericStats = {};
    if (type === 'integer' || type === 'float') {
      const numbers = nonNullValues
        .map((v) => Number(v))
        .filter((n) => !isNaN(n) && isFinite(n));
      numericStats = calculateNumericStats(numbers);
    }

    // Categorical frequencies
    const freqMap: Record<string, number> = {};
    for (const val of nonNullValues) {
      const s = String(val);
      freqMap[s] = (freqMap[s] || 0) + 1;
    }
    const topValues = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({
        value,
        count,
        percentage: Number(((count / Math.max(1, nonNullValues.length)) * 100).toFixed(1)),
      }));

    return {
      name: colName,
      type,
      totalCount,
      nullCount,
      nullPercentage,
      distinctCount,
      uniquePercentage,
      sampleValues,
      topValues,
      ...numericStats,
    };
  });

  return {
    rowCount,
    columnCount,
    memoryEstimateBytes,
    duplicateRowCount,
    columns,
    summaryCalculatedAt: new Date().toISOString(),
  };
}
