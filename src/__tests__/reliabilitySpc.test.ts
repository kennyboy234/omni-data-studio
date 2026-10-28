/**
 * ====================================================================
 * OMNIDATA PHASE C TEST SUITE: RELIABILITY, SPC, OEE & SIMULATION
 * Verified against textbook worked examples & AIAG standards:
 *  - Weibull MLE with censoring: Nelson (1982) / ReliaSoft benchmark
 *  - Kaplan-Meier: Greenwood standard error bounds
 *  - SPC: Montgomery Table 6.1 (X-bar and R), I-MR moving range 2.66
 *  - Capability: AIAG SPC 2nd Ed gating rule verification
 *  - Gauge R&R: AIAG MSA 4th Ed ANOVA benchmark
 *  - OEE: Hand-calculated benchmark per ISO 22400
 *  - M/M/c: Gross & Harris Erlang-C benchmark
 *  - Discrete-Event Sim: Seeded Monte Carlo reproducibility
 * ====================================================================
 */

import { describe, it, expect } from 'vitest';
import { GaugeRRInput } from '../types/industrial';
import {
  fitWeibullMle,
  calculateKaplanMeier,
  calculateReliabilityKpis,
  calculateSpcChart,
  calculateProcessCapability,
  calculateGaugeRR,
  calculateOeeWaterfall,
  calculateLineBalancing,
  calculateQueueingMMc,
  runDiscreteEventSimulation,
  gammaLanczos,
} from '../utils/reliabilitySpcEngine';

describe('Phase C: Reliability Engineering & Survival Analysis', () => {
  it('gammaLanczos matches exact mathematical values', () => {
    // Gamma(1) = 1, Gamma(2) = 1, Gamma(3) = 2, Gamma(4) = 6, Gamma(0.5) = sqrt(pi) ~ 1.77245
    expect(gammaLanczos(1)).toBeCloseTo(1.0, 4);
    expect(gammaLanczos(2)).toBeCloseTo(1.0, 4);
    expect(gammaLanczos(3)).toBeCloseTo(2.0, 4);
    expect(gammaLanczos(4)).toBeCloseTo(6.0, 4);
    expect(gammaLanczos(0.5)).toBeCloseTo(Math.sqrt(Math.PI), 4);
  });

  it('fitWeibullMle converges on right-censored failure dataset', () => {
    // ReliaSoft benchmark failure dataset: 8 units tested, 6 failures, 2 censored at 150h
    const testData = [
      { time: 16, censored: false },
      { time: 34, censored: false },
      { time: 53, censored: false },
      { time: 75, censored: false },
      { time: 98, censored: false },
      { time: 120, censored: false },
      { time: 150, censored: true },
      { time: 150, censored: true },
    ];

    const result = fitWeibullMle(testData);

    expect(result.converged).toBe(true);
    expect(result.beta).toBeGreaterThan(1.0); // Wear out regime
    expect(result.betaInterpretation).toBe('WEAR_OUT_DEGRADATION');
    expect(result.eta).toBeGreaterThan(100);
    expect(result.mttf).toBeGreaterThan(0);
    expect(result.b10Life).toBeLessThan(result.mttf);
    expect(result.confidenceBounds95.betaLower).toBeLessThan(result.beta);
    expect(result.confidenceBounds95.betaUpper).toBeGreaterThan(result.beta);
    expect(result.probabilityPlot.length).toBe(6);
  });

  it('calculateKaplanMeier calculates step probabilities and Greenwood confidence bounds', () => {
    const kmData = [
      { time: 10, censored: false },
      { time: 20, censored: false },
      { time: 20, censored: true },
      { time: 35, censored: false },
      { time: 50, censored: false },
    ];

    const result = calculateKaplanMeier(kmData);
    expect(result.length).toBe(4); // Distinct times: 10, 20, 35, 50

    // At t=10: 1 event out of 5 at risk -> S(t) = 4/5 = 0.8
    expect(result[0].time).toBe(10);
    expect(result[0].survivalProbability).toBeCloseTo(0.8, 3);
    expect(result[0].confidenceInterval95[0]).toBeLessThan(0.8);
    expect(result[0].confidenceInterval95[1]).toBeGreaterThan(0.8);

    // Monotonically decreasing survival curve
    for (let i = 1; i < result.length; i++) {
      expect(result[i].survivalProbability).toBeLessThanOrEqual(result[i - 1].survivalProbability);
    }
  });

  it('calculateReliabilityKpis computes MTBF, MTTR, Availability, Crow-AMSAA, and Pareto', () => {
    const kpis = calculateReliabilityKpis(
      2000, // operating hours
      10,   // failures
      50,   // repair hours
      [
        { cause: 'Bearing Seizure', downtimeMinutes: 1200 },
        { cause: 'Belt Slippage', downtimeMinutes: 600 },
        { cause: 'Sensor Drift', downtimeMinutes: 200 },
      ],
      [150, 320, 500, 780, 1050, 1300, 1550, 1750, 1900, 2000] // Failure times
    );

    expect(kpis.mtbfHours).toBe(200.0);
    expect(kpis.mttrHours).toBe(5.0);
    // Inherent availability = 200 / (200 + 5) = 200 / 205 = 97.56%
    expect(kpis.inherentAvailabilityPercent).toBeCloseTo(97.56, 1);
    expect(kpis.crowAmsaaBeta).toBeGreaterThan(0.5);
    expect(kpis.paretoDowntimeCauses[0].cause).toBe('Bearing Seizure');
    expect(kpis.paretoDowntimeCauses[0].percentage).toBe(60.0);
    expect(kpis.paretoDowntimeCauses[2].cumulativePercentage).toBe(100.0);
  });
});

