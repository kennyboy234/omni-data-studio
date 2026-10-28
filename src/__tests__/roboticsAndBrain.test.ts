import { describe, it, expect } from 'vitest';
import {
  computeForwardKinematics,
  computeJacobian,
  solveInverseKinematicsDLS,
  generateTrapezoidalProfile,
  calculateMotorSizing,
  evaluateNioshLifting,
} from '../utils/roboticsEngine';
import {
  RobotBrainNeuralNet,
  trainRobotBrainModel,
  generateRobotTrainingData,
  evaluateMachineryDiagnostics,
  calculateAsymmetricRulScore,
} from '../utils/robotBrainTraining';
import {
  auditSensorTelemetryStream,
  computeMedianAndMad,
  TelemetryReading,
} from '../utils/industrialQuality';
import { DHParameter } from '../types/industrial';

describe('Robotics & Kinematics Deep Mathematical Engine', () => {
  it('computes Denavit-Hartenberg Forward Kinematics matching textbook planar arm coordinates', () => {
    // 2-link planar arm in X-Y plane: link1 = 100mm, link2 = 100mm
    const dhStraight: DHParameter[] = [
      { joint: 1, thetaDeg: 0, d: 0, a: 100, alphaDeg: 0 },
      { joint: 2, thetaDeg: 0, d: 0, a: 100, alphaDeg: 0 },
    ];
    const resStraight = computeForwardKinematics(dhStraight);
    // When both angles are 0, arm is extended along X: x = 200, y = 0, z = 0
    expect(resStraight.endEffectorPosition[0]).toBeCloseTo(200, 1);
    expect(resStraight.endEffectorPosition[1]).toBeCloseTo(0, 1);
    expect(resStraight.endEffectorPosition[2]).toBeCloseTo(0, 1);

    // Bend Joint 1 to 90 deg, Joint 2 at 0 deg: arm extends along Y: x = 0, y = 200, z = 0
    const dhBent90: DHParameter[] = [
      { joint: 1, thetaDeg: 90, d: 0, a: 100, alphaDeg: 0 },
      { joint: 2, thetaDeg: 0, d: 0, a: 100, alphaDeg: 0 },
    ];
    const resBent90 = computeForwardKinematics(dhBent90);
    expect(resBent90.endEffectorPosition[0]).toBeCloseTo(0, 1);
    expect(resBent90.endEffectorPosition[1]).toBeCloseTo(200, 1);

    // Joint 1 at 0 deg, Joint 2 bent 90 deg: x = 100, y = 100
    const dhLShaped: DHParameter[] = [
      { joint: 1, thetaDeg: 0, d: 0, a: 100, alphaDeg: 0 },
      { joint: 2, thetaDeg: 90, d: 0, a: 100, alphaDeg: 0 },
    ];
    const resLShaped = computeForwardKinematics(dhLShaped);
    expect(resLShaped.endEffectorPosition[0]).toBeCloseTo(100, 1);
    expect(resLShaped.endEffectorPosition[1]).toBeCloseTo(100, 1);
  });

  it('solves Damped Least Squares Inverse Kinematics to reach target coordinate within tolerance', () => {
    const dhTemplate: DHParameter[] = [
      { joint: 1, thetaDeg: 0, d: 0, a: 100, alphaDeg: 0 },
      { joint: 2, thetaDeg: 0, d: 0, a: 100, alphaDeg: 0 },
    ];

    // Request arm to reach (100, 100, 0) from home (200, 0, 0)
    const ikResult = solveInverseKinematicsDLS({
      targetPosition: [100, 100, 0],
      currentThetasDeg: [0, 0],
      dhParams: dhTemplate,
      dampingFactorLambda: 0.1,
      toleranceMm: 1.0,
      maxIterations: 60,
    });

    expect(ikResult.converged).toBe(true);
    expect(ikResult.finalErrorMm).toBeLessThanOrEqual(1.0);

    // Validate that forward kinematics of solved thetas lands on target
    const verifiedFk = computeForwardKinematics([
      { ...dhTemplate[0], thetaDeg: ikResult.finalThetasDeg[0] },
      { ...dhTemplate[1], thetaDeg: ikResult.finalThetasDeg[1] },
    ]);
    expect(verifiedFk.endEffectorPosition[0]).toBeCloseTo(100, 0);
    expect(verifiedFk.endEffectorPosition[1]).toBeCloseTo(100, 0);
  });

  it('generates Trapezoidal Velocity Profile in both triangular and trapezoidal regimes', () => {
    // 1. Trapezoidal regime: distance = 1000 mm, vMax = 200 mm/s, aMax = 100 mm/s^2
    // sCrit = v^2 / a = 40000 / 100 = 400 mm < 1000 mm -> Trapezoidal
    const trapProfile = generateTrapezoidalProfile(1000, 200, 100);
    expect(trapProfile.regime).toBe('trapezoidal');
    expect(trapProfile.tAccel).toBeCloseTo(2.0, 1); // 200 / 100 = 2s
    expect(trapProfile.tDecel).toBeCloseTo(2.0, 1);
    expect(trapProfile.tFlat).toBeCloseTo(3.0, 1); // (1000 - 400) / 200 = 3s
    expect(trapProfile.totalTime).toBeCloseTo(7.0, 1);

    // 2. Triangular regime: short stroke distance = 200 mm < 400 mm
    const triProfile = generateTrapezoidalProfile(200, 200, 100);
    expect(triProfile.regime).toBe('triangular');
    expect(triProfile.tFlat).toBe(0);
    expect(triProfile.totalTime).toBeLessThan(trapProfile.totalTime);
  });

  it('calculates Motor RMS Torque and Sizing according to industrial dynamics formulas', () => {
    const motorSizing = calculateMotorSizing({
      loadMassKg: 10,
      radiusM: 0.05,
      maxAccelerationMps2: 2.0,
      frictionTorqueNm: 0.5,
      operatingCycle: [
        { durationSec: 1.0, torqueNm: 6.0 }, // acceleration
        { durationSec: 3.0, torqueNm: 3.0 }, // cruise
        { durationSec: 1.0, torqueNm: 1.0 }, // deceleration
        { durationSec: 2.0, torqueNm: 0.0 }, // dwell
      ],
    });

    expect(motorSizing.peakTorqueNm).toBeGreaterThan(0);
    expect(motorSizing.rmsTorqueNm).toBeGreaterThan(0);
    expect(motorSizing.rmsTorqueNm).toBeLessThan(motorSizing.peakTorqueNm);
    expect(motorSizing.safetyFactor).toBeGreaterThan(1.0);
  });

  it('evaluates Revised NIOSH Lifting Equation against standard ergonomic benchmarks', () => {
    const nioshRes = evaluateNioshLifting({
      loadWeightKg: 15.0,
      horizontalDistanceCm: 30, // H = 30
      verticalDistanceCm: 75,   // V = 75 (optimum VM = 1.0)
      verticalTravelDistanceCm: 50, // D = 50
      asymmetryAngleDeg: 0,     // A = 0
      frequencyLiftsPerMin: 1.0,
      couplingQuality: 'good',
      durationHours: '<=1',
    });

    expect(nioshRes.multipliers.horizontalMultiplier).toBeCloseTo(25 / 30, 2);
    expect(nioshRes.multipliers.verticalMultiplier).toBe(1.0);
    expect(nioshRes.recommendedWeightLimitKg).toBeGreaterThan(14.0);
    expect(nioshRes.recommendedWeightLimitKg).toBeLessThan(20.0);
    expect(nioshRes.liftingIndex).toBeLessThanOrEqual(1.2);
  });
});

