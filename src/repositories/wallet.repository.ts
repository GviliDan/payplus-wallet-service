import { PoolClient } from "pg";
import { pool } from "../config/database";
import { Wallet, WalletStatus } from "../types/wallet.types";
import { PageParams } from "../types/common.types";

export async function insertWallet(
  ownerIdentity: string,
  currency: string,
  initialBalance: string
): Promise<Wallet> {
  const result = await pool.query<Wallet>(
    `INSERT INTO wallets (owner_identity, currency, balance) VALUES ($1, $2, $3) RETURNING *`,
    [ownerIdentity, currency, initialBalance]
  );
  return result.rows[0];
}

export async function findWalletById(id: number): Promise<Wallet | null> {
  const result = await pool.query<Wallet>(`SELECT * FROM wallets WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

// Locks the wallet row for the duration of the caller's transaction so concurrent
// charge/refund requests against the same wallet serialize instead of racing.
export async function lockWalletById(client: PoolClient, id: number): Promise<Wallet | null> {
  const result = await client.query<Wallet>(
    `SELECT * FROM wallets WHERE id = $1 FOR UPDATE`,
    [id]
  );
  return result.rows[0] ?? null;
}

// Caller must hold the row lock (via lockWalletById) in the same transaction
// before calling debit/credit, so the balance check and write stay atomic.
export async function debitBalance(client: PoolClient, id: number, amount: string): Promise<Wallet> {
  const result = await client.query<Wallet>(
    `UPDATE wallets SET balance = balance - $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [amount, id]
  );
  return result.rows[0];
}

export async function creditBalance(client: PoolClient, id: number, amount: string): Promise<Wallet> {
  const result = await client.query<Wallet>(
    `UPDATE wallets SET balance = balance + $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [amount, id]
  );
  return result.rows[0];
}

export async function listWallets(
  status: WalletStatus | undefined,
  currency: string | undefined,
  { limit, offset }: PageParams
): Promise<{ items: Wallet[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (currency) {
    params.push(currency);
    conditions.push(`currency = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const itemsResult = await pool.query<Wallet>(
    `SELECT * FROM wallets ${where} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM wallets ${where}`,
    params
  );

  return { items: itemsResult.rows, total: Number(countResult.rows[0].count) };
}

export async function updateWalletStatus(id: number, status: WalletStatus): Promise<Wallet | null> {
  const result = await pool.query<Wallet>(
    `UPDATE wallets SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] ?? null;
}
