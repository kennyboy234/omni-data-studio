import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Cpu,
  Activity,
  Gauge,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Car,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  GitBranch,
  Layers,
  ArrowRight,
  Info,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  DHParameter,
  ForwardKinematicsResult,
  IndustrialAsset,
  SensorTag,
} from '../../types/industrial';
import {
  computeForwardKinematics,
  generateTrapezoidalProfile,
  calculateMotorSizing,
  evaluateNioshLifting,
  solveInverseKinematicsDLS,
} from '../../utils/roboticsEngine';
import {
  RobotBrainNeuralNet,
  generateRobotTrainingData,
  trainRobotBrainModel,
  evaluateMachineryDiagnostics,
  calculateAsymmetricRulScore,
} from '../../utils/robotBrainTraining';
import {
  auditSensorTelemetryStream,
  TelemetryReading,
} from '../../utils/industrialQuality';
import { ReliabilitySpcPanel } from '../Industrial/ReliabilitySpcPanel';
import { QuantumErrorSimulatorPanel } from '../Industrial/QuantumErrorSimulatorPanel';
import { UniversalConnectivityStudio } from '../Industrial/UniversalConnectivityStudio';
import { PredictiveModelsPanel } from '../Industrial/PredictiveModelsPanel';
import { RiskAnalysisPanel } from '../Industrial/RiskAnalysisPanel';
import { FleetMapPanel } from '../../03-fleet/FleetMapPanel';

