import { Response } from "express";
import * as transactionService from "../services/transaction.service";
import { ValidatedRequest } from "../middleware/validateRequest";
import {
  ChargeBody,
  ListTransactionsQuery,
  RefundBody,
  TransactionIdParams,
} from "../schemas/transaction.schema";

export async function charge(req: ValidatedRequest<ChargeBody>, res: Response) {
  const body = req.validated.body;
  const { transaction, replayed } = await transactionService.charge(body);
  res.status(replayed ? 200 : 201).json(transaction);
}

export async function refund(req: ValidatedRequest<RefundBody>, res: Response) {
  const body = req.validated.body;
  const { transaction, replayed } = await transactionService.refund(body);
  res.status(replayed ? 200 : 201).json(transaction);
}

export async function getById(req: ValidatedRequest<unknown, TransactionIdParams>, res: Response) {
  const params = req.validated.params;
  const transaction = await transactionService.getTransaction(params.id);
  res.json(transaction);
}

export async function list(
  req: ValidatedRequest<unknown, unknown, ListTransactionsQuery>,
  res: Response
) {
  const query = req.validated.query;
  const page = await transactionService.listTransactions(query);
  res.json(page);
}
