export type DataType = 'integer' | 'float' | 'string' | 'boolean' | 'datetime' | 'categorical';

export interface ColumnProfile {
  name: string;
  type: DataType;
  totalCount: number;
  nullCount: number;
  nullPercentage: number;
  distinctCount: number;
  uniquePercentage: number;
  sampleValues: (string | number | boolean | null)[];
  // Numeric stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  skewness?: number;
  kurtosis?: number;
  // Categorical stats
  topValues?: { value: string; count: number; percentage: number }[];
}

export interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  memoryEstimateBytes: number;
  duplicateRowCount: number;
  columns: ColumnProfile[];
  summaryCalculatedAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  version: number;
  isImmutableSource: boolean;
  parentDatasetId?: string;
  sourceType: 'sample' | 'csv_upload' | 'json_upload' | 'sql_result' | 'cleaned_output' | 'chunked_stream_upload' | 'exascale_stream' | 'excel_workbook';
  sha256Hash: string;
  createdAt: string;
  data: Record<string, any>[];
  profile: DatasetProfile;
  columns: string[];
  rawSourceText?: string;
}

// WF02 Data Quality
export type AssertionType =
  | 'expect_column_values_to_not_be_null'
  | 'expect_column_values_to_be_unique'
  | 'expect_column_values_to_be_between'
  | 'expect_column_values_to_match_regex'
  | 'expect_column_values_to_be_in_set'
  | 'expect_table_row_count_to_be_between'
  | 'expect_column_mean_to_be_between';

export interface DataQualityAssertion {
  id: string;
  type: AssertionType;
  column?: string;
  parameters: {
    min?: number;
    max?: number;
    pattern?: string;
    allowedValues?: string[];
  };
  severity: 'error' | 'warning';
  description: string;
}

export interface AssertionResult {
  assertionId: string;
  assertionType: AssertionType;
  column?: string;
  status: 'passed' | 'failed' | 'warning';
  evaluatedRows: number;
  unexpectedRowsCount: number;
  unexpectedPercent: number;
  unexpectedExamples: any[];
  message: string;
}

export interface QualityValidationReport {
  timestamp: string;
  datasetId: string;
  totalAssertions: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  qualityScorePercent: number;
  results: AssertionResult[];
}

// WF03 Cleaning & Transformations
export type CleaningActionType =
  | 'drop_null_rows'
  | 'impute_nulls'
  | 'drop_duplicates'
  | 'filter_outliers_iqr'
  | 'clamp_outliers_iqr'
  | 'cast_type'
  | 'text_normalize'
  | 'drop_column'
  | 'add_computed_column';

export interface CleaningStep {
  id: string;
  timestamp: string;
  action: CleaningActionType;
  column?: string;
  parameters: {
    strategy?: 'mean' | 'median' | 'mode' | 'constant' | 'forward_fill';
    constantValue?: any;
    targetType?: DataType;
    textOperation?: 'trim' | 'lowercase' | 'uppercase' | 'remove_special';
    iqrMultiplier?: number;
    expression?: string;
    newColumnName?: string;
  };
  impactSummary: {
    affectedRows: number;
    description: string;
    nullsBefore: number;
    nullsAfter: number;
  };
}

// WF04 EDA & Stats
export interface CorrelationCell {
  colA: string;
  colB: string;
  pearson: number;
  spearman: number;
}

export interface HypothesisTestResult {
  testType: 't_test_two_sample' | 'chi_square_independence' | 'one_way_anova';
  name: string;
  hypothesis: {
    nullHypothesis: string;
    altHypothesis: string;
  };
  targetColumn: string;
  groupColumn?: string;
  secondaryColumn?: string;
  statisticName: string;
  statisticValue: number;
  pValue: number;
  degreesOfFreedom: number | string;
  alpha: number;
  conclusion: 'reject_null' | 'fail_to_reject_null';
  interpretation: string;
}

// WF05 Feature Engineering
export interface TrainTestSplitResult {
  trainRows: Record<string, any>[];
  testRows: Record<string, any>[];
  trainRatio: number;
  randomSeed: number;
  leakageAudit: {
    passed: boolean;
    duplicateRowsBetweenSplits: number;
    scalersFittedOnlyOnTrain: boolean;
    details: string;
  };
}

