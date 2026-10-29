import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Power,
  RotateCcw,
  Sliders,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Gauge,
  Wifi,
  Radio,
} from 'lucide-react';
import { useFleetMesh } from './FleetMeshContext';

export const PlcBridgePanel: React.FC = () => {
  const {
    plcBridge,
    togglePlcMode,
    updatePlcRegister,
    highFrequencyTickCounter,
    oscilloscopeData,
    activeVehicle,
  } = useFleetMesh();

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'TELEMETRY' | 'ACTUATION' | 'SAFETY' | 'THERMAL'>('ALL');
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const isReal = plcBridge.mode === 'REAL';

  const filteredRegisters = plcBridge.registers.filter((r) =>
    selectedCategory === 'ALL' ? true : r.category === selectedCategory
  );

  const handleStartEdit = (address: number, currentVal: number | string) => {
    if (isReal) return; // Real mode is read-only for safety
    setEditingAddress(address);
    setEditValue(String(currentVal));
  };

  const handleSaveEdit = (address: number) => {
    const num = Number(editValue);
    updatePlcRegister(address, isNaN(num) ? editValue : num);
    setEditingAddress(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Studio 3 Industrial Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                WF12 • STUDIO 3 FLEET MESH
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                270Hz HARD REAL-TIME BUS
              </span>
              <span className="text-xs text-slate-400">
                Vehicle: <strong className="text-white">{activeVehicle.name}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Industrial PLC Bridge &amp; Real-Time Bus Matrix</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Bidirectional Beckhoff TwinCAT / Modbus / EtherCAT PLC bridge running at calibrated 270Hz cycle frequency (3.70ms frame cadence). Toggle between sovereign in-memory simulation and real industrial fieldbus hardware.
            </p>
          </div>

          {/* SIMULATOR / REAL Toggle Switch */}
          <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner self-start lg:self-auto">
            <div className="text-right">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Bridge Target</div>
              <div className="text-[11px] font-mono text-slate-400">
                {isReal ? 'Hardware Bus (Fieldbus)' : 'Virtual Sovereign Simulation'}
              </div>
            </div>

            <button
              onClick={togglePlcMode}
              className={`relative inline-flex h-9 w-20 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                isReal ? 'bg-amber-600 border-amber-400' : 'bg-cyan-600 border-cyan-400'
              }`}
              title="Toggle between SIMULATOR and REAL Hardware PLC connection"
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                  isReal ? 'translate-x-11' : 'translate-x-1'
                }`}
              />
            </button>

            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider ${
                isReal
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}
            >
              {plcBridge.mode}
            </span>
          </div>
        </div>
      </div>

      {/* 270Hz Live Display Metrics & Real-Time Waveform */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 270Hz Oscilloscope Waveform & Cadence */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">270Hz Real-Time Bus Oscilloscope</h3>
                <p className="text-xs text-slate-400">PWM Inverter Current &amp; EtherCAT Synchronization Trace</p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-cyan-800 font-bold">
                270.0 Hz
              </span>
              <span className="text-slate-400">Frame: 3.70ms</span>
              <span className="text-slate-400">Jitter: &plusmn;{plcBridge.cycleJitterMicroseconds}&mu;s</span>
            </div>
          </div>

          {/* SVG Waveform Canvas rendering the 270Hz trace */}
          <div className="relative h-44 bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-hidden flex flex-col justify-between">
            {/* Background oscilloscope grid */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 pointer-events-none opacity-20">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="border-r border-b border-cyan-500" />
              ))}
            </div>

            <svg className="w-full h-full relative z-10" viewBox="0 0 400 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                points={oscilloscopeData
                  .map((val, idx) => `${(idx / (oscilloscopeData.length - 1)) * 400},${val}`)
                  .join(' ')}
              />
            </svg>

            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 px-2 pt-1 border-t border-slate-800/60">
              <span>Time Base: 3.70ms / div</span>
              <span>Cycles Tracked: {plcBridge.cycleCounter.toLocaleString()}</span>
              <span>Hardware Link: {plcBridge.targetIp}</span>
            </div>
          </div>

          {/* Key Frequency & Bus Health Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Scan Frequency</span>
              <span className="text-cyan-400 text-lg font-bold">270 Hz</span>
              <span className="text-slate-400 text-[10px] block mt-0.5">Ultra-low latency</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Cycle Jitter</span>
              <span className="text-emerald-400 text-lg font-bold">{plcBridge.cycleJitterMicroseconds} &mu;s</span>
              <span className="text-slate-400 text-[10px] block mt-0.5">IEC 61158 Class B</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Round Trip Latency</span>
              <span className="text-indigo-300 text-lg font-bold">{plcBridge.roundTripLatencyMs} ms</span>
              <span className="text-slate-400 text-[10px] block mt-0.5">Deterministic</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Dropped Packets</span>
              <span className="text-white text-lg font-bold">0</span>
              <span className="text-slate-400 text-[10px] block mt-0.5">0.000% error rate</span>
            </div>
          </div>
        </div>

        {/* Live CAN Bus Packet Stream */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">CAN Bus Sniffer (270Hz)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Channel 0 &amp; 1</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] pr-1">
            {plcBridge.recentFrames.map((frame) => (
              <div
                key={frame.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-mono space-y-1 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">{frame.arbitrationIdHex}</span>
                  <span className="text-[10px] text-slate-400">{frame.channel}</span>
                </div>
                <div className="text-slate-300 text-[11px] truncate">{frame.dataHex}</div>
                <div className="text-slate-400 text-[10px] truncate">{frame.description}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Arbitration: 500 kbps CAN-FD</span>
            <span className="text-emerald-400">Bus Load: 38%</span>
          </div>
        </div>
      </div>

      {/* PLC Register Map: Modbus & EtherCAT Registers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">PLC Register Map (Modbus Holding &amp; Input)</h3>
              {isReal && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" />
                  READ-ONLY FIELD PROTECTION ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isReal
                ? 'Fieldbus write requests are hardware-interlocked. Registers stream directly from physical PLC.'
                : 'Simulator active: Click any writeable register value to modify variables and observe feedback.'}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'TELEMETRY', 'ACTUATION', 'SAFETY', 'THERMAL'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Registers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3">Hex</th>
                <th className="py-2.5 px-3">Variable Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Access</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRegisters.map((reg) => {
                const isEditing = editingAddress === reg.address;
                return (
                  <tr key={reg.address} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-white font-bold">{reg.address}</td>
                    <td className="py-2.5 px-3 text-slate-400">{reg.hex}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-semibold">{reg.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {reg.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-white text-xs w-28 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="text-white font-bold">{String(reg.value)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{reg.unit}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          reg.readOnly || isReal
                            ? 'bg-slate-950 text-slate-400'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {reg.readOnly || isReal ? 'READ' : 'READ/WRITE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(reg.address)}
                            className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-sans font-bold cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingAddress(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : !reg.readOnly && !isReal ? (
                        <button
                          onClick={() => handleStartEdit(reg.address, reg.value)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-white rounded border border-slate-700 text-[11px] font-sans cursor-pointer transition"
                        >
                          Modify
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
