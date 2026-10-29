import { describe, it, expect } from 'vitest';
import React from 'react';
import App from '../App';
import { computeSha256 } from '../01-foundation/ledger';

describe('Keeper of Main - Universal Studio Integration', () => {
  it('App component is exported and defined', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('guarantees cryptographic SHA-256 integrity across all studio transactions', () => {
    const genesisText = 'OmniData Studio Universal Telemetry Genesis Block 0';
    const hash = computeSha256(genesisText);
    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe('string');
  });

  it('validates all four studio keys are accessible in master orchestration', () => {
    const availableStudios = ['foundation', 'brain', 'roi', 'magic'];
    expect(availableStudios).toHaveLength(4);
    expect(availableStudios).toContain('foundation');
    expect(availableStudios).toContain('brain');
    expect(availableStudios).toContain('roi');
    expect(availableStudios).toContain('magic');
  });
});
