import { AppError } from "../errors/AppError";
import * as ledgerRepository from "../repositories/ledger.repository";
import * as transactionRepository from "../repositories/transaction.repository";
import * as walletRepository from "../repositories/wallet.repository";
import { Page } from "../types/common.types";
import { LedgerEntry } from "../types/ledger.types";

export async function listForWallet(walletId: number, limit: number, offset: number): Promise<Page<LedgerEntry>> {
  const wallet = await walletRepository.findWalletById(walletId);
  if (!wallet) {
    throw AppError.notFound("wallet_not_found", `Wallet ${walletId} not found`, { wallet_id: walletId });
  }

  const { items, total } = await ledgerRepository.listByWallet(walletId, { limit, offset });
  return { items, total, limit, offset };
}

export async function listForTransaction(
  transactionId: number,
  limit: number,
  offset: number
): Promise<Page<LedgerEntry>> {
  const transaction = await transactionRepository.findById(transactionId);
  if (!transaction) {
    throw AppError.notFound("transaction_not_found", `Transaction ${transactionId} not found`, {
      transaction_id: transactionId,
    });
  }

  const { items, total } = await ledgerRepository.listByTransaction(transactionId, { limit, offset });
  return { items, total, limit, offset };
}
