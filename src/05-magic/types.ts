export interface VoiceCommandRecord {
  id: string;
  timestamp: string;
  query: string;
  matchedCommand: 'show_faults' | 'calculate_roi' | 'verify_hash' | 'export_report' | 'system_status' | 'unknown';
  responseText: string;
  confidence: number;
  executionMs: number;
  status: 'executed' | 'unrecognized';
}

export interface MatrixRainConfig {
  speed: number;
  density: number;
  fontSize: number;
  colorScheme: 'matrix_green' | 'ghost_cyan' | 'anduril_amber' | 'red_alert';
  showTelemetryOverlay: boolean;
  audioFeedback: boolean;
}

export interface WhatsAppMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  actions?: Array<{ label: string; command: string }>;
}
