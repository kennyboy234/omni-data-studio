/**
 * ====================================================================
 * OMNIDATA INDUSTRIAL AUTONOMY & ROBOT BRAIN INTELLIGENCE: TYPES
 * Sections 1, 4, 5: Asset Hierarchy, Sensor Telemetry, Kinematics,
 * Neural Robot Brain Training, and Machinery Diagnostics
 * ====================================================================
 */

export type AssetLevel = 'enterprise' | 'site' | 'area' | 'line' | 'cell' | 'machine' | 'component' | 'vehicle' | 'robot';

export interface IndustrialAsset {
  id: string;
  parentId?: string;
  name: string;
  level: AssetLevel;
  type: 'robot_manipulator' | 'autonomous_vehicle' | 'cnc_mill' | 'turbine' | 'conveyor' | 'battery_pack' | 'powertrain';
  description: string;
  modelNumber?: string;
  serialNumber?: string;
  status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL_FAULT' | 'MAINTENANCE_REQUIRED';
  tagsCount: number;
  metadata: Record<string, any>;
  children?: IndustrialAsset[];
}

export type SensorDataType = 'float' | 'integer' | 'boolean' | 'string' | 'vector3' | 'quaternion';

export interface SensorTag {
  id: string;
  assetId: string;
  name: string;
  topic: string; // Unified Namespace path: e.g. tesla_giga/paint_line/robot_01/joint_3_torque
  description: string;
  unit: string;
  dataType: SensorDataType;
  samplingRateHz: number;
  validRange: [number, number];
  warningRange: [number, number];
  currentValue: number;
  lastUpdated: string;
  quality: 'GOOD' | 'STUCK_VALUE' | 'SPIKE_ANOMALY' | 'OUT_OF_RANGE' | 'CLOCK_SKEW' | 'DROPOUT';
}

export interface DHParameter {
  joint: number;
  thetaDeg: number; // Joint angle θ (deg)
  d: number;        // Link offset d (mm)
  a: number;        // Link length a (mm)
  alphaDeg: number; // Link twist α (deg)
}

export interface ForwardKinematicsResult {
  endEffectorPosition: [number, number, number]; // x, y, z in mm
  transformationMatrix: number[][]; // 4x4 homogenous matrix
  jointPositions: [number, number, number][]; // coordinates of each joint link for 3D rendering
}

export interface InverseKinematicsRequest {
  targetPosition: [number, number, number];
  currentThetasDeg: number[];
  dhParams: DHParameter[];
  dampingFactorLambda?: number;
  maxIterations?: number;
  toleranceMm?: number;
}

export interface InverseKinematicsResult {
  converged: boolean;
  finalThetasDeg: number[];
  iterations: number;
  finalErrorMm: number;
  pathCost: number;
  trajectory: { iteration: number; errorMm: number }[];
}

export interface TrapezoidalProfile {
  totalDistance: number; // mm or rad
  vMax: number;          // max velocity (mm/s or rad/s)
  aMax: number;          // max acceleration (mm/s^2 or rad/s^2)
  tAccel: number;        // time to accelerate (s)
  tFlat: number;         // time at constant velocity (s)
  tDecel: number;        // time to decelerate (s)
  totalTime: number;     // total trajectory duration (s)
  regime: 'triangular' | 'trapezoidal';
  samples: { t: number; pos: number; vel: number; acc: number }[];
}

export interface MotorSizingInputs {
  loadMassKg: number;
  radiusM: number;
  maxAccelerationMps2: number;
  frictionTorqueNm: number;
  operatingCycle: { durationSec: number; torqueNm: number }[];
}

export interface MotorSizingResult {
  peakTorqueNm: number;
  rmsTorqueNm: number;
  continuousPowerWatts: number;
  safetyFactor: number;
  recommendation: string;
}