export const WF14Industrial: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'fleet_map' | 'brain_trainer' | 'kinematics_math' | 'machinery_scanner' | 'asset_tree' | 'reliability_spc' | 'quantum_error' | 'universal_connectivity' | 'predictive_models' | 'risk_analysis'
  >('fleet_map');

  // -------------------------------------------------------------
  // TAB 1: ROBOT BRAIN & NEURAL POLICY TRAINING STATE
  // -------------------------------------------------------------
  const [trainingDomain, setTrainingDomain] = useState<'vehicle_steering' | 'robot_joint_torques' | 'machinery_health'>('vehicle_steering');
  const [epochs, setEpochs] = useState<number>(30);
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainedEpochsCount, setTrainedEpochsCount] = useState<number>(0);
  const [lossHistory, setLossHistory] = useState<{ epoch: number; loss: number; accuracy: number }[]>([]);
  const [modelTrained, setModelTrained] = useState<boolean>(false);

  // Live inference sliders
  const [inferenceInputs, setInferenceInputs] = useState<number[]>([0.5, 0.1, 0.02, 18.0]);
  const [predictedOutputs, setPredictedOutputs] = useState<number[]>([]);

  // Neural net instance
  const [neuralNet, setNeuralNet] = useState<RobotBrainNeuralNet>(
    () => new RobotBrainNeuralNet([4, 16, 16, 2], 'relu', 0.01, 42)
  );

  // Initialize data for selected domain
  const trainingData = useMemo(() => {
    return generateRobotTrainingData(trainingDomain, 60);
  }, [trainingDomain]);

  // Reset net when domain changes
  useEffect(() => {
    const inDim = trainingData.featureNames.length;
    const outDim = trainingData.targetNames.length;
    const newNet = new RobotBrainNeuralNet([inDim, 16, 16, outDim], 'relu', learningRate, Date.now());
    setNeuralNet(newNet);
    setModelTrained(false);
    setLossHistory([]);
    setTrainedEpochsCount(0);
    // Set default inference inputs
    if (trainingData.inputs.length > 0) {
      setInferenceInputs([...trainingData.inputs[0]]);
    }
  }, [trainingDomain, trainingData, learningRate]);

  // Live prediction when inference inputs or model updates
  useEffect(() => {
    if (inferenceInputs.length > 0) {
      const pred = neuralNet.predict(inferenceInputs);
      setPredictedOutputs(pred.map((p) => Math.round(p * 100) / 100));
    }
  }, [inferenceInputs, neuralNet, trainedEpochsCount]);

  const handleStartTraining = () => {
    setIsTraining(true);
    setTimeout(() => {
      const { lossHistory: history } = trainRobotBrainModel(
        neuralNet,
        trainingData.inputs,
        trainingData.targets,
        epochs
      );
      setLossHistory(history);
      setTrainedEpochsCount((prev) => prev + epochs);
      setModelTrained(true);
      setIsTraining(false);
    }, 400);
  };

  // -------------------------------------------------------------
  // TAB 2: DEEP KINEMATICS & ROBOTICS MATHEMATICS STATE
  // -------------------------------------------------------------
  const [dhParams, setDhParams] = useState<DHParameter[]>([
    { joint: 1, thetaDeg: 30, d: 0, a: 150, alphaDeg: 0 },
    { joint: 2, thetaDeg: 45, d: 0, a: 120, alphaDeg: 0 },
    { joint: 3, thetaDeg: -20, d: 0, a: 80, alphaDeg: 0 },
  ]);

  const [ikTarget, setIkTarget] = useState<[number, number, number]>([180, 140, 0]);
  const [ikLambda, setIkLambda] = useState<number>(0.05);

  const fkResult: ForwardKinematicsResult = useMemo(() => {
    return computeForwardKinematics(dhParams);
  }, [dhParams]);

  const [ikResult, setIkResult] = useState<any>(null);

  const handleSolveIK = () => {
    const res = solveInverseKinematicsDLS({
      targetPosition: ikTarget,
      currentThetasDeg: dhParams.map((p) => p.thetaDeg),
      dhParams,
      dampingFactorLambda: ikLambda,
      maxIterations: 60,
      toleranceMm: 1.0,
    });
    setIkResult(res);
    if (res.converged) {
      setDhParams((prev) =>
        prev.map((p, idx) => ({ ...p, thetaDeg: res.finalThetasDeg[idx] }))
      );
    }
  };

  // Trapezoidal velocity state
  const [trapDist, setTrapDist] = useState<number>(800);
  const [trapVMax, setTrapVMax] = useState<number>(250);
  const [trapAMax, setTrapAMax] = useState<number>(120);

  const trapezoidalProfile = useMemo(() => {
    return generateTrapezoidalProfile(trapDist, trapVMax, trapAMax);
  }, [trapDist, trapVMax, trapAMax]);

  // Motor Sizing state
  const [motorLoadKg, setMotorLoadKg] = useState<number>(15);
  const [motorRadiusM, setMotorRadiusM] = useState<number>(0.06);
  const [motorAccMps2, setMotorAccMps2] = useState<number>(2.5);

  const motorSizingResult = useMemo(() => {
    return calculateMotorSizing({
      loadMassKg: motorLoadKg,
      radiusM: motorRadiusM,
      maxAccelerationMps2: motorAccMps2,
      frictionTorqueNm: 0.8,
      operatingCycle: [
        { durationSec: 1.2, torqueNm: 8.5 },
        { durationSec: 3.0, torqueNm: 4.2 },
        { durationSec: 1.2, torqueNm: 1.5 },
        { durationSec: 2.0, torqueNm: 0.0 },
      ],
    });
  }, [motorLoadKg, motorRadiusM, motorAccMps2]);

  // NIOSH Lifting state
  const [nioshWeight, setNioshWeight] = useState<number>(16);
  const [nioshH, setNioshH] = useState<number>(32);
  const [nioshV, setNioshV] = useState<number>(75);

  const nioshResult = useMemo(() => {
    return evaluateNioshLifting({
      loadWeightKg: nioshWeight,
      horizontalDistanceCm: nioshH,
      verticalDistanceCm: nioshV,
      verticalTravelDistanceCm: 45,
      asymmetryAngleDeg: 10,
      frequencyLiftsPerMin: 2.0,
      couplingQuality: 'fair',
      durationHours: '<=2',
    });
  }, [nioshWeight, nioshH, nioshV]);

  // -------------------------------------------------------------
  // TAB 3: MACHINERY & VEHICLE DIAGNOSTIC SCANNER STATE
  // -------------------------------------------------------------
  const [selectedAssetKey, setSelectedAssetKey] = useState<string>('tesla_model_s');
  const [simulatedTemp, setSimulatedTemp] = useState<number>(68.0);
  const [simulatedVib, setSimulatedVib] = useState<number>(1.4);
  const [simulatedCurrent, setSimulatedCurrent] = useState<number>(18.5);
  const [simulatedPressure, setSimulatedPressure] = useState<number>(195.0);
  const [injectStuckFault, setInjectStuckFault] = useState<boolean>(false);

  const assetOptions = [
    { id: 'tesla_model_s', name: 'Tesla Model S Plaid Powertrain & Battery', type: 'autonomous_vehicle' },
    { id: 'kuka_robot_arm', name: 'Gigafactory 6-DOF Robotic Cell #04', type: 'robot_manipulator' },
    { id: 'cnc_milling_spindle', name: 'DMG Mori 5-Axis CNC Milling Spindle', type: 'cnc_mill' },
    { id: 'turbofan_engine', name: 'Rolls-Royce Trent Turbofan Rotor Core', type: 'turbine' },
  ];

  const currentDiagnostics = useMemo(() => {
    const selected = assetOptions.find((a) => a.id === selectedAssetKey) || assetOptions[0];
    return evaluateMachineryDiagnostics(selected.id, selected.name, {
      motor_temp_c: simulatedTemp,
      vibration_rms_g: simulatedVib,
      inverter_current_a: simulatedCurrent,
      hydraulic_pressure_bar: simulatedPressure,
    });
  }, [selectedAssetKey, simulatedTemp, simulatedVib, simulatedCurrent, simulatedPressure]);

  // Sensor Quality stream
  const sensorAuditReport = useMemo(() => {
    const readings: TelemetryReading[] = [];
    const base = Date.now();
    for (let i = 0; i < 30; i++) {
      let val = simulatedTemp + (Math.sin(i * 0.4) * 1.5);
      if (injectStuckFault && i >= 12 && i <= 24) {
        val = 72.45; // stuck flatline
      }
      readings.push({
        timestamp: new Date(base + i * 200).toISOString(),
        value: Math.round(val * 100) / 100,
        tagId: 'tag_temp_sensor',
        tagName: 'Stator Temperature',
      });
    }
    return auditSensorTelemetryStream(readings, {
      tagId: 'tag_temp_sensor',
      tagName: 'Stator Temperature',
      validRange: [10, 130],
      samplingRateHz: 5,
    });
  }, [simulatedTemp, injectStuckFault]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-3 h-3 text-cyan-400" />
                INDUSTRIAL AUTONOMY &amp; ROBOT BRAIN
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                ADVISORY ONLY • ZERO EQUIPMENT WRITES
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Robot Brain AI Training &amp; Machinery Intelligence Console</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-layer neural policy training, Denavit-Hartenberg kinematics, Jacobian DLS inverse kinematics, Hotelling $T^2$ anomaly detection, and vehicle/machinery diagnostic telemetry.
            </p>
          </div>

          {/* Subtabs switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start lg:self-auto flex-wrap">
            <button
              onClick={() => setActiveSubTab('fleet_map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'fleet_map'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/50'
                  : 'text-cyan-300 hover:text-white bg-cyan-950/50 border border-cyan-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>WF14 Fleet Map (Trails &amp; Heartbeat)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('brain_trainer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'brain_trainer'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Robot Brain Trainer</span>
            </button>
            <button
              onClick={() => setActiveSubTab('kinematics_math')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'kinematics_math'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Deep Kinematics Math</span>
            </button>
            <button
              onClick={() => setActiveSubTab('machinery_scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'machinery_scanner'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Machinery Scanner</span>
            </button>
            <button
              onClick={() => setActiveSubTab('asset_tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'asset_tree'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ISA-95 UNS Tree</span>
            </button>
            <button
              onClick={() => setActiveSubTab('reliability_spc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'reliability_spc'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Reliability, SPC & OEE</span>
            </button>
            <button
              onClick={() => setActiveSubTab('quantum_error')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'quantum_error'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quantum Error Sim</span>
            </button>
            <button
              onClick={() => setActiveSubTab('universal_connectivity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'universal_connectivity'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>Universal Fleet &amp; App Mesh</span>
            </button>
            <button
              onClick={() => setActiveSubTab('predictive_models')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'predictive_models'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Predictive Models &amp; Drift</span>
            </button>
            <button
              onClick={() => setActiveSubTab('risk_analysis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'risk_analysis'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Risk &amp; FMEA / FTA</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 0: FLEET RADAR MAP & REAL-TIME TRAILS (STUDIO 3)       */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'fleet_map' && (
        <FleetMapPanel />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 1: ROBOT BRAIN & NEURAL POLICY TRAINING CONSOLE        */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'brain_trainer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Configuration & Training Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Robot Brain Model Config</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                {trainingDomain === 'vehicle_steering' ? 'Tesla Autopilot' : trainingDomain === 'robot_joint_torques' ? 'KUKA 6-DOF' : 'Machinery AI'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Target Application Domain:</label>
                <select
                  value={trainingDomain}
                  onChange={(e) => setTrainingDomain(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="vehicle_steering">🚗 Tesla Autonomous Vehicle (Stanley / Pure Pursuit)</option>
                  <option value="robot_joint_torques">🦾 Robotic Arm Inverse Dynamics (Torque Planning)</option>
                  <option value="machinery_health">🏭 Industrial Machinery Multi-Modal Diagnostics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Epochs:</label>
                  <input
                    type="number"
                    value={epochs}
                    min={5}
                    max={200}
                    onChange={(e) => setEpochs(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Learning Rate (α):</label>
                  <input
                    type="number"
                    value={learningRate}
                    step={0.005}
                    min={0.001}
                    max={0.1}
                    onChange={(e) => setLearningRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-400 uppercase text-[10px]">Neural Architecture Topology:</div>
                <div className="text-cyan-300 font-bold">
                  [{trainingData.featureNames.length} Inputs] → [16 Dense (ReLU)] → [16 Dense (ReLU)] → [{trainingData.targetNames.length} Outputs]
                </div>
                <div className="text-slate-500 text-[10px]">
                  Optimizer: Adam/SGD • Loss: Mean Squared Error (MSE)
                </div>
              </div>

              <button
                onClick={handleStartTraining}
                disabled={isTraining}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isTraining ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Backpropagating Neural Gradients...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Train Robot Brain ({epochs} Epochs)</span>
                  </>
                )}
              </button>

              {modelTrained && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-between text-emerald-300 text-[11px] font-mono">
                  <span>Model Status: TRAINED &amp; ACTIVE</span>
                  <span>{trainedEpochsCount} total epochs</span>
                </div>
              )}
            </div>
          </div>

          {/* Center: Live Loss Curve & Training Telemetry */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Loss Convergence Curve</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {lossHistory.length > 0 ? `Final MSE: ${lossHistory[lossHistory.length - 1].loss}` : 'Awaiting Run'}
              </span>
            </div>

            {lossHistory.length > 0 ? (
              <div className="space-y-3">
                {/* Visual Loss Bar Sparkline */}
                <div className="h-32 bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-end gap-1 overflow-x-auto">
                  {lossHistory.map((pt, idx) => {
                    const maxLoss = lossHistory[0].loss || 1;
                    const heightPct = Math.max(8, Math.min(100, (pt.loss / maxLoss) * 100));
                    return (
                      <div
                        key={idx}
                        title={`Epoch ${pt.epoch}: Loss = ${pt.loss}`}
                        className="flex-1 bg-gradient-to-t from-cyan-600 to-indigo-500 rounded-t-sm hover:from-cyan-400 hover:to-indigo-300 transition-all min-w-[4px]"
                        style={{ height: `${heightPct}%` }}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Initial Loss</span>
                    <span className="text-amber-400 font-bold">{lossHistory[0]?.loss}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Final Loss</span>
                    <span className="text-emerald-400 font-bold">{lossHistory[lossHistory.length - 1]?.loss}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Loss Drop</span>
                    <span className="text-cyan-400 font-bold">
                      {Math.round(((lossHistory[0].loss - lossHistory[lossHistory.length - 1].loss) / Math.max(1e-6, lossHistory[0].loss)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-44 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs p-4 text-center">
                <Sparkles className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
                <span>Click &quot;Train Robot Brain&quot; to execute real backpropagation and view convergence.</span>
              </div>
            )}

            <div className="text-slate-400 text-[11px] leading-relaxed border-t border-slate-800 pt-3">
              <strong>Theorem (Universal Approximation):</strong> The feedforward neural network computes parameter updates &Delta;W = -&alpha; &middot; &nabla;L ensuring gradient descent convergence.
            </div>
          </div>

          {/* Right: Live Interactive Inference Playground */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Brain Inference</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                REAL-TIME
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400 text-[11px]">
                Adjust input sensory parameters below to test the robot brain&apos;s real-time actuation command:
              </p>

              {trainingData.featureNames.map((feat, idx) => (
                <div key={feat} className="space-y-1">
                  <div className="flex justify-between text-slate-300 font-mono text-[11px]">
                    <span>{feat}</span>
                    <span className="text-cyan-400 font-bold">{inferenceInputs[idx] ?? 0}</span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={40}
                    step={0.1}
                    value={inferenceInputs[idx] ?? 0}
                    onChange={(e) => {
                      const updated = [...inferenceInputs];
                      updated[idx] = Number(e.target.value);
                      setInferenceInputs(updated);
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              ))}

              {/* Neural Brain Output Actuation */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-2 mt-4 shadow-lg">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider block">
                  Robot Brain Output Decisions
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {trainingData.targetNames.map((target, idx) => (
                    <div key={target} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">{target}</span>
                      <span className="text-base font-bold font-mono text-white">
                        {predictedOutputs[idx] !== undefined ? predictedOutputs[idx] : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 2: DEEP KINEMATICS & ROBOTICS MATHEMATICS              */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'kinematics_math' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Denavit-Hartenberg Forward & Inverse Kinematics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Denavit-Hartenberg Kinematics</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400">3-DOF Articulated Arm</span>
            </div>

            {/* Joint Parameters */}
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800 pb-1">
                <span>Joint</span>
                <span>θ (Angle)</span>
                <span>a (Length mm)</span>
                <span>α (Twist)</span>
              </div>
              {dhParams.map((p, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-center text-xs font-mono">
                  <span className="text-white font-bold">Joint {idx + 1}</span>
                  <input
                    type="number"
                    value={p.thetaDeg}
                    onChange={(e) => {
                      const updated = [...dhParams];
                      updated[idx].thetaDeg = Number(e.target.value);
                      setDhParams(updated);
                    }}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                  />
                  <input
                    type="number"
                    value={p.a}
                    onChange={(e) => {
                      const updated = [...dhParams];
                      updated[idx].a = Number(e.target.value);
                      setDhParams(updated);
                    }}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                  />
                  <span className="text-slate-400 text-center">{p.alphaDeg}°</span>
                </div>
              ))}
            </div>

            {/* Computed End Effector Position */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-800/80 space-y-2">
              <span className="text-[10px] font-mono text-indigo-300 uppercase font-bold block">
                Forward Kinematics End-Effector Result:
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">X (mm)</span>
                  <span className="text-emerald-400 font-bold">{fkResult.endEffectorPosition[0]}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Y (mm)</span>
                  <span className="text-emerald-400 font-bold">{fkResult.endEffectorPosition[1]}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Z (mm)</span>
                  <span className="text-emerald-400 font-bold">{fkResult.endEffectorPosition[2]}</span>
                </div>
              </div>
            </div>

            {/* Damped Least Squares IK Solver */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Damped Least Squares (DLS) IK Solver</span>
                <span className="text-[10px] font-mono text-cyan-400">Levenberg-Marquardt</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block">Target X:</label>
                  <input
                    type="number"
                    value={ikTarget[0]}
                    onChange={(e) => setIkTarget([Number(e.target.value), ikTarget[1], ikTarget[2]])}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Target Y:</label>
                  <input
                    type="number"
                    value={ikTarget[1]}
                    onChange={(e) => setIkTarget([ikTarget[0], Number(e.target.value), ikTarget[2]])}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Damping λ:</label>
                  <input
                    type="number"
                    step={0.01}
                    value={ikLambda}
                    onChange={(e) => setIkLambda(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <button
                onClick={handleSolveIK}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer shadow"
              >
                Solve Inverse Kinematics (Iterative DLS)
              </button>

              {ikResult && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <span className={ikResult.converged ? 'text-emerald-400' : 'text-amber-400'}>
                    {ikResult.converged ? '✓ Converged' : '⚠ Max Iterations'}
                  </span>
                  <span className="text-slate-400">
                    Error: <strong className="text-white">{ikResult.finalErrorMm} mm</strong> in {ikResult.iterations} iters
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trapezoidal Velocity Profiling & Motor RMS Dynamics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Trapezoidal Trajectory &amp; Motor Sizing</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 uppercase">
                {trapezoidalProfile.regime} Regime
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-slate-400 text-[10px] block">Distance (mm):</label>
                <input
                  type="number"
                  value={trapDist}
                  onChange={(e) => setTrapDist(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] block">vMax (mm/s):</label>
                <input
                  type="number"
                  value={trapVMax}
                  onChange={(e) => setTrapVMax(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] block">aMax (mm/s²):</label>
                <input
                  type="number"
                  value={trapAMax}
                  onChange={(e) => setTrapAMax(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                />
              </div>
            </div>

            {/* Profile Timing Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">tAccel</span>
                <span className="text-cyan-400 font-bold">{trapezoidalProfile.tAccel}s</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">tFlat</span>
                <span className="text-cyan-400 font-bold">{trapezoidalProfile.tFlat}s</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">tDecel</span>
                <span className="text-cyan-400 font-bold">{trapezoidalProfile.tDecel}s</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Time</span>
                <span className="text-emerald-400 font-bold">{trapezoidalProfile.totalTime}s</span>
              </div>
            </div>

            {/* Motor Sizing Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Industrial Motor RMS Sizing</span>
                <span className="text-[10px] font-mono text-purple-400">τ_rms = √(1/T ∫ τ² dt)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Peak Torque</span>
                  <span className="text-white font-bold">{motorSizingResult.peakTorqueNm} Nm</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">RMS Torque</span>
                  <span className="text-emerald-400 font-bold">{motorSizingResult.rmsTorqueNm} Nm</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Safety Factor</span>
                  <span className="text-cyan-400 font-bold">{motorSizingResult.safetyFactor}x</span>
                </div>
              </div>
            </div>

            {/* Revised NIOSH Ergonomics */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Revised NIOSH Ergonomic Lifting Equation</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  nioshResult.riskCategory.includes('NOMINAL') ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                }`}>
                  LI = {nioshResult.liftingIndex}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>RWL: <strong className="text-white">{nioshResult.recommendedWeightLimitKg} kg</strong></span>
                <span>Load: <strong className="text-white">{nioshWeight} kg</strong></span>
                <span>Category: <strong className="text-cyan-400">{nioshResult.riskCategory}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 3: MACHINERY & VEHICLE DIAGNOSTIC SCANNER              */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'machinery_scanner' && (
        <div className="space-y-6">
          {/* Asset & Telemetry Live Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider block">
                  PHYSICAL MACHINERY &amp; VEHICLE HEALTH SCANNER
                </span>
                <h3 className="text-base font-bold text-white">
                  &quot;What is on the car, machinery, or robot?&quot; Live Telemetry Diagnostics
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedAssetKey}
                  onChange={(e) => setSelectedAssetKey(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-1 focus:ring-cyan-500"
                >
                  {assetOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Telemetry Sliders to Simulate Real Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Temperature:</span>
                  <span className={`font-bold ${simulatedTemp > 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {simulatedTemp}°C
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={120}
                  value={simulatedTemp}
                  onChange={(e) => setSimulatedTemp(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Vibration (RMS):</span>
                  <span className={`font-bold ${simulatedVib > 2.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {simulatedVib} g
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={6.0}
                  step={0.1}
                  value={simulatedVib}
                  onChange={(e) => setSimulatedVib(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Inverter Current:</span>
                  <span className="font-bold text-white">{simulatedCurrent} A</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={simulatedCurrent}
                  onChange={(e) => setSimulatedCurrent(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Pressure / Stress:</span>
                  <span className="font-bold text-white">{simulatedPressure} bar</span>
                </div>
                <input
                  type="range"
                  min={120}
                  max={280}
                  value={simulatedPressure}
                  onChange={(e) => setSimulatedPressure(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            {/* Diagnostic Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Health Index</span>
                <span className={`text-2xl font-bold font-mono ${
                  currentDiagnostics.healthIndexScore > 75 ? 'text-emerald-400' : currentDiagnostics.healthIndexScore > 40 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {currentDiagnostics.healthIndexScore}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">Status: {currentDiagnostics.overallStatus}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Hotelling T²</span>
                <span className={`text-2xl font-bold font-mono ${
                  currentDiagnostics.hotellingTSquared > currentDiagnostics.hotellingThreshold ? 'text-red-400' : 'text-cyan-400'
                }`}>
                  {currentDiagnostics.hotellingTSquared}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">Threshold: {currentDiagnostics.hotellingThreshold}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">SPE / Q-Statistic</span>
                <span className={`text-2xl font-bold font-mono ${
                  currentDiagnostics.squaredPredictionError > currentDiagnostics.speThreshold ? 'text-red-400' : 'text-indigo-400'
                }`}>
                  {currentDiagnostics.squaredPredictionError}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">Threshold: {currentDiagnostics.speThreshold}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Remaining Life (RUL)</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {currentDiagnostics.remainingUsefulLifeDays} days
                </span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  95% CI: [{currentDiagnostics.rulUncertaintyConfidence95[0]} - {currentDiagnostics.rulUncertaintyConfidence95[1]}d]
                </span>
              </div>
            </div>

            {/* Component Fault Diagnosis Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
                    <th className="py-2.5 px-3">Component Inspected</th>
                    <th className="py-2.5 px-3">Anomaly Type</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Recommended Remedial Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {currentDiagnostics.componentFaults.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-semibold text-white">{f.component}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{f.anomalyType}</td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                          f.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          f.severity === 'MEDIUM' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {f.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{Math.round(f.confidence * 100)}%</td>
                      <td className="py-2.5 px-3 text-slate-300 leading-relaxed">{f.actionAdvice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sensor Data Quality Guardrail Panel */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Sensor Data Quality &amp; Gating Audit</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInjectStuckFault(!injectStuckFault)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                      injectStuckFault ? 'bg-red-900 text-red-200' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {injectStuckFault ? '⚡ Fault Injected: Stuck Flatline' : 'Inject Sensor Stuck Fault'}
                  </button>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    sensorAuditReport.overallStatus === 'PASS' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                  }`}>
                    {sensorAuditReport.overallStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                {sensorAuditReport.checks.map((chk, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-300">{chk.checkName}</span>
                    <span className="text-slate-400 text-[11px]">{chk.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 4: ISA-95 UNIFIED ASSET TREE & NAMESPACE               */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'asset_tree' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">ISA-95 Unified Namespace (UNS) Asset Hierarchy</h3>
            </div>
            <span className="text-xs font-mono text-purple-300">Enterprise / Site / Area / Line / Cell / Machine / Tag</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="text-purple-400 font-bold uppercase text-[10px]">Asset Tree Structure:</div>
              <div className="space-y-2 text-slate-300 pl-2">
                <div>🏢 <strong>Enterprise:</strong> Tesla Motors Inc.</div>
                <div className="pl-4">🏭 <strong>Site:</strong> Gigafactory Texas (Austin)</div>
                <div className="pl-8">⚙️ <strong>Area:</strong> BIW (Body in White) Stamping &amp; Assembly</div>
                <div className="pl-12">🏎️ <strong>Line:</strong> Cybertruck &amp; Model Y Chassis Line</div>
                <div className="pl-16">🤖 <strong>Cell:</strong> Robotic Welding &amp; Sealing Cell #12</div>
                <div className="pl-20 text-cyan-300 font-bold">🦾 <strong>Machine:</strong> KUKA KR-quantec 6-DOF Robot</div>
                <div className="pl-24 text-emerald-400">• Tag: joint_1_motor_temp (°C)</div>
                <div className="pl-24 text-emerald-400">• Tag: joint_2_rms_vibration (g)</div>
                <div className="pl-24 text-emerald-400">• Tag: end_effector_force (N)</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="text-cyan-400 font-bold uppercase text-[10px]">Unified Namespace (UNS) Topics:</div>
              <div className="space-y-1.5 text-slate-300">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
                  <span className="text-slate-500">Topic: </span>
                  <span className="text-cyan-300">spBv1.0/Tesla/GigaTexas/BIW/Line1/Cell12/Robot1/JointTorque</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
                  <span className="text-slate-500">Topic: </span>
                  <span className="text-cyan-300">spBv1.0/Tesla/GigaTexas/BIW/Line1/Cell12/Robot1/VibrationRMS</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
                  <span className="text-slate-500">Topic: </span>
                  <span className="text-cyan-300">spBv1.0/Tesla/GigaTexas/BIW/Line1/Cell12/Robot1/HealthIndex</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed pt-2">
                In strict accordance with plant security rules, browsers cannot connect directly to physical fieldbus networks. Telemetry is streamed securely via read-only MQTT / Sparkplug B broker gateways.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 5: RELIABILITY, SPC, OEE & SIMULATION PANEL             */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'reliability_spc' && (
        <ReliabilitySpcPanel />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 6: QUANTUM ERROR SIMULATOR PANEL                        */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'quantum_error' && (
        <QuantumErrorSimulatorPanel />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 7: UNIVERSAL CONNECTIVITY & MULTI-APP FLEET STUDIO     */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'universal_connectivity' && (
        <UniversalConnectivityStudio />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 8: PREDICTIVE MODELS, DRIFT & LEAKAGE AUDIT PANEL      */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'predictive_models' && (
        <PredictiveModelsPanel />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 9: RISK ANALYSIS (FMEA, FTA & RBD) PANEL                */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'risk_analysis' && (
        <RiskAnalysisPanel />
      )}
    </div>
  );
};
