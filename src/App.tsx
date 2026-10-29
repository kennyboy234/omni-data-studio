import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Navigation, WorkflowId } from './components/Navigation';
import { WF01Ingestion } from './components/Workflows/WF01Ingestion';
import { WF02Quality } from './components/Workflows/WF02Quality';
import { WF03Cleaning } from './components/Workflows/WF03Cleaning';
import { WF04EDA } from './components/Workflows/WF04EDA';
import { WF05FeatureEng } from './components/Workflows/WF05FeatureEng';
import { WF06SQL } from './components/Workflows/WF06SQL';
import { WF07MachineLearning } from './components/Workflows/WF07MachineLearning';
import { WF08Dashboard } from './components/Workflows/WF08Dashboard';
import { WF09ExportReport } from './components/Workflows/WF09ExportReport';
import { WF10Orchestration } from './components/Workflows/WF10Orchestration';
import { WF11FutureScience } from './components/Workflows/WF11FutureScience';
import { WF12Editor } from './components/Workflows/WF12Editor';
import { WF13EpochHorizon } from './components/Workflows/WF13EpochHorizon';
import { WF14Industrial } from './components/Workflows/WF14Industrial';
import { OmniCopilot } from './components/OmniCopilot';
import { AuthModal, AuthUser } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';
import { JudgeAndMemoryModal } from './components/JudgeAndMemoryModal';
import { SpssEviewsStudio } from './components/SpssEviewsStudio';
import { ExcelTableauStudio } from './components/ExcelTableauStudio';
import { FeatureStatusModal } from './components/FeatureStatusModal';
import { ChaosStressTestModal } from './components/ChaosStressTestModal';
import { FleetMeshProvider } from './03-fleet/FleetMeshContext';
import { Studio3FleetHub } from './03-fleet/Studio3FleetHub';
import {
  CleaningStep,
  DataQualityAssertion,
  Dataset,
  ModelArtifact,
  PipelineNode,
  PipelineRunRecord,
  QualityValidationReport,
  TrainTestSplitResult,
} from './types';
import { autoGenerateAssertions, runQualityAssertions } from './utils/dataQuality';
import { getSampleDatasets } from './utils/datasets';
import { trainTestSplit } from './utils/featureEngineering';

const initialPipelineNodes: PipelineNode[] = [
  { id: 'node_s3_fleet', code: 'S3', title: 'Studio 3: Fleet Mesh & 3D Battery Twin', status: 'completed', durationMs: 28, logMessages: ['Real-time 270Hz hard PLC bridge calibrated. FlightRadar telemetry trails streaming. 3D battery exploded digital twin active.'] },
  { id: 'node_wf01', code: 'WF01', title: 'Data Ingestion & Profiling', status: 'completed', durationMs: 42, logMessages: ['Dataset hash validated. In-memory profile computed.'] },
  { id: 'node_wf02', code: 'WF02', title: 'Data Quality Contracts', status: 'completed', durationMs: 65, logMessages: ['Evaluated 8 assertions. Zero fatal contract violations.'] },
  { id: 'node_wf03', code: 'WF03', title: 'Cleaning & Transformation Audit', status: 'completed', durationMs: 110, logMessages: ['Lineage version snapshot created. Source left immutable.'] },
  { id: 'node_wf04', code: 'WF04', title: 'EDA & Statistical Testing', status: 'completed', durationMs: 140, logMessages: ['Correlation matrix generated. Welch t-test evaluated (p < 0.05).'] },
  { id: 'node_wf05', code: 'WF05', title: 'Feature Engineering & Leakage Isolation', status: 'completed', durationMs: 78, logMessages: ['Strict 80/20 train/test split. Scalers fit solely on train partition.'] },
  { id: 'node_wf06', code: 'WF06', title: 'SQL Engine Relational Checks', status: 'completed', durationMs: 35, logMessages: ['Relational aggregates validated. Destructive guardrails intact.'] },
  { id: 'node_wf07', code: 'WF07', title: 'ML Benchmarking & Forecast', status: 'completed', durationMs: 310, logMessages: ['Baseline vs candidate models trained. F1-score & ROC computed.'] },
  { id: 'node_wf08', code: 'WF08', title: 'Interactive Visualization Canvas', status: 'completed', durationMs: 22, logMessages: ['Dynamic slices and KPI metrics initialized.'] },
  { id: 'node_wf09', code: 'WF09', title: 'Analysis Manifest & Certified Report', status: 'completed', durationMs: 85, logMessages: ['Generated analysis manifest JSON and reproducible Python script.'] },
  { id: 'node_wf11', code: 'WF11', title: '2046 Causal & Scientific World Engine', status: 'completed', durationMs: 12, logMessages: ['Causal SCM inferred. Pearl counterfactual simulator & 2046 active learning loop initialized.'] },
  { id: 'node_wf13', code: 'WF13', title: 'Epoch Horizon Causal Projections (2026-2200+)', status: 'completed', durationMs: 48, logMessages: ['7-Era causal world model projected via Pearl do-calculus. WebGL 3D manifold initialized with ACES tone mapping.'] },
  { id: 'node_era6_dyson', code: 'ERA6', title: 'Era VI: Dyson Sensor Grids & Astrobiological Stream', status: 'completed', durationMs: 64, logMessages: ['Processed 3.84e26 W stellar flux telemetry. Photochemical ΔG atmospheric disequilibrium computed.'] },
  { id: 'node_era7_noosphere', code: 'ERA7', title: 'Era VII: Spacetime Holographic Geometrodynamics', status: 'completed', durationMs: 52, logMessages: ['Calculated Ryu-Takayanagi AdS/CFT minimal area entropy S_EE = Area(γ_A) / 4G_N and integrated information Φ*.'] },
];

