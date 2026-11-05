# Agent Payday ($WAGE)

Public **AI agent paycheck** ticker for the upcoming Solana pump.fun memecoin **$WAGE**.

> **Token is not deployed.** This repo must never deploy a token, hold keys, or move funds.

## What you get

- Landing page: **Agent Payday** with a live ticker (or an honest **“Live feed coming”** empty state)
- `GET /api/paychecks` — real USDC settlements from curated public **x402 facilitator** wallets on Solana (parsed via public RPC)
- Every row links to Solscan
- Architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Optional env: see `.env.example`.

## Data policy

- **Never fake rows.** If RPC fails or nothing parses, return `[]`.
- Facilitator addresses are cited in `lib/agents.ts`.
- Base / Blockscout ingestion is deferred: public Blockscout currently requires API key or x402 payment.

## Deploy

Linked to Vercel (team `meowdotfun`). Production deploys from `main`.

## License

MIT — do whatever, just don’t lie about the feed.