export interface NioshLiftingInputs {
  loadWeightKg: number;
  horizontalDistanceCm: number; // H: 25 to 63 cm
  verticalDistanceCm: number;   // V: 0 to 175 cm
  verticalTravelDistanceCm: number; // D: 25 to 250 cm
  asymmetryAngleDeg: number;    // A: 0 to 135 deg
  frequencyLiftsPerMin: number; // F: 0.2 to 15 lifts/min
  couplingQuality: 'good' | 'fair' | 'poor';
  durationHours: '<=1' | '<=2' | '<=8';
}

export interface NioshLiftingResult {
  recommendedWeightLimitKg: number;
  liftingIndex: number; // LI = Weight / RWL
  riskCategory: 'NOMINAL (LI <= 1.0)' | 'INCREASED_RISK (1.0 < LI <= 3.0)' | 'HIGH_HAZARD (LI > 3.0)';
  multipliers: {
    loadConstant: number;
    horizontalMultiplier: number;
    verticalMultiplier: number;
    distanceMultiplier: number;
    asymmetricMultiplier: number;
    frequencyMultiplier: number;
    couplingMultiplier: number;
  };
}

export interface RobotBrainTrainingConfig {
  architecture: number[]; // e.g. [8, 16, 16, 4] (sensor inputs -> hidden layers -> action/actuator torques)
  learningRate: number;
  epochs: number;
  batchSize: number;
  activation: 'relu' | 'tanh' | 'sigmoid';
  optimizer: 'adam' | 'sgd';
}

export interface TrainingLossHistory {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
}

export interface MachineryDiagnosticsResult {
  assetId: string;
  assetName: string;
  healthIndexScore: number; // 0 - 100%
  overallStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  hotellingTSquared: number;
  hotellingThreshold: number;
  squaredPredictionError: number;
  speThreshold: number;
  remainingUsefulLifeDays: number;
  rulUncertaintyConfidence95: [number, number];
  componentFaults: {
    component: string;
    anomalyType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    actionAdvice: string;
  }[];
}

// ====================================================================
// PHASE C: RELIABILITY, SPC, OEE & SIMULATION TYPES
// ====================================================================

export interface WeibullFailureData {
  time: number;
  censored: boolean; // true if right-censored (survived to end of test), false if failure
}

export interface WeibullResult {
  beta: number; // Shape parameter (β)
  eta: number;  // Scale parameter / Characteristic life (η) in hours/cycles
  mttf: number; // Mean time to failure = η * Γ(1 + 1/β)
  b10Life: number; // 10th percentile life = η * (-ln(0.9))^(1/β)
  betaInterpretation: 'EARLY_INFANT_MORTALITY' | 'RANDOM_EXPONENTIAL_FAILURES' | 'WEAR_OUT_DEGRADATION';
  confidenceBounds95: {
    betaLower: number;
    betaUpper: number;
    etaLower: number;
    etaUpper: number;
  };
  probabilityPlot: { t: number; unreliability: number; fittedF: number }[];
  converged: boolean;
  iterations: number;
}

export interface KaplanMeierPoint {
  time: number;
  nAtRisk: number;
  nEvents: number;
  nCensored: number;
  survivalProbability: number;
  standardErrorGreenwood: number;
  confidenceInterval95: [number, number];
}

export interface ReliabilityKpiResult {
  totalOperatingHours: number;
  totalFailures: number;
  totalRepairHours: number;
  mtbfHours: number;
  mttrHours: number;
  inherentAvailabilityPercent: number;
  crowAmsaaBeta: number; // < 1 reliability improving, = 1 constant, > 1 deteriorating
  crowAmsaaLambda: number;
  paretoDowntimeCauses: {
    cause: string;
    downtimeMinutes: number;
    percentage: number;
    cumulativePercentage: number;
  }[];
}

export type SpcChartType = 'I_MR' | 'X_BAR_R' | 'P_CHART' | 'C_CHART' | 'EWMA' | 'CUSUM';

export interface SpcDataPoint {
  index: number;
  label: string;
  value: number;
  secondaryValue?: number; // e.g. MR or R
  subgroupSize?: number;
  ucl: number;
  lcl: number;
  centerLine: number;
  secondaryUcl?: number;
  secondaryLcl?: number;
  secondaryCenterLine?: number;
  violations: string[];
}

