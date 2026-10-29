import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Brain,
  Activity,
  Zap,
  Play,
  RotateCcw,
  FileCode,
  Download,
  Info,
  Layers,
  ChevronRight,
  Server,
} from 'lucide-react';

export interface LineageNode {
  id: string;
  name: string;
  code: string;
  stepNumber: number;
  type: 'ingest' | 'quality' | 'ledger' | 'brain';
  status: 'nominal' | 'active' | 'warning' | 'error';
  latencyMs: number;
  throughput: string;
  details: {
    description: string;
    schemaFields: string[];
    metrics: Record<string, string | number>;
    transformRules: string[];
  };
}

const DEFAULT_NODES: LineageNode[] = [
  {
    id: 'node-ingest',
    name: 'Ingestion Hub',
    code: 'WF01',
    stepNumber: 1,
    type: 'ingest',
    status: 'nominal',
    latencyMs: 1.8,
    throughput: '1,048,576 rows/s',
    details: {
      description: 'Zero-copy streaming ingestion with automatic schema inference and type coercion.',
      schemaFields: ['timestamp', 'vehicle_id', 'battery_temp_c', 'voltage_mv', 'soc_pct', 'motor_rpm', 'inverter_kw'],
      metrics: {
        'Engine Speed': '1.02M rps',
        'Buffer Status': 'Zero-Copy Ring',
        'Auto Schema': '14 Typed Columns',
        'Format': 'Parquet / Arrow',
      },
      transformRules: [
        'Snappy decompress in-memory',
        'ISO-8601 epoch timestamp normalization',
        'Float64 precision scaling for telemetry channels',
      ],
    },
  },
  {
    id: 'node-quality',
    name: 'Quality Engine',
    code: 'WF02',
    stepNumber: 2,
    type: 'quality',
    status: 'nominal',
    latencyMs: 3.4,
    throughput: '980,200 rows/s',
    details: {
      description: 'Continuous statistical assertion engine evaluating null rates, duplicate keys, and PSI drift.',
      schemaFields: ['null_rate_score', 'duplicate_count', 'psi_drift_value', 'range_validity'],
      metrics: {
        'Null Rate': '0.00% (PASS)',
        'Duplicates': '0 Detected (PASS)',
        'Drift PSI': '0.0142 (NOMINAL)',
        'Pill Status': 'All Green',
      },
      transformRules: [
        'Z-score outlier bound filter (sigma = 3.5)',
        'Unique composite hash deduplication',
        'Wasserstein distance drift window calculation',
      ],
    },
  },
  {
    id: 'node-ledger',
    name: 'SHA-256 Ledger',
    code: 'WF03',
    stepNumber: 3,
    type: 'ledger',
    status: 'nominal',
    latencyMs: 0.9,
    throughput: '1.20M hashes/s',
    details: {
      description: 'Immutable cryptographic ledger chaining datasets with SHA-256 hashing and Merkle roots.',
      schemaFields: ['block_height', 'previous_hash', 'current_hash', 'merkle_root', 'timestamp'],
      metrics: {
        'Active Hash': 'e3b0c44298fc1c149afbf4c8996fb924',
        'Block Height': '#4,192',
        'Tamper Proof': 'Verified Hardware Root',
        'Air-Gap Seal': '100% Deterministic',
      },
      transformRules: [
        'Canonical JSON serialization',
        'SHA-256 digest computation',
        'Append-only cryptographic state chain verification',
      ],
    },
  },
  {
    id: 'node-brain',
    name: 'Cognitive Brain',
    code: 'WF05-11',
    stepNumber: 4,
    type: 'brain',
    status: 'nominal',
    latencyMs: 5.3,
    throughput: 'High-Density Inference',
    details: {
      description: 'Watchtower drift analytics, causal graph attribution, anomaly isolation, and 3D manifold embeddings.',
      schemaFields: ['causal_weights', 'anomaly_vector', 'pca_eigen_1', 'pca_eigen_2', 'manifold_umap'],
      metrics: {
        'Drift Watchtower': 'WF05 Active',
        'Anomaly Pulse': 'WF06 Nominal (0.01)',
        'Causal DAG': 'WF10 12 Edges',
        '3D Manifold': 'WF11 Real-Time Projected',
      },
      transformRules: [
        'Graph Laplacian causal decomposition',
        'Isolation Forest anomaly boundary calculation',
        'UMAP / t-SNE 3D dimensional projection',
      ],
    },
  },
];

