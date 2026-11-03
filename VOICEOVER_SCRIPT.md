# SolGuard AI — Demo Video Voiceover Script

**Duration**: ~1 minute 45 seconds (~225 words at 130 WPM)  
**Presenter**: Usman Bamidele (100L Mathematics, FUNAAB, Nigeria)  
**Interactive Cockpit URL**: `https://amazing200guy1-a11y.github.io/solguard-ai/dashboard.html`

---

## Plain-Text Voiceover (Ready for AI Voice Generator)

```text
Hi everyone. I am Usman Bamidele, a mathematics student at the Federal University of Agriculture, Abeokuta. As autonomous AI agents gain access to Solana private keys to execute automated payments and DEX swaps, standard web3 wallets fail. Traditional wallets are designed for human hesitation. When an AI agent encounters a network timeout or prompt injection, it can drain an entire wallet in seconds through recursive looping or poisoned vanity addresses. That is why I built SolGuard AI, a zero-trust financial sentinel and autonomous spending circuit breaker for Solana AI agents. On our live cockpit, let us execute a clean payment of zero point five SOL for decentralized GPU compute. The sentinel calculates exact integer lamports, verifies the recipient, and authorizes the transaction in under zero point one milliseconds. Now, let us simulate an address poisoning attack where an attacker crafts a vanity address mimicking our trusted treasury's prefix and suffix. SolGuard immediately detects the lookalike collision, halts execution, and trips the circuit breaker to locked. When an agent attempts an adversarial prompt injection or breaches our five SOL single transaction cap, SolGuard fails closed and blocks the transfer. On the DEX Slippage tab, SolGuard enforces a strict one percent slippage boundary to prevent MEV searchers from sandwiching our agent's swaps. Every action is permanently sealed into an immutable SHA-256 audit ledger. With twenty-four passing tests, an average latency of zero point zero two six milliseconds, and native Model Context Protocol support, SolGuard AI provides true institutional protection for autonomous commerce. Thank you.
```

---

## Visual Click & Demonstration Guide

| Timestamp | Spoken Words | Mouse Action on Dashboard |
|---|---|---|
| **0:00 – 0:25** | *"Hi everyone. I am Usman Bamidele... standard web3 wallets fail."* | Show cockpit header, top pills, and metric strip (ARMED, 0.250 SOL). |
| **0:25 – 0:45** | *"On our live cockpit, let us execute a clean payment... under 0.1 milliseconds."* | Click **Clean Agent Transfer** preset → Click **EVALUATE & SIGN TRANSACTION** → Show green `TRANSACTION_AUTHORIZED` receipt. |
| **0:45 – 1:05** | *"Now, let us simulate an address poisoning attack... trips the circuit breaker to locked."* | Click **Address Poisoning Attack** preset → Click **EVALUATE & SIGN TRANSACTION** → Show red `TRIPPED_LOCKED` badge and poisoning alert. |
| **1:05 – 1:20** | *"When an agent attempts an adversarial prompt injection... SolGuard fails closed."* | Click **Adversarial Jailbreak** preset → Show `INTERCEPTED_PROMPT_INJECTION`. Click **ADMIN RESET** to restore `ARMED`. |
| **1:20 – 1:35** | *"On the DEX Slippage tab, SolGuard enforces a strict 1% slippage boundary..."* | Click **DEX Slippage & MEV Guard** tab → Change slippage to `150` → Click **EVALUATE SWAP SAFETY** → Show red `BLOCKED`. |
| **1:35 – 1:45** | *"Every action is permanently sealed into an immutable SHA-256 audit ledger... 24 passing tests."* | Click **SHA-256 Audit Ledger** tab → Scroll down through parent-linked cryptographic blocks. |
