export type VehicleId =
  | 'VH-CYBER-01'
  | 'VH-ROBOTRUCK-04'
  | 'VH-PATROL-09'
  | 'VH-SHUTTLE-12'
  | 'VH-ROV-33'
  | 'VH-AUTOSHIFT-07';

export type VehicleStatus =
  | 'ACTIVE_MISSION'
  | 'PATROL_ROUTE'
  | 'FAST_CHARGING'
  | 'HIGHWAY_PILOT'
  | 'THERMAL_SOAK';

export interface TrailPoint {
  lat: number;
  lng: number;
  speedKmh: number;
  batteryPct: number;
  timestamp: number;
}

export interface BatteryCell {
  id: string;
  tempC: number;
  voltageV: number;
  resistanceMOhm: number;
  sohPct: number;
}

export interface BatteryModule {
  id: string;
  name: string;
  tempC: number;
  voltageV: number;
  healthPct: number;
  resistanceMOhm: number;
  status: 'nominal' | 'warm' | 'hot' | 'critical';
  hotspotDeltaC: number;
  cells: BatteryCell[];
}

export interface BatteryTwinData {
  packCapacityKwh: number;
  nominalVoltageV: number;
  currentVoltageV: number;
  packCurrentA: number;
  powerKw: number;
  cellChemistry: 'NMC 811' | 'LFP Blade' | 'Solid-State Silicon';
  maxCellTempC: number;
  minCellTempC: number;
  avgCellTempC: number;
  coolantFlowLpm: number;
  coolantInletTempC: number;
  coolantOutletTempC: number;
  pumpRpm: number;
  isolationResistanceKOhm: number;
  modules: BatteryModule[];
}

export interface FleetVehicle {
  id: VehicleId;
  name: string;
  model: string;
  vin: string;
  status: VehicleStatus;
  lat: number;
  lng: number;
  speedKmh: number;
  headingDeg: number;
  altitudeM: number;
  batteryPct: number;
  rangeKm: number;
  heartbeatMs: number;
  pingMs: number;
  rssiDb: number;
  lastHeartbeatTime: number;
  trail: TrailPoint[];
  batteryTwin: BatteryTwinData;
}

export interface PLCRegister {
  address: number;
  name: string;
  value: number | string;
  unit: string;
  readOnly: boolean;
  hex: string;
  category: 'TELEMETRY' | 'ACTUATION' | 'SAFETY' | 'THERMAL';
}

export interface CANFrame {
  id: string;
  timestampMs: number;
  arbitrationIdHex: string;
  dlc: number;
  dataHex: string;
  description: string;
  channel: 'CAN0_POWERTRAIN' | 'CAN1_BATTERY' | 'CAN2_CHASSIS';
}

export interface PLCBridgeState {
  mode: 'SIMULATOR' | 'REAL';
  frequencyHz: number; // 270Hz
  targetIp: string;
  protocol: 'OPC-UA' | 'Modbus-TCP' | 'EtherCAT' | 'CANopen';
  isConnected: boolean;
  packetRatePerSec: number;
  cycleJitterMicroseconds: number;
  roundTripLatencyMs: number;
  cycleCounter: number;
  droppedFrames: number;
  registers: PLCRegister[];
  recentFrames: CANFrame[];
}
