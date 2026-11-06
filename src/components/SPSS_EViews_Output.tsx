import React, { useMemo } from 'react';
import { BarChart3, X, ChevronDown, ChevronUp, Download, Copy } from 'lucide-react';
import { runFrequencies, runADFTest, ADFTestResult } from '../stats/spssEviewsEngine';

// Define local data interface for the output components
interface OutputDataRecord {
  downtime_hours?: number | null;
  date?: string;
  [key: string]: unknown;
}

// ====================================================================
// SPSS-STYLE FREQUENCIES OUTPUT COMPONENT
// ====================================================================
interface SPSSFrequenciesOutputProps {
  data: OutputDataRecord[];
  onClose: () => void;
}

export const SPSSFrequenciesOutput: React.FC<SPSSFrequenciesOutputProps> = ({ data, onClose }) => {
  // Extract numeric data for analysis (e.g., downtime_hours)
  const numericData = useMemo(() => {
    return data
      .map((d) => d.downtime_hours)
      .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
  }, [data]);

  const result = useMemo(() => runFrequencies(numericData, 'Downtime Hours'), [numericData]);

  const [showFullTable, setShowFullTable] = React.useState(false);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-[#E5E7EB] px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#14B8A6]" />
          <h3 className="font-bold text-sm text-[#111827]">
            SPSS Output — Frequencies: Downtime Hours
          </h3>
          <span className="px-2 py-0.5 bg-[#14B8A6] text-white text-xs rounded font-medium">
            N = {result.validN}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
          title="Close output"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {/* Statistics Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-[#E5E7EB] flex justify-between items-center">
            <h4 className="font-semibold text-xs text-[#111827]">Statistics</h4>
            <div className="flex gap-1">
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Copy table">
                <Copy className="w-3 h-3" />
              </button>
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Export CSV">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Statistic</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#F3F4F6]"><td className="px-3 py-1.5 text-gray-700">Valid N</td><td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.validN}</td></tr>
                <tr className="border-b border-[#F3F4F6]"><td className="px-3 py-1.5 text-gray-700">Missing N</td><td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.missingN}</td></tr>
                <tr className="border-b border-[#F3F4F6]"><td className="px-3 py-1.5 text-gray-700">Mean</td><td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.mean.toFixed(4)}</td></tr>
                <tr className="border-b border-[#F3F4F6]"><td className="px-3 py-1.5 text-gray-700">Std. Deviation</td><td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.stdDev.toFixed(4)}</td></tr>
                <tr className="border-b border-[#F3F4F6]"><td className="px-3 py-1.5 text-gray-700">Variance</td><td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.variance.toFixed(4)}</td></tr>
                <tr className="border-b border-[#F3F4F6]"><td className="px-3 py-1.5 text-gray-700">Skewness</td><td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.skewness.toFixed(4)}</td></tr>
                <tr className="border-b border-[#F3F4F6]"><td className="px-3 py-1.5 text-gray-700">Kurtosis</td><td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.kurtosis.toFixed(4)}</td></tr>
                <tr className="border-b border-[#F3F4F6]"><td className="px-3 py-1.5 text-gray-700">Minimum</td><td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.minimum.toFixed(4)}</td></tr>
                <tr className="border-b border-[#F3F4F6]"><td className="px-3 py-1.5 text-gray-700">Maximum</td><td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.maximum.toFixed(4)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Percentiles Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-[#E5E7EB] flex justify-between items-center">
            <h4 className="font-semibold text-xs text-[#111827]">Percentiles</h4>
            <div className="flex gap-1">
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Copy table">
                <Copy className="w-3 h-3" />
              </button>
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Export CSV">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Percentile</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Value</th>
                </tr>
              </thead>
              <tbody>
                {result.percentiles.map((p) => (
                  <tr key={p.p} className="border-b border-[#F3F4F6]">
                    <td className="px-3 py-1.5 text-gray-700">{p.p}%</td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-900">{p.value.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Frequency Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-[#E5E7EB] flex justify-between items-center">
            <h4 className="font-semibold text-xs text-[#111827]">Frequency Table</h4>
            <div className="flex gap-1">
              <button
                onClick={() => setShowFullTable(!showFullTable)}
                className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50"
              >
                {showFullTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Copy table">
                <Copy className="w-3 h-3" />
              </button>
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Export CSV">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Value</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Frequency</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Percent</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Valid %</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Cumulative %</th>
                </tr>
              </thead>
              <tbody>
                {showFullTable
                  ? result.frequencyTable.map((row, i) => (
                      <tr key={i} className="border-b border-[#F3F4F6] hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-mono text-gray-900">{row.value}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-900">{row.frequency}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-900">{row.percent.toFixed(2)}%</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-900">{row.validPercent.toFixed(2)}%</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-900">{row.cumulativePercent.toFixed(2)}%</td>
                      </tr>
                    ))
                  : result.frequencyTable.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-[#F3F4F6] hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-mono text-gray-900">{row.value}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-900">{row.frequency}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-900">{row.percent.toFixed(2)}%</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-900">{row.validPercent.toFixed(2)}%</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-900">{row.cumulativePercent.toFixed(2)}%</td>
                      </tr>
                    ))}
                {!showFullTable && result.frequencyTable.length > 10 && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-3 py-2 text-center text-gray-500 text-xs">
                      ... {result.frequencyTable.length - 10} more rows (click to expand)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Histogram */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-[#E5E7EB] flex justify-between items-center">
            <h4 className="font-semibold text-xs text-[#111827]">Histogram</h4>
            <div className="flex gap-1">
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Copy as image">
                <Copy className="w-3 h-3" />
              </button>
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Export CSV">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="p-4 h-64">
            <div className="flex items-end justify-center h-full gap-1">
              {result.histogramData.map((bin, i) => {
                const maxCount = Math.max(...result.histogramData.map((b) => b.count));
                const height = maxCount > 0 ? (bin.count / maxCount) * 200 : 0;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 min-w-[20px]" title={`Bin: ${bin.bin.toFixed(2)} | Count: ${bin.count}`}>
                    <div
                      className="bg-[#14B8A6] w-full rounded-t transition-all hover:bg-[#0D9488]"
                      style={{ height: `${Math.max(height, 4)}px` }}
                    />
                    <span className="text-[9px] text-gray-500 mt-1">{bin.bin.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="px-4 pb-3 text-xs text-gray-500 border-t border-[#F3F4F6]">
            <span className="font-mono">Mean = {result.mean.toFixed(2)}</span> | 
            <span className="font-mono">Std. Dev. = {result.stdDev.toFixed(2)}</span> | 
            <span className="font-mono">N = {result.validN}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// EVIEWS-STYLE ADF OUTPUT COMPONENT
// ====================================================================
interface EViewsADFOutputProps {
  data: OutputDataRecord[];
  onClose: () => void;
}

export const EViewsADFOutput: React.FC<EViewsADFOutputProps> = ({ data, onClose }) => {
  // Create time series data from records (using downtime_hours ordered by date)
  const timeSeriesData = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(String(a.date || '')).getTime() - new Date(String(b.date || '')).getTime());
    return sorted
      .map((d) => d.downtime_hours)
      .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
  }, [data]);

  const result = useMemo(() => runADFTest(timeSeriesData, { trend: 'ct', maxLags: 'auto' }), [timeSeriesData]);

  const gaugeColor = result.conclusion === 'Stationary' ? '#14B8A6' : '#EF4444';

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-[#E5E7EB] px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#14B8A6]" />
          <h3 className="font-bold text-sm text-[#111827]">
            EViews Output — Augmented Dickey-Fuller Unit Root Test
          </h3>
          <span className={`px-2 py-0.5 text-xs rounded font-medium ${result.conclusion === 'Stationary' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {result.conclusion}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
          title="Close output"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {/* Test Equation Specification */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
          <div className="font-mono text-xs text-gray-700 whitespace-pre-wrap">
            {`Null Hypothesis: DOWNTIME has a unit root
Exogenous: ${result.trend === 'ct' ? 'Constant, Linear Trend' : result.trend === 'c' ? 'Constant' : 'None'}
Lag Length: ${result.lagLength} (${result.maxLags === 'auto' ? 'Automatic - based on SIC' : `Fixed at ${result.maxLags}`}, max=${result.maxLags})`}
          </div>
        </div>

        {/* ADF Test Statistics Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-[#E5E7EB] flex justify-between items-center">
            <h4 className="font-semibold text-xs text-[#111827]">Augmented Dickey-Fuller Test Statistic</h4>
            <div className="flex gap-1">
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Copy table">
                <Copy className="w-3 h-3" />
              </button>
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Export CSV">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">t-Statistic</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Prob.*</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="px-3 py-2 font-mono text-gray-900">{result.adfStatistic.toFixed(4)}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-900">{result.pValue.toFixed(4)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 text-gray-500 font-mono">Test critical values:</td>
                  <td className="px-3 py-2 text-right text-gray-500"></td>
                </tr>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="px-3 py-1.5 text-gray-700">1% level</td>
                  <td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.criticalValues['1%'].toFixed(4)}</td>
                </tr>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="px-3 py-1.5 text-gray-700">5% level</td>
                  <td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.criticalValues['5%'].toFixed(4)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 text-gray-700">10% level</td>
                  <td className="px-3 py-1.5 text-right font-mono text-gray-900">{result.criticalValues['10%'].toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-[10px] text-gray-500 border-t border-[#F3F4F6]">
            *MacKinnon (1996) one-sided p-values.
          </div>
        </div>

        {/* Test Regression Output */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-[#E5E7EB] flex justify-between items-center">
            <h4 className="font-semibold text-xs text-[#111827]">Test Regression</h4>
            <div className="flex gap-1">
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Copy table">
                <Copy className="w-3 h-3" />
              </button>
              <button className="px-2 py-0.5 text-xs bg-white border border-[#E5E7EB] rounded hover:bg-gray-50" title="Export CSV">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Variable</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Coefficient</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Std. Error</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">t-Statistic</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Prob.</th>
                </tr>
              </thead>
              <tbody>
                {result.regressionCoefficients.map((coeff, i) => (
                  <tr key={i} className="border-b border-[#F3F4F6]">
                    <td className="px-3 py-1.5 font-mono text-gray-900">{coeff.variable}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-900">{coeff.coefficient.toFixed(6)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-900">{coeff.stdError.toFixed(6)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-900">{coeff.tStat.toFixed(4)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-900">{coeff.pValue.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-[10px] text-gray-500 border-t border-[#F3F4F6]">
            Dependent Variable: D(DOWNTIME) | Method: Least Squares | Sample: {result.obs} observations
          </div>
        </div>

        {/* Model Diagnostics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
            <h4 className="font-semibold text-xs text-[#111827] mb-2">Residual Diagnostics</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-gray-600">R-squared</span><span className="font-mono text-gray-900">{result.diagnostics.rSquared.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Adj. R-squared</span><span className="font-mono text-gray-900">{result.diagnostics.adjRSquared.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">F-statistic</span><span className="font-mono text-gray-900">{result.diagnostics.fStatistic.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Prob(F-statistic)</span><span className="font-mono text-gray-900">{result.diagnostics.fProb.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Durbin-Watson</span><span className="font-mono text-gray-900">{result.diagnostics.durbinWatson.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">AIC</span><span className="font-mono text-gray-900">{result.diagnostics.aic.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">SC</span><span className="font-mono text-gray-900">{result.diagnostics.sc.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Log likelihood</span><span className="font-mono text-gray-900">{result.diagnostics.logLikelihood.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
            <h4 className="font-semibold text-xs text-[#111827] mb-2">Correlogram (Residuals)</h4>
            <div className="h-32">
              <div className="flex items-end justify-center h-full gap-1">
                {result.diagnostics.correlogram.map((corr, i) => {
                  const height = Math.abs(corr) * 100;
                  const color = i === 0 ? '#9CA3AF' : Math.abs(corr) > 0.1 ? '#EF4444' : '#14B8A6';
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 min-w-[12px]" title={`Lag ${i}: ${corr.toFixed(4)}`}>
                      <div
                        className="w-full rounded-t transition-all"
                        style={{ height: `${Math.max(height, 2)}px`, backgroundColor: color }}
                      />
                      <span className="text-[8px] text-gray-500 mt-0.5">{i}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-center text-[9px] text-gray-500 mt-1">Lag</div>
            </div>
          </div>
        </div>

        {/* Stationarity Gauge */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <h4 className="font-semibold text-xs text-[#111827] mb-3 text-center">Stationarity Assessment</h4>
          <div className="relative h-20 flex items-center justify-center">
            {/* Gauge background */}
            <svg viewBox="0 0 200 100" className="w-full max-w-md">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
              </defs>
              <path
                d="M10 90 A80 80 0 0 1 190 90"
                stroke="url(#gaugeGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />
              {/* Critical value markers */}
              <text x="10" y="105" className="text-[8px] fill-gray-500 text-anchor-middle">Unit Root</text>
              <text x="190" y="105" className="text-[8px] fill-gray-500 text-anchor-middle">Stationary</text>
              <text x="100" y="105" className="text-[8px] fill-gray-500 text-anchor-middle">Critical</text>
            </svg>
            {/* Needle */}
            <div className="absolute">
              <div
                className="w-0.5 h-24"
                style={{
                  transform: `rotate(${-90 + Math.min(Math.max((result.adfStatistic - result.criticalValues['1%']) / (result.criticalValues['10%'] - result.criticalValues['1%']) * 180, 0), 180)}deg)`,
                  transformOrigin: 'bottom center',
                  backgroundColor: gaugeColor,
                }}
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full" style={{ backgroundColor: gaugeColor }} />
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
              <span className="text-gray-600">Unit Root</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }} />
              <span className="text-gray-600">Critical Region</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#14B8A6' }} />
              <span className="text-gray-600">Stationary</span>
            </div>
          </div>
          <div className="text-center mt-3 p-2 rounded" style={{ backgroundColor: `${gaugeColor}15` }}>
            <p className="text-xs font-medium" style={{ color: gaugeColor }}>
              ADF = {result.adfStatistic.toFixed(2)} | Critical (5%) = {result.criticalValues['5%'].toFixed(2)} | 
              {result.adfStatistic < result.criticalValues['5%'] ? 'Reject H₀: Series is stationary' : 'Fail to reject H₀: Unit root present'}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">p-value = {result.pValue.toFixed(4)} | Obs = {result.obs} | Lag = {result.lagLength}</p>
          </div>
        </div>
      </div>
    </div>
  );
};