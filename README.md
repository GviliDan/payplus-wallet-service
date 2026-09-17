# PayPlus Wallet Transaction Service

Backend API for wallet transaction processing: merchants, wallets, charge/refund transactions, and an append-only ledger.

## Tech Stack

Node.js, TypeScript, Express, PostgreSQL (raw `pg`, no ORM), Zod for request validation, Docker Compose.

## Quick Start (Docker)

**Prerequisite:** Docker only — no local Node.js or PostgreSQL required.

```bash
docker compose up --build
```

API: `http://localhost:3000`

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

## Stop / Restart

```bash
docker compose down       # stops containers, keeps the database volume
docker compose down -v    # also deletes the volume - use only to reset the database
```

Restarting with `docker compose down` + `docker compose up --build` is safe: migrations are tracked in a `schema_migrations` table and only run once.

## Postman

Collection: `postman/PayPlus-Wallet.postman_collection.json`

Import into Postman and run folder by folder (Health → Merchants → Wallets → Transactions → Ledger → Idempotency) via the Collection Runner — later requests depend on ids saved by earlier ones.

## API Summary

| Resource | Routes |
|---|---|
| Merchant | `POST /api/merchants`, `GET /api/merchants`, `GET /api/merchants/:id`, `PATCH /api/merchants/:id/status` |
| Wallet | `POST /api/wallets`, `GET /api/wallets`, `GET /api/wallets/:id`, `PATCH /api/wallets/:id/status` |
| Transaction | `POST /api/transactions/charge`, `POST /api/transactions/refund`, `GET /api/transactions`, `GET /api/transactions/:id` |
| Ledger | `GET /api/wallets/:id/ledger-entries`, `GET /api/transactions/:id/ledger-entries` |
| Health | `GET /health` |

## Key Behavior

- **Idempotency**: `client_request_id` is unique per transaction; a retry returns the original transaction instead of creating a duplicate.
- **Concurrency**: charge/refund lock the wallet row (`SELECT ... FOR UPDATE`) inside a DB transaction, so concurrent requests can't overdraw a wallet.
- **Ledger**: append-only; exactly one entry per successful charge/refund, none for declined transactions.
- **Money**: amounts are decimal strings (e.g. `"80.00"`), never JSON numbers, to avoid floating-point errors.

## Assumptions

- Wallet "employee/company identity" is a single `owner_identity` string field.
- A refund's `merchant_id` must match the original charge's merchant.
- `client_request_id` is globally unique, not scoped per wallet/merchant.
- Currency is validated as a 3-letter uppercase code (format only, not a fixed ISO list).

## Local Development (optional)

Only needed if running outside Docker.

```bash
npm install
cp .env.example .env
docker compose up -d postgres   # or point .env at your own Postgres
npm run migrate
npm run dev
```
