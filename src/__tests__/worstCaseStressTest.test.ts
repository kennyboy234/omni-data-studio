import { describe, it, expect } from 'vitest';
import { parseCSV } from '../utils/csvParser';
import { executeSQL } from '../utils/sqlEngine';
import {
  computeForwardKinematics,
  solveInverseKinematicsDLS,
  generateTrapezoidalProfile,
  calculateMotorSizing,
  evaluateNioshLifting,
} from '../utils/roboticsEngine';
import {
  RobotBrainNeuralNet,
  trainRobotBrainModel,
  evaluateMachineryDiagnostics,
  calculateAsymmetricRulScore,
} from '../utils/robotBrainTraining';
import {
  auditSensorTelemetryStream,
  computeMedianAndMad,
  TelemetryReading,
} from '../utils/industrialQuality';
import {
  evaluateCustomMathFormula,
  QUANTUM_TUNNELING_MODEL,
  ALLOSTERIC_ENZYME_MODEL,
} from '../utils/aiReasoningEngine';
import { isBinaryGarbage, isZipOrExcelSignature } from '../utils/excelWorkbookParser';

describe('WORST-CASE CHAOS & ADVERSARIAL STRESS TEST SUITE', () => {
  describe('1. Ingestion & File Parsing Worst Cases', () => {
    it('handles empty string CSV without throwing uncaught exceptions', () => {
      const rows = parseCSV('');
      expect(rows).toEqual([]);
    });

    it('handles CSV with only header line and no records', () => {
      const rows = parseCSV('id,name,value\n');
      expect(rows).toEqual([]);
    });

    it('handles ragged CSV with mismatched row lengths, quoted delimiters, and unescaped commas', () => {
      const raggedCSV = `customer_id,company_name,revenue,notes
101,"Acme, Inc.",500000,"Regular customer, top tier"
102,"Global Tech",1200000
103,"Incomplete Corp"
104,"Extreme Multi-line Note with commas",950000,"Clean"`;

      const rows = parseCSV(raggedCSV);
      expect(rows.length).toBe(4);
      // Row 1 quoted comma preservation
      expect(rows[0]['company_name']).toBe('Acme, Inc.');
      expect(rows[0]['customer_id']).toBe(101);
      // Row 2 and 3 missing trailing columns safely converted to null
      expect(rows[1]['notes']).toBeNull();
      expect(rows[2]['revenue']).toBeNull();
    });

    it('detects binary garbage and prevents raw text decode corruption', () => {
      // Simulate raw binary garbage header (e.g. executable or corrupt byte array)
      const binaryBytes = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00]);
      expect(isBinaryGarbage(binaryBytes.buffer)).toBe(true);

      // Plain ASCII CSV text buffer should NOT be marked as binary garbage
      const textBytes = new TextEncoder().encode('id,name,score\n1,Alpha,95\n2,Beta,88\n');
      expect(isBinaryGarbage(textBytes.buffer)).toBe(false);
    });

    it('identifies PK Zip / XLSX magic bytes accurately', () => {
      const zipMagic = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
      expect(isZipOrExcelSignature(zipMagic.buffer)).toBe(true);

      const fakeFile = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      expect(isZipOrExcelSignature(fakeFile.buffer)).toBe(false);
    });
  });

  describe('2. SQL Guardrails & Destructive Injection Traps', () => {
    const mockTables = {
      active_data: [
        { id: 1, val: 10, category: 'A' },
        { id: 2, val: 20, category: 'B' },
      ],
    };

    it('blocks SQL injection attempting multiple destructive commands in single query', () => {
      const attacks = [
        "DROP TABLE active_data; SELECT * FROM active_data",
        "SELECT * FROM active_data; TRUNCATE TABLE active_data;",
        "ALTER TABLE active_data DROP COLUMN val",
        "DELETE FROM active_data WHERE 1=1",
      ];

      for (const atk of attacks) {
        const res = executeSQL(atk, mockTables, false);
        expect(res.isDestructiveAttempt).toBe(true);
        expect(res.error).toBeDefined();
        expect(res.error?.toLowerCase()).toContain('destructive');
      }
    });

    it('handles syntax errors and non-existent columns cleanly without crash', () => {
      const res = executeSQL('SELECT non_existent_column_xyz FROM active_data', mockTables);
      expect(res.rows.length).toBe(2);
      expect(res.rows[0].non_existent_column_xyz).toBeUndefined();
    });
  });

  describe('3. Robotics Singularity & Kinematic Boundary Worst Cases', () => {
    it('survives mechanical singularity in Inverse Kinematics without producing NaN coordinates', () => {
      // Planar arm fully stretched out along X-axis (classic singularity where J loses rank)
      const dhSingular = [
        { joint: 1, thetaDeg: 0, d: 0, a: 100, alphaDeg: 0 },
        { joint: 2, thetaDeg: 0, d: 0, a: 100, alphaDeg: 0 },
      ];

      // Request movement directly along singular direction
      const ikResult = solveInverseKinematicsDLS({
        targetPosition: [205, 0, 0], // beyond arm reach of 200mm
        currentThetasDeg: [0, 0],
        dhParams: dhSingular,
        dampingFactorLambda: 0.1, // DLS Levenberg damping prevents division by zero
        maxIterations: 30,
        toleranceMm: 1.0,
      });

      // Crucial test: Final joint thetas must remain finite numbers, NEVER NaN or Infinity
      for (const th of ikResult.finalThetasDeg) {
        expect(isNaN(th)).toBe(false);
        expect(isFinite(th)).toBe(true);
      }
      expect(isNaN(ikResult.finalErrorMm)).toBe(false);
    });

    it('gracefully handles physically unreachable target without hanging or crashing', () => {
      const dhArm = [
        { joint: 1, thetaDeg: 0, d: 0, a: 150, alphaDeg: 0 },
        { joint: 2, thetaDeg: 0, d: 0, a: 150, alphaDeg: 0 },
      ];

      // Target at 50,000 mm (arm reach is only 300 mm)
      const ikResult = solveInverseKinematicsDLS({
        targetPosition: [50000, 50000, 0],
        currentThetasDeg: [0, 0],
        dhParams: dhArm,
        maxIterations: 20,
        toleranceMm: 1.0,
      });

      expect(ikResult.converged).toBe(false);
      expect(ikResult.iterations).toBe(20);
      expect(isFinite(ikResult.finalErrorMm)).toBe(true);
    });

    it('handles zero-distance and zero-velocity edge cases in Trapezoidal Profiler', () => {
      // 0 distance movement
      const zeroDist = generateTrapezoidalProfile(0, 100, 50);
      expect(zeroDist.totalDistance).toBe(0);
      expect(zeroDist.totalTime).toBe(0);
      expect(zeroDist.samples.length).toBe(50);
      expect(zeroDist.samples[0].vel).toBe(0);

      // Negative distance movement
      const negDist = generateTrapezoidalProfile(-500, 100, 50);
      expect(negDist.totalDistance).toBe(-500);
      expect(negDist.totalTime).toBeGreaterThan(0);
      expect(negDist.samples[negDist.samples.length - 1].pos).toBeCloseTo(-500, 0);
    });

    it('handles extreme overload in Motor Sizing without division by zero', () => {
      const extremeMotor = calculateMotorSizing({
        loadMassKg: 100000, // 100 metric tons
        radiusM: 0.5,
        maxAccelerationMps2: 10.0,
        frictionTorqueNm: 50.0,
        operatingCycle: [
          { durationSec: 1.0, torqueNm: 50000 },
          { durationSec: 2.0, torqueNm: 25000 },
        ],
      });

      expect(isFinite(extremeMotor.peakTorqueNm)).toBe(true);
      expect(isFinite(extremeMotor.rmsTorqueNm)).toBe(true);
      expect(extremeMotor.safetyFactor).toBeGreaterThan(1.0);
    });
  });

  describe('4. AI Reasoning & Mathematical Worst Cases', () => {
    it('safely catches division by zero in custom formula evaluator', () => {
      const res = evaluateCustomMathFormula('100 / (x - 5)', { x: 5 });
      expect(res.judgeSanityCheck.passed).toBe(false);
      expect(res.judgeSanityCheck.critique).toContain('infinite divergence');
    });

    it('safely handles non-real results (negative sqrt) in formula evaluator', () => {
      const res = evaluateCustomMathFormula('sqrt(val)', { val: -49 });
      expect(res.judgeSanityCheck.passed).toBe(false);
      expect(isNaN(res.finalValue)).toBe(false); // clamped to 0
    });

    it('safely blocks malicious script injection in custom math formulas', () => {
      const res = evaluateCustomMathFormula('window.location = "http://evil.com"', {});
      // In sandbox, window is undefined or execution throws syntax error
      expect(res.judgeSanityCheck.passed).toBe(false);
    });

    it('handles Quantum Tunneling boundary condition when particle energy equals barrier height', () => {
      // E = V0 (classical threshold boundary where deltaV = 0)
      const res = QUANTUM_TUNNELING_MODEL.compute({
        d: 0.5,
        V0: 10.0,
        E: 10.0,
        mass_amu: 1.008,
      });

      expect(res.finalValue).toBeGreaterThan(0);
      expect(res.finalValue).toBeLessThanOrEqual(1.0);
    });

    it('handles Allosteric Hill Enzyme kinetics under extreme substrate depletion [S] = 0', () => {
      const res = ALLOSTERIC_ENZYME_MODEL.compute({
        Vmax: 100,
        S: 0,
        Km: 10,
        n: 2.0,
        I: 5,
        Ki: 2,
      });

      expect(res.finalValue).toBe(0);
      expect(res.judgeSanityCheck.passed).toBe(true);
    });
  });

  describe('5. Sensor Telemetry Anomaly & Telemetry Stream Worst Cases', () => {
    it('handles zero-reading empty telemetry stream', () => {
      const audit = auditSensorTelemetryStream([], {
        tagId: 'empty_tag',
        tagName: 'Empty Tag',
        validRange: [0, 100],
        samplingRateHz: 10,
      });

      expect(audit.overallStatus).toBe('FAIL');
      expect(audit.blocksDownstreamAnalysis).toBe(true);
    });

    it('handles single-reading stream without crashing MAD or Z-score', () => {
      const singleReading: TelemetryReading[] = [
        { timestamp: new Date().toISOString(), value: 42.0, tagId: 't1', tagName: 'Tag 1' },
      ];

      const audit = auditSensorTelemetryStream(singleReading, {
        tagId: 't1',
        tagName: 'Tag 1',
        validRange: [0, 100],
        samplingRateHz: 10,
      });

      expect(audit.checks.length).toBeGreaterThan(0);
      expect(audit.overallStatus).toBe('PASS');
    });

    it('handles extreme outlier floating point numbers (1e12) without crashing MAD calculation', () => {
      const readings: TelemetryReading[] = [];
      const base = Date.now();
      for (let i = 0; i < 20; i++) {
        readings.push({
          timestamp: new Date(base + i * 100).toISOString(),
          value: i === 10 ? 1e12 : 25.0 + (i % 2),
          tagId: 't2',
          tagName: 'Extreme Spike Tag',
        });
      }

      const audit = auditSensorTelemetryStream(readings, {
        tagId: 't2',
        tagName: 'Extreme Spike Tag',
        validRange: [0, 50],
        samplingRateHz: 10,
      });

      expect(audit.overallStatus).toBe('FAIL');
      const spikeCheck = audit.checks.find((c) => c.checkName.includes('Spike'));
      expect(spikeCheck?.status).toBe('WARNING');
      const rangeCheck = audit.checks.find((c) => c.checkName.includes('Range'));
      expect(rangeCheck?.status).toBe('FAIL');
    });

    it('handles retro-grade clock skew and duplicate timestamps', () => {
      const base = Date.now();
      const corruptedTimestamps: TelemetryReading[] = [
        { timestamp: new Date(base).toISOString(), value: 10, tagId: 't3', tagName: 'Clock Skew' },
        { timestamp: new Date(base).toISOString(), value: 11, tagId: 't3', tagName: 'Clock Skew' }, // Duplicate
        { timestamp: new Date(base - 5000).toISOString(), value: 12, tagId: 't3', tagName: 'Clock Skew' }, // Retrograde
      ];

      const audit = auditSensorTelemetryStream(corruptedTimestamps, {
        tagId: 't3',
        tagName: 'Clock Skew',
        validRange: [0, 100],
        samplingRateHz: 1,
      });

      const timeCheck = audit.checks.find((c) => c.checkName.includes('Monotonicity'));
      expect(timeCheck?.failingRowsCount).toBeGreaterThan(0);
    });
  });

  describe('6. Machine Learning & Predictive Degradation Worst Cases', () => {
    it('prevents overflow in NASA C-MAPSS asymmetric scoring under extreme late prediction error', () => {
      // If predicted RUL is 0 and actual is 500 (d = -500), exp(-(-500)/13) could overflow Infinity
      const actual = [500];
      const predicted = [0]; // extreme late prediction
      const score = calculateAsymmetricRulScore(actual, predicted);

      expect(isFinite(score)).toBe(true);
      expect(score).toBeGreaterThan(0);
    });

    it('trains Robot Brain Neural Net on constant-target degenerate data without NaN weights', () => {
      // Degenerate inputs where all inputs and targets are zero
      const zeroInputs = [[0, 0], [0, 0], [0, 0]];
      const zeroTargets = [[0], [0], [0]];

      const net = new RobotBrainNeuralNet([2, 4, 1], 'relu', 0.01, 123);
      const { finalLoss } = trainRobotBrainModel(net, zeroInputs, zeroTargets, 10);

      expect(isFinite(finalLoss)).toBe(true);
      const pred = net.predict([0, 0]);
      expect(isFinite(pred[0])).toBe(true);
    });
  });
});
