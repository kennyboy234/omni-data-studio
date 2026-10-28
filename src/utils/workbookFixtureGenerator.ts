/**
 * Generates an in-memory 12-sheet Excel workbook fixture conforming to
 * Section 9 Phase A2 acceptance tests for workbook fidelity verification.
 */
import * as XLSX from 'xlsx';

export function create12SheetFixtureWorkbook(): { buffer: ArrayBuffer; knownStats: any } {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Menu
  const menuData = [
    ['Table Code', 'Table Description', 'Section'],
    ['A.1.1', 'Gross Industrial Output by Sub-Sector', 'Manufacturing'],
    ['A.1.2', 'Capital Expenditure & Machine Depreciation', 'Capital'],
    ['B.2.1', 'Sensor Network Reliability & Availability', 'Telemetry'],
    ['B.2.2', 'Vibration & Bearing Fault Diagnostics', 'Vibration'],
    ['C.3.1', 'Statistical Quality Control & Defect Rates', 'Quality'],
    ['C.3.2', 'Overall Equipment Effectiveness (OEE)', 'Production'],
    ['D.4.1', 'Robotics Trajectory & Kinematic Sizing', 'Automation'],
    ['D.4.2', 'Revised NIOSH Ergonomic Lifting Indices', 'Ergonomics'],
    ['E.5.1', 'FMEA Risk Priority & Action Priority Table', 'Safety'],
    ['E.5.2', 'Fault Tree Analysis Cut Set Probabilities', 'Reliability'],
    ['F.6.1', 'Sensor Drift & Population Stability Indices', 'AI Health'],
  ];
  const wsMenu = XLSX.utils.aoa_to_sheet(menuData);
  XLSX.utils.book_append_sheet(wb, wsMenu, 'Menu');

  // Known counts for sheet 'A1.1 '
  const knownA1Hyphens = 6;
  const knownA1NAs = 4;
  const knownFormulas = 2;

  // 2. Sheet: 'A1.1 ' (Note trailing space!)
  const sheetA1Data: any[][] = [
    ['Return to Menu', null, null, null],                                        // A1
    ['Table A.1.1: Gross Industrial Output [USD Millions]', null, null, null],     // A2 with unit [USD Millions]
    ['Period: 2020 - 2026', null, null, null],                                   // A3
    ['Sub-Sector / Asset Line', '2024 Output', '2025 Output', '2026 Target'],    // A4 Header
    ['  1. Heavy Machinery', 420.5, 450.0, 490.0],                               // A5 Indented row
    ['    1.1 CNC Milling Centers', 180.2, 195.4, 210.0],
    ['    1.2 Robotic Welders', 140.3, '-', 165.0],                              // 1 hyphen
    ['    1.3 Stamping Presses', '-', 'n.a.', 115.0],                            // 1 hyphen, 1 na
    ['  2. Precision Electronics', 310.0, 335.2, 360.0],
    ['    2.1 SMT Assembly Lines', '-', 185.0, 'n.a.'],                          // 1 hyphen, 1 na
    ['    2.2 Cleanroom Wafer Stations', 125.0, '-', 'n.a.'],                    // 1 hyphen, 1 na
    ['  3. Continuous Chemical Processing', 'n.a.', 210.5, '-'],                 // 1 na, 1 hyphen
    ['    3.1 Distillation Columns', 110.0, '-', 135.0],                         // 1 hyphen
    ['Total Output (Formula)', null, null, null],                                // Row with formulas
    ['Source: Central Industrial Operations Bureau (CIOB) Annual Report 2026'],   // Footnote
    ['Note: Values marked with "-" indicate nil operations; "n.a." indicates not available in reporting period.'], // Footnote
  ];

  const wsA1 = XLSX.utils.aoa_to_sheet(sheetA1Data);

  // Set merged header cells on A1.1
  wsA1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // A2:D2
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // A3:D3
  ];

  // Set 2 formulas on row 14 (r=13)
  // B14: =SUM(B5:B13)
  wsA1['B14'] = { t: 'n', f: 'SUM(B5:B13)', v: 1486.0 };
  // C14: =AVERAGE(C5:C13)
  wsA1['C14'] = { t: 'n', f: 'AVERAGE(C5:C13)', v: 275.2 };

  XLSX.utils.book_append_sheet(wb, wsA1, 'A1.1 '); // Trailing space preserved!

  // 3-12: Additional 10 sheets
  const remainingSheets = [
    'A1.2', 'B2.1', 'B2.2', 'C3.1', 'C3.2', 'D4.1', 'D4.2', 'E5.1', 'E5.2', 'F6.1'
  ];

  remainingSheets.forEach((name, idx) => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Return to Menu'],
      [`Table ${name}: Engineering Sub-System Telemetry (Sheet ${idx + 3})`],
      ['Metric', 'Timestamp', 'Value', 'Status'],
      [`Sensor_${idx}_Alpha`, '2026-10-24T00:00:00Z', 100 + idx * 5, 'STABLE'],
      [`Sensor_${idx}_Beta`, '2026-10-24T00:01:00Z', '-', 'IDLE'],
      [`Sensor_${idx}_Gamma`, '2026-10-24T00:02:00Z', 'n.a.', 'OFFLINE'],
      ['Source: Distributed Plant SCADA Historian Archive'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  const rawBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  return {
    buffer: rawBuffer,
    knownStats: {
      totalSheets: 12,
      targetSheetName: 'A1.1 ',
      menuCode: 'A.1.1',
      unit: 'USD Millions',
      sheetHyphens: knownA1Hyphens,
      sheetNAs: knownA1NAs,
      sheetFormulas: knownFormulas,
      mergesCount: 3,
      sheetNames: ['Menu', 'A1.1 ', ...remainingSheets],
    },
  };
}
