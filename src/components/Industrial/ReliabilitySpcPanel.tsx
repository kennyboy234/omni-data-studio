import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart2,
  Activity,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Clock,
  Gauge,
  Zap,
  Info,
} from 'lucide-react';
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
} from '../../utils/reliabilitySpcEngine';
import {
  WeibullFailureData,
  SpcChartType,
  GaugeRRInput,
} from '../../types/industrial';

export const ReliabilitySpcPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weibull_km' | 'spc_capability' | 'oee_waterfall' | 'line_sim' | 'gauge_rr'>('weibull_km');

  // ====================================================================
  // 1. WEIBULL & KAPLAN-MEIER STATE
  // ====================================================================
  const [weibullDataset, setWeibullDataset] = useState<'reliasoft_sample' | 'bearing_test'>('reliasoft_sample');
  
  const rawWeibullData: WeibullFailureData[] = useMemo(() => {
    if (weibullDataset === 'reliasoft_sample') {
      return [
        { time: 16, censored: false },
        { time: 34, censored: false },
        { time: 53, censored: false },
        { time: 75, censored: false },
        { time: 98, censored: false },
        { time: 120, censored: false },
        { time: 150, censored: true },
        { time: 150, censored: true },
      ];
    } else {
      return [
        { time: 240, censored: false },
        { time: 480, censored: false },
        { time: 610, censored: false },
        { time: 890, censored: false },
        { time: 1100, censored: false },
        { time: 1250, censored: true },
        { time: 1500, censored: true },
      ];
    }
  }, [weibullDataset]);

  const weibullResult = useMemo(() => {
    try {
      return fitWeibullMle(rawWeibullData);
    } catch {
      return null;
    }
  }, [rawWeibullData]);

  const kmPoints = useMemo(() => {
    return calculateKaplanMeier(rawWeibullData);
  }, [rawWeibullData]);

  const reliabilityKpis = useMemo(() => {
    return calculateReliabilityKpis(
      2400,
      rawWeibullData.filter((d) => !d.censored).length,
      48,
      [
        { cause: 'Bearing Fatigue Spall', downtimeMinutes: 1440 },
        { cause: 'Lubrication Starvation', downtimeMinutes: 720 },
        { cause: 'Misalignment Vibration', downtimeMinutes: 360 },
        { cause: 'Seal Degradation', downtimeMinutes: 180 },
      ],
      [240, 480, 610, 890, 1100, 1400, 1850, 2400]
    );
  }, [rawWeibullData]);

  // ====================================================================
  // 2. SPC & PROCESS CAPABILITY STATE
  // ====================================================================
  const [spcType, setSpcType] = useState<SpcChartType>('I_MR');
  const [injectSpcOutlier, setInjectSpcOutlier] = useState<boolean>(false);
  const [usl, setUsl] = useState<number>(55.0);
  const [lsl, setLsl] = useState<number>(45.0);

  const spcRawData = useMemo(() => {
    const base = [
      49.8, 50.2, 50.1, 49.9, 50.3, 49.7, 50.0, 50.4, 49.6, 50.1,
      49.9, 50.2, 49.8, 50.0, 50.3, 49.9, 50.1, 49.7, 50.2, 50.0,
    ];
    if (injectSpcOutlier) {
      // Injects a 3-sigma violation
      const altered = [...base];
      altered[12] = 58.5; // Massive excursion above USL
      return altered;
    }
    return base;
  }, [injectSpcOutlier]);

  const spcChartResult = useMemo(() => {
    return calculateSpcChart(spcType, spcRawData);
  }, [spcType, spcRawData]);

  const capabilityResult = useMemo(() => {
    return calculateProcessCapability(
      spcRawData,
      usl,
      lsl,
      spcChartResult.inControl
    );
  }, [spcRawData, usl, lsl, spcChartResult.inControl]);

  // ====================================================================
  // 3. OEE & TEEP WATERFALL STATE
  // ====================================================================
  const [calendarHours, setCalendarHours] = useState<number>(24);
  const [plannedHours, setPlannedHours] = useState<number>(20);
  const [operatingHours, setOperatingHours] = useState<number>(16);
  const [idealCycleSec, setIdealCycleSec] = useState<number>(30);
  const [totalCount, setTotalCount] = useState<number>(1600);
  const [goodCount, setGoodCount] = useState<number>(1520);

  const oeeResult = useMemo(() => {
    return calculateOeeWaterfall(
      calendarHours,
      plannedHours,
      operatingHours,
      idealCycleSec,
      totalCount,
      goodCount
    );
  }, [calendarHours, plannedHours, operatingHours, idealCycleSec, totalCount, goodCount]);

  // ====================================================================
  // 4. LINE SIMULATION & BALANCING STATE
  // ====================================================================
  const [simSeed, setSimSeed] = useState<number>(42);
  const [simDurationHours, setSimDurationHours] = useState<number>(8);
  const [monteCarloRuns, setMonteCarloRuns] = useState<number>(25);
  const [simResult, setSimResult] = useState<any>(null);

  const lineBalanceResult = useMemo(() => {
    return calculateLineBalancing(480, 28800, [
      { id: 'st1', name: 'Stage 1: Stamping', taskDurationSec: 42 },
      { id: 'st2', name: 'Stage 2: Laser Weld', taskDurationSec: 56 },
      { id: 'st3', name: 'Stage 3: Robotic Seal', taskDurationSec: 38 },
      { id: 'st4', name: 'Stage 4: Optical QA', taskDurationSec: 45 },
    ]);
  }, []);

  const queueingResult = useMemo(() => {
    return calculateQueueingMMc(3.2, 2.0, 2);
  }, []);

  const runSimulation = () => {
    const res = runDiscreteEventSimulation({
      seed: simSeed,
      numStations: 4,
      stationNominalCycleTimesSec: [42, 56, 38, 45],
      bufferCapacities: [5, 5, 5],
      simulationDurationHours: simDurationHours,
      numMonteCarloRuns: monteCarloRuns,
      mtbfHours: 40,
      mttrHours: 1.5,
    });
    setSimResult(res);
  };

  // Run initial simulation once
  React.useEffect(() => {
    runSimulation();
  }, [simSeed, simDurationHours, monteCarloRuns]);

  // ====================================================================
  // 5. GAUGE R&R STATE
  // ====================================================================
  const sampleGaugeData: GaugeRRInput = useMemo(() => ({
    operators: ['Operator 1 (Day)', 'Operator 2 (Night)'],
    parts: ['Part 101', 'Part 102', 'Part 103'],
    trials: 2,
    measurements: [
      [
        [10.12, 10.15],
        [15.02, 15.08],
        [20.18, 20.21],
      ],
      [
        [10.14, 10.11],
        [15.05, 15.03],
        [20.22, 20.19],
      ],
    ],
  }), []);

  const gaugeResult = useMemo(() => {
    return calculateGaugeRR(sampleGaugeData);
  }, [sampleGaugeData]);

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('weibull_km')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'weibull_km'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Weibull & Kaplan-Meier</span>
        </button>
        <button
          onClick={() => setActiveTab('spc_capability')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'spc_capability'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>SPC & Process Capability</span>
        </button>
        <button
          onClick={() => setActiveTab('oee_waterfall')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'oee_waterfall'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>OEE & TEEP Waterfall</span>
        </button>
        <button
          onClick={() => setActiveTab('line_sim')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'line_sim'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Discrete-Event Sim & Line Balancing</span>
        </button>
        <button
          onClick={() => setActiveTab('gauge_rr')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'gauge_rr'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Gauge R&R (ANOVA)</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: WEIBULL & KAPLAN-MEIER                                      */}
      {/* ==================================================================== */}
      {activeTab === 'weibull_km' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control & Parameters Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Weibull MLE Configuration</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                  Nelson (1982) MLE
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Benchmark Test Dataset:</label>
                  <select
                    value={weibullDataset}
                    onChange={(e) => setWeibullDataset(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="reliasoft_sample">ReliaSoft 8-Unit Test (6 Failures, 2 Suspensions at 150h)</option>
                    <option value="bearing_test">Industrial Bearing Test (5 Failures, 2 Suspensions)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Units Tested:</span>
                    <span className="text-white font-mono">{rawWeibullData.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Uncensored Failures (r):</span>
                    <span className="text-emerald-400 font-mono">
                      {rawWeibullData.filter((d) => !d.censored).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Right-Censored Suspensions:</span>
                    <span className="text-amber-400 font-mono">
                      {rawWeibullData.filter((d) => d.censored).length}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-800/40 text-[11px] text-amber-300/90 leading-relaxed">
                  <strong>Weibull Governing Law:</strong>
                  <br />
                  F(t) = 1 - exp(-(t/η)^β). Shape β determines failure physics (early vs wear-out). Characteristic life η represents 63.2% failure point.
                </div>
              </div>
            </div>

            {/* Weibull MLE Results Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Fitted Parameters & MTTF</h3>
                </div>
                {weibullResult?.converged ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Converged ({weibullResult.iterations} iters)
                  </span>
                ) : (
                  <span className="text-[10px] text-red-400">Failed to converge</span>
                )}
              </div>

              {weibullResult && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Shape Parameter (β):</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">{weibullResult.beta}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      95% CI: [{weibullResult.confidenceBounds95.betaLower}, {weibullResult.confidenceBounds95.betaUpper}]
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Scale / Char. Life (η):</span>
                    <span className="text-xl font-bold font-mono text-amber-400">{weibullResult.eta} hrs</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      95% CI: [{weibullResult.confidenceBounds95.etaLower}, {weibullResult.confidenceBounds95.etaUpper}]
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Mean Life (MTTF):</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{weibullResult.mttf} hrs</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">η · Γ(1 + 1/β)</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">B10 Life (10% Fail):</span>
                    <span className="text-lg font-bold font-mono text-purple-400">{weibullResult.b10Life} hrs</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">90% Reliable Horizon</span>
                  </div>

                  <div className="col-span-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1">Failure Mechanism Regime:</span>
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 inline-block">
                      {weibullResult.betaInterpretation === 'WEAR_OUT_DEGRADATION'
                        ? 'WEAR-OUT REGIME (β > 1.05) - Preventive replacement recommended before B10'
                        : weibullResult.betaInterpretation === 'EARLY_INFANT_MORTALITY'
                        ? 'INFANT MORTALITY (β < 0.95) - Quality burn-in required'
                        : 'RANDOM EXPONENTIAL FAILURES (β ~ 1.0)'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Plant Inherent Availability & Crow-AMSAA Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">System Availability & Crow-AMSAA</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">MIL-HDBK-189</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-400 text-[10px] block">MTBF</span>
                    <span className="font-mono font-bold text-cyan-300">{reliabilityKpis.mtbfHours}h</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-400 text-[10px] block">MTTR</span>
                    <span className="font-mono font-bold text-amber-300">{reliabilityKpis.mttrHours}h</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-400 text-[10px] block">Availability (Ai)</span>
                    <span className="font-mono font-bold text-emerald-300">{reliabilityKpis.inherentAvailabilityPercent}%</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Downtime Causes (Pareto):</span>
                  <div className="space-y-1.5">
                    {reliabilityKpis.paretoDowntimeCauses.slice(0, 3).map((cause, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg text-[11px] border border-slate-800/80">
                        <span className="text-white">{cause.cause}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-amber-400">{cause.downtimeMinutes} min</span>
                          <span className="text-slate-500">({cause.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Crow-AMSAA Growth Trend (β):</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {reliabilityKpis.crowAmsaaBeta} ({reliabilityKpis.crowAmsaaBeta < 1 ? 'Improving' : 'Deteriorating'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kaplan-Meier Survival Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Kaplan-Meier Non-Parametric Survival Curve (Greenwood SE)</h3>
              </div>
              <span className="text-xs text-slate-400">JASA Standard Estimator</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2 px-3">Time t (hrs)</th>
                    <th className="py-2 px-3">At Risk (n)</th>
                    <th className="py-2 px-3">Failures (d)</th>
                    <th className="py-2 px-3">Censored (c)</th>
                    <th className="py-2 px-3">Survival Prob S(t)</th>
                    <th className="py-2 px-3">Greenwood SE</th>
                    <th className="py-2 px-3">95% Confidence Interval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {kmPoints.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-cyan-300 font-bold">{pt.time}</td>
                      <td className="py-2 px-3">{pt.nAtRisk}</td>
                      <td className="py-2 px-3 text-amber-300">{pt.nEvents}</td>
                      <td className="py-2 px-3 text-purple-300">{pt.nCensored}</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{(pt.survivalProbability * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3 text-slate-400">{pt.standardErrorGreenwood}</td>
                      <td className="py-2 px-3 text-slate-400">
                        [{(pt.confidenceInterval95[0] * 100).toFixed(1)}%, {(pt.confidenceInterval95[1] * 100).toFixed(1)}%]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: SPC CONTROL CHARTS & GATED PROCESS CAPABILITY               */}
      {/* ==================================================================== */}
      {activeTab === 'spc_capability' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SPC Chart Setup */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">SPC Control Configuration</h3>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono">Montgomery SQC</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Chart Type:</label>
                  <select
                    value={spcType}
                    onChange={(e) => setSpcType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="I_MR">I-MR Chart (Individual & Moving Range)</option>
                    <option value="EWMA">EWMA Chart (Exponentially Weighted Moving Average)</option>
                    <option value="CUSUM">CUSUM Chart (Cumulative Sum)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300 font-medium">Inject Special Cause Outlier (58.5):</span>
                    <input
                      type="checkbox"
                      checked={injectSpcOutlier}
                      onChange={(e) => setInjectSpcOutlier(e.target.checked)}
                      className="w-4 h-4 accent-red-500 rounded"
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 block">
                    Simulates a process anomaly to test Western Electric run rules and capability gating.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">USL (Upper Spec):</label>
                    <input
                      type="number"
                      value={usl}
                      onChange={(e) => setUsl(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">LSL (Lower Spec):</label>
                    <input
                      type="number"
                      value={lsl}
                      onChange={(e) => setLsl(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Center Line (CL):</span>
                    <span className="text-white">{spcChartResult.centerLine}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Upper Control Limit (UCL):</span>
                    <span className="text-cyan-400">{spcChartResult.ucl}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Lower Control Limit (LCL):</span>
                    <span className="text-cyan-400">{spcChartResult.lcl}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Run Rules Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Western Electric Run Rules</h3>
                </div>
                {spcChartResult.inControl ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    IN CONTROL
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-800">
                    OUT OF CONTROL
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div
                  className={`p-3 rounded-xl border ${
                    spcChartResult.inControl
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                      : 'bg-red-950/20 border-red-800/40 text-red-300'
                  }`}
                >
                  <p className="font-semibold text-[11px]">{spcChartResult.summaryMessage}</p>
                </div>

                {spcChartResult.violations.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    <span className="text-slate-400 font-semibold block">Active Violations:</span>
                    {spcChartResult.violations.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-950 rounded-lg text-[11px] border border-red-800/40 flex items-start gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono font-bold text-red-300">{v.ruleCode}: </span>
                          <span className="text-slate-300">{v.ruleDescription}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300 block">Monitored WE Rules:</span>
                  <div>Rule 1: 1 point beyond 3σ (Zone A limit)</div>
                  <div>Rule 2: 9 points in a row on same side of center</div>
                  <div>Rule 3: 6 consecutive points trending up/down</div>
                  <div>Rule 4: 14 points alternating in direction</div>
                </div>
              </div>
            </div>

            {/* MANDATORY GATED PROCESS CAPABILITY CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Process Capability (Cp, Cpk)</h3>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">AIAG SPC 2nd Ed</span>
              </div>

              {capabilityResult.isBlocked ? (
                <div className="p-4 bg-red-950/30 rounded-xl border border-red-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>CAPABILITY METRICS BLOCKED</span>
                  </div>
                  <p className="text-xs text-red-200/90 leading-relaxed font-mono text-[11px]">
                    {capabilityResult.blockedReason}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-red-900/40">
                    Mandatory Standard Rule: ISO 22514 & AIAG require statistical stability and Gaussian normality before computing Cp/Cpk.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Potential Cap. (Cp):</span>
                      <span className="text-xl font-bold font-mono text-cyan-400">{capabilityResult.cp}</span>
                      <span className="text-[10px] text-slate-500 block">(USL - LSL) / 6σ</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Actual Cap. (Cpk):</span>
                      <span className="text-xl font-bold font-mono text-emerald-400">{capabilityResult.cpk}</span>
                      <span className="text-[10px] text-slate-500 block">Min(Cpu, Cpl)</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Performance (Pp):</span>
                      <span className="text-lg font-bold font-mono text-purple-400">{capabilityResult.pp}</span>
                      <span className="text-[10px] text-slate-500 block">Overall Variance</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Performance (Ppk):</span>
                      <span className="text-lg font-bold font-mono text-purple-400">{capabilityResult.ppk}</span>
                      <span className="text-[10px] text-slate-500 block">Overall Capability</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Expected Defects:</span>
                      <span className="text-emerald-400 font-bold">{capabilityResult.expectedDpmOverall} DPM</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Normality p-value:</span>
                      <span className="text-slate-300">{capabilityResult.normalityPValue} (p &gt; 0.05 PASS)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: OEE & TEEP WATERFALL DECOMPOSITION                           */}
      {/* ==================================================================== */}
      {activeTab === 'oee_waterfall' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Input Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Production Shift Inputs</h3>
                </div>
                <span className="text-[10px] text-emerald-300 font-mono">ISO 22400-2</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Calendar Time (Hours):</label>
                  <input
                    type="number"
                    value={calendarHours}
                    onChange={(e) => setCalendarHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Planned Production (Hours):</label>
                  <input
                    type="number"
                    value={plannedHours}
                    onChange={(e) => setPlannedHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Operating Time (Hours):</label>
                  <input
                    type="number"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Ideal Cycle Time (Seconds):</label>
                  <input
                    type="number"
                    value={idealCycleSec}
                    onChange={(e) => setIdealCycleSec(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Total Units Produced:</label>
                  <input
                    type="number"
                    value={totalCount}
                    onChange={(e) => setTotalCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Good Units Produced:</label>
                  <input
                    type="number"
                    value={goodCount}
                    onChange={(e) => setGoodCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* KPI Cards & Waterfall (Spans 3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-slate-400 text-xs block">Availability (A):</span>
                  <span className="text-2xl font-bold font-mono text-cyan-400">
                    {(oeeResult.availabilityRate * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Operating / Planned</span>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-slate-400 text-xs block">Performance (P):</span>
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {(oeeResult.performanceRate * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Ideal / Operating</span>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-slate-400 text-xs block">Quality (Q):</span>
                  <span className="text-2xl font-bold font-mono text-purple-400">
                    {(oeeResult.qualityRate * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Good / Total</span>
                </div>

                <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl">
                  <span className="text-emerald-300 text-xs font-bold block">Overall OEE:</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {oeeResult.oeePercent}%
                  </span>
                  <span className="text-[10px] text-emerald-500 block mt-0.5">A × P × Q</span>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-slate-400 text-xs block">TEEP (Asset Util):</span>
                  <span className="text-2xl font-bold font-mono text-cyan-400">
                    {oeeResult.teepPercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">24/7 Calendar Total</span>
                </div>
              </div>

              {/* Loss Waterfall Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Loss Waterfall Decomposition (Hours)</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Traceable Audit</span>
                </div>

                <div className="space-y-3">
                  {oeeResult.waterfall.map((stage, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{stage.stage}</span>
                        <span className="font-mono font-bold text-cyan-300">{stage.hours} hrs</span>
                      </div>
                      {stage.lossHours > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-red-400/90 pl-3 border-l-2 border-red-500/40">
                          <span>Loss: {stage.lossReason}</span>
                          <span className="font-mono">-{stage.lossHours} hrs</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: DISCRETE-EVENT SIMULATION & LINE BALANCING                  */}
      {/* ==================================================================== */}
      {activeTab === 'line_sim' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulation Config Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Discrete-Event Simulator</h3>
                </div>
                <span className="text-[10px] text-indigo-300 font-mono">Monte Carlo DES</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Random Seed (Reproducibility):</label>
                  <input
                    type="number"
                    value={simSeed}
                    onChange={(e) => setSimSeed(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Simulated Duration (Hours):</label>
                  <input
                    type="number"
                    value={simDurationHours}
                    onChange={(e) => setSimDurationHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Monte Carlo Iterations:</label>
                  <input
                    type="number"
                    value={monteCarloRuns}
                    onChange={(e) => setMonteCarloRuns(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>

                <button
                  onClick={runSimulation}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-950/40"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Seeded Monte Carlo Simulation</span>
                </button>
              </div>
            </div>

            {/* Simulation Results Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Throughput & Confidence Interval</h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">95% CI</span>
              </div>

              {simResult && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Mean Hourly Throughput:</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {simResult.throughputPerHourMean} units/hr
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      95% Confidence Interval: [{simResult.confidenceInterval95[0]}, {simResult.confidenceInterval95[1]}]
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Mean Shift Total:</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">
                      {simResult.totalPartsProducedMean} parts
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Across {simResult.monteCarloRunTotals.length} stochastic runs
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">Station Utilizations:</span>
                    <div className="space-y-1.5">
                      {simResult.stationUtilizationPercentages.map((util: number, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg text-[11px] border border-slate-800/80">
                          <span className="text-white">Station {idx + 1}</span>
                          <span className={`font-mono font-bold ${idx === simResult.bottleneckStationIndex ? 'text-amber-400' : 'text-slate-300'}`}>
                            {util}% {idx === simResult.bottleneckStationIndex && '(Bottleneck)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Line Balancing & Queueing Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Line Balancing & Queueing</h3>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">Erlang-C</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Takt Time:</span>
                    <span className="font-bold text-cyan-400">{lineBalanceResult.taktTimeSec}s</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Balance Eff:</span>
                    <span className="font-bold text-emerald-400">{lineBalanceResult.lineBalanceEfficiencyPercent}%</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Identified Bottleneck:</span>
                  <span className="font-bold text-amber-400">{lineBalanceResult.bottleneckStation}</span>
                  <span className="text-[10px] text-slate-500 block">Cycle time: {lineBalanceResult.bottleneckCycleTimeSec}s</span>
                </div>

                <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-800/40 space-y-1 font-mono text-[11px]">
                  <span className="text-purple-300 font-bold block">M/M/c Waiting Queue:</span>
                  <div className="flex justify-between text-slate-400">
                    <span>Traffic Intensity (ρ):</span>
                    <span className="text-white">{queueingResult.trafficIntensityRho}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Avg Queue Length (Lq):</span>
                    <span className="text-cyan-300">{queueingResult.avgQueueLengthLq} jobs</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Avg Waiting Time (Wq):</span>
                    <span className="text-cyan-300">{(queueingResult.avgTimeInQueueWq * 60).toFixed(1)} mins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 5: GAUGE R&R (ANOVA METHOD)                                    */}
      {/* ==================================================================== */}
      {activeTab === 'gauge_rr' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Gauge Study Benchmark</h3>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">AIAG MSA 4th Ed</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Operators:</span>
                    <span className="text-white">2 (Day, Night)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sample Parts:</span>
                    <span className="text-white">3 distinct parts</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Trials per Operator:</span>
                    <span className="text-white">2 trials each</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Observations:</span>
                    <span className="text-cyan-400">12 measurements</span>
                  </div>
                </div>

                <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-800/40 text-[11px] text-purple-300/90 leading-relaxed">
                  <strong>Measurement System Analysis (MSA):</strong>
                  <br />
                  Evaluates Repeatability (Equipment Variation EV) and Reproducibility (Appraiser Variation AV) via Two-Way Crossed ANOVA.
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Variance Components & NDC</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                  gaugeResult.verdict.startsWith('ACCEPTABLE')
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {gaugeResult.verdict}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Repeatability (EV):</span>
                  <span className="text-lg font-bold font-mono text-cyan-400">{gaugeResult.equipmentVariationEV}</span>
                  <span className="text-[10px] text-slate-500 block">Equipment Var</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Reproducibility (AV):</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{gaugeResult.appraiserVariationAV}</span>
                  <span className="text-[10px] text-slate-500 block">Operator Var</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">%Study Var (%GRR):</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{gaugeResult.percentStudyVarGRR}%</span>
                  <span className="text-[10px] text-slate-500 block">&lt; 10% Acceptable</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Distinct Categories (NDC):</span>
                  <span className="text-lg font-bold font-mono text-purple-400">{gaugeResult.numberOfDistinctCategoriesNDC}</span>
                  <span className="text-[10px] text-slate-500 block">{gaugeResult.ndcVerdict}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
