/**
 * SolGuard AI — Tamper-Evident SHA-256 Audit Ledger
 * 
 * Cryptographically seals every AI agent tool call, policy evaluation,
 * simulation outcome, and circuit trip into an immutable hash chain.
 */

const crypto = require('node:crypto');

class AuditChain {
  constructor() {
    this.chain = [];
    this._createGenesisBlock();
  }

  _createGenesisBlock() {
    const genesisPayload = {
      event: 'SOLGUARD_GENESIS_INITIALIZED',
      network: 'solana-mainnet-beta',
      engine: 'SolGuard Zero-Trust Agentic Sentinel',
      timestamp: 1762128000000 // Deterministic genesis timestamp
    };

    const genesisHash = this._calculateHash(0, 1762128000000, genesisPayload, '0'.repeat(64));
    this.chain.push({
      index: 0,
      timestamp: 1762128000000,
      payload: genesisPayload,
      prevHash: '0'.repeat(64),
      hash: genesisHash
    });
  }

  _calculateHash(index, timestamp, payload, prevHash) {
    const serialized = `${index}|${timestamp}|${JSON.stringify(payload)}|${prevHash}`;
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Append a new sealed audit block to the ledger.
   * @param {string} eventType 
   * @param {object} eventData 
   * @returns {object} The appended block
   */
  seal(eventType, eventData) {
    const prevBlock = this.chain[this.chain.length - 1];
    const index = this.chain.length;
    const timestamp = Date.now();
    const payload = {
      eventType,
      ...eventData
    };

    const hash = this._calculateHash(index, timestamp, payload, prevBlock.hash);

    const newBlock = {
      index,
      timestamp,
      payload,
      prevHash: prevBlock.hash,
      hash
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Verify cryptographic integrity of the entire audit chain.
   * @returns {{ valid: boolean, blockCount: number, error?: string }}
   */
  verifyChain() {
    if (this.chain.length === 0) {
      return { valid: false, blockCount: 0, error: 'Audit chain is empty' };
    }

    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Check 1: Linkage
      if (current.prevHash !== previous.hash) {
        return {
          valid: false,
          blockCount: this.chain.length,
          error: `Broken hash link at block #${i}: current.prevHash (${current.prevHash.substring(0, 8)}...) != previous.hash (${previous.hash.substring(0, 8)}...)`
        };
      }

      // Check 2: Content tampering
      const recomputedHash = this._calculateHash(current.index, current.timestamp, current.payload, current.prevHash);
      if (current.hash !== recomputedHash) {
        return {
          valid: false,
          blockCount: this.chain.length,
          error: `Tampered payload detected at block #${i}: block.hash does not match cryptographic recomputation`
        };
      }
    }

    return {
      valid: true,
      blockCount: this.chain.length
    };
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }
}

module.exports = { AuditChain };
