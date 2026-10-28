/**
 * ====================================================================
 * OMNIDATA INDUSTRIAL AUTONOMY: RISK ANALYSIS ENGINE
 * Phase F (Section 4.5):
 * 1. AIAG-VDA 1st Edition Action Priority (AP) Matrix
 * 2. Duplicate-RPN Warning & Flaw Detector
 * 3. Fault Tree Analysis (FTA) with Mokus Minimal Cut Sets
 * 4. Birnbaum & Criticality Importance Measures
 * 5. Reliability Block Diagram (RBD) Analytical Solutions
 * ====================================================================
 */

import {
  AiagVdaActionPriority,
  FmeaRow,
  FmeaAuditSummary,
  FtaNode,
  FtaAnalysisResult,
  MinimalCutSet,
  BirnbaumImportance,
} from '../types/industrial';

// ====================================================================
// 1. AIAG-VDA 1ST EDITION ACTION PRIORITY (AP) LOOKUP TABLE
// Replaces deprecated legacy RPN with modern severity-weighted AP
// ====================================================================

export function determineAiagVdaAP(
  severity: number,
  occurrence: number,
  detection: number
): AiagVdaActionPriority {
  const S = Math.min(10, Math.max(1, Math.round(severity)));
  const O = Math.min(10, Math.max(1, Math.round(occurrence)));
  const D = Math.min(10, Math.max(1, Math.round(detection)));

  // S = 9 - 10 (Hazardous safety / compliance violation)
  if (S >= 9) {
    if (O >= 4) return 'HIGH';
    if (O >= 2) {
      if (D >= 5) return 'HIGH';
      if (D >= 2) return 'MEDIUM';
      return 'LOW';
    }
    // O = 1
    if (D >= 5) return 'MEDIUM';
    return 'LOW';
  }

  // S = 7 - 8 (High system function loss)
  if (S >= 7) {
    if (O >= 8) return 'HIGH';
    if (O >= 6) {
      return D >= 5 ? 'HIGH' : 'MEDIUM';
    }
    if (O >= 4) {
      return D >= 7 ? 'HIGH' : 'MEDIUM';
    }
    if (O >= 2) {
      return D >= 5 ? 'MEDIUM' : 'LOW';
    }
    // O = 1
    return 'LOW';
  }

  // S = 4 - 6 (Moderate functional degradation)
  if (S >= 4) {
    if (O >= 8) {
      return D >= 5 ? 'HIGH' : 'MEDIUM';
    }
    if (O >= 6) {
      if (D >= 7) return 'HIGH';
      if (D >= 5) return 'MEDIUM';
      return 'LOW';
    }
    if (O >= 4) {
      return D >= 7 ? 'MEDIUM' : 'LOW';
    }
    // O <= 3
    return 'LOW';
  }

  // S = 2 - 3 (Minor annoyance)
  if (S >= 2) {
    if (O >= 8 && D >= 7) return 'MEDIUM';
    return 'LOW';
  }

  // S = 1 (Negligible effect)
  return 'LOW';
}

// ====================================================================
// 2. FMEA AUDIT & DUPLICATE-RPN ANOMALY DETECTOR
// Flags identical RPN numbers that possess contradictory Action Priorities
// ====================================================================

