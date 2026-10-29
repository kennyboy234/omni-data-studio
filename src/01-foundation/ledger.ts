/**
 * Studio 1 - FOUNDATION: WF03 SHA-256 Ledger
 * Pure TypeScript cryptographic ledger recording immutable SHA-256 hashes for every dataset state.
 * Validates data integrity, tamper detection, and hash audit trails in both browser and Node.js.
 */

export interface LedgerEntry {
  blockIndex: number;
  timestamp: string;
  datasetId: string;
  datasetName: string;
  operation: string;
  rowCount: number;
  datasetSha256: string;
  previousBlockHash: string;
  blockHash: string;
  isValid: boolean;
}

/**
 * Pure TypeScript synchronous SHA-256 implementation
 * Runs universally in modern browsers and Node without node:crypto native addon.
 */
function sha256Sync(str: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = str.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let compositeStr = str + '\x80';
  while (compositeStr.length % 64 !== 56) {
    compositeStr += '\x00';
  }

  for (i = 0; i < compositeStr.length; i++) {
    j = compositeStr.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words.push((asciiBitLength / maxWord) | 0);
  words.push(asciiBitLength | 0);

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + w[i]) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export function computeSha256(data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return sha256Sync(str);
}

export class Sha256Ledger {
  private chain: LedgerEntry[] = [];

  constructor() {
    this.createGenesisBlock();
  }

  private createGenesisBlock(): void {
    const genesisTime = new Date('2026-10-01T00:00:00.000Z').toISOString();
    const prev = '0000000000000000000000000000000000000000000000000000000000000000';
    const payload = {
      blockIndex: 0,
      timestamp: genesisTime,
      datasetId: 'ds_genesis',
      datasetName: 'OmniData Genesis Root',
      operation: 'GENESIS_INIT',
      rowCount: 0,
      datasetSha256: computeSha256('OMNIDATA_GENESIS_ROOT_V1'),
      previousBlockHash: prev,
    };
    const blockHash = computeSha256(payload);

    this.chain = [
      {
        ...payload,
        blockHash,
        isValid: true,
      },
    ];
  }

  public recordDataset(
    datasetId: string,
    datasetName: string,
    operation: string,
    rowCount: number,
    datasetContent: any
  ): LedgerEntry {
    const prevBlock = this.chain[this.chain.length - 1];
    const timestamp = new Date().toISOString();
    const datasetSha256 = computeSha256(datasetContent);

    const blockIndex = this.chain.length;
    const previousBlockHash = prevBlock ? prevBlock.blockHash : '0'.repeat(64);

    const payload = {
      blockIndex,
      timestamp,
      datasetId,
      datasetName,
      operation,
      rowCount,
      datasetSha256,
      previousBlockHash,
    };

    const blockHash = computeSha256(payload);

    const entry: LedgerEntry = {
      ...payload,
      blockHash,
      isValid: true,
    };

    this.chain.push(entry);
    return entry;
  }

  public getChain(): LedgerEntry[] {
    return [...this.chain];
  }

  public verifyChainIntegrity(): { isValid: boolean; corruptedBlockIndex?: number; message: string } {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Verify previous block hash linkage
      if (current.previousBlockHash !== previous.blockHash) {
        return {
          isValid: false,
          corruptedBlockIndex: i,
          message: `Cryptographic link broken at Block #${i}: previousBlockHash does not match Block #${i - 1} hash`,
        };
      }

      // Recompute block hash
      const payload = {
        blockIndex: current.blockIndex,
        timestamp: current.timestamp,
        datasetId: current.datasetId,
        datasetName: current.datasetName,
        operation: current.operation,
        rowCount: current.rowCount,
        datasetSha256: current.datasetSha256,
        previousBlockHash: current.previousBlockHash,
      };

      const expectedHash = computeSha256(payload);
      if (current.blockHash !== expectedHash) {
        return {
          isValid: false,
          corruptedBlockIndex: i,
          message: `Hash mismatch at Block #${i}: payload was tampered with`,
        };
      }
    }

    return {
      isValid: true,
      message: `All ${this.chain.length} cryptographic ledger blocks verified valid. SHA-256 chain is immutable.`,
    };
  }
}

// Global Singleton instance for Studio 1
export const globalLedger = new Sha256Ledger();