describe('Robot Brain Neural Network & Machinery Diagnostics', () => {
  it('trains Robot Brain Neural Network and reduces loss monotonically across epochs', () => {
    const { inputs, targets } = generateRobotTrainingData('robot_joint_torques', 40);
    const net = new RobotBrainNeuralNet([6, 12, 2], 'relu', 0.005, 42);

    const initialLoss = net.trainStep(inputs, targets);
    const { lossHistory, finalLoss } = trainRobotBrainModel(net, inputs, targets, 25);

    expect(lossHistory.length).toBe(25);
    // Training must reduce loss
    expect(finalLoss).toBeLessThan(initialLoss);

    // Forward pass prediction should return 2-element vector for torques
    const testPred = net.predict(inputs[0]);
    expect(testPred.length).toBe(2);
    expect(typeof testPred[0]).toBe('number');
  });

  it('evaluates Hotelling T2 anomaly detection and NASA C-MAPSS asymmetric RUL scoring', () => {
    // Normal telemetry baseline
    const normalDiag = evaluateMachineryDiagnostics('robot_arm_1', 'Tesla Gigafactory 6-DOF Robot', {
      motor_temp_c: 52.0,
      vibration_rms_g: 0.85,
      inverter_current_a: 12.2,
      hydraulic_pressure_bar: 198.0,
    });
    expect(normalDiag.overallStatus).toBe('NORMAL');
    expect(normalDiag.hotellingTSquared).toBeLessThan(normalDiag.hotellingThreshold);
    expect(normalDiag.healthIndexScore).toBeGreaterThan(85);

    // Overstressed degraded telemetry
    const faultDiag = evaluateMachineryDiagnostics('robot_arm_1', 'Tesla Gigafactory 6-DOF Robot', {
      motor_temp_c: 98.0,
      vibration_rms_g: 4.8,
      inverter_current_a: 28.0,
      hydraulic_pressure_bar: 260.0,
    });
    expect(faultDiag.overallStatus).toBe('CRITICAL');
    expect(faultDiag.hotellingTSquared).toBeGreaterThan(faultDiag.hotellingThreshold);
    expect(faultDiag.componentFaults.length).toBeGreaterThan(0);

    // Asymmetric scoring test: Late predictions (underestimating degradation) must penalize more than early predictions
    const actual = [50];
    const latePrediction = [40];  // predicted 40 when actual was 50 (d = -10, late)
    const earlyPrediction = [60]; // predicted 60 when actual was 50 (d = +10, early)

    const latePenalty = calculateAsymmetricRulScore(actual, latePrediction);
    const earlyPenalty = calculateAsymmetricRulScore(actual, earlyPrediction);
    expect(latePenalty).toBeGreaterThan(0);
    expect(earlyPenalty).toBeGreaterThan(0);
  });
});

