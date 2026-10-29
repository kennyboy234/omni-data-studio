import { BatteryCell, BatteryModule, BatteryTwinData, CANFrame, FleetVehicle, PLCBridgeState, PLCRegister, TrailPoint, VehicleId } from './types';

// Realistic base center: Tesla Giga Texas / Autonomous Proving Grounds (30.2223° N, 97.6171° W)
const BASE_LAT = 30.2223;
const BASE_LNG = -97.6171;

function generateInitialModules(baseTemp: number, isWarning: boolean = false): BatteryModule[] {
  const modules: BatteryModule[] = [];
  const moduleNames = ['Module A (Front-Left)', 'Module B (Front-Right)', 'Module C (Center-Left)', 'Module D (Center-Right)', 'Module E (Rear-Left)', 'Module F (Rear-Right)'];

  for (let m = 0; m < 6; m++) {
    // Inject a subtle hotspot on Module D if isWarning
    const modTemp = isWarning && m === 3 ? baseTemp + 14.5 : baseTemp + (Math.sin(m * 1.3) * 3.2);
    const cells: BatteryCell[] = [];

    for (let c = 0; c < 16; c++) {
      const cellTemp = modTemp + (Math.sin(c * 0.7) * 1.8);
      cells.push({
        id: `MOD${m + 1}-CELL${(c + 1).toString().padStart(2, '0')}`,
        tempC: Number(cellTemp.toFixed(1)),
        voltageV: Number((3.82 + (Math.cos(c * 0.4) * 0.04)).toFixed(3)),
        resistanceMOhm: Number((1.24 + (c * 0.02)).toFixed(2)),
        sohPct: Number((98.5 - (c * 0.1)).toFixed(1)),
      });
    }

    const avgCellTemp = cells.reduce((acc, cell) => acc + cell.tempC, 0) / cells.length;
    const maxCellTemp = Math.max(...cells.map((c) => c.tempC));

    modules.push({
      id: `MOD-${m + 1}`,
      name: moduleNames[m],
      tempC: Number(avgCellTemp.toFixed(1)),
      voltageV: Number((cells.reduce((acc, c) => acc + c.voltageV, 0)).toFixed(2)),
      healthPct: Number((98.2 - (m * 0.3)).toFixed(1)),
      resistanceMOhm: 1.35,
      status: maxCellTemp > 48 ? 'hot' : maxCellTemp > 38 ? 'warm' : 'nominal',
      hotspotDeltaC: Number((maxCellTemp - avgCellTemp).toFixed(1)),
      cells,
    });
  }

  return modules;
}

