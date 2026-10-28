/**
 * Self-Driving Robotic Wet-Lab & Automated Chemspeed Dispatcher
 * Era III (2036-2040): Closed-Loop Robotic Wet-Lab Synthesis & Assay
 */

export interface MicroplateWell {
  wellId: string; // e.g. A1, B4
  reagentCompound: string;
  concentrationMicroMolar: number;
  absorbanceOpend: number; // Optical density at 450nm
  reactionStatus: 'empty' | 'pipetted' | 'incubating' | 'read_complete';
  isHitCandidate: boolean;
}

export interface RoboticAssayRun {
  runId: string;
  targetTargetProtein: string;
  plateFormat: '96_well' | '384_well';
  pipettingAccuracyNanoliters: number;
  incubationTempCelsius: number;
  wells: MicroplateWell[];
  hitRatePercent: number;
  topCandidateCompound: string;
  dispatchTimestamp: string;
  status: 'idle' | 'pipetting' | 'incubating' | 'spectrophotometry' | 'completed';
}

export function generateRoboticAssay(targetProtein: string = 'Kinase-EGFR Mutant'): RoboticAssayRun {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const wells: MicroplateWell[] = [];

  let hits = 0;
  for (let r = 0; r < rows.length; r++) {
    for (let c = 1; c <= 12; c++) {
      const wellId = `${rows[r]}${c}`;
      const concentration = Number((Math.random() * 50 + 1).toFixed(2));
      // Base absorbance + stochastic binding affinity
      const isCandidate = Math.random() < 0.08;
      const absorbance = isCandidate
        ? Number((1.8 + Math.random() * 0.4).toFixed(3))
        : Number((0.15 + Math.random() * 0.45).toFixed(3));

      if (isCandidate) hits++;

      wells.push({
        wellId,
        reagentCompound: `CMPD-2046-${100 + r * 12 + c}`,
        concentrationMicroMolar: concentration,
        absorbanceOpend: absorbance,
        reactionStatus: 'read_complete',
        isHitCandidate: isCandidate,
      });
    }
  }

  const top = wells.sort((a, b) => b.absorbanceOpend - a.absorbanceOpend)[0];

  return {
    runId: `ROBO-RUN-${Math.floor(1000 + Math.random() * 9000)}`,
    targetTargetProtein: targetProtein,
    plateFormat: '96_well',
    pipettingAccuracyNanoliters: 2.5,
    incubationTempCelsius: 37.0,
    wells,
    hitRatePercent: Number(((hits / 96) * 100).toFixed(1)),
    topCandidateCompound: top?.reagentCompound || 'CMPD-2046-142',
    dispatchTimestamp: new Date().toISOString(),
    status: 'completed',
  };
}
