import {
  AssertionResult,
  ColumnProfile,
  DataQualityAssertion,
  Dataset,
  QualityValidationReport,
} from '../types';

/**
 * Auto-generate contract assertions based on profiling insights
 */
export function autoGenerateAssertions(dataset: Dataset): DataQualityAssertion[] {
  const assertions: DataQualityAssertion[] = [];

  // Table row count assertion
  assertions.push({
    id: 'assert_row_count',
    type: 'expect_table_row_count_to_be_between',
    parameters: {
      min: Math.max(1, Math.floor(dataset.data.length * 0.8)),
      max: Math.ceil(dataset.data.length * 1.5),
    },
    severity: 'error',
    description: `Expect table row count to be at least ${Math.floor(
      dataset.data.length * 0.8
    )} rows`,
  });

  dataset.profile.columns.forEach((col: ColumnProfile) => {
    // Non-null rule if currently 0 nulls or <= 5% nulls
    if (col.nullCount === 0) {
      assertions.push({
        id: `assert_not_null_${col.name}`,
        type: 'expect_column_values_to_not_be_null',
        column: col.name,
        parameters: {},
        severity: 'error',
        description: `Column "${col.name}" must not contain null or missing values`,
      });
    }

    // Unique rule for ID columns
    if (
      col.uniquePercentage > 98 &&
      (col.name.toLowerCase().includes('id') || col.name.toLowerCase().includes('key'))
    ) {
      assertions.push({
        id: `assert_unique_${col.name}`,
        type: 'expect_column_values_to_be_unique',
        column: col.name,
        parameters: {},
        severity: 'error',
        description: `Primary/Foreign key "${col.name}" values must be strictly unique`,
      });
    }

    // Numeric boundary assertions
    if ((col.type === 'integer' || col.type === 'float') && col.min !== undefined && col.max !== undefined) {
      // Buffer range slightly
      const lower = col.min < 0 ? col.min * 1.2 : col.min * 0.8;
      const upper = col.max > 0 ? col.max * 1.2 : col.max * 0.8;
      assertions.push({
        id: `assert_range_${col.name}`,
        type: 'expect_column_values_to_be_between',
        column: col.name,
        parameters: {
          min: Number(lower.toFixed(2)),
          max: Number(upper.toFixed(2)),
        },
        severity: 'warning',
        description: `Column "${col.name}" numeric values should fall between ${lower.toFixed(
          1
        )} and ${upper.toFixed(1)}`,
      });
    }

    // Categorical allowed set
    if (col.type === 'categorical' && col.topValues && col.topValues.length > 0 && col.topValues.length <= 8) {
      const allowed = col.topValues.map((t) => t.value);
      assertions.push({
        id: `assert_set_${col.name}`,
        type: 'expect_column_values_to_be_in_set',
        column: col.name,
        parameters: {
          allowedValues: allowed,
        },
        severity: 'warning',
        description: `Categorical "${col.name}" should only contain approved categories: ${allowed.join(', ')}`,
      });
    }
  });

  return assertions;
}

/**
 * Execute assertions against the dataset
 */
