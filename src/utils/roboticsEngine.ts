/**
 * ====================================================================
 * OMNIDATA INDUSTRIAL AUTONOMY: ROBOTICS & DEEP MATH ENGINE
 * Section 4.4: Denavit-Hartenberg Forward Kinematics, Jacobian,
 * Damped Least Squares IK, Trapezoidal Profiles, Motor Sizing & NIOSH
 * ====================================================================
 */

import {
  DHParameter,
  ForwardKinematicsResult,
  InverseKinematicsRequest,
  InverseKinematicsResult,
  MotorSizingInputs,
  MotorSizingResult,
  NioshLiftingInputs,
  NioshLiftingResult,
  TrapezoidalProfile,
} from '../types/industrial';

// Matrix 4x4 multiplication
export function multiply4x4(A: number[][], B: number[][]): number[][] {
  const result: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += A[r][k] * B[k][c];
      }
      result[r][c] = sum;
    }
  }
  return result;
}

// Single DH transformation matrix A_i
export function getDHMatrix(thetaDeg: number, d: number, a: number, alphaDeg: number): number[][] {
  const th = (thetaDeg * Math.PI) / 180.0;
  const al = (alphaDeg * Math.PI) / 180.0;
  const ct = Math.cos(th);
  const st = Math.sin(th);
  const ca = Math.cos(al);
  const sa = Math.sin(al);

  return [
    [ct, -st * ca, st * sa, a * ct],
    [st, ct * ca, -ct * sa, a * st],
    [0, sa, ca, d],
    [0, 0, 0, 1],
  ];
}

/**
 * 1. Denavit-Hartenberg Forward Kinematics
 * Computes end-effector (x, y, z) and joint positions in world frame
 */
export function computeForwardKinematics(params: DHParameter[]): ForwardKinematicsResult {
  let T: number[][] = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  const jointPositions: [number, number, number][] = [[0, 0, 0]];

  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    const A_i = getDHMatrix(p.thetaDeg, p.d, p.a, p.alphaDeg);
    T = multiply4x4(T, A_i);
    jointPositions.push([
      Math.round(T[0][3] * 100) / 100,
      Math.round(T[1][3] * 100) / 100,
      Math.round(T[2][3] * 100) / 100,
    ]);
  }

  const endEffectorPosition: [number, number, number] = [
    Math.round(T[0][3] * 100) / 100,
    Math.round(T[1][3] * 100) / 100,
    Math.round(T[2][3] * 100) / 100,
  ];

  return {
    endEffectorPosition,
    transformationMatrix: T,
    jointPositions,
  };
}

/**
 * 2. Numerical Kinematic Jacobian (3xN for position)
 */
export function computeJacobian(
  thetasDeg: number[],
  dhTemplate: DHParameter[],
  deltaDeg: number = 0.01
): number[][] {
  const n = thetasDeg.length;
  const currentParams: DHParameter[] = dhTemplate.map((p, idx) => ({
    ...p,
    thetaDeg: thetasDeg[idx],
  }));

  const baseFk = computeForwardKinematics(currentParams);
  const baseP = baseFk.endEffectorPosition;

  // Jacobian 3xN: J[r][c] = dp_r / dth_c
  const J: number[][] = [
    new Array(n).fill(0),
    new Array(n).fill(0),
    new Array(n).fill(0),
  ];

  const deltaRad = (deltaDeg * Math.PI) / 180.0;

  for (let i = 0; i < n; i++) {
    const perturbedThetas = [...thetasDeg];
    perturbedThetas[i] += deltaDeg;

    const perturbedParams: DHParameter[] = dhTemplate.map((p, idx) => ({
      ...p,
      thetaDeg: perturbedThetas[idx],
    }));

    const perturbedFk = computeForwardKinematics(perturbedParams);
    const pertP = perturbedFk.endEffectorPosition;

    J[0][i] = (pertP[0] - baseP[0]) / deltaRad;
    J[1][i] = (pertP[1] - baseP[1]) / deltaRad;
    J[2][i] = (pertP[2] - baseP[2]) / deltaRad;
  }

  return J;
}

/**
 * 3. Damped Least Squares (DLS / Levenberg-Marquardt) Inverse Kinematics
 * Formula: delta_theta = J^T * (J * J^T + lambda^2 * I)^(-1) * error
 * Singularity-robust for high-speed industrial robot arms & humanoids
 */