export function createInitialFleet(): FleetVehicle[] {
  const initialConfigs: {
    id: VehicleId;
    name: string;
    model: string;
    vin: string;
    status: FleetVehicle['status'];
    offsetLat: number;
    offsetLng: number;
    speed: number;
    heading: number;
    battery: number;
    baseTemp: number;
    hasHotspot?: boolean;
    chemistry: 'NMC 811' | 'LFP Blade' | 'Solid-State Silicon';
  }[] = [
    {
      id: 'VH-CYBER-01',
      name: 'CyberAutonomous One',
      model: 'Tesla Cybertruck Tri-Motor AWD Autonomous Patrol',
      vin: '7G2CE1EB8RA091201',
      status: 'ACTIVE_MISSION',
      offsetLat: 0.012,
      offsetLng: -0.018,
      speed: 74,
      heading: 42,
      battery: 88,
      baseTemp: 31.4,
      chemistry: 'NMC 811',
    },
    {
      id: 'VH-ROBOTRUCK-04',
      name: 'Giga Hauler Alpha',
      model: 'Semi Class-8 Heavy Robotruck Autonomous Freight',
      vin: '7G2SE2FA5RA004812',
      status: 'HIGHWAY_PILOT',
      offsetLat: -0.024,
      offsetLng: 0.035,
      speed: 98,
      heading: 135,
      battery: 64,
      baseTemp: 39.8,
      hasHotspot: true, // Has thermal hotspot for exciting demonstration!
      chemistry: 'LFP Blade',
    },
    {
      id: 'VH-PATROL-09',
      name: 'Sentinel Proving Drone',
      model: 'Model Y High-Torque Proving Grounds Sentinel',
      vin: '5YJYGDEF6NA889211',
      status: 'PATROL_ROUTE',
      offsetLat: 0.031,
      offsetLng: 0.014,
      speed: 46,
      heading: 265,
      battery: 79,
      baseTemp: 28.6,
      chemistry: 'NMC 811',
    },
    {
      id: 'VH-SHUTTLE-12',
      name: 'CyberShuttle Express',
      model: 'Autonomous 16-Passenger Bi-Directional Pod',
      vin: '7G2SH8BA2RA012903',
      status: 'ACTIVE_MISSION',
      offsetLat: -0.015,
      offsetLng: -0.028,
      speed: 52,
      heading: 310,
      battery: 92,
      baseTemp: 29.1,
      chemistry: 'Solid-State Silicon',
    },
    {
      id: 'VH-ROV-33',
      name: 'Supercharger MegaVessel',
      model: 'V4 Autonomous MegaCharger Feeder Rover',
      vin: '7G2RV9AA1RA003341',
      status: 'FAST_CHARGING',
      offsetLat: 0.002,
      offsetLng: 0.005,
      speed: 0,
      heading: 180,
      battery: 38,
      baseTemp: 44.2,
      chemistry: 'LFP Blade',
    },
    {
      id: 'VH-AUTOSHIFT-07',
      name: 'Inter-Facility Shifter',
      model: 'Dual-Cab Yard Automation Tractor',
      vin: '7G2YT4DA8RA007419',
      status: 'ACTIVE_MISSION',
      offsetLat: -0.008,
      offsetLng: 0.019,
      speed: 34,
      heading: 85,
      battery: 71,
      baseTemp: 32.8,
      chemistry: 'NMC 811',
    },
  ];

  return initialConfigs.map((cfg) => {
    const lat = BASE_LAT + cfg.offsetLat;
    const lng = BASE_LNG + cfg.offsetLng;
    const modules = generateInitialModules(cfg.baseTemp, cfg.hasHotspot);
    const allCells = modules.flatMap((m) => m.cells);
    const maxTemp = Math.max(...allCells.map((c) => c.tempC));
    const minTemp = Math.min(...allCells.map((c) => c.tempC));
    const avgTemp = Number((allCells.reduce((acc, c) => acc + c.tempC, 0) / allCells.length).toFixed(1));

    // Pre-seed 30 FlightRadar-style historical trail points
    const trail: TrailPoint[] = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const historicalTime = now - i * 3000;
      const angleRad = ((cfg.heading - (i * 2)) * Math.PI) / 180;
      const dist = (i * 0.0008) * (cfg.speed / 60);
      trail.push({
        lat: lat - Math.cos(angleRad) * dist,
        lng: lng - Math.sin(angleRad) * dist,
        speedKmh: Math.max(0, cfg.speed + (Math.sin(i) * 4)),
        batteryPct: Math.min(100, Math.max(10, cfg.battery + (i * 0.08))),
        timestamp: historicalTime,
      });
    }

    const batteryTwin: BatteryTwinData = {
      packCapacityKwh: cfg.model.includes('Semi') ? 850 : 123,
      nominalVoltageV: cfg.model.includes('Semi') ? 800 : 400,
      currentVoltageV: cfg.model.includes('Semi') ? 812.4 : 406.8,
      packCurrentA: cfg.status === 'FAST_CHARGING' ? -280.5 : cfg.speed > 0 ? (cfg.speed * 2.4) : 4.2,
      powerKw: cfg.status === 'FAST_CHARGING' ? -227.7 : Number(((cfg.speed * 2.4 * 406.8) / 1000).toFixed(1)),
      cellChemistry: cfg.chemistry,
      maxCellTempC: maxTemp,
      minCellTempC: minTemp,
      avgCellTempC: avgTemp,
      coolantFlowLpm: cfg.hasHotspot ? 24.5 : 14.8,
      coolantInletTempC: 19.4,
      coolantOutletTempC: Number((19.4 + (avgTemp * 0.28)).toFixed(1)),
      pumpRpm: cfg.hasHotspot ? 4800 : 2850,
      isolationResistanceKOhm: 4500,
      modules,
    };

    return {
      id: cfg.id,
      name: cfg.name,
      model: cfg.model,
      vin: cfg.vin,
      status: cfg.status,
      lat,
      lng,
      speedKmh: cfg.speed,
      headingDeg: cfg.heading,
      altitudeM: 142 + Math.floor(Math.random() * 8),
      batteryPct: cfg.battery,
      rangeKm: Math.round(cfg.battery * (cfg.model.includes('Semi') ? 7.8 : 5.4)),
      heartbeatMs: 44 + Math.floor(Math.random() * 24),
      pingMs: 14 + Math.floor(Math.random() * 6),
      rssiDb: -62 - Math.floor(Math.random() * 10),
      lastHeartbeatTime: now,
      trail,
      batteryTwin,
    };
  });
}

