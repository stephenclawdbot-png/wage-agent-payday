export type Paycheck = {
  id: string;
  chain: "solana" | "base";
  txHash: string;
  explorerUrl: string;
  timestamp: number | null;
  /** ISO string when known */
  timestampIso: string | null;
  from: string;
  to: string;
  amount: number;
  symbol: string;
  mintOrToken: string;
  facilitatorId: string;
  facilitatorLabel: string;
  sourceNote: string;
};

export type PaychecksResponse = {
  ok: true;
  generatedAt: string;
  source: string;
  note: string;
  totalPaidTodayUsd: number;
  paychecks: Paycheck[];
  emptyReason?: string;
  errors?: string[];
};
