import React, { useState } from 'react';
import {
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { PipelineNode, PipelineRunRecord } from '../../types';

interface WF10Props {
  nodes: PipelineNode[];
  runHistory: PipelineRunRecord[];
  onTriggerRun: () => void;
  isRunning: boolean;
  onRetryStep: (stepId: string) => void;
}

export const WF10Orchestration: React.FC<WF10Props> = ({
  nodes,
  runHistory,
  onTriggerRun,
  isRunning,
  onRetryStep,
}) => {
  // Cron state
  const [cronExpression, setCronExpression] = useState<string>('0 8 * * 1');
  const [scheduleActive, setScheduleActive] = useState<boolean>(true);
  const [cronSaved, setCronSaved] = useState<boolean>(false);
  const [selectedLogNode, setSelectedLogNode] = useState<PipelineNode | null>(nodes[0] || null);

  const handleSaveCron = () => {
    setCronSaved(true);
    setTimeout(() => setCronSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
              WF10
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
              SIMULATED EXECUTION
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Orchestration, Execution Monitoring & Scheduled Automation
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Directed acyclic graph (DAG) pipeline automation, failure recovery retries, live execution logs, and cron cadence scheduling.
          </p>
        </div>

        <button
          onClick={onTriggerRun}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition ${
            isRunning
              ? 'bg-indigo-700/50 text-indigo-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Executing Pipeline DAG (Simulated)...' : 'Trigger Pipeline Run (Simulated)'}</span>
        </button>
      </div>

      {/* Visual DAG Pipeline Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Pipeline Directed Acyclic Graph (DAG)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {nodes.filter((n) => n.status === 'completed').length} of {nodes.length} nodes verified
          </span>
        </div>

        {/* Node Flow Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {nodes.map((node, index) => {
            const isCompleted = node.status === 'completed';
            const isNodeRunning = node.status === 'running';
            const isWarning = node.status === 'warning';
            const isFailed = node.status === 'failed';
            const isSelected = selectedLogNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedLogNode(node)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-indigo-500 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {node.code}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isNodeRunning
                          ? 'bg-cyan-400 animate-ping'
                          : isCompleted
                          ? 'bg-emerald-400'
                          : isWarning
                          ? 'bg-amber-400'
                          : isFailed
                          ? 'bg-rose-400'
                          : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{node.title}</h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{node.durationMs ? `${node.durationMs}ms` : 'idle'}</span>
                  {isFailed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetryStep(node.id);
                      }}
                      className="text-cyan-400 hover:underline flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Retry
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split: Logs Viewer & Scheduled Automation Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Log Inspector */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Execution Logs: {selectedLogNode?.code} - {selectedLogNode?.title}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Status: <span className="uppercase text-cyan-400">{selectedLogNode?.status}</span>
            </span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 min-h-[180px] max-h-56 overflow-y-auto space-y-1">
            {selectedLogNode && selectedLogNode.logMessages.length > 0 ? (
              selectedLogNode.logMessages.map((msg, i) => (
                <div key={i} className="text-slate-300 leading-relaxed">
                  <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {msg}
                </div>
              ))
            ) : (
              <div className="text-slate-600">No runtime logs recorded for this node yet.</div>
            )}
          </div>
        </div>

        {/* Cron Schedule Config */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Scheduled Automation</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
              SCHEDULE SAVED ONLY (NO SCHEDULER RUNNING)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Standard 5-Field Cron Expression</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                placeholder="0 8 * * 1"
              />
              <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                `0 8 * * 1` = Every Monday at 08:00 UTC
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cadence Presets</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setCronExpression('0 */6 * * *')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] text-left truncate"
                >
                  Every 6 Hours
                </button>
                <button
                  onClick={() => setCronExpression('0 0 * * *')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] text-left truncate"
                >
                  Daily at Midnight
                </button>
                <button
                  onClick={() => setCronExpression('0 8 * * 1')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] text-left truncate"
                >
                  Weekly Monday
                </button>
                <button
                  onClick={() => setCronExpression('*/30 * * * *')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] text-left truncate"
                >
                  Every 30 Minutes
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-slate-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleActive}
                  onChange={(e) => setScheduleActive(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                <span>Enable Cron Schedule</span>
              </label>

              <button
                onClick={handleSaveCron}
                className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1"
              >
                {cronSaved ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                <span>{cronSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Pipeline Execution Run Records */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Pipeline Execution History</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {runHistory.length} orchestrations recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Run ID</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Nodes Executed</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Started At</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {runHistory.map((run) => (
                <tr key={run.runId} className="hover:bg-slate-850/50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-200">
                    {run.runId}
                  </td>
                  <td className="px-4 py-3 uppercase text-[10px] text-slate-400 font-mono">
                    {run.trigger}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {run.nodesExecuted} nodes
                  </td>
                  <td className="px-4 py-3 font-mono text-cyan-400">
                    {run.durationMs} ms
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(run.startedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        run.status === 'success'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
