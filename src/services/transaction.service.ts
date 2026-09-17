import { withTransaction } from "../config/database";
import { AppError } from "../errors/AppError";
import * as ledgerRepository from "../repositories/ledger.repository";
import * as merchantRepository from "../repositories/merchant.repository";
import * as transactionRepository from "../repositories/transaction.repository";
import * as walletRepository from "../repositories/wallet.repository";
import { ChargeBody, ListTransactionsQuery, RefundBody } from "../schemas/transaction.schema";
import { Page } from "../types/common.types";
import { Merchant } from "../types/merchant.types";
import { Transaction } from "../types/transaction.types";
import { Wallet } from "../types/wallet.types";
import { compareAmounts, subtractAmounts } from "../utils/money";

interface DeclineReason {
  code: string;
  message: string;
  status: number;
  details: Record<string, unknown>;
}

interface ChargeInput {
  walletId: number;
  merchantId: number;
  amount: string;
  currency: string;
  clientRequestId: string;
}

interface RefundInput {
  originalTransactionId: number;
  merchantId: number;
  amount: string;
  currency: string;
  clientRequestId: string;
}

export interface TransactionResult {
  transaction: Transaction;
  replayed: boolean;
}

export async function charge(body: ChargeBody): Promise<TransactionResult> {
  const input: ChargeInput = {
    walletId: body.wallet_id,
    merchantId: body.merchant_id,
    amount: body.amount,
    currency: body.currency,
    clientRequestId: body.client_request_id,
  };

  return runIdempotently(input.clientRequestId, () =>
    withTransaction(async (client) => {
      const wallet = await walletRepository.lockWalletById(client, input.walletId);
      if (!wallet) {
        throw AppError.notFound("wallet_not_found", `Wallet ${input.walletId} not found`, {
          wallet_id: input.walletId,
        });
      }

      const merchant = await merchantRepository.findMerchantById(input.merchantId, client);
      if (!merchant) {
        throw AppError.notFound("merchant_not_found", `Merchant ${input.merchantId} not found`, {
          merchant_id: input.merchantId,
        });
      }

      const decline = evaluateChargeDecline(wallet, merchant, input.amount, input.currency);

      if (decline) {
        const transaction = await transactionRepository.insertTransaction(client, {
          walletId: wallet.id,
          merchantId: merchant.id,
          type: "charge",
          amount: input.amount,
          currency: input.currency,
          status: "declined",
          declineReason: decline.code,
          originalTransactionId: null,
          clientRequestId: input.clientRequestId,
        });
        return { transaction, decline };
      }

      await walletRepository.debitBalance(client, wallet.id, input.amount);
      const transaction = await transactionRepository.insertTransaction(client, {
        walletId: wallet.id,
        merchantId: merchant.id,
        type: "charge",
        amount: input.amount,
        currency: input.currency,
        status: "succeeded",
        declineReason: null,
        originalTransactionId: null,
        clientRequestId: input.clientRequestId,
      });
      await ledgerRepository.insertLedgerEntry(
        client,
        wallet.id,
        transaction.id,
        "charge",
        input.amount,
        input.currency
      );
      return { transaction, decline: null };
    })
  );
}

export async function refund(body: RefundBody): Promise<TransactionResult> {
  const input: RefundInput = {
    originalTransactionId: body.original_transaction_id,
    merchantId: body.merchant_id,
    amount: body.amount,
    currency: body.currency,
    clientRequestId: body.client_request_id,
  };

  return runIdempotently(input.clientRequestId, () =>
    withTransaction(async (client) => {
      const original = await transactionRepository.lockById(client, input.originalTransactionId);
      if (!original) {
        throw AppError.notFound(
          "transaction_not_found",
          `Transaction ${input.originalTransactionId} not found`,
          { transaction_id: input.originalTransactionId }
        );
      }
      if (original.type !== "charge" || original.status !== "succeeded") {
        throw AppError.conflict(
          "transaction_not_refundable",
          "Only a succeeded charge transaction can be refunded",
          { transaction_id: original.id, type: original.type, status: original.status }
        );
      }

      const wallet = await walletRepository.lockWalletById(client, original.wallet_id);
      if (!wallet) {
        throw AppError.notFound("wallet_not_found", `Wallet ${original.wallet_id} not found`, {
          wallet_id: original.wallet_id,
        });
      }

      const merchant = await merchantRepository.findMerchantById(input.merchantId, client);
      if (!merchant) {
        throw AppError.notFound("merchant_not_found", `Merchant ${input.merchantId} not found`, {
          merchant_id: input.merchantId,
        });
      }

      const alreadyRefunded = await transactionRepository.sumSucceededRefunds(client, original.id);
      const refundable = subtractAmounts(original.amount, alreadyRefunded);

      const decline = evaluateRefundDecline(original, wallet, merchant, input, refundable);

      if (decline) {
        const transaction = await transactionRepository.insertTransaction(client, {
          walletId: wallet.id,
          merchantId: merchant.id,
          type: "refund",
          amount: input.amount,
          currency: input.currency,
          status: "declined",
          declineReason: decline.code,
          originalTransactionId: original.id,
          clientRequestId: input.clientRequestId,
        });
        return { transaction, decline };
      }

      await walletRepository.creditBalance(client, wallet.id, input.amount);
      const transaction = await transactionRepository.insertTransaction(client, {
        walletId: wallet.id,
        merchantId: merchant.id,
        type: "refund",
        amount: input.amount,
        currency: input.currency,
        status: "succeeded",
        declineReason: null,
        originalTransactionId: original.id,
        clientRequestId: input.clientRequestId,
      });
      await ledgerRepository.insertLedgerEntry(
        client,
        wallet.id,
        transaction.id,
        "refund",
        input.amount,
        input.currency
      );
      return { transaction, decline: null };
    })
  );
}

