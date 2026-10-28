import { CleaningActionType, CleaningStep, Dataset, DataType } from '../types';
import { profileDataset } from './profiler';

export interface CleaningImpactPreview {
  action: CleaningActionType;
  column?: string;
  rowsBefore: number;
  rowsAfter: number;
  rowsAffected: number;
  nullsBefore: number;
  nullsAfter: number;
  details: string;
  sampleModifiedRows: { before: any; after: any }[];
}

/**
 * Preview the exact impact of a cleaning action before applying
 */
export function previewCleaningImpact(
  dataset: Dataset,
  action: CleaningActionType,
  column?: string,
  params: CleaningStep['parameters'] = {}
): CleaningImpactPreview {
  const data = dataset.data;
  const rowsBefore = data.length;

  let nullsBefore = 0;
  if (column) {
    nullsBefore = data.filter(
      (r) => r[column] === null || r[column] === undefined || r[column] === ''
    ).length;
  } else {
    data.forEach((r) => {
      Object.values(r).forEach((v) => {
        if (v === null || v === undefined || v === '') nullsBefore++;
      });
    });
  }

  let rowsAfter = rowsBefore;
  let rowsAffected = 0;
  let nullsAfter = nullsBefore;
  let details = '';
  const sampleModifiedRows: { before: any; after: any }[] = [];

  switch (action) {
    case 'drop_null_rows': {
      if (column) {
        const kept = data.filter((r) => r[column] !== null && r[column] !== undefined && r[column] !== '');
        rowsAfter = kept.length;
        rowsAffected = rowsBefore - rowsAfter;
        nullsAfter = 0;
        details = `Dropping ${rowsAffected} rows containing null values in column "${column}".`;
      } else {
        const kept = data.filter((r) =>
          Object.values(r).every((v) => v !== null && v !== undefined && v !== '')
        );
        rowsAfter = kept.length;
        rowsAffected = rowsBefore - rowsAfter;
        nullsAfter = 0;
        details = `Dropping ${rowsAffected} rows with any missing values across all columns.`;
      }
      break;
    }

    case 'impute_nulls': {
      if (!column) break;
      rowsAffected = nullsBefore;
      nullsAfter = 0;
      const strategy = params.strategy || 'mean';
      details = `Imputing ${rowsAffected} missing cells in "${column}" using ${strategy.toUpperCase()} strategy.`;
      break;
    }

    case 'drop_duplicates': {
      const seen = new Set<string>();
      let dupes = 0;
      data.forEach((r) => {
        const sig = column ? String(r[column]) : JSON.stringify(r);
        if (seen.has(sig)) dupes++;
        else seen.add(sig);
      });
      rowsAffected = dupes;
      rowsAfter = rowsBefore - dupes;
      details = `Removing ${dupes} duplicate rows (${((dupes / rowsBefore) * 100).toFixed(1)}% of dataset).`;
      break;
    }

    case 'filter_outliers_iqr': {
      if (!column) break;
      const nums = data.map((r) => Number(r[column])).filter((n) => !isNaN(n)).sort((a, b) => a - b);
      const q1 = nums[Math.floor(nums.length * 0.25)] || 0;
      const q3 = nums[Math.floor(nums.length * 0.75)] || 0;
      const iqr = q3 - q1;
      const mult = params.iqrMultiplier || 1.5;
      const lower = q1 - mult * iqr;
      const upper = q3 + mult * iqr;

      const outliers = data.filter((r) => {
        const val = Number(r[column]);
        return !isNaN(val) && (val < lower || val > upper);
      });
      rowsAffected = outliers.length;
      rowsAfter = rowsBefore - rowsAffected;
      details = `Filtering out ${rowsAffected} statistical outliers outside IQR range [${lower.toFixed(2)}, ${upper.toFixed(2)}].`;
      break;
    }

    case 'clamp_outliers_iqr': {
      if (!column) break;
      const nums = data.map((r) => Number(r[column])).filter((n) => !isNaN(n)).sort((a, b) => a - b);
      const q1 = nums[Math.floor(nums.length * 0.25)] || 0;
      const q3 = nums[Math.floor(nums.length * 0.75)] || 0;
      const iqr = q3 - q1;
      const mult = params.iqrMultiplier || 1.5;
      const lower = q1 - mult * iqr;
      const upper = q3 + mult * iqr;

      const outliers = data.filter((r) => {
        const val = Number(r[column]);
        return !isNaN(val) && (val < lower || val > upper);
      });
      rowsAffected = outliers.length;
      rowsAfter = rowsBefore;
      details = `Winsorizing/clamping ${rowsAffected} outlier values in "${column}" to boundary [${lower.toFixed(2)}, ${upper.toFixed(2)}].`;
      break;
    }

    case 'cast_type': {
      if (!column || !params.targetType) break;
      rowsAffected = rowsBefore;
      details = `Casting column "${column}" to type ${params.targetType.toUpperCase()}.`;
      break;
    }

    case 'text_normalize': {
      if (!column) break;
      rowsAffected = rowsBefore;
      details = `Applying ${params.textOperation} normalization to text column "${column}".`;
      break;
    }

    default:
      details = `Executing ${action}.`;
  }

  return {
    action,
    column,
    rowsBefore,
    rowsAfter,
    rowsAffected,
    nullsBefore,
    nullsAfter,
    details,
    sampleModifiedRows,
  };
}

/**
 * Apply cleaning transformation and return a brand new versioned Dataset (preserving original source)
 */
