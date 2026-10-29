import React, { useState, useEffect } from 'react';
import { BrainComponentState, CausalNode, CausalEdge } from './types';
import {
  GitMerge,
  Activity,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface WF10CausalGraphProps {
  forcedState?: BrainComponentState;
  onStateChange?: (state: BrainComponentState) => void;
}

const INITIAL_NODES: CausalNode[] = [
  { id: 'T', label: 'Treatment: Algorithm Tier (X)', type: 'treatment', x: 80, y: 150, baseValue: 2.0 },
  { id: 'M1', label: 'Mediator: Compute Quota (M)', type: 'mediator', x: 280, y: 90, baseValue: 64.0 },
  { id: 'M2', label: 'Mediator: Cache Hit Rate (H)', type: 'mediator', x: 280, y: 210, baseValue: 92.5 },
  { id: 'Y', label: 'Outcome: System Latency (Y)', type: 'outcome', x: 480, y: 150, baseValue: 42.0 },
  { id: 'Z', label: 'Confounder: Regional Load (Z)', type: 'confounder', x: 280, y: 20, baseValue: 120.0 },
];

const INITIAL_EDGES: CausalEdge[] = [
  { from: 'T', to: 'M1', weight: 0.72, pValue: 0.001, isConfounded: false },
  { from: 'T', to: 'M2', weight: 0.58, pValue: 0.004, isConfounded: false },
  { from: 'M1', to: 'Y', weight: -0.65, pValue: 0.002, isConfounded: false },
  { from: 'M2', to: 'Y', weight: -0.48, pValue: 0.012, isConfounded: false },
  { from: 'Z', to: 'T', weight: 0.35, pValue: 0.024, isConfounded: false },
  { from: 'Z', to: 'Y', weight: 0.44, pValue: 0.015, isConfounded: false },
];

export const WF10CausalGraph: React.FC<WF10CausalGraphProps> = ({
  forcedState,
  onStateChange,
}) => {
  const [componentState, setComponentState] = useState<BrainComponentState>(forcedState || 'idle');
  const [nodes, setNodes] = useState<CausalNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<CausalEdge[]>(INITIAL_EDGES);
  const [treatmentVal, setTreatmentVal] = useState<number>(3.0);
  const [selectedNode, setSelectedNode] = useState<string>('T');
  const [simulatedOutcome, setSimulatedOutcome] = useState<number>(34.2);
  const [ateValue, setAteValue] = useState<number>(-7.8);
  const [confounderActive, setConfounderActive] = useState<boolean>(false);
  const [pulseBeat, setPulseBeat] = useState<boolean>(false);

  useEffect(() => {
    if (forcedState) {
      setComponentState(forcedState);
    }
  }, [forcedState]);

  useEffect(() => {
    let timer: any;
    if (componentState === 'analyzing') {
      timer = setInterval(() => {
        setPulseBeat((p) => !p);
      }, 450);
    } else {
      setPulseBeat(false);
    }
    return () => clearInterval(timer);
  }, [componentState]);

  const updateState = (newState: BrainComponentState) => {
    setComponentState(newState);
    onStateChange?.(newState);
  };

  const handleRunInference = () => {
    updateState('analyzing');
    setTimeout(() => {
      // Pearl intervention calculation
      const calculated = 42.0 - treatmentVal * 2.6;
      setSimulatedOutcome(Number(calculated.toFixed(2)));
      setAteValue(Number((-2.6 * (treatmentVal - 1)).toFixed(2)));
      updateState('idle');
    }, 1500);
  };

  const handleInjectConfounder = () => {
    updateState('analyzing');
    setTimeout(() => {
      setConfounderActive(true);
      // Add dangerous unblocked backdoor edge
      const updatedEdges = edges.map((e) => {
        if (e.from === 'Z' && e.to === 'Y') {
          return { ...e, weight: 1.85, isConfounded: true };
        }
        return e;
      });
      setEdges([
        ...updatedEdges,
        { from: 'U_Unobserved', to: 'T', weight: 0.92, pValue: 0.0001, isConfounded: true },
        { from: 'U_Unobserved', to: 'Y', weight: 0.88, pValue: 0.0002, isConfounded: true },
      ]);
      setNodes([
        ...nodes,
        {
          id: 'U_Unobserved',
          label: 'Unobserved Selection Bias (U)',
          type: 'confounder',
          x: 280,
          y: 280,
          baseValue: 99.0,
        },
      ]);
      updateState('alert');
    }, 1200);
  };

  const handleReset = () => {
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    setConfounderActive(false);
    setTreatmentVal(2.0);
    setSimulatedOutcome(34.2);
    setAteValue(-7.8);
    updateState('idle');
  };

  const isAlertState = componentState === 'alert';
  const isAnalyzing = componentState === 'analyzing';

  return (
    <div
      className={`rounded-2xl transition-all duration-500 border ${
        isAlertState
          ? 'bg-rose-950/20 border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/60'
          : isAnalyzing
          ? 'bg-slate-900/90 border-indigo-500/70 shadow-[0_0_25px_rgba(99,102,241,0.25)]'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      } p-6`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl transition-colors ${
                isAlertState
                  ? 'bg-rose-500/20 text-rose-400'
                  : isAnalyzing
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-indigo-400">
                  WF10 • Causal Reasoning
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                    isAlertState
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 animate-pulse'
                      : isAnalyzing
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {componentState.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Causal Graph & Counterfactuals</h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pearl Structural Causal Model (SCM), do-calculus intervention simulator & backdoor criteria.
          </p>
        </div>

        {/* State Badge & Actions */}
        <div className="flex items-center gap-3">
          {isAnalyzing && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs font-mono transition-transform ${
                pulseBeat ? 'scale-105' : 'scale-100'
              }`}
            >
              <Activity className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>EVALUATING DO-CALCULUS</span>
            </div>
          )}

          {isAlertState && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-mono animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>CONFOUNDING VIOLATION (UNBLOCKED BACKDOOR)</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRunInference}
              disabled={isAnalyzing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Run Causal Inference"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400" />
              <span>Infer</span>
            </button>
            <button
              onClick={handleInjectConfounder}
              disabled={isAnalyzing || confounderActive}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800 transition"
              title="Inject unobserved confounder"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Inject Bias</span>
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Reset Causal DAG"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: SVG DAG + Intervention Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Interactive SVG DAG (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Structural Equation Model (DAG Representation)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {nodes.length} Nodes • {edges.length} Causal Edges
            </span>
          </div>

          <div className="relative w-full h-72 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800/60">
            <svg className="w-full h-full" viewBox="0 0 580 320">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker id="arrow-confounded" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                </marker>
              </defs>

              {/* Draw Edges */}
              {edges.map((edge, idx) => {
                const source = nodes.find((n) => n.id === edge.from);
                const target = nodes.find((n) => n.id === edge.to);
                if (!source || !target) return null;

                const isConf = edge.isConfounded;
                return (
                  <g key={`edge-${idx}`}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isConf ? '#f43f5e' : isAnalyzing ? '#818cf8' : '#475569'}
                      strokeWidth={isConf ? 2.5 : 1.5}
                      strokeDasharray={isConf ? '4 4' : undefined}
                      markerEnd={isConf ? 'url(#arrow-confounded)' : 'url(#arrow)'}
                      className={isAnalyzing ? 'animate-pulse' : undefined}
                    />
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2 - 4}
                      fill={isConf ? '#f43f5e' : '#94a3b8'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      β={edge.weight}
                    </text>
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode === node.id;
                const isConfounderNode = node.type === 'confounder';
                const isTreatment = node.type === 'treatment';
                const isOutcome = node.type === 'outcome';

                let fillBg = '#1e293b';
                let strokeColor = '#475569';
                if (isConfounderNode) {
                  fillBg = isAlertState ? '#881337' : '#334155';
                  strokeColor = isAlertState ? '#f43f5e' : '#64748b';
                } else if (isTreatment) {
                  fillBg = '#1e1b4b';
                  strokeColor = '#6366f1';
                } else if (isOutcome) {
                  fillBg = '#064e3b';
                  strokeColor = '#10b981';
                }

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? 18 : 15}
                      fill={fillBg}
                      stroke={isSelected ? '#38bdf8' : strokeColor}
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {node.id}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 28}
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontSize="9"
                      fontFamily="sans-serif"
                    >
                      {node.label.split(':')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Counterfactual Intervention Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Pearl Intervention [do(X)]</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-800">
                ATE: {ateValue} ms
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Set Intervention Treatment:</span>
                <span className="font-mono font-bold text-white">Tier {treatmentVal.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={treatmentVal}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTreatmentVal(val);
                  setSimulatedOutcome(Number((42.0 - val * 2.6).toFixed(2)));
                  setAteValue(Number((-2.6 * (val - 1)).toFixed(2)));
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Tier 1 (Base)</span>
                <span>Tier 3 (Accelerated)</span>
                <span>Tier 5 (Ultra)</span>
              </div>
            </div>

            {/* Counterfactual Result Card */}
            <div
              className={`p-3.5 rounded-xl border ${
                isAlertState
                  ? 'bg-rose-950/50 border-rose-700 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1">
                {isAlertState ? 'Bias Notice' : 'Estimated Counterfactual'}
              </div>
              <div className="text-xl font-bold font-mono">
                E[Y | do(X={treatmentVal})] = {simulatedOutcome} ms
              </div>
              <p className="text-xs mt-1 text-slate-400">
                {isAlertState
                  ? 'Warning: Unobserved confounder introduces backdoor distortion. Average treatment effect is biased by ±34%.'
                  : 'Backdoor criteria satisfied via adjustment set {Z}. Causal effect estimate is unbiased.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Selected Node:</span>
            <span className="text-slate-300 font-bold">{selectedNode}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
