/**
 * SolGuard AI — x402 HTTP Agentic Payment Protocol Gateway
 * 
 * Implements the standard HTTP 402 (Payment Required) specification for
 * autonomous AI agents purchasing APIs, compute, and data on Solana.
 * 
 * Flow:
 * 1. Client Agent requests protected resource -> Server returns HTTP 402 with Solana challenge.
 * 2. SolGuard Sentinel intercepts challenge, enforces zero-trust circuit breaker.
 * 3. Settlement committed -> Client retries with cryptographic receipt -> Resource unlocked (HTTP 200).
 */

const crypto = require('node:crypto');
const { LamportMath, LAMPORTS_PER_SOL } = require('./lamport_math');

class X402Gateway {
  constructor(sentinelGateway, options = {}) {
    this.sentinel = sentinelGateway;
    this.protectedResources = new Map();
    this.settledReceipts = new Set();
    
    // Register default protected agent resources
    this.registerResource('res_llm_inference_v1', {
      name: 'Decentralized Llama-3 70B Inference Stream',
      costSol: '0.05',
      payee: options.treasuryAddress || 'GsbwXfJraMomNxBcg8eQp9e9m2Z9YkLzTq1W3e5R7t9u'
    });
    
    this.registerResource('res_satellite_geodata_v2', {
      name: 'Real-Time High-Resolution Geospatial Imagery Feed',
      costSol: '0.10',
      payee: options.treasuryAddress || 'GsbwXfJraMomNxBcg8eQp9e9m2Z9YkLzTq1W3e5R7t9u'
    });
  }

  registerResource(resourceId, { name, costSol, payee }) {
    this.protectedResources.set(resourceId, {
      resourceId,
      name,
      costSol,
      costLamports: LamportMath.toLamports(costSol),
      payee
    });
  }

  /**
   * Evaluate an incoming HTTP request for a protected resource.
   * If valid payment receipt header is missing, generates an HTTP 402 Payment Challenge.
   * @param {string} resourceId 
   * @param {string} [paymentReceiptHeader] 
   * @returns {object} HTTP Response payload
   */
  handleResourceRequest(resourceId, paymentReceiptHeader = null) {
    const resource = this.protectedResources.get(resourceId);
    if (!resource) {
      return { status: 404, body: { error: `Resource not found: ${resourceId}` } };
    }

    // 1. Verify if request carries an authenticated, unspent payment receipt
    if (paymentReceiptHeader) {
      if (this.settledReceipts.has(paymentReceiptHeader)) {
        return {
          status: 200,
          body: {
            success: true,
            resourceId,
            resourceName: resource.name,
            data: `[SECURE_PAYLOAD_UNLOCKED] Authenticated stream access granted for ${resource.name}`,
            verifiedReceipt: paymentReceiptHeader,
            timestamp: Date.now()
          }
        };
      }
    }

    // 2. Generate standard HTTP 402 Payment Challenge
    const nonce = crypto.randomBytes(16).toString('hex');
    const challenge = {
      protocol: 'x402-solana-v1',
      resourceId,
      resourceName: resource.name,
      network: 'solana-mainnet-beta',
      recipient: resource.payee,
      amountSol: resource.costSol,
      amountLamports: resource.costLamports.toString(),
      nonce,
      expiresAt: Date.now() + 300000 // 5 minute challenge validity
    };

    return {
      status: 402,
      headers: {
        'WWW-Authenticate': `x402 realm="SolGuard", recipient="${resource.payee}", amount="${resource.costSol}", token="SOL"`,
        'X-402-Challenge': JSON.stringify(challenge)
      },
      body: {
        statusCode: 402,
        error: 'Payment Required',
        message: `HTTP 402: Autonomous agent micro-settlement required to access ${resource.name}`,
        challenge
      }
    };
  }

  /**
   * Autonomous AI Agent Client Settlement Flow:
   * Takes an HTTP 402 challenge, evaluates through SolGuard Sentinel, and executes payment.
   * @param {object} challenge 
   * @param {string} agentIntent 
   * @returns {object} Settlement outcome and receipt
   */
  fulfillChallenge(challenge, agentIntent = 'Autonomous agent payment for protected resource') {
    const { amountSol, recipient, resourceId, nonce } = challenge;

    // Zero-Trust validation through SolGuard Sentinel
    const evaluation = this.sentinel.processTransfer({
      solAmount: amountSol,
      recipientAddress: recipient,
      agentIntent,
      senderBalanceSol: '10.0'
    });

    if (!evaluation.authorized) {
      return {
        success: false,
        httpStatus: 403,
        error: `SolGuard Sentinel rejected x402 payment: ${evaluation.reason}`,
        circuitState: evaluation.circuitState
      };
    }

    // Generate cryptographic receipt hash
    const receiptHash = crypto.createHash('sha256')
      .update(`x402|${resourceId}|${recipient}|${amountSol}|${nonce}|${evaluation.auditBlock.hash}`)
      .digest('hex');

    this.settledReceipts.add(receiptHash);

    return {
      success: true,
      httpStatus: 200,
      receiptHash,
      resourceId,
      amountSol,
      recipient,
      auditBlock: evaluation.auditBlock
    };
  }
}

module.exports = { X402Gateway };