export interface SpcRunRuleViolation {
  pointIndex: number;
  ruleCode: 'RULE_1' | 'RULE_2' | 'RULE_3' | 'RULE_4';
  ruleDescription: string;
}

export interface SpcChartResult {
  chartType: SpcChartType;
  inControl: boolean;
  points: SpcDataPoint[];
  centerLine: number;
  ucl: number;
  lcl: number;
  violations: SpcRunRuleViolation[];
  summaryMessage: string;
}

export interface ProcessCapabilityResult {
  usl: number;
  lsl: number;
  target?: number;
  mean: number;
  sigmaWithin: number;
  sigmaOverall: number;
  cp: number | null;
  cpk: number | null;
  pp: number | null;
  ppk: number | null;
  isStable: boolean;
  isNormal: boolean;
  normalityPValue: number;
  isBlocked: boolean;
  blockedReason?: string;
  expectedDpmOverall: number;
}

export interface GaugeRRInput {
  operators: string[];
  parts: string[];
  trials: number;
  // measurements[operatorIndex][partIndex][trialIndex]
  measurements: number[][][];
}

export interface GaugeRRResult {
  equipmentVariationEV: number; // Repeatability
  appraiserVariationAV: number; // Reproducibility
  gaugeRRGRR: number;           // Combined GRR
  partVariationPV: number;      // Part-to-part variation
  totalVariationTV: number;
  percentStudyVarGRR: number;   // %GRR of study variation
  percentStudyVarPart: number;
  numberOfDistinctCategoriesNDC: number;
  verdict: 'ACCEPTABLE (<10%)' | 'MARGINAL (10-30%)' | 'UNACCEPTABLE (>30%)';
  ndcVerdict: 'ADEQUATE (NDC >= 5)' | 'INADEQUATE (NDC < 5)';
}

export interface OeeWaterfallStage {
  stage: string;
  hours: number;
  lossHours: number;
  lossReason?: string;
}

export interface OeeResult {
  plannedProductionTimeHours: number;
  operatingTimeHours: number;
  idealCycleTimeSeconds: number;
  totalUnitsProduced: number;
  goodUnitsProduced: number;
  calendarHours: number;
  availabilityRate: number; // 0..1
  performanceRate: number;  // 0..1
  qualityRate: number;      // 0..1
  oeePercent: number;       // 0..100
  teepPercent: number;      // 0..100
  waterfall: OeeWaterfallStage[];
}

export interface LineBalancingStation {
  stationId: string;
  stationName: string;
  taskDurationSec: number;
  isBottleneck: boolean;
  utilizationPercent: number;
}

export interface LineBalancingResult {
  customerDemandPerShift: number;
  shiftDurationSec: number;
  taktTimeSec: number;
  bottleneckStation: string;
  bottleneckCycleTimeSec: number;
  lineBalanceEfficiencyPercent: number;
  smoothnessIndex: number;
  stations: LineBalancingStation[];
}

export interface QueueingMMcResult {
  arrivalRateLambda: number;
  serviceRateMu: number;
  numServersC: number;
  trafficIntensityRho: number;
  probZeroInSystemP0: number;
  probWaitingErlangC: number;
  avgQueueLengthLq: number;
  avgTimeInQueueWq: number;
  avgTotalInSystemL: number;
  avgTotalTimeW: number;
  isStable: boolean;
}

export interface DiscreteEventSimConfig {
  seed: number;
  numStations: number;
  stationNominalCycleTimesSec: number[];
  bufferCapacities: number[];
  simulationDurationHours: number;
  numMonteCarloRuns: number;
  mtbfHours: number;
  mttrHours: number;
}

export interface DiscreteEventSimResult {
  seed: number;
  totalPartsProducedMean: number;
  throughputPerHourMean: number;
  confidenceInterval95: [number, number];
  stationUtilizationPercentages: number[];
  bottleneckStationIndex: number;
  monteCarloRunTotals: number[];
}

