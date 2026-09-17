import { z } from "zod";
import {
  amountSchema,
  currencySchema,
  idBodySchema,
  idParamSchema,
  limitQuerySchema,
  nonEmptyStringSchema,
  offsetQuerySchema,
  optionalIdQuerySchema,
} from "./common.schema";

const TYPES = ["charge", "refund"] as const;
const STATUSES = ["succeeded", "declined"] as const;

export const chargeBodySchema = z.object({
  wallet_id: idBodySchema("wallet_id"),
  merchant_id: idBodySchema("merchant_id"),
  amount: amountSchema("amount"),
  currency: currencySchema,
  client_request_id: nonEmptyStringSchema("client_request_id"),
});
export type ChargeBody = z.infer<typeof chargeBodySchema>;

export const refundBodySchema = z.object({
  original_transaction_id: idBodySchema("original_transaction_id"),
  merchant_id: idBodySchema("merchant_id"),
  amount: amountSchema("amount"),
  currency: currencySchema,
  client_request_id: nonEmptyStringSchema("client_request_id"),
});
export type RefundBody = z.infer<typeof refundBodySchema>;

export const transactionIdParamsSchema = z.object({
  id: idParamSchema("transaction id"),
});
export type TransactionIdParams = z.infer<typeof transactionIdParamsSchema>;

export const listTransactionsQuerySchema = z.object({
  wallet_id: optionalIdQuerySchema("wallet_id"),
  merchant_id: optionalIdQuerySchema("merchant_id"),
  type: z.enum(TYPES).optional(),
  status: z.enum(STATUSES).optional(),
  limit: limitQuerySchema,
  offset: offsetQuerySchema,
});
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
