import { describe, it, expect } from 'vitest';
import {
  MCP_READ_ONLY_TOOLS,
  AGENT_PERSONAS,
  planAgentTask,
  executeApprovedAgentPlan,
} from '../utils/mcpAgentOrchestrator';

describe('Phase G: MCP Agent Orchestrator & Read-Only Tool Matrix Suite', () => {
  // 1. Tool Matrix & Read-Only Invariant
  it('exposes strictly read-only MCP tools with zero physical write capabilities', () => {
    expect(MCP_READ_ONLY_TOOLS.length).toBeGreaterThanOrEqual(6);
    MCP_READ_ONLY_TOOLS.forEach((tool) => {
      expect(tool.readOnly).toBe(true);
      expect(tool.name.toLowerCase()).not.toContain('write');
      expect(tool.name.toLowerCase()).not.toContain('delete');
      expect(tool.name.toLowerCase()).not.toContain('set_');
    });
  });

  // 2. Multi-Agent Persona Scoping
  it('enforces role-based tool authorization boundaries across agent personas', () => {
    const reliabilityEngineer = AGENT_PERSONAS.RELIABILITY_ENGINEER;
    expect(reliabilityEngineer.allowedTools).toContain('industrial_compute_weibull_mle');
    expect(reliabilityEngineer.allowedTools).not.toContain('industrial_evaluate_fault_tree');

    const safetyAssessor = AGENT_PERSONAS.SAFETY_RISK_ASSESSOR;
    expect(safetyAssessor.allowedTools).toContain('industrial_evaluate_fault_tree');
    expect(safetyAssessor.allowedTools).toContain('industrial_evaluate_fmea_ap');
  });

  // 3. Planning & Zero-Write Safety Gate
  it('approves read-only telemetry analysis proposal', () => {
    const plan = planAgentTask(
      'Assess turbine blade lifecycle and failure probability',
      'RELIABILITY_ENGINEER',
      [
        {
          toolName: 'industrial_compute_weibull_mle',
          agentRole: 'RELIABILITY_ENGINEER',
          parameters: {
            lifetimes: [120, 240, 360, 480, 600],
            censored: [false, false, false, true, false],
          },
          rationale: 'Compute MLE Weibull shape beta to determine whether wear-out or infant mortality regime applies',
        },
      ]
    );

    expect(plan.status).toBe('PROPOSED');
    expect(plan.safetyAuditResult.passed).toBe(true);
    expect(plan.safetyAuditResult.zeroWriteEnforced).toBe(true);
    expect(plan.humanApprovalRequired).toBe(true);
  });

  it('traps and strictly blocks any proposed physical write or actuator command', () => {
    const maliciousPlan = planAgentTask(
      'Attempted motor speed override',
      'RELIABILITY_ENGINEER',
      [
        {
          toolName: 'industrial_compute_weibull_mle',
          agentRole: 'RELIABILITY_ENGINEER',
          parameters: {
            command: 'write_plc_register_0x24',
          },
          rationale: 'Override torque limit on assembly robot',
        },
      ]
    );

    expect(maliciousPlan.status).toBe('BLOCKED_BY_SAFETY');
    expect(maliciousPlan.safetyAuditResult.passed).toBe(false);
    expect(maliciousPlan.safetyAuditResult.auditNote).toContain('CRITICAL INTERCEPTION');
  });

  it('blocks agent from attempting to invoke an unauthorized domain tool', () => {
    const unauthorizedPlan = planAgentTask(
      'Data specialist attempts safety fault tree calculation',
      'DATA_FABRIC_SPECIALIST',
      [
        {
          toolName: 'industrial_evaluate_fault_tree', // Not in DATA_FABRIC_SPECIALIST allowedTools
          agentRole: 'DATA_FABRIC_SPECIALIST',
          parameters: {},
          rationale: 'Unauthorized call',
        },
      ]
    );

    expect(unauthorizedPlan.status).toBe('BLOCKED_BY_SAFETY');
    expect(unauthorizedPlan.safetyAuditResult.auditNote).toContain('not authorized to call tool');
  });

  // 4. Execution Lifecycle
  it('executes approved read-only plan and gathers mathematical outputs', () => {
    const plan = planAgentTask(
      'Audit process control limits',
      'QUALITY_SPC_ANALYST',
      [
        {
          toolName: 'industrial_evaluate_spc_chart',
          agentRole: 'QUALITY_SPC_ANALYST',
          parameters: {
            measurements: [10.1, 10.2, 10.15, 10.3, 10.25, 10.2, 10.18],
          },
          rationale: 'Verify process stability using I-MR chart',
        },
      ]
    );

    const executed = executeApprovedAgentPlan(plan);
    expect(executed.status).toBe('COMPLETED');
    expect(executed.executionResults?.length).toBe(1);
    expect(executed.executionResults![0].toolName).toBe('industrial_evaluate_spc_chart');
    expect(executed.executionResults![0].output).toBeDefined();
    expect(executed.executionResults![0].output.chartType).toBe('I_MR');
  });
});
