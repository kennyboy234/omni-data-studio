import { describe, it, expect } from 'vitest';
import {
  determineAiagVdaAP,
  auditFmeaTable,
  evaluateFaultTree,
  calculateSeriesReliability,
  calculateParallelReliability,
  calculateKOutOfNReliability,
} from '../utils/riskAnalysisEngine';
import { FtaNode } from '../types/industrial';

describe('Phase F: Risk Analysis Engine (FMEA, FTA, RBD) Suite', () => {
  // 1. AIAG-VDA Action Priority
  describe('determineAiagVdaAP', () => {
    it('classifies severe safety hazards (S=10) with moderate occurrence as HIGH priority', () => {
      const ap = determineAiagVdaAP(10, 4, 3);
      expect(ap).toBe('HIGH');
    });

    it('classifies low severity (S=2) as LOW priority even with higher occurrence and detection', () => {
      const ap = determineAiagVdaAP(2, 4, 5);
      expect(ap).toBe('LOW');
    });

    it('returns LOW unconditionally for negligible severity (S=1)', () => {
      expect(determineAiagVdaAP(1, 10, 10)).toBe('LOW');
    });
  });

  // 2. FMEA Audit & Duplicate-RPN Warning
  describe('auditFmeaTable', () => {
    it('detects duplicate-RPN anomaly where identical RPN has divergent Action Priorities', () => {
      const rows = [
        {
          id: 'FMEA_01',
          itemFunction: 'Battery Pack Contactor',
          potentialFailureMode: 'Welded Contactor Contacts',
          potentialEffect: 'High-voltage arc and inability to isolate traction battery',
          severity: 10,
          potentialCause: 'Over-current inrush during DC fast charging',
          occurrence: 2,
          currentControls: 'Pre-charge resistor circuit',
          detection: 2,
          actionRequired: 'Dual redundant pyro-switch pyrotechnic disconnect fuse',
        },
        {
          id: 'FMEA_02',
          itemFunction: 'Chassis Trim Clip',
          potentialFailureMode: 'Loose Fastener',
          potentialEffect: 'Audible interior rattle at highway speeds',
          severity: 2,
          potentialCause: 'Operator misalignment during assembly',
          occurrence: 4,
          currentControls: 'Visual inspection',
          detection: 5,
          actionRequired: 'Automated torque feedback screw driver',
        },
      ];

      // Note:
      // Row 1: S=10, O=2, D=2 => RPN = 40 (S=10, O=2, D=2 -> AP = MEDIUM)
      // Row 2: S=2, O=4, D=5  => RPN = 40 (S=2, O=4, D=5  -> AP = LOW)
      const audit = auditFmeaTable(rows);
      expect(audit.processedRows[0].rpn).toBe(40);
      expect(audit.processedRows[1].rpn).toBe(40);
      expect(audit.processedRows[0].actionPriority).not.toBe(audit.processedRows[1].actionPriority);
      expect(audit.processedRows[0].hasDuplicateRpnAnomaly).toBe(true);
      expect(audit.processedRows[1].hasDuplicateRpnAnomaly).toBe(true);
      expect(audit.summary.duplicateRpnWarnings.length).toBeGreaterThan(0);
      expect(audit.summary.duplicateRpnWarnings[0]).toContain('RPN = 40');
    });
  });

  // 3. Fault Tree Analysis & Mokus Minimal Cut Sets
  describe('evaluateFaultTree', () => {
    it('applies Mokus algorithm and Boolean absorption to extract minimal cut sets', () => {
      // Classic Industrial Fire Suppression Fault Tree:
      // Top: Fire Suppression Inoperative (OR gate)
      // - Event A: Loss of Main Sensor Controller (Basic event, q = 0.005)
      // - Gate G1: Water Pumping Delivery Fails (AND gate)
      //   - Event B: Primary Pump Fails (Basic event, q = 0.01)
      //   - Event C: Secondary Backup Pump Fails (Basic event, q = 0.01)
      const nodes: FtaNode[] = [
        {
          id: 'TOP_EVENT',
          name: 'Fire Suppression Inoperative',
          type: 'GATE',
          gateType: 'OR',
          childrenIds: ['EVENT_SENSOR', 'GATE_PUMPS'],
          description: 'Loss of facility fire extinguishing capacity',
        },
        {
          id: 'GATE_PUMPS',
          name: 'Total Pumping Delivery Failure',
          type: 'GATE',
          gateType: 'AND',
          childrenIds: ['EVENT_PUMP_A', 'EVENT_PUMP_B'],
          description: 'Both primary and secondary redundant pumps failed',
        },
        {
          id: 'EVENT_SENSOR',
          name: 'Optical Flame Sensor Controller Outage',
          type: 'BASIC_EVENT',
          failureProbability: 0.005,
          description: 'Single point sensor failure',
        },
        {
          id: 'EVENT_PUMP_A',
          name: 'Primary Centrifugal Pump Seizure',
          type: 'BASIC_EVENT',
          failureProbability: 0.01,
          description: 'Mechanical bearing seizure',
        },
        {
          id: 'EVENT_PUMP_B',
          name: 'Backup Diesel Pump Ignition Failure',
          type: 'BASIC_EVENT',
          failureProbability: 0.01,
          description: 'Starter battery depletion',
        },
      ];

      const result = evaluateFaultTree(nodes, 'TOP_EVENT');
      expect(result.totalCutSetsCount).toBe(2);

      // Order 1 cut set: {EVENT_SENSOR}
      const singleOrder = result.minimalCutSets.find((c) => c.order === 1);
      expect(singleOrder).toBeDefined();
      expect(singleOrder!.eventIds).toEqual(['EVENT_SENSOR']);

      // Order 2 cut set: {EVENT_PUMP_A, EVENT_PUMP_B}
      const doubleOrder = result.minimalCutSets.find((c) => c.order === 2);
      expect(doubleOrder).toBeDefined();
      expect(doubleOrder!.eventIds.sort()).toEqual(['EVENT_PUMP_A', 'EVENT_PUMP_B'].sort());

      // Birnbaum importance: Sensor Outage is a single point of failure, so it has highest Birnbaum score
      const topImportance = result.birnbaumImportances[0];
      expect(topImportance.eventId).toBe('EVENT_SENSOR');
      expect(topImportance.birnbaumScore).toBeGreaterThan(0.9);
    });

    it('expands 2-of-3 voting redundancy gate accurately', () => {
      // Triple modular redundant (TMR) flight computer: 2-of-3 voting gate
      const nodes: FtaNode[] = [
        {
          id: 'TOP_TMR',
          name: 'Flight Computer System Loss',
          type: 'GATE',
          gateType: 'VOTE_2_OF_3',
          childrenIds: ['CPU_1', 'CPU_2', 'CPU_3'],
          description: '2 or more channel failures',
        },
        { id: 'CPU_1', name: 'Channel 1', type: 'BASIC_EVENT', failureProbability: 0.01, description: 'Ch 1' },
        { id: 'CPU_2', name: 'Channel 2', type: 'BASIC_EVENT', failureProbability: 0.01, description: 'Ch 2' },
        { id: 'CPU_3', name: 'Channel 3', type: 'BASIC_EVENT', failureProbability: 0.01, description: 'Ch 3' },
      ];

      const result = evaluateFaultTree(nodes, 'TOP_TMR');
      // 2-of-3 produces exactly 3 cut sets of order 2: {1,2}, {2,3}, {1,3}
      expect(result.totalCutSetsCount).toBe(3);
      result.minimalCutSets.forEach((mcs) => {
        expect(mcs.order).toBe(2);
      });
    });
  });

  // 4. Reliability Block Diagrams (RBD)
  describe('RBD Analytical Calculations', () => {
    it('computes Series system reliability R_sys = prod(R_i)', () => {
      const rels = [0.99, 0.95, 0.98];
      const rSys = calculateSeriesReliability(rels);
      expect(rSys).toBeCloseTo(0.92169, 4);
    });

    it('computes Parallel redundant system reliability R_sys = 1 - prod(1 - R_i)', () => {
      const rels = [0.9, 0.9];
      const rSys = calculateParallelReliability(rels);
      expect(rSys).toBe(0.99);
    });

    it('computes k-out-of-n active redundancy accurately', () => {
      // 2-out-of-3 with R = 0.9: 3*(0.9^2)*(0.1) + 0.9^3 = 0.243 + 0.729 = 0.972
      const rSys = calculateKOutOfNReliability(2, 3, 0.9);
      expect(rSys).toBe(0.972);
    });
  });
});
