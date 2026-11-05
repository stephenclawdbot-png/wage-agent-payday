import { NextResponse } from "next/server";
import { fetchSolanaPaychecks } from "@/lib/solana";
import type { PaychecksResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { paychecks, errors, totalPaidTodayUsd } =
      await fetchSolanaPaychecks(4);

    const body: PaychecksResponse = {
      ok: true,
      generatedAt: new Date().toISOString(),
      source: "solana-public-rpc + curated x402 facilitator wallets",
      note:
        "$WAGE token is not deployed yet. Rows are real USDC settlements from public x402 facilitator wallets (never fabricated). Base/Blockscout ingestion is deferred until a free API key or non-gated RPC eth_getLogs path is available.",
      totalPaidTodayUsd: Number(totalPaidTodayUsd.toFixed(6)),
      paychecks,
      errors: errors.length ? errors : undefined,
      emptyReason:
        paychecks.length === 0
          ? errors.length
            ? "No paychecks parsed; RPC errors occurred (see errors)."
            : "Live feed waiting on recent facilitator USDC outflows, or public RPC returned no parsable token deltas."
          : undefined,
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    const body: PaychecksResponse = {
      ok: true,
      generatedAt: new Date().toISOString(),
      source: "solana-public-rpc",
      note: "Upstream fetch failed; returning empty list rather than fake data.",
      totalPaidTodayUsd: 0,
      paychecks: [],
      emptyReason: (e as Error).message,
      errors: [(e as Error).message],
    };
    return NextResponse.json(body, { status: 200 });
  }
}
