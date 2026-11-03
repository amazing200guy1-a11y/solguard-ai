/**
 * SolGuard AI — Deterministic Lamport Arithmetic Engine
 * 
 * Enforces zero-float financial precision (CWE-682 prevention) on Solana.
 * 1 SOL = 1,000,000,000 Lamports (10^9).
 * All internal accounting is conducted strictly in native BigInt integers.
 */

const LAMPORTS_PER_SOL = 1000000000n;
const MAX_SAFE_LAMPORTS = 500000000000000000n; // 500M SOL

class LamportMath {
  /**
   * Convert SOL string/number to strict BigInt lamports without floating-point leakage.
   * @param {string|number} solValue 
   * @returns {bigint}
   */
  static toLamports(solValue) {
    if (solValue === undefined || solValue === null || solValue === '') {
      throw new Error('LamportMathError: Amount cannot be empty');
    }

    const str = String(solValue).trim();
    if (!/^\d+(\.\d{1,9})?$/.test(str)) {
      throw new Error(`LamportMathError: Invalid SOL amount format "${str}". Maximum 9 decimal places allowed.`);
    }

    const parts = str.split('.');
    const integerPart = BigInt(parts[0]);
    let fractionalPart = 0n;

    if (parts.length > 1) {
      const paddedFraction = parts[1].padEnd(9, '0');
      fractionalPart = BigInt(paddedFraction);
    }

    const totalLamports = (integerPart * LAMPORTS_PER_SOL) + fractionalPart;

    if (totalLamports <= 0n) {
      throw new Error('LamportMathError: Transaction amount must be strictly greater than zero');
    }

    if (totalLamports > MAX_SAFE_LAMPORTS) {
      throw new Error('LamportMathError: Transaction amount exceeds Solana max supply threshold');
    }

    return totalLamports;
  }

  /**
   * Convert BigInt lamports back to clean formatted SOL string.
   * @param {bigint|number|string} lamports 
   * @returns {string}
   */
  static toSol(lamports) {
    const l = BigInt(lamports);
    if (l < 0n) throw new Error('LamportMathError: Negative lamports invalid');

    const integerPart = l / LAMPORTS_PER_SOL;
    const remainder = l % LAMPORTS_PER_SOL;

    if (remainder === 0n) {
      return integerPart.toString();
    }

    const fractionStr = remainder.toString().padStart(9, '0').replace(/0+$/, '');
    return `${integerPart}.${fractionStr}`;
  }

  /**
   * Safe addition of two lamport amounts.
   */
  static add(a, b) {
    const res = BigInt(a) + BigInt(b);
    if (res < 0n) throw new Error('LamportMathError: Overflow detected');
    return res;
  }

  /**
   * Safe subtraction of two lamport amounts (fail-closed if negative).
   */
  static sub(a, b) {
    const biA = BigInt(a);
    const biB = BigInt(b);
    if (biB > biA) {
      throw new Error(`LamportMathError: Underflow detected. Available: ${biA}, Requested: ${biB}`);
    }
    return biA - biB;
  }
}

module.exports = { LamportMath, LAMPORTS_PER_SOL, MAX_SAFE_LAMPORTS };
