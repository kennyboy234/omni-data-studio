import React, { useState } from 'react';
import { IngestionHub } from './IngestionHub';
import { QualityPills } from './QualityPills';
import { Sha256LedgerView } from './Sha256Ledger';
import {
  IngestionResult,
  generateSampleDataset,
  ingestData,
} from './ingestion';
import {
  DatasetQualityReport,
  evaluateQuality,
  injectNullFault,
  injectDuplicateFault,
  injectDriftFault,
} from './quality';
import { globalLedger, computeSha256 } from './ledger';
import {
  Layers,
  Database,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const FoundationStudio: React.FC = () => {
  // Initialize with sample dataset
  const [activeDataset, setActiveDataset] = useState<IngestionResult>(() => {
    const rows = generateSampleDataset(350);
    const initial = ingestData('saas_customer_churn_telemetry.parquet', rows, 'parquet');
    globalLedger.recordDataset(
      initial.datasetId,
      initial.filename,
      'INITIAL_INGESTION',
      initial.rowCount,
      initial.records
    );
    return initial;
  });

  const [referenceRows] = useState<Record<string, any>[]>(() => activeDataset.records);
  const [qualityReport, setQualityReport] = useState<DatasetQualityReport>(() =>
    evaluateQuality(activeDataset.records, referenceRows)
  );
  const [currentHash, setCurrentHash] = useState<string>(activeDataset.sha256Hash);

  const handleDatasetIngested = (res: IngestionResult) => {
    setActiveDataset(res);
    setCurrentHash(res.sha256Hash);
    const report = evaluateQuality(res.records, referenceRows);
    setQualityReport(report);

    globalLedger.recordDataset(
      res.datasetId,
      res.filename,
      'FILE_UPLOAD_INGESTION',
      res.rowCount,
      res.records
    );
  };

  const handleInjectFault = (type: 'nulls' | 'duplicates' | 'drift') => {
    let mutatedRows: Record<string, any>[];
    let operationName = '';

    if (type === 'nulls') {
      mutatedRows = injectNullFault(activeDataset.records, 18);
      operationName = 'FAULT_INJECTED_NULLS';
    } else if (type === 'duplicates') {
      mutatedRows = injectDuplicateFault(activeDataset.records, 12);
      operationName = 'FAULT_INJECTED_DUPLICATES';
    } else {
      mutatedRows = injectDriftFault(activeDataset.records);
      operationName = 'FAULT_INJECTED_STATISTICAL_DRIFT';
    }

    const newHash = computeSha256(mutatedRows);
    const updatedDataset: IngestionResult = {
      ...activeDataset,
      rowCount: mutatedRows.length,
      records: mutatedRows,
      sha256Hash: newHash,
    };

    setActiveDataset(updatedDataset);
    setCurrentHash(newHash);

    const updatedReport = evaluateQuality(mutatedRows, referenceRows);
    setQualityReport(updatedReport);

    // Record the fault state to ledger so hash changes and lineage is preserved
    globalLedger.recordDataset(
      updatedDataset.datasetId,
      updatedDataset.filename,
      operationName,
      mutatedRows.length,
      mutatedRows
    );
  };

  const handleClearFaults = () => {
    const cleanRows = generateSampleDataset(350);
    const clean = ingestData('saas_customer_churn_telemetry.parquet', cleanRows, 'parquet');
    setActiveDataset(clean);
    setCurrentHash(clean.sha256Hash);
    setQualityReport(evaluateQuality(clean.records, clean.records));

    globalLedger.recordDataset(
      clean.datasetId,
      clean.filename,
      'RESTORE_CLEAN_BASELINE',
      clean.rowCount,
      clean.records
    );
  };

  return (
    <div className="space-y-6">
      {/* Studio 1 Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-900/40 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase tracking-wider">
                  STUDIO 1 • FOUNDATION
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  BRANCH: s1-foundation
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  DEMO_MODE=true
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Data Foundation & Immutable Ledger Engine
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                WF01 Ingest Hub (1M rows/s), WF02 Quality Pills (Nulls, Drift, Duplicates), and WF03 SHA-256 Cryptographic Ledger.
              </p>
            </div>
          </div>

          {/* Quick Test Flow Guide */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">
              Prescribed Verification Workflow:
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="text-cyan-400 font-bold">1. Load Sample</span>
              <span>→</span>
              <span className="text-rose-400 font-bold">2. Inject Fault</span>
              <span>→</span>
              <span className="text-emerald-400 font-bold">3. Verify Hash</span>
            </div>
          </div>
        </div>
      </div>

      {/* WF01 Ingest Hub */}
      <IngestionHub
        activeDataset={activeDataset}
        onDatasetIngested={handleDatasetIngested}
      />

      {/* WF02 Quality Pills */}
      <QualityPills
        report={qualityReport}
        onInjectFault={handleInjectFault}
        onClearFaults={handleClearFaults}
      />

      {/* WF03 SHA-256 Ledger */}
      <Sha256LedgerView
        ledger={globalLedger}
        currentDatasetHash={currentHash}
      />
    </div>
  );
};
