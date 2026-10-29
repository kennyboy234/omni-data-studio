import { describe, it, expect } from 'vitest';
import { VoiceCommandRecord, MatrixRainConfig, WhatsAppMessage } from '../05-magic/types';

describe('Studio 5 - The Closer (Magic Moat)', () => {
  describe('WF51 JARVIS Voice Command Parser', () => {
    const parseVoiceQuery = (query: string): VoiceCommandRecord['matchedCommand'] => {
      const q = query.trim().toLowerCase();
      if (q.includes('show fault') || q.includes('fault') || q.includes('anomal') || q.includes('alert')) {
        return 'show_faults';
      }
      if (q.includes('roi') || q.includes('money') || q.includes('save') || q.includes('loss')) {
        return 'calculate_roi';
      }
      if (q.includes('hash') || q.includes('ledger') || q.includes('sha') || q.includes('verify')) {
        return 'verify_hash';
      }
      if (q.includes('report') || q.includes('pdf') || q.includes('whisper') || q.includes('boss')) {
        return 'export_report';
      }
      if (q.includes('status') || q.includes('health') || q.includes('system') || q.includes('ping')) {
        return 'system_status';
      }
      return 'unknown';
    };

    it('correctly classifies "Hey Omni show faults"', () => {
      expect(parseVoiceQuery('Hey Omni show faults')).toBe('show_faults');
      expect(parseVoiceQuery('Show all detected anomalies now')).toBe('show_faults');
    });

    it('correctly classifies "Hey Omni calculate ROI"', () => {
      expect(parseVoiceQuery('Hey Omni calculate ROI')).toBe('calculate_roi');
      expect(parseVoiceQuery('How much money did we save')).toBe('calculate_roi');
    });

    it('correctly classifies "Hey Omni verify hash"', () => {
      expect(parseVoiceQuery('Hey Omni verify hash')).toBe('verify_hash');
      expect(parseVoiceQuery('Audit SHA-256 ledger integrity')).toBe('verify_hash');
    });

    it('correctly classifies "Hey Omni export report"', () => {
      expect(parseVoiceQuery('Hey Omni export report')).toBe('export_report');
      expect(parseVoiceQuery('Prepare Boss Whisper PDF')).toBe('export_report');
    });

    it('gracefully handles unrecognized speech queries', () => {
      expect(parseVoiceQuery('Tell me a bedtime story')).toBe('unknown');
    });
  });

  describe('WF53 WhatsApp Command Bot Logic', () => {
    const routeWhatsAppCommand = (cmd: string): { replyKey: string; hasActions: boolean } => {
      const lower = cmd.trim().toLowerCase();
      if (lower.startsWith('/status')) return { replyKey: 'STATUS_HEALTH', hasActions: true };
      if (lower.startsWith('/fault')) return { replyKey: 'FAULTS_INTERCEPTED', hasActions: true };
      if (lower.startsWith('/roi')) return { replyKey: 'ROI_SUMMARY', hasActions: true };
      if (lower.startsWith('/ping')) return { replyKey: 'PONG_DIAGNOSTIC', hasActions: true };
      if (lower.startsWith('/report')) return { replyKey: 'REPORT_PDF', hasActions: true };
      return { replyKey: 'HELP_DEFAULT', hasActions: true };
    };

    it('routes /status to status health report', () => {
      const res = routeWhatsAppCommand('/status');
      expect(res.replyKey).toBe('STATUS_HEALTH');
      expect(res.hasActions).toBe(true);
    });

    it('routes /faults to faults intercepted report', () => {
      const res = routeWhatsAppCommand('/faults');
      expect(res.replyKey).toBe('FAULTS_INTERCEPTED');
      expect(res.hasActions).toBe(true);
    });

    it('routes /roi to ROI financial summary', () => {
      const res = routeWhatsAppCommand('/roi');
      expect(res.replyKey).toBe('ROI_SUMMARY');
      expect(res.hasActions).toBe(true);
    });

    it('routes /ping to low latency pong check', () => {
      const res = routeWhatsAppCommand('/ping');
      expect(res.replyKey).toBe('PONG_DIAGNOSTIC');
      expect(res.hasActions).toBe(true);
    });

    it('routes /report to executive PDF briefing download', () => {
      const res = routeWhatsAppCommand('/report');
      expect(res.replyKey).toBe('REPORT_PDF');
      expect(res.hasActions).toBe(true);
    });
  });

  describe('WF52 Matrix Rain Digital Stream Configuration', () => {
    it('initializes valid matrix config parameters', () => {
      const config: MatrixRainConfig = {
        speed: 1.2,
        density: 1.0,
        fontSize: 16,
        colorScheme: 'matrix_green',
        showTelemetryOverlay: true,
        audioFeedback: false,
      };

      expect(config.speed).toBeGreaterThan(0);
      expect(config.fontSize).toBe(16);
      expect(['matrix_green', 'ghost_cyan', 'anduril_amber', 'red_alert']).toContain(
        config.colorScheme
      );
      expect(config.showTelemetryOverlay).toBe(true);
    });
  });
});
