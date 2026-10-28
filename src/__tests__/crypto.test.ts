import { describe, it, expect } from 'vitest';
import { sha256Sync, canonicalizeDatasetRows } from '../utils/cryptoIntegrity';

describe('A1: Cryptographic Integrity & SHA-256 Test Vectors', () => {
  it('computes exact FIPS 180-4 standard hash for "abc"', () => {
    // Official NIST SHA-256 test vector for "abc"
    const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    const computed = sha256Sync('abc');
    expect(computed).toBe(expected);
  });

  it('computes exact FIPS 180-4 standard hash for empty string', () => {
    // Official NIST SHA-256 test vector for "" (zero bytes)
    const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const computed = sha256Sync('');
    expect(computed).toBe(expected);
  });

  it('guarantees deterministic canonicalization regardless of object key insertion order', () => {
    const rowA = { b: 2, a: 1, c: [3, 2, 1] };
    const rowB = { c: [3, 2, 1], a: 1, b: 2 };

    const canonA = canonicalizeDatasetRows([rowA]);
    const canonB = canonicalizeDatasetRows([rowB]);

    expect(canonA).toBe(canonB);
    expect(sha256Sync(canonA)).toBe(sha256Sync(canonB));
  });
});
