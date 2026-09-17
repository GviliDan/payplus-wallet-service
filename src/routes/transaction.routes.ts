import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller";
import * as ledgerController from "../controllers/ledger.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import { pageQuerySchema } from "../schemas/common.schema";
import {
  chargeBodySchema,
  listTransactionsQuerySchema,
  refundBodySchema,
  transactionIdParamsSchema,
} from "../schemas/transaction.schema";

export const transactionRouter = Router();

transactionRouter.post(
  "/charge",
  validateRequest({ body: chargeBodySchema }),
  asyncHandler(transactionController.charge)
);
transactionRouter.post(
  "/refund",
  validateRequest({ body: refundBodySchema }),
  asyncHandler(transactionController.refund)
);
transactionRouter.get(
  "/",
  validateRequest({ query: listTransactionsQuerySchema }),
  asyncHandler(transactionController.list)
);
transactionRouter.get(
  "/:id",
  validateRequest({ params: transactionIdParamsSchema }),
  asyncHandler(transactionController.getById)
);
transactionRouter.get(
  "/:id/ledger-entries",
  validateRequest({ params: transactionIdParamsSchema, query: pageQuerySchema }),
  asyncHandler(ledgerController.listForTransaction)
);
