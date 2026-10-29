import { describe, it, expect } from 'vitest';
import {
  ingestData,
  detectColumnType,
  parseCSV,
  generateSampleDataset,
  generateStreamBenchmark,
} from '../01-foundation/ingestion';
import {
  evaluateQuality,
  injectNullFault,
  injectDuplicateFault,
  injectDriftFault,
} from '../01-foundation/quality';
import {
  computeSha256,
  Sha256Ledger,
} from '../01-foundation/ledger';

describe('Studio 1 - FOUNDATION: WF01 Ingestion Hub', () => {
  it('parses CSV and auto-detects column schemas and types correctly', () => {
    const rawCSV = `id,name,value,active,created_at
1,Sensor A,42.5,true,2026-10-24T00:00:00Z
2,Sensor B,18.2,false,2026-10-24T01:00:00Z
3,Sensor C,99.9,true,2026-10-24T02:00:00Z`;

    const { data, columns } = parseCSV(rawCSV);
    expect(data.length).toBe(3);
    expect(columns).toEqual(['id', 'name', 'value', 'active', 'created_at']);

    const result = ingestData('test_sensors.csv', data, 'csv');
    expect(result.columnCount).toBe(5);
    expect(result.columns.find((c) => c.name === 'id')?.type).toBe('integer');
    expect(result.columns.find((c) => c.name === 'value')?.type).toBe('float');
    expect(result.columns.find((c) => c.name === 'active')?.type).toBe('boolean');
    expect(result.columns.find((c) => c.name === 'created_at')?.type).toBe('datetime');
    expect(result.columns.find((c) => c.name === 'name')?.type).toBe('string');
  });

  it('runs 1M rows/s stream benchmark with high throughput', () => {
    const benchmark = generateStreamBenchmark(10000);
    expect(benchmark.rowCount).toBe(10000);
    expect(benchmark.throughputRowsPerSec).toBeGreaterThanOrEqual(1000000);
    expect(benchmark.format).toBe('parquet');
  });
});

describe('Studio 1 - FOUNDATION: WF02 Quality Pills', () => {
  const sample = generateSampleDataset(50);

  it('passes all quality pills (Nulls, Duplicates, Drift) on pristine sample data', () => {
    const quality = evaluateQuality(sample, sample);
    expect(quality.overallPassed).toBe(true);
    expect(quality.nulls.status).toBe('passed');
    expect(quality.nulls.count).toBe(0);
    expect(quality.duplicates.status).toBe('passed');
    expect(quality.duplicates.count).toBe(0);
    expect(quality.drift.status).toBe('passed');
  });

  it('turns Nulls pill RED (failed) when null fault is injected', () => {
    const corrupted = injectNullFault(sample, 10);
    const quality = evaluateQuality(corrupted, sample);
    expect(quality.nulls.status).toBe('failed');
    expect(quality.nulls.hasFault).toBe(true);
    expect(quality.nulls.count).toBeGreaterThan(0);
    expect(quality.overallPassed).toBe(false);
  });

  it('turns Duplicates pill RED (failed) when duplicate fault is injected', () => {
    const corrupted = injectDuplicateFault(sample, 5);
    const quality = evaluateQuality(corrupted, sample);
    expect(quality.duplicates.status).toBe('failed');
    expect(quality.duplicates.hasFault).toBe(true);
    expect(quality.duplicates.count).toBeGreaterThan(0);
    expect(quality.overallPassed).toBe(false);
  });

  it('turns Drift pill RED (failed) when drift fault is injected', () => {
    const corrupted = injectDriftFault(sample);
    const quality = evaluateQuality(corrupted, sample);
    expect(quality.drift.status).toBe('failed');
    expect(quality.drift.hasFault).toBe(true);
    expect(quality.overallPassed).toBe(false);
  });
});

describe('Studio 1 - FOUNDATION: WF03 SHA-256 Ledger', () => {
  it('computes deterministic SHA-256 hash', () => {
    const payloadA = { sensor: 'TEMP_01', val: 42 };
    const payloadB = { sensor: 'TEMP_01', val: 42 };
    const hashA = computeSha256(payloadA);
    const hashB = computeSha256(payloadB);

    expect(hashA).toBe(hashB);
    expect(hashA.length).toBe(64);
  });

  it('records datasets and maintains an immutable cryptographic chain', () => {
    const ledger = new Sha256Ledger();
    const chain1 = ledger.getChain();
    expect(chain1.length).toBe(1); // Genesis block
    expect(chain1[0].operation).toBe('GENESIS_INIT');

    const entry1 = ledger.recordDataset('ds_1', 'Dataset 1', 'LOAD', 100, [{ a: 1 }]);
    expect(entry1.blockIndex).toBe(1);
    expect(entry1.previousBlockHash).toBe(chain1[0].blockHash);

    const verification = ledger.verifyChainIntegrity();
    expect(verification.isValid).toBe(true);
  });

  it('detects tampering if data mutated', () => {
    const datasetA = [{ id: 1, val: 'pristine' }];
    const datasetB = [{ id: 1, val: 'tampered' }];
    const hashA = computeSha256(datasetA);
    const hashB = computeSha256(datasetB);

    expect(hashA).not.toBe(hashB);
  });
});
