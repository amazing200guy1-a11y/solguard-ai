/**
 * SolGuard AI — Model Context Protocol (MCP) Server
 * 
 * Standard JSON-RPC 2.0 interface exposing SolGuard zero-trust tools
 * for autonomous AI agents (Claude Desktop, Cursor, ElizaOS, LangChain).
 */

const { SentinelGateway } = require('./sentinel_gateway');

class SolGuardMCPServer {
  constructor(gateway = null) {
    this.gateway = gateway || new SentinelGateway();
  }

  getToolDefinitions() {
    return [
      {
        name: 'solana_guarded_transfer',
        description: 'Execute an authorized SOL transfer with zero-trust circuit-breaker, anti-drain, and address poisoning protection.',
        inputSchema: {
          type: 'object',
          properties: {
            solAmount: { type: 'string', description: 'Amount of SOL to transfer (e.g. "0.5")' },
            recipientAddress: { type: 'string', description: 'Solana Base58 public key' },
            agentIntent: { type: 'string', description: 'Natural language agent purpose/intent' },
            senderBalanceSol: { type: 'string', description: 'Current sender balance in SOL (e.g. "10.0")' }
          },
          required: ['solAmount', 'recipientAddress']
        }
      },
      {
        name: 'solana_simulate_swap',
        description: 'Simulate a DEX swap (e.g. Jupiter/Raydium) with strict slippage and anti-sandwich protection.',
        inputSchema: {
          type: 'object',
          properties: {
            fromToken: { type: 'string', description: 'Mint address of input token' },
            toToken: { type: 'string', description: 'Mint address of output token' },
            amount: { type: 'string', description: 'Input amount' },
            slippageBps: { type: 'number', description: 'Slippage tolerance in basis points (max 100 bps = 1.0%)' }
          },
          required: ['fromToken', 'toToken', 'amount', 'slippageBps']
        }
      },
      {
        name: 'solana_check_circuit_health',
        description: 'Inspect the autonomous circuit breaker status, daily spending velocity, and limits.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'solana_verify_audit_ledger',
        description: 'Cryptographically verify the SHA-256 parent-hashed audit ledger from genesis block to head.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  handleJsonRpc(request) {
    if (!request || request.jsonrpc !== '2.0') {
      return { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: request ? request.id : null };
    }

    const { method, params, id } = request;

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        result: { tools: this.getToolDefinitions() },
        id
      };
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};

      switch (name) {
        case 'solana_guarded_transfer': {
          const res = this.gateway.processTransfer(args || {});
          return { jsonrpc: '2.0', result: res, id };
        }
        case 'solana_simulate_swap': {
          const res = this.gateway.processSwap(args || {});
          return { jsonrpc: '2.0', result: res, id };
        }
        case 'solana_check_circuit_health': {
          const metrics = this.gateway.getMetrics();
          return { jsonrpc: '2.0', result: metrics, id };
        }
        case 'solana_verify_audit_ledger': {
          const check = this.gateway.auditChain.verifyChain();
          return { jsonrpc: '2.0', result: check, id };
        }
        default:
          return { jsonrpc: '2.0', error: { code: -32601, message: `Tool not found: ${name}` }, id };
      }
    }

    return { jsonrpc: '2.0', error: { code: -32601, message: `Method not found: ${method}` }, id };
  }
}

module.exports = { SolGuardMCPServer };
