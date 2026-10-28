/**
 * ====================================================================
 * OMNIDATA STUDIO: EXCEL WORKBOOK INGESTION & MULTI-TAB ENGINE
 * Section 18: High-Fidelity Multi-Tab Ingestion, Structure Recognition,
 * Special Codes (- vs n.a.) & Provenance Tracing
 * ====================================================================
 */

import * as XLSX from 'xlsx';

export interface ExcelSheetMetadata {
  id: string;
  rawName: string; // Exact original string with trailing spaces intact (e.g. 'A1.1 ')
  displayName: string;
  index: number;
  rowCount: number;
  colCount: number;
  mergedCellsCount: number;
  frozenRows?: number;
  frozenCols?: number;
  title?: string;
  tableCode?: string;
  unit?: string;
  periodRange?: string;
  specialCodesCount: {
    hyphenNilCount: number; // '-' (nil/zero)
    naCount: number;        // 'n.a.' (not available)
    otherFlags: Record<string, number>;
  };
  hasFormulas: boolean;
  formulaCellsCount: number;
  footnotes: string[];
  sampleRows: Record<string, any>[];
  allHeaders: string[];
}

export interface ExcelTableCatalogEntry {
  tableCode: string;
  normalizedCode: string;
  title: string;
  targetSheetName: string;
  targetSheetId: string;
  unit?: string;
  periodCoverage?: string;
  matched: boolean;
}

export interface ParsedWorkbookModel {
  fileName: string;
  sha256: string;
  fileSizeBytes: number;
  totalSheets: number;
  sheetNames: string[];
  sheets: Record<string, ExcelSheetMetadata>;
  menuCatalog: ExcelTableCatalogEntry[];
  hasMenuSheet: boolean;
  totalFormulasDetected: number;
  specialCodesSummary: {
    hyphenNilTotal: number;
    naTotal: number;
  };
  primaryDatasetRows: Record<string, any>[];
  primarySheetId: string;
}

/**
 * Detects whether a file buffer starts with the ZIP magic signature (PK\x03\x04)
 * used by .xlsx, .xlsm, .docx, .zip, etc.
 */
export function isZipOrExcelSignature(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 4) return false;
  // PK\x03\x04 or PK\x05\x06 or PK\x07\x08
  return bytes[0] === 0x50 && bytes[1] === 0x4b && (
    (bytes[2] === 0x03 && bytes[3] === 0x04) ||
    (bytes[2] === 0x05 && bytes[3] === 0x06) ||
    (bytes[2] === 0x07 && bytes[3] === 0x08)
  );
}

/**
 * Checks for binary null bytes or non-printable ASCII content to protect against
 * decoding binary files as plain text or CSV.
 */
export function isBinaryGarbage(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const sampleLen = Math.min(bytes.length, 4096);
  let nullBytes = 0;
  let controlChars = 0;

  for (let i = 0; i < sampleLen; i++) {
    const b = bytes[i];
    if (b === 0) nullBytes++;
    // Characters outside ASCII printables and standard whitespace
    if (b < 32 && b !== 9 && b !== 10 && b !== 13) {
      controlChars++;
    }
  }

  // If there are null bytes or >10% control chars, it's a binary file
  return nullBytes > 0 || controlChars / sampleLen > 0.1;
}

/**
 * Normalizes table codes like 'A.1.1' or 'A1.1 ' to a common key 'a11'
 */
export function normalizeTableCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * High-fidelity Excel Workbook parser with multi-sheet structure detection
 */