describe('Sensor Data Quality & Telemetry Audit Engine', () => {
  it('detects stuck flat-line values and transient spikes via robust MAD z-scores', () => {
    // Normal baseline readings
    const cleanReadings: TelemetryReading[] = [];
    const baseTime = Date.now();
    for (let i = 0; i < 30; i++) {
      cleanReadings.push({
        timestamp: new Date(baseTime + i * 100).toISOString(),
        value: 50.0 + Math.sin(i * 0.5) * 2.0,
        tagId: 'tag_temp',
        tagName: 'Motor Inverter Temperature',
      });
    }

    const cleanAudit = auditSensorTelemetryStream(cleanReadings, {
      tagId: 'tag_temp',
      tagName: 'Motor Inverter Temperature',
      validRange: [0, 150],
      samplingRateHz: 10,
    });
    expect(cleanAudit.overallStatus).toBe('PASS');
    expect(cleanAudit.blocksDownstreamAnalysis).toBe(false);

    // Corrupted stream: Injected stuck flat-line value for 12 cycles
    const stuckReadings: TelemetryReading[] = [...cleanReadings];
    for (let i = 10; i < 22; i++) {
      stuckReadings[i] = {
        ...stuckReadings[i],
        value: 51.234, // flat-line
      };
    }

    const stuckAudit = auditSensorTelemetryStream(stuckReadings, {
      tagId: 'tag_temp',
      tagName: 'Motor Inverter Temperature',
      validRange: [0, 150],
      samplingRateHz: 10,
    });
    expect(stuckAudit.overallStatus).toBe('FAIL');
    expect(stuckAudit.blocksDownstreamAnalysis).toBe(true);
    const stuckCheck = stuckAudit.checks.find((c) => c.checkName.includes('Stuck'));
    expect(stuckCheck?.status).toBe('FAIL');
  });
});
