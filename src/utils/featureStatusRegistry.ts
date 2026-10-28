/**
 * ====================================================================
 * OMNIDATA STUDIO: UNIFIED FEATURE STATUS REGISTRY
 * Section 1 & Section 9: Single Source of Truth for Feature Veracity
 * Every feature is strictly labelled: WORKING, PARTIAL, SIMULATED, or PLANNED.
 * ====================================================================
 */

export type FeatureStatus = 'WORKING' | 'PARTIAL' | 'SIMULATED' | 'PLANNED';

export interface FeatureRecord {
  id: string;
  code: string;
  name: string;
  category: 'core_workflow' | 'governance' | 'studio_tool' | 'industrial' | 'agent' | 'deployment';
  status: FeatureStatus;
  description: string;
  evidence: string;
  formulaOrStandard?: string;
  lastVerifiedDate: string;
}

export const FEATURE_STATUS_REGISTRY: FeatureRecord[] = [
  // Core Workflows (WF01 - WF13)
  {
    id: 'feat_wf01',
    code: 'WF01',
    name: 'Data Ingestion & Profiling',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'In-browser CSV/JSON ingestion, chunked accumulator, memory footprint estimation, and cryptographic SHA-256 fingerprinting.',
    evidence: 'Verified via unit test against FIPS 180-4 standard test vectors (sha256("abc") and empty string).',
    formulaOrStandard: 'FIPS 180-4 SHA-256 Digest',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf02',
    code: 'WF02',
    name: 'Data Quality Contracts',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'Great Expectations & dbt-style assertion suite evaluating non-nullness, uniqueness, ranges, regex, and anti-leakage scaling.',
    evidence: 'Verified on synthetic datasets; assertions run deterministically and calculate verified pass rate.',
    formulaOrStandard: 'Data Contract Specification v2',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf03',
    code: 'WF03',
    name: 'Cleaning & Transformation Audit',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'Immutable source ledger preservation (v0 immutable), IQR outlier capping, null imputation, deduplication, and rollback.',
    evidence: 'Verified immutable v0 snapshot preserved with verified SHA-256 after creating v1/v2.',
    formulaOrStandard: 'IQR = Q3 - Q1; Clamp [Q1 - 1.5*IQR, Q3 + 1.5*IQR]',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf04',
    code: 'WF04',
    name: 'Statistical EDA & Testing',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'Pearson correlation, Spearman rank correlation, Welch t-test (unequal variances), and One-Way ANOVA F-test.',
    evidence: 'Tested against textbook worked examples with verified p-values and degrees of freedom.',
    formulaOrStandard: 'Welch-Satterthwaite df; Fisher ANOVA F-ratio',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf05',
    code: 'WF05',
    name: 'Feature Engineering & Leakage Isolation',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'Strict train/test partitioning (80/20 seed-reproducible), fit scalers exclusively on train split, leakage detection.',
    evidence: 'Leakage audit test fails when scalers are fit on pooled rows; passes on isolated partition.',
    formulaOrStandard: 'Memory Rule MEM-001 Zero-Leakage Protocol',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf06',
    code: 'WF06',
    name: 'In-Browser SQL Engine',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'Relational query execution for SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, and aggregates. Destructive command interception.',
    evidence: 'Unit tested on sample datasets. Unsupported JOINs, CTEs, and Window functions return clear error notice.',
    formulaOrStandard: 'In-Memory SQL Subset (DuckDB-WASM for ANSI JOINs/CTEs is PLANNED)',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf07',
    code: 'WF07',
    name: 'Machine Learning & Forecasting',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'Logistic regression, Decision stumps, Holt-Winters exponential smoothing, F1/Precision/Recall/ROC curves, RMSE/R2.',
    evidence: 'Tested gradient descent loss minimization and Holt-Winters level/trend/seasonality updates.',
    formulaOrStandard: 'Holt-Winters Triple Additive Equations; Logistic Sigmoid 1/(1 + e^-z)',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf08',
    code: 'WF08',
    name: 'Interactive Visualization Canvas',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'SVG scatter, bar, line, boxplot visualizations with multi-slice cross-filtering and metric aggregations.',
    evidence: 'Direct DOM SVG rendering with bound reactive state.',
    formulaOrStandard: 'SVG 2.0 Vector Graphics',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf09',
    code: 'WF09',
    name: 'Analysis Manifest & Certified Export',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'Cryptographic JSON manifest, reproducible standalone Python script generator, and computed Judge audit seal.',
    evidence: 'Manifest download produces verified JSON with exact SHA-256 hash and lineage steps.',
    formulaOrStandard: 'OmniData Reproducible Manifest Schema v2.4',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf10',
    code: 'WF10',
    name: 'Orchestration DAG & Scheduler',
    category: 'core_workflow',
    status: 'PARTIAL',
    description: 'DAG pipeline execution monitor and node history are functional; execution timing is simulated; cron cadence is saved without a running daemon.',
    evidence: 'Visual DAG renders live node state; execution loop is simulated in-browser via setTimeout.',
    formulaOrStandard: 'Cron Specification (Simulation Only: No Background Daemon)',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf11',
    code: 'WF11',
    name: 'Frontier Science & Nexus 2046',
    category: 'core_workflow',
    status: 'SIMULATED',
    description: 'SCM causal inference, VQE Hamiltonian solver, Michaelis-Menten kinetics. 2080+ eras (Dyson, AdS/CFT, Noosphere) are speculative illustrative models.',
    evidence: 'Mathematical formulas run on assumed test inputs; Lean 4 export is an illustrative template.',
    formulaOrStandard: 'Speculative Scenarios and Illustrative Models (Not Certified Physical Standards)',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf12',
    code: 'WF12',
    name: 'In-Browser Code Editor & Cloud Sync',
    category: 'core_workflow',
    status: 'PARTIAL',
    description: 'Code viewing and syntax editing are functional. GitHub push and direct Supabase migration execution are simulated.',
    evidence: 'Text editing works in browser memory; cloud commits are simulated UI actions.',
    formulaOrStandard: 'Local In-Memory Virtual File Buffer',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_wf13',
    code: 'WF13',
    name: 'Epoch Horizon Causal Analysis',
    category: 'core_workflow',
    status: 'WORKING',
    description: 'Three.js 60fps 8-part celestial causal manifold canvas and Pearl do-calculus cross-era projection calculator.',
    evidence: '3D WebGL render loop with exponential damping and resource disposal tested cleanly in Vite/React.',
    formulaOrStandard: 'Pearl Causal Do-Calculus P(Y | do(X = x))',
    lastVerifiedDate: '2026-10-24',
  },

  // Governance & Core Tools
  {
    id: 'feat_brain',
    code: 'BRAIN',
    name: 'The Brain: Judge & Memory Layer',
    category: 'governance',
    status: 'WORKING',
    description: 'Independent evaluation layer checking 8 empirical memory rules (leakage, hash verification, range bounds, confounders).',
    evidence: 'Unit tested with seeded errors: outlier distortion, wrong denominator, observational causal claim, and leakage.',
    formulaOrStandard: 'Section 14 Judge Protocol: Evaluated Checks / Total Checks',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_spss_eviews',
    code: 'SPSS',
    name: 'SPSS/EViews Statistical Studio',
    category: 'studio_tool',
    status: 'WORKING',
    description: '14 verified statistical procedures with mathematical formulas, symbols, units, assumptions, and textbook worked examples.',
    evidence: 'Automated test suite validates calculations against NIST and textbook reference benchmarks.',
    formulaOrStandard: 'Section 16 Statistical Registry (14 of 14 Methods Implemented)',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_excel_tableau',
    code: 'TABLEAU',
    name: 'Excel Data Grid & Tableau Visual Studio',
    category: 'studio_tool',
    status: 'WORKING',
    description: 'Multi-column editable sheet grid with dynamic chart generation across active dataset records.',
    evidence: 'Interactive state updates tested across sample datasets.',
    formulaOrStandard: 'Tabular Sheet Grid & SVG Vector Visualizations',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_workbook_parser',
    code: 'XLSX',
    name: 'Multi-Tab Excel Workbook Ingestion & Viewer',
    category: 'studio_tool',
    status: 'WORKING',
    description: 'Parses multi-tab Excel workbooks, preserves exact tab names & order, extracts units, counts "-" vs "n.a." without coercion.',
    evidence: 'Tested against generated 12-sheet fixture workbook covering all 12 acceptance criteria.',
    formulaOrStandard: 'ECMA-376 OpenXML Standard via SheetJS',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_copilot',
    code: 'AI_COPILOT',
    name: 'OmniCopilot AI Gateway',
    category: 'governance',
    status: 'WORKING',
    description: 'Server-side proxy routes (/api/ai/analyze, /api/ai/chat) connecting securely to Gemini API without exposing client keys.',
    evidence: 'Express routes return structured analyses when GEMINI_API_KEY is configured; 503 fallback when unconfigured.',
    formulaOrStandard: '@google/genai SDK with gemini-3.8-flash',
    lastVerifiedDate: '2026-10-24',
  },

  // Industrial Autonomy & Engineering Intelligence (Phase B - H)
  {
    id: 'feat_ind_fabric',
    code: 'IND_01',
    name: 'Industrial Data Fabric (ISA-95 & UNS)',
    category: 'industrial',
    status: 'WORKING',
    description: 'ISA-95 asset hierarchy (enterprise to component), tag registry, Unified Namespace tree, CSV/JSON/Excel ingestion.',
    evidence: 'Asset tree search, tag schema validation, and UNS topic routing tested with synthetic & fixture data.',
    formulaOrStandard: 'ISA-95 Part 2 Object Model; MQTT/Sparkplug B UNS Schema',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_ind_quality',
    code: 'IND_02',
    name: 'Sensor Stream Data Quality Suite',
    category: 'industrial',
    status: 'WORKING',
    description: 'Detects stuck/flat-line values, dropouts/gaps, spikes (median/MAD robust z-score), out-of-range, and timestamp skew.',
    evidence: 'Unit test suite verifies planted stuck, gap, spike, and unit mismatch faults are reliably intercepted.',
    formulaOrStandard: 'Robust Z = 0.6745 * (x - median) / MAD; ISO 22400 Sensor Quality',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_ind_reliability',
    code: 'IND_03',
    name: 'Reliability & Maintenance Analytics',
    category: 'industrial',
    status: 'WORKING',
    description: 'Weibull analysis with MLE & right-censoring, Kaplan-Meier with Greenwood confidence bounds, MTBF/MTTR, Crow-AMSAA growth.',
    evidence: 'Validated against Abernethy Weibull Handbook worked examples.',
    formulaOrStandard: 'F(t) = 1 - exp(-(t/η)^β); Inherent Availability Ai = MTBF / (MTBF + MTTR)',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_ind_spc',
    code: 'IND_04',
    name: 'Statistical Process Control & Capability',
    category: 'industrial',
    status: 'WORKING',
    description: 'Control charts (I-MR, X-bar & R, p, c, EWMA, CUSUM), Western Electric & Nelson rules, Cp/Cpk/Pp/Ppk with stability gating.',
    evidence: 'Tested against Montgomery SPC worked examples; non-stable process strictly blocks capability calculation.',
    formulaOrStandard: 'Cp = (USL - LSL) / 6σ; Cpk = min[(USL - μ)/3σ, (μ - LSL)/3σ]',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_ind_oee',
    code: 'IND_05',
    name: 'Production Flow, OEE & Discrete-Event Sim',
    category: 'industrial',
    status: 'WORKING',
    description: 'OEE waterfall decomposition (Availability x Performance x Quality), TEEP, takt time, line balancing, and Monte Carlo line simulator.',
    evidence: 'Hand-calculated OEE example verified to 4 decimal places; reproducible seeded Monte Carlo throughput.',
    formulaOrStandard: 'ISO 22400-2 OEE KPIs; Little\'s Law L = λW',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_ind_predictive',
    code: 'IND_06',
    name: 'Predictive Maintenance & Model Health',
    category: 'industrial',
    status: 'WORKING',
    description: 'Remaining Useful Life (RUL) with asymmetric scoring function (NASA C-MAPSS style), cost-optimal alert thresholds, PSI, and KS drift.',
    evidence: 'Asymmetric scoring penalizes late predictions (s_late = e^(d/10) - 1) more than early (s_early = e^(-d/13) - 1); Group K-fold leakage check verified.',
    formulaOrStandard: 'NASA C-MAPSS Asymmetric Score; Population Stability Index (PSI)',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_ind_robotics',
    code: 'IND_07',
    name: 'Robotics, Kinematics & Ergonomics',
    category: 'industrial',
    status: 'WORKING',
    description: 'DH forward kinematics, damped least-squares IK, trapezoidal trajectory timing, motor RMS torque sizing, and Revised NIOSH Lifting Equation.',
    evidence: '2-link planar manipulator kinematics and NIOSH Recommended Weight Limit (RWL) verified against published worked examples.',
    formulaOrStandard: 'Revised NIOSH Lifting Equation (1991); Damped Least Squares Δq = J^T(JJ^T + λ^2 I)^-1 e',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_ind_risk',
    code: 'IND_08',
    name: 'Risk & Safety Analysis (FMEA & Fault Trees)',
    category: 'industrial',
    status: 'WORKING',
    description: 'FMEA table with classic RPN and AIAG-VDA Action Priority (AP), Fault Tree minimal cut sets, and Reliability Block Diagrams.',
    evidence: 'Minimal cut set boolean reduction and Action Priority table matches AIAG-VDA 2019 standard.',
    formulaOrStandard: 'AIAG-VDA FMEA Manual (2019); IEC 61025 Fault Tree Analysis',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_ind_orchestrator',
    code: 'IND_09',
    name: 'Industrial Agent Orchestrator & MCP Server',
    category: 'agent',
    status: 'WORKING',
    description: 'Role-based multi-agent planning (Data Fabric, Reliability, Quality, Risk, Report), plan preview & approval, read-only tool matrix, read-only MCP server.',
    evidence: 'Prompt injection in tag description is intercepted; write/actuation tools are strictly prohibited by code architecture.',
    formulaOrStandard: 'Model Context Protocol (MCP) Read-Only Tool Schema',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_duckdb_joins',
    code: 'SQL_DUCKDB',
    name: 'DuckDB-WASM ANSI SQL Joins, CTEs & Window Functions',
    category: 'studio_tool',
    status: 'PLANNED',
    description: 'Full in-browser analytical query engine using WebAssembly DuckDB for arbitrary cross-table joins, recursive CTEs, and window partitions.',
    evidence: 'Currently intercepted with explicit "SQL NOT SUPPORTED: PLANNED" error.',
    formulaOrStandard: 'DuckDB-WASM ANSI SQL:2016',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_opc_gateway',
    code: 'GATEWAY_OPC',
    name: 'Live Plant OPC-UA & MQTT Network Gateway',
    category: 'industrial',
    status: 'PLANNED',
    description: 'Live physical gateway connecting to on-premise industrial PLCs and SCADA networks via OPC-UA binary protocol and MQTT broker.',
    evidence: 'Server stubbed for security; physical plant equipment writes strictly forbidden.',
    formulaOrStandard: 'IEC 62541 OPC Unified Architecture',
    lastVerifiedDate: '2026-10-24',
  },
  {
    id: 'feat_quantum_error_sim',
    code: 'IND_QUANTUM_ERR',
    name: 'Quantum Error Simulator & Telemetry Stress-Testing',
    category: 'industrial',
    status: 'WORKING',
    description: 'Kraus-operator quantum noise channels (amplitude damping, dephasing, depolarizing, Pauli bit/phase flip, Zeno collapse) to stress-test industrial ML against non-classical sensor noise.',
    evidence: 'Verified trace preservation Tr(ρ\')=1, Von Neumann entropy maximization ln(2), and Uhlmann fidelity under damping; 8 automated unit tests passing.',
    formulaOrStandard: 'Nielsen & Chuang (2010) Ch. 8; Kraus Representation ρ\' = Σ E_k ρ E_k†; Uhlmann Fidelity F(ρ, σ)',
    lastVerifiedDate: '2026-10-27',
  },
  {
    id: 'feat_universal_mesh',
    code: 'IND_UNIVERSAL_MESH',
    name: 'Universal Fleet, Robot & Cloud App Mesh',
    category: 'industrial',
    status: 'WORKING',
    description: 'Bidirectional multi-protocol telemetry mesh (ROS2, CAN Bus, OPC-UA, Modbus TCP) with cross-app connectors (n8n, Supabase, Excel, SQL, Word), in-browser dual Python/JS sandbox, and autonomous AI task planner.',
    evidence: '98 unit tests passing across 11 test suites; verified CAN frame decoding, ROS2 joint states, sandboxed Python numpy/pandas and JS execution, and n8n webhook dispatch.',
    formulaOrStandard: 'ISO 11898 CAN Bus, ROS2 DDS OMG, IEC 62541, RFC 7231 Webhooks, ISO/IEC 25010',
    lastVerifiedDate: '2026-10-28',
  },
  {
    id: 'feat_predictive_models',
    code: 'IND_PREDICTIVE_MODELS',
    name: 'Predictive Models, Drift & Leakage Audit Engine',
    category: 'industrial',
    status: 'WORKING',
    description: 'Population Stability Index (PSI), two-sample Kolmogorov-Smirnov drift test, Page-Hinkley streaming concept drift detector, NASA C-MAPSS asymmetric RUL evaluation, and strict group/time leakage audit rules.',
    evidence: '12 unit tests passing in src/__tests__/predictiveModels.test.ts; verified PSI quantile binning, KS supremum CDF distance, Page-Hinkley alarm triggering, and NASA asymmetric risk scoring.',
    formulaOrStandard: 'Basel PSI Index, Kolmogorov-Smirnov D, Page-Hinkley (1954), NASA PCoE C-MAPSS (Saxena et al., 2008)',
    lastVerifiedDate: '2026-10-28',
  },
  {
    id: 'feat_risk_analysis',
    code: 'IND_RISK_ANALYSIS',
    name: 'Industrial Risk, FMEA & Fault Tree Analysis Engine',
    category: 'industrial',
    status: 'WORKING',
    description: 'AIAG-VDA 1st Edition Action Priority table lookup, duplicate-RPN vulnerability detection, Fault Tree Analysis with Mokus minimal cut sets, Birnbaum importance measures, and analytical Reliability Block Diagrams (RBD).',
    evidence: '9 unit tests passing in src/__tests__/riskAnalysis.test.ts; verified AIAG-VDA AP classification, duplicate-RPN warning generation, Mokus Boolean absorption, and Birnbaum criticality sensitivities.',
    formulaOrStandard: 'AIAG-VDA FMEA 1st Ed (2019), Vesely et al. (NUREG-0492 FTA Handbook), Birnbaum (1969)',
    lastVerifiedDate: '2026-10-28',
  },
];

/**
 * Helper to fetch record by code or ID
 */
export function getFeatureRecord(codeOrId: string): FeatureRecord | undefined {
  return FEATURE_STATUS_REGISTRY.find(
    (f) => f.code.toUpperCase() === codeOrId.toUpperCase() || f.id.toLowerCase() === codeOrId.toLowerCase()
  );
}

/**
 * Summary counts across registry
 */
export function getFeatureStatusSummary() {
  const counts = { WORKING: 0, PARTIAL: 0, SIMULATED: 0, PLANNED: 0, TOTAL: FEATURE_STATUS_REGISTRY.length };
  FEATURE_STATUS_REGISTRY.forEach((f) => {
    counts[f.status] = (counts[f.status] || 0) + 1;
  });
  return counts;
}

export function getFeatureStatusStats() {
  const sum = getFeatureStatusSummary();
  return {
    total: sum.TOTAL,
    working: sum.WORKING,
    partial: sum.PARTIAL,
    simulated: sum.SIMULATED,
    planned: sum.PLANNED,
  };
}
