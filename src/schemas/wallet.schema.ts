import { z } from "zod";
import {
  currencySchema,
  idParamSchema,
  limitQuerySchema,
  nonEmptyStringSchema,
  nonNegativeAmountSchema,
  offsetQuerySchema,
} from "./common.schema";

const STATUSES = ["active", "inactive"] as const;

export const createWalletBodySchema = z.object({
  owner_identity: nonEmptyStringSchema("owner_identity"),
  currency: currencySchema,
  initial_balance: nonNegativeAmountSchema.optional(),
});
export type CreateWalletBody = z.infer<typeof createWalletBodySchema>;

export const walletIdParamsSchema = z.object({
  id: idParamSchema("wallet id"),
});
export type WalletIdParams = z.infer<typeof walletIdParamsSchema>;

export const listWalletsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  currency: currencySchema.optional(),
  limit: limitQuerySchema,
  offset: offsetQuerySchema,
});
export type ListWalletsQuery = z.infer<typeof listWalletsQuerySchema>;

export const updateWalletStatusBodySchema = z.object({
  status: z.enum(STATUSES, { error: "status is required and must be 'active' or 'inactive'" }),
});
export type UpdateWalletStatusBody = z.infer<typeof updateWalletStatusBodySchema>;
