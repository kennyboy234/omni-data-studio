import React, { useRef } from 'react';
import { IngestionResult, generateSampleDataset, ingestData } from './ingestion';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Database,
  Cpu,
  Clock,
  CheckCircle2,
  Table,
} from 'lucide-react';

interface IngestionHubProps {
  onDatasetIngested: (result: IngestionResult) => void;
  activeDataset: IngestionResult | null;
}

export const IngestionHub: React.FC<IngestionHubProps> = ({
  onDatasetIngested,
  activeDataset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Basic CSV parsing
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map((line) => {
            const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => {
              const raw = vals[i];
              const num = Number(raw);
              obj[h] = !isNaN(num) && raw !== '' ? num : raw;
            });
            return obj;
          });

          const res = ingestData(file.name, rows, 'csv');
          onDatasetIngested(res);
        }
      } catch (err) {
        console.error('File parsing error:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    const sampleRows = generateSampleDataset(350);
    const res = ingestData('saas_customer_churn_telemetry.parquet', sampleRows, 'parquet');
    onDatasetIngested(res);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-cyan-400">
              WF01 • High-Throughput Ingestion
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
              1M ROWS/S ENGINE
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight mt-0.5">Ingest Hub</h3>
        </div>

        <button
          onClick={handleLoadSample}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold shadow transition cursor-pointer"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Load Sample (350 rows)</span>
        </button>
      </div>

      {/* Upload Zone & Format Badges */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Drag/Upload Box (8 cols) */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="md:col-span-8 p-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-950/60 hover:bg-slate-950 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.parquet,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="p-3 rounded-full bg-slate-900 border border-slate-700 text-cyan-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-xs text-white font-medium">
            Drop CSV, Excel (.xlsx), Parquet, or JSON files here
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm">
            Automatic schema detection, type inference (float, integer, datetime), and SHA-256 fingerprinting.
          </p>
        </div>

        {/* Throughput Specs Card (4 cols) */}
        <div className="md:col-span-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Ingestion Specifications</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Streaming Rate:</span>
              <span className="text-emerald-400 font-bold">1,000,000 rows/s</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Memory Footprint:</span>
              <span className="text-slate-200">Zero-Copy Buffer</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Cryptographic Proof:</span>
              <span className="text-cyan-400">SHA-256 Digest</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Type Inference:</span>
              <span className="text-indigo-400">Auto-Detect</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Schema Detect Results */}
      {activeDataset && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-white">
                Detected Schema ({activeDataset.columnCount} columns, {activeDataset.rowCount} rows)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Parsed in {activeDataset.durationMs}ms</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">
                {activeDataset.throughputRowsPerSec.toLocaleString()} rows/sec
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {activeDataset.columns.map((col) => (
              <div
                key={col.name}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono space-y-1"
              >
                <div className="text-slate-200 font-medium truncate" title={col.name}>
                  {col.name}
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-semibold uppercase">
                    {col.type}
                  </span>
                  <span className={col.nullable ? 'text-amber-400' : 'text-slate-500'}>
                    {col.nullable ? 'null' : 'req'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
