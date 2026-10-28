import React, { useState, useMemo } from 'react';
import {
  determineAiagVdaAP,
  auditFmeaTable,
  evaluateFaultTree,
  calculateSeriesReliability,
  calculateParallelReliability,
  calculateKOutOfNReliability,
} from '../../utils/riskAnalysisEngine';
import { FtaNode, FmeaRow } from '../../types/industrial';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  GitCommit,
  GitMerge,
  Layers,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Workflow,
  Zap,
} from 'lucide-react';

export const RiskAnalysisPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fmea' | 'fta' | 'rbd'>('fmea');

  // ================================================================
  // TAB 1: FMEA & AIAG-VDA ACTION PRIORITY STATE
  // ================================================================
  const [fmeaRows, setFmeaRows] = useState<Omit<FmeaRow, 'rpn' | 'actionPriority' | 'hasDuplicateRpnAnomaly'>[]>([
    {
      id: 'FMEA_01',
      itemFunction: 'Traction Inverter DC Bus',
      potentialFailureMode: 'IGBT Thermal Runaway',
      potentialEffect: 'Complete drive unit shutdown and high-voltage latching fault',
      severity: 10,
      potentialCause: 'Silicon carbide gate driver timing jitter',
      occurrence: 4,
      currentControls: 'Isolated NTC thermistor array',
      detection: 4,
      actionRequired: 'Automated de-saturation gate shutoff ASIC (<200ns)',
    },
    {
      id: 'FMEA_02',
      itemFunction: 'Robot 6-DOF Wrist Joint #5',
      potentialFailureMode: 'Harmonic Drive Gear Tooth Fatigue',
      potentialEffect: 'Positioning error > 2.5mm and cycle cycle time stoppage',
      severity: 8,
      potentialCause: 'Peak acceleration torque exceeding rated flexspline limit',
      occurrence: 3,
      currentControls: 'Motor current threshold alert',
      detection: 5,
      actionRequired: 'Torque ripple acoustic emission observer',
    },
    {
      id: 'FMEA_03',
      itemFunction: 'Battery Pack Pyrotechnic Fuse',
      potentialFailureMode: 'Corrosion at Busbar Terminal',
      potentialEffect: 'Increased resistance and localized hot spot',
      severity: 7,
      potentialCause: 'Moisture ingress past EPDM gasket',
      occurrence: 2,
      currentControls: 'Dry air pressure decay leak test',
      detection: 3,
      actionRequired: 'Laser-welded hermetic terminal sealing',
    },
    {
      id: 'FMEA_04',
      itemFunction: 'Chassis Wiring Harness Grommet',
      potentialFailureMode: 'Grommet Displacement',
      potentialEffect: 'Audible harness vibration against firewall',
      severity: 2,
      potentialCause: 'Operator misalignment during marriage station',
      occurrence: 8,
      currentControls: 'Visual inspection at end-of-line',
      detection: 5,
      actionRequired: 'Poka-yoke retaining clip with snap sensor feedback',
    },
    {
      id: 'FMEA_05',
      itemFunction: 'Coolant Hose Quick-Disconnect',
      potentialFailureMode: 'Incomplete Coupler Latch',
      potentialEffect: 'Low pressure coolant weep over 10,000 miles',
      severity: 5,
      potentialCause: 'High push-to-connect insertion force',
      occurrence: 4,
      currentControls: 'Helium mass spectrometer sniffer',
      detection: 4,
      actionRequired: 'Audible click visual locking collar verification',
    },
  ]);

  const fmeaAudit = useMemo(() => auditFmeaTable(fmeaRows), [fmeaRows]);

  // Selected row for interactive editing
  const [selectedRowId, setSelectedRowId] = useState<string>('FMEA_01');
  const activeFmeaRow = useMemo(
    () => fmeaAudit.processedRows.find((r) => r.id === selectedRowId) || fmeaAudit.processedRows[0],
    [fmeaAudit, selectedRowId]
  );

  const handleUpdateActiveRow = (field: 'severity' | 'occurrence' | 'detection', value: number) => {
    setFmeaRows((prev) =>
      prev.map((r) => (r.id === selectedRowId ? { ...r, [field]: value } : r))
    );
  };

  // ================================================================
  // TAB 2: FAULT TREE ANALYSIS (FTA) STATE
  // ================================================================
  const [ftaNodes, setFtaNodes] = useState<FtaNode[]>([
    {
      id: 'TOP_ROBOT_LOSS',
      name: 'Unplanned Robotic Cell Emergency E-Stop',
      type: 'GATE',
      gateType: 'OR',
      childrenIds: ['GATE_SAFETY_CIRCUIT', 'GATE_SERVO_LOSS'],
      description: 'Stoppage of automated BIW welding cell',
    },
    {
      id: 'GATE_SAFETY_CIRCUIT',
      name: 'Safety Interlock Tripped',
      type: 'GATE',
      gateType: 'OR',
      childrenIds: ['EV_LIGHT_CURTAIN', 'EV_ESTOP_BUTTON'],
      description: 'Hardware safety relay circuit open',
    },
    {
      id: 'GATE_SERVO_LOSS',
      name: 'Simultaneous Dual Inverter Drive Fault',
      type: 'GATE',
      gateType: 'AND',
      childrenIds: ['EV_INVERTER_PRIMARY', 'EV_INVERTER_BACKUP'],
      description: 'Both redundant drives lose fieldbus communication',
    },
    {
      id: 'EV_LIGHT_CURTAIN',
      name: 'Optical Safety Light Curtain Mute Violation',
      type: 'BASIC_EVENT',
      failureProbability: 0.004,
      description: 'Optoelectronic sensor beam break',
    },
    {
      id: 'EV_ESTOP_BUTTON',
      name: 'Physical Operator Emergency Stop Depressed',
      type: 'BASIC_EVENT',
      failureProbability: 0.002,
      description: 'Manual operator intervention',
    },
    {
      id: 'EV_INVERTER_PRIMARY',
      name: 'Primary Inverter EtherCAT Bus Dropout',
      type: 'BASIC_EVENT',
      failureProbability: 0.015,
      description: 'Packet collision or cyclic frame timeout',
    },
    {
      id: 'EV_INVERTER_BACKUP',
      name: 'Secondary Inverter Sync CRC Error',
      type: 'BASIC_EVENT',
      failureProbability: 0.015,
      description: 'Electrical noise on differential shielding',
    },
  ]);

  const ftaResult = useMemo(
    () => evaluateFaultTree(ftaNodes, 'TOP_ROBOT_LOSS'),
    [ftaNodes]
  );

  // ================================================================
  // TAB 3: RELIABILITY BLOCK DIAGRAMS (RBD) STATE
  // ================================================================
  const [rbdSeriesRels, setRbdSeriesRels] = useState<number[]>([0.995, 0.985, 0.992, 0.978]);
  const [rbdParallelRels, setRbdParallelRels] = useState<number[]>([0.92, 0.92]);
  const [rbdKNK, setRbdKNK] = useState<number>(2);
  const [rbdKNN, setRbdKNN] = useState<number>(3);
  const [rbdKNRel, setRbdKNRel] = useState<number>(0.95);

  const seriesResult = useMemo(() => calculateSeriesReliability(rbdSeriesRels), [rbdSeriesRels]);
  const parallelResult = useMemo(() => calculateParallelReliability(rbdParallelRels), [rbdParallelRels]);
  const knResult = useMemo(() => calculateKOutOfNReliability(rbdKNK, rbdKNN, rbdKNRel), [rbdKNK, rbdKNN, rbdKNRel]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/30 rounded">
                PHASE F: RISK ANALYSIS
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
                AIAG-VDA 1ST ED &amp; MOKUS
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Industrial Risk, FMEA &amp; Fault Tree Analysis Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Standard-compliant Failure Mode and Effects Analysis (FMEA) with AIAG-VDA Action Priority lookup,
              duplicate-RPN flaw warnings, Fault Tree Analysis (FTA) with Mokus minimal cut set reduction, Birnbaum importance measures, and analytical Reliability Block Diagrams (RBD).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded px-3 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Standard Compliance</div>
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AIAG-VDA (2019)
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded px-3 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Boolean Engine</div>
              <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1 justify-end">
                <Workflow className="w-3.5 h-3.5 text-cyan-400" /> Mokus Minimal Sets
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveTab('fmea')}
            className={`px-3 py-2 text-xs font-medium rounded transition flex items-center gap-2 ${
              activeTab === 'fmea'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            FMEA &amp; AIAG-VDA Action Priority
          </button>
          <button
            onClick={() => setActiveTab('fta')}
            className={`px-3 py-2 text-xs font-medium rounded transition flex items-center gap-2 ${
              activeTab === 'fta'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Fault Tree Analysis (Mokus Cut Sets)
          </button>
          <button
            onClick={() => setActiveTab('rbd')}
            className={`px-3 py-2 text-xs font-medium rounded transition flex items-center gap-2 ${
              activeTab === 'rbd'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Reliability Block Diagrams (RBD)
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: FMEA & AIAG-VDA ACTION PRIORITY                           */}
      {/* ================================================================ */}
      {activeTab === 'fmea' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">Total Failure Modes</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {fmeaAudit.summary.totalFailureModes}
              </div>
              <div className="text-xs text-slate-400 mt-1">Evaluated modes</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">High Action Priority (H)</div>
              <div className="text-xl font-bold font-mono text-red-400 mt-1">
                {fmeaAudit.summary.highPriorityCount}
              </div>
              <div className="text-xs text-slate-400 mt-1">Mandatory engineering action</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">Medium Priority (M)</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {fmeaAudit.summary.mediumPriorityCount}
              </div>
              <div className="text-xs text-slate-400 mt-1">Recommended mitigation</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">Low Priority (L)</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {fmeaAudit.summary.lowPriorityCount}
              </div>
              <div className="text-xs text-slate-400 mt-1">Acceptable risk level</div>
            </div>
          </div>

          {/* Duplicate-RPN Warning Banner */}
          {fmeaAudit.summary.duplicateRpnWarnings.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-4 flex items-start gap-3 text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-300">
                  DUPLICATE-RPN FLAW DETECTED: WHY AIAG-VDA ACTION PRIORITY IS REQUIRED
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Legacy RPN computes only the raw multiplication (S &times; O &times; D). In the current register:
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-300 font-mono text-[11px]">
                  {fmeaAudit.summary.duplicateRpnWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
                <div className="text-slate-400 pt-1">
                  Notice that a catastrophic failure mode (e.g. S=10) and a minor annoyance (e.g. S=2) can yield identical RPNs, misleading risk priority. AIAG-VDA Action Priority strictly evaluates Severity first.
                </div>
              </div>
            </div>
          )}

          {/* Main FMEA Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">Failure Modes and Effects Analysis Register</span>
              <span className="text-[10px] font-mono text-slate-400">Click a row to adjust parameters</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Item / Function</th>
                    <th className="py-2.5 px-3">Potential Failure Mode</th>
                    <th className="py-2.5 px-2 text-center">S (1-10)</th>
                    <th className="py-2.5 px-2 text-center">O (1-10)</th>
                    <th className="py-2.5 px-2 text-center">D (1-10)</th>
                    <th className="py-2.5 px-2 text-center">RPN</th>
                    <th className="py-2.5 px-3 text-center">Action Priority (AP)</th>
                    <th className="py-2.5 px-3">Recommended Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {fmeaAudit.processedRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRowId(row.id)}
                      className={`cursor-pointer transition ${
                        selectedRowId === row.id ? 'bg-slate-800/70 border-l-2 border-red-500' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-white">{row.itemFunction}</td>
                      <td className="py-2 px-3 text-slate-300">{row.potentialFailureMode}</td>
                      <td className={`py-2 px-2 text-center font-bold ${row.severity >= 8 ? 'text-red-400' : 'text-slate-300'}`}>
                        {row.severity}
                      </td>
                      <td className="py-2 px-2 text-center">{row.occurrence}</td>
                      <td className="py-2 px-2 text-center">{row.detection}</td>
                      <td className="py-2 px-2 text-center text-slate-400 font-semibold">{row.rpn}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.actionPriority === 'HIGH'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : row.actionPriority === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {row.actionPriority}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-xs">{row.actionRequired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Parameter Editor for Selected Row */}
          {activeFmeaRow && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Active Row Editor</span>
                  <h3 className="text-sm font-bold text-white">{activeFmeaRow.itemFunction} &mdash; {activeFmeaRow.potentialFailureMode}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">RPN: <strong className="text-white">{activeFmeaRow.rpn}</strong></span>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                    activeFmeaRow.actionPriority === 'HIGH'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : activeFmeaRow.actionPriority === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    AP: {activeFmeaRow.actionPriority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Severity (S: 1 - 10):</span>
                    <span className="font-mono text-red-400 font-bold">{activeFmeaRow.severity}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={activeFmeaRow.severity}
                    onChange={(e) => handleUpdateActiveRow('severity', parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">1: Negligible &bull; 9-10: Safety Hazard</div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Occurrence (O: 1 - 10):</span>
                    <span className="font-mono text-amber-400 font-bold">{activeFmeaRow.occurrence}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={activeFmeaRow.occurrence}
                    onChange={(e) => handleUpdateActiveRow('occurrence', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">1: &lt;1 in 1M &bull; 10: &ge;1 in 10</div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Detection (D: 1 - 10):</span>
                    <span className="font-mono text-cyan-400 font-bold">{activeFmeaRow.detection}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={activeFmeaRow.detection}
                    onChange={(e) => handleUpdateActiveRow('detection', parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">1: Automated In-Line &bull; 10: Un-detectable</div>
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded border border-slate-800">
                <strong>Current Controls:</strong> {activeFmeaRow.currentControls} &bull; <strong>Action:</strong> {activeFmeaRow.actionRequired}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: FAULT TREE ANALYSIS (FTA) & MOKUS MINIMAL CUT SETS        */}
      {/* ================================================================ */}
      {activeTab === 'fta' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">Top Event Probability</div>
              <div className="text-xl font-bold font-mono text-red-400 mt-1">
                {ftaResult.topEventProbability}
              </div>
              <div className="text-xs text-slate-400 mt-1">System failure rate</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">Minimal Cut Sets</div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {ftaResult.totalCutSetsCount} sets
              </div>
              <div className="text-xs text-slate-400 mt-1">Mokus Boolean reduction</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">Most Critical Event</div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-1 truncate">
                {ftaResult.mostCriticalEvent}
              </div>
              <div className="text-xs text-slate-400 mt-1">Highest Birnbaum index</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">Rarest Cut Set Rate</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {ftaResult.rarestCutSetProbability}
              </div>
              <div className="text-xs text-slate-400 mt-1">Double redundancy</div>
            </div>
          </div>

          {/* Minimal Cut Sets Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">Extracted Minimal Cut Sets (Mokus Algorithm)</span>
              <span className="text-[10px] font-mono text-slate-400">{ftaResult.totalCutSetsCount} Minimal Failure Paths</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Cut Set</th>
                    <th className="py-2 px-3">Order</th>
                    <th className="py-2 px-3">Basic Events Involved</th>
                    <th className="py-2 px-3">Failure Probability</th>
                    <th className="py-2 px-3">Vulnerability Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {ftaResult.minimalCutSets.map((mcs, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-semibold text-cyan-400">MCS #{idx + 1}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          mcs.order === 1 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-300'
                        }`}>
                          Order {mcs.order}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-white font-sans">{mcs.eventNames.join(' AND ')}</td>
                      <td className="py-2 px-3 font-semibold text-amber-300">{mcs.probability}</td>
                      <td className="py-2 px-3">
                        {mcs.order === 1 ? (
                          <span className="text-red-400 font-semibold">Single Point of Failure (SPOF)</span>
                        ) : (
                          <span className="text-emerald-400">Redundant Pathway</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Birnbaum & Criticality Importance Measures */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Birnbaum &amp; Criticality Importance Measures</span>
              <span className="text-[10px] font-mono text-slate-400">I^B = ∂P(TOP) / ∂q_i</span>
            </div>
            <div className="space-y-2">
              {ftaResult.birnbaumImportances.map((b) => (
                <div key={b.eventId} className="bg-slate-950/60 p-3 rounded border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{b.eventName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Base Probability q_i = {b.baseProbability} &bull; Criticality Index = {b.criticalityScore}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-400 uppercase block">Birnbaum Score</span>
                    <span className="text-cyan-400 font-bold text-sm">{b.birnbaumScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: RELIABILITY BLOCK DIAGRAMS (RBD)                          */}
      {/* ================================================================ */}
      {activeTab === 'rbd' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Series Configuration */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <GitCommit className="w-4 h-4 text-cyan-400" /> Series Network
                </h3>
                <span className="text-[10px] font-mono text-slate-400">R_sys = &prod; R_i</span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                All components must survive for the system to operate. Any component failure causes system failure.
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">Series System Reliability</span>
                <span className="text-2xl font-bold text-cyan-400">{(seriesResult * 100).toFixed(2)}%</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">({seriesResult})</span>
              </div>
              <div className="space-y-2 text-xs">
                {rbdSeriesRels.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-slate-300 font-mono">
                    <span>Block #{i + 1}:</span>
                    <span className="font-bold text-white">{(r * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parallel Redundancy */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <GitMerge className="w-4 h-4 text-emerald-400" /> Parallel Redundancy
                </h3>
                <span className="text-[10px] font-mono text-slate-400">R_sys = 1 - &prod;(1 - R_i)</span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                At least one component must survive. Tolerates active redundancy failures.
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">Parallel System Reliability</span>
                <span className="text-2xl font-bold text-emerald-400">{(parallelResult * 100).toFixed(3)}%</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">({parallelResult})</span>
              </div>
              <div className="space-y-2 text-xs">
                {rbdParallelRels.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-slate-300 font-mono">
                    <span>Redundant Channel #{i + 1}:</span>
                    <span className="font-bold text-white">{(r * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* k-out-of-n Voting Redundancy */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-purple-400" /> {rbdKNK}-of-{rbdKNN} Active Redundancy
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Binomial Voting</span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                System survives if at least k of n channels remain operational (e.g. flight computers, brake calipers).
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">{rbdKNK}-of-{rbdKNN} Reliability</span>
                <span className="text-2xl font-bold text-purple-400">{(knResult * 100).toFixed(3)}%</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">({knResult})</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Required Active (k):</span>
                  <input
                    type="number"
                    min="1"
                    max={rbdKNN}
                    value={rbdKNK}
                    onChange={(e) => setRbdKNK(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-right text-white"
                  />
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Total Channels (n):</span>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={rbdKNN}
                    onChange={(e) => setRbdKNN(parseInt(e.target.value) || 2)}
                    className="w-16 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-right text-white"
                  />
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Single Channel Rel (R):</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="0.999"
                    value={rbdKNRel}
                    onChange={(e) => setRbdKNRel(parseFloat(e.target.value) || 0.9)}
                    className="w-16 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-right text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
