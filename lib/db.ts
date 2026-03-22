import { supabase } from "./supabase";

// Safely substitute $1, $2, ... placeholders into the SQL string
function substituteParams(text: string, params?: unknown[]): string {
  if (!params || params.length === 0) return text;
  let result = text;
  for (let i = params.length; i >= 1; i--) {
    const value = params[i - 1];
    let escaped: string;
    if (value === null || value === undefined) {
      escaped = "NULL";
    } else if (typeof value === "number") {
      escaped = String(value);
    } else if (typeof value === "boolean") {
      escaped = value ? "TRUE" : "FALSE";
    } else {
      escaped = `'${String(value).replace(/'/g, "''")}'`;
    }
    result = result.replace(new RegExp(`\\$${i}`, "g"), escaped);
  }
  return result;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  // exec_sql wraps SQL as `FROM (<sql>) t` — trailing semicolons break the outer query
  const sql = substituteParams(text, params).replace(/;\s*$/, "");

  // Transaction control statements (BEGIN/COMMIT/ROLLBACK) are no-ops inside exec_sql
  // (exec_sql already runs in its own transaction context)
  if (/^\s*(BEGIN|COMMIT|ROLLBACK|SAVEPOINT)\b/i.test(sql)) {
    return { rows: [], rowCount: 0 };
  }

  // exec_sql wraps the query as `SELECT * FROM (<sql>) t`.
  // DML (INSERT/UPDATE/DELETE) without RETURNING fails in that form.
  // Appending RETURNING * makes PostgreSQL allow it as a subquery.
  const isDML = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(sql);
  const hasReturning = /\bRETURNING\b/i.test(sql);
  const finalSql = isDML && !hasReturning ? `${sql} RETURNING *` : sql;

  const { data, error } = await supabase.rpc("exec_sql", { query: finalSql });
  if (error) throw new Error(error.message);
  const rows = (Array.isArray(data) ? data : []) as T[];
  return { rows, rowCount: rows.length };
}

// Pool compatibility shim for routes that use pool.connect() / client.query() / client.release()
export const pool = {
  connect: async () => {
    return {
      query: async <T = unknown>(text: string, params?: unknown[]) => {
        return query<T>(text, params);
      },
      release: () => {
        /* no-op */
      },
    };
  },
};
