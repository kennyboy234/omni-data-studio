import React, { useState } from 'react';
import { LedgerEntry, Sha256Ledger } from './ledger';
import {
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

interface Sha256LedgerProps {
  ledger: Sha256Ledger;
  currentDatasetHash: string;
  onVerifyLedger?: () => void;
}

export const Sha256LedgerView: React.FC<Sha256LedgerProps> = ({
  ledger,
  currentDatasetHash,
}) => {
  const [chain, setChain] = useState<LedgerEntry[]>(() => ledger.getChain());
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(() => ledger.verifyChainIntegrity());
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleVerify = () => {
    const result = ledger.verifyChainIntegrity();
    setVerificationResult(result);
    setChain(ledger.getChain());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-cyan-400">
              WF03 • Cryptographic Governance
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
              IMMUTABLE LEDGER
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
            SHA-256 Dataset Audit Ledger
          </h3>
        </div>

        <button
          onClick={handleVerify}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Verify Chain</span>
        </button>
      </div>

      {/* Current Active Dataset Hash Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
              Active Dataset SHA-256 Fingerprint
            </div>
            <div className="text-xs font-mono font-bold text-cyan-300 break-all">
              {currentDatasetHash}
            </div>
          </div>
        </div>

        <button
          onClick={() => copyToClipboard(currentDatasetHash)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition shrink-0"
        >
          {copiedHash === currentDatasetHash ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Hash</span>
            </>
          )}
        </button>
      </div>

      {/* Verification Integrity Status Badge */}
      {verificationResult && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            verificationResult.isValid
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          {verificationResult.isValid ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{verificationResult.message}</span>
        </div>
      )}

      {/* Ledger Block History Timeline */}
      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {chain.map((block) => (
          <div
            key={`block-${block.blockIndex}`}
            className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 text-xs font-mono space-y-1.5 transition"
          >
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold text-[10px]">
                  BLOCK #{block.blockIndex}
                </span>
                <span className="text-white font-medium">{block.operation}</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {new Date(block.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Dataset: {block.datasetName}</span>
              <span>Rows: {block.rowCount}</span>
            </div>

            <div className="pt-1 border-t border-slate-900 text-[10px] text-slate-500 truncate flex items-center justify-between gap-2">
              <span className="truncate">
                Hash: <span className="text-slate-400">{block.datasetSha256}</span>
              </span>
              <button
                onClick={() => copyToClipboard(block.datasetSha256)}
                className="text-slate-400 hover:text-white shrink-0"
                title="Copy hash"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
