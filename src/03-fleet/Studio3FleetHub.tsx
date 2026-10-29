import React, { useState } from 'react';
import {
  Activity,
  Battery,
  Compass,
  Cpu,
  Flame,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Radio,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useFleetMesh } from './FleetMeshContext';
import { FleetMapPanel } from './FleetMapPanel';
import { BatteryTwin3DPanel } from './BatteryTwin3DPanel';
import { PlcBridgePanel } from './PlcBridgePanel';

export const Studio3FleetHub: React.FC<{
  initialTab?: 'map' | 'battery' | 'plc';
}> = ({ initialTab = 'map' }) => {
  const [activeTab, setActiveTab] = useState<'map' | 'battery' | 'plc'>(initialTab);
  const {
    fleet,
    activeVehicle,
    selectVehicle,
    plcBridge,
    togglePlcMode,
    highFrequencyTickCounter,
  } = useFleetMesh();

  return (
    <div className="space-y-6">
      {/* Flagship Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-cyan-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/40">
                STUDIO 3 • FLEET MESH (THE WOW)
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                DEMO_MODE=TRUE ACTIVE
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                BRANCH: s3-fleet
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Universal Autonomous Fleet Mesh &amp; 3D Digital Twin Suite
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Unified presentation hub connecting <strong>WF14 Fleet Radar Map</strong> with real-time flight trails, <strong>WF08 3D Battery Twin</strong> with thermal explode inspection, and <strong>WF12 Industrial PLC Bridge</strong> with 270Hz low-latency display.
            </p>
          </div>

          {/* 3 Main Studio Workflows Selector Tabs */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner self-start lg:self-auto flex-wrap">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Navigation className="w-4 h-4 text-cyan-300" />
              <span>WF14 Fleet Map</span>
            </button>

            <button
              onClick={() => setActiveTab('battery')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'battery'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-indigo-300" />
              <span>WF08 3D Battery Twin</span>
            </button>

            <button
              onClick={() => setActiveTab('plc')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'plc'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4 text-amber-300" />
              <span>WF12 PLC Bridge (270Hz)</span>
            </button>
          </div>
        </div>

        {/* Live Mini Telemetry Ticker across all 6 vehicles */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4 overflow-x-auto scrollbar-thin text-xs font-mono">
          <div className="flex items-center gap-4 min-w-max">
            <span className="text-slate-400 uppercase text-[11px] font-bold">Live Fleet Heartbeats:</span>
            {fleet.map((v) => {
              const isSelected = v.id === activeVehicle.id;
              return (
                <button
                  key={v.id}
                  onClick={() => selectVehicle(v.id)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold">{v.id}</span>
                  <span className="text-emerald-400 font-bold">{Math.round(v.batteryPct)}%</span>
                  <span className="text-slate-400 text-[10px]">{v.heartbeatMs}ms</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-slate-400 min-w-max pl-4 border-l border-slate-800">
            <span>Scan: <strong className="text-cyan-400">270 Hz</strong></span>
            <span>Mode: <strong className={plcBridge.mode === 'REAL' ? 'text-amber-400' : 'text-cyan-400'}>{plcBridge.mode}</strong></span>
          </div>
        </div>
      </div>

      {/* Render the Active Studio 3 View */}
      {activeTab === 'map' && <FleetMapPanel />}
      {activeTab === 'battery' && <BatteryTwin3DPanel />}
      {activeTab === 'plc' && <PlcBridgePanel />}
    </div>
  );
};