/**
 * ====================================================================
 * UNIVERSAL CONNECTIVITY & MULTI-APP FLEET ORCHESTRATION TYPES
 * Protocols: ROS2/DDS, CAN Bus/OBD-II, OPC-UA, Modbus, n8n, Supabase,
 * Excel/Word, SQL, Python/JS Sandbox, and AI Autonomous Task Engine
 * ====================================================================
 */

export type ProtocolType =
  | 'ROS2_DDS'
  | 'CAN_BUS'
  | 'OPC_UA'
  | 'MODBUS_TCP'
  | 'REST_WEBHOOK'
  | 'N8N_WORKFLOW'
  | 'SUPABASE_CDC'
  | 'OFFICE_EXCEL'
  | 'SQL_DATABASE';

export type ConnectivityCategory = 'robot' | 'vehicle' | 'machinery' | 'software_app' | 'database';

export interface CanSignalDecoded {
  name?: string;
  value: number;
  unit: string;
  description: string;
}

export interface CanBusFrame {
  canId: string;
  name: string;
  dlc: number;
  dataBytes: number[];
  signals: Record<string, CanSignalDecoded>;
  timestamp: string;
}

export interface Ros2TopicMessage {
  topic: string;
  msgType: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface ConnectivityNode {
  id: string;
  name: string;
  category: ConnectivityCategory;
  protocol: ProtocolType;
  endpointUrl: string;
  status: 'CONNECTED' | 'STREAMING' | 'DISCONNECTED' | 'PAUSED' | 'ERROR';
  packetRateHz: number;
  latencyMs: number;
  totalPackets: number;
  authType: 'mTLS' | 'API_KEY' | 'BEARER' | 'NONE';
  lastPayload?: any;
  lastUpdated: string;
}

export interface AppIntegrationBridge {
  id: string;
  targetApp: 'n8n' | 'supabase' | 'excel' | 'sql' | 'word' | 'custom_api';
  name: string;
  webhookUrl: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  payloadTemplate: string;
  lastSyncTimestamp: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED';
  syncedRecordCount: number;
}

export interface ScriptExecutionResult {
  taskId: string;
  language: 'python' | 'javascript';
  code: string;
  stdout: string[];
  returnedValue: any;
  executionTimeMs: number;
  success: boolean;
  errorMsg?: string;
  assertionsResult?: { name: string; passed: boolean }[];
}

export interface AiTaskStep {
  stepNumber: number;
  action: string;
  system: string;
  status: 'pending' | 'executing' | 'completed' | 'blocked';
  resultNote: string;
}

export interface AiTaskExecutionPlan {
  prompt: string;
  intentSummary: string;
  detailedExplanation: string;
  targetSystems: string[];
  scriptSnippet: string;
  scriptLanguage: 'python' | 'javascript';
  steps: AiTaskStep[];
  safetyAuditGate: {
    passed: boolean;
    advisoryWarning: string;
    zeroWriteConfirmed: boolean;
  };
  executionStatus: 'planned' | 'executing' | 'completed' | 'vetoed';
}

/**
 * ====================================================================
 * PHASE D: PREDICTIVE MODELS & DRIFT DETECTION TYPES
 * ====================================================================
 */

export interface PsiBin {
  binIndex: number;
  lowerBound: number;
  upperBound: number;
  baselineCount: number;
  targetCount: number;
  baselinePct: number;
  targetPct: number;
  psiContribution: number;
}

export interface PsiResult {
  metricName: string;
  psi: number;
  driftLevel: 'STABLE' | 'MODERATE_DRIFT' | 'SIGNIFICANT_DRIFT';
  recommendation: string;
  bins: PsiBin[];
  baselineSampleSize: number;
  targetSampleSize: number;
}

export interface KolmogorovSmirnovResult {
  featureName: string;
  ksStatisticD: number;
  criticalValueD: number;
  pValue: number;
  alpha: number;
  driftDetected: boolean;
  baselineSize: number;
  targetSize: number;
  maxDiscrepancyX: number;
}

export interface PageHinkleyPoint {
  index: number;
  timestamp: string;
  residual: number;
  cumulativeU: number;
  phStatistic: number;
  isDriftAlarm: boolean;
}

export interface PageHinkleyResult {
  driftDetected: boolean;
  driftCount: number;
  alarmIndices: number[];
  firstAlarmIndex: number | null;
  deltaBias: number;
  thresholdLambda: number;
  points: PageHinkleyPoint[];
}

export interface LeakageViolation {
  ruleId: 'TIME_ORDER_VIOLATION' | 'GROUP_LEAKAGE' | 'TARGET_LOOKAHEAD' | 'OVERLAPPING_WINDOWS';
  severity: 'CRITICAL_LEAKAGE' | 'WARNING';
  description: string;
  affectedRecords: number;
  evidence: string;
}

export interface GroupTimeLeakageAuditResult {
  passed: boolean;
  violations: LeakageViolation[];
  trainSplitInfo: { startTime: string; endTime: string; totalRecords: number; groupIds: string[] };
  testSplitInfo: { startTime: string; endTime: string; totalRecords: number; groupIds: string[] };
  recommendation: string;
}

export interface RulPredictionRecord {
  unitId: string;
  cycle: number;
  trueRul: number;
  predictedRul: number;
  error: number; // predicted - true
  cmapssScore: number;
}

export interface RulEvaluationResult {
  sampleCount: number;
  cmapssTotalScore: number;
  meanCmapssScore: number;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  earlyPredictionCount: number; // d < 0 (conservative)
  latePredictionCount: number;  // d >= 0 (dangerous)
  maxLateError: number;
  maxEarlyError: number;
  records: RulPredictionRecord[];
}

export interface AnomalyScorePoint {
  timestamp: string;
  assetId: string;
  features: Record<string, number>;
  mahalanobisDistance: number;
  isAnomaly: boolean;
  reconstructionError: number;
}

export interface MultivariateAnomalyResult {
  totalAnalyzed: number;
  anomaliesDetected: number;
  anomalyRatePct: number;
  chiSquareThreshold: number;
  points: AnomalyScorePoint[];
  featureWeights: Record<string, number>;
}

/**
 * ====================================================================
 * PHASE F: RISK ANALYSIS (FMEA, FTA, RBD) TYPES
 * ====================================================================
 */

export type AiagVdaActionPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FmeaRow {
  id: string;
  itemFunction: string;
  potentialFailureMode: string;
  potentialEffect: string;
  severity: number; // 1 - 10
  potentialCause: string;
  occurrence: number; // 1 - 10
  currentControls: string;
  detection: number; // 1 - 10
  rpn: number; // S * O * D (historical reference)
  actionPriority: AiagVdaActionPriority; // AIAG-VDA 1st Ed
  actionRequired: string;
  hasDuplicateRpnAnomaly?: boolean;
}

export interface FmeaAuditSummary {
  totalFailureModes: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  duplicateRpnWarnings: string[];
  maxSeverityMode: string;
}

export type FtaGateType = 'AND' | 'OR' | 'VOTE_2_OF_3';

export interface FtaNode {
  id: string;
  name: string;
  type: 'GATE' | 'BASIC_EVENT';
  gateType?: FtaGateType;
  failureProbability?: number; // For BASIC_EVENT
  childrenIds?: string[];
  description: string;
}

export interface MinimalCutSet {
  eventIds: string[];
  eventNames: string[];
  order: number;
  probability: number;
}

export interface BirnbaumImportance {
  eventId: string;
  eventName: string;
  baseProbability: number;
  birnbaumScore: number;
  criticalityScore: number;
}

export interface FtaAnalysisResult {
  topEventName: string;
  topEventProbability: number;
  minimalCutSets: MinimalCutSet[];
  totalCutSetsCount: number;
  birnbaumImportances: BirnbaumImportance[];
  rarestCutSetProbability: number;
  mostCriticalEvent: string;
}

