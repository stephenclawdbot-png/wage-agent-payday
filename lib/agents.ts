/**
 * Curated, publicly documented x402 facilitator / settlement wallets.
 * Sources are cited so every paycheck row can be audited.
 * These are NOT "agent identities" — they are settlement senders.
 * A paycheck = USDC leaving a facilitator to a counterparty wallet.
 *
 * Token $WAGE is NOT deployed. Do not add a mint here until CA exists.
 */

export type TrackedWallet = {
  id: string;
  label: string;
  chain: "solana" | "base";
  address: string;
  role: "x402_facilitator";
  sourceUrl: string;
};

/** Solana USDC mint (Circle) */
export const SOLANA_USDC_MINT =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/** Base USDC (Circle) — for future Base eth_getLogs ingestion */
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

/**
 * Addresses taken from public x402scan facilitator configs
 * (Merit-Systems/x402scan) and facilitator /supported endpoints.
 */
export const TRACKED_WALLETS: TrackedWallet[] = [
  {
    id: "payai-sol",
    label: "PayAI x402 facilitator (Solana)",
    chain: "solana",
    address: "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4",
    role: "x402_facilitator",
    sourceUrl:
      "https://github.com/Merit-Systems/x402scan/blob/main/packages/external/facilitators/src/facilitators/payai.ts",
  },
  {
    id: "dexter-sol",
    label: "Dexter x402 facilitator (Solana)",
    chain: "solana",
    address: "DEXVS3su4dZQWTvvPnLDJLRK1CeeKG6K3QqdzthgAkNV",
    role: "x402_facilitator",
    sourceUrl:
      "https://github.com/Merit-Systems/x402scan/blob/main/packages/external/facilitators/src/facilitators/dexter.ts",
  },
  {
    id: "daydreams-sol",
    label: "Daydreams x402 facilitator (Solana, deprecated)",
    chain: "solana",
    address: "DuQ4jFMmVABWGxabYHFkGzdyeJgS1hp4wrRuCtsJgT9a",
    role: "x402_facilitator",
    sourceUrl:
      "https://github.com/Merit-Systems/x402scan/blob/main/packages/external/facilitators/src/facilitators/daydreams.ts",
  },
];

/** Base facilitators reserved for Phase 1.5 once a free indexer key exists */
export const BASE_FACILITATORS_PENDING: TrackedWallet[] = [
  {
    id: "daydreams-base",
    label: "Daydreams x402 facilitator (Base)",
    chain: "base",
    address: "0x279e08f711182c79Ba6d09669127a426228a4653",
    role: "x402_facilitator",
    sourceUrl:
      "https://github.com/Merit-Systems/x402scan/blob/main/packages/external/facilitators/src/facilitators/daydreams.ts",
  },
  {
    id: "coinbase-x402-8",
    label: "Coinbase x402 Facilitator 8 (Base)",
    chain: "base",
    address: "0x9c09faa49c4235a09677159ff14f17498ac48738",
    role: "x402_facilitator",
    sourceUrl: "https://satohub.ai/x402/facilitators",
  },
];
