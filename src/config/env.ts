import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: required("PGHOST"),
    port: Number(process.env.PGPORT ?? 5432),
    user: required("PGUSER"),
    password: required("PGPASSWORD"),
    database: required("PGDATABASE"),
  },
};
