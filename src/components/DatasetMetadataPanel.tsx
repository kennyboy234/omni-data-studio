import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Hash,
  Check,
  Copy,
  RotateCcw,
  FileCheck,
  AlertTriangle,
  Upload,
  Lock,
  Layers,
  Database,
  Clock,
  HardDrive,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { Dataset } from '../types';
import {
  computeSHA256,
  canonicalizeDatasetRows,
  verifyDatasetIntegrity,
  IntegrityVerificationResult,
} from '../utils/cryptoIntegrity';

interface DatasetMetadataPanelProps {
  dataset: Dataset;
  rawDataset?: Dataset;
}

export const DatasetMetadataPanel: React.FC<DatasetMetadataPanelProps> = ({
  dataset,
  rawDataset,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedRehash, setCopiedRehash] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<IntegrityVerificationResult | null>(null);
  const [tamperMode, setTamperMode] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<IntegrityVerificationResult[]>([]);
  const verifyFileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, type: 'stored' | 'computed') => {
    navigator.clipboard.writeText(text);
    if (type === 'stored') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedRehash(true);
      setTimeout(() => setCopiedRehash(false), 2000);
    }
  };

  /**
   * Core 'Verify integrity' function:
   * Re-hashes the selected raw dataset using SHA-256 and compares it against
   * the stored fingerprint to display a pass or fail status.
   */
  const handleVerifyIntegrity = async (tamper: boolean = false) => {
    setIsVerifying(true);
    setVerificationResult(null);

    // Simulate realistic asynchronous hashing latency for feedback
    setTimeout(async () => {
      try {
        const storedFingerprint = dataset.sha256Hash;

        // If dataset has rawSourceText, re-hash that; otherwise re-hash canonical records
        let payloadToHash: string | Record<string, any>[];

        if (tamper) {
          // Mutate a byte or record to demonstrate tamper detection (FAIL status)
          if (dataset.rawSourceText) {
            payloadToHash = dataset.rawSourceText + '\n__TAMPERED_INJECTED_ROW_BYTE_CORRUPTION__';
          } else {
            const tamperedRows = JSON.parse(JSON.stringify(dataset.data));
            if (tamperedRows.length > 0) {
              const firstKey = Object.keys(tamperedRows[0])[0];
              tamperedRows[0][firstKey] = '__TAMPERED_ALTERED_VALUE__';
            }
            payloadToHash = tamperedRows;
          }
        } else {
          payloadToHash = dataset.rawSourceText || dataset.data;
        }

        const result = await verifyDatasetIntegrity(
          storedFingerprint,
          payloadToHash,
          tamper ? 'tampered_simulation' : 'raw_payload'
        );

        setVerificationResult(result);
        setVerificationHistory((prev) => [result, ...prev.slice(0, 9)]);
      } catch (err: any) {
        setVerificationResult({
          status: 'fail',
          storedHash: dataset.sha256Hash,
          computedHash: 'ERROR_COMPUTING_HASH',
          durationMs: 0,
          bytesProcessed: 0,
          timestamp: new Date().toISOString(),
          sourceTested: 'raw_payload',
          message: `Verification Error: ${err.message || 'Unknown hash error'}`,
        });
      } finally {
        setIsVerifying(false);
      }
    }, 450);
  };

  /**
   * Re-hash an external raw file selected from disk against the stored fingerprint
   */
  const handleVerifyUploadedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyDatasetIntegrity(dataset.sha256Hash, file, 'uploaded_file');
      setVerificationResult(result);
      setVerificationHistory((prev) => [result, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setVerificationResult({
        status: 'fail',
        storedHash: dataset.sha256Hash,
        computedHash: 'FILE_READ_ERROR',
        durationMs: 0,
        bytesProcessed: 0,
        timestamp: new Date().toISOString(),
        sourceTested: 'uploaded_file',
        message: `Failed to read file for verification: ${err.message}`,
      });
    } finally {
      setIsVerifying(false);
      if (verifyFileInputRef.current) verifyFileInputRef.current.value = '';
    }
  };

  const storedHex = dataset.sha256Hash.replace(/^sha256_/, '');
  const bytesEstimate = dataset.profile?.memoryEstimateBytes || dataset.data.length * 128;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
      {/* Panel Header */}
      <div className="px-6 py-4.5 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-950 to-indigo-950 border border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-950/40">
            <Lock className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Dataset Metadata & Cryptographic Integrity Panel
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                FIPS 180-4 SHA-256
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect provenance metadata, verify cryptographic checksums, and audit bit-for-bit immutability.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="file"
            ref={verifyFileInputRef}
            onChange={handleVerifyUploadedFile}
            accept=".csv,.json,.txt"
            className="hidden"
          />

          {/* Verify from Disk Button */}
          <button
            onClick={() => verifyFileInputRef.current?.click()}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer"
            title="Select the original raw file from disk to verify against stored SHA-256 fingerprint"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Verify from Disk...</span>
          </button>

          {/* Tamper Test Toggle / Button */}
          <button
            onClick={() => {
              setTamperMode((prev) => !prev);
              handleVerifyIntegrity(!tamperMode);
            }}
            disabled={isVerifying}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
              tamperMode
                ? 'bg-rose-950/70 border-rose-600 text-rose-300 shadow-sm shadow-rose-950/40'
                : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
            title="Simulate data alteration to test the FAIL integrity detection status"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${tamperMode ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>{tamperMode ? 'Tamper Active (FAIL Test)' : 'Simulate Tamper'}</span>
          </button>

          {/* Primary 'Verify integrity' Button */}
          <button
            onClick={() => {
              setTamperMode(false);
              handleVerifyIntegrity(false);
            }}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl shadow-md shadow-cyan-600/30 transition cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Re-hashing SHA-256...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-cyan-200" />
                <span>Verify Integrity</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6 space-y-6">
        {/* Verification Result Banner (PASS or FAIL) */}
        {verificationResult && (
          <div
            className={`p-5 rounded-2xl border transition-all animate-in fade-in duration-200 ${
              verificationResult.status === 'pass'
                ? 'bg-emerald-950/50 border-emerald-500/70 shadow-lg shadow-emerald-950/30'
                : 'bg-rose-950/50 border-rose-500/70 shadow-lg shadow-rose-950/30'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl border ${
                    verificationResult.status === 'pass'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  }`}
                >
                  {verificationResult.status === 'pass' ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-rose-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold uppercase tracking-wider ${
                        verificationResult.status === 'pass'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      STATUS: {verificationResult.status.toUpperCase()}
                    </span>

                    <span className="text-xs font-semibold text-white">
                      {verificationResult.status === 'pass'
                        ? 'Cryptographic Fingerprint Match Verified'
                        : 'SHA-256 Checksum Mismatch Detected'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                    {verificationResult.message}
                  </p>

                  <div className="flex items-center gap-4 mt-2.5 text-[11px] font-mono text-slate-400">
                    <span>
                      Bytes Hashed: <strong className="text-white">{verificationResult.bytesProcessed.toLocaleString()} B</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Computation: <strong className="text-cyan-400">{verificationResult.durationMs} ms</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Mode:{' '}
                      <strong className="text-indigo-300">
                        {verificationResult.sourceTested === 'tampered_simulation'
                          ? 'Simulated Alteration'
                          : verificationResult.sourceTested === 'uploaded_file'
                          ? 'Local File'
                          : 'Raw In-Memory Source'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Side-by-side or quick match indicator */}
              <div className="text-right flex md:flex-col items-center md:items-end justify-between md:justify-start gap-1">
                <span
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${
                    verificationResult.status === 'pass'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-rose-950 text-rose-300 border-rose-700'
                  }`}
                >
                  {verificationResult.status === 'pass' ? '100% BIT MATCH' : 'MISMATCH DETECTED'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(verificationResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Hash Comparison Box */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Stored SHA-256 Fingerprint:</span>
                  <button
                    onClick={() => copyToClipboard(verificationResult.storedHash, 'stored')}
                    className="hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-slate-200 break-all select-all font-mono text-[11px]">
                  {verificationResult.storedHash}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border space-y-1 ${
                  verificationResult.status === 'pass'
                    ? 'bg-slate-950/80 border-slate-800'
                    : 'bg-rose-950/40 border-rose-800/80'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Re-computed Digest (SHA-256):</span>
                  <button
                    onClick={() => copyToClipboard(verificationResult.computedHash, 'computed')}
                    className="hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedRehash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRehash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div
                  className={`break-all select-all font-mono text-[11px] ${
                    verificationResult.status === 'pass' ? 'text-emerald-300' : 'text-rose-300 font-semibold'
                  }`}
                >
                  {verificationResult.computedHash}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dataset Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Metadata Card 1: ID & Name */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Dataset Identifier</span>
            <div className="text-sm font-bold text-white truncate" title={dataset.name}>
              {dataset.name}
            </div>
            <div className="text-[11px] font-mono text-cyan-400 truncate">
              ID: {dataset.id}
            </div>
          </div>

          {/* Metadata Card 2: Dimensions & Storage */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Dimensions & Payload</span>
            <div className="text-sm font-bold text-white font-mono">
              {dataset.profile?.rowCount?.toLocaleString() || dataset.data.length.toLocaleString()} rows × {dataset.columns.length} cols
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              ~{(bytesEstimate / 1024).toFixed(1)} KB ({bytesEstimate.toLocaleString()} bytes)
            </div>
          </div>

          {/* Metadata Card 3: Source Type & Immutability */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Provenance & Lock</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                {dataset.sourceType}
              </span>
              {dataset.isImmutableSource && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Immutable Raw
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Version: v{dataset.version} {dataset.parentDatasetId ? `(from ${dataset.parentDatasetId})` : '(Root)'}
            </div>
          </div>

          {/* Metadata Card 4: Ingestion Timestamp */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Ingestion Timestamp</span>
            <div className="text-sm font-semibold text-white truncate">
              {new Date(dataset.createdAt).toLocaleDateString()} {new Date(dataset.createdAt).toLocaleTimeString()}
            </div>
            <div className="text-[10px] font-mono text-slate-500 truncate">
              ISO: {dataset.createdAt}
            </div>
          </div>
        </div>

        {/* Cryptographic Stored Fingerprint Card */}
        <div className="p-4.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white tracking-tight">
                Stored Cryptographic Fingerprint (SHA-256 Digest)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">Length: 64 hex characters (256 bits)</span>
              <button
                onClick={() => copyToClipboard(storedHex, 'stored')}
                className="px-2 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
                title="Copy full 64-character SHA-256 hash"
              >
                {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'Copied!' : 'Copy Fingerprint'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between gap-2">
            <span className="tracking-wider">{storedHex}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Algorithm:{' '}
              <strong className="text-slate-300">SHA-256 (Secure Hash Algorithm 256-bit)</strong>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Immutable Ledger Registered</span>
            </span>
          </div>
        </div>

        {/* Recent Integrity Audit Ledger / History */}
        {verificationHistory.length > 0 && (
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Integrity Audit Verification Log</span>
              <span className="text-slate-400 font-mono">{verificationHistory.length} audit runs recorded</span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-40 overflow-y-auto">
              {verificationHistory.map((hist, i) => (
                <div key={i} className="px-4 py-2 text-xs flex items-center justify-between font-mono bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    {hist.status === 'pass' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        PASS
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                        FAIL
                      </span>
                    )}
                    <span className="text-slate-300 text-[11px]">
                      {hist.sourceTested === 'tampered_simulation'
                        ? 'Simulated Alteration'
                        : hist.sourceTested === 'uploaded_file'
                        ? 'Local Disk File'
                        : 'Raw In-Memory Source'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>{hist.durationMs}ms</span>
                    <span>{new Date(hist.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
