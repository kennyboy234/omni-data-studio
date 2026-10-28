import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Layers,
  Table,
  CheckCircle2,
  AlertCircle,
  Hash,
  ArrowRight,
  ExternalLink,
  Info,
  ShieldCheck,
  Tag,
  ListFilter,
  Eye,
  Sliders,
} from 'lucide-react';
import { ParsedWorkbookModel, ExcelSheetMetadata } from '../utils/excelWorkbookParser';
import { Dataset } from '../types';

interface ExcelWorkbookViewerProps {
  workbook: ParsedWorkbookModel;
  onSelectSheetAsDataset: (sheet: ExcelSheetMetadata) => void;
  onClose?: () => void;
}

export const ExcelWorkbookViewer: React.FC<ExcelWorkbookViewerProps> = ({
  workbook,
  onSelectSheetAsDataset,
  onClose,
}) => {
  const [activeSheetId, setActiveSheetId] = useState<string>(workbook.primarySheetId);
  const [sheetSearch, setSheetSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'menu_catalog' | 'dictionary' | 'summary_audit'>('summary_audit');

  const sheetsList = Object.values(workbook.sheets);
  const filteredSheets = sheetsList.filter(
    (s) =>
      s.displayName.toLowerCase().includes(sheetSearch.toLowerCase()) ||
      s.tableCode?.toLowerCase().includes(sheetSearch.toLowerCase()) ||
      s.title?.toLowerCase().includes(sheetSearch.toLowerCase())
  );

  const activeSheet = workbook.sheets[activeSheetId] || sheetsList[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              EXCEL WORKBOOK INGESTION FIDELITY
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">
              {workbook.totalSheets} Sheets Intact
            </span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>{workbook.fileName}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            SHA-256: {workbook.sha256.slice(0, 16)}... • Special Codes: {workbook.specialCodesSummary.hyphenNilTotal} Hyphens (-) | {workbook.specialCodesSummary.naTotal} Not Available (n.a.)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Sheet View
          </button>

          {workbook.hasMenuSheet && (
            <button
              onClick={() => setViewMode('menu_catalog')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                viewMode === 'menu_catalog'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Menu Index ({workbook.menuCatalog.length} Tables)
            </button>
          )}

          <button
            onClick={() => setViewMode('summary_audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'summary_audit'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Verification Audit</span>
          </button>

          <button
            onClick={() => setViewMode('dictionary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              viewMode === 'dictionary'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Special Codes Dict
          </button>

          <button
            onClick={() => onSelectSheetAsDataset(activeSheet)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            <span>Analyze Sheet &quot;{activeSheet.displayName}&quot;</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sheet Tabs Bar with Search */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter sheets (e.g. A1.1, A18new)..."
              value={sheetSearch}
              onChange={(e) => setSheetSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Showing {filteredSheets.length} of {sheetsList.length} sheets
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {filteredSheets.map((s) => {
            const isSelected = s.id === activeSheet.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSheetId(s.id);
                  if (viewMode === 'menu_catalog') setViewMode('grid');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                }`}
                title={`Raw Name: "${s.rawName}" | Rows: ${s.rowCount} | Cols: ${s.colCount}`}
              >
                <Table className="w-3 h-3 text-emerald-400" />
                <span>{s.displayName}</span>
                {s.mergedCellsCount > 0 && (
                  <span className="px-1 py-0.2 rounded text-[9px] bg-slate-900 text-slate-400">
                    {s.mergedCellsCount}m
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode 1: Active Sheet Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Active Sheet Metadata Ribbon */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{activeSheet.title || activeSheet.displayName}</span>
                {activeSheet.tableCode && (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px] font-bold">
                    Table {activeSheet.tableCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px] flex-wrap">
                <span>Unit: <strong className="text-slate-200">{activeSheet.unit}</strong></span>
                <span>•</span>
                <span>Dimensions: <strong className="text-slate-200">{activeSheet.rowCount} rows × {activeSheet.colCount} cols</strong></span>
                <span>•</span>
                <span>Merged Cells: <strong className="text-slate-200">{activeSheet.mergedCellsCount}</strong></span>
                {activeSheet.formulaCellsCount > 0 && (
                  <>
                    <span>•</span>
                    <span>Formulas: <strong className="text-amber-300">{activeSheet.formulaCellsCount}</strong></span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Hyphens (-): <strong className="text-emerald-400">{activeSheet.specialCodesCount.hyphenNilCount}</strong>
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                n.a.: <strong className="text-purple-400">{activeSheet.specialCodesCount.naCount}</strong>
              </span>
            </div>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto max-h-[420px] rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                <tr>
                  <th className="py-2 px-3 text-slate-500 border-r border-slate-800 text-[10px] w-12 text-center">#</th>
                  {activeSheet.allHeaders.map((h, i) => (
                    <th key={i} className="py-2 px-3 text-slate-300 whitespace-nowrap border-r border-slate-800">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {activeSheet.sampleRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-850/50">
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-800 text-[10px] text-center font-bold">
                      {rIdx + 1}
                    </td>
                    {activeSheet.allHeaders.map((h, cIdx) => {
                      const val = String(row[h] ?? '');
                      const isHyphen = val === '-' || val === '–';
                      const isNA = val.toLowerCase() === 'n.a.';
                      return (
                        <td
                          key={cIdx}
                          className={`py-2 px-3 border-r border-slate-850 whitespace-nowrap ${
                            isHyphen
                              ? 'text-emerald-400 font-bold bg-emerald-950/20'
                              : isNA
                              ? 'text-purple-400 font-bold bg-purple-950/20'
                              : 'text-slate-300'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footnotes Section if present */}
          {activeSheet.footnotes.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <span className="font-bold font-mono text-slate-400 text-[11px] uppercase block">
                Attached Footnotes & Provenance Notes:
              </span>
              {activeSheet.footnotes.map((fn, i) => (
                <p key={i} className="text-slate-400 font-mono text-[11px]">{fn}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Menu Catalog */}
      {viewMode === 'menu_catalog' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            Detected Central Bank of Nigeria / Statistical Bulletin <strong>Menu Index Sheet</strong>. Table codes (e.g. A.1.1) automatically map to corresponding multi-tab sheet names (e.g. &apos;A1.1 &apos;).
          </div>

          <div className="overflow-x-auto max-h-[460px] rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800">
                <tr className="text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Table Code</th>
                  <th className="py-2.5 px-3">Description / Title</th>
                  <th className="py-2.5 px-3">Matched Sheet Tab</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {workbook.menuCatalog.map((entry, idx) => {
                  const targetSheet = workbook.sheets[entry.targetSheetId];
                  return (
                    <tr key={idx} className="hover:bg-slate-850/50">
                      <td className="py-2.5 px-3 font-bold text-cyan-300">{entry.tableCode}</td>
                      <td className="py-2.5 px-3 text-slate-200">{entry.title}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {entry.matched ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>&apos;{entry.targetSheetName}&apos;</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No direct tab match</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {targetSheet && (
                          <button
                            onClick={() => {
                              setActiveSheetId(targetSheet.id);
                              setViewMode('grid');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-700 text-white text-[11px] font-semibold transition cursor-pointer"
                          >
                            Open Sheet
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 3: Special Codes Dictionary */}
      {viewMode === 'dictionary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-300 font-mono">Special Code: &quot;-&quot; (Hyphen)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold text-xs">
                  {workbook.specialCodesSummary.hyphenNilTotal} occurrences
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Represents <strong>Nil / Zero</strong> values in Central Bank of Nigeria financial statistics. Preserved as a distinct flag code rather than flattened to blank or null.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-purple-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-purple-300 font-mono">Special Code: &quot;n.a.&quot;</span>
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-400 font-mono font-bold text-xs">
                  {workbook.specialCodesSummary.naTotal} occurrences
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Represents <strong>Not Available / Missing</strong> data (e.g. series discontinued or not reported in that period). Treated distinctly from nil/zero.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode 4: Summary Audit Panel (Screenshot Ready for Workbook Verification) */}
      {viewMode === 'summary_audit' && (
        <div className="space-y-4 font-mono">
          {/* Screenshot Header Card */}
          <div className="p-4 rounded-xl bg-slate-950 border-2 border-amber-600/60 shadow-xl space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700 uppercase tracking-wider">
                    WORKBOOK INGESTION VERIFICATION AUDIT
                  </span>
                  <span className="text-xs text-slate-400">
                    File: <strong className="text-white">{workbook.fileName}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 break-all">
                  SHA-256 Checksum: <span className="text-emerald-400">{workbook.sha256}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-amber-400 font-bold">SCREENSHOT READY</span>
                <p className="text-[10px] text-slate-400">Section 18 Fidelity Verification</p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Total Sheets</span>
                <span className="text-xl font-bold text-cyan-400">{workbook.totalSheets}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Total Merged Cells</span>
                <span className="text-xl font-bold text-amber-400">
                  {sheetsList.reduce((acc, s) => acc + (s.mergedCellsCount || 0), 0)}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Special Nil &quot;-&quot;</span>
                <span className="text-xl font-bold text-emerald-400">
                  {workbook.specialCodesSummary.hyphenNilTotal}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Special Missing &quot;n.a.&quot;</span>
                <span className="text-xl font-bold text-purple-400">
                  {workbook.specialCodesSummary.naTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Per-Sheet Audit Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Raw Sheet Name</th>
                    <th className="py-2.5 px-3">Menu Code</th>
                    <th className="py-2.5 px-3">Extracted Title &amp; Unit</th>
                    <th className="py-2.5 px-3 text-center">Merged Cells</th>
                    <th className="py-2.5 px-3 text-center">&quot;-&quot; Nil</th>
                    <th className="py-2.5 px-3 text-center">&quot;n.a.&quot;</th>
                    <th className="py-2.5 px-3 text-center">Rows × Cols</th>
                    <th className="py-2.5 px-3 text-center">Notes</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {sheetsList.map((sheet, idx) => {
                    const raw = sheet.rawName || sheet.displayName;
                    const hasTrailing = raw.trim() !== raw;
                    return (
                      <tr key={sheet.id} className="hover:bg-slate-900/60 transition">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-white">
                          <span>&apos;{raw}&apos;</span>
                          {hasTrailing && (
                            <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-red-950 text-red-400 border border-red-800">
                              trailing space
                            </span>
                          )}
                          <span className="ml-1 text-[10px] text-slate-500 font-mono">
                            ({raw.length}c)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-cyan-400">
                          {sheet.tableCode || <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="text-slate-200 block truncate max-w-xs">{sheet.title || '—'}</span>
                          {sheet.unit && (
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                              Unit: {sheet.unit}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-amber-400 font-bold">
                          {sheet.mergedCellsCount || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-400">
                          {sheet.specialCodesCount?.hyphenNilCount || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-purple-400">
                          {sheet.specialCodesCount?.naCount || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {sheet.rowCount} × {sheet.colCount}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {sheet.footnotes?.length || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setActiveSheetId(sheet.id);
                              setViewMode('grid');
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] transition cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