export function runQualityAssertions(
  dataset: Dataset,
  assertions: DataQualityAssertion[]
): QualityValidationReport {
  const rows = dataset.data;
  const totalRows = rows.length;
  const results: AssertionResult[] = [];

  for (const assertion of assertions) {
    const col = assertion.column;
    let unexpectedExamples: any[] = [];
    let unexpectedCount = 0;

    switch (assertion.type) {
      case 'expect_table_row_count_to_be_between': {
        const min = assertion.parameters.min ?? 1;
        const max = assertion.parameters.max ?? Infinity;
        const passed = totalRows >= min && totalRows <= max;
        results.push({
          assertionId: assertion.id,
          assertionType: assertion.type,
          status: passed ? 'passed' : 'failed',
          evaluatedRows: totalRows,
          unexpectedRowsCount: passed ? 0 : Math.abs(totalRows - min),
          unexpectedPercent: passed ? 0 : 100,
          unexpectedExamples: passed ? [] : [{ actualRowCount: totalRows, min, max }],
          message: passed
            ? `Table contains ${totalRows} rows, satisfying [${min}, ${max}] range constraint.`
            : `Table contains ${totalRows} rows, violating [${min}, ${max}] requirement!`,
        });
        break;
      }

      case 'expect_column_values_to_not_be_null': {
        if (!col) break;
        const failures: any[] = [];
        for (let i = 0; i < totalRows; i++) {
          const val = rows[i][col];
          if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
            if (failures.length < 5) failures.push({ rowIndex: i + 1, value: val });
            unexpectedCount++;
          }
        }
        const passed = unexpectedCount === 0;
        const percent = totalRows > 0 ? Number(((unexpectedCount / totalRows) * 100).toFixed(2)) : 0;
        results.push({
          assertionId: assertion.id,
          assertionType: assertion.type,
          column: col,
          status: passed ? 'passed' : assertion.severity === 'error' ? 'failed' : 'warning',
          evaluatedRows: totalRows,
          unexpectedRowsCount: unexpectedCount,
          unexpectedPercent: percent,
          unexpectedExamples: failures,
          message: passed
            ? `100% of rows have non-null values in "${col}".`
            : `Found ${unexpectedCount} null / missing values (${percent}%) in column "${col}".`,
        });
        break;
      }

      case 'expect_column_values_to_be_unique': {
        if (!col) break;
        const seen = new Map<string, number>();
        const duplicates: any[] = [];
        for (let i = 0; i < totalRows; i++) {
          const val = rows[i][col];
          if (val !== null && val !== undefined) {
            const key = String(val);
            if (seen.has(key)) {
              if (duplicates.length < 5) duplicates.push({ rowIndex: i + 1, duplicateValue: key });
              unexpectedCount++;
            } else {
              seen.set(key, i);
            }
          }
        }
        const passed = unexpectedCount === 0;
        const percent = totalRows > 0 ? Number(((unexpectedCount / totalRows) * 100).toFixed(2)) : 0;
        results.push({
          assertionId: assertion.id,
          assertionType: assertion.type,
          column: col,
          status: passed ? 'passed' : assertion.severity === 'error' ? 'failed' : 'warning',
          evaluatedRows: totalRows,
          unexpectedRowsCount: unexpectedCount,
          unexpectedPercent: percent,
          unexpectedExamples: duplicates,
          message: passed
            ? `All values in column "${col}" are completely unique.`
            : `Found ${unexpectedCount} duplicate instances (${percent}%) in unique column "${col}".`,
        });
        break;
      }

      case 'expect_column_values_to_be_between': {
        if (!col) break;
        const min = assertion.parameters.min ?? -Infinity;
        const max = assertion.parameters.max ?? Infinity;
        const outOfBounds: any[] = [];
        for (let i = 0; i < totalRows; i++) {
          const val = rows[i][col];
          if (val !== null && val !== undefined && !isNaN(Number(val))) {
            const num = Number(val);
            if (num < min || num > max) {
              if (outOfBounds.length < 5) outOfBounds.push({ rowIndex: i + 1, value: num, bound: num < min ? `< ${min}` : `> ${max}` });
              unexpectedCount++;
            }
          }
        }
        const passed = unexpectedCount === 0;
        const percent = totalRows > 0 ? Number(((unexpectedCount / totalRows) * 100).toFixed(2)) : 0;
        results.push({
          assertionId: assertion.id,
          assertionType: assertion.type,
          column: col,
          status: passed ? 'passed' : assertion.severity === 'error' ? 'failed' : 'warning',
          evaluatedRows: totalRows,
          unexpectedRowsCount: unexpectedCount,
          unexpectedPercent: percent,
          unexpectedExamples: outOfBounds,
          message: passed
            ? `All evaluated values in "${col}" reside within expected range [${min}, ${max}].`
            : `Detected ${unexpectedCount} out-of-range values in "${col}" outside [${min}, ${max}].`,
        });
        break;
      }

      case 'expect_column_values_to_be_in_set': {
        if (!col) break;
        const allowed = new Set(assertion.parameters.allowedValues || []);
        const invalid: any[] = [];
        for (let i = 0; i < totalRows; i++) {
          const val = rows[i][col];
          if (val !== null && val !== undefined && !allowed.has(String(val))) {
            if (invalid.length < 5) invalid.push({ rowIndex: i + 1, value: String(val) });
            unexpectedCount++;
          }
        }
        const passed = unexpectedCount === 0;
        const percent = totalRows > 0 ? Number(((unexpectedCount / totalRows) * 100).toFixed(2)) : 0;
        results.push({
          assertionId: assertion.id,
          assertionType: assertion.type,
          column: col,
          status: passed ? 'passed' : assertion.severity === 'error' ? 'failed' : 'warning',
          evaluatedRows: totalRows,
          unexpectedRowsCount: unexpectedCount,
          unexpectedPercent: percent,
          unexpectedExamples: invalid,
          message: passed
            ? `All values in "${col}" match defined categorical domain.`
            : `Encountered ${unexpectedCount} non-permitted categorical values in "${col}".`,
        });
        break;
      }

      default:
        break;
    }
  }

  const passedCount = results.filter((r) => r.status === 'passed').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const warningCount = results.filter((r) => r.status === 'warning').length;
  const qualityScorePercent =
    results.length > 0 ? Math.round((passedCount / results.length) * 100) : 100;

  return {
    timestamp: new Date().toISOString(),
    datasetId: dataset.id,
    totalAssertions: results.length,
    passedCount,
    failedCount,
    warningCount,
    qualityScorePercent,
    results,
  };
}

/**
 * Generate dbt data tests YAML
 */
export function exportDbtTestsYaml(datasetName: string, assertions: DataQualityAssertion[]): string {
  let yaml = `version: 2\n\nmodels:\n  - name: ${datasetName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}\n    description: "Autogenerated dbt tests from OmniData Studio"\n    columns:\n`;

  const colMap = new Map<string, string[]>();
  assertions.forEach((a) => {
    if (!a.column) return;
    if (!colMap.has(a.column)) colMap.set(a.column, []);
    if (a.type === 'expect_column_values_to_not_be_null') colMap.get(a.column)!.push('not_null');
    if (a.type === 'expect_column_values_to_be_unique') colMap.get(a.column)!.push('unique');
    if (a.type === 'expect_column_values_to_be_in_set' && a.parameters.allowedValues) {
      colMap.get(a.column)!.push(`accepted_values:\n            values: [${a.parameters.allowedValues.map(v => `'${v}'`).join(', ')}]`);
    }
  });

  colMap.forEach((tests, col) => {
    yaml += `      - name: ${col}\n        tests:\n`;
    tests.forEach((t) => {
      yaml += `          - ${t}\n`;
    });
  });

  return yaml;
}