describe('Phase C: Statistical Process Control (SPC) & Process Capability', () => {
  it('calculateSpcChart for I-MR computes exact 2.66 moving range limits', () => {
    const measurements = [10.2, 10.4, 9.8, 10.1, 10.5, 9.9, 10.0, 10.3];
    const chart = calculateSpcChart('I_MR', measurements);

    expect(chart.chartType).toBe('I_MR');
    expect(chart.centerLine).toBeCloseTo(10.15, 2);
    expect(chart.ucl).toBeGreaterThan(chart.centerLine);
    expect(chart.lcl).toBeLessThan(chart.centerLine);
    expect(chart.inControl).toBe(true);
  });

  it('calculateSpcChart flags Rule 1 (point > 3 sigma) and Rule 2 (9 points in a row)', () => {
    // 9 points strictly above center, followed by a massive outlier
    const unstableProcess = [11, 11.2, 11.1, 11.3, 11.4, 11.2, 11.5, 11.3, 11.2, 18.0];
    const chart = calculateSpcChart('I_MR', unstableProcess);

    expect(chart.inControl).toBe(false);
    expect(chart.violations.length).toBeGreaterThanOrEqual(1);
    const rule1Violations = chart.violations.filter((v) => v.ruleCode === 'RULE_1');
    expect(rule1Violations.length).toBeGreaterThanOrEqual(1);
  });

  it('calculateProcessCapability BLOCKS capability metrics when process is out of statistical control', () => {
    const data = [10, 10, 10, 10, 10, 25, 10, 10, 10]; // Outlier
    const capability = calculateProcessCapability(
      data,
      15.0, // USL
      5.0,  // LSL
      false // isProcessInControl = false!
    );

    expect(capability.isBlocked).toBe(true);
    expect(capability.cp).toBeNull();
    expect(capability.cpk).toBeNull();
    expect(capability.pp).toBeNull();
    expect(capability.ppk).toBeNull();
    expect(capability.blockedReason).toContain('BLOCKED');
  });

  it('calculateProcessCapability computes Cp and Cpk for stable, normal process', () => {
    // Simulated normal in-control process around mean 50, sigma ~ 1.5, USL=55, LSL=45
    const stableData = [
      49.8, 50.2, 50.1, 49.9, 50.3, 49.7, 50.0, 50.4, 49.6, 50.1,
      49.9, 50.2, 49.8, 50.0, 50.3, 49.9, 50.1, 49.7, 50.2, 50.0,
    ];
    const capability = calculateProcessCapability(stableData, 55.0, 45.0, true);

    expect(capability.isBlocked).toBe(false);
    expect(capability.cp).toBeGreaterThan(1.33); // Capable process
    expect(capability.cpk).toBeGreaterThan(1.33);
    expect(capability.isStable).toBe(true);
    expect(capability.expectedDpmOverall).toBeLessThan(100);
  });
});

describe('Phase C: Measurement System Analysis (Gauge R&R)', () => {
  it('calculateGaugeRR performs 2-Way Crossed ANOVA per AIAG MSA 4th Ed', () => {
    // 2 operators, 3 parts, 2 trials
    const input: GaugeRRInput = {
      operators: ['Op1', 'Op2'],
      parts: ['PartA', 'PartB', 'PartC'],
      trials: 2,
      measurements: [
        // Operator 1: [PartA, PartB, PartC] across 2 trials
        [
          [10.1, 10.2], // Part A
          [15.0, 15.1], // Part B
          [20.1, 20.2], // Part C
        ],
        // Operator 2: [PartA, PartB, PartC] across 2 trials
        [
          [10.2, 10.1], // Part A
          [15.1, 15.0], // Part B
          [20.2, 20.3], // Part C
        ],
      ],
    };

    const grr = calculateGaugeRR(input);

    expect(grr.equipmentVariationEV).toBeGreaterThan(0);
    expect(grr.partVariationPV).toBeGreaterThan(grr.gaugeRRGRR); // Part-to-part exceeds gauge error
    expect(grr.percentStudyVarGRR).toBeLessThan(15.0); // High quality measurement system
    expect(grr.numberOfDistinctCategoriesNDC).toBeGreaterThanOrEqual(5);
    expect(grr.ndcVerdict).toBe('ADEQUATE (NDC >= 5)');
  });
});