export async function getTransaction(id: number): Promise<Transaction> {
  const transaction = await transactionRepository.findById(id);
  if (!transaction) {
    throw AppError.notFound("transaction_not_found", `Transaction ${id} not found`, {
      transaction_id: id,
    });
  }
  return transaction;
}

export async function listTransactions(query: ListTransactionsQuery): Promise<Page<Transaction>> {
  const { items, total } = await transactionRepository.listTransactions(
    {
      walletId: query.wallet_id,
      merchantId: query.merchant_id,
      type: query.type,
      status: query.status,
    },
    { limit: query.limit, offset: query.offset }
  );
  return { items, total, limit: query.limit, offset: query.offset };
}

// Retries the idempotency check once if two requests with the same client_request_id
// race past the initial lookup: the unique index rejects the second insert, and we
// fetch and return the row the first request committed instead of erroring.
async function runIdempotently(
  clientRequestId: string,
  attempt: () => Promise<{ transaction: Transaction; decline: DeclineReason | null }>
): Promise<TransactionResult> {
  const existing = await transactionRepository.findByClientRequestId(clientRequestId);
  if (existing) return { transaction: existing, replayed: true };

  try {
    const { transaction, decline } = await attempt();
    if (decline) {
      throw new AppError(decline.code, decline.message, decline.status, {
        ...decline.details,
        transaction_id: transaction.id,
      });
    }
    return { transaction, replayed: false };
  } catch (err) {
    if (isUniqueViolation(err)) {
      const raced = await transactionRepository.findByClientRequestId(clientRequestId);
      if (raced) return { transaction: raced, replayed: true };
    }
    throw err;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

function evaluateChargeDecline(
  wallet: Wallet,
  merchant: Merchant,
  amount: string,
  currency: string
): DeclineReason | null {
  if (merchant.status !== "active") {
    return {
      code: "merchant_inactive",
      message: "Merchant is not active",
      status: 409,
      details: { merchant_id: merchant.id },
    };
  }
  if (wallet.status !== "active") {
    return {
      code: "wallet_inactive",
      message: "Wallet is not active",
      status: 409,
      details: { wallet_id: wallet.id },
    };
  }
  if (wallet.currency !== currency) {
    return {
      code: "currency_mismatch",
      message: `Wallet currency is ${wallet.currency}, but request currency is ${currency}`,
      status: 409,
      details: { wallet_id: wallet.id, wallet_currency: wallet.currency, requested_currency: currency },
    };
  }
  if (compareAmounts(wallet.balance, amount) < 0) {
    return {
      code: "insufficient_funds",
      message: "Wallet does not have enough available balance",
      status: 409,
      details: { wallet_id: wallet.id, available_balance: wallet.balance, requested_amount: amount },
    };
  }
  return null;
}

function evaluateRefundDecline(
  original: Transaction,
  wallet: Wallet,
  merchant: Merchant,
  input: RefundInput,
  refundable: string
): DeclineReason | null {
  if (merchant.status !== "active") {
    return {
      code: "merchant_inactive",
      message: "Merchant is not active",
      status: 409,
      details: { merchant_id: merchant.id },
    };
  }
  if (merchant.id !== original.merchant_id) {
    return {
      code: "merchant_mismatch",
      message: "Refund merchant does not match the original transaction's merchant",
      status: 409,
      details: { merchant_id: merchant.id, original_merchant_id: original.merchant_id },
    };
  }
  if (wallet.status !== "active") {
    return {
      code: "wallet_inactive",
      message: "Wallet is not active",
      status: 409,
      details: { wallet_id: wallet.id },
    };
  }
  if (wallet.currency !== input.currency) {
    return {
      code: "currency_mismatch",
      message: `Wallet currency is ${wallet.currency}, but request currency is ${input.currency}`,
      status: 409,
      details: {
        wallet_id: wallet.id,
        wallet_currency: wallet.currency,
        requested_currency: input.currency,
      },
    };
  }
  if (compareAmounts(refundable, input.amount) < 0) {
    return {
      code: "refund_amount_exceeds_available",
      message: "Refund amount exceeds the amount still available to refund",
      status: 409,
      details: {
        transaction_id: original.id,
        refundable_amount: refundable,
        requested_amount: input.amount,
      },
    };
  }
  return null;
}
