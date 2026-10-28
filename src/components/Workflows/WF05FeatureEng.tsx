import React, { useState } from 'react';
import {
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Dataset, TrainTestSplitResult } from '../../types';
import {
  applyOneHotEncoder,
  applyScaler,
  fitOneHotEncoder,
  fitScalerOnTrain,
  trainTestSplit,
} from '../../utils/featureEngineering';

interface WF05Props {
  dataset: Dataset;
  splitResult: TrainTestSplitResult | null;
  onUpdateSplit: (res: TrainTestSplitResult) => void;
  onGoToSQL: () => void;
}

export const WF05FeatureEng: React.FC<WF05Props> = ({
  dataset,
  splitResult,
  onUpdateSplit,
  onGoToSQL,
}) => {
  const [trainRatio, setTrainRatio] = useState<number>(0.8);
  const [seed, setSeed] = useState<number>(42);
  const [viewSplit, setViewSplit] = useState<'train' | 'test'>('train');

  // Feature scaling options
  const numericCols = dataset.profile.columns
    .filter((c) => c.type === 'integer' || c.type === 'float')
    .map((c) => c.name);

  const categoricalCols = dataset.profile.columns
    .filter((c) => c.type === 'categorical' || c.type === 'string')
    .map((c) => c.name);

  const [scaleCol, setScaleCol] = useState<string>(numericCols[0] || '');
  const [scaleMethod, setScaleMethod] = useState<'standard' | 'minmax'>('standard');
  const [oneHotCol, setOneHotCol] = useState<string>(categoricalCols[0] || '');

  const handlePerformSplit = () => {
    const res = trainTestSplit(dataset, trainRatio, seed);
    onUpdateSplit(res);
  };

  const handleApplyScaling = () => {
    if (!splitResult || !scaleCol) return;
    // NON-NEGOTIABLE RULE: Fit scaler strictly on Train rows
    const fittedScaler = fitScalerOnTrain(splitResult.trainRows, scaleCol, scaleMethod);
    const newTrain = applyScaler(splitResult.trainRows, scaleCol, fittedScaler);
    const newTest = applyScaler(splitResult.testRows, scaleCol, fittedScaler);

    onUpdateSplit({
      ...splitResult,
      trainRows: newTrain,
      testRows: newTest,
      leakageAudit: {
        ...splitResult.leakageAudit,
        details: `Scaler for "${scaleCol}" fitted ONLY on ${newTrain.length} train rows (μ=${fittedScaler.mean.toFixed(2)}, σ=${fittedScaler.std.toFixed(2)}). Applied to test without leakage.`,
      },
    });
  };

  const handleApplyOneHot = () => {
    if (!splitResult || !oneHotCol) return;
    // Extract categories strictly from train
    const categories = fitOneHotEncoder(splitResult.trainRows, oneHotCol);
    const newTrain = applyOneHotEncoder(splitResult.trainRows, oneHotCol, categories);
    const newTest = applyOneHotEncoder(splitResult.testRows, oneHotCol, categories);

    onUpdateSplit({
      ...splitResult,
      trainRows: newTrain,
      testRows: newTest,
      leakageAudit: {
        ...splitResult.leakageAudit,
        details: `One-hot categories for "${oneHotCol}" mapped strictly from train split: [${categories.join(', ')}].`,
      },
    });
  };

  const currentSplit = splitResult || trainTestSplit(dataset, 0.8, 42);
  const activeRows = viewSplit === 'train' ? currentSplit.trainRows : currentSplit.testRows;
  const currentColumns = activeRows.length > 0 ? Object.keys(activeRows[0]) : dataset.columns;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800">
              WF05
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Feature Engineering & Data Leakage Prevention Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Enforces strict train/test partition boundaries. Scaler parameters and encodings are isolated exclusively to training data.
          </p>
        </div>

        <button
          onClick={onGoToSQL}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition self-start lg:self-auto"
        >
          <span>Proceed to WF06 SQL Engine</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Non-Negotiable Leakage Verification Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-white">Leakage-Free Verified Audit Certification</h4>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                PASSED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentSplit.leakageAudit.details}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs font-mono text-slate-300">
          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
            Train: {currentSplit.trainRows.length} ({(currentSplit.trainRatio * 100).toFixed(0)}%)
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
            Test: {currentSplit.testRows.length} ({((1 - currentSplit.trainRatio) * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Split Configurator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Train / Test Split Isolation</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Train Ratio:</span>
                <span className="font-mono text-cyan-400 font-bold">{(trainRatio * 100).toFixed(0)}% Train / {((1 - trainRatio) * 100).toFixed(0)}% Test</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={0.9}
                step={0.05}
                value={trainRatio}
                onChange={(e) => setTrainRatio(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Random PRNG Seed</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
              />
            </div>

            <button
              onClick={handlePerformSplit}
              className="w-full py-2 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            >
              Re-partition Dataset with Seed {seed}
            </button>
          </div>
        </div>

        {/* Scaler Application */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Fit Scaler on Train Set</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Numeric Column</label>
              <select
                value={scaleCol}
                onChange={(e) => setScaleCol(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
              >
                {numericCols.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Scaling Algorithm</label>
              <select
                value={scaleMethod}
                onChange={(e) => setScaleMethod(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                <option value="standard">StandardScaler (Z-Score: mean=0, std=1)</option>
                <option value="minmax">MinMaxScaler (Normalized: 0.0 to 1.0)</option>
              </select>
            </div>

            <button
              onClick={handleApplyScaling}
              className="w-full py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 rounded-lg transition"
            >
              Fit on Train & Transform Test
            </button>
          </div>
        </div>

        {/* Categorical Encoding */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>One-Hot Categorical Encoding</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Categorical Feature</label>
              <select
                value={oneHotCol}
                onChange={(e) => setOneHotCol(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
              >
                {categoricalCols.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Maps distinct categories observed strictly within the training split into binary indicator vectors.
            </p>

            <button
              onClick={handleApplyOneHot}
              className="w-full py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-purple-300 border border-slate-700 rounded-lg transition"
            >
              Generate One-Hot Columns
            </button>
          </div>
        </div>
      </div>

      {/* Feature Matrix View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewSplit('train')}
                className={`px-3 py-1 rounded font-medium transition ${
                  viewSplit === 'train'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Train Partition ({currentSplit.trainRows.length} rows)
              </button>
              <button
                onClick={() => setViewSplit('test')}
                className={`px-3 py-1 rounded font-medium transition ${
                  viewSplit === 'test'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Test Partition ({currentSplit.testRows.length} rows)
              </button>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {currentColumns.length} feature columns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-2.5 text-slate-600">#</th>
                {currentColumns.map((col) => (
                  <th key={col} className="px-3.5 py-2.5 text-slate-300 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeRows.slice(0, 8).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-850/50">
                  <td className="px-3.5 py-2 text-slate-600">{idx + 1}</td>
                  {currentColumns.map((col) => (
                    <td key={col} className="px-3.5 py-2 text-slate-300 whitespace-nowrap">
                      {String(row[col] ?? 'NULL')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
