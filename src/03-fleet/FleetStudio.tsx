import React, { useState } from 'react';
import { WF14FleetMap } from './fleet';
import { WF08BatteryTwin } from './battery';
import { WF12PLCBridge } from './plc';
import { WF09FeatureStore } from './feature-store';
import {
  Navigation,
  Layers,
  Cpu,
  Database,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export type FleetSubTab = 'map' | 'battery' | 'plc' | 'features';

interface FleetStudioProps {
  initialSubTab?: FleetSubTab;
}

export const FleetStudio: React.FC<FleetStudioProps> = ({ initialSubTab = 'map' }) => {
  const [activeSubTab, setActiveSubTab] = useState<FleetSubTab>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Studio 3 Fleet Sub-Navigation Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* Subtab 1: WF14 Fleet Map */}
          <button
            onClick={() => setActiveSubTab('map')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
              activeSubTab === 'map'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>WF14 FLEET MAP</span>
            <span className="text-[10px] opacity-80">(10 Units)</span>
          </button>

          {/* Subtab 2: WF08 Battery Twin */}
          <button
            onClick={() => setActiveSubTab('battery')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
              activeSubTab === 'battery'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>WF08 BATTERY TWIN</span>
            <span className="text-[10px] opacity-80">(3D Explode)</span>
          </button>

          {/* Subtab 3: WF12 PLC Bridge */}
          <button
            onClick={() => setActiveSubTab('plc')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
              activeSubTab === 'plc'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>WF12 PLC BRIDGE</span>
            <span className="text-[10px] opacity-80">(270Hz · 11ms)</span>
          </button>

          {/* Subtab 4: WF09 Feature Store */}
          <button
            onClick={() => setActiveSubTab('features')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
              activeSubTab === 'features'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>WF09 FEATURE STORE</span>
            <span className="text-[10px] opacity-80">(Judge Badges)</span>
          </button>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-bold">FLEET MESH ONLINE</span>
          <span className="text-slate-600">·</span>
          <span>10/10 HEALTHY</span>
        </div>
      </div>

      {/* Active Workflow Component Viewport */}
      {activeSubTab === 'map' && <WF14FleetMap />}
      {activeSubTab === 'battery' && <WF08BatteryTwin />}
      {activeSubTab === 'plc' && <WF12PLCBridge />}
      {activeSubTab === 'features' && <WF09FeatureStore />}
    </div>
  );
};

export default FleetStudio;
