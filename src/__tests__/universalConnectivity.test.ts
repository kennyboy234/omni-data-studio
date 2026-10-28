import { describe, it, expect } from 'vitest';
import {
  INITIAL_CONNECTIVITY_NODES,
  INITIAL_APP_BRIDGES,
  generateCanBusTelemetry,
  generateRos2Telemetry,
  runJavaScriptSandbox,
  runPythonSandbox,
  planAiAutonomousTask,
  triggerBridgeSync,
} from '../utils/universalConnectivityEngine';

describe('Universal Connectivity & Multi-App Fleet Orchestration Engine', () => {
  it('initializes factory fleet and software nodes across ROS2, CAN bus, OPC-UA, and webhooks', () => {
    expect(INITIAL_CONNECTIVITY_NODES.length).toBeGreaterThanOrEqual(8);
    const categories = new Set(INITIAL_CONNECTIVITY_NODES.map((n) => n.category));
    expect(categories.has('robot')).toBe(true);
    expect(categories.has('vehicle')).toBe(true);
    expect(categories.has('machinery')).toBe(true);
    expect(categories.has('software_app')).toBe(true);
    expect(categories.has('database')).toBe(true);
  });

  it('generates decoded CAN bus telemetry frames for automotive/Tesla fleet', () => {
    const frameBms = generateCanBusTelemetry(0);
    expect(frameBms.canId).toBe('0x102');
    expect(frameBms.signals.pack_voltage.value).toBeGreaterThan(380);
    expect(frameBms.signals.soc_percent.value).toBeGreaterThan(0);
    expect(frameBms.dataBytes.length).toBe(8);

    const frameInverter = generateCanBusTelemetry(1);
    expect(frameInverter.canId).toBe('0x280');
    expect(frameInverter.signals.motor_rpm.value).toBeGreaterThan(3000);
    expect(frameInverter.signals.vehicle_speed_kph.value).toBeGreaterThan(50);
  });

  it('generates real-time ROS2 manipulator JointState messages', () => {
    const msg = generateRos2Telemetry(10);
    expect(msg.topic).toBe('/ur10e/joint_states');
    expect(msg.data.joint_names.length).toBe(6);
    expect(msg.data.position_rad.length).toBe(6);
    expect(msg.data.effort_nm.length).toBe(6);
    expect(msg.data.emergency_stop_engaged).toBe(false);
  });

  it('executes JavaScript code in scoped sandbox with custom assertions and telemetry binding', () => {
    const code = `
      const v = telemetry.voltage || 400;
      const safe = v < 450;
      assert(safe, "Voltage is within nominal window");
      console.log("Telemetry check complete:", safe);
      return { status: "PASS", computedValue: v * 1.5 };
    `;

    const res = runJavaScriptSandbox(code, { telemetry: { voltage: 402.5 } });
    expect(res.success).toBe(true);
    expect(res.stdout.length).toBeGreaterThan(0);
    expect(res.returnedValue.status).toBe('PASS');
    expect(res.returnedValue.computedValue).toBe(402.5 * 1.5);
    expect(res.assertionsResult?.[0].passed).toBe(true);
  });

  it('executes Python data scripts with numpy/math calculations and assertions', () => {
    const pyCode = `
# Calculate mean joint velocity and test threshold
vels = [0.12, 0.08, 0.15, 0.04]
avg_vel = numpy.mean(vels)
print(f"Average velocity: {avg_vel}")
assert avg_vel < 0.5, "Velocity safe"
return avg_vel
`;

    const res = runPythonSandbox(pyCode, {});
    expect(res.success).toBe(true);
    expect(res.stdout.some((s) => s.includes('Average velocity'))).toBe(true);
    expect(res.assertionsResult?.[0].passed).toBe(true);
  });

  it('creates an explainable AI execution plan with Judge safety audit gate', () => {
    const plan = planAiAutonomousTask('Connect to Tesla CAN bus and dispatch warning to n8n if cell temp > 40', {
      nodes: INITIAL_CONNECTIVITY_NODES,
      bridges: INITIAL_APP_BRIDGES,
    });

    expect(plan.targetSystems.length).toBeGreaterThan(0);
    expect(plan.steps.length).toBe(4);
    expect(plan.safetyAuditGate.passed).toBe(true);
    expect(plan.safetyAuditGate.zeroWriteConfirmed).toBe(true);
    expect(plan.scriptSnippet).toContain('assert');
  });

  it('triggers cross-app synchronization with delivery acknowledgement', () => {
    const syncRes = triggerBridgeSync('bridge_n8n_alert', { alert: 'Joint 2 torque warning', level: 'HIGH' });
    expect(syncRes.success).toBe(true);
    expect(syncRes.eventId).toMatch(/^EVT-\d+/);
    expect(syncRes.latencyMs).toBeGreaterThan(0);
  });
});
