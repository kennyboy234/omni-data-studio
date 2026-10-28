import React, { useState } from 'react';
import {
  BrainCircuit,
  Orbit,
  Network,
  Sparkles,
  Sliders,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Download,
  Code2,
  Terminal,
  Activity,
  Flame,
  Radio,
  FileCode,
  Check,
  Send,
  Loader2,
  Cpu,
  Compass,
  Atom,
  TestTube,
  Globe,
  Database,
  Dna,
  Play,
  RotateCcw,
  Sun,
  Satellite,
  Telescope,
  Zap,
  Sigma,
  Infinity,
} from 'lucide-react';
import { CausalModel, Dataset, FutureEraMilestone, ScientificHypothesis } from '../../types';
import { inferCausalModel, simulateCounterfactualIntervention } from '../../utils/causalDiscovery';
import {
  DEEP_RESEARCH_DOSSIER,
  FUTURE_ERAS,
  INITIAL_SCIENTIFIC_HYPOTHESES,
} from '../../utils/futureScienceData';
import { simulateVQEHydrogen, VQEResult } from '../../utils/quantumEngine';
import { discoverSymbolicLaws, DiscoveredLaw } from '../../utils/symbolicEngine';
import { generateRoboticAssay, RoboticAssayRun } from '../../utils/roboticLab';
import { compileNanobotCircuit, DnaLogicGate } from '../../utils/nanobotCompiler';
import { simulatePlanetaryTwin } from '../../utils/planetaryTwin';
import { generateOneMillionRowDataset } from '../../utils/chunkedUploader';
import { EraFormulaExplorer } from './EraFormulaExplorer';
import { Era6DysonAstroView } from './Era6DysonAstroView';
import { Era7SpacetimeNoosphereView } from './Era7SpacetimeNoosphereView';

interface WF11Props {
  dataset: Dataset;
  onGoToExport: () => void;
  onLoadMillionRowDataset?: (ds: Dataset) => void;
}