export function solveInverseKinematicsDLS(req: InverseKinematicsRequest): InverseKinematicsResult {
  const maxIter = req.maxIterations || 100;
  const tol = req.toleranceMm || 1.0;
  const lambda = req.dampingFactorLambda || 0.05;
  const thetas = [...req.currentThetasDeg];
  const trajectory: { iteration: number; errorMm: number }[] = [];

  let converged = false;
  let finalErrorMm = Infinity;

  for (let iter = 0; iter < maxIter; iter++) {
    const currentParams = req.dhParams.map((p, idx) => ({
      ...p,
      thetaDeg: thetas[idx],
    }));

    const fk = computeForwardKinematics(currentParams);
    const currP = fk.endEffectorPosition;

    // Error vector e = target - current
    const e = [
      req.targetPosition[0] - currP[0],
      req.targetPosition[1] - currP[1],
      req.targetPosition[2] - currP[2],
    ];

    const errMagnitude = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
    trajectory.push({ iteration: iter, errorMm: Math.round(errMagnitude * 100) / 100 });
    finalErrorMm = errMagnitude;

    if (errMagnitude <= tol) {
      converged = true;
      break;
    }

    // Compute 3xN Jacobian
    const J = computeJacobian(thetas, req.dhParams);
    const n = thetas.length;

    // A = J * J^T (3x3)
    const A: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += J[r][k] * J[c][k];
        }
        A[r][c] = sum + (r === c ? lambda * lambda : 0);
      }
    }

    // Invert 3x3 matrix A
    const invA = invert3x3(A);
    if (!invA) break;

    // v = invA * e (3x1)
    const v = [
      invA[0][0] * e[0] + invA[0][1] * e[1] + invA[0][2] * e[2],
      invA[1][0] * e[0] + invA[1][1] * e[1] + invA[1][2] * e[2],
      invA[2][0] * e[0] + invA[2][1] * e[1] + invA[2][2] * e[2],
    ];

    // deltaTheta = J^T * v (Nx1 in radians)
    const stepScale = 0.5; // step limiter for stability
    for (let j = 0; j < n; j++) {
      let dthRad = 0;
      for (let r = 0; r < 3; r++) {
        dthRad += J[r][j] * v[r];
      }
      const dthDeg = (dthRad * 180.0) / Math.PI;
      // Clamp single step change to +/- 15 degrees
      const clampedDelta = Math.max(-15, Math.min(15, dthDeg * stepScale));
      thetas[j] = Math.round((thetas[j] + clampedDelta) * 100) / 100;
    }
  }

  const pathCost = thetas.reduce((acc, th, idx) => acc + Math.abs(th - req.currentThetasDeg[idx]), 0);

  return {
    converged,
    finalThetasDeg: thetas,
    iterations: trajectory.length,
    finalErrorMm: Math.round(finalErrorMm * 100) / 100,
    pathCost: Math.round(pathCost * 100) / 100,
    trajectory,
  };
}

