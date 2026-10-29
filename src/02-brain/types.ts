export type BrainComponentState = 'idle' | 'analyzing' | 'alert';

export interface DriftMetric {
  feature: string;
  psi: number; // Population Stability Index
  ksPValue: number; // Kolmogorov-Smirnov p-value
  status: 'stable' | 'moderate' | 'critical';
  baselineMean: number;
  currentMean: number;
  varianceShiftPct: number;
}

export interface AnomalyPoint {
  timestamp: string;
  value: number;
  expected: number;
  upperBound: number;
  lowerBound: number;
  anomalyScore: number;
  isAnomaly: boolean;
  severity: 'normal' | 'warning' | 'critical';
}

export interface CausalNode {
  id: string;
  label: string;
  type: 'treatment' | 'outcome' | 'confounder' | 'mediator';
  x: number;
  y: number;
  baseValue: number;
}

export interface CausalEdge {
  from: string;
  to: string;
  weight: number;
  pValue: number;
  isConfounded: boolean;
}

export interface ManifoldPoint {
  id: number;
  x: number;
  y: number;
  z: number;
  cluster: number;
  label: string;
  density: number;
  isAnomaly?: boolean;
}
