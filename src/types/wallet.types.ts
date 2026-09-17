export type WalletStatus = "active" | "inactive";

export interface Wallet {
  id: number;
  owner_identity: string;
  currency: string;
  balance: string;
  status: WalletStatus;
  created_at: Date;
  updated_at: Date;
}
