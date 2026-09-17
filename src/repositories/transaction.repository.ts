import { PoolClient } from "pg";
import { pool } from "../config/database";
import { PageParams } from "../types/common.types";
import { Transaction, TransactionStatus, TransactionType } from "../types/transaction.types";

export interface NewTransaction {
  walletId: number;
  merchantId: number;
  type: TransactionType;
  amount: string;
  currency: string;
  status: TransactionStatus;
  declineReason: string | null;
  originalTransactionId: number | null;
  clientRequestId: string;
}

export async function insertTransaction(
  client: PoolClient,
  tx: NewTransaction
): Promise<Transaction> {
  const result = await client.query<Transaction>(
    `INSERT INTO transactions
       (wallet_id, merchant_id, type, amount, currency, status, decline_reason, original_transaction_id, client_request_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      tx.walletId,
      tx.merchantId,
      tx.type,
      tx.amount,
      tx.currency,
      tx.status,
      tx.declineReason,
      tx.originalTransactionId,
      tx.clientRequestId,
    ]
  );
  return result.rows[0];
}

export async function findByClientRequestId(
  clientRequestId: string
): Promise<Transaction | null> {
  const result = await pool.query<Transaction>(
    `SELECT * FROM transactions WHERE client_request_id = $1`,
    [clientRequestId]
  );
  return result.rows[0] ?? null;
}

export async function findById(id: number): Promise<Transaction | null> {
  const result = await pool.query<Transaction>(`SELECT * FROM transactions WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

// Locks the original transaction row so concurrent refunds against it serialize
// when computing how much of it remains refundable.
export async function lockById(client: PoolClient, id: number): Promise<Transaction | null> {
  const result = await client.query<Transaction>(
    `SELECT * FROM transactions WHERE id = $1 FOR UPDATE`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function sumSucceededRefunds(
  client: PoolClient,
  originalTransactionId: number
): Promise<string> {
  const result = await client.query<{ total: string | null }>(
    `SELECT SUM(amount) AS total FROM transactions
     WHERE original_transaction_id = $1 AND type = 'refund' AND status = 'succeeded'`,
    [originalTransactionId]
  );
  return result.rows[0].total ?? "0";
}

export interface TransactionFilter {
  walletId?: number;
  merchantId?: number;
  type?: TransactionType;
  status?: TransactionStatus;
}

export async function listTransactions(
  filter: TransactionFilter,
  { limit, offset }: PageParams
): Promise<{ items: Transaction[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.walletId !== undefined) {
    params.push(filter.walletId);
    conditions.push(`wallet_id = $${params.length}`);
  }
  if (filter.merchantId !== undefined) {
    params.push(filter.merchantId);
    conditions.push(`merchant_id = $${params.length}`);
  }
  if (filter.type !== undefined) {
    params.push(filter.type);
    conditions.push(`type = $${params.length}`);
  }
  if (filter.status !== undefined) {
    params.push(filter.status);
    conditions.push(`status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const itemsResult = await pool.query<Transaction>(
    `SELECT * FROM transactions ${where} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM transactions ${where}`,
    params
  );

  return { items: itemsResult.rows, total: Number(countResult.rows[0].count) };
}
