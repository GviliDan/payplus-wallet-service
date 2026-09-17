import { Router } from "express";
import * as merchantController from "../controllers/merchant.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateRequest } from "../middleware/validateRequest";
import {
  createMerchantBodySchema,
  listMerchantsQuerySchema,
  merchantIdParamsSchema,
  updateMerchantStatusBodySchema,
} from "../schemas/merchant.schema";

export const merchantRouter = Router();

merchantRouter.post(
  "/",
  validateRequest({ body: createMerchantBodySchema }),
  asyncHandler(merchantController.create)
);
merchantRouter.get(
  "/",
  validateRequest({ query: listMerchantsQuerySchema }),
  asyncHandler(merchantController.list)
);
merchantRouter.get(
  "/:id",
  validateRequest({ params: merchantIdParamsSchema }),
  asyncHandler(merchantController.getById)
);
merchantRouter.patch(
  "/:id/status",
  validateRequest({ params: merchantIdParamsSchema, body: updateMerchantStatusBodySchema }),
  asyncHandler(merchantController.updateStatus)
);
