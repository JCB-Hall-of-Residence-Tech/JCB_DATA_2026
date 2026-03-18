import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Normalize filter object to deterministic JSON string for cache key */
function toFilterHash(filters: Record<string, string>): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: filters[k] }), {} as Record<string, string>);
  return JSON.stringify(sorted);
}

/**
 * GET /api/insights?page=page2&widget=kpi_publish_rate&filters={"client":"all"}
 * Returns cached insight if exists. 404 on cache miss (client can trigger compute via POST).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = sp.get("page");
  const widget = sp.get("widget");
  const filtersParam = sp.get("filters") || "{}";

  if (!page || !widget) {
    return NextResponse.json(
      { error: "Missing required params: page, widget" },
      { status: 400 }
    );
  }

  let filters: Record<string, string> = {};
  try {
    filters = JSON.parse(filtersParam) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "Invalid filters JSON" }, { status: 400 });
  }

  const filterHash = toFilterHash(filters);

  try {
    const res = await query(
      `SELECT insight_text, computed_at FROM actionable_insights
       WHERE page_id = $1 AND widget_id = $2 AND filter_hash = $3`,
      [page, widget, filterHash]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { cached: false, insight: null },
        { status: 404 }
      );
    }

    const row = res.rows[0] as { insight_text: string; computed_at: string };
    return NextResponse.json({
      cached: true,
      insight: row.insight_text,
      computedAt: row.computed_at,
    });
  } catch (err) {
    console.error("Insights API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch insight" },
      { status: 500 }
    );
  }
}
