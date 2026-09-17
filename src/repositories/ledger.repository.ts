import { PoolClient } from "pg";
import { pool } from "../config/database";
import { LedgerEntry, LedgerEntryType } from "../types/ledger.types";
import { PageParams } from "../types/common.types";

export async function insertLedgerEntry(
  client: PoolClient,
  walletId: number,
  transactionId: number,
  type: LedgerEntryType,
  amount: string,
  currency: string
): Promise<LedgerEntry> {
  const result = await client.query<LedgerEntry>(
    `INSERT INTO ledger_entries (wallet_id, transaction_id, type, amount, currency)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [walletId, transactionId, type, amount, currency]
  );
  return result.rows[0];
}

export async function listByWallet(
  walletId: number,
  { limit, offset }: PageParams
): Promise<{ items: LedgerEntry[]; total: number }> {
  const itemsResult = await pool.query<LedgerEntry>(
    `SELECT * FROM ledger_entries WHERE wallet_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
    [walletId, limit, offset]
  );
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM ledger_entries WHERE wallet_id = $1`,
    [walletId]
  );
  return { items: itemsResult.rows, total: Number(countResult.rows[0].count) };
}

export async function listByTransaction(
  transactionId: number,
  { limit, offset }: PageParams
): Promise<{ items: LedgerEntry[]; total: number }> {
  const itemsResult = await pool.query<LedgerEntry>(
    `SELECT * FROM ledger_entries WHERE transaction_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
    [transactionId, limit, offset]
  );
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM ledger_entries WHERE transaction_id = $1`,
    [transactionId]
  );
  return { items: itemsResult.rows, total: Number(countResult.rows[0].count) };
}
