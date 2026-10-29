import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Wand2,
  Plus,
  Code2,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Download,
} from 'lucide-react';
import { DataQualityAssertion, Dataset, QualityValidationReport } from '../../types';
import { autoGenerateAssertions, exportDbtTestsYaml, runQualityAssertions } from '../../utils/dataQuality';

interface WF02Props {
  dataset: Dataset;
  assertions: DataQualityAssertion[];
  validationReport: QualityValidationReport | null;
  onUpdateAssertions: (assertions: DataQualityAssertion[]) => void;
  onRunValidations: (report: QualityValidationReport) => void;
  onGoToCleaning: () => void;
}

export const WF02Quality: React.FC<WF02Props> = ({
  dataset,
  assertions,
  validationReport,
  onUpdateAssertions,
  onRunValidations,
  onGoToCleaning,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDbtModal, setShowDbtModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New assertion state
  const [newType, setNewType] = useState<DataQualityAssertion['type']>('expect_column_values_to_not_be_null');
  const [newCol, setNewCol] = useState(dataset.columns[0] || '');
  const [newMin, setNewMin] = useState<number>(0);
  const [newMax, setNewMax] = useState<number>(1000);
  const [newSeverity, setNewSeverity] = useState<'error' | 'warning'>('error');

  const handleAutoGenerate = () => {
    const generated = autoGenerateAssertions(dataset);
    onUpdateAssertions(generated);
    const report = runQualityAssertions(dataset, generated);
    onRunValidations(report);
  };

  const handleExecuteTests = () => {
    const report = runQualityAssertions(dataset, assertions);
    onRunValidations(report);
  };

  const handleAddAssertion = () => {
    const newA: DataQualityAssertion = {
      id: `custom_${Date.now()}`,
      type: newType,
      column: newCol,
      parameters: {
        min: newMin,
        max: newMax,
      },
      severity: newSeverity,
      description: `Rule: ${newType} on column "${newCol}"`,
    };

    const updated = [...assertions, newA];
    onUpdateAssertions(updated);
    const report = runQualityAssertions(dataset, updated);
    onRunValidations(report);
    setShowAddModal(false);
  };

  const dbtYaml = exportDbtTestsYaml(dataset.name, assertions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              WF02
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Data Quality Assertions & Contract Enforcement
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            dbt-compatible data tests and Great Expectations schema contract validation with sample failure inspection.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleAutoGenerate}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 rounded-lg transition"
          >
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Auto-Generate Contract</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>

          <button
            onClick={() => setShowDbtModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg transition"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>dbt schema.yml</span>
          </button>

          <button
            onClick={handleExecuteTests}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute Assertions</span>
          </button>
        </div>
      </div>

      {/* Scorecard */}
      {validationReport && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Contract Score</span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono ${
                  validationReport.qualityScorePercent >= 90
                    ? 'text-emerald-400'
                    : validationReport.qualityScorePercent >= 70
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {validationReport.qualityScorePercent}%
              </span>
              <span className="text-[11px] text-slate-500 font-mono">compliance</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Assertions Passed</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {validationReport.passedCount}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">/ {validationReport.totalAssertions}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Critical Violations</span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono ${
                  validationReport.failedCount > 0 ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {validationReport.failedCount}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">errors</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Warnings / Soft Gates</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {validationReport.warningCount}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">anomalies</span>
            </div>
          </div>
        </div>
      )}

      {/* Assertions Evaluation Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Evaluated Test Results</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{assertions.length} rules configured</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {(!validationReport || validationReport.results.length === 0) ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No assertions executed yet. Click "Auto-Generate Contract" or "Execute Assertions".
            </div>
          ) : (
            validationReport.results.map((res) => {
              const isExpanded = expandedId === res.assertionId;
              const isPassed = res.status === 'passed';
              const isWarning = res.status === 'warning';

              return (
                <div key={res.assertionId} className="p-4 hover:bg-slate-850/40 transition">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : res.assertionId)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold text-slate-200">
                            {res.assertionType}
                          </span>
                          {res.column && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                              column: {res.column}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              isPassed
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : isWarning
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {res.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{res.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isPassed && (
                        <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900">
                          {res.unexpectedRowsCount} violations ({res.unexpectedPercent}%)
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Row Diagnostics */}
                  {isExpanded && res.unexpectedExamples.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
                      <span className="text-[11px] text-slate-400 block mb-1">
                        Failure Samples (first {res.unexpectedExamples.length} rows):
                      </span>
                      <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(res.unexpectedExamples, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Next Step Banner */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="text-xs font-semibold text-white">Quality gate evaluated</h4>
            <p className="text-[11px] text-slate-400">
              Proceed to WF03 to resolve missing values and outliers with auditable transformation recipes.
            </p>
          </div>
        </div>
        <button
          onClick={onGoToCleaning}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          <span>Proceed to WF03 Cleaning</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add Assertion Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="bg-slate-900 border border-slate-750 rounded-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Configure New Data Test Assertion</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Assertion Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="expect_column_values_to_not_be_null">Expect Column Values To Not Be Null</option>
                  <option value="expect_column_values_to_be_unique">Expect Column Values To Be Unique</option>
                  <option value="expect_column_values_to_be_between">Expect Column Values To Be Between (Range)</option>
                  <option value="expect_table_row_count_to_be_between">Expect Table Row Count To Be Between</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Column</label>
                <select
                  value={newCol}
                  onChange={(e) => setNewCol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                >
                  {dataset.columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {newType === 'expect_column_values_to_be_between' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Min Value</label>
                    <input
                      type="number"
                      value={newMin}
                      onChange={(e) => setNewMin(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Max Value</label>
                    <input
                      type="number"
                      value={newMax}
                      onChange={(e) => setNewMax(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="error">Error (Breaks Pipeline)</option>
                  <option value="warning">Warning (Soft Gate)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAssertion}
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
              >
                Save & Run Assertion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* dbt YAML Modal */}
      {showDbtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="bg-slate-900 border border-slate-750 rounded-xl max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Autogenerated dbt schema.yml</h3>
              </div>
              <button onClick={() => setShowDbtModal(false)} className="text-slate-400 hover:text-white text-xs">
                Close
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto">
              {dbtYaml}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(dbtYaml);
                  alert('Copied dbt schema.yml to clipboard');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 rounded-lg"
              >
                Copy YAML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
