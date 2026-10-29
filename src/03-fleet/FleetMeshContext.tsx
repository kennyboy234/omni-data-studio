import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import {
  FleetVehicle,
  PLCBridgeState,
  VehicleId,
} from './types';
import {
  createInitialFleet,
  createInitialPLCBridge,
  updateFleetStep,
} from './fleetSimulationEngine';

interface FleetMeshContextType {
  fleet: FleetVehicle[];
  activeVehicleId: VehicleId;
  activeVehicle: FleetVehicle;
  selectVehicle: (id: VehicleId) => void;
  selectVehicleAndInspectBattery: (id: VehicleId) => void;
  plcBridge: PLCBridgeState;
  togglePlcMode: () => void;
  updatePlcRegister: (address: number, val: number | string) => void;
  highFrequencyTickCounter: number;
  oscilloscopeData: number[];
  activeTabTarget: 'WF12' | 'WF14' | 'WF08' | null;
  setActiveTabTarget: (tab: 'WF12' | 'WF14' | 'WF08' | null) => void;
  injectThermalRunawayTest: () => void;
  resetFleetSimulation: () => void;
}

const FleetMeshContext = createContext<FleetMeshContextType | null>(null);

export const FleetMeshProvider: React.FC<{
  children: React.ReactNode;
  onNavigateWorkflow?: (wf: 'WF12' | 'WF14' | 'WF08') => void;
}> = ({ children, onNavigateWorkflow }) => {
  const [fleet, setFleet] = useState<FleetVehicle[]>(() => createInitialFleet());
  const [activeVehicleId, setActiveVehicleId] = useState<VehicleId>('VH-ROBOTRUCK-04');
  const [plcBridge, setPlcBridge] = useState<PLCBridgeState>(() => createInitialPLCBridge());
  const [activeTabTarget, setActiveTabTarget] = useState<'WF12' | 'WF14' | 'WF08' | null>(null);

  // High-frequency 270Hz loop state
  const [highFrequencyTickCounter, setHighFrequencyTickCounter] = useState<number>(0);
  const [oscilloscopeData, setOscilloscopeData] = useState<number[]>(() =>
    Array.from({ length: 90 }, (_, i) => Math.sin(i * 0.2) * 50 + 50)
  );

  const activeVehicle = useMemo(() => {
    return fleet.find((v) => v.id === activeVehicleId) || fleet[0];
  }, [fleet, activeVehicleId]);

  // Main Fleet Movement Loop (Runs every 1000ms to smoothly update trajectories)
  useEffect(() => {
    const timer = setInterval(() => {
      setFleet((prev) => updateFleetStep(prev, 1.0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 270Hz Display & PLC Telemetry Loop
  // 270Hz = ~3.70ms per frame. In browser rAF / interval, we run high-frequency update accumulator
  const highFreqCounterRef = useRef(0);
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const highFreqLoop = (now: number) => {
      const deltaMs = now - lastTime;
      // Calculate how many 270Hz ticks occurred (approx 3.703ms per tick)
      const ticksToSimulate = Math.min(10, Math.max(1, Math.floor(deltaMs / 3.703)));
      highFreqCounterRef.current += ticksToSimulate;

      setHighFrequencyTickCounter(highFreqCounterRef.current);

      // Generate 270Hz PWM / Motor / Current waveform trace
      setOscilloscopeData((prev) => {
        const next = [...prev.slice(ticksToSimulate)];
        for (let i = 0; i < ticksToSimulate; i++) {
          const t = (highFreqCounterRef.current + i) * 0.15;
          const carrier = Math.sin(t * 8.0) * 15;
          const fundamental = Math.sin(t) * 45;
          const noise = (Math.random() - 0.5) * 6;
          next.push(Math.max(5, Math.min(95, 50 + fundamental + carrier + noise)));
        }
        return next;
      });

      // Update PLC bridge cycle counter & jitter
      if (highFreqCounterRef.current % 15 === 0) {
        setPlcBridge((prev) => ({
          ...prev,
          cycleCounter: prev.cycleCounter + ticksToSimulate,
          cycleJitterMicroseconds: Number((12.5 + Math.random() * 4.2).toFixed(1)),
          roundTripLatencyMs: Number((3.65 + (Math.random() - 0.5) * 0.3).toFixed(2)),
        }));
      }

      lastTime = now;
      animId = requestAnimationFrame(highFreqLoop);
    };

    animId = requestAnimationFrame(highFreqLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const selectVehicle = (id: VehicleId) => {
    setActiveVehicleId(id);
  };

  const selectVehicleAndInspectBattery = (id: VehicleId) => {
    setActiveVehicleId(id);
    if (onNavigateWorkflow) {
      onNavigateWorkflow('WF08');
    }
    setActiveTabTarget('WF08');
  };

  const togglePlcMode = () => {
    setPlcBridge((prev) => {
      const nextMode = prev.mode === 'SIMULATOR' ? 'REAL' : 'SIMULATOR';
      return {
        ...prev,
        mode: nextMode,
        targetIp:
          nextMode === 'REAL'
            ? '192.168.1.120:502 [Beckhoff CX5140 TwinCAT 3 - HARDWARE ONLINE]'
            : '127.0.0.1:10502 [Autonomous Virtual PLC Mesh - 270Hz Loop]',
        registers: prev.registers.map((r) =>
          r.name === 'ETHERCAT_CYCLE_FREQ_HZ' ? { ...r, value: 270 } : r
        ),
      };
    });
  };

  const updatePlcRegister = (address: number, val: number | string) => {
    setPlcBridge((prev) => ({
      ...prev,
      registers: prev.registers.map((r) =>
        r.address === address
          ? {
              ...r,
              value: val,
              hex: typeof val === 'number' ? `0x${val.toString(16).toUpperCase().padStart(4, '0')}` : r.hex,
            }
          : r
      ),
    }));
  };

  const injectThermalRunawayTest = () => {
    setFleet((prev) =>
      prev.map((v) => {
        if (v.id === activeVehicleId) {
          const modD = v.batteryTwin.modules[3];
          const updatedMods = v.batteryTwin.modules.map((m, idx) =>
            idx === 3
              ? {
                  ...m,
                  tempC: 62.4,
                  status: 'critical' as const,
                  hotspotDeltaC: 28.5,
                  cells: m.cells.map((c) => ({ ...c, tempC: 63.8 })),
                }
              : m
          );
          return {
            ...v,
            batteryTwin: {
              ...v.batteryTwin,
              maxCellTempC: 63.8,
              modules: updatedMods,
            },
          };
        }
        return v;
      })
    );
  };

  const resetFleetSimulation = () => {
    setFleet(createInitialFleet());
    setPlcBridge(createInitialPLCBridge());
  };

  return (
    <FleetMeshContext.Provider
      value={{
        fleet,
        activeVehicleId,
        activeVehicle,
        selectVehicle,
        selectVehicleAndInspectBattery,
        plcBridge,
        togglePlcMode,
        updatePlcRegister,
        highFrequencyTickCounter,
        oscilloscopeData,
        activeTabTarget,
        setActiveTabTarget,
        injectThermalRunawayTest,
        resetFleetSimulation,
      }}
    >
      {children}
    </FleetMeshContext.Provider>
  );
};

export function useFleetMesh() {
  const context = useContext(FleetMeshContext);
  if (!context) {
    throw new Error('useFleetMesh must be used within a FleetMeshProvider');
  }
  return context;
}
