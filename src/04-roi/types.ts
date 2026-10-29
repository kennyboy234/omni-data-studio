export interface CostConfig {
  downtimeCostPerHour: number;
  dataCorruptionCostPerRecord: number;
  criticalIncidentCost: number;
  engineeringHourCost: number;
  falsePositiveCost: number;
}

export interface PreventedFaultItem {
  id: string;
  timestamp: string;
  type: 'downtime' | 'corruption' | 'incident' | 'leakage' | 'drift';
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  costPreventedUsd: number;
  detectedBy: string;
  mitigationTimeSec: number;
}

export type WidgetType =
  | 'kpi_roi'
  | 'kpi_faults'
  | 'chart_drift'
  | 'chart_savings'
  | 'table_incidents'
  | 'gauge_health'
  | 'boss_whisper_card'
  | 'crypto_seal';

export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  w: number; // grid column width 6 (half) or 12 (full)
  h: number; // grid row height
  data?: any;
}
