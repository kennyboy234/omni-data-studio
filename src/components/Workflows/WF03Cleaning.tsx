import React, { useState } from 'react';
import {
  Filter,
  Trash2,
  Sliders,
  Scissors,
  CheckCircle,
  FileCode,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CleaningActionType, CleaningStep, Dataset } from '../../types';
import { applyCleaningStep, CleaningImpactPreview, previewCleaningImpact } from '../../utils/cleaner';
import { ModalConfirmCleaning } from '../ModalConfirmCleaning';

interface WF03Props {
  activeDataset: Dataset;
  rawSourceDataset: Dataset;
  cleaningSteps: CleaningStep[];
  onDatasetUpdated: (newDataset: Dataset, newStep: CleaningStep) => void;
  onGoToEDA: () => void;
}

export const WF03Cleaning: React.FC<WF03Props> = ({
  activeDataset,
  rawSourceDataset,
  cleaningSteps,
  onDatasetUpdated,
  onGoToEDA,
}) => {
  // Action selection
  const [selectedAction, setSelectedAction] = useState<CleaningActionType>('impute_nulls');
  const [selectedColumn, setSelectedColumn] = useState<string>(activeDataset.columns[0] || '');
  const [imputeStrategy, setImputeStrategy] = useState<'mean' | 'median' | 'mode' | 'constant'>('mean');
  const [constantVal, setConstantVal] = useState<string>('0');
  const [iqrMult, setIqrMult] = useState<number>(1.5);
  const [textOp, setTextOp] = useState<'trim' | 'lowercase' | 'uppercase'>('trim');
  const [targetType, setTargetType] = useState<'integer' | 'float' | 'string' | 'boolean'>('float');

  // Guardrail modal
  const [previewData, setPreviewData] = useState<CleaningImpactPreview | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const handleStageAction = () => {
    const params = {
      strategy: imputeStrategy,
      constantValue: constantVal,
      iqrMultiplier: iqrMult,
      textOperation: textOp,
      targetType,
    };

    const preview = previewCleaningImpact(activeDataset, selectedAction, selectedColumn, params);
    setPreviewData(preview);
    setShowConfirmModal(true);
  };

  const handleExecuteConfirmedAction = () => {
    if (!previewData) return;

    const params = {
      strategy: imputeStrategy,
      constantValue: constantVal,
      iqrMultiplier: iqrMult,
      textOperation: textOp,
      targetType,
    };

    const { updatedDataset, stepRecord } = applyCleaningStep(
      activeDataset,
      previewData.action,
      previewData.column,
      params
    );

    onDatasetUpdated(updatedDataset, stepRecord);
    setShowConfirmModal(false);
    setPreviewData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
              WF03
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Data Cleaning, Transformation & Lineage Audit Recipe
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Pandas/Polars equivalent data transformations with immutable source protection and transparent pre-execution impact audits.
          </p>
        </div>

        <button
          onClick={onGoToEDA}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition self-start lg:self-auto"
        >
          <span>Proceed to WF04 EDA</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Non-Negotiable Rule Callout */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Immutable Source Data Guarantee</h4>
            <p className="text-[11px] text-slate-400">
              Source dataset <span className="font-mono text-cyan-400">"{rawSourceDataset.name}"</span> is locked and immutable. Every action below generates a traceable child version ({activeDataset.name}).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <span>{rawSourceDataset.data.length} raw</span>
          <span>→</span>
          <span className="text-emerald-400 font-bold">{activeDataset.data.length} clean</span>
        </div>
      </div>

      {/* Action Builder Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Select Transformation Operation</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Transformation Category */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Operation Type</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
              >
                <option value="impute_nulls">Impute Missing Values (Mean/Median/Mode)</option>
                <option value="drop_null_rows">Drop Rows With Null Values</option>
                <option value="clamp_outliers_iqr">Clamp Outliers to 1.5x IQR Boundary</option>
                <option value="filter_outliers_iqr">Filter Out Outliers Beyond IQR</option>
                <option value="drop_duplicates">Drop Duplicate Records</option>
                <option value="text_normalize">Text Normalization (Trim / Lowercase)</option>
                <option value="cast_type">Cast Column Data Type</option>
              </select>
            </div>

            {/* Target Column */}
            {selectedAction !== 'drop_duplicates' && (
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Column</label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 font-mono"
                >
                  {activeDataset.columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sub-parameters */}
            {selectedAction === 'impute_nulls' && (
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Imputation Strategy</label>
                <select
                  value={imputeStrategy}
                  onChange={(e) => setImputeStrategy(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                >
                  <option value="mean">Mean (for symmetric numeric features)</option>
                  <option value="median">Median (robust against skew)</option>
                  <option value="mode">Mode (most frequent category)</option>
                  <option value="constant">Fixed Constant Value</option>
                </select>
              </div>
            )}

            {(selectedAction === 'filter_outliers_iqr' || selectedAction === 'clamp_outliers_iqr') && (
              <div>
                <label className="block text-slate-400 mb-1 font-medium">IQR Multiplier</label>
                <select
                  value={iqrMult}
                  onChange={(e) => setIqrMult(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                >
                  <option value={1.5}>1.5 × IQR (Standard Tukey Outlier Rule)</option>
                  <option value={2.0}>2.0 × IQR (Moderate Threshold)</option>
                  <option value={3.0}>3.0 × IQR (Extreme Outliers Only)</option>
                </select>
              </div>
            )}

            {selectedAction === 'text_normalize' && (
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Text Operation</label>
                <select
                  value={textOp}
                  onChange={(e) => setTextOp(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                >
                  <option value="trim">Trim Leading & Trailing Whitespace</option>
                  <option value="lowercase">Convert to Lowercase</option>
                  <option value="uppercase">Convert to Uppercase</option>
                </select>
              </div>
            )}

            {selectedAction === 'cast_type' && (
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Type</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                >
                  <option value="integer">Integer</option>
                  <option value="float">Float</option>
                  <option value="string">String</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
            )}

            <button
              onClick={handleStageAction}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
            >
              <span>Audit Impact & Apply</span>
            </button>
          </div>
        </div>

        {/* Audit Recipe Trail */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Chronological Recipe Audit Trail</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {cleaningSteps.length} transformation steps recorded
              </span>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[380px]">
              {cleaningSteps.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No transformations applied yet. Use the panel on the left to stage and audit cleaning actions.
                </div>
              ) : (
                cleaningSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold text-slate-200">
                            {step.action}
                          </span>
                          {step.column && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                              col: {step.column}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{step.impactSummary.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-500 block">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {step.impactSummary.affectedRows} rows affected
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-slate-800 bg-slate-850 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Current Active Snapshot: {activeDataset.name}</span>
            <span>{activeDataset.data.length} clean rows</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ModalConfirmCleaning
        isOpen={showConfirmModal}
        preview={previewData}
        onConfirm={handleExecuteConfirmedAction}
        onCancel={() => {
          setShowConfirmModal(false);
          setPreviewData(null);
        }}
      />
    </div>
  );
};
