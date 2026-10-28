/**
 * ====================================================================
 * OMNIDATA STUDIO: ERA VI ASTRO-SCALE DYSON SENSOR GRIDS ENGINE
 * Epoch Horizon: 2080 — 2120
 * Stellar System Energy Harvesting & Interstellar Biosurveillance
 * ====================================================================
 */

export interface ExoplanetTarget {
  name: string;
  distanceLightYears: number;
  starType: string;
  semiMajorAxisAU: number;
  equilibriumTempK: number;
  spectralFeatures: {
    ch4Ppm: number;
    o2Percent: number;
    co2Ppm: number;
    h2oPercent: number;
    ozoneAbsorptionIndex: number;
  };
  biosignatureProbability: number;
}

export interface DysonSwarmConfig {
  collectorNodesCount: number; // e.g. 1000 to 100,000
  orbitalRadiusAU: number; // 0.3 to 1.5 AU
  quantumHarvestEfficiency: number; // 0.40 to 0.95
  selectedTargetName: string;
  interferometerBaselineKm: number; // 1,000,000 to 150,000,000 km
}

export interface DysonTelemetryPacket {
  nodeId: string;
  orbitAnomalyDeg: number;
  powerOutputExawatts: number;
  quantumQubitCoherenceSec: number;
  telemetryDelaySec: number;
  status: 'nominal' | 'solar_storm_shielding' | 'stellar_alignment';
}

export interface DysonAstroSimulationResult {
  totalPowerOutputWatts: number;
  totalPowerOutputExawatts: number;
  solarFluxWm2: number;
  collectorAreaTotalKm2: number;
  targetAnalysis: {
    target: ExoplanetTarget;
    photochemicalDisequilibriumDeltaG: number;
    biosignatureScorePercent: number;
    spectroscopicSNR: number;
    atmosphericAssessment: string;
  };
  relativisticDelayMicrosec: number;
  quantumArrayCoherenceMetric: number;
  telemetryStream: DysonTelemetryPacket[];
  timestamp: string;
}

export const EXOPLANET_TARGETS: ExoplanetTarget[] = [
  {
    name: 'TRAPPIST-1e (Aquifer World)',
    distanceLightYears: 39.46,
    starType: 'Ultra-cool red dwarf (M8V)',
    semiMajorAxisAU: 0.029,
    equilibriumTempK: 251,
    spectralFeatures: {
      ch4Ppm: 18.5,
      o2Percent: 19.4,
      co2Ppm: 410,
      h2oPercent: 1.8,
      ozoneAbsorptionIndex: 0.88,
    },
    biosignatureProbability: 94.6,
  },
  {
    name: 'Proxima Centauri b (Cusp Habitability)',
    distanceLightYears: 4.24,
    starType: 'Red dwarf (M5.5Ve)',
    semiMajorAxisAU: 0.048,
    equilibriumTempK: 234,
    spectralFeatures: {
      ch4Ppm: 4.2,
      o2Percent: 6.8,
      co2Ppm: 680,
      h2oPercent: 0.6,
      ozoneAbsorptionIndex: 0.42,
    },
    biosignatureProbability: 68.2,
  },
  {
    name: 'K2-18b (Hycean Oceanic Candidate)',
    distanceLightYears: 124.0,
    starType: 'Red dwarf (M2.5V)',
    semiMajorAxisAU: 0.143,
    equilibriumTempK: 279,
    spectralFeatures: {
      ch4Ppm: 24.0,
      o2Percent: 12.5,
      co2Ppm: 320,
      h2oPercent: 3.2,
      ozoneAbsorptionIndex: 0.76,
    },
    biosignatureProbability: 88.4,
  },
  {
    name: 'TOI-700d (Temperate Terrestrial)',
    distanceLightYears: 101.4,
    starType: 'Quiet M-dwarf (M2V)',
    semiMajorAxisAU: 0.163,
    equilibriumTempK: 269,
    spectralFeatures: {
      ch4Ppm: 2.1,
      o2Percent: 14.2,
      co2Ppm: 390,
      h2oPercent: 1.2,
      ozoneAbsorptionIndex: 0.65,
    },
    biosignatureProbability: 79.1,
  },
];

// Physical constants
const SOLAR_LUMINOSITY_WATTS = 3.828e26; // L_sun
const AU_METERS = 1.495978707e11; // 1 AU in meters
const G_CONST = 6.6743e-11;
const C_SPEED = 2.99792458e8;
const SOLAR_MASS_KG = 1.989e30;

/**
 * Executes Epoch 2080-2120 Dyson Swarm & Astrobiological Biosurveillance Simulation
 */