// 3x3 Matrix Inversion helper
function invert3x3(m: number[][]): number[][] | null {
  const det =
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  if (Math.abs(det) < 1e-9) return null;
  const invDet = 1.0 / det;

  return [
    [
      (m[1][1] * m[2][2] - m[1][2] * m[2][1]) * invDet,
      (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * invDet,
      (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet,
    ],
    [
      (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * invDet,
      (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * invDet,
      (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * invDet,
    ],
    [
      (m[1][0] * m[2][1] - m[1][1] * m[2][0]) * invDet,
      (m[0][1] * m[2][0] - m[0][0] * m[2][1]) * invDet,
      (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * invDet,
    ],
  ];
}

/**
 * 4. Trapezoidal Trajectory Generation (Both Regimes: Triangular & Trapezoidal)
 * Used in Tesla autonomous vehicle steering, robotic pick-and-place, and linear actuators
 */
export function generateTrapezoidalProfile(
  distance: number,
  vMax: number,
  aMax: number
): TrapezoidalProfile {
  const s = Math.abs(distance);
  const v = Math.abs(vMax);
  const a = Math.abs(aMax);

  // Critical distance to reach vMax: s_crit = vMax^2 / aMax
  const sCrit = (v * v) / a;

  let regime: 'triangular' | 'trapezoidal';
  let tAccel: number;
  let tFlat: number;
  let tDecel: number;
  let vPeak: number;

  if (s < sCrit) {
    // Triangular regime: Cannot reach full vMax
    regime = 'triangular';
    vPeak = Math.sqrt(s * a);
    tAccel = vPeak / a;
    tFlat = 0;
    tDecel = tAccel;
  } else {
    // Trapezoidal regime: Reaches vMax with cruise duration
    regime = 'trapezoidal';
    vPeak = v;
    tAccel = v / a;
    const distFlat = s - sCrit;
    tFlat = distFlat / v;
    tDecel = tAccel;
  }

  const totalTime = tAccel + tFlat + tDecel;

  // Generate 50 discrete trajectory samples for rendering & telemetry verification
  const numSamples = 50;
  const samples: { t: number; pos: number; vel: number; acc: number }[] = [];
  const dt = totalTime / (numSamples - 1);

  for (let i = 0; i < numSamples; i++) {
    const t = i * dt;
    let pos = 0;
    let vel = 0;
    let acc = 0;

    if (t <= tAccel) {
      // Phase 1: Acceleration
      acc = a;
      vel = a * t;
      pos = 0.5 * a * t * t;
    } else if (t <= tAccel + tFlat) {
      // Phase 2: Constant velocity cruise
      acc = 0;
      vel = vPeak;
      pos = 0.5 * a * tAccel * tAccel + vPeak * (t - tAccel);
    } else {
      // Phase 3: Deceleration
      const tDec = t - (tAccel + tFlat);
      acc = -a;
      vel = Math.max(0, vPeak - a * tDec);
      const sAccelFlat = 0.5 * a * tAccel * tAccel + vPeak * tFlat;
      pos = sAccelFlat + vPeak * tDec - 0.5 * a * tDec * tDec;
    }

    const direction = distance < 0 ? -1 : 1;
    samples.push({
      t: Math.round(t * 1000) / 1000,
      pos: Math.round(pos * direction * 100) / 100,
      vel: Math.round(vel * direction * 100) / 100,
      acc: Math.round(acc * direction * 100) / 100,
    });
  }

  return {
    totalDistance: distance,
    vMax,
    aMax,
    tAccel: Math.round(tAccel * 1000) / 1000,
    tFlat: Math.round(tFlat * 1000) / 1000,
    tDecel: Math.round(tDecel * 1000) / 1000,
    totalTime: Math.round(totalTime * 1000) / 1000,
    regime,
    samples,
  };
}

/**
 * 5. Motor RMS Torque Sizing (Industrial Servo / Electric Powertrain)
 * Formula: tau_rms = sqrt( (1 / T) * sum(tau_i^2 * dt_i) )
 */
export function calculateMotorSizing(inputs: MotorSizingInputs): MotorSizingResult {
  const inertiaJ = inputs.loadMassKg * inputs.radiusM * inputs.radiusM;
  const angularAcc = inputs.maxAccelerationMps2 / inputs.radiusM;
  const accTorque = inertiaJ * angularAcc;
  const peakTorqueNm = accTorque + inputs.frictionTorqueNm + inputs.loadMassKg * 9.81 * inputs.radiusM;

  let totalDuration = 0;
  let sumTorqueSquaredTime = 0;

  inputs.operatingCycle.forEach((segment) => {
    totalDuration += segment.durationSec;
    sumTorqueSquaredTime += segment.torqueNm * segment.torqueNm * segment.durationSec;
  });

  const rmsTorqueNm = totalDuration > 0 ? Math.sqrt(sumTorqueSquaredTime / totalDuration) : 0;
  const ratedSpeedRpm = 3000;
  const ratedSpeedRadS = (ratedSpeedRpm * 2 * Math.PI) / 60;
  const continuousPowerWatts = rmsTorqueNm * ratedSpeedRadS;

  const safetyFactor = peakTorqueNm > 0 ? Math.round((peakTorqueNm / rmsTorqueNm) * 100) / 100 : 1.5;

  let recommendation = 'STANDARD_SERVO';
  if (safetyFactor > 2.5) {
    recommendation = 'HIGH_INERTIA_SERVO_REQUIRED';
  } else if (rmsTorqueNm > 50) {
    recommendation = 'PLANETARY_GEARBOX_REDUCTION_RECOMMENDED';
  }

  return {
    peakTorqueNm: Math.round(peakTorqueNm * 100) / 100,
    rmsTorqueNm: Math.round(rmsTorqueNm * 100) / 100,
    continuousPowerWatts: Math.round(continuousPowerWatts * 10) / 10,
    safetyFactor,
    recommendation,
  };
}

/**
 * 6. Revised NIOSH Lifting Equation
 * Standard: Applications Manual for the Revised NIOSH Lifting Equation (Pub No 94-110)
 */
export const NIOSH_FREQUENCY_TABLE: Record<number, number> = {
  0.2: 1.0,
  0.5: 0.97,
  1.0: 0.94,
  2.0: 0.91,
  3.0: 0.88,
  4.0: 0.84,
  5.0: 0.8,
  6.0: 0.75,
  7.0: 0.7,
  8.0: 0.6,
  9.0: 0.52,
  10.0: 0.45,
};

export function evaluateNioshLifting(inputs: NioshLiftingInputs): NioshLiftingResult {
  const LC = 23.0; // Load Constant (kg)

  // Horizontal Multiplier HM = 25 / H (clamped between 25 and 63 cm)
  const H = Math.max(25, Math.min(63, inputs.horizontalDistanceCm));
  const HM = 25.0 / H;

  // Vertical Multiplier VM = 1 - (0.003 * |V - 75|) (clamped V between 0 and 175 cm)
  const V = Math.max(0, Math.min(175, inputs.verticalDistanceCm));
  const VM = Math.max(0, 1.0 - 0.003 * Math.abs(V - 75.0));

  // Distance Multiplier DM = 0.82 + (4.5 / D) (clamped D between 25 and 250 cm)
  const D = Math.max(25, Math.min(250, inputs.verticalTravelDistanceCm));
  const DM = Math.min(1.0, 0.82 + 4.5 / D);

  // Asymmetric Multiplier AM = 1 - (0.0032 * A) (clamped A between 0 and 135 deg)
  const A = Math.max(0, Math.min(135, inputs.asymmetryAngleDeg));
  const AM = Math.max(0, 1.0 - 0.0032 * A);

  // Frequency Multiplier FM
  const freqKeys = [0.2, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
  const closestFreq = freqKeys.reduce((prev, curr) =>
    Math.abs(curr - inputs.frequencyLiftsPerMin) < Math.abs(prev - inputs.frequencyLiftsPerMin) ? curr : prev
  );
  let FM = NIOSH_FREQUENCY_TABLE[closestFreq] || 0.8;
  if (inputs.durationHours === '<=2') FM *= 0.95;
  if (inputs.durationHours === '<=8') FM *= 0.85;

  // Coupling Multiplier CM
  let CM = 1.0;
  if (inputs.couplingQuality === 'fair') CM = 0.95;
  if (inputs.couplingQuality === 'poor') CM = 0.9;

  const RWL = LC * HM * VM * DM * AM * FM * CM;
  const LI = inputs.loadWeightKg / Math.max(0.1, RWL);

  let riskCategory: NioshLiftingResult['riskCategory'] = 'NOMINAL (LI <= 1.0)';
  if (LI > 3.0) {
    riskCategory = 'HIGH_HAZARD (LI > 3.0)';
  } else if (LI > 1.0) {
    riskCategory = 'INCREASED_RISK (1.0 < LI <= 3.0)';
  }

  return {
    recommendedWeightLimitKg: Math.round(RWL * 100) / 100,
    liftingIndex: Math.round(LI * 100) / 100,
    riskCategory,
    multipliers: {
      loadConstant: LC,
      horizontalMultiplier: Math.round(HM * 1000) / 1000,
      verticalMultiplier: Math.round(VM * 1000) / 1000,
      distanceMultiplier: Math.round(DM * 1000) / 1000,
      asymmetricMultiplier: Math.round(AM * 1000) / 1000,
      frequencyMultiplier: Math.round(FM * 1000) / 1000,
      couplingMultiplier: CM,
    },
  };
}