export function parseExcelWorkbookBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  fileSha256: string
): ParsedWorkbookModel {
  // Read workbook preserving dates, formulas, and styles
  const wb = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellFormula: true,
    cellStyles: true,
    cellNF: true,
  });

  const sheetNames = wb.SheetNames;
  const sheetsMeta: Record<string, ExcelSheetMetadata> = {};
  let totalFormulasDetected = 0;
  let totalHyphens = 0;
  let totalNAs = 0;

  // 1. Process each sheet with high fidelity
  sheetNames.forEach((sheetName, index) => {
    const ws = wb.Sheets[sheetName];
    const merges = ws['!merges'] || [];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;

    let sheetHyphenCount = 0;
    let sheetNaCount = 0;
    let sheetFormulaCount = 0;
    const footnotes: string[] = [];

    // Scan cells for formulas, special codes and footnotes
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellRef];
        if (!cell) continue;

        if (cell.f) {
          sheetFormulaCount++;
        }

        const rawVal = cell.v;
        const textVal = String(rawVal ?? '').trim();

        if (textVal === '-' || textVal === '–' || textVal === '—') {
          sheetHyphenCount++;
        } else if (textVal.toLowerCase() === 'n.a.' || textVal.toLowerCase() === 'na' || textVal.toLowerCase() === 'n/a') {
          sheetNaCount++;
        }

        // Detect footnote / source lines in lower rows or column A
        if (c === range.s.c && r > range.e.r - 8) {
          if (/^(source:|note:|footnote:)/i.test(textVal)) {
            footnotes.push(textVal);
          }
        }
      }
    }

    totalFormulasDetected += sheetFormulaCount;
    totalHyphens += sheetHyphenCount;
    totalNAs += sheetNaCount;

    // Detect Title, Table Code, Unit from A1, A2, A3
    let title = '';
    let tableCode = '';
    let unit = '';
    let periodRange = '';

    for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 5); r++) {
      const aCell = ws[XLSX.utils.encode_cell({ r, c: range.s.c })];
      const text = String(aCell?.v ?? '').trim();
      if (!text) continue;

      if (/^table\s+([a-z0-9.]+):/i.test(text)) {
        const match = text.match(/^table\s+([a-z0-9.]+):\s*(.*)/i);
        if (match) {
          tableCode = match[1];
          title = match[2];
        }
      } else if (!title && text.length > 5 && !text.toLowerCase().includes('return to menu')) {
        title = text;
      }

      if (text.includes("₦'") || text.includes('₦') || text.includes('Billion') || text.includes('Million') || text.includes('%') || text.includes('$') || text.includes('USD') || /\[.*?\]/.test(text) || /\(.*?\)/.test(text)) {
        const bracketMatch = text.match(/\[(.*?)\]/);
        const parenMatch = text.match(/\((.*?)\)/);
        if (bracketMatch) unit = bracketMatch[1].trim();
        else if (parenMatch) unit = parenMatch[1].trim();
      }

      if (/\b(19\d\d|20\d\d)\b.*\b(19\d\d|20\d\d)\b/.test(text)) {
        periodRange = text;
      }
    }

    // Convert sheet to JSON rows
    const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });
    const sampleRows = rawJson.slice(0, 50);
    const allHeaders = rawJson.length > 0 ? Object.keys(rawJson[0]) : [];

    const sheetId = `sheet_${index}_${normalizeTableCode(sheetName) || 'tab'}`;

    sheetsMeta[sheetId] = {
      id: sheetId,
      rawName: sheetName,
      displayName: sheetName.trim(),
      index,
      rowCount,
      colCount,
      mergedCellsCount: merges.length,
      title: title || sheetName.trim(),
      tableCode: tableCode || sheetName.trim(),
      unit: unit || 'Standard',
      periodRange,
      specialCodesCount: {
        hyphenNilCount: sheetHyphenCount,
        naCount: sheetNaCount,
        otherFlags: {},
      },
      hasFormulas: sheetFormulaCount > 0,
      formulaCellsCount: sheetFormulaCount,
      footnotes,
      sampleRows,
      allHeaders,
    };
  });

  // 2. Detect & Parse Menu Index Sheet
  const menuCatalog: ExcelTableCatalogEntry[] = [];
  const menuSheetName = sheetNames.find((s) => s.trim().toLowerCase() === 'menu' || s.trim().toLowerCase() === 'index' || s.trim().toLowerCase() === 'contents');
  const hasMenuSheet = Boolean(menuSheetName);

  if (menuSheetName) {
    const menuWs = wb.Sheets[menuSheetName];
    const menuRows: any[] = XLSX.utils.sheet_to_json(menuWs, { header: 1 });

    menuRows.forEach((row) => {
      if (!Array.isArray(row) || row.length < 2) return;
      const colA = String(row[0] || '').trim();
      const colB = String(row[1] || '').trim();

      if (!colA || colA.toLowerCase() === 'table' || colA.toLowerCase() === 'code' || colA.length > 20) return;

      const normCode = normalizeTableCode(colA);
      // Find matching sheet
      const matchedSheetEntry = Object.values(sheetsMeta).find(
        (s) => normalizeTableCode(s.rawName) === normCode || normalizeTableCode(s.tableCode || '') === normCode
      );

      menuCatalog.push({
        tableCode: colA,
        normalizedCode: normCode,
        title: colB,
        targetSheetName: matchedSheetEntry?.rawName || colA,
        targetSheetId: matchedSheetEntry?.id || '',
        matched: Boolean(matchedSheetEntry),
      });
    });
  }

  // 3. Determine primary analysis dataset
  // Prefer the first non-Menu data sheet with valid rows, or sheet 1
  const firstDataSheet = Object.values(sheetsMeta).find(
    (s) => s.displayName.toLowerCase() !== 'menu' && s.sampleRows.length > 0
  ) || Object.values(sheetsMeta)[0];

  const primarySheetId = firstDataSheet?.id || 'sheet_0';
  const primaryDatasetRows = firstDataSheet?.sampleRows || [];

  return {
    fileName,
    sha256: fileSha256,
    fileSizeBytes: buffer.byteLength,
    totalSheets: sheetNames.length,
    sheetNames,
    sheets: sheetsMeta,
    menuCatalog,
    hasMenuSheet,
    totalFormulasDetected,
    specialCodesSummary: {
      hyphenNilTotal: totalHyphens,
      naTotal: totalNAs,
    },
    primaryDatasetRows,
    primarySheetId,
  };
}
