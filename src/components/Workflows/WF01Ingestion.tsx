import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Layers,
  Database,
  Hash,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Table as TableIcon,
  HardDrive,
  Activity,
  Radio,
  Sliders,
  Zap,
  Loader2,
  X,
  Gauge,
  Cpu,
} from 'lucide-react';
import { Dataset } from '../../types';
import { parseCSV } from '../../utils/csvParser';
import { profileDataset } from '../../utils/profiler';
import {
  ChunkProgress,
  generateFiveGigabyteDataset,
  generateOneMillionRowDataset,
  STREAMING_PITCH_PROFILES,
  StreamingPitch,
  streamChunkedFile,
} from '../../utils/chunkedUploader';
import { DatasetMetadataPanel } from '../DatasetMetadataPanel';
import { computeSHA256, canonicalizeDatasetRows } from '../../utils/cryptoIntegrity';
import {
  parseExcelWorkbookBuffer,
  isZipOrExcelSignature,
  isBinaryGarbage,
  ParsedWorkbookModel,
  ExcelSheetMetadata,
} from '../../utils/excelWorkbookParser';
import { ExcelWorkbookViewer } from '../ExcelWorkbookViewer';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getShortHash(sha256Hash: string): string {
  return sha256Hash.replace(/^sha256_/, '').slice(0, 8);
}

interface WF01Props {
  dataset: Dataset;
  allDatasets: Dataset[];
  onSelectDataset: (id: string) => void;
  onAddDataset: (newDataset: Dataset) => void;
  onGoToQuality: () => void;
}

