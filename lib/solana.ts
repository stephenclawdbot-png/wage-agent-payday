import {
  SOLANA_USDC_MINT,
  TRACKED_WALLETS,
  type TrackedWallet,
} from "./agents";
import type { Paycheck } from "./types";

const DEFAULT_RPC =
  process.env.SOLANA_RPC_URL?.trim() ||
  "https://api.mainnet-beta.solana.com";

/** Keep MVP light on public RPC — PayAI is the most active Solana facilitator. */
const DEFAULT_WALLET_IDS = (
  process.env.PAYCHECK_WALLET_IDS || "payai-sol"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

type RpcResult<T> = { result?: T; error?: { message?: string } };

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function solanaRpc<T>(
  method: string,
  params: unknown[],
  rpcUrl = DEFAULT_RPC,
  attempt = 0
): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (res.status === 429 && attempt < 3) {
    await sleep(400 * (attempt + 1));
    return solanaRpc<T>(method, params, rpcUrl, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Solana RPC HTTP ${res.status}`);
  }
  const json = (await res.json()) as RpcResult<T>;
  if (json.error) {
    throw new Error(json.error.message || "Solana RPC error");
  }
  return json.result as T;
}

type SignatureInfo = {
  signature: string;
  blockTime: number | null;
  err: unknown;
};

type TokenBalance = {
  mint: string;
  owner?: string;
  accountIndex: number;
  uiTokenAmount?: { uiAmount: number | null; decimals: number };
};

type AccountKey = string | { pubkey: string; signer?: boolean; writable?: boolean };

type ParsedTx = {
  meta: {
    err: unknown;
    preTokenBalances?: TokenBalance[];
    postTokenBalances?: TokenBalance[];
  } | null;
  transaction: {
    message: {
      accountKeys?: AccountKey[];
    };
  };
  blockTime?: number | null;
} | null;

function explorerTx(sig: string) {
  return `https://solscan.io/tx/${sig}`;
}

function startOfUtcDaySeconds(now = Date.now()) {
  const d = new Date(now);
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000
  );
}

function pubkeyOf(k: AccountKey): string {
  return typeof k === "string" ? k : k.pubkey;
}

function amountByOwner(rows: TokenBalance[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.mint !== SOLANA_USDC_MINT || !row.owner) continue;
    const amt = row.uiTokenAmount?.uiAmount ?? 0;
    map.set(row.owner, (map.get(row.owner) || 0) + (amt || 0));
  }
  return map;
}

/**
 * x402 facilitators often sign as fee payer while USDC moves between a
 * treasury/ATA owner and the recipient. Attribute the settlement to the
 * tracked facilitator when it appears in the account keys.
 */
function extractPaychecksFromTx(
  wallet: TrackedWallet,
  signature: string,
  blockTime: number | null,
  tx: ParsedTx
): Paycheck[] {
  if (!tx?.meta || tx.meta.err) return [];

  const keys = (tx.transaction?.message?.accountKeys || []).map(pubkeyOf);
  if (!keys.includes(wallet.address)) return [];

  const before = amountByOwner(tx.meta.preTokenBalances || []);
  const after = amountByOwner(tx.meta.postTokenBalances || []);
  const owners = new Set([...before.keys(), ...after.keys()]);

  const senders: { owner: string; amount: number }[] = [];
  const receivers: { owner: string; amount: number }[] = [];
  for (const owner of owners) {
    const delta = (after.get(owner) || 0) - (before.get(owner) || 0);
    if (delta < -0.0000001) senders.push({ owner, amount: -delta });
    if (delta > 0.0000001) receivers.push({ owner, amount: delta });
  }
  if (!senders.length || !receivers.length) return [];

  const out: Paycheck[] = [];
  for (const recv of receivers) {
    // Prefer a sender with matching amount; else first sender
    const matched =
      senders.find((s) => Math.abs(s.amount - recv.amount) < 0.000001) ||
      senders[0];
    out.push({
      id: `${signature}:${recv.owner}`,
      chain: "solana",
      txHash: signature,
      explorerUrl: explorerTx(signature),
      timestamp: blockTime,
      timestampIso: blockTime
        ? new Date(blockTime * 1000).toISOString()
        : null,
      from: matched.owner,
      to: recv.owner,
      amount: Number(recv.amount.toFixed(6)),
      symbol: "USDC",
      mintOrToken: SOLANA_USDC_MINT,
      facilitatorId: wallet.id,
      facilitatorLabel: wallet.label,
      sourceNote: `Facilitator ${wallet.address} signed/appeared in tx; USDC delta parsed from public RPC. Source: ${wallet.sourceUrl}`,
    });
  }
  return out;
}

export async function fetchSolanaPaychecks(limitPerWallet = 4): Promise<{
  paychecks: Paycheck[];
  errors: string[];
  totalPaidTodayUsd: number;
}> {
  const errors: string[] = [];
  const paychecks: Paycheck[] = [];
  const dayStart = startOfUtcDaySeconds();

  const wallets = TRACKED_WALLETS.filter(
    (w) => w.chain === "solana" && DEFAULT_WALLET_IDS.includes(w.id)
  );

  for (const wallet of wallets) {
    try {
      const sigs = await solanaRpc<SignatureInfo[]>("getSignaturesForAddress", [
        wallet.address,
        { limit: limitPerWallet },
      ]);
      for (const s of sigs || []) {
        if (s.err) continue;
        try {
          await sleep(150);
          const tx = await solanaRpc<ParsedTx>("getTransaction", [
            s.signature,
            { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
          ]);
          paychecks.push(
            ...extractPaychecksFromTx(wallet, s.signature, s.blockTime, tx)
          );
        } catch (e) {
          errors.push(
            `${wallet.id} tx ${s.signature.slice(0, 8)}…: ${(e as Error).message}`
          );
        }
      }
    } catch (e) {
      errors.push(`${wallet.id}: ${(e as Error).message}`);
    }
  }

  paychecks.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const totalPaidTodayUsd = paychecks
    .filter((p) => (p.timestamp || 0) >= dayStart)
    .reduce((sum, p) => sum + p.amount, 0);

  return { paychecks, errors, totalPaidTodayUsd };
}