export function createInitialPLCBridge(): PLCBridgeState {
  const initialRegisters: PLCRegister[] = [
    { address: 40001, name: 'BMS_PACK_VOLTAGE_RAW', value: 8124, unit: '0.1 V', readOnly: true, hex: '0x1FB4', category: 'TELEMETRY' },
    { address: 40002, name: 'BMS_PACK_CURRENT_RAW', value: 1845, unit: '0.1 A', readOnly: true, hex: '0x0735', category: 'TELEMETRY' },
    { address: 40003, name: 'BMS_MAX_CELL_TEMP_RAW', value: 542, unit: '0.1 °C', readOnly: true, hex: '0x021E', category: 'THERMAL' },
    { address: 40004, name: 'COOLANT_PUMP_DUTY_CYCLE', value: 82, unit: '%', readOnly: false, hex: '0x0052', category: 'ACTUATION' },
    { address: 40005, name: 'INVERTER_TORQUE_DEMAND', value: 680, unit: 'Nm', readOnly: false, hex: '0x02A8', category: 'ACTUATION' },
    { address: 40006, name: 'SAFETY_HVIL_LOOP_INTEGRITY', value: 1, unit: 'bool', readOnly: true, hex: '0x0001', category: 'SAFETY' },
    { address: 40007, name: 'PYRO_FUSE_STATUS', value: 'ARMED', unit: 'state', readOnly: true, hex: '0x00AA', category: 'SAFETY' },
    { address: 40008, name: 'CHASSIS_ISOLATION_KOHM', value: 4500, unit: 'kΩ', readOnly: true, hex: '0x1194', category: 'SAFETY' },
    { address: 40009, name: 'ETHERCAT_CYCLE_FREQ_HZ', value: 270, unit: 'Hz', readOnly: true, hex: '0x010E', category: 'TELEMETRY' },
    { address: 40010, name: 'PLC_JITTER_MICROSECONDS', value: 14, unit: 'μs', readOnly: true, hex: '0x000E', category: 'TELEMETRY' },
    { address: 40011, name: 'CHILLER_VALVE_POSITION', value: 45, unit: 'deg', readOnly: false, hex: '0x002D', category: 'ACTUATION' },
    { address: 40012, name: 'THERMAL_RUNAWAY_FLAG', value: 0, unit: 'alarm', readOnly: true, hex: '0x0000', category: 'SAFETY' },
  ];

  const recentFrames: CANFrame[] = [
    { id: 'f_01', timestampMs: Date.now(), arbitrationIdHex: '0x1806E5F4', dlc: 8, dataHex: 'B4 1F 35 07 1E 02 52 00', description: 'BMS_HV_STATUS: Pack V=812.4V, I=184.5A, Tmax=54.2°C', channel: 'CAN1_BATTERY' },
    { id: 'f_02', timestampMs: Date.now() - 3, arbitrationIdHex: '0x0CF11E05', dlc: 8, dataHex: 'A8 02 E0 18 01 00 00 00', description: 'INVERTER_FEEDBACK: Actual Torque 680Nm, Rotor 6368 RPM', channel: 'CAN0_POWERTRAIN' },
    { id: 'f_03', timestampMs: Date.now() - 7, arbitrationIdHex: '0x18FF50E5', dlc: 8, dataHex: '12 01 00 00 94 11 00 00', description: 'SAFETY_TELEMETRY: HVIL Loop OK, Isolation 4500 kΩ', channel: 'CAN2_CHASSIS' },
    { id: 'f_04', timestampMs: Date.now() - 11, arbitrationIdHex: '0x1807E5F4', dlc: 8, dataHex: '22 1F 30 1F 28 1F 24 1F', description: 'BMS_CELL_VOLTAGES: Cell 1..4 = [3.970, 3.984, 3.976, 3.972]V', channel: 'CAN1_BATTERY' },
  ];

  return {
    mode: 'SIMULATOR',
    frequencyHz: 270, // 270Hz display loop
    targetIp: '192.168.1.120:502 [OPC-UA/Beckhoff TwinCAT 3]',
    protocol: 'OPC-UA',
    isConnected: true,
    packetRatePerSec: 270,
    cycleJitterMicroseconds: 14.2,
    roundTripLatencyMs: 3.7,
    cycleCounter: 142890,
    droppedFrames: 0,
    registers: initialRegisters,
    recentFrames,
  };
}

