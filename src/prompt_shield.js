/**
 * SolGuard AI — Adversarial Prompt Injection & Address Poisoning Shield
 * 
 * Intercepts adversarial jailbreak vectors in AI agent tool calls and
 * detects Base58 address spoofing / lookalike poisoning on Solana.
 */

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Known high-risk drainer sinks & blacklisted addresses
const BLACKLISTED_SINKS = new Set([
  '11111111111111111111111111111111', // System program (cannot be a user transfer target)
  'So11111111111111111111111111111111111111112', // Wrapped SOL native mint
  'DrainerSink1111111111111111111111111111111111',
  'FakeRaydiumPoolSink111111111111111111111111111',
  'AttackDrainerV2PoolSink11111111111111111111111'
]);

// Jailbreak / prompt injection patterns targeting autonomous financial agents
const ADVERSARIAL_PATTERNS = [
  { pattern: /ignore\s+(all\s+)?(previous|prior)\s+instructions/i, name: 'SYSTEM_PROMPT_OVERRIDE', weight: 40 },
  { pattern: /override\s+(spending\s+)?(limit|circuit|cap|guard)/i, name: 'CIRCUIT_BREAKER_BYPASS', weight: 45 },
  { pattern: /drain\s+(entire\s+)?(wallet|treasury|balance|account)/i, name: 'DRAIN_ATTEMPT', weight: 50 },
  { pattern: /transfer\s+all\s+(funds|sol|usdc|tokens)/i, name: 'MAX_TRANSFER_EXPLOIT', weight: 40 },
  { pattern: /emergency\s+admin\s+payout/i, name: 'SOCIAL_ENGINEERING_EXPLOIT', weight: 35 },
  { pattern: /(export|reveal|dump|print)\s+(private|secret|seed|keypair)/i, name: 'CREDENTIAL_EXFILTRATION', weight: 50 },
  { pattern: /base64\s*:\s*[A-Za-z0-9+/=]{40,}/i, name: 'OBFUSCATED_PAYLOAD', weight: 30 }
];

class PromptShield {
  /**
   * Validate a Solana Base58 public key format and verify not a blacklisted sink.
   * @param {string} address 
   * @returns {{ valid: boolean, reason?: string }}
   */
  static validateAddress(address) {
    if (!address || typeof address !== 'string') {
      return { valid: false, reason: 'Address must be a non-empty string' };
    }

    const cleanAddr = address.trim();

    if (!BASE58_REGEX.test(cleanAddr)) {
      return { valid: false, reason: 'Invalid Base58 public key format (32-44 characters, no 0, O, I, l)' };
    }

    if (BLACKLISTED_SINKS.has(cleanAddr)) {
      return { valid: false, reason: `Recipient address is a blacklisted sink or protected system account: ${cleanAddr}` };
    }

    return { valid: true };
  }

  /**
   * Check for address poisoning / lookalike spoofing against known safe payees.
   * Attackers generate vanity addresses with identical 4 prefix and 4 suffix chars.
   * @param {string} candidateAddress 
   * @param {string[]} safePayees 
   * @returns {{ isLookalike: boolean, matchedSafe?: string }}
   */
  static checkLookalikePoisoning(candidateAddress, safePayees = []) {
    if (!safePayees || safePayees.length === 0) return { isLookalike: false };

    const cand = candidateAddress.trim();
    if (cand.length < 8) return { isLookalike: false };

    const candPrefix = cand.substring(0, 4);
    const candSuffix = cand.substring(cand.length - 4);

    for (const safe of safePayees) {
      if (safe === cand) continue; // Exact safe match is allowed
      if (safe.length < 8) continue;

      const safePrefix = safe.substring(0, 4);
      const safeSuffix = safe.substring(safe.length - 4);

      if (candPrefix === safePrefix && candSuffix === safeSuffix) {
        return {
          isLookalike: true,
          matchedSafe: safe,
          reason: `Poisoned lookalike address detected! Matches prefix "${candPrefix}" and suffix "${candSuffix}" of trusted payee but differs internally.`
        };
      }
    }

    return { isLookalike: false };
  }

  /**
   * Scan natural language intent and tool arguments for prompt injection vectors.
   * @param {string} text 
   * @returns {{ safe: boolean, score: number, flags: string[], action: 'ALLOW' | 'BLOCK' }}
   */
  static scanPrompt(text) {
    if (!text || typeof text !== 'string') {
      return { safe: true, score: 0, flags: [], action: 'ALLOW' };
    }

    let totalScore = 0;
    const flags = [];

    for (const rule of ADVERSARIAL_PATTERNS) {
      if (rule.pattern.test(text)) {
        totalScore += rule.weight;
        flags.push(rule.name);
      }
    }

    const safe = totalScore < 35;
    return {
      safe,
      score: totalScore,
      flags,
      action: safe ? 'ALLOW' : 'BLOCK'
    };
  }
}

module.exports = { PromptShield, ADVERSARIAL_PATTERNS, BLACKLISTED_SINKS };
