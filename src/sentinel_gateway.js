/**
 * SolGuard AI — Unified Zero-Trust Sentinel Gateway
 * 
 * Orchestrates Lamport arithmetic, prompt defense, circuit breaker state machine,
 * simulation pre-flight checks, and cryptographic SHA-256 audit sealing.
 */

const { LamportMath, LAMPORTS_PER_SOL } = require('./lamport_math');
const { PromptShield } = require('./prompt_shield');
const { CircuitBreaker, STATES } = require('./circuit_breaker');
const { SimulationEngine } = require('./simulation_engine');
const { AuditChain } = require('./audit_chain');

class SentinelGateway {
  constructor(options = {}) {
    this.circuitBreaker = new CircuitBreaker(options);
    this.auditChain = new AuditChain();
    this.safePayees = options.safePayees || [
      'GsbwXfJraMomNxBcg8eQp9e9m2Z9YkLzTq1W3e5R7t9u', // Trusted treasury
      'EscrowVault4444444444444444444444444444444444'   // Trusted escrow
    ];
  }

  /**
   * Complete Zero-Trust gatekeeper for agentic Solana transfers.
   * @param {object} params
   * @param {string|number} params.solAmount
   * @param {string} params.recipientAddress
   * @param {string} [params.agentIntent]
   * @param {string|number} [params.senderBalanceSol='10.0']
   * @returns {object} Execution receipt with cryptographic proof
   */
  processTransfer({ solAmount, recipientAddress, agentIntent = '', senderBalanceSol = '10.0' }) {
    // 1. Prompt Injection & Adversarial Intent Scanning
    const promptScan = PromptShield.scanPrompt(agentIntent);
    if (!promptScan.safe) {
      this.circuitBreaker.trip(`Adversarial prompt injection detected in agent tool call: [${promptScan.flags.join(', ')}]`);
      const block = this.auditChain.seal('PROMPT_INJECTION_INTERCEPTED', {
        action: 'BLOCK',
        flags: promptScan.flags,
        score: promptScan.score,
        agentIntent
      });
      return {
        authorized: false,
        status: 'INTERCEPTED_PROMPT_INJECTION',
        reason: `Adversarial prompt injection intercepted. Flags: ${promptScan.flags.join(', ')}`,
        circuitState: this.circuitBreaker.state,
        auditBlock: block
      };
    }

    // 2. Base58 Address Validation & Blacklist Check
    const addrCheck = PromptShield.validateAddress(recipientAddress);
    if (!addrCheck.valid) {
      const block = this.auditChain.seal('INVALID_ADDRESS_REJECTED', {
        recipientAddress,
        reason: addrCheck.reason
      });
      return {
        authorized: false,
        status: 'REJECTED_INVALID_ADDRESS',
        reason: addrCheck.reason,
        circuitState: this.circuitBreaker.state,
        auditBlock: block
      };
    }

    // 3. Lookalike / Vanity Address Poisoning Check
    const lookalikeCheck = PromptShield.checkLookalikePoisoning(recipientAddress, this.safePayees);
    if (lookalikeCheck.isLookalike) {
      this.circuitBreaker.trip(lookalikeCheck.reason);
      const block = this.auditChain.seal('ADDRESS_POISONING_INTERCEPTED', {
        recipientAddress,
        matchedSafe: lookalikeCheck.matchedSafe,
        reason: lookalikeCheck.reason
      });
      return {
        authorized: false,
        status: 'INTERCEPTED_ADDRESS_POISONING',
        reason: lookalikeCheck.reason,
        circuitState: this.circuitBreaker.state,
        auditBlock: block
      };
    }

    // 4. Strict Lamport Integer Parsing (Zero Float Drift)
    let lamportsAmount;
    let senderBalanceLamports;
    try {
      lamportsAmount = LamportMath.toLamports(solAmount);
      senderBalanceLamports = LamportMath.toLamports(senderBalanceSol);
    } catch (err) {
      const block = this.auditChain.seal('LAMPORT_ARITHMETIC_ERROR', {
        error: err.message,
        solAmount
      });
      return {
        authorized: false,
        status: 'REJECTED_ARITHMETIC_ERROR',
        reason: err.message,
        circuitState: this.circuitBreaker.state,
        auditBlock: block
      };
    }

    // 5. Autonomous Circuit Breaker Evaluation
    const cbEvaluation = this.circuitBreaker.evaluate(lamportsAmount, recipientAddress);
    if (!cbEvaluation.authorized) {
      const block = this.auditChain.seal('CIRCUIT_BREAKER_HALT', {
        circuitState: cbEvaluation.state,
        reason: cbEvaluation.reason,
        requestedLamports: lamportsAmount.toString(),
        recipientAddress
      });
      return {
        authorized: false,
        status: 'HALTED_BY_CIRCUIT_BREAKER',
        reason: cbEvaluation.reason,
        circuitState: cbEvaluation.state,
        auditBlock: block
      };
    }

    // 6. Pre-Flight Simulation & Balance Invariant Check
    const simResult = SimulationEngine.simulateTransfer({
      senderBalanceLamports,
      transferLamports: lamportsAmount
    });

    if (!simResult.valid) {
      const block = this.auditChain.seal('SIMULATION_REJECTED', {
        reason: simResult.reason,
        senderBalanceLamports: senderBalanceLamports.toString(),
        transferLamports: lamportsAmount.toString()
      });
      return {
        authorized: false,
        status: 'REJECTED_SIMULATION_FAILURE',
        reason: simResult.reason,
        circuitState: this.circuitBreaker.state,
        auditBlock: block
      };
    }

    // 7. Authorization & Cryptographic Receipt Generation
    this.circuitBreaker.commit(lamportsAmount, recipientAddress);
    const auditBlock = this.auditChain.seal('TRANSFER_AUTHORIZED', {
      lamports: lamportsAmount.toString(),
      sol: LamportMath.toSol(lamportsAmount),
      recipient: recipientAddress,
      feeLamports: simResult.feeLamports.toString(),
      remainingBalanceLamports: simResult.newBalanceLamports.toString(),
      remainingBalanceSol: LamportMath.toSol(simResult.newBalanceLamports)
    });

    return {
      authorized: true,
      status: 'TRANSACTION_AUTHORIZED',
      amountSol: LamportMath.toSol(lamportsAmount),
      lamports: lamportsAmount.toString(),
      recipient: recipientAddress,
      feeSol: LamportMath.toSol(simResult.feeLamports),
      newBalanceSol: LamportMath.toSol(simResult.newBalanceLamports),
      circuitState: this.circuitBreaker.state,
      auditBlock
    };
  }

