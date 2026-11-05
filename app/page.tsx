import type { PaychecksResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadPaychecks(): Promise<PaychecksResponse> {
  const base =
    process.env.VERCEL_URL != null
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

  try {
    // Prefer direct import path on the server to avoid self-fetch cold starts
    const { fetchSolanaPaychecks } = await import("@/lib/solana");
    const { paychecks, errors, totalPaidTodayUsd } =
      await fetchSolanaPaychecks(4);
    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      source: "solana-public-rpc + curated x402 facilitator wallets",
      note:
        "$WAGE token is not deployed yet. Showing real USDC settlements only.",
      totalPaidTodayUsd: Number(totalPaidTodayUsd.toFixed(6)),
      paychecks,
      errors: errors.length ? errors : undefined,
      emptyReason:
        paychecks.length === 0
          ? "Live feed coming — waiting for recent public facilitator USDC outflows (or RPC rate limits)."
          : undefined,
    };
  } catch (e) {
    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      source: "solana-public-rpc",
      note: "Upstream unavailable; empty state shown instead of fake rows.",
      totalPaidTodayUsd: 0,
      paychecks: [],
      emptyReason: (e as Error).message,
      errors: [(e as Error).message],
    };
  }
}

function shortAddr(a: string) {
  if (a.length < 12) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export default async function HomePage() {
  const data = await loadPaychecks();
  const rows = data.paychecks.slice(0, 25);

  return (
    <main>
      <section className="hero">
        <div className="badge">
          $WAGE · Agent Payday · <strong>token not deployed</strong>
        </div>
        <h1>Agent Payday</h1>
        <p className="lede">
          A public ticker of real on-chain payments flowing through AI-agent
          rails (x402 facilitators and related settlement wallets). Every row
          links to an explorer transaction. Nothing here is fabricated — if the
          feed is quiet, you see an empty state.
        </p>
      </section>

      <section className="stats">
        <div className="stat">
          <div className="label">Paid today (UTC, parsed USDC)</div>
          <div className="value">${data.totalPaidTodayUsd.toFixed(4)}</div>
        </div>
        <div className="stat">
          <div className="label">Rows in feed</div>
          <div className="value">{rows.length}</div>
        </div>
        <div className="stat">
          <div className="label">$WAGE price</div>
          <div className="value">—</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Payday ticker</h2>
          <span>updated {new Date(data.generatedAt).toISOString()}</span>
        </div>

        {rows.length === 0 ? (
          <div className="empty">
            <strong>Live feed coming</strong>
            {data.emptyReason ||
              "No verified on-chain paychecks yet. We never show placeholder rows."}
          </div>
        ) : (
          <div>
            {rows.map((p) => (
              <div className="row" key={p.id}>
                <div>
                  <div>{p.facilitatorLabel}</div>
                  <div className="mono">
                    {shortAddr(p.from)} → {shortAddr(p.to)}
                  </div>
                </div>
                <div className="mono">
                  {p.timestampIso
                    ? new Date(p.timestampIso).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila",
                      })
                    : "—"}{" "}
                  <span style={{ color: "var(--muted)" }}>(Manila)</span>
                </div>
                <div className="amount">
                  +{p.amount} {p.symbol}
                </div>
                <div>
                  <a href={p.explorerUrl} target="_blank" rel="noreferrer">
                    View tx ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="footer">
        Source: {data.source}. {data.note} API:{" "}
        <a href="/api/paychecks">/api/paychecks</a>. Architecture:{" "}
        <code>docs/ARCHITECTURE.md</code>.
        {data.errors?.length ? (
          <>
            {" "}
            Upstream notes: {data.errors.slice(0, 2).join(" · ")}
          </>
        ) : null}
      </p>
    </main>
  );
}
