import React, { useState } from 'react';
import {
  Cpu,
  TrendingUp,
  Brain,
  Play,
  Download,
  ArrowRight,
  CheckCircle2,
  BarChart,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Dataset, ModelArtifact, ModelEvaluationMetrics, TrainTestSplitResult } from '../../types';
import {
  evaluateBaselineClassification,
  runHoltWintersForecast,
  trainDecisionTreeClassifier,
  trainLinearRegression,
  trainLogisticRegression,
} from '../../utils/machineLearning';

interface WF07Props {
  dataset: Dataset;
  splitResult: TrainTestSplitResult | null;
  activeModelArtifact: ModelArtifact | null;
  onModelTrained: (artifact: ModelArtifact) => void;
  onGoToDashboard: () => void;
}

export const WF07MachineLearning: React.FC<WF07Props> = ({
  dataset,
  splitResult,
  activeModelArtifact,
  onModelTrained,
  onGoToDashboard,
}) => {
  const numericCols = dataset.profile.columns
    .filter((c) => c.type === 'integer' || c.type === 'float')
    .map((c) => c.name);

  // Auto-detect target column
  const initialTarget =
    dataset.columns.find((c) => c.toLowerCase().includes('churn') || c.toLowerCase().includes('default') || c.toLowerCase().includes('readmit')) ||
    numericCols[numericCols.length - 1] ||
    dataset.columns[0];

  const [taskType, setTaskType] = useState<'classification' | 'regression' | 'forecasting'>('classification');
  const [targetCol, setTargetCol] = useState<string>(initialTarget);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    numericCols.filter((c) => c !== initialTarget).slice(0, 5)
  );

  // Forecasting specific
  const [forecastDateCol, setForecastDateCol] = useState<string>(
    dataset.columns.find((c) => c.toLowerCase().includes('date')) || dataset.columns[1] || ''
  );
  const [forecastValCol, setForecastValCol] = useState<string>(
    numericCols.find((c) => c.toLowerCase().includes('spend') || c.toLowerCase().includes('revenue') || c.toLowerCase().includes('margin')) ||
    numericCols[0] || ''
  );
  const [horizonMonths, setHorizonMonths] = useState<number>(6);

  // Evaluation states
  const [modelsCompared, setModelsCompared] = useState<ModelEvaluationMetrics[]>(
    activeModelArtifact ? [activeModelArtifact.evaluation] : []
  );
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  const toggleFeature = (col: string) => {
    if (selectedFeatures.includes(col)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== col));
    } else {
      setSelectedFeatures([...selectedFeatures, col]);
    }
  };

  const handleTrainModels = () => {
    setIsTraining(true);
    try {
      const trainRows = splitResult ? splitResult.trainRows : dataset.data.slice(0, Math.floor(dataset.data.length * 0.8));
      const testRows = splitResult ? splitResult.testRows : dataset.data.slice(Math.floor(dataset.data.length * 0.8));

      if (taskType === 'classification') {
        const trainX = trainRows.map((r) => selectedFeatures.map((f) => Number(r[f]) || 0));
        const trainY = trainRows.map((r) => Number(r[targetCol]) === 1 ? 1 : 0);
        const testX = testRows.map((r) => selectedFeatures.map((f) => Number(r[f]) || 0));
        const testY = testRows.map((r) => Number(r[targetCol]) === 1 ? 1 : 0);

        const baseline = evaluateBaselineClassification(trainY, testY);
        const logReg = trainLogisticRegression(trainX, trainY, testX, testY, selectedFeatures);
        const tree = trainDecisionTreeClassifier(trainX, trainY, testX, testY, selectedFeatures, 3);

        const models = [baseline, logReg, tree];
        setModelsCompared(models);

        const bestModel = logReg.f1Score && tree.f1Score && tree.f1Score > logReg.f1Score ? tree : logReg;
        const artifact: ModelArtifact = {
          modelId: `model_${Date.now()}`,
          modelName: bestModel.modelName,
          targetColumn: targetCol,
          featuresUsed: selectedFeatures,
          hyperparameters: { max_depth: 3, lr: 0.05 },
          evaluation: bestModel,
          createdAt: new Date().toISOString(),
        };
        onModelTrained(artifact);
      } else if (taskType === 'regression') {
        const trainX = trainRows.map((r) => selectedFeatures.map((f) => Number(r[f]) || 0));
        const trainY = trainRows.map((r) => Number(r[targetCol]) || 0);
        const testX = testRows.map((r) => selectedFeatures.map((f) => Number(r[f]) || 0));
        const testY = testRows.map((r) => Number(r[targetCol]) || 0);

        const linear = trainLinearRegression(trainX, trainY, testX, testY, selectedFeatures);
        setModelsCompared([linear]);

        const artifact: ModelArtifact = {
          modelId: `model_${Date.now()}`,
          modelName: linear.modelName,
          targetColumn: targetCol,
          featuresUsed: selectedFeatures,
          hyperparameters: { alpha: 1.0 },
          evaluation: linear,
          createdAt: new Date().toISOString(),
        };
        onModelTrained(artifact);
      } else if (taskType === 'forecasting') {
        const dates = dataset.data.map((r) => String(r[forecastDateCol]));
        const vals = dataset.data.map((r) => Number(r[forecastValCol])).filter((n) => !isNaN(n));

        const forecast = runHoltWintersForecast(dates, vals, horizonMonths);
        setModelsCompared([forecast]);

        const artifact: ModelArtifact = {
          modelId: `model_${Date.now()}`,
          modelName: forecast.modelName,
          targetColumn: forecastValCol,
          featuresUsed: [forecastDateCol],
          hyperparameters: { alpha: 0.3, beta: 0.15, horizon: horizonMonths },
          evaluation: forecast,
          createdAt: new Date().toISOString(),
        };
        onModelTrained(artifact);
      }
    } catch (err: any) {
      console.error('Model training error:', err);
      setTrainingError(`Model training error: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const handleDownloadArtifact = () => {
    if (!activeModelArtifact) return;
    const jsonStr = JSON.stringify(activeModelArtifact, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_artifact_${activeModelArtifact.modelName.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
  };

  const primaryModel = modelsCompared[modelsCompared.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800">
              WF07
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Machine Learning Benchmarks & Horizon Forecasting
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Baseline comparison scorecards (Logistic Regression, Decision Trees, Ridge, Holt-Winters), confusion matrices, and model artifact exports.
          </p>
        </div>

        <button
          onClick={onGoToDashboard}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition self-start lg:self-auto"
        >
          <span>Proceed to WF08 Visual Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task & Target Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Selection */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Modeling Paradigm</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
              >
                <option value="classification">Binary Classification (Churn, Default, Readmission)</option>
                <option value="regression">Continuous Regression (Spend, Revenue, Margin)</option>
                <option value="forecasting">Time Series Forecasting (Holt-Winters Extrapolation)</option>
              </select>
            </div>

            {taskType !== 'forecasting' ? (
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Prediction Column (Y)</label>
                <select
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 font-mono"
                >
                  {dataset.columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Date Axis Column</label>
                  <select
                    value={forecastDateCol}
                    onChange={(e) => setForecastDateCol(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  >
                    {dataset.columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Forecast Value Metric</label>
                  <select
                    value={forecastValCol}
                    onChange={(e) => setForecastValCol(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  >
                    {numericCols.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={handleTrainModels}
              disabled={isTraining}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isTraining ? 'Training...' : 'Train Models & Compare Baselines'}</span>
            </button>

            {trainingError && (
              <div className="mt-2 p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-200">
                {trainingError}
              </div>
            )}
          </div>
        </div>

        {/* Feature Matrix Selector */}
        {taskType !== 'forecasting' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Feature Selection (X)</span>
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                {selectedFeatures.length} active
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {numericCols
                .filter((c) => c !== targetCol)
                .map((col) => {
                  const isChecked = selectedFeatures.includes(col);
                  return (
                    <label
                      key={col}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono cursor-pointer transition ${
                        isChecked
                          ? 'bg-slate-800 text-slate-200 border border-slate-700'
                          : 'bg-slate-950/60 text-slate-500 hover:bg-slate-850'
                      }`}
                    >
                      <span className="truncate">{col}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature(col)}
                        className="accent-indigo-500 rounded"
                      />
                    </label>
                  );
                })}
            </div>
          </div>
        )}

        {/* Model Artifact Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span>Model Artifact Status</span>
              </h3>
              {activeModelArtifact && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Ready
                </span>
              )}
            </div>

            {activeModelArtifact ? (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
                <div className="text-slate-200 font-bold">{activeModelArtifact.modelName}</div>
                <div className="text-[11px] text-slate-400">Target: {activeModelArtifact.targetColumn}</div>
                <div className="text-[11px] text-slate-400">
                  Training Time: {activeModelArtifact.evaluation.trainingTimeMs} ms
                </div>
                <div className="text-[11px] text-cyan-400">
                  Features: {activeModelArtifact.featuresUsed.join(', ')}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No model artifact stored yet. Click "Train Models" to generate evaluation weights and decision thresholds.
              </p>
            )}
          </div>

          {activeModelArtifact && (
            <button
              onClick={handleDownloadArtifact}
              className="w-full py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download Model Artifact (.json)</span>
            </button>
          )}
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      {modelsCompared.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Model Evaluation Scorecard vs Baseline</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Evaluated on independent Test partition
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Algorithm</th>
                  <th className="px-4 py-3">Type</th>
                  {taskType === 'classification' ? (
                    <>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Precision</th>
                      <th className="px-4 py-3">Recall</th>
                      <th className="px-4 py-3">F1-Score</th>
                    </>
                  ) : taskType === 'regression' ? (
                    <>
                      <th className="px-4 py-3">MAE</th>
                      <th className="px-4 py-3">RMSE</th>
                      <th className="px-4 py-3">R² Score</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">MAPE (%)</th>
                      <th className="px-4 py-3">RMSE</th>
                    </>
                  )}
                  <th className="px-4 py-3">Train Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {modelsCompared.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/50">
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {m.modelName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          m.isBaseline
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {m.isBaseline ? 'Baseline' : 'Candidate'}
                      </span>
                    </td>

                    {taskType === 'classification' ? (
                      <>
                        <td className="px-4 py-3 font-mono font-bold text-slate-200">
                          {((m.accuracy || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {((m.precision || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {((m.recall || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                          {((m.f1Score || 0) * 100).toFixed(1)}%
                        </td>
                      </>
                    ) : taskType === 'regression' ? (
                      <>
                        <td className="px-4 py-3 font-mono text-slate-300">{m.mae}</td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-400">{m.rmse}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400">{m.r2}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-mono font-bold text-cyan-400">{m.mape}%</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{m.rmse}</td>
                      </>
                    )}

                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">
                      {m.trainingTimeMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diagnostics: Confusion Matrix & Feature Importances */}
      {primaryModel && primaryModel.confusionMatrix && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confusion Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Confusion Matrix (Test Split)</h3>
            <div className="grid grid-cols-2 gap-3 pt-2 text-center font-mono">
              <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800">
                <span className="text-[11px] text-slate-400 block mb-1">True Positive (TP)</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {primaryModel.confusionMatrix.tp}
                </span>
              </div>
              <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800">
                <span className="text-[11px] text-slate-400 block mb-1">False Positive (FP)</span>
                <span className="text-2xl font-bold text-rose-400">
                  {primaryModel.confusionMatrix.fp}
                </span>
              </div>
              <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800">
                <span className="text-[11px] text-slate-400 block mb-1">False Negative (FN)</span>
                <span className="text-2xl font-bold text-rose-400">
                  {primaryModel.confusionMatrix.fn}
                </span>
              </div>
              <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800">
                <span className="text-[11px] text-slate-400 block mb-1">True Negative (TN)</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {primaryModel.confusionMatrix.tn}
                </span>
              </div>
            </div>
          </div>

          {/* Feature Importance */}
          {primaryModel.featureImportances && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Feature Importance Ranking</h3>
              <div className="space-y-2.5 pt-2">
                {primaryModel.featureImportances.map((item) => (
                  <div key={item.feature} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">{item.feature}</span>
                      <span className="text-cyan-400 font-bold">{(item.importance * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                        style={{ width: `${Math.min(100, item.importance * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forecasting Chart Projection */}
      {primaryModel && primaryModel.forecastPoints && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Projected Forecast Horizon with Confidence Bands</h3>
              <p className="text-xs text-slate-400">80% and 95% confidence intervals derived from residual variance</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-cyan-400 inline-block" /> Actual
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> Forecast
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-indigo-950 border border-indigo-700 inline-block" /> 95% Band
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="h-56 flex items-end gap-1.5 border-b border-l border-slate-800 px-3 pb-2 min-w-[600px]">
              {primaryModel.forecastPoints.map((pt, idx) => {
                const maxVal = Math.max(
                  ...primaryModel.forecastPoints!.map((p) => Math.max(p.actual || 0, p.upper95))
                );
                const heightPct = ((pt.actual ?? pt.forecast) / maxVal) * 100;
                const isProjected = pt.actual === undefined;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[9px] font-mono text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition">
                      {pt.actual ?? pt.forecast}
                    </span>
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        isProjected
                          ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 border-t-2 border-cyan-400'
                          : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                      }`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                    <span className="text-[9px] font-mono text-slate-500 mt-2 truncate max-w-full">
                      {pt.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
