/**
 * SolGuard AI — Autonomous Financial Circuit Breaker & Velocity Throttle
 * 
 * Enforces fail-closed spending invariants for autonomous AI agents on Solana:
 * - Single transaction cap (default: 5 SOL = 5*10^9 lamports)
 * - Rolling 24h spending volume cap (default: 25 SOL = 25*10^9 lamports)
 * - Velocity throttle (max 3 transactions per 60-second window)
 * - Fail-closed deterministic state machine: ARMED -> THROTTLED -> TRIPPED_LOCKED
 */

const { LamportMath, LAMPORTS_PER_SOL } = require('./lamport_math');

const STATES = {
  ARMED: 'ARMED',
  THROTTLED: 'THROTTLED',
  TRIPPED_LOCKED: 'TRIPPED_LOCKED'
};

class CircuitBreaker {
  constructor(options = {}) {
    this.maxSingleLamports = options.maxSingleLamports || (5n * LAMPORTS_PER_SOL); // 5 SOL
    this.maxDailyLamports = options.maxDailyLamports || (25n * LAMPORTS_PER_SOL);  // 25 SOL
    this.velocityWindowMs = options.velocityWindowMs || 60000;                     // 60 seconds
    this.maxVelocityCount = options.maxVelocityCount || 3;                         // Max 3 txs/min
    this.adminToken = options.adminToken || 'SOLGUARD_ED25519_ADMIN_MASTER_KEY_2026';

    this.state = STATES.ARMED;
    this.tripReason = null;
    this.trippedAt = null;

    this.transactionHistory = []; // { timestamp, lamports, recipient, txHash }
  }

  /**
   * Evaluate whether an outbound transaction is authorized to proceed.
   * @param {bigint|string|number} lamportsAmount 
   * @param {string} recipientAddress 
   * @returns {{ authorized: boolean, state: string, reason?: string, currentDailyTotal: string }}
   */
  evaluate(lamportsAmount, recipientAddress) {
    const amount = BigInt(lamportsAmount);

    // 1. If already locked, fail-closed immediately
    if (this.state === STATES.TRIPPED_LOCKED) {
      return {
        authorized: false,
        state: this.state,
        reason: `Circuit breaker is TRIPPED_LOCKED: ${this.tripReason}. Manual admin override required.`,
        currentDailyTotal: LamportMath.toSol(this.getDailySpentLamports())
      };
    }

    const now = Date.now();

    // 2. Velocity check (Sliding window)
    const recentTxs = this.transactionHistory.filter(tx => now - tx.timestamp < this.velocityWindowMs);
    if (recentTxs.length >= this.maxVelocityCount) {
      this.state = STATES.THROTTLED;
      return {
        authorized: false,
        state: this.state,
        reason: `Velocity limit tripped: ${recentTxs.length} transactions executed within ${this.velocityWindowMs / 1000}s. Maximum allowed is ${this.maxVelocityCount}.`,
        currentDailyTotal: LamportMath.toSol(this.getDailySpentLamports())
      };
    }

    // 3. Single transaction cap check
    if (amount > this.maxSingleLamports) {
      this.trip(`Single transaction cap exceeded. Requested: ${LamportMath.toSol(amount)} SOL, Limit: ${LamportMath.toSol(this.maxSingleLamports)} SOL`);
      return {
        authorized: false,
        state: this.state,
        reason: this.tripReason,
        currentDailyTotal: LamportMath.toSol(this.getDailySpentLamports())
      };
    }

    // 4. Daily rolling cap check
    const currentDaily = this.getDailySpentLamports();
    const projectedDaily = currentDaily + amount;

    if (projectedDaily > this.maxDailyLamports) {
      this.trip(`Daily rolling volume cap exceeded. Current: ${LamportMath.toSol(currentDaily)} SOL, Requested: ${LamportMath.toSol(amount)} SOL, Max 24h: ${LamportMath.toSol(this.maxDailyLamports)} SOL`);
      return {
        authorized: false,
        state: this.state,
        reason: this.tripReason,
        currentDailyTotal: LamportMath.toSol(currentDaily)
      };
    }

    // Recover from THROTTLED to ARMED if velocity has subsided
    if (this.state === STATES.THROTTLED && recentTxs.length < this.maxVelocityCount) {
      this.state = STATES.ARMED;
    }

    return {
      authorized: true,
      state: this.state,
      currentDailyTotal: LamportMath.toSol(currentDaily)
    };
  }

  /**
   * Commit a successfully executed transaction into the audit state.
   */
  commit(lamportsAmount, recipientAddress, txHash = '') {
    const amount = BigInt(lamportsAmount);
    this.transactionHistory.push({
      timestamp: Date.now(),
      lamports: amount,
      recipient: recipientAddress,
      txHash
    });
  }

  /**
   * Calculate total lamports spent in the last 24 hours.
   */
  getDailySpentLamports() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    return this.transactionHistory
      .filter(tx => tx.timestamp >= cutoff)
      .reduce((sum, tx) => sum + tx.lamports, 0n);
  }

  /**
   * Force trip the circuit breaker into locked state.
   */
  trip(reason) {
    this.state = STATES.TRIPPED_LOCKED;
    this.tripReason = reason;
    this.trippedAt = Date.now();
  }

  /**
   * Administrative override to unlock the circuit breaker.
   */
  unlock(token) {
    if (token !== this.adminToken) {
      throw new Error('CircuitBreakerSecurityError: Invalid administrative unlock token');
    }

    this.state = STATES.ARMED;
    this.tripReason = null;
    this.trippedAt = null;
    return { success: true, state: this.state };
  }
}

module.exports = { CircuitBreaker, STATES };
