import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Database,
  Clock,
  Download,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Code,
  ShieldAlert,
} from 'lucide-react';
import { Dataset } from '../../types';
import { exportToCSV } from '../../utils/csvParser';
import { profileDataset } from '../../utils/profiler';
import { executeSQL, QueryResult, SQLTemplate } from '../../utils/sqlEngine';
import { ModalDestructiveSQL } from '../ModalDestructiveSQL';

interface WF06Props {
  activeDataset: Dataset;
  rawDataset: Dataset;
  onSaveAsDataset: (ds: Dataset) => void;
  onGoToML: () => void;
}

export const WF06SQL: React.FC<WF06Props> = ({
  activeDataset,
  rawDataset,
  onSaveAsDataset,
  onGoToML,
}) => {
  const defaultQuery = `SELECT * FROM active_data LIMIT 15`;

  const [query, setQuery] = useState<string>(defaultQuery);
  const [result, setResult] = useState<QueryResult | null>(null);

  // Destructive modal state
  const [showDestructiveModal, setShowDestructiveModal] = useState(false);
  const [pendingDestructiveCommand, setPendingDestructiveCommand] = useState<string>('');

  const tables: Record<string, Record<string, any>[]> = {
    active_data: activeDataset.data,
    raw_data: rawDataset.data,
  };

  const templates: SQLTemplate[] = [
    {
      name: 'Sample First 15 Records',
      description: 'Simple projection of top 15 records from active table',
      sql: `SELECT * FROM active_data LIMIT 15`,
    },
    {
      name: 'Group Aggregation & Mean',
      description: 'Group by primary category with row count and numeric averages',
      sql: activeDataset.columns.includes('plan_tier')
        ? `SELECT plan_tier, COUNT(*) AS count, AVG(monthly_spend) AS avg_spend FROM active_data GROUP BY plan_tier ORDER BY avg_spend DESC`
        : activeDataset.columns.includes('product_category')
        ? `SELECT product_category, COUNT(*) AS total_orders, SUM(net_revenue) AS total_revenue, AVG(profit_margin) AS avg_margin FROM active_data GROUP BY product_category ORDER BY total_revenue DESC`
        : `SELECT ${activeDataset.columns[1]}, COUNT(*) AS count FROM active_data GROUP BY ${activeDataset.columns[1]}`,
    },
    {
      name: 'Null Value Audit Query',
      description: 'Audit rows containing missing or null data in specific columns',
      sql: `SELECT * FROM active_data WHERE ${activeDataset.columns[2] || activeDataset.columns[0]} IS NULL`,
    },
    {
      name: 'Cohort Threshold Filter',
      description: 'Filter records matching custom numeric criteria',
      sql: activeDataset.columns.includes('monthly_spend')
        ? `SELECT customer_id, plan_tier, monthly_spend, churned FROM active_data WHERE monthly_spend > 200 ORDER BY monthly_spend DESC LIMIT 20`
        : `SELECT * FROM active_data LIMIT 25`,
    },
    {
      name: 'Destructive Test (Guardrail Trigger)',
      description: 'Demonstrates non-negotiable destructive command interception',
      sql: `DROP TABLE active_data;`,
    },
  ];

  const handleRunSQL = (authorized: boolean = false) => {
    const res = executeSQL(query, tables, authorized);
    if (res.isDestructiveAttempt && !authorized) {
      setPendingDestructiveCommand(res.error?.match(/"(.*?)"/)?.[1] || 'DROP');
      setShowDestructiveModal(true);
      return;
    }
    setResult(res);
  };

  const handleAuthorizeDestructive = () => {
    setShowDestructiveModal(false);
    handleRunSQL(true);
  };

  const handleSaveAsNewDataset = () => {
    if (!result || result.rows.length === 0) return;
    const profile = profileDataset(result.rows);
    const newDs: Dataset = {
      id: `sql_result_${Date.now()}`,
      name: `SQL View (${result.rows.length} rows)`,
      version: 1,
      isImmutableSource: false,
      sourceType: 'sql_result',
      sha256Hash: `sql_${Date.now().toString(16)}`,
      createdAt: new Date().toISOString(),
      data: result.rows,
      profile,
      columns: result.columns,
    };
    onSaveAsDataset(newDs);
    alert('SQL query result saved as a new versioned dataset table!');
  };

  const handleExportCSV = () => {
    if (!result || result.rows.length === 0) return;
    const csv = exportToCSV(result.rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sql_query_result_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
              WF06
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              In-Browser SQL Query Engine & Safe Transformation Console
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            In-Browser SQL Query Engine. Execute safe relational projections, cohort groupings, and aggregations.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
              SUPPORTED: SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, COUNT, SUM, AVG, MIN, MAX
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
              PLANNED: DuckDB-WASM (JOINs, CTEs, Window Functions)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 font-semibold">
              INTERCEPTED: DROP, TRUNCATE, ALTER, DELETE (Guardrail Blocked)
            </span>
          </div>
        </div>

        <button
          onClick={onGoToML}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition self-start lg:self-auto"
        >
          <span>Proceed to WF07 ML & Forecasting</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Table Schema & Templates Browser */}
        <div className="lg:col-span-1 space-y-4">
          {/* Tables catalog */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Available Tables</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-cyan-300 font-bold mb-1">
                  <span>active_data</span>
                  <span className="text-[10px] text-slate-500">{activeDataset.data.length} rows</span>
                </div>
                <div className="text-[10px] text-slate-400 max-h-24 overflow-y-auto space-y-0.5">
                  {activeDataset.columns.map((c) => (
                    <div key={c} className="truncate">• {c}</div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
                  <span>raw_data</span>
                  <span className="text-[10px] text-slate-500">{rawDataset.data.length} rows</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Immutable source partition</span>
              </div>
            </div>
          </div>

          {/* Query Templates */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Query Templates</span>
            </div>

            <div className="space-y-2">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={() => setQuery(tmpl.sql)}
                  className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs transition"
                >
                  <span className="font-semibold text-slate-200 block text-[11px]">{tmpl.name}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{tmpl.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: SQL Editor & Result Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white font-mono">SQL Console</span>
              </div>
              <button
                onClick={() => handleRunSQL(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm shadow-emerald-600/30 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Query</span>
              </button>
            </div>

            <div className="p-3 bg-slate-950">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className="w-full bg-transparent font-mono text-xs text-cyan-300 focus:outline-none resize-none leading-relaxed"
                placeholder="Enter SQL statement (e.g. SELECT * FROM active_data WHERE ...)"
              />
            </div>
          </div>

          {/* Results Area */}
          {result && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-3 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-white">Execution Result</span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    <Clock className="w-3 h-3 text-cyan-400" /> {result.executionTimeMs} ms
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {result.rowCount} rows returned
                  </span>
                </div>

                {result.rowCount > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveAsNewDataset}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Save As Table</span>
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg transition"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                )}
              </div>

              {result.error ? (
                <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-mono">
                  {result.error}
                </div>
              ) : result.rows.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Query returned 0 records.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="px-3.5 py-2 text-slate-600">#</th>
                        {result.columns.map((c) => (
                          <th key={c} className="px-3.5 py-2 text-slate-300 whitespace-nowrap">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {result.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/50">
                          <td className="px-3.5 py-1.5 text-slate-600">{idx + 1}</td>
                          {result.columns.map((c) => (
                            <td key={c} className="px-3.5 py-1.5 text-slate-200 whitespace-nowrap">
                              {String(row[c] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Destructive Guardrail Modal */}
      <ModalDestructiveSQL
        isOpen={showDestructiveModal}
        commandName={pendingDestructiveCommand}
        query={query}
        onAuthorize={handleAuthorizeDestructive}
        onCancel={() => setShowDestructiveModal(false)}
      />
    </div>
  );
};