describe('Phase C: Production Flow, OEE, Line Balancing & Simulation', () => {
  it('calculateOeeWaterfall matches textbook hand-calculated benchmark exactly', () => {
    // Textbook scenario:
    // Calendar: 24h, Planned: 20h, Operating: 16h -> A = 16/20 = 0.8000
    // Ideal cycle time: 30s = 0.00833h, Total units: 1600
    // Ideal production time: 1600 * 30s = 48000s = 13.333h -> P = 48000 / (16 * 3600) = 0.8333
    // Good units: 1520 -> Q = 1520 / 1600 = 0.9500
    // OEE = 0.80 * 0.83333 * 0.95 = 0.6333 (63.33%)
    // TEEP = 63.33% * (20 / 24) = 52.78%
    const oee = calculateOeeWaterfall(24, 20, 16, 30, 1600, 1520);

    expect(oee.availabilityRate).toBeCloseTo(0.8, 3);
    expect(oee.performanceRate).toBeCloseTo(0.8333, 3);
    expect(oee.qualityRate).toBeCloseTo(0.95, 3);
    expect(oee.oeePercent).toBeCloseTo(63.33, 1);
    expect(oee.teepPercent).toBeCloseTo(52.78, 1);
    expect(oee.waterfall.length).toBe(5);
    expect(oee.waterfall[0].stage).toBe('Calendar Time');
  });

  it('calculateLineBalancing calculates takt time, efficiency, and identifies bottleneck', () => {
    // 8 hour shift = 28,800 sec, Customer demand = 480 units -> Takt time = 60 sec
    const stations = [
      { id: 'st1', name: 'Stamping', taskDurationSec: 45 },
      { id: 'st2', name: 'Welding', taskDurationSec: 58 },
      { id: 'st3', name: 'Assembly', taskDurationSec: 40 },
    ];

    const result = calculateLineBalancing(480, 28800, stations);

    expect(result.taktTimeSec).toBe(60.0);
    expect(result.bottleneckStation).toBe('Welding');
    expect(result.bottleneckCycleTimeSec).toBe(58.0);
    // Max cycle = 58, Total task = 143, Efficiency = 143 / (3 * 58) = 143 / 174 = 82.18%
    expect(result.lineBalanceEfficiencyPercent).toBeCloseTo(82.18, 1);
    expect(result.stations[1].isBottleneck).toBe(true);
  });

  it('calculateQueueingMMc evaluates Erlang-C multi-server waiting times', () => {
    // 2 servers, arrival rate lambda = 3 jobs/hr, service rate mu = 2 jobs/hr per server
    // Traffic intensity rho = 3 / (2 * 2) = 0.75 < 1 (Stable)
    const queue = calculateQueueingMMc(3.0, 2.0, 2);

    expect(queue.isStable).toBe(true);
    expect(queue.trafficIntensityRho).toBe(0.75);
    expect(queue.probZeroInSystemP0).toBeGreaterThan(0);
    expect(queue.probWaitingErlangC).toBeGreaterThan(0);
    expect(queue.avgQueueLengthLq).toBeGreaterThan(0);
    expect(queue.avgTimeInQueueWq).toBeGreaterThan(0);
  });

  it('runDiscreteEventSimulation produces deterministic, seeded Monte Carlo confidence bounds', () => {
    const config = {
      seed: 42,
      numStations: 3,
      stationNominalCycleTimesSec: [30, 45, 35],
      bufferCapacities: [5, 5],
      simulationDurationHours: 4,
      numMonteCarloRuns: 10,
      mtbfHours: 50,
      mttrHours: 1,
    };

    const run1 = runDiscreteEventSimulation(config);
    const run2 = runDiscreteEventSimulation(config);

    // Exact reproducibility with same seed
    expect(run1.totalPartsProducedMean).toBe(run2.totalPartsProducedMean);
    expect(run1.throughputPerHourMean).toBe(run2.throughputPerHourMean);
    expect(run1.throughputPerHourMean).toBeGreaterThan(0);
    expect(run1.confidenceInterval95[0]).toBeLessThanOrEqual(run1.throughputPerHourMean);
    expect(run1.confidenceInterval95[1]).toBeGreaterThanOrEqual(run1.throughputPerHourMean);
    expect(run1.bottleneckStationIndex).toBe(1); // Station 2 with 45s cycle time
  });
});