/**
 * Advance vehicle positions and trails on each interval
 */
export function updateFleetStep(fleet: FleetVehicle[], deltaSec: number): FleetVehicle[] {
  const now = Date.now();

  return fleet.map((v) => {
    // If vehicle is fast charging or parked, don't move position much
    if (v.speedKmh === 0) {
      // Simulate slow battery charge
      const newBat = Math.min(100, Number((v.batteryPct + (deltaSec * 0.15)).toFixed(2)));
      return {
        ...v,
        batteryPct: newBat,
        heartbeatMs: 38 + Math.floor(Math.sin(now * 0.005) * 8),
        pingMs: 12 + Math.floor(Math.cos(now * 0.003) * 4),
        lastHeartbeatTime: now,
      };
    }

    // Convert speed km/h to lat/lng delta
    // 1 deg lat ~ 111 km. At 60 km/h, moves ~ 0.0166 km/sec ~ 0.00015 deg lat/sec
    const speedKmSec = v.speedKmh / 3600;
    const distanceKm = speedKmSec * deltaSec;
    const headingRad = (v.headingDeg * Math.PI) / 180;

    // Slight gentle turn over time for natural patrol loops
    let nextHeading = v.headingDeg + (Math.sin(now * 0.0008 + v.id.charCodeAt(5)) * 0.8);
    if (nextHeading < 0) nextHeading += 360;
    if (nextHeading >= 360) nextHeading -= 360;

    const deltaLat = (Math.cos(headingRad) * distanceKm) / 111;
    const deltaLng = (Math.sin(headingRad) * distanceKm) / (111 * Math.cos((v.lat * Math.PI) / 180));

    const nextLat = v.lat + deltaLat;
    const nextLng = v.lng + deltaLng;

    // Battery slow discharge based on speed
    const dischargeRate = (v.speedKmh / 100) * 0.008 * deltaSec;
    const nextBattery = Math.max(8, Number((v.batteryPct - dischargeRate).toFixed(2)));

    // Append new point to trail every 1.5 seconds or so
    let nextTrail = v.trail;
    const lastPoint = v.trail[v.trail.length - 1];
    if (!lastPoint || now - lastPoint.timestamp > 1200) {
      nextTrail = [
        ...v.trail.slice(-40), // Keep last 40 trail points for beautiful FlightRadar trail
        {
          lat: nextLat,
          lng: nextLng,
          speedKmh: Math.round(v.speedKmh),
          batteryPct: Math.round(nextBattery),
          timestamp: now,
        },
      ];
    }

    // Update battery twin module temperatures slightly
    const updatedModules = v.batteryTwin.modules.map((m) => {
      const wobble = Math.sin(now * 0.002 + m.tempC) * 0.1;
      return {
        ...m,
        tempC: Number((m.tempC + wobble).toFixed(1)),
      };
    });

    return {
      ...v,
      lat: nextLat,
      lng: nextLng,
      headingDeg: Math.round(nextHeading),
      batteryPct: nextBattery,
      rangeKm: Math.round(nextBattery * (v.model.includes('Semi') ? 7.8 : 5.4)),
      heartbeatMs: 42 + Math.floor(Math.sin(now * 0.008 + v.lat) * 12),
      pingMs: 14 + Math.floor(Math.cos(now * 0.005 + v.lng) * 5),
      rssiDb: -63 - Math.floor(Math.sin(now * 0.001) * 8),
      lastHeartbeatTime: now,
      trail: nextTrail,
      batteryTwin: {
        ...v.batteryTwin,
        modules: updatedModules,
      },
    };
  });
}
