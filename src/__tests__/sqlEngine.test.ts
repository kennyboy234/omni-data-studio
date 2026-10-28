import { describe, it, expect } from 'vitest';
import { executeSQL, checkDestructiveSQL } from '../utils/sqlEngine';

describe('A1: In-Browser SQL Engine Query & Safety Verification', () => {
  const testTable = [
    { id: 1, name: 'Sensor-A', temperature: 42.5, status: 'OK' },
    { id: 2, name: 'Sensor-B', temperature: 55.0, status: 'WARN' },
    { id: 3, name: 'Sensor-C', temperature: 38.0, status: 'OK' },
    { id: 4, name: 'Sensor-D', temperature: 71.2, status: 'CRIT' },
    { id: 5, name: 'Sensor-E', temperature: 49.8, status: 'WARN' },
  ];

  const tables = {
    telemetry: testTable,
  };

  it('executes valid SELECT with WHERE and ORDER BY', () => {
    const sql = "SELECT name, temperature, status FROM telemetry WHERE temperature > 45 ORDER BY temperature DESC";
    const res = executeSQL(sql, tables);

    expect(res.error).toBeUndefined();
    expect(res.rowCount).toBe(3);
    expect(res.rows[0].name).toBe('Sensor-D');
    expect(res.rows[0].temperature).toBe(71.2);
  });

  it('executes GROUP BY with aggregates (COUNT, AVG, MAX)', () => {
    const sql = "SELECT status, COUNT(*) as total_sensors, AVG(temperature) as avg_temp FROM telemetry GROUP BY status";
    const res = executeSQL(sql, tables);

    expect(res.error).toBeUndefined();
    expect(res.rowCount).toBe(3); // 'OK', 'WARN', 'CRIT'
    const okGroup = res.rows.find((r) => r.status === 'OK');
    expect(okGroup).toBeDefined();
    expect(okGroup?.total_sensors).toBe(2);
  });

  it('strictly blocks destructive SQL commands (DROP, DELETE, TRUNCATE) without authorization', () => {
    const destructiveQueries = [
      "DROP TABLE telemetry",
      "DELETE FROM telemetry WHERE id = 1",
      "TRUNCATE TABLE telemetry",
      "ALTER TABLE telemetry DROP COLUMN temperature",
    ];

    for (const query of destructiveQueries) {
      const check = checkDestructiveSQL(query);
      expect(check.isDestructive).toBe(true);

      const res = executeSQL(query, tables, false);
      expect(res.isDestructiveAttempt).toBe(true);
      expect(res.error).toContain('GUARDRAIL INTERCEPT: Destructive SQL command');
      expect(res.rows.length).toBe(0);
    }
  });

  it('returns a clear NOT SUPPORTED error for JOINs, CTEs, and Window functions', () => {
    // 1. JOIN
    const joinRes = executeSQL("SELECT t1.id, t2.val FROM telemetry t1 JOIN lookup t2 ON t1.id = t2.id", tables);
    expect(joinRes.error).toContain('SQL NOT SUPPORTED: JOIN is not supported');
    expect(joinRes.error).toContain('DuckDB-WASM');

    // 2. CTE (WITH)
    const cteRes = executeSQL("WITH cte AS (SELECT * FROM telemetry) SELECT * FROM cte", tables);
    expect(cteRes.error).toContain('SQL NOT SUPPORTED: Common Table Expression (WITH/CTE) is not supported');
    expect(cteRes.error).toContain('DuckDB-WASM');

    // 3. Window Function (OVER)
    const windowRes = executeSQL("SELECT id, AVG(temperature) OVER (PARTITION BY status) FROM telemetry", tables);
    expect(windowRes.error).toContain('SQL NOT SUPPORTED: Window Function (OVER) is not supported');
    expect(windowRes.error).toContain('DuckDB-WASM');
  });
});