export const WF04LineageGraph: React.FC = () => {
  const [nodes, setNodes] = useState<LineageNode[]>(DEFAULT_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-ingest');
  const [isSimulatingRun, setIsSimulatingRun] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [pulseCount, setPulseCount] = useState<number>(1420);

  // Trigger simulated data pipeline packet traversing from Ingest -> Quality -> Ledger -> Brain
  const runPipelineSimulation = () => {
    if (isSimulatingRun) return;
    setIsSimulatingRun(true);
    setActiveStep(1);

    const stepInterval = 650;
    setTimeout(() => setActiveStep(2), stepInterval);
    setTimeout(() => setActiveStep(3), stepInterval * 2);
    setTimeout(() => setActiveStep(4), stepInterval * 3);
    setTimeout(() => {
      setActiveStep(-1);
      setIsSimulatingRun(false);
      setPulseCount((prev) => prev + 1);
    }, stepInterval * 4);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              WF04 · LINEAGE GRAPH
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              DIRECTED ACYCLIC GRAPH (DAG)
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-cyan-400" />
            End-to-End Data Lineage & Provenance Flow
          </h2>
          <p className="text-xs text-slate-400">
            Cryptographically sealed provenance chain tracing records from Ingestion through Quality assertions, SHA-256 Ledger, to Brain inference.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={runPipelineSimulation}
            disabled={isSimulatingRun}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              isSimulatingRun
                ? 'bg-cyan-600/50 text-cyan-200 border border-cyan-400/50 animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isSimulatingRun ? 'animate-spin' : ''}`} />
            {isSimulatingRun ? `Traversing Step ${activeStep}/4...` : 'Pulse Pipeline Data Run'}
          </button>

          <button
            onClick={() => {
              const exportJson = JSON.stringify(nodes, null, 2);
              const blob = new Blob([exportJson], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `omni_lineage_dag_${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Export Lineage DAG Manifest"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export DAG</span>
          </button>
        </div>
      </div>

      {/* Visual DAG Node Flow Canvas */}
      <div className="relative bg-slate-950/90 rounded-2xl border border-slate-800/80 p-6 overflow-hidden">
        {/* Background Grid Accent */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #06b6d4 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Global Pipeline Metrics Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nodes: <strong className="text-white">4 Stages</strong></span>
            </span>
            <span>·</span>
            <span>Lineage Path: <strong className="text-cyan-400">Ingest → Quality → Ledger → Brain</strong></span>
            <span>·</span>
            <span>Processed Packets: <strong className="text-emerald-400">{pulseCount.toLocaleString()}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 text-[11px] font-bold">
              ZERO AIR-GAP BREAKAGE
            </span>
          </div>
        </div>

        {/* 4 Interactive Nodes in Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {nodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            const isStepActive = activeStep === node.stepNumber;

            return (
              <div key={node.id} className="relative flex flex-col">
                {/* Arrow Connector on Desktop */}
                {index < nodes.length - 1 && (
                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 text-slate-600 pointer-events-none">
                    <div
                      className={`p-1 rounded-full border transition-all ${
                        activeStep === node.stepNumber
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/50 scale-125'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}

                {/* Node Card */}
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`text-left w-full rounded-xl p-4 transition-all cursor-pointer border relative overflow-hidden flex flex-col justify-between h-full min-h-[175px] ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/40'
                      : isStepActive
                      ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/50 scale-102'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      isStepActive
                        ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                        : isSelected
                        ? 'bg-cyan-500'
                        : 'bg-slate-700'
                    }`}
                  />

                  {/* Top Bar: Step & Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {node.code}
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase">
                          Stage 0{node.stepNumber}
                        </div>
                        <div className="text-sm font-bold text-white leading-tight">
                          {node.name}
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-800/80 text-emerald-400">
                      {node.type === 'ingest' && <Database className="w-4 h-4 text-cyan-400" />}
                      {node.type === 'quality' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {node.type === 'ledger' && <ShieldCheck className="w-4 h-4 text-indigo-400" />}
                      {node.type === 'brain' && <Brain className="w-4 h-4 text-purple-400" />}
                    </div>
                  </div>

                  {/* Middle: Throughput & Latency */}
                  <div className="mt-3 space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Throughput:</span>
                      <span className="text-slate-200 font-semibold">{node.throughput}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Execution:</span>
                      <span className="text-cyan-400 font-semibold">{node.latencyMs} ms</span>
                    </div>
                  </div>

                  {/* Bottom: Status Pill */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">STATUS:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {node.status}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Node Inspector Pane */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Node Inspector: {selectedNode.name} ({selectedNode.code})
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  STAGE 0{selectedNode.stepNumber} OF 04
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedNode.details.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Execution Latency:</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
              {selectedNode.latencyMs} ms
            </span>
          </div>
        </div>

        {/* 3 Columns: Real-Time Metrics, Schema Attributes, Transformation Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Column 1: Live Metrics */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Node State Telemetry
            </div>
            <div className="space-y-1.5 pt-1">
              {Object.entries(selectedNode.details.metrics).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                  <span className="text-slate-400">{key}:</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[170px]" title={String(val)}>
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Passed Schema Fields */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Schema Contract Fields
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedNode.details.schemaFields.map((field) => (
                <span
                  key={field}
                  className="px-2 py-1 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80 text-[11px]"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>

          {/* Column 3: Transformation Rules */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Pipeline Execution Rules
            </div>
            <ul className="space-y-1.5 pt-1 text-slate-300">
              {selectedNode.details.transformRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">›</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WF04LineageGraph;