export interface FeatureTransformationConfig {
  targetColumn: string;
  taskType: 'classification' | 'regression';
  featuresToScale: { column: string; method: 'standard' | 'minmax' }[];
  categoricalToEncode: string[];
  datetimeColumns: string[];
  dropColumns: string[];
}

// WF07 Machine Learning
export interface ModelEvaluationMetrics {
  task: 'classification' | 'regression' | 'forecasting';
  modelName: string;
  isBaseline: boolean;
  trainingTimeMs: number;
  // Classification
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  confusionMatrix?: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  // Regression
  mae?: number;
  mse?: number;
  rmse?: number;
  r2?: number;
  // Forecasting
  mape?: number;
  forecastPoints?: {
    date: string;
    actual?: number;
    forecast: number;
    lower80: number;
    upper80: number;
    lower95: number;
    upper95: number;
  }[];
  featureImportances?: { feature: string; importance: number }[];
}

export interface ModelArtifact {
  modelId: string;
  modelName: string;
  targetColumn: string;
  featuresUsed: string[];
  hyperparameters: Record<string, any>;
  evaluation: ModelEvaluationMetrics;
  createdAt: string;
}

// WF09 Analysis Manifest
export interface AnalysisManifest {
  manifestId: string;
  generatedAt: string;
  studioVersion: string;
  datasetMetadata: {
    sourceName: string;
    rawSha256: string;
    rawRows: number;
    activeRows: number;
    lineageSteps: string[];
  };
  transformationsAudit: CleaningStep[];
  dataQualitySummary: {
    assertionsEvaluated: number;
    passRate: number;
    status: 'compliant' | 'warning' | 'violations';
  };
  statisticalAssumptions: string[];
  limitations: string[];
  modelSummary?: {
    chosenModel: string;
    testMetrics: Record<string, number>;
  };
  judgeAudit?: {
    engine: string;
    verdict: string;
    checksPassed?: number;
    totalChecksEvaluated?: number;
    passRatePercent?: number;
    roundsEvaluated?: number;
    confidenceScorePercent?: number;
    lessonsEnforcedCount: number;
    seededErrorsVerified?: string;
    criticalFlaws: number;
    antiLeakageCompliant: boolean;
    lineageSha256Certified: boolean;
    certifiedAt: string;
  };
}

// WF10 Orchestration & Pipeline
export interface PipelineNode {
  id: string;
  code: string;
  title: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'warning';
  durationMs?: number;
  lastRun?: string;
  logMessages: string[];
}

export interface PipelineRunRecord {
  runId: string;
  startedAt: string;
  completedAt: string;
  status: 'success' | 'failed' | 'partial';
  nodesExecuted: number;
  durationMs: number;
  trigger: 'manual' | 'schedule' | 'api';
}

// WF11 Future Science & Causal Discovery
export interface CausalNode {
  id: string;
  name: string;
  type: 'treatment' | 'outcome' | 'confounder' | 'mediator';
  baselineMean: number;
  currentValue: number;
  min: number;
  max: number;
}

export interface CausalEdge {
  from: string;
  to: string;
  weight: number;
  pVal: number;
  isDirectCausal: boolean;
  mechanismDesc: string;
}

export interface CausalModel {
  nodes: CausalNode[];
  edges: CausalEdge[];
  ate: number; // Average Treatment Effect
  refutationScore: number; // Invariance under random confounders (0-1)
}

export interface ScientificHypothesis {
  id: string;
  title: string;
  statement: string;
  domain: 'genomics' | 'drug_discovery' | 'causal_macro' | 'clinical' | 'materials';
  plausibilityScore: number;
  informationGainBits: number;
  proposedExperiment: string;
  validationStatus: 'candidate' | 'accepted' | 'rejected' | 'under_review';
  userFeedbackNote?: string;
  createdAt: string;
}

export interface EraFormula {
  name: string;
  latex: string;
  description: string;
  physicalSignificance: string;
  variables: { symbol: string; label: string; unit: string }[];
}

export interface FutureEraMilestone {
  era: string;
  years: string;
  theme: string;
  flagshipBreakthroughs: string[];
  computationParadigm: string;
  humanRole: string;
  paradigmShift: string;
  formulae?: EraFormula[];
}

