import { describe, expect, it } from 'vitest';
import {
  createInitialFleet,
  createInitialPLCBridge,
  updateFleetStep,
} from '../03-fleet/fleetSimulationEngine';

describe('Studio 3: Fleet Mesh & 3D Battery Twin Engine', () => {
  it('initializes fleet with 6 autonomous vehicles and FlightRadar trail history', () => {
    const fleet = createInitialFleet();
    expect(fleet.length).toBe(6);

    const cyber = fleet.find((v) => v.id === 'VH-CYBER-01');
    expect(cyber).toBeDefined();
    expect(cyber?.model).toContain('Cybertruck');
    expect(cyber?.trail.length).toBeGreaterThanOrEqual(20);
    expect(cyber?.batteryPct).toBeGreaterThan(0);
    expect(cyber?.heartbeatMs).toBeGreaterThan(0);
  });

  it('contains multi-module 3D battery twin with cell temperature gradient', () => {
    const fleet = createInitialFleet();
    const truck = fleet.find((v) => v.id === 'VH-ROBOTRUCK-04');
    expect(truck).toBeDefined();

    const twin = truck!.batteryTwin;
    expect(twin.packCapacityKwh).toBe(850);
    expect(twin.modules.length).toBe(6);

    // Verify cell count per module
    twin.modules.forEach((mod) => {
      expect(mod.cells.length).toBe(16);
      expect(mod.tempC).toBeGreaterThan(15);
      expect(mod.voltageV).toBeGreaterThan(50);
    });

    // Check that hotspot is detected on truck
    expect(twin.maxCellTempC).toBeGreaterThan(twin.minCellTempC);
  });

  it('advances vehicle positions and generates fresh trail coordinates on updateFleetStep', () => {
    const fleet = createInitialFleet();
    const v0 = fleet[0];
    const initialLat = v0.lat;
    const initialLng = v0.lng;

    const updated = updateFleetStep(fleet, 2.0);
    const vUpdated = updated[0];

    // Since vehicle 0 is moving at 74 km/h, coordinates must advance
    expect(vUpdated.lat).not.toBe(initialLat);
    expect(vUpdated.lng).not.toBe(initialLng);
    expect(vUpdated.trail.length).toBeGreaterThanOrEqual(v0.trail.length);
  });

  it('initializes 270Hz PLC Bridge with Modbus/EtherCAT registers and SIMULATOR mode', () => {
    const bridge = createInitialPLCBridge();
    expect(bridge.frequencyHz).toBe(270);
    expect(bridge.mode).toBe('SIMULATOR');
    expect(bridge.isConnected).toBe(true);
    expect(bridge.cycleJitterMicroseconds).toBeLessThan(30);

    const freqReg = bridge.registers.find((r) => r.name === 'ETHERCAT_CYCLE_FREQ_HZ');
    expect(freqReg).toBeDefined();
    expect(freqReg?.value).toBe(270);

    const vRaw = bridge.registers.find((r) => r.name === 'BMS_PACK_VOLTAGE_RAW');
    expect(vRaw).toBeDefined();
    expect(vRaw?.value).toBe(8124);
  });

  it('simulates battery charging when vehicle speed is 0 and parked at mega charger', () => {
    const fleet = createInitialFleet();
    const chargerRover = fleet.find((v) => v.id === 'VH-ROV-33');
    expect(chargerRover).toBeDefined();
    expect(chargerRover?.speedKmh).toBe(0);

    const initialBat = chargerRover!.batteryPct;
    const updated = updateFleetStep(fleet, 5.0);
    const updatedRover = updated.find((v) => v.id === 'VH-ROV-33');

    expect(updatedRover!.batteryPct).toBeGreaterThanOrEqual(initialBat);
  });
});