  /**
   * Pre-flight DEX swap evaluation (e.g., Jupiter / Raydium)
   */
  processSwap({ fromToken, toToken, amount, slippageBps, agentIntent = '' }) {
    const promptScan = PromptShield.scanPrompt(agentIntent);
    if (!promptScan.safe) {
      this.circuitBreaker.trip(`Prompt injection detected in swap request: [${promptScan.flags.join(', ')}]`);
      const block = this.auditChain.seal('SWAP_PROMPT_INTERCEPTED', { flags: promptScan.flags });
      return { authorized: false, status: 'INTERCEPTED_PROMPT', reason: 'Adversarial intent in swap parameters', auditBlock: block };
    }

    const slippageCheck = SimulationEngine.evaluateSlippage(slippageBps);
    if (!slippageCheck.safe) {
      const block = this.auditChain.seal('EXCESSIVE_SLIPPAGE_BLOCKED', { slippageBps, reason: slippageCheck.reason });
      return { authorized: false, status: 'BLOCKED_SLIPPAGE_EXPLOIT', reason: slippageCheck.reason, auditBlock: block };
    }

    const block = this.auditChain.seal('SWAP_SIMULATION_APPROVED', {
      fromToken,
      toToken,
      amount,
      slippageBps
    });

    return {
      authorized: true,
      status: 'SWAP_APPROVED',
      fromToken,
      toToken,
      amount,
      slippageBps,
      auditBlock: block
    };
  }

  unlock(token) {
    const res = this.circuitBreaker.unlock(token);
    this.auditChain.seal('CIRCUIT_ADMIN_OVERRIDE', { state: res.state });
    return res;
  }

  getMetrics() {
    return {
      circuitState: this.circuitBreaker.state,
      dailySpentSol: LamportMath.toSol(this.circuitBreaker.getDailySpentLamports()),
      totalAuditBlocks: this.auditChain.chain.length,
      chainIntegrity: this.auditChain.verifyChain().valid
    };
  }
}

module.exports = { SentinelGateway };
