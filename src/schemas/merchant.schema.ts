import { z } from "zod";
import { idParamSchema, limitQuerySchema, nonEmptyStringSchema, offsetQuerySchema } from "./common.schema";

const STATUSES = ["active", "inactive"] as const;

export const createMerchantBodySchema = z.object({
  name: nonEmptyStringSchema("name"),
});
export type CreateMerchantBody = z.infer<typeof createMerchantBodySchema>;

export const merchantIdParamsSchema = z.object({
  id: idParamSchema("merchant id"),
});
export type MerchantIdParams = z.infer<typeof merchantIdParamsSchema>;

export const listMerchantsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  limit: limitQuerySchema,
  offset: offsetQuerySchema,
});
export type ListMerchantsQuery = z.infer<typeof listMerchantsQuerySchema>;

export const updateMerchantStatusBodySchema = z.object({
  status: z.enum(STATUSES, { error: "status is required and must be 'active' or 'inactive'" }),
});
export type UpdateMerchantStatusBody = z.infer<typeof updateMerchantStatusBodySchema>;