export function auditFmeaTable(rows: Omit<FmeaRow, 'rpn' | 'actionPriority' | 'hasDuplicateRpnAnomaly'>[]): {
  processedRows: FmeaRow[];
  summary: FmeaAuditSummary;
} {
  const rpnMap = new Map<number, { priorities: Set<AiagVdaActionPriority>; rowIds: string[] }>();

  // Pass 1: Compute RPN and AIAG-VDA AP
  const evaluated: FmeaRow[] = rows.map((r) => {
    const rpn = r.severity * r.occurrence * r.detection;
    const ap = determineAiagVdaAP(r.severity, r.occurrence, r.detection);

    if (!rpnMap.has(rpn)) {
      rpnMap.set(rpn, { priorities: new Set(), rowIds: [] });
    }
    rpnMap.get(rpn)!.priorities.add(ap);
    rpnMap.get(rpn)!.rowIds.push(r.id);

    return {
      ...r,
      rpn,
      actionPriority: ap,
    };
  });

  // Pass 2: Detect duplicate-RPN anomalies
  const duplicateWarnings: string[] = [];
  rpnMap.forEach((meta, rpnVal) => {
    if (meta.priorities.size > 1) {
      const aps = Array.from(meta.priorities).join(' vs ');
      duplicateWarnings.push(
        `RPN = ${rpnVal} has conflicting risk levels [${aps}] across ${meta.rowIds.length} failure modes.`
      );
    }
  });

  const processedRows = evaluated.map((row) => ({
    ...row,
    hasDuplicateRpnAnomaly: (rpnMap.get(row.rpn)?.priorities.size || 0) > 1,
  }));

  const highCount = processedRows.filter((r) => r.actionPriority === 'HIGH').length;
  const medCount = processedRows.filter((r) => r.actionPriority === 'MEDIUM').length;
  const lowCount = processedRows.filter((r) => r.actionPriority === 'LOW').length;

  let maxSevRow = processedRows[0];
  processedRows.forEach((r) => {
    if (!maxSevRow || r.severity > maxSevRow.severity) maxSevRow = r;
  });

  return {
    processedRows,
    summary: {
      totalFailureModes: processedRows.length,
      highPriorityCount: highCount,
      mediumPriorityCount: medCount,
      lowPriorityCount: lowCount,
      duplicateRpnWarnings: duplicateWarnings,
      maxSeverityMode: maxSevRow ? `${maxSevRow.potentialFailureMode} (S=${maxSevRow.severity})` : 'N/A',
    },
  };
}

// ====================================================================
// 3. FAULT TREE ANALYSIS (FTA) WITH MOKUS MINIMAL CUT SETS
// Method for Obtaining Cut Sets + Boolean absorption reduction
// ====================================================================

export function evaluateFaultTree(
  nodes: FtaNode[],
  topNodeId: string
): FtaAnalysisResult {
  const nodeMap = new Map<string, FtaNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const topNode = nodeMap.get(topNodeId);
  if (!topNode) {
    throw new Error(`Top event node '${topNodeId}' not found in fault tree.`);
  }

  // Recursive Mokus tree expansion
  // Returns list of cut sets (array of event ID arrays)
  function expandNode(nodeId: string): string[][] {
    const node = nodeMap.get(nodeId);
    if (!node) return [];

    if (node.type === 'BASIC_EVENT') {
      return [[node.id]];
    }

    // Gate node expansion
    const children = node.childrenIds || [];
    if (children.length === 0) return [];

    if (node.gateType === 'OR') {
      // OR gate unions all child cut sets
      const result: string[][] = [];
      for (const childId of children) {
        const childSets = expandNode(childId);
        result.push(...childSets);
      }
      return result;
    }

    if (node.gateType === 'AND') {
      // AND gate takes Cartesian product of child cut sets
      let currentSets: string[][] = [[]];
      for (const childId of children) {
        const childSets = expandNode(childId);
        const nextSets: string[][] = [];
        for (const existing of currentSets) {
          for (const cSet of childSets) {
            nextSets.push([...existing, ...cSet]);
          }
        }
        currentSets = nextSets;
      }
      return currentSets;
    }

    if (node.gateType === 'VOTE_2_OF_3') {
      // 2-of-3 voting expansion: (c0 & c1) OR (c1 & c2) OR (c0 & c2)
      if (children.length < 3) return expandNode(children[0]);
      const s0 = expandNode(children[0]);
      const s1 = expandNode(children[1]);
      const s2 = expandNode(children[2]);

      const pair01 = cartesianProduct(s0, s1);
      const pair12 = cartesianProduct(s1, s2);
      const pair02 = cartesianProduct(s0, s2);

      return [...pair01, ...pair12, ...pair02];
    }

    return [];
  }

  const rawCutSets = expandNode(topNodeId);

  // Boolean Reduction:
  // 1. Remove duplicate events within each cut set (Idempotence: A & A = A)
  // 2. Sort event IDs for canonization
  const uniqueSets = rawCutSets.map((set) => Array.from(new Set(set)).sort());

  // 3. Remove superset cut sets (Absorption: A + AB = A)
  const minimalSets: string[][] = [];
  // Sort by length ascending so smaller cut sets absorb larger ones first
  uniqueSets.sort((a, b) => a.length - b.length);

  for (const candidate of uniqueSets) {
    if (candidate.length === 0) continue;
    // Check if any existing minimal set is a strict subset of candidate
    const isAbsorbed = minimalSets.some((mSet) =>
      mSet.every((ev) => candidate.includes(ev))
    );
    if (!isAbsorbed) {
      minimalSets.push(candidate);
    }
  }

  // Calculate cut set probabilities and top event probability
  const basicEvents = nodes.filter((n) => n.type === 'BASIC_EVENT');
  const probMap = new Map<string, number>();
  basicEvents.forEach((b) => probMap.set(b.id, b.failureProbability ?? 0.01));

  const resolvedCutSets: MinimalCutSet[] = minimalSets.map((evIds) => {
    const prob = evIds.reduce((prod, id) => prod * (probMap.get(id) || 0), 1);
    return {
      eventIds: evIds,
      eventNames: evIds.map((id) => nodeMap.get(id)?.name || id),
      order: evIds.length,
      probability: Number(prob.toExponential(4)),
    };
  });

  // Calculate Top Event Probability via Independent Cut Set Rare-Event Approximation
  // P(TOP) = 1 - prod_{k} (1 - P(MCS_k))
  const topProb = 1 - resolvedCutSets.reduce((acc, mcs) => acc * (1 - mcs.probability), 1);

  // Calculate Birnbaum & Criticality Importance for each basic event
  const birnbaums: BirnbaumImportance[] = basicEvents.map((be) => {
    const baseProb = probMap.get(be.id) || 0.01;

    // P(TOP | q_i = 1)
    const probGiven1 = 1 - resolvedCutSets.reduce((acc, mcs) => {
      const p = mcs.eventIds.includes(be.id)
        ? mcs.probability / baseProb
        : mcs.probability;
      return acc * (1 - p);
    }, 1);

    // P(TOP | q_i = 0)
    const probGiven0 = 1 - resolvedCutSets.reduce((acc, mcs) => {
      if (mcs.eventIds.includes(be.id)) return acc; // cut set becomes impossible (prob = 0)
      return acc * (1 - mcs.probability);
    }, 1);

    const bScore = Math.max(0, probGiven1 - probGiven0);
    const critScore = topProb > 0 ? (bScore * baseProb) / topProb : 0;

    return {
      eventId: be.id,
      eventName: be.name,
      baseProbability: baseProb,
      birnbaumScore: Number(bScore.toFixed(5)),
      criticalityScore: Number(critScore.toFixed(5)),
    };
  });

  birnbaums.sort((a, b) => b.birnbaumScore - a.birnbaumScore);

  let rarestProb = Infinity;
  resolvedCutSets.forEach((c) => {
    if (c.probability < rarestProb) rarestProb = c.probability;
  });

  return {
    topEventName: topNode.name,
    topEventProbability: Number(topProb.toExponential(4)),
    minimalCutSets: resolvedCutSets,
    totalCutSetsCount: resolvedCutSets.length,
    birnbaumImportances: birnbaums,
    rarestCutSetProbability: rarestProb === Infinity ? 0 : rarestProb,
    mostCriticalEvent: birnbaums[0]?.eventName || 'None',
  };
}

