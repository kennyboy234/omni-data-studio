import { describe, it, expect } from 'vitest';
import { MASTER_120_FEATURES } from '../00-audit/AuditDashboard';
import fs from 'node:fs';
import path from 'node:path';

describe('AuditDashboard - 120 Master Features Specification', () => {
  it('contains exactly 120 master features from WF01 to WF120', () => {
    expect(MASTER_120_FEATURES).toHaveLength(120);

    // Verify all IDs from WF01 to WF120
    const ids = MASTER_120_FEATURES.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(120);

    for (let i = 1; i <= 120; i++) {
      const expectedId = `WF${i < 10 ? '0' + i : i}`;
      expect(uniqueIds.has(expectedId)).toBe(true);
    }
  });

  it('verifies exact domain allocations across all 5 domains', () => {
    const counts = MASTER_120_FEATURES.reduce((acc, f) => {
      acc[f.domain] = (acc[f.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(counts['FOUNDATION']).toBe(20);
    expect(counts['BRAIN']).toBe(30);
    expect(counts['FLEET MESH']).toBe(30);
    expect(counts['ROI + GOVERNANCE']).toBe(20);
    expect(counts['MAGIC MOAT']).toBe(20);
  });

  it('ensures every single workflow feature points to an existing file in /src', () => {
    const missingFiles: string[] = [];

    MASTER_120_FEATURES.forEach((f) => {
      // Relative from repo root: remove leading slash
      const relativePath = f.filePath.replace(/^\//, '');
      const fullPath = path.resolve(process.cwd(), relativePath);
      if (!fs.existsSync(fullPath)) {
        missingFiles.push(`${f.id} (${f.filePath})`);
      }
    });

    expect(missingFiles).toEqual([]);
  });

  it('validates that each feature testFunction returns success and within latency bounds', () => {
    MASTER_120_FEATURES.forEach((f) => {
      const res = f.testFunction();
      expect(res.success).toBe(true);
      expect(res.latencyMs).toBeGreaterThan(0);
      expect(res.latencyMs).toBeLessThan(100);
      expect(res.details.length).toBeGreaterThan(5);
    });
  });
});
