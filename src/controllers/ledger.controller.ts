import { Response } from "express";
import * as ledgerService from "../services/ledger.service";
import { ValidatedRequest } from "../middleware/validateRequest";
import { PageQuery } from "../schemas/common.schema";
import { WalletIdParams } from "../schemas/wallet.schema";
import { TransactionIdParams } from "../schemas/transaction.schema";

export async function listForWallet(
  req: ValidatedRequest<unknown, WalletIdParams, PageQuery>,
  res: Response
) {
  const params = req.validated.params;
  const query = req.validated.query;
  const page = await ledgerService.listForWallet(params.id, query.limit, query.offset);
  res.json(page);
}

export async function listForTransaction(
  req: ValidatedRequest<unknown, TransactionIdParams, PageQuery>,
  res: Response
) {
  const params = req.validated.params;
  const query = req.validated.query;
  const page = await ledgerService.listForTransaction(params.id, query.limit, query.offset);
  res.json(page);
}