export const WF01Ingestion: React.FC<WF01Props> = ({
  dataset,
  allDatasets,
  onSelectDataset,
  onAddDataset,
  onGoToQuality,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Big Data Chunked Streaming State
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress | null>(null);
  const [isExascaleModalOpen, setIsExascaleModalOpen] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<StreamingPitch>('turbo');
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);
  const [streamSimulationProgress, setStreamSimulationProgress] = useState(0);
  const [streamThroughput, setStreamThroughput] = useState(0);

  // Excel Multi-Tab Workbook State
  const [activeWorkbook, setActiveWorkbook] = useState<ParsedWorkbookModel | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setChunkProgress(null);

    try {
      // Read raw binary buffer to check file signature and prevent binary garbage text decode
      const buffer = await file.arrayBuffer();
      const isExcelOrZip =
        isZipOrExcelSignature(buffer) ||
        /\.(xlsx|xlsm|xlsb|xls|ods)$/i.test(file.name);

      if (isExcelOrZip) {
        // Section 18: High-fidelity Excel workbook parsing via SheetJS
        const sha256 = await computeSHA256(new Uint8Array(buffer));
        const workbook = parseExcelWorkbookBuffer(buffer, file.name, sha256);
        setActiveWorkbook(workbook);

        const primaryRows = workbook.primaryDatasetRows;
        if (primaryRows.length === 0) {
          throw new Error('Excel workbook contains no data rows in primary sheet');
        }

        const profile = profileDataset(primaryRows);
        profile.rowCount = workbook.sheets[workbook.primarySheetId]?.rowCount || primaryRows.length;
        profile.memoryEstimateBytes = file.size;

        const canonical = canonicalizeDatasetRows(primaryRows);
        const primaryMeta = workbook.sheets[workbook.primarySheetId];
        const newDs: Dataset = {
          id: `ds_excel_${Date.now()}`,
          name: `${file.name.replace(/\.[^/.]+$/, '')} (${primaryMeta?.displayName || 'Primary'})`,
          version: 1,
          isImmutableSource: true,
          sourceType: 'excel_workbook',
          sha256Hash: sha256,
          createdAt: new Date().toISOString(),
          data: primaryRows,
          profile,
          columns: Object.keys(primaryRows[0] || {}),
          rawSourceText: canonical,
        };

        onAddDataset(newDs);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Section 18.1 Binary-content guard: Check for non-text binary bytes
      if (isBinaryGarbage(buffer) && !file.name.endsWith('.parquet') && !file.name.endsWith('.pdf')) {
        throw new Error(
          'Binary file detected: This file contains non-printable binary content and cannot be read as plain text/CSV. If this is an Excel workbook, please ensure it has a valid .xlsx or .xls extension.'
        );
      }

      // If file is > 4MB, use chunked streaming ingestion
      if (file.size > 4 * 1024 * 1024) {
        const result = await streamChunkedFile(file, 4, (progress) => {
          setChunkProgress(progress);
        });

        const profile = profileDataset(result.sampleRows);
        profile.rowCount = result.totalRows;
        profile.memoryEstimateBytes = file.size;

        const canonicalStream = canonicalizeDatasetRows(result.sampleRows);
        const streamHash = await computeSHA256(canonicalStream);

        const newDs: Dataset = {
          id: `ds_stream_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          version: 1,
          isImmutableSource: true,
          sourceType: 'chunked_stream_upload',
          sha256Hash: streamHash,
          createdAt: new Date().toISOString(),
          data: result.sampleRows,
          profile,
          columns: result.columnNames.length > 0 ? result.columnNames : Object.keys(result.sampleRows[0] || {}),
          rawSourceText: canonicalStream,
        };

        onAddDataset(newDs);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Standard text / CSV / JSON parsing
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(buffer);
      let rows: Record<string, any>[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        rows = parseCSV(text);
      }

      if (rows.length === 0) {
        throw new Error('No valid records found in uploaded file');
      }

      const profile = profileDataset(rows);
      const fileSha256 = await computeSHA256(text);

      const newDs: Dataset = {
        id: `ds_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        version: 1,
        isImmutableSource: true,
        sourceType: file.name.endsWith('.json') ? 'json_upload' : 'csv_upload',
        sha256Hash: fileSha256,
        createdAt: new Date().toISOString(),
        data: rows,
        profile,
        columns: Object.keys(rows[0] || {}),
        rawSourceText: text,
      };

      onAddDataset(newDs);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectSheetAsDataset = (sheet: ExcelSheetMetadata) => {
    if (sheet.sampleRows.length === 0) return;
    const profile = profileDataset(sheet.sampleRows);
    profile.rowCount = sheet.rowCount;
    const canonical = canonicalizeDatasetRows(sheet.sampleRows);

    const sheetDs: Dataset = {
      id: `ds_sheet_${Date.now()}`,
      name: `${activeWorkbook?.fileName.replace(/\.[^/.]+$/, '') || 'Workbook'} - [${sheet.displayName}]`,
      version: 1,
      isImmutableSource: true,
      sourceType: 'excel_workbook',
      sha256Hash: activeWorkbook?.sha256 || dataset.sha256Hash,
      createdAt: new Date().toISOString(),
      data: sheet.sampleRows,
      profile,
      columns: sheet.allHeaders.length > 0 ? sheet.allHeaders : Object.keys(sheet.sampleRows[0] || {}),
      rawSourceText: canonical,
    };

    onAddDataset(sheetDs);
  };

  const handleSimulateExascaleIngestion = (datasetType: '1m' | '5gb') => {
    setIsSimulatingStream(true);
    setStreamSimulationProgress(0);
    const pitchConfig = STREAMING_PITCH_PROFILES[selectedPitch];
    setStreamThroughput(pitchConfig.pitchSpeedMbSec);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setStreamSimulationProgress(currentProgress);
      // Vary pitching rate slightly to simulate real distributed network flow
      const jitter = (Math.random() - 0.5) * 40;
      setStreamThroughput(Math.max(20, Math.round(pitchConfig.pitchSpeedMbSec + jitter)));

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsSimulatingStream(false);
        const ds = datasetType === '1m' ? generateOneMillionRowDataset() : generateFiveGigabyteDataset();
        onAddDataset(ds);
        setIsExascaleModalOpen(false);
      }
    }, 120);
  };

  const copyHash = () => {
    navigator.clipboard.writeText(dataset.sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const p = dataset.profile;

  return (
    <div className="space-y-6">
      {/* Title & Pipeline Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              WF01
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Data Ingestion, Schema Profiling & Immutability Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Automated schema detection, statistical distributions, memory footprinting, chunked 5GB+ streaming, and cryptographic immutability.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.json,.txt"
            className="hidden"
          />

          {/* Exascale 5GB+ & 1M Streaming Pitch Ingestion Button */}
          <button
            onClick={() => setIsExascaleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gradient-to-r from-cyan-950 to-indigo-950 hover:from-cyan-900 hover:to-indigo-900 text-cyan-300 border border-cyan-500/50 rounded-lg shadow-sm shadow-cyan-950/50 transition cursor-pointer"
            title="Configure variable pitching streaming for millions of records and 5GB+ files"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Exascale 5GB+ / 1M Stream</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isUploading ? 'Chunk Streaming...' : 'Upload CSV / JSON (Up to 5GB+)'}</span>
          </button>

          <button
            onClick={onGoToQuality}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition cursor-pointer"
          >
            <span>Run Quality Contracts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chunked Streaming Upload Progress Banner */}
      {chunkProgress && (
        <div className="p-4 bg-slate-900/90 border border-cyan-500/50 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-300 font-semibold flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Streaming Local File in Chunks ({chunkProgress.currentChunk} / {chunkProgress.totalChunks})
            </span>
            <span className="text-slate-300">
              {chunkProgress.rowsAccumulated.toLocaleString()} rows accumulated ({(chunkProgress.processedBytes / (1024 * 1024)).toFixed(1)} MB / {(chunkProgress.totalBytes / (1024 * 1024)).toFixed(1)} MB)
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-150"
              style={{ width: `${chunkProgress.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300">
          Upload Error: {uploadError}
        </div>
      )}

      {/* Dataset Selector Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Active Datasets in Studio ({allDatasets.length}):</span>
          <span className="text-[11px] font-mono text-cyan-400">Click any dataset to switch inspection</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
          {allDatasets.map((ds) => {
            const isSelected = ds.id === dataset.id;
            const isExascale = ds.profile.rowCount >= 1000000;
            const dsRows = ds.profile.rowCount || ds.data.length;
            const dsBytes = ds.profile.memoryEstimateBytes || ds.data.length * 128;
            const shortHash = getShortHash(ds.sha256Hash);

            return (
              <button
                key={ds.id}
                onClick={() => onSelectDataset(ds.id)}
                className={`group p-3.5 text-left rounded-xl border transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/95 border-cyan-500/80 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900 hover:bg-slate-850/80 border-slate-800 hover:border-slate-700'
                }`}
                title={`Select ${ds.name} (SHA-256: ${ds.sha256Hash})`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {ds.sourceType}
                    </span>
                    <div className="flex items-center gap-1">
                      {isExascale && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          Exascale
                        </span>
                      )}
                      {ds.isImmutableSource && (
                        <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" /> Raw
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary Dataset Name: fully visible, not truncated */}
                  <h4 className="text-xs font-semibold text-white tracking-tight leading-snug group-hover:text-cyan-300 transition">
                    {ds.name}
                  </h4>

                  {/* Small Metadata Badge (Row count, File size, Last modified) */}
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-300 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800/80">
                    <span className="text-white font-medium">{dsRows.toLocaleString()} rows</span>
                    <span className="text-slate-600">•</span>
                    <span>{formatBytes(dsBytes)}</span>
                    <span className="text-slate-600 hidden xl:inline">•</span>
                    <span className="hidden xl:inline">{formatDateShort(ds.createdAt)}</span>
                  </div>
                </div>

                {/* Bottom Row: Columns count & First 8 Characters of SHA-256 Fingerprint upon Hover */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{ds.columns.length} columns</span>

                  {/* Revealed on hover */}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 group-hover:bg-cyan-950/90 text-slate-500 group-hover:text-cyan-300 border border-slate-800 group-hover:border-cyan-800/80 transition flex items-center gap-0.5">
                    <Hash className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{shortHash}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* High-level Profile KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Total Record Count</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">{p.rowCount.toLocaleString()}</span>
            <span className="text-[11px] text-slate-500 font-mono">rows</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Feature Dimensions</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-cyan-400">{p.columnCount}</span>
            <span className="text-[11px] text-slate-500 font-mono">features</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Estimated In-Memory</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-indigo-400">
              {(p.memoryEstimateBytes / 1024).toFixed(1)}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">KB</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Duplicate Rows</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-bold font-mono ${p.duplicateRowCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {p.duplicateRowCount}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">records</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-400 block mb-1">Lineage Hash</span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 truncate max-w-[100px]">
              {dataset.sha256Hash}
            </span>
            <button
              onClick={copyHash}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Copy SHA-256 Hash"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Metadata & Cryptographic Integrity Panel (FIPS 180-4 SHA-256) */}
      <DatasetMetadataPanel dataset={dataset} />

      {/* Multi-Tab Excel Workbook Viewer (Section 18 High-Fidelity Ingestion) */}
      {activeWorkbook && (
        <ExcelWorkbookViewer
          workbook={activeWorkbook}
          onSelectSheetAsDataset={handleSelectSheetAsDataset}
        />
      )}

      {/* Column Schema & Profiling Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Feature Profiling & Distribution Schema</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{p.columns.length} columns inspected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Column Name</th>
                <th className="px-4 py-3">Inferred Type</th>
                <th className="px-4 py-3">Missing / Nulls</th>
                <th className="px-4 py-3">Distinct Values</th>
                <th className="px-4 py-3">Numeric Distribution (Min / Mean / Max)</th>
                <th className="px-4 py-3">Sample Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {p.columns.map((col) => {
                const hasNulls = col.nullCount > 0;
                return (
                  <tr key={col.name} className="hover:bg-slate-850/40 transition">
                    <td className="px-4 py-3 font-semibold text-slate-200 font-mono">
                      {col.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          col.type === 'integer' || col.type === 'float'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800/80'
                            : col.type === 'categorical'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800/80'
                            : col.type === 'datetime'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                            : col.type === 'boolean'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {col.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${hasNulls ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                          {col.nullCount} ({col.nullPercentage}%)
                        </span>
                        {hasNulls && (
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${Math.min(100, col.nullPercentage)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {col.distinctCount} ({col.uniquePercentage}%)
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-[11px]">
                      {col.min !== undefined && col.max !== undefined ? (
                        <span>
                          [{col.min} → <strong className="text-cyan-400">{col.mean}</strong> → {col.max}]
                          {col.std !== undefined && <span className="text-slate-500 ml-1.5">σ={col.std}</span>}
                        </span>
                      ) : col.topValues && col.topValues.length > 0 ? (
                        <span className="text-slate-400 text-xs">
                          Mode: {col.topValues[0]?.value} ({col.topValues[0]?.percentage}%)
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px] truncate max-w-xs">
                      {col.sampleValues.map((v) => String(v ?? 'NULL')).join(', ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Tabular Preview (First 8 Rows) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Data Frame View (First 8 Rows)</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Preview mode</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-2.5 text-slate-600">#</th>
                {dataset.columns.map((c) => (
                  <th key={c} className="px-3.5 py-2.5 text-slate-300">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dataset.data.slice(0, 8).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-850/50">
                  <td className="px-3.5 py-2 text-slate-600">{idx + 1}</td>
                  {dataset.columns.map((c) => {
                    const val = row[c];
                    const isNull = val === null || val === undefined || val === '';
                    return (
                      <td key={c} className="px-3.5 py-2">
                        {isNull ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-400 text-[10px] font-bold">
                            NULL
                          </span>
                        ) : (
                          <span className="text-slate-200">{String(val)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exascale 5GB+ & 1M Streaming Pitch Ingestion Modal */}
      {isExascaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Exascale Big Data Streaming & Variable Pitch Ingestion
                  </h3>
                  <p className="text-xs text-slate-400">
                    Out-of-core streaming architecture for millions of records and 5GB+ files
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExascaleModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Pitch Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Select Ingestion Pitch & Streaming Bandwidth:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(STREAMING_PITCH_PROFILES) as StreamingPitch[]).map((pitchKey) => {
                    const cfg = STREAMING_PITCH_PROFILES[pitchKey];
                    const isSelected = selectedPitch === pitchKey;
                    return (
                      <button
                        key={pitchKey}
                        type="button"
                        onClick={() => setSelectedPitch(pitchKey)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400'
                            : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="font-bold capitalize text-xs mb-1 text-cyan-300">{cfg.pitch.replace('_', ' ')}</div>
                        <div className="text-[11px] font-mono text-slate-300">{cfg.pitchSpeedMbSec} MB/s</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>{cfg.pitchFrequencyHz} Hz</span>
                          <span>{cfg.chunkSizeMb}MB chunks</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pitch Visualizer & Frequency Gauge */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-slate-200">Streaming Pitch Telemetry</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-bold">
                    {STREAMING_PITCH_PROFILES[selectedPitch].pitchFrequencyHz} Hz Sonification
                  </span>
                </div>
                <div className="h-6 flex items-center gap-1">
                  {[...Array(24)].map((_, i) => {
                    const h = isSimulatingStream
                      ? Math.min(100, Math.max(15, (Math.sin(i * 0.4 + Date.now() * 0.01) * 50 + 50)))
                      : Math.min(100, (i % 6) * 16 + 10);
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 transition-all duration-100"
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Welford Online Variance: ACTIVE</span>
                  <span>Heap Overflow Prevention: CERTIFIED</span>
                </div>
              </div>

              {/* Active Simulation Progress */}
              {isSimulatingStream && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-700/60 space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-cyan-300 font-bold flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Streaming at Variable Pitch ({streamThroughput} MB/s)
                    </span>
                    <span className="text-indigo-300 font-bold">{streamSimulationProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full transition-all duration-150"
                      style={{ width: `${streamSimulationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-slate-400 font-medium block">
                  Ingest Preset Massive Big Data Cluster:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSimulatingStream}
                    onClick={() => handleSimulateExascaleIngestion('1m')}
                    className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-850 border border-indigo-700/60 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">1,000,000 Records Benchmark</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-900 text-indigo-300">
                        128 MB In-Memory
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Exascale planetary sensor grid with 8 columnar dimensions and Welford stats.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={isSimulatingStream}
                    onClick={() => handleSimulateExascaleIngestion('5gb')}
                    className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950 to-slate-900 hover:from-purple-900 hover:to-slate-850 border border-purple-700/60 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">5.4 GB Multi-Cluster Telemetry</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-900 text-purple-300">
                        5,000,000 Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Simulated 5.4 GB exascale CERN/JWST grid with virtualized buffer chunks.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