export default function App() {
  const [datasets, setDatasets] = useState<Dataset[]>(() => getSampleDatasets());
  const [activeDatasetId, setActiveDatasetId] = useState<string>(() => datasets[0]?.id || 'ds_saas_churn');
  const [activeTab, setActiveTab] = useState<WorkflowId>('S3_FLEET');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isNoviceMode, setIsNoviceMode] = useState<boolean>(true);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isBrainOpen, setIsBrainOpen] = useState<boolean>(false);
  const [brainInitialTab, setBrainInitialTab] = useState<'reviews' | 'memory_bank' | 'gemini_judge' | 'ai_reasoning'>('reviews');
  const [isSpssOpen, setIsSpssOpen] = useState<boolean>(false);
  const [isExcelTableauOpen, setIsExcelTableauOpen] = useState<boolean>(false);
  const [isFeatureStatusOpen, setIsFeatureStatusOpen] = useState<boolean>(false);
  const [isChaosLabOpen, setIsChaosLabOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('omnidata_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    // In production without saved credentials, default to unauthenticated session
    return null;
  });

  const handleLoginSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('omnidata_auth_user', JSON.stringify(user));
      localStorage.setItem('omnidata_auth_token', token);
    } catch {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('omnidata_auth_user');
      localStorage.removeItem('omnidata_auth_token');
    } catch {}
  };

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  // Identify root raw dataset for immutability tracking
  const rawDataset =
    datasets.find((d) => d.id === activeDataset.parentDatasetId || (d.isImmutableSource && d.id.includes(activeDataset.id.split('_v')[0]))) ||
    (activeDataset.isImmutableSource ? activeDataset : datasets[0]);

  // Quality Assertions & Report State
  const [assertions, setAssertions] = useState<DataQualityAssertion[]>([]);
  const [validationReport, setValidationReport] = useState<QualityValidationReport | null>(null);

  // Cleaning Transformation Steps Recipe
  const [cleaningSteps, setCleaningSteps] = useState<CleaningStep[]>([]);

  // Feature Engineering Partition
  const [splitResult, setSplitResult] = useState<TrainTestSplitResult | null>(null);

  // Model Artifact
  const [activeModelArtifact, setActiveModelArtifact] = useState<ModelArtifact | null>(null);

  // Orchestration state
  const [nodes, setNodes] = useState<PipelineNode[]>(initialPipelineNodes);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [runHistory, setRunHistory] = useState<PipelineRunRecord[]>([
    {
      runId: 'RUN-9021',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3599100).toISOString(),
      status: 'success',
      nodesExecuted: 9,
      durationMs: 887,
      trigger: 'manual',
    },
    {
      runId: 'RUN-9020',
      startedAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86398900).toISOString(),
      status: 'success',
      nodesExecuted: 9,
      durationMs: 1100,
      trigger: 'schedule',
    },
  ]);

  // Initialize quality assertions and split when active dataset changes
  useEffect(() => {
    if (activeDataset) {
      const initialRules = autoGenerateAssertions(activeDataset);
      setAssertions(initialRules);
      const rep = runQualityAssertions(activeDataset, initialRules);
      setValidationReport(rep);
      const split = trainTestSplit(activeDataset, 0.8, 42);
      setSplitResult(split);
    }
  }, [activeDatasetId]);

  // Global Keypad & Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Run full pipeline on Cmd+Enter or Ctrl+Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunFullPipeline();
        return;
      }

      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (!isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const keyMap: Record<string, WorkflowId> = {
          m: 'S3_FLEET',
          M: 'S3_FLEET',
          '1': 'WF01',
          '2': 'WF02',
          '3': 'WF03',
          '4': 'WF04',
          '5': 'WF05',
          '6': 'WF06',
          '7': 'WF07',
          '8': 'WF08',
          '9': 'WF09',
          '0': 'WF10',
          f: 'WF11',
          F: 'WF11',
          e: 'WF12',
          E: 'WF12',
          h: 'WF13',
          H: 'WF13',
          i: 'WF14',
          I: 'WF14',
        };

        if (keyMap[e.key]) {
          setActiveTab(keyMap[e.key]);
        } else if (e.key === 'b' || e.key === 'B' || e.key === 'j' || e.key === 'J') {
          setIsBrainOpen((prev) => !prev);
        } else if (e.key === 's' || e.key === 'S') {
          setIsSpssOpen((prev) => !prev);
        } else if (e.key === 'g' || e.key === 'G') {
          setIsExcelTableauOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDatasetUpdated = (newDataset: Dataset, newStep: CleaningStep) => {
    setDatasets((prev) => [newDataset, ...prev]);
    setActiveDatasetId(newDataset.id);
    setCleaningSteps((prev) => [...prev, newStep]);

    // Re-run quality report on new dataset
    const rep = runQualityAssertions(newDataset, assertions);
    setValidationReport(rep);
    const split = trainTestSplit(newDataset, 0.8, 42);
    setSplitResult(split);
  };

  const handleAddDataset = (newDataset: Dataset) => {
    setDatasets((prev) => [newDataset, ...prev]);
    setActiveDatasetId(newDataset.id);
    setCleaningSteps([]);
  };

  const handleRunFullPipeline = () => {
    setIsPipelineRunning(true);
    const startTime = performance.now();

    // Sequentially animate nodes
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'running' })));

    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n, i) => ({
          ...n,
          status: 'completed',
          durationMs: Math.floor(Math.random() * 80) + 30,
          logMessages: [`Completed node execution with zero fatal errors at ${new Date().toLocaleTimeString()}`],
        }))
      );
      setIsPipelineRunning(false);

      const elapsed = Math.round(performance.now() - startTime);
      const record: PipelineRunRecord = {
        runId: `RUN-${Math.floor(1000 + Math.random() * 9000)}`,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'success',
        nodesExecuted: 9,
        durationMs: elapsed,
        trigger: 'manual',
      };
      setRunHistory((prev) => [record, ...prev]);
    }, 1200);
  };

  const handleRetryStep = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, status: 'completed', durationMs: 45 } : n))
    );
  };

  return (
    <FleetMeshProvider onNavigateWorkflow={(wf) => setActiveTab(wf)}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
        {/* Top Header */}
        <Header
          datasets={datasets}
          activeDatasetId={activeDatasetId}
          onSelectDataset={setActiveDatasetId}
          onRunFullPipeline={handleRunFullPipeline}
          isPipelineRunning={isPipelineRunning}
          onOpenReport={() => setActiveTab('WF09')}
          onOpenFutureScience={() => setActiveTab('WF11')}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenEditor={() => setActiveTab('WF12')}
          onOpenBrain={() => {
            setBrainInitialTab('reviews');
            setIsBrainOpen(true);
          }}
          onOpenAiReasoning={() => {
            setBrainInitialTab('ai_reasoning');
            setIsBrainOpen(true);
          }}
          onOpenFleetConnectivity={() => setActiveTab('S3_FLEET')}
          onOpenSpssEviews={() => setIsSpssOpen(true)}
          onOpenExcelTableau={() => setIsExcelTableauOpen(true)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          aiActive={true}
          onOpenFeatureStatus={() => setIsFeatureStatusOpen(true)}
          onOpenChaosLab={() => setIsChaosLabOpen(true)}
        />

        {/* 10-Workflow Navigation Bar */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          cleaningStepCount={cleaningSteps.length}
          qualityFailCount={validationReport?.failedCount || 0}
        />

        {/* Main Workflow Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'S3_FLEET' && <Studio3FleetHub />}

          {activeTab === 'WF01' && (
          <WF01Ingestion
            dataset={activeDataset}
            allDatasets={datasets}
            onSelectDataset={setActiveDatasetId}
            onAddDataset={handleAddDataset}
            onGoToQuality={() => setActiveTab('WF02')}
          />
        )}

        {activeTab === 'WF02' && (
          <WF02Quality
            dataset={activeDataset}
            assertions={assertions}
            validationReport={validationReport}
            onUpdateAssertions={setAssertions}
            onRunValidations={setValidationReport}
            onGoToCleaning={() => setActiveTab('WF03')}
          />
        )}

        {activeTab === 'WF03' && (
          <WF03Cleaning
            activeDataset={activeDataset}
            rawSourceDataset={rawDataset}
            cleaningSteps={cleaningSteps}
            onDatasetUpdated={handleDatasetUpdated}
            onGoToEDA={() => setActiveTab('WF04')}
          />
        )}

        {activeTab === 'WF04' && (
          <WF04EDA
            dataset={activeDataset}
            onGoToFeatureEng={() => setActiveTab('WF05')}
          />
        )}

        {activeTab === 'WF05' && (
          <WF05FeatureEng
            dataset={activeDataset}
            splitResult={splitResult}
            onUpdateSplit={setSplitResult}
            onGoToSQL={() => setActiveTab('WF06')}
          />
        )}

        {activeTab === 'WF06' && (
          <WF06SQL
            activeDataset={activeDataset}
            rawDataset={rawDataset}
            onSaveAsDataset={handleAddDataset}
            onGoToML={() => setActiveTab('WF07')}
          />
        )}

        {activeTab === 'WF07' && (
          <WF07MachineLearning
            dataset={activeDataset}
            splitResult={splitResult}
            activeModelArtifact={activeModelArtifact}
            onModelTrained={setActiveModelArtifact}
            onGoToDashboard={() => setActiveTab('WF08')}
          />
        )}

        {activeTab === 'WF08' && (
          <WF08Dashboard
            dataset={activeDataset}
            onGoToExport={() => setActiveTab('WF09')}
          />
        )}

        {activeTab === 'WF09' && (
          <WF09ExportReport
            activeDataset={activeDataset}
            rawDataset={rawDataset}
            cleaningSteps={cleaningSteps}
            assertions={assertions}
            validationReport={validationReport}
            modelArtifact={activeModelArtifact}
            onGoToOrchestration={() => setActiveTab('WF10')}
          />
        )}

        {activeTab === 'WF10' && (
          <WF10Orchestration
            nodes={nodes}
            runHistory={runHistory}
            onTriggerRun={handleRunFullPipeline}
            isRunning={isPipelineRunning}
            onRetryStep={handleRetryStep}
          />
        )}

        {activeTab === 'WF11' && (
          <WF11FutureScience
            dataset={activeDataset}
            onGoToExport={() => setActiveTab('WF09')}
            onLoadMillionRowDataset={handleAddDataset}
          />
        )}

        {activeTab === 'WF12' && (
          <WF12Editor
            dataset={activeDataset}
            rawDataset={rawDataset}
            modelArtifact={activeModelArtifact}
            validationReport={validationReport}
          />
        )}

        {activeTab === 'WF13' && (
          <WF13EpochHorizon
            dataset={activeDataset}
            onGoToPipeline={() => setActiveTab('WF10')}
            onGoToExport={() => setActiveTab('WF09')}
          />
        )}

        {activeTab === 'WF14' && <WF14Industrial />}
      </main>

      {/* Floating OmniCopilot AI Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-2xl shadow-indigo-500/40 border border-white/20 transition-all hover:scale-105 cursor-pointer"
        >
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-white inline-block animate-ping" />
            <span className="w-2 h-2 rounded-full bg-cyan-300 absolute inset-0.5" />
          </div>
          <span>OmniCopilot AI</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
            Feedback
          </span>
        </button>
      </div>

      {/* Slide-over OmniCopilot AI Modal */}
      <OmniCopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        activeDataset={activeDataset}
        validationReport={validationReport}
        splitResult={splitResult}
        modelArtifact={activeModelArtifact}
        cleaningStepsCount={cleaningSteps.length}
        onNavigateWorkflow={(wf) => {
          setActiveTab(wf);
          setIsCopilotOpen(false);
        }}
        isNoviceMode={isNoviceMode}
        onToggleNoviceMode={() => setIsNoviceMode((prev) => !prev)}
      />

      {/* Enterprise Identity & Database Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Quick Search & Keypad Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateWorkflow={(wf) => {
          setActiveTab(wf);
          setIsCommandPaletteOpen(false);
        }}
        onRunPipeline={handleRunFullPipeline}
        onOpenCopilot={() => {
          setIsCopilotOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        onOpenAuth={() => {
          setIsAuthOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        onOpenBrain={() => {
          setIsBrainOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        onOpenSpssEviews={() => {
          setIsSpssOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        onOpenExcelTableau={() => {
          setIsExcelTableauOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        onSelectDataset={setActiveDatasetId}
      />

      {/* The Brain: Independent Judge & Memory Modal (Section 14) */}
      <JudgeAndMemoryModal
        isOpen={isBrainOpen}
        onClose={() => setIsBrainOpen(false)}
        activeDataset={activeDataset}
        rawDataset={rawDataset}
        validationReport={validationReport}
        cleaningSteps={cleaningSteps}
        splitResult={splitResult}
        modelArtifact={activeModelArtifact}
        currentUser={currentUser}
        initialTab={brainInitialTab}
        onNavigateWorkflow={(wf) => {
          setActiveTab(wf as WorkflowId);
          setIsBrainOpen(false);
        }}
      />

      {/* SPSS-Style & EViews-Style Statistical Methods Studio (Section 16) */}
      <SpssEviewsStudio
        dataset={activeDataset}
        isOpen={isSpssOpen}
        onClose={() => setIsSpssOpen(false)}
        isProMode={!isNoviceMode}
      />

      {/* Excel Data Grid & Tableau/Power BI Visual Canvas (Section 17) */}
      <ExcelTableauStudio
        dataset={activeDataset}
        isOpen={isExcelTableauOpen}
        onClose={() => setIsExcelTableauOpen(false)}
      />

      {/* Unified Feature Status & Evidence Registry Modal (Phase A5) */}
      <FeatureStatusModal
        isOpen={isFeatureStatusOpen}
        onClose={() => setIsFeatureStatusOpen(false)}
      />

      {/* Adversarial Stress & Chaos Test Lab Modal */}
      <ChaosStressTestModal
        isOpen={isChaosLabOpen}
        onClose={() => setIsChaosLabOpen(false)}
      />
    </div>
    </FleetMeshProvider>
  );
}
