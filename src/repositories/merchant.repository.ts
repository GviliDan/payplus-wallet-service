import { pool, Queryable } from "../config/database";
import { Merchant, MerchantStatus } from "../types/merchant.types";
import { PageParams } from "../types/common.types";

export async function insertMerchant(name: string): Promise<Merchant> {
  const result = await pool.query<Merchant>(
    `INSERT INTO merchants (name) VALUES ($1) RETURNING *`,
    [name]
  );
  return result.rows[0];
}

export async function findMerchantById(
  id: number,
  executor: Queryable = pool
): Promise<Merchant | null> {
  const result = await executor.query<Merchant>(
    `SELECT * FROM merchants WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listMerchants(
  status: MerchantStatus | undefined,
  { limit, offset }: PageParams
): Promise<{ items: Merchant[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const itemsResult = await pool.query<Merchant>(
    `SELECT * FROM merchants ${where} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM merchants ${where}`,
    params
  );

  return { items: itemsResult.rows, total: Number(countResult.rows[0].count) };
}

export async function updateMerchantStatus(
  id: number,
  status: MerchantStatus
): Promise<Merchant | null> {
  const result = await pool.query<Merchant>(
    `UPDATE merchants SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] ?? null;
}
