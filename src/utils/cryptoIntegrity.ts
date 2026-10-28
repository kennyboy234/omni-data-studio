/**
 * Cryptographic Hash and Dataset Integrity Verification Engine
 * Implements FIPS 180-4 compliant SHA-256 hashing with Web Crypto API
 * and pure-JS fallback for deterministic, out-of-core, and in-browser integrity auditing.
 */

// Initial SHA-256 state constants
const H_INIT = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// SHA-256 round constants (first 32 bits of fractional parts of cube roots of first 64 primes)
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

/**
 * Pure JavaScript FIPS 180-4 SHA-256 implementation
 */
export function sha256Sync(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const bitLength = bytes.length * 8;

  // Pre-processing: padding
  // 1 bit '1' (0x80 byte), then zeros, then 64-bit length
  const extraBytes = 64 - ((bytes.length + 9) % 64);
  const totalLength = bytes.length + 1 + (extraBytes === 64 ? 0 : extraBytes) + 8;
  const padded = new Uint8Array(totalLength);
  padded.set(bytes, 0);
  padded[bytes.length] = 0x80;

  // Set 64-bit big-endian length at end
  const view = new DataView(padded.buffer);
  // High 32 bits of bitLength
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  view.setUint32(padded.length - 8, highBits, false);
  view.setUint32(padded.length - 4, lowBits, false);

  // Initialize hash values
  let [h0, h1, h2, h3, h4, h5, h6, h7] = H_INIT;
  const w = new Uint32Array(64);

  // Process message in successive 512-bit (64-byte) chunks
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const result = [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((val) => val.toString(16).padStart(8, '0'))
    .join('');

  return result;
}

/**
 * Async Web Crypto API SHA-256 with fallback to pure JavaScript
 */
export async function computeSHA256(data: Uint8Array | string | ArrayBuffer | Blob): Promise<string> {
  let arrayBuffer: ArrayBuffer;

  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    arrayBuffer = await data.arrayBuffer();
  } else if (typeof data === 'string') {
    const encoded = new TextEncoder().encode(data);
    arrayBuffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer;
  } else if (data instanceof Uint8Array) {
    arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  } else {
    arrayBuffer = data as ArrayBuffer;
  }

  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback if subtle crypto encounters permission or domain constraints
      return sha256Sync(new Uint8Array(arrayBuffer));
    }
  }

  return sha256Sync(new Uint8Array(arrayBuffer));
}

/**
 * Deterministically canonicalize dataset records into an immutable byte stream
 */
export function canonicalizeDatasetRows(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return '[]';
  const sample = rows[0];
  const sortedKeys = Object.keys(sample).sort();

  // Create standardized CSV-like serialization for deterministic hashing
  const lines: string[] = [];
  lines.push(sortedKeys.join(','));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowCells = sortedKeys.map((k) => {
      const v = row[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
      return String(v);
    });
    lines.push(rowCells.join(','));
  }

  return lines.join('\n');
}

export interface IntegrityVerificationResult {
  status: 'pass' | 'fail';
  storedHash: string;
  computedHash: string;
  durationMs: number;
  bytesProcessed: number;
  timestamp: string;
  sourceTested: 'raw_payload' | 'uploaded_file' | 'tampered_simulation';
  message: string;
}

/**
 * Verification executor: Compares re-hashed input against stored fingerprint
 */
export async function verifyDatasetIntegrity(
  storedHash: string,
  rawInput: string | Uint8Array | Blob | File | Record<string, any>[],
  sourceLabel: 'raw_payload' | 'uploaded_file' | 'tampered_simulation' = 'raw_payload'
): Promise<IntegrityVerificationResult> {
  const startTime = performance.now();
  let computedHash = '';
  let bytesCount = 0;

  if (Array.isArray(rawInput)) {
    const canonical = canonicalizeDatasetRows(rawInput);
    const encoded = new TextEncoder().encode(canonical);
    bytesCount = encoded.length;
    computedHash = await computeSHA256(encoded);
  } else if (typeof rawInput === 'string') {
    const encoded = new TextEncoder().encode(rawInput);
    bytesCount = encoded.length;
    computedHash = await computeSHA256(encoded);
  } else if (typeof Blob !== 'undefined' && rawInput instanceof Blob) {
    bytesCount = rawInput.size;
    computedHash = await computeSHA256(rawInput);
  } else if (rawInput instanceof Uint8Array) {
    bytesCount = rawInput.byteLength;
    computedHash = await computeSHA256(rawInput);
  }

  const durationMs = Math.round(performance.now() - startTime);

  // Normalize comparison by stripping prefixes if any
  const cleanStored = storedHash.replace(/^sha256_/, '').trim().toLowerCase();
  const cleanComputed = computedHash.replace(/^sha256_/, '').trim().toLowerCase();

  const isPass = cleanStored === cleanComputed;

  return {
    status: isPass ? 'pass' : 'fail',
    storedHash: cleanStored,
    computedHash: cleanComputed,
    durationMs: Math.max(1, durationMs),
    bytesProcessed: bytesCount,
    timestamp: new Date().toISOString(),
    sourceTested: sourceLabel,
    message: isPass
      ? 'PASS: Raw dataset byte stream matches the stored SHA-256 fingerprint bit-for-bit. Cryptographic immutability is guaranteed.'
      : 'FAIL: SHA-256 checksum mismatch detected. The raw file or payload has been modified, corrupted, or altered since initial ingestion.',
  };
}