export function simulateDysonAstroGrid(config: DysonSwarmConfig): DysonAstroSimulationResult {
  const {
    collectorNodesCount,
    orbitalRadiusAU,
    quantumHarvestEfficiency,
    selectedTargetName,
    interferometerBaselineKm,
  } = config;

  const target =
    EXOPLANET_TARGETS.find((t) => t.name === selectedTargetName) || EXOPLANET_TARGETS[0];

  // 1. Solar Flux at orbital radius: S = L / (4 * pi * R^2)
  const radiusMeters = orbitalRadiusAU * AU_METERS;
  const solarFluxWm2 = SOLAR_LUMINOSITY_WATTS / (4 * Math.PI * Math.pow(radiusMeters, 2));

  // 2. Total Harvesting Area (Each swarm node is a 10 km^2 graphene-optical lattice sail)
  const nodeAreaKm2 = 10.0;
  const collectorAreaTotalKm2 = collectorNodesCount * nodeAreaKm2;
  const collectorAreaM2 = collectorAreaTotalKm2 * 1e6;

  // 3. Power Harvested: P = eta * S * Area
  const totalPowerOutputWatts = quantumHarvestEfficiency * solarFluxWm2 * collectorAreaM2;
  const totalPowerOutputExawatts = totalPowerOutputWatts / 1e18;

  // 4. Photochemical Disequilibrium Delta G Calculation:
  // Delta G = R * T * sum(x_i * ln(x_i / x_i_eq))
  // Elevated by co-presence of CH4 (reducing) and O2/O3 (oxidizing) in atmosphere
  const rGas = 8.314;
  const tKelvin = target.equilibriumTempK;
  const ch4Fraction = target.spectralFeatures.ch4Ppm / 1e6;
  const o2Fraction = target.spectralFeatures.o2Percent / 100;

  // Thermodynamic equilibrium reference fractions
  const ch4Eq = 1e-12;
  const o2Eq = 1e-8;

  const termCH4 = ch4Fraction > 0 ? ch4Fraction * Math.log(ch4Fraction / ch4Eq) : 0;
  const termO2 = o2Fraction > 0 ? o2Fraction * Math.log(o2Fraction / o2Eq) : 0;

  const disequilibriumDeltaG = (rGas * tKelvin * (termCH4 + termO2)) / 1000; // in kJ/mol

  // Spectroscopic Signal-to-Noise Ratio (scales with Dyson baseline & collector nodes)
  const baselineFactor = Math.log10(interferometerBaselineKm / 1000);
  const nodeFactor = Math.sqrt(collectorNodesCount / 1000);
  const spectroscopicSNR = Math.min(250, 18.5 * baselineFactor * nodeFactor);

  // Biosignature score
  const baseProb = target.biosignatureProbability;
  const snrBonus = Math.min(5.0, spectroscopicSNR / 50.0);
  const biosignatureScorePercent = Math.min(99.8, parseFloat((baseProb + snrBonus).toFixed(1)));

  // Relativistic gravitational time dilation delay:
  // tau = t * sqrt(1 - 2GM / (c^2 r))
  const rsSun = (2 * G_CONST * SOLAR_MASS_KG) / Math.pow(C_SPEED, 2); // Schwarzschild radius of Sun (~2953m)
  const dilationRatio = Math.sqrt(1 - rsSun / radiusMeters);
  const relativisticDelayMicrosec = parseFloat(((1 - dilationRatio) * 1e6).toFixed(4));

  // Quantum array coherence metric (decays with distance, boosted by node entanglement)
  const quantumArrayCoherenceMetric = parseFloat(
    Math.min(0.9999, 0.95 + 0.04 * (quantumHarvestEfficiency - 0.4) + 0.009 * Math.log10(collectorNodesCount)).toFixed(4)
  );

  // Generate real-time telemetry stream across Dyson swarm clusters
  const telemetryStream: DysonTelemetryPacket[] = [];
  const sampleNodes = Math.min(8, Math.max(4, Math.floor(collectorNodesCount / 2000)));

  for (let i = 1; i <= sampleNodes; i++) {
    const anomaly = (i * 360) / sampleNodes + (Math.random() - 0.5) * 5;
    const nodePower = (totalPowerOutputExawatts / collectorNodesCount) * 1000; // In Petawatts
    const delay = (radiusMeters / C_SPEED) + (i * 0.02);

    telemetryStream.push({
      nodeId: `DYSON-SWARM-${String(i * 1250).padStart(5, '0')}`,
      orbitAnomalyDeg: parseFloat(anomaly.toFixed(1)),
      powerOutputExawatts: parseFloat(nodePower.toFixed(4)),
      quantumQubitCoherenceSec: parseFloat((240 + Math.random() * 40).toFixed(1)),
      telemetryDelaySec: parseFloat(delay.toFixed(2)),
      status: i % 4 === 0 ? 'stellar_alignment' : 'nominal',
    });
  }

  let atmosphericAssessment = '';
  if (biosignatureScorePercent >= 90) {
     atmosphericAssessment = 'CONFIRMED ANOMALOUS BIOSPHERE: Concurrent CH4-O2 photochemical disequilibrium detected at >5 sigma confidence. Unexplained by prebiotic volcanic kinetics.';
  } else if (biosignatureScorePercent >= 70) {
    atmosphericAssessment = 'HIGH BIOMARKER CANDIDATE: Detectable ozone absorption with moderate atmospheric water vapor. Ground-based confirmation recommended.';
  } else {
    atmosphericAssessment = 'PREBIOTIC / AMBIENT: Dominant CO2 signature with subdued reducing agents. Photochemical equilibrium consistent with volcanic outgassing.';
  }

  return {
    totalPowerOutputWatts,
    totalPowerOutputExawatts: parseFloat(totalPowerOutputExawatts.toFixed(2)),
    solarFluxWm2: parseFloat(solarFluxWm2.toFixed(1)),
    collectorAreaTotalKm2,
    targetAnalysis: {
      target,
      photochemicalDisequilibriumDeltaG: parseFloat(disequilibriumDeltaG.toFixed(2)),
      biosignatureScorePercent,
      spectroscopicSNR: parseFloat(spectroscopicSNR.toFixed(1)),
      atmosphericAssessment,
    },
    relativisticDelayMicrosec,
    quantumArrayCoherenceMetric,
    telemetryStream,
    timestamp: new Date().toISOString(),
  };
}
