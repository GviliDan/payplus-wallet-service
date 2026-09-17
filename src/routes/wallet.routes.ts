import { Router } from "express";
import * as walletController from "../controllers/wallet.controller";
import * as ledgerController from "../controllers/ledger.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import { pageQuerySchema } from "../schemas/common.schema";
import {
  createWalletBodySchema,
  listWalletsQuerySchema,
  updateWalletStatusBodySchema,
  walletIdParamsSchema,
} from "../schemas/wallet.schema";

export const walletRouter = Router();

walletRouter.post(
  "/",
  validateRequest({ body: createWalletBodySchema }),
  asyncHandler(walletController.create)
);
walletRouter.get(
  "/",
  validateRequest({ query: listWalletsQuerySchema }),
  asyncHandler(walletController.list)
);
walletRouter.get(
  "/:id",
  validateRequest({ params: walletIdParamsSchema }),
  asyncHandler(walletController.getById)
);
walletRouter.patch(
  "/:id/status",
  validateRequest({ params: walletIdParamsSchema, body: updateWalletStatusBodySchema }),
  asyncHandler(walletController.updateStatus)
);
walletRouter.get(
  "/:id/ledger-entries",
  validateRequest({ params: walletIdParamsSchema, query: pageQuerySchema }),
  asyncHandler(ledgerController.listForWallet)
);
