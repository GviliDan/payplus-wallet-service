import { Router } from "express";
import { merchantRouter } from "./merchant.routes";
import { walletRouter } from "./wallet.routes";
import { transactionRouter } from "./transaction.routes";

export const router = Router();

router.use("/merchants", merchantRouter);
router.use("/wallets", walletRouter);
router.use("/transactions", transactionRouter);
