export type LedgerEntryType = "charge" | "refund";

export interface LedgerEntry {
  id: number;
  wallet_id: number;
  transaction_id: number;
  type: LedgerEntryType;
  amount: string;
  currency: string;
  created_at: Date;
}
