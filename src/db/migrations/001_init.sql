CREATE TYPE wallet_status AS ENUM ('active', 'inactive');
CREATE TYPE merchant_status AS ENUM ('active', 'inactive');
CREATE TYPE transaction_type AS ENUM ('charge', 'refund');
CREATE TYPE transaction_status AS ENUM ('succeeded', 'declined');
CREATE TYPE ledger_entry_type AS ENUM ('charge', 'refund');

CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  owner_identity TEXT NOT NULL,
  currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  balance NUMERIC(19, 4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  status wallet_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE merchants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status merchant_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  wallet_id INTEGER NOT NULL REFERENCES wallets(id),
  merchant_id INTEGER NOT NULL REFERENCES merchants(id),
  type transaction_type NOT NULL,
  amount NUMERIC(19, 4) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status transaction_status NOT NULL,
  decline_reason TEXT,
  original_transaction_id INTEGER REFERENCES transactions(id),
  client_request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency: one transaction per client-supplied request id.
CREATE UNIQUE INDEX transactions_client_request_id_key ON transactions (client_request_id);
CREATE INDEX transactions_wallet_id_idx ON transactions (wallet_id);
CREATE INDEX transactions_merchant_id_idx ON transactions (merchant_id);
CREATE INDEX transactions_original_transaction_id_idx ON transactions (original_transaction_id);

CREATE TABLE ledger_entries (
  id SERIAL PRIMARY KEY,
  wallet_id INTEGER NOT NULL REFERENCES wallets(id),
  transaction_id INTEGER NOT NULL REFERENCES transactions(id),
  type ledger_entry_type NOT NULL,
  amount NUMERIC(19, 4) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each transaction produces at most one ledger movement (charge txn -> charge entry,
-- refund txn -> refund entry), so this also guarantees no duplicate entry per action.
CREATE UNIQUE INDEX ledger_entries_transaction_id_key ON ledger_entries (transaction_id);
CREATE INDEX ledger_entries_wallet_id_idx ON ledger_entries (wallet_id);
