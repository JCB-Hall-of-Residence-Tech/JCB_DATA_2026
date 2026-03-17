import { Pool } from "pg";

const connectionString = process.env.AUTH_DATABASE_URL;

if (!connectionString) {
  throw new Error("AUTH_DATABASE_URL environment variable is not set");
}

export const authPool = new Pool({
  connectionString,
});

export async function authQuery<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const client = await authPool.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount };
  } finally {
    client.release();
  }
}

