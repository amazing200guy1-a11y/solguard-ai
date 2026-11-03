# SolGuard AI — Submission Proposal Package
**Hackathons**: Encode Club Solana Hackathon 2026 & UBC Agentic Payments Track ($23,000+)  
**Repository**: https://github.com/amazing200guy1-a11y/solguard-ai  
**Live Interactive Cockpit**: https://amazing200guy1-a11y.github.io/solguard-ai/dashboard.html  

---

## 1. Quick Metadata

- **Project Title**: `SolGuard AI — Zero-Trust Financial Sentinel & Autonomous Spending Circuit-Breaker for Solana AI Agents`
- **Tagline / Elevator Pitch**:
  > Autonomous zero-trust financial circuit-breaker & Model Context Protocol (MCP) sentinel for Solana AI agents with lamport-precision invariants and SHA-256 audit trails.
- **Target Tracks**:
  - Agentic Payments (Autonomous AI Agents + On-Chain Wallets)
  - Security, Infrastructure & Tooling
  - Best Student Project (Usman Bamidele — 100L Mathematics, FUNAAB, Nigeria)
- **Built With Tags**:
  `solana, javascript, nodejs, mcp, model-context-protocol, zero-trust, cybersecurity, lamports, sha-256, elizaos, agentic-payments`

---

## 2. Devpost Story / Proposal

### 💡 Inspiration
As autonomous AI agents (built on Claude, LangChain, ElizaOS, or AutoGPT) are increasingly entrusted with private keypairs on Solana to execute automated DEX swaps, micro-settlements, and prediction bets, traditional web3 wallet models collapse. Standard wallets are built for human hesitation—a human inspects an approval popup. Autonomous agents execute in milliseconds.

When connected to digital assets, agents face fatal failure modes:
1. **Recursive Rate-Limit Drain**: When an RPC node times out or rate-limits, an agent loops in automated retries, draining wallet balances and transaction fees.
2. **Prompt Injection & Address Poisoning**: Poisoned browsing contexts or malicious tool arguments trick agents into signing transfers to vanity drainer addresses mimicking trusted payees.
3. **Floating-Point Lamport Drift (CWE-682)**: Naive float arithmetic (`0.1 + 0.2`) leads to fractional drift and order deserialization failures.
4. **MEV Sandwich Vulnerabilities**: Unbounded slippage tolerances allow searchers to frontrun agentic DEX swaps.

We built **SolGuard AI** to give developers an institutional, fail-closed financial sentinel and autonomous circuit-breaker standing between autonomous agents and the Solana network.

---

### 🛡️ What It Does
SolGuard AI operates as an ultra-fast gatekeeper prior to instruction signing:

1. **Strict Lamport Integer Invariant**: Enforces exact minor-unit accounting using native `BigInt` (1 SOL = 1,000,000,000 lamports), eliminating floating-point rounding leakage.
2. **Adversarial Prompt & Poisoning Shield**:
   - Detects lookalike vanity address spoofing (matching 4-prefix and 4-suffix collisions).
   - Neutralizes prompt injection attempts (`"ignore previous"`, `"drain treasury"`).
3. **Autonomous Circuit Breaker State Machine**:
   - Caps single transactions at 5.0 SOL and daily volume at 25.0 SOL.
   - Throttles rapid runaway loops (>3 txs/min).
   - Implements fail-closed lockdown (`TRIPPED_LOCKED`) upon attack detection, requiring cryptographic administrative tokens to reset.
4. **Pre-Flight Simulation & Slippage Guard**:
   - Guarantees rent-exempt reserve integrity (>0.00089 SOL).
   - Blocks DEX swaps with slippage > 100 bps (1.0%) to prevent MEV sandwich attacks.
5. **Tamper-Evident SHA-256 Audit Ledger**: Seals every transaction, simulation, and circuit trip into a parent-linked cryptographic block ledger.
6. **Native Model Context Protocol (MCP) Server**: Exposes 4 standardized JSON-RPC 2.0 tools for instant integration into Claude Desktop, Cursor, or ElizaOS agents.

---

### ⚙️ How We Built It
- **Zero-Dependency Pure Node.js Runtime**: Engineered strictly with native Node.js libraries (`node:crypto`, `node:assert`, `node:http`) to ensure zero supply-chain risk and blazing execution.
- **Microsecond Deterministic Architecture**: Achieves an average latency of **0.026 milliseconds** (>38,000 operations per second).
- **Aerospace Titanium Cockpit**: A reactive dark-mode cockpit featuring interactive attack simulations (Address Poisoning, Adversarial Jailbreaks, Cap Breaches, and DEX Slippage tests).

---

### 🧪 Automated Test Suite (24/24 PASS — 100%)
- Lamport conversion and underflow bounds (4 tests)
- Base58 address validation and lookalike vanity poisoning detection (4 tests)
- Adversarial prompt injection and credential exfiltration blocking (3 tests)
- Circuit breaker velocity and single/daily cap enforcement (4 tests)
- Pre-flight simulation and rent-exempt reserve verification (2 tests)
- Cryptographic SHA-256 ledger integrity and tampering detection (2 tests)
- Unified Sentinel Gateway integration (2 tests)
- Model Context Protocol (MCP) JSON-RPC reflection and tool calling (2 tests)
- Performance latency benchmark under 1.0ms (1 test)

---

### 🏆 Accomplishments We're Proud Of
- **0.026ms Benchmark**: Blazing-fast evaluation that adds zero perceptible latency to agent execution loops.
- **Zero Third-Party Dependencies**: Pure mathematical modeling and native crypto without fragile npm packages.
- **Complete End-to-End Weapon**: Working code, live interactive dashboard, MCP server, and 100% test coverage.

---

### 🚀 What's Next for SolGuard AI
- Native Solana program deployment on devnet/mainnet with on-chain PDA circuit breaker state locks.
- Direct plugin integration with the **ElizaOS** agent framework and Solana Agent Kit.
- Real-time Telegram/Discord webhook alerts when an autonomous agent trips the circuit breaker.
