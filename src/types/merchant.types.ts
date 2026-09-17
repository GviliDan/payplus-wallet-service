export type MerchantStatus = "active" | "inactive";

export interface Merchant {
  id: number;
  name: string;
  status: MerchantStatus;
  created_at: Date;
  updated_at: Date;
}