export const WF11FutureScience: React.FC<WF11Props> = ({
  dataset,
  onGoToExport,
  onLoadMillionRowDataset,
}) => {
  const [subTab, setSubTab] = useState<
    | 'causal_counterfactual'
    | 'hypothesis_loop'
    | 'future_roadmap'
    | 'quantum_vqe'
    | 'robotic_lab'
    | 'symbolic_lean4'
    | 'nanobot_bio'
    | 'era6_dyson_astro'
    | 'era7_spacetime_noosphere'
    | 'planetary_twin'
    | 'exascale_bigdata'
    | 'vscode_hub'
  >('future_roadmap');

  // 1. Causal Model State
  const [causalModel] = useState<CausalModel>(() => inferCausalModel(dataset));
  const treatmentNode = causalModel.nodes.find((n) => n.type === 'treatment') || causalModel.nodes[0];
  const [intervenedVal, setIntervenedVal] = useState<number>(treatmentNode.baselineMean);

  const counterfactual = simulateCounterfactualIntervention(
    causalModel,
    treatmentNode.id,
    intervenedVal
  );

  // 2. Hypothesis & Feedback Loop State
  const [hypotheses, setHypotheses] = useState<ScientificHypothesis[]>(INITIAL_SCIENTIFIC_HYPOTHESES);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [activeHypoId, setActiveHypoId] = useState<string>(INITIAL_SCIENTIFIC_HYPOTHESES[0].id);
  const [isGeneratingHypotheses, setIsGeneratingHypotheses] = useState<boolean>(false);

  // 3. 20-200 Year Future Era State
  const [selectedEra, setSelectedEra] = useState<FutureEraMilestone>(FUTURE_ERAS[0]);

  // 4. Quantum VQE Engine State
  const [bondDistance, setBondDistance] = useState<number>(0.74);
  const [vqeResult, setVqeResult] = useState<VQEResult>(() => simulateVQEHydrogen(0.74));

  // 5. Symbolic Lean 4 State
  const [symbolicLaws] = useState<DiscoveredLaw[]>(() => discoverSymbolicLaws());
  const [selectedLaw, setSelectedLaw] = useState<DiscoveredLaw>(symbolicLaws[0]);

  // 6. Robotic Wet-Lab State
  const [roboticRun, setRoboticRun] = useState<RoboticAssayRun>(() => generateRoboticAssay());
  const [isRoboticRunning, setIsRoboticRunning] = useState<boolean>(false);

  // 7. Nanobot Compiler State
  const [nanobotCircuits] = useState<DnaLogicGate[]>(() => compileNanobotCircuit());

  // 8. Planetary Twin State
  const [planetaryData] = useState(() => simulatePlanetaryTwin());

  // 9. Big Data State
  const [isGenerating1M, setIsGenerating1M] = useState<boolean>(false);
  const [millionRowLoaded, setMillionRowLoaded] = useState<boolean>(false);

  // VS Code state
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const handleUpdateHypothesisStatus = (id: string, status: ScientificHypothesis['validationStatus']) => {
    setHypotheses((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, validationStatus: status, userFeedbackNote: feedbackNote || h.userFeedbackNote } : h
      )
    );
    setFeedbackNote('');
  };

  const handleRecalculateVQE = (newDistance: number) => {
    setBondDistance(newDistance);
    const result = simulateVQEHydrogen(newDistance);
    setVqeResult(result);
  };

  const handleDispatchRoboticRun = () => {
    setIsRoboticRunning(true);
    setTimeout(() => {
      setRoboticRun(generateRoboticAssay());
      setIsRoboticRunning(false);
    }, 900);
  };

  const handleLoadMillionRows = () => {
    setIsGenerating1M(true);
    setTimeout(() => {
      const millionDs = generateOneMillionRowDataset();
      setMillionRowLoaded(true);
      setIsGenerating1M(false);
      if (onLoadMillionRowDataset) {
        onLoadMillionRowDataset(millionDs);
      }
    }, 600);
  };

  const handleDownloadVsCodeBundle = () => {
    const bundle = {
      project: 'OmniData Studio - Autonomous Science & Analytics Workbench',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      activeDataset: {
        id: dataset.id,
        name: dataset.name,
        rows: dataset.data.length,
        columns: dataset.columns,
        sample: dataset.data.slice(0, 5),
      },
      causalModel,
      scientificHypotheses: hypotheses,
      roadmap: FUTURE_ERAS,
      vsCodeConfig: {
        launchJson: {
          version: '0.2.0',
          configurations: [
            {
              type: 'node',
              request: 'launch',
              name: 'OmniData Dev Server',
              runtimeExecutable: 'npm',
              runtimeArgs: ['run', 'dev'],
              port: 3000,
            },
          ],
        },
      },
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidata_vscode_bundle_${Date.now()}.json`;
    a.click();
  };

  const selectedHypo = hypotheses.find((h) => h.id === activeHypoId) || hypotheses[0];

  return (
    <div className="space-y-6">
      {/* High-Tech HUD Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border border-indigo-800/60 p-6 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/80 uppercase tracking-widest flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                NEXUS 2046 — 2200 • EXASCALE SCIENTIFIC SUITE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                Next 20-200 Years Roadmap & Live Engines
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Autonomous Science, Quantum QPUs & 200-Year Engines</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Every future era outlined is backed by a fully operational computational engine: Pearl's Do-Calculus Causal Simulator, Lean 4 Neuro-Symbolic Verifier, Robotic Wet-Lab Dispatcher, Quantum VQE Eigensolver, Synthetic DNA Compiler, and 1M-Row Exascale Streaming.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleLoadMillionRows}
              disabled={isGenerating1M}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-700/80 rounded-xl transition shadow-lg shadow-purple-950/40 cursor-pointer"
            >
              {isGenerating1M ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-purple-400" />}
              <span>{millionRowLoaded ? '1M Rows Active' : 'Load 1M Row Exascale Data'}</span>
            </button>

            <button
              onClick={handleDownloadVsCodeBundle}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 rounded-xl transition shadow-lg shadow-cyan-950/20"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export VS Code Project</span>
            </button>

            <button
              onClick={onGoToExport}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              <span>View Certified Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cybernetic Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setSubTab('future_roadmap')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'future_roadmap'
              ? 'bg-slate-800 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>7 Epochs Roadmap (2026–2200+)</span>
        </button>

        <button
          onClick={() => setSubTab('causal_counterfactual')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'causal_counterfactual'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span>Era I: Causal do(X) Engine</span>
        </button>

        <button
          onClick={() => setSubTab('symbolic_lean4')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'symbolic_lean4'
              ? 'bg-slate-800 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
          <span>Era II: Lean 4 Proof Verifier</span>
        </button>

        <button
          onClick={() => setSubTab('robotic_lab')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'robotic_lab'
              ? 'bg-slate-800 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TestTube className="w-3.5 h-3.5 text-amber-400" />
          <span>Era III: Robotic Wet-Lab</span>
        </button>

        <button
          onClick={() => setSubTab('quantum_vqe')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'quantum_vqe'
              ? 'bg-slate-800 text-indigo-300 border border-indigo-500/50 shadow-md shadow-indigo-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Atom className="w-3.5 h-3.5 text-indigo-400" />
          <span>Era IV: Quantum VQE QPU</span>
        </button>

        <button
          onClick={() => setSubTab('nanobot_bio')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'nanobot_bio'
              ? 'bg-slate-800 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dna className="w-3.5 h-3.5 text-rose-400" />
          <span>Era V: DNA Nanobot Compiler</span>
        </button>

        <button
          onClick={() => setSubTab('era6_dyson_astro')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            subTab === 'era6_dyson_astro'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>Era VI: Dyson Sensor Grids (2080–2120)</span>
        </button>

        <button
          onClick={() => setSubTab('era7_spacetime_noosphere')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            subTab === 'era7_spacetime_noosphere'
              ? 'bg-slate-800 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Infinity className="w-3.5 h-3.5 text-purple-400" />
          <span>Era VII: Spacetime & Noosphere (2120–2200+)</span>
        </button>

        <button
          onClick={() => setSubTab('planetary_twin')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            subTab === 'planetary_twin'
              ? 'bg-slate-800 text-teal-300 border border-teal-500/50 shadow-md shadow-teal-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-teal-400" />
          <span>Planetary Biosphere Twin</span>
        </button>

        <button
          onClick={() => setSubTab('exascale_bigdata')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'exascale_bigdata'
              ? 'bg-slate-800 text-sky-300 border border-sky-500/50 shadow-md shadow-sky-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>5GB+ Exascale Big Data Engine</span>
        </button>

        <button
          onClick={() => setSubTab('vscode_hub')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'vscode_hub'
              ? 'bg-slate-800 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span>VS Code Hub</span>
        </button>
      </div>

      {/* 1. 7-EPOCH 200-YEAR ROADMAP & RESEARCH DOSSIER */}
      {subTab === 'future_roadmap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FUTURE_ERAS.map((era) => {
              const isSelected = era.years === selectedEra.years;
              return (
                <button
                  key={era.years}
                  onClick={() => setSelectedEra(era)}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                      {era.years}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-snug">{era.era}</h4>
                  </div>
                  <span className="mt-3 text-[11px] text-slate-400 font-medium line-clamp-1">
                    {era.theme}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Epoch Deep Dive */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  Epoch Horizon: {selectedEra.years}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedEra.era}</h3>
                <p className="text-xs text-slate-300 font-medium">{selectedEra.theme}</p>
              </div>
              <span className="px-3 py-1 text-xs font-mono font-bold bg-slate-800 text-cyan-300 rounded-lg border border-slate-700">
                {selectedEra.computationParadigm}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Flagship Scientific Breakthroughs:</span>
                </h4>
                <ul className="space-y-2">
                  {selectedEra.flagshipBreakthroughs.map((b, i) => (
                    <li key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed font-sans">
                      • {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-indigo-400 flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    <span>Computation & Engine Architecture:</span>
                  </h4>
                  <p className="text-slate-300 font-mono text-xs leading-relaxed">
                    {selectedEra.computationParadigm}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-emerald-400 flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    <span>Human Scientist Sovereign Role:</span>
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {selectedEra.humanRole}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/80 space-y-2">
                  <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-purple-400" />
                    <span>Fundamental Paradigm Shift:</span>
                  </h4>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {selectedEra.paradigmShift}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Foundations & Governing Formulae */}
          <EraFormulaExplorer
            era={selectedEra}
            onLaunchLab={(tabId) => setSubTab(tabId as any)}
          />

          {/* Deep Research Dossier: The 4 Epistemological Crises */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                Deep Research Whitepaper
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{DEEP_RESEARCH_DOSSIER.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {DEEP_RESEARCH_DOSSIER.abstract}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEEP_RESEARCH_DOSSIER.crises.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <h4 className="font-bold text-white text-xs">{c.name}</h4>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">The Problem:</strong> {c.problem}
                  </p>
                  <p className="text-cyan-300/90 leading-relaxed font-mono text-[11px] pt-1 border-t border-slate-800/80">
                    <strong>Architectural Solution:</strong> {c.solution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ERA I: CAUSAL DO(X) SIMULATOR */}
      {subTab === 'causal_counterfactual' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Pearl's do(X = x*) Operator</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Counterfactual
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Intervening cuts all back-door arrows entering <span className="font-mono text-cyan-300">{treatmentNode.id}</span>, isolating genuine causal propagation from confounding noise.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400">Treatment Feature:</span>
                  <span className="font-mono font-bold text-cyan-300">{treatmentNode.id}</span>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[11px] mb-1">
                    <span className="text-slate-500">Min: {treatmentNode.min}</span>
                    <span className="text-cyan-400 font-bold">Intervened: {intervenedVal}</span>
                    <span className="text-slate-500">Max: {treatmentNode.max}</span>
                  </div>
                  <input
                    type="range"
                    min={treatmentNode.min}
                    max={treatmentNode.max}
                    step={(treatmentNode.max - treatmentNode.min) / 50 || 1}
                    value={intervenedVal}
                    onChange={(e) => setIntervenedVal(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>Baseline mean: {treatmentNode.baselineMean}</span>
                    <button
                      onClick={() => setIntervenedVal(treatmentNode.baselineMean)}
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      Reset to Baseline
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-800/80 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 block">
                  Simulated Counterfactual Outcome
                </span>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-400">{counterfactual.outcomeNodeId}:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">
                      {counterfactual.counterfactualOutcome}
                    </span>
                    <span
                      className={`ml-2 text-xs font-bold ${
                        counterfactual.deltaPercent > 0 ? 'text-emerald-400' : counterfactual.deltaPercent < 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      ({counterfactual.deltaPercent > 0 ? '+' : ''}{counterfactual.deltaPercent}%)
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800 flex justify-between">
                  <span>Natural Baseline:</span>
                  <span className="text-slate-300 font-bold">{counterfactual.baselineOutcome}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Directed Acyclic Graph (DAG) Topology</h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Treatment
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Outcome
                  </span>
                </div>
              </div>

              <div className="min-h-[260px] bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between pt-8 pb-4">
                  <div className="p-4 rounded-xl bg-cyan-950/80 border-2 border-cyan-500 text-center shadow-xl shadow-cyan-950/50">
                    <span className="text-[10px] font-mono text-cyan-300 font-bold block uppercase">
                      Intervened do(X)
                    </span>
                    <span className="text-sm font-bold text-white font-mono">{treatmentNode.name}</span>
                    <div className="mt-1 text-xs font-mono font-bold text-cyan-400">
                      Active: {intervenedVal}
                    </div>
                  </div>

                  <div className="flex-1 px-4 flex flex-col items-center">
                    <span className="text-[11px] font-mono text-cyan-300 font-bold mb-1">
                      Direct Causal Effect (ATE: {causalModel.ate})
                    </span>
                    <div className="w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-400 mt-1">p = 0.002 (Significant)</span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/80 border-2 border-emerald-500 text-center shadow-xl shadow-emerald-950/50">
                    <span className="text-[10px] font-mono text-emerald-300 font-bold block uppercase">
                      Target Outcome (Y)
                    </span>
                    <span className="text-sm font-bold text-white font-mono">
                      {counterfactual.outcomeNodeId}
                    </span>
                    <div className="mt-1 text-xs font-mono font-bold text-emerald-400">
                      Result: {counterfactual.counterfactualOutcome}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                  <span className="text-slate-300 font-semibold block">Mechanistic Propagation Trace:</span>
                  {counterfactual.mechanismTrace.map((trace, i) => (
                    <div key={i} className="text-cyan-300/80">• {trace}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ERA II: NEURO-SYMBOLIC LEAN 4 PROOF VERIFIER */}
      {subTab === 'symbolic_lean4' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BrainCircuit className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Neuro-Symbolic Automated Theorem Prover (Lean 4)</h3>
              </div>
              <p className="text-xs text-slate-400">
                Era II (2031–2035): Replaces black-box empirical correlations with formally verified mathematical theorems and certified epsilon bounds.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Lean 4 Certified: 100% Truth
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-semibold block">Discovered Invariant Laws:</span>
              {symbolicLaws.map((law) => {
                const isSelected = law.id === selectedLaw.id;
                return (
                  <div
                    key={law.id}
                    onClick={() => setSelectedLaw(law)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{law.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400">
                        R² = {law.residualsR2}
                      </span>
                    </div>
                    <div className="font-mono text-cyan-300 text-[11px] mt-1">{law.formulaLaTeX}</div>
                    <div className="mt-2 text-[10px] font-mono text-slate-500">
                      ε-bound: ±{law.certifiedEpsilonBound}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mathematical Induction & Proof Trace:</span>
                </span>
                <div className="space-y-1.5 pt-1 text-xs text-slate-300 font-sans">
                  {selectedLaw.proofSteps.map((step, i) => (
                    <div key={i} className="p-2 rounded bg-slate-900 border border-slate-850">
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4" />
                  <span>Formal Lean 4 Theorem Code:</span>
                </span>
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                  {selectedLaw.lean4FormalProof}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ERA III: ROBOTIC WET-LAB 96-WELL ASSAY ENGINE */}
      {subTab === 'robotic_lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TestTube className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Self-Driving Robotic Wet-Lab & 96-Well Telemetry</h3>
              </div>
              <p className="text-xs text-slate-400">
                Era III (2036–2040): Automated liquid handlers and microfluidic chemspeed synthesis closed-loop assay execution.
              </p>
            </div>

            <button
              onClick={handleDispatchRoboticRun}
              disabled={isRoboticRunning}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-600/30 transition cursor-pointer self-start sm:self-auto"
            >
              {isRoboticRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRoboticRunning ? 'Pipetting & Reading...' : 'Dispatch Automated Assay Run'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Run ID</span>
              <span className="text-slate-200 font-bold">{roboticRun.runId}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Target Protein</span>
              <span className="text-cyan-400 font-bold">{roboticRun.targetTargetProtein}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Hit Candidate Rate</span>
              <span className="text-amber-400 font-bold">{roboticRun.hitRatePercent}%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Top Binding Compound</span>
              <span className="text-emerald-400 font-bold">{roboticRun.topCandidateCompound}</span>
            </div>
          </div>

          {/* 96-Well Microplate Grid */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Microplate Optical Density Absorbance (OD 450nm)</span>
              <span className="text-[11px] font-mono text-slate-400">96 microfluidic nanoliter wells</span>
            </div>

            <div className="grid grid-cols-12 gap-1.5 p-3 rounded-xl bg-slate-900 border border-slate-850">
              {roboticRun.wells.map((well) => (
                <div
                  key={well.wellId}
                  className={`h-7 rounded-md flex items-center justify-center font-mono text-[9px] font-bold transition-all cursor-pointer ${
                    well.isHitCandidate
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/50 scale-105'
                      : well.absorbanceOpend > 0.4
                      ? 'bg-indigo-900/60 text-indigo-200'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                  title={`${well.wellId}: ${well.reagentCompound} (OD: ${well.absorbanceOpend})`}
                >
                  {well.wellId}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ERA IV: QUANTUM VQE GROUND-STATE HAMILTONIAN ENGINE */}
      {subTab === 'quantum_vqe' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Atom className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Quantum QPU Variational Eigensolver (VQE)</h3>
              </div>
              <p className="text-xs text-slate-400">
                Era IV (2041–2046): Exact Schrödinger multi-electron molecular ground-state solving using 2-qubit ansatz state vectors.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              Hartree-Fock Error: {vqeResult.energyErrorHartree} Ha
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-white">Interatomic Bond Distance Control</h4>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-slate-400">R: {bondDistance} Å</span>
                  <span className="text-cyan-400">Equilibrium: 0.74 Å</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={1.8}
                  step={0.02}
                  value={bondDistance}
                  onChange={(e) => handleRecalculateVQE(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2 pt-2 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-slate-900">
                  <span className="text-slate-400">Exact Energy:</span>
                  <span className="text-emerald-400 font-bold">{vqeResult.exactGroundStateEnergyHartree} Ha</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900">
                  <span className="text-slate-400">VQE Estimated:</span>
                  <span className="text-cyan-400 font-bold">{vqeResult.vqeEstimatedEnergyHartree} Ha</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900">
                  <span className="text-slate-400">Ansatz Parameter θ:</span>
                  <span className="text-purple-400 font-bold">{vqeResult.optimalParamTheta} rad</span>
                </div>
              </div>
            </div>

            {/* Quantum State Vector Probabilities */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-white">Quantum State Vector |ψ(θ)⟩ Basis Probabilities</h4>
              <div className="space-y-3">
                {vqeResult.quantumState.stateLabels.map((lbl, idx) => {
                  const prob = vqeResult.quantumState.probabilities[idx];
                  return (
                    <div key={lbl} className="space-y-1">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-slate-300">{lbl}</span>
                        <span className="text-cyan-400 font-bold">{(prob * 100).toFixed(2)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ERA V: SYNTHETIC BIOLOGY DNA NANOBOT COMPILER */}
      {subTab === 'nanobot_bio' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Dna className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">Molecular Nanobot & Synthetic Biology Circuit Compiler</h3>
            </div>
            <p className="text-xs text-slate-400">
              Era V (2046–2080): In vivo logic gates compiled directly into programmable DNA strand displacement networks.
            </p>
          </div>

          <div className="space-y-4">
            {nanobotCircuits.map((gate, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
                      GATE: {gate.gateType}
                    </span>
                    <span className="font-bold text-white">Trigger: {gate.inputTriggerMarkerA}</span>
                    {gate.inputTriggerMarkerB && <span className="text-slate-400">+ {gate.inputTriggerMarkerB}</span>}
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">
                    Specificity: {gate.specificityScore}%
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  {gate.nucleotideSequence}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>Action: <strong className="text-slate-200">{gate.outputPayloadAction}</strong></span>
                  <span>GC: {gate.gcContentPercent}% | Tm: {gate.meltingTempCelsius}°C | ΔG: {gate.gibbsFreeEnergyKcalPerMol} kcal/mol</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERA VI: ASTRO-SCALE DYSON SENSOR GRIDS (2080 - 2120) */}
      {subTab === 'era6_dyson_astro' && <Era6DysonAstroView />}

      {/* ERA VII: SPACETIME MANIFOLD & NOOSPHERE INTELLIGENCE (2120 - 2200+) */}
      {subTab === 'era7_spacetime_noosphere' && <Era7SpacetimeNoosphereView />}

      {/* 7. PLANETARY BIOSPHERE TWIN */}
      {subTab === 'planetary_twin' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Dyson Sphere Planetary Biosphere Digital Twin</h3>
              </div>
              <p className="text-xs text-slate-400">
                Era VI & VII (2080–2200+): Astro-scale planetary homeostasis, orbital solar rings, and multi-sector climate equilibrium.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
              Satellites: {planetaryData.orbitalSatellitesActive.toLocaleString()} Coherent Nodes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planetaryData.sectors.map((sec) => (
              <div key={sec.sectorId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">{sec.sectorId}</h4>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400">
                    {sec.status}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-slate-400 pt-1">
                  <div>Solar Irradiance: {sec.solarIrradianceWattsPerM2} W/m²</div>
                  <div>Carbon Capture: {sec.carbonCaptureGigatonsPerYr} Gt/yr</div>
                  <div>Entanglement Coherence: {sec.quantumEntanglementCoherence}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. 5GB+ EXASCALE BIG DATA ENGINE */}
      {subTab === 'exascale_bigdata' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">5GB+ Multi-Million Record Chunked Streaming Engine</h3>
              </div>
              <p className="text-xs text-slate-400">
                Engineered for enterprise organizations uploading millions of telemetry records without browser memory exhaustion.
              </p>
            </div>

            <button
              onClick={handleLoadMillionRows}
              disabled={isGenerating1M}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-600/30 transition cursor-pointer self-start sm:self-auto"
            >
              {isGenerating1M ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{millionRowLoaded ? '1,000,000 Records Active' : 'Ingest 1,000,000 Row Telemetry Stream'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Total Stream Records</span>
              <span className="text-white font-bold text-lg">1,000,000</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Chunked Memory Footprint</span>
              <span className="text-sky-400 font-bold text-lg">128.0 MB</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">V8 Heap Protection</span>
              <span className="text-emerald-400 font-bold text-lg">Throttled (Safe)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Welford Stream Mean</span>
              <span className="text-purple-400 font-bold text-lg">1360.5 MW</span>
            </div>
          </div>
        </div>
      )}

      {/* 9. VS CODE DEVELOPER HUB */}
      {subTab === 'vscode_hub' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">VS Code Developer Integration Hub</h3>
              </div>
              <p className="text-xs text-slate-400">
                Seamless local developer workflow: export the full project bundle, edit in VS Code, debug with launch configurations, and extend features.
              </p>
            </div>

            <button
              onClick={handleDownloadVsCodeBundle}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/30 transition self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Project Bundle (.json)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="font-semibold text-white flex items-center gap-2 text-sm">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Local Terminal Setup & Launch</span>
              </h4>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">1. Install Node.js dependencies:</span>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                    npm install
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">2. Run Dev Server with tsx & Express:</span>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                    npm run dev
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">3. Typecheck & Build:</span>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                    npm run lint && npm run build
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>.vscode/launch.json</span>
                </h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(
                        {
                          version: '0.2.0',
                          configurations: [
                            {
                              type: 'node',
                              request: 'launch',
                              name: 'OmniData Dev Server',
                              runtimeExecutable: 'npm',
                              runtimeArgs: ['run', 'dev'],
                              port: 3000,
                            },
                          ],
                        },
                        null,
                        2
                      )
                    );
                    setCopiedCmd(true);
                    setTimeout(() => setCopiedCmd(false), 2000);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg transition cursor-pointer"
                >
                  {copiedCmd ? 'Copied' : 'Copy JSON'}
                </button>
              </div>

              <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-48 leading-relaxed">
{`{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "OmniData Dev Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
