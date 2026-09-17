export type TransactionType = "charge" | "refund";
export type TransactionStatus = "succeeded" | "declined";

export interface Transaction {
  id: number;
  wallet_id: number;
  merchant_id: number;
  type: TransactionType;
  amount: string;
  currency: string;
  status: TransactionStatus;
  decline_reason: string | null;
  original_transaction_id: number | null;
  client_request_id: string;
  created_at: Date;
  updated_at: Date;
}
