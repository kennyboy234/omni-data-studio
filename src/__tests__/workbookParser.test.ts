import { describe, it, expect } from 'vitest';
import { create12SheetFixtureWorkbook } from '../utils/workbookFixtureGenerator';
import { parseExcelWorkbookBuffer } from '../utils/excelWorkbookParser';
import { sha256Sync } from '../utils/cryptoIntegrity';

describe('A2: Excel Workbook Ingestion & Multi-Tab Acceptance Suite', () => {
  const { buffer, knownStats } = create12SheetFixtureWorkbook();
  const fileHash = sha256Sync(new Uint8Array(buffer));
  const parsed = parseExcelWorkbookBuffer(buffer, 'Industrial_Benchmark_12Sheet.xlsx', fileHash);

  it('preserves exact tab order and total sheet count of 12', () => {
    expect(parsed.totalSheets).toBe(12);
    expect(parsed.sheetNames).toEqual(knownStats.sheetNames);
  });

  it('preserves exact sheet names with trailing spaces intact ("A1.1 ")', () => {
    expect(parsed.sheetNames[1]).toBe('A1.1 ');
    const sheetMeta = Object.values(parsed.sheets).find((s) => s.rawName === 'A1.1 ');
    expect(sheetMeta).toBeDefined();
    expect(sheetMeta?.rawName).toBe('A1.1 ');
    expect(sheetMeta?.displayName).toBe('A1.1');
  });

  it('correctly maps Menu code "A.1.1" to target sheet "A1.1 "', () => {
    expect(parsed.hasMenuSheet).toBe(true);
    const catalogEntry = parsed.menuCatalog.find((c) => c.tableCode === 'A.1.1');
    expect(catalogEntry).toBeDefined();
    expect(catalogEntry?.matched).toBe(true);
    expect(catalogEntry?.targetSheetName).toBe('A1.1 ');
  });

  it('extracts unit "[USD Millions]" from sheet title without corrupting column data', () => {
    const sheetMeta = Object.values(parsed.sheets).find((s) => s.rawName === 'A1.1 ');
    expect(sheetMeta?.unit).toBe('USD Millions');
  });

  it('counts hyphen nil ("-") and not available ("n.a.") separately without coercing to zero', () => {
    const sheetMeta = Object.values(parsed.sheets).find((s) => s.rawName === 'A1.1 ');
    expect(sheetMeta?.specialCodesCount.hyphenNilCount).toBe(knownStats.sheetHyphens);
    expect(sheetMeta?.specialCodesCount.naCount).toBe(knownStats.sheetNAs);
    expect(parsed.specialCodesSummary.hyphenNilTotal).toBeGreaterThanOrEqual(knownStats.sheetHyphens);
    expect(parsed.specialCodesSummary.naTotal).toBeGreaterThanOrEqual(knownStats.sheetNAs);
  });

  it('extracts and isolates "Source:" and "Note:" footnotes from tabular data rows', () => {
    const sheetMeta = Object.values(parsed.sheets).find((s) => s.rawName === 'A1.1 ');
    expect(sheetMeta?.footnotes.length).toBeGreaterThan(0);
    const hasSource = sheetMeta?.footnotes.some((f) => f.includes('Central Industrial Operations Bureau'));
    expect(hasSource).toBe(true);
  });

  it('preserves merged header cell count and formula detection', () => {
    const sheetMeta = Object.values(parsed.sheets).find((s) => s.rawName === 'A1.1 ');
    expect(sheetMeta?.mergedCellsCount).toBe(knownStats.mergesCount);
    expect(sheetMeta?.hasFormulas).toBe(true);
    expect(sheetMeta?.formulaCellsCount).toBe(knownStats.sheetFormulas);
  });

  it('verifies original file cryptographic SHA-256 hash remains invariant', () => {
    expect(parsed.sha256).toBe(fileHash);
    // Re-hashing the buffer produces the identical hash
    const reHash = sha256Sync(new Uint8Array(buffer));
    expect(reHash).toBe(fileHash);
  });
});
