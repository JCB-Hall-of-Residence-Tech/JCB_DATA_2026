import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Fetches the current database schema from PostgreSQL information_schema.
 * Used by the SQL Analytics Chatbot to generate valid queries.
 * Schema is always fresh from the live database - no file sync needed.
 */
export async function GET() {
  try {
    const { rows } = await query<{
      table_name: string;
      column_name: string;
      data_type: string;
      udt_name: string;
    }>(`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.udt_name
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `);

    const schema: Record<string, { column: string; type: string }[]> = {};
    for (const r of rows) {
      if (!schema[r.table_name]) schema[r.table_name] = [];
      schema[r.table_name].push({
        column: r.column_name,
        type: r.data_type === "USER-DEFINED" ? r.udt_name : r.data_type,
      });
    }

    return NextResponse.json({ schema, tables: Object.keys(schema) });
  } catch (err) {
    console.error("[schema] Error fetching schema:", err);
    return NextResponse.json(
      { error: "Failed to fetch schema" },
      { status: 500 }
    );
  }
}
