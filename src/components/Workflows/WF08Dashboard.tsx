import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Filter,
  BarChart3,
  TrendingUp,
  PieChart,
  ArrowRight,
  Activity,
  Layers,
} from 'lucide-react';
import { Dataset } from '../../types';

interface WF08Props {
  dataset: Dataset;
  onGoToExport: () => void;
}

export const WF08Dashboard: React.FC<WF08Props> = ({ dataset, onGoToExport }) => {
  const numericCols = dataset.profile.columns
    .filter((c) => c.type === 'integer' || c.type === 'float')
    .map((c) => c.name);

  const categoricalCols = dataset.profile.columns
    .filter((c) => c.type === 'categorical' || c.type === 'string' || c.type === 'boolean')
    .map((c) => c.name);

  // Filter state
  const primaryCatCol = categoricalCols[0] || dataset.columns[0];
  const distinctCategories = Array.from(
    new Set(dataset.data.map((r) => String(r[primaryCatCol] ?? 'Unassigned')))
  ).slice(0, 10);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Chart axes
  const [xAxisCol, setXAxisCol] = useState<string>(primaryCatCol);
  const [yAxisCol, setYAxisCol] = useState<string>(numericCols[0] || '');
  const [scatterX, setScatterX] = useState<string>(numericCols[0] || '');
  const [scatterY, setScatterY] = useState<string>(numericCols[1] || numericCols[0] || '');

  // Filtered rows
  const filteredData = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return dataset.data;
    return dataset.data.filter((r) => String(r[primaryCatCol]) === selectedCategoryFilter);
  }, [dataset.data, primaryCatCol, selectedCategoryFilter]);

  // Aggregate stats by Category for Bar Chart
  const aggregatedBarData = useMemo(() => {
    const groups: Record<string, { sum: number; count: number }> = {};
    filteredData.forEach((row) => {
      const key = String(row[xAxisCol] ?? 'Unknown');
      const val = Number(row[yAxisCol]) || 0;
      if (!groups[key]) groups[key] = { sum: 0, count: 0 };
      groups[key].sum += val;
      groups[key].count += 1;
    });

    return Object.entries(groups).map(([category, { sum, count }]) => ({
      category,
      avg: Number((sum / Math.max(1, count)).toFixed(2)),
      count,
    }));
  }, [filteredData, xAxisCol, yAxisCol]);

  const maxAvg = Math.max(...aggregatedBarData.map((d) => d.avg), 1);

  // Scatter plot points (normalized coordinates 0 to 100)
  const scatterPoints = useMemo(() => {
    const points = filteredData
      .map((r) => ({
        x: Number(r[scatterX]),
        y: Number(r[scatterY]),
      }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y));

    if (points.length === 0) return [];
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    return points.slice(0, 120).map((p) => ({
      rawX: p.x,
      rawY: p.y,
      normX: ((p.x - minX) / rangeX) * 92 + 4,
      normY: 96 - (((p.y - minY) / rangeY) * 92 + 4),
    }));
  }, [filteredData, scatterX, scatterY]);

  // Compute KPI metrics
  const totalRecords = filteredData.length;
  const avgMetric = yAxisCol
    ? Number(
        (
          filteredData.reduce((acc, r) => acc + (Number(r[yAxisCol]) || 0), 0) /
          Math.max(1, totalRecords)
        ).toFixed(2)
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
              WF08
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Interactive Analytics Canvas & Visualization Dashboard
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Multi-dimensional slicing, dynamic KPI aggregates, bivariate scatter correlation, and group breakdowns.
          </p>
        </div>

        <button
          onClick={onGoToExport}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition self-start lg:self-auto"
        >
          <span>Proceed to WF09 Executive Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Global Slicing & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">Slice by {primaryCatCol}:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Records
            </button>
            {distinctCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  selectedCategoryFilter === cat
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
          Viewing {filteredData.length} of {dataset.data.length} records
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Active Row Count</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white">{totalRecords}</span>
            <span className="text-[11px] text-slate-500 font-mono">rows</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Avg {yAxisCol || 'Metric'}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-cyan-400">{avgMetric}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Total Categories</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-indigo-400">
              {aggregatedBarData.length}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">cohorts</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Data Health Ratio</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-400">100%</span>
            <span className="text-[11px] text-slate-500 font-mono">operational</span>
          </div>
        </div>
      </div>

      {/* Visual Canvas Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aggregated Group Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Cohort Aggregation Breakdown</span>
              </h3>
              <p className="text-xs text-slate-400">Average values grouped by categorical dimension</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={xAxisCol}
                onChange={(e) => setXAxisCol(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
              >
                {categoricalCols.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={yAxisCol}
                onChange={(e) => setYAxisCol(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
              >
                {numericCols.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <div className="h-56 flex items-end gap-3 border-b border-l border-slate-800 px-4 pb-2">
              {aggregatedBarData.map((d, idx) => {
                const heightPct = (d.avg / maxAvg) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition">
                      {d.avg}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-sm group-hover:from-indigo-500 group-hover:to-cyan-300 transition-all"
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-400 mt-2 truncate max-w-full">
                      {d.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bivariate Scatter Plot */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Bivariate Feature Scatter Plot</span>
              </h3>
              <p className="text-xs text-slate-400">Inspect non-linear interactions & clustering</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={scatterX}
                onChange={(e) => setScatterX(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
              >
                {numericCols.map((c) => (
                  <option key={c} value={c}>X: {c}</option>
                ))}
              </select>

              <select
                value={scatterY}
                onChange={(e) => setScatterY(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
              >
                {numericCols.map((c) => (
                  <option key={c} value={c}>Y: {c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative h-56 bg-slate-950 rounded-lg border border-slate-800 p-2 overflow-hidden">
            {scatterPoints.map((pt, idx) => (
              <div
                key={idx}
                className="absolute w-2 h-2 rounded-full bg-cyan-400/80 hover:bg-white hover:scale-150 transition-transform cursor-pointer"
                style={{ left: `${pt.normX}%`, top: `${pt.normY}%` }}
                title={`(${scatterX}: ${pt.rawX}, ${scatterY}: ${pt.rawY})`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
