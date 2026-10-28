import { describe, it, expect } from 'vitest';
import {
  QUANTUM_TUNNELING_MODEL,
  ALLOSTERIC_ENZYME_MODEL,
  FUSION_LAWSON_CRITERION_MODEL,
  HODGKIN_HUXLEY_NEURAL_MODEL,
  CRISPR_CAS_CLEAVAGE_MODEL,
  ALCUBIERRE_WARP_SPACETIME_MODEL,
  evaluateCustomMathFormula,
  evaluateSymbolicLogic,
  generateLogicPathDAG,
} from '../utils/aiReasoningEngine';

describe('AI Reasoning Engine: Deep Scientific & High-Tech Derivations', () => {
  it('computes Quantum Tunneling probability in biological enzymes with step-by-step WKB reasoning', () => {
    const res = QUANTUM_TUNNELING_MODEL.compute({
      d: 0.65,
      V0: 14.5,
      E: 8.2,
      mass_amu: 1.008, // Protium
    });

    expect(res.finalValue).toBeGreaterThan(0);
    expect(res.finalValue).toBeLessThanOrEqual(1.0);
    expect(res.steps.length).toBe(4);
    expect(res.judgeSanityCheck.passed).toBe(true);
    expect(res.judgeSanityCheck.verdict).toBe('SOUND_SCIENTIFIC_DERIVATION');

    // Kinetic Isotope Effect (KIE): Deuterium (2.014 amu) should have significantly lower tunneling probability
    const resDeuterium = QUANTUM_TUNNELING_MODEL.compute({
      d: 0.65,
      V0: 14.5,
      E: 8.2,
      mass_amu: 2.014, // Deuterium
    });
    expect(resDeuterium.finalValue).toBeLessThan(res.finalValue);
  });

  it('evaluates Allosteric Hill Enzyme Kinetics and targeted nanoparticle drug inhibition', () => {
    // Uninhibited state (I = 0)
    const uninhibited = ALLOSTERIC_ENZYME_MODEL.compute({
      Vmax: 250,
      S: 45,
      Km: 22,
      n: 2.4,
      I: 0,
      Ki: 3.5,
    });

    // Inhibited state (I = 15 uM)
    const inhibited = ALLOSTERIC_ENZYME_MODEL.compute({
      Vmax: 250,
      S: 45,
      Km: 22,
      n: 2.4,
      I: 15,
      Ki: 3.5,
    });

    expect(uninhibited.finalValue).toBeGreaterThan(inhibited.finalValue);
    expect(inhibited.steps.length).toBe(4);
    expect(inhibited.judgeSanityCheck.passed).toBe(true);
  });

  it('calculates Magnetohydrodynamic Fusion Lawson Triple Product and ignition margin', () => {
    const res = FUSION_LAWSON_CRITERION_MODEL.compute({
      n_e: 1.2,    // 1.2 x 10^20 m^-3
      T_i: 18.0,   // 18 keV
      tau_E: 2.5,  // 2.5 seconds
    });

    // n * T * tau = 1.2e20 * 18 * 2.5 = 5.4e21 keV * s / m^3
    expect(res.finalValue).toBeCloseTo(5.4e21, -20);
    expect(res.judgeSanityCheck.passed).toBe(true);
    expect(res.steps.length).toBe(3);
  });

  it('computes Hodgkin-Huxley Neural Membrane ion currents and action potential balance', () => {
    const res = HODGKIN_HUXLEY_NEURAL_MODEL.compute({
      V: -20,
      m: 0.85,
      h: 0.40,
      n: 0.65,
    });

    expect(res.steps.length).toBe(4);
    expect(typeof res.finalValue).toBe('number');
    expect(res.judgeSanityCheck.passed).toBe(true);
  });

  it('evaluates custom user-defined mathematical formulas with step-by-step substitution and sanity guardrails', () => {
    const formula = '(alpha * speed) / (drag + 1.0)';
    const vars = { alpha: 2.5, speed: 60.0, drag: 4.0 };
    const res = evaluateCustomMathFormula(formula, vars);

    // (2.5 * 60) / (4.0 + 1.0) = 150 / 5 = 30.0
    expect(res.finalValue).toBeCloseTo(30.0, 4);
    expect(res.steps.length).toBe(3);
    expect(res.judgeSanityCheck.passed).toBe(true);

    // Test with Math functions
    const transcendentalFormula = 'sin(theta) + pow(radius, 2)';
    const transVars = { theta: 0, radius: 3 };
    const transRes = evaluateCustomMathFormula(transcendentalFormula, transVars);
    expect(transRes.finalValue).toBe(9);
  });

  it('computes CRISPR-Cas12 collateral cleavage kinetics with mismatch penalties', () => {
    // 0 mismatches vs 2 mismatches
    const resPerfect = CRISPR_CAS_CLEAVAGE_MODEL.compute({
      kcat: 12.5,
      E_act: 15.0,
      ssDNA: 2.5,
      Km: 1.8,
      mismatches: 0,
    });

    const resMismatch = CRISPR_CAS_CLEAVAGE_MODEL.compute({
      kcat: 12.5,
      E_act: 15.0,
      ssDNA: 2.5,
      Km: 1.8,
      mismatches: 2,
    });

    expect(resPerfect.finalValue).toBeGreaterThan(0);
    expect(resMismatch.finalValue).toBeLessThan(resPerfect.finalValue);
    expect(resPerfect.judgeSanityCheck.passed).toBe(true);
  });

  it('evaluates Alcubierre Warp Metric and confirms negative energy density requirement', () => {
    const warp = ALCUBIERRE_WARP_SPACETIME_MODEL.compute({
      vs_c: 2.0,
      bubble_radius_m: 100.0,
      wall_thickness_m: 0.5,
      transverse_y_m: 100.0,
    });

    expect(warp.finalValue).toBeLessThan(0); // Strictly negative energy density
    expect(warp.judgeSanityCheck.passed).toBe(true);
    expect(warp.judgeSanityCheck.verdict).toBe('SOUND_SCIENTIFIC_DERIVATION');
  });

  it('evaluates symbolic proposition logic with truth tables and implication deduction', () => {
    // Proposition: (P AND Q) -> R
    const logicExpr = '(P AND Q) -> R';
    const state = { P: true, Q: true, R: false }; // True and True -> False = False!
    const result = evaluateSymbolicLogic(logicExpr, state);

    expect(result.currentTruthValue).toBe(false);
    expect(result.truthTable.length).toBe(8); // 2^3 = 8
    expect(result.isSatisfiable).toBe(true);
    expect(result.isTautology).toBe(false);

    // Tautology: P OR NOT P (Law of Excluded Middle)
    const tautology = evaluateSymbolicLogic('P OR NOT P', { P: true });
    expect(tautology.isTautology).toBe(true);
    expect(tautology.currentTruthValue).toBe(true);

    // Contradiction: P AND NOT P
    const contradiction = evaluateSymbolicLogic('P AND NOT P', { P: true });
    expect(contradiction.isContradiction).toBe(true);
    expect(contradiction.currentTruthValue).toBe(false);
    expect(contradiction.judgeSanityCheck.passed).toBe(false);

    // Verify AST generation
    expect(result.ast).not.toBeNull();
    expect(result.ast?.type).toBe('binary');
    expect(result.ast?.operator).toBe('IMPLIES');
  });

  it('builds an Abstract Syntax Tree (AST) and generates a Directed Acyclic Graph (DAG) for logic flow paths', () => {
    const expr = '(RADAR_LOCKED AND CAMERA_VALID) -> TARGET_CONFIRMED';
    const state = { RADAR_LOCKED: true, CAMERA_VALID: true, TARGET_CONFIRMED: true };
    const res = evaluateSymbolicLogic(expr, state);

    expect(res.ast).toBeDefined();
    expect(res.ast?.value).toBe(true);

    const dag = generateLogicPathDAG('symbolic_logic', {
      params: state,
      steps: res.steps,
      judgeCheck: res.judgeSanityCheck,
      finalResult: res.currentTruthValue ? 'TRUE' : 'FALSE',
    });

    expect(dag.nodes.length).toBeGreaterThan(5);
    expect(dag.nodes.some((n) => n.level === 0)).toBe(true); // Inputs
    expect(dag.nodes.some((n) => n.level === 1)).toBe(true); // Steps
    expect(dag.nodes.some((n) => n.level === 2)).toBe(true); // Judge Gate
    expect(dag.nodes.some((n) => n.level === 3)).toBe(true); // Output State
    expect(dag.edges.length).toBeGreaterThan(0);
  });

  it('computes autonomous vehicle braking distance and rocket Delta-v using custom formula evaluator', () => {
    // Tesla Braking Distance: speed * 0.2778 + Math.pow(speed * 0.2778, 2) / (2 * 9.81 * friction)
    const teslaFormula = 'speed * 0.2778 + Math.pow(speed * 0.2778, 2) / (2 * 9.81 * friction)';
    const teslaRes = evaluateCustomMathFormula(teslaFormula, { speed: 65, friction: 0.85 });
    expect(teslaRes.finalValue).toBeGreaterThan(25);
    expect(teslaRes.finalValue).toBeLessThan(60);
    expect(teslaRes.judgeSanityCheck.passed).toBe(true);

    // Tsiolkovsky Rocket Equation: ve * Math.log(m0 / mf)
    const rocketFormula = 've * Math.log(m0 / mf)';
    const rocketRes = evaluateCustomMathFormula(rocketFormula, { ve: 3200, m0: 150000, mf: 25000 });
    // 3200 * ln(6) = 3200 * 1.791759 = ~5733 m/s
    expect(rocketRes.finalValue).toBeCloseTo(5733.6, 0);
  });
});
