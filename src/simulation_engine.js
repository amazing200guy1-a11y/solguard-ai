/**
 * SolGuard AI — Pre-Flight Simulation & Slippage Sentinel
 * 
 * Verifies transaction invariants prior to on-chain signing:
 * - Minimum reserve invariant (prevents emptying rent-exempt reserve)
 * - Maximum slippage guard on DEX swaps (anti-MEV sandwich protection)
 * - Deterministic balance delta accounting
 */

const { LamportMath, LAMPORTS_PER_SOL } = require('./lamport_math');

const BASE_TRANSACTION_FEE = 5000n; // 5000 lamports standard Solana tx fee
const MIN_RENT_EXEMPT_RESERVE = 890880n; // ~0.00089 SOL rent-exempt minimum for basic account
const MAX_ALLOWED_SLIPPAGE_BPS = 100; // 1.00% max slippage (100 basis points)

class SimulationEngine {
  /**
   * Pre-flight simulation for SOL transfers.
   * @param {object} params
   * @param {bigint} params.senderBalanceLamports
   * @param {bigint} params.transferLamports
   * @returns {{ valid: boolean, feeLamports: bigint, newBalanceLamports: bigint, reason?: string }}
   */
  static simulateTransfer({ senderBalanceLamports, transferLamports }) {
    const balance = BigInt(senderBalanceLamports);
    const amount = BigInt(transferLamports);
    const totalRequired = amount + BASE_TRANSACTION_FEE;

    if (balance < totalRequired) {
      return {
        valid: false,
        feeLamports: BASE_TRANSACTION_FEE,
        newBalanceLamports: balance,
        reason: `Insufficient balance for transfer + fee. Available: ${LamportMath.toSol(balance)} SOL, Required: ${LamportMath.toSol(totalRequired)} SOL`
      };
    }

    const remaining = balance - totalRequired;
    if (remaining < MIN_RENT_EXEMPT_RESERVE) {
      return {
        valid: false,
        feeLamports: BASE_TRANSACTION_FEE,
        newBalanceLamports: remaining,
        reason: `Transaction violates rent-exempt reserve invariant. Remaining ${LamportMath.toSol(remaining)} SOL is below minimum rent reserve (${LamportMath.toSol(MIN_RENT_EXEMPT_RESERVE)} SOL).`
      };
    }

    return {
      valid: true,
      feeLamports: BASE_TRANSACTION_FEE,
      newBalanceLamports: remaining
    };
  }

  /**
   * Evaluate slippage for agentic swaps (e.g. Jupiter/Raydium).
   * Prevents agents from getting frontrun or MEV-sandwiched.
   * @param {number} slippageBps - Slippage in basis points (1% = 100 bps)
   * @returns {{ safe: boolean, slippageBps: number, reason?: string }}
   */
  static evaluateSlippage(slippageBps) {
    if (typeof slippageBps !== 'number' || isNaN(slippageBps) || slippageBps < 0) {
      return { safe: false, slippageBps: 0, reason: 'Invalid slippage basis points parameter' };
    }

    if (slippageBps > MAX_ALLOWED_SLIPPAGE_BPS) {
      return {
        safe: false,
        slippageBps,
        reason: `Slippage tolerance of ${slippageBps / 100}% (${slippageBps} bps) exceeds SolGuard maximum safety threshold of ${MAX_ALLOWED_SLIPPAGE_BPS / 100}% (100 bps). High risk of MEV sandwich drain.`
      };
    }

    return {
      safe: true,
      slippageBps
    };
  }
}

module.exports = {
  SimulationEngine,
  BASE_TRANSACTION_FEE,
  MIN_RENT_EXEMPT_RESERVE,
  MAX_ALLOWED_SLIPPAGE_BPS
};