export function applyCleaningStep(
  sourceDataset: Dataset,
  action: CleaningActionType,
  column?: string,
  params: CleaningStep['parameters'] = {}
): { updatedDataset: Dataset; stepRecord: CleaningStep } {
  const originalData = sourceDataset.data;
  let newData: Record<string, any>[] = originalData.map((row) => ({ ...row }));
  const preview = previewCleaningImpact(sourceDataset, action, column, params);

  switch (action) {
    case 'drop_null_rows': {
      if (column) {
        newData = newData.filter(
          (r) => r[column] !== null && r[column] !== undefined && r[column] !== ''
        );
      } else {
        newData = newData.filter((r) =>
          Object.values(r).every((v) => v !== null && v !== undefined && v !== '')
        );
      }
      break;
    }

    case 'impute_nulls': {
      if (!column) break;
      const strategy = params.strategy || 'mean';
      const validValues = originalData
        .map((r) => r[column])
        .filter((v) => v !== null && v !== undefined && v !== '');

      let fillValue: any = null;
      if (strategy === 'mean' || strategy === 'median') {
        const nums = validValues.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
        if (strategy === 'mean' && nums.length > 0) {
          fillValue = Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
        } else if (strategy === 'median' && nums.length > 0) {
          fillValue = nums[Math.floor(nums.length / 2)];
        }
      } else if (strategy === 'mode') {
        const counts: Record<string, number> = {};
        validValues.forEach((v) => {
          counts[String(v)] = (counts[String(v)] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted[0]) fillValue = sorted[0][0];
      } else if (strategy === 'constant') {
        fillValue = params.constantValue ?? 0;
      }

      let lastSeen = fillValue;
      newData = newData.map((row) => {
        const val = row[column];
        if (val === null || val === undefined || val === '') {
          return { ...row, [column]: strategy === 'forward_fill' ? lastSeen : fillValue };
        }
        lastSeen = val;
        return row;
      });
      break;
    }

    case 'drop_duplicates': {
      const seen = new Set<string>();
      const deduped: Record<string, any>[] = [];
      newData.forEach((row) => {
        const sig = column ? String(row[column]) : JSON.stringify(row);
        if (!seen.has(sig)) {
          seen.add(sig);
          deduped.push(row);
        }
      });
      newData = deduped;
      break;
    }

    case 'filter_outliers_iqr': {
      if (!column) break;
      const nums = originalData
        .map((r) => Number(r[column]))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);
      const q1 = nums[Math.floor(nums.length * 0.25)] || 0;
      const q3 = nums[Math.floor(nums.length * 0.75)] || 0;
      const iqr = q3 - q1;
      const mult = params.iqrMultiplier || 1.5;
      const lower = q1 - mult * iqr;
      const upper = q3 + mult * iqr;

      newData = newData.filter((r) => {
        const val = Number(r[column]);
        return isNaN(val) || (val >= lower && val <= upper);
      });
      break;
    }

    case 'clamp_outliers_iqr': {
      if (!column) break;
      const nums = originalData
        .map((r) => Number(r[column]))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);
      const q1 = nums[Math.floor(nums.length * 0.25)] || 0;
      const q3 = nums[Math.floor(nums.length * 0.75)] || 0;
      const iqr = q3 - q1;
      const mult = params.iqrMultiplier || 1.5;
      const lower = q1 - mult * iqr;
      const upper = q3 + mult * iqr;

      newData = newData.map((r) => {
        const val = Number(r[column]);
        if (!isNaN(val)) {
          if (val < lower) return { ...r, [column]: Number(lower.toFixed(2)) };
          if (val > upper) return { ...r, [column]: Number(upper.toFixed(2)) };
        }
        return r;
      });
      break;
    }

    case 'cast_type': {
      if (!column || !params.targetType) break;
      newData = newData.map((r) => {
        const val = r[column];
        if (val === null || val === undefined) return r;
        let converted: any = val;
        if (params.targetType === 'integer') converted = parseInt(val, 10);
        else if (params.targetType === 'float') converted = parseFloat(val);
        else if (params.targetType === 'string') converted = String(val);
        else if (params.targetType === 'boolean') converted = Boolean(val);
        return { ...r, [column]: isNaN(converted) ? null : converted };
      });
      break;
    }

    case 'text_normalize': {
      if (!column) break;
      newData = newData.map((r) => {
        const val = r[column];
        if (typeof val !== 'string') return r;
        let clean = val;
        if (params.textOperation === 'trim') clean = clean.trim();
        else if (params.textOperation === 'lowercase') clean = clean.toLowerCase();
        else if (params.textOperation === 'uppercase') clean = clean.toUpperCase();
        else if (params.textOperation === 'remove_special') clean = clean.replace(/[^a-zA-Z0-9_\s]/g, '');
        return { ...r, [column]: clean };
      });
      break;
    }

    default:
      break;
  }

  const stepRecord: CleaningStep = {
    id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    action,
    column,
    parameters: params,
    impactSummary: {
      affectedRows: preview.rowsAffected,
      description: preview.details,
      nullsBefore: preview.nullsBefore,
      nullsAfter: preview.nullsAfter,
    },
  };

  const newProfile = profileDataset(newData);
  const updatedDataset: Dataset = {
    id: `${sourceDataset.id}_v${sourceDataset.version + 1}`,
    name: `${sourceDataset.name.replace(/ \(Cleaned v\d+\)/, '')} (Cleaned v${sourceDataset.version + 1})`,
    version: sourceDataset.version + 1,
    isImmutableSource: false,
    parentDatasetId: sourceDataset.id,
    sourceType: 'cleaned_output',
    sha256Hash: `clean_${Date.now().toString(16)}`,
    createdAt: new Date().toISOString(),
    data: newData,
    profile: newProfile,
    columns: Object.keys(newData[0] || {}),
  };

  return { updatedDataset, stepRecord };
}
