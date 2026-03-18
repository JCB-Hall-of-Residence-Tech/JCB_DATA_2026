import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const clientFilter = sp.get("client") || "all";

  try {
    const params: unknown[] = [];
    let where = "WHERE v.client_id IS NOT NULL";
    if (clientFilter !== "all") {
      params.push(clientFilter);
      where += ` AND v.client_id = $1`;
    }

    // List of clients for the dropdown
    const clientsRes = await query<{ client_id: string }>(
      "SELECT DISTINCT client_id FROM videos WHERE client_id IS NOT NULL ORDER BY client_id"
    );

    // Build a user → channel → language flow for each client
    const { rows } = await query<{
      client_id: string;
      source: string;
      target: string;
      value: number;
    }>(
      `
      SELECT v.client_id,
             u.user_name AS source,
             cs.channel_name AS target,
             COUNT(*)::int AS value
      FROM videos v
      JOIN users u ON u.client_id = v.client_id AND u.user_id = v.user_id
      JOIN channel_processing_summary cs
        ON cs.client_id = v.client_id AND cs.channel_id = v.channel_id
      ${where}
        AND u.user_name IS NOT NULL
        AND cs.channel_name IS NOT NULL
      GROUP BY v.client_id, u.user_name, cs.channel_name

      UNION ALL

      SELECT v.client_id,
             cs.channel_name AS source,
             COALESCE(NULLIF(TRIM(v.language_name), ''), 'Unknown') AS target,
             COUNT(*)::int AS value
      FROM videos v
      JOIN channel_processing_summary cs
        ON cs.client_id = v.client_id AND cs.channel_id = v.channel_id
      ${where}
        AND cs.channel_name IS NOT NULL
      GROUP BY v.client_id,
               cs.channel_name,
               COALESCE(NULLIF(TRIM(v.language_name), ''), 'Unknown')
      `,
      params
    );

    const links = rows.map((r) => ({
      client_id: r.client_id,
      source: r.source,
      target: r.target,
      value: Number(r.value) || 0,
    }));

    const nodeSet = new Set<string>();
    for (const l of links) {
      nodeSet.add(l.source);
      nodeSet.add(l.target);
    }
    const nodes = Array.from(nodeSet).map((name) => ({ name }));

    const clientIds = Array.from(
      new Set(links.map((l) => l.client_id).filter((id): id is string => !!id))
    ).sort();

    return NextResponse.json({
      clients: clientsRes.rows.map((r) => r.client_id),
      sankey: {
        nodes,
        links,
        clientIds,
      },
    });
  } catch (error) {
    console.error("Page6 API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch topology data" },
      { status: 500 }
    );
  }
}