function cartesianProduct(setsA: string[][], setsB: string[][]): string[][] {
  const res: string[][] = [];
  for (const a of setsA) {
    for (const b of setsB) {
      res.push([...a, ...b]);
    }
  }
  return res;
}

// ====================================================================
// 4. RELIABILITY BLOCK DIAGRAM (RBD) ANALYTICAL CALCULATIONS
// Series, Parallel, and k-out-of-n active redundancy
// ====================================================================

export function calculateSeriesReliability(reliabilities: number[]): number {
  if (reliabilities.length === 0) return 1.0;
  return Number(reliabilities.reduce((acc, r) => acc * Math.max(0, Math.min(1, r)), 1.0).toFixed(6));
}

export function calculateParallelReliability(reliabilities: number[]): number {
  if (reliabilities.length === 0) return 0.0;
  const unreliability = reliabilities.reduce(
    (acc, r) => acc * (1 - Math.max(0, Math.min(1, r))),
    1.0
  );
  return Number((1 - unreliability).toFixed(6));
}

export function calculateKOutOfNReliability(k: number, n: number, r: number): number {
  if (k <= 0) return 1.0;
  if (k > n) return 0.0;
  const rel = Math.max(0, Math.min(1, r));
  let sysR = 0;

  for (let j = k; j <= n; j++) {
    const combinations = binomialCoeff(n, j);
    sysR += combinations * Math.pow(rel, j) * Math.pow(1 - rel, n - j);
  }

  return Number(sysR.toFixed(6));
}

function binomialCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 1; i <= k; i++) {
    c = (c * (n - (k - i))) / i;
  }
  return Math.round(c);
}
