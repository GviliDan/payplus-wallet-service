import { z } from "zod";

// Express path params are always strings, so converting string -> number here is expected
// parsing, not a type violation (mirrors the old utils/validation.ts::parseId).
export function idParamSchema(label: string) {
  return z.string().transform((value, ctx) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      ctx.addIssue({ code: "custom", message: `Invalid ${label}` });
      return z.NEVER;
    }
    return id;
  });
}

// Same idea for an optional numeric filter arriving as a query string (e.g. ?wallet_id=1).
export function optionalIdQuerySchema(label: string) {
  return z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return undefined;
      const id = Number(value);
      if (!Number.isInteger(id) || id <= 0) {
        ctx.addIssue({ code: "custom", message: `Invalid ${label}` });
        return z.NEVER;
      }
      return id;
    });
}

// A body-level id (wallet_id, merchant_id, original_transaction_id, ...) must arrive as an
// actual JSON number -- a numeric string is rejected rather than silently coerced.
export function idBodySchema(label: string) {
  return z
    .number({ error: `${label} must be an integer number` })
    .int(`${label} must be an integer number`)
    .positive(`${label} must be an integer number`);
}

export const limitQuerySchema = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return 20;
    const limit = Number(value);
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      ctx.addIssue({ code: "custom", message: "limit must be an integer between 1 and 100" });
      return z.NEVER;
    }
    return limit;
  });

export const offsetQuerySchema = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return 0;
    const offset = Number(value);
    if (!Number.isInteger(offset) || offset < 0) {
      ctx.addIssue({ code: "custom", message: "offset must be a non-negative integer" });
      return z.NEVER;
    }
    return offset;
  });

export const pageQuerySchema = z.object({
  limit: limitQuerySchema,
  offset: offsetQuerySchema,
});

export type PageQuery = z.infer<typeof pageQuerySchema>;


export function amountSchema(field = "amount") {
  return z
    .string({ error: `${field} must be a positive decimal string, e.g. "80.00"` })
    .superRefine((value, ctx) => {
      const isValidShape = /^\d+(\.\d{1,4})?$/.test(value);
      const isZero = isValidShape && /^0+(\.0+)?$/.test(value);
      if (!isValidShape || isZero) {
        ctx.addIssue({
          code: "custom",
          message: `${field} must be a positive decimal string, e.g. "80.00"`,
        });
      }
    });
}

// Non-negative variant for a wallet's starting balance -- zero is allowed here, unlike a
// charge/refund amount.
export const nonNegativeAmountSchema = z
  .string({ error: 'initial_balance must be a non-negative decimal string, e.g. "0.00"' })
  .regex(/^\d+(\.\d{1,4})?$/, 'initial_balance must be a non-negative decimal string, e.g. "0.00"');

export const currencySchema = z
  .string({ error: 'currency must be a 3-letter uppercase currency code, e.g. "ILS"' })
  .regex(/^[A-Z]{3}$/, 'currency must be a 3-letter uppercase currency code, e.g. "ILS"');

export function nonEmptyStringSchema(field: string) {
  return z
    .string({ error: `${field} is required and must be a non-empty string` })
    .trim()
    .min(1, `${field} is required and must be a non-empty string`);
}
