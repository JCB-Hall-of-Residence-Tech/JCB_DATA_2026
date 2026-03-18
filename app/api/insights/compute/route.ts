import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateInsight } from "@/lib/insight-generator";

export const dynamic = "force-dynamic";

function toFilterHash(filters: Record<string, string>): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: filters[k] }), {} as Record<string, string>);
  return JSON.stringify(sorted);
}

/**
 * Fetch context data for a widget by calling page APIs or direct queries.
 */
async function getContextForWidget(
  page: string,
  widget: string,
  filters: Record<string, string>,
  baseUrl: string
): Promise<Record<string, unknown>> {
  // Page 2: direct DB queries (has client filter)
  if (page === "page2") {
    const clientFilter = filters.client || "all";
    const clientAnd = clientFilter !== "all" ? ` AND client_id = $1` : "";
    const clientWhere = clientFilter !== "all" ? ` WHERE client_id = $1` : "";
    const params = clientFilter !== "all" ? [clientFilter] : [];

    const [overallRes, channelRes] = await Promise.all([
      query(
        `SELECT
           COALESCE(SUM(uploaded_count), 0)::int AS total_uploaded,
           COALESCE(SUM(created_count), 0)::int AS total_processed,
           COALESCE(SUM(published_count), 0)::int AS total_published,
           CASE WHEN SUM(published_count) > 0
             THEN SUM(CASE WHEN published_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(published_duration_hh_mm_ss::text, '')) != ''
               THEN EXTRACT(EPOCH FROM (published_duration_hh_mm_ss::text::interval)) ELSE 0 END) / 60.0 / NULLIF(SUM(published_count), 0)
             ELSE NULL END AS avg_dur
         FROM channel_processing_summary
         WHERE 1=1 ${clientAnd}`,
        params
      ),
      query(
        `SELECT channel_name AS name,
                SUM(uploaded_count) AS uploaded_count,
                SUM(created_count) AS created_count,
                SUM(published_count) AS published_count
         FROM channel_processing_summary
         ${clientWhere}
         GROUP BY channel_name
         ORDER BY SUM(uploaded_count) DESC`,
        params
      ),
    ]);

    const o = (overallRes.rows[0] as Record<string, string | number>) || {};
    const totalUploaded = Number(o.total_uploaded) || 0;
    const totalProcessed = Number(o.total_processed) || 0;
    const totalPublished = Number(o.total_published) || 0;
    const avgDuration = o.avg_dur != null ? Math.round(Number(o.avg_dur) * 10) / 10 : null;

    const breakdowns = (channelRes.rows as Array<Record<string, string | number>>).map((r) => {
      const up = Number(r.uploaded_count);
      const pr = Number(r.created_count);
      const pb = Number(r.published_count);
      return {
        name: r.name,
        up,
        pr,
        pb,
        rate: pr > 0 ? Math.round((pb / pr) * 100) : 0,
      };
    });

    return {
      kpis: {
        totalUploaded,
        totalProcessed,
        totalPublished,
        publishRate: totalProcessed > 0 ? Math.round((totalPublished / totalProcessed) * 1000) / 10 : 0,
        processRate: totalUploaded > 0 ? Math.round((totalProcessed / totalUploaded) * 1000) / 10 : 0,
        dropGap: totalProcessed - totalPublished,
        avgDuration,
      },
      breakdowns,
    };
  }

  // Pages 1, 3, 4, 5: fetch from page API
  const pageApis: Record<string, string> = {
    page1: "/api/page1",
    page3: "/api/page3",
    page4: "/api/page4",
    page5: "/api/page5",
  };
  const apiPath = pageApis[page];
  if (apiPath) {
    try {
      const url = `${baseUrl}${apiPath}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      console.error(`Failed to fetch context for ${page}:`, e);
    }
  }

  return {};
}

/**
 * POST /api/insights/compute
 * Body: { page, widget, filters }
 * Computes insight, stores in DB, returns it.
 */
export async function POST(req: NextRequest) {
  let body: { page?: string; widget?: string; filters?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { page, widget, filters: rawFilters } = body;
  if (!page || !widget) {
    return NextResponse.json(
      { error: "Missing required fields: page, widget" },
      { status: 400 }
    );
  }

  const filters = (rawFilters || {}) as Record<string, string>;
  const filterHash = toFilterHash(filters);
  const reqUrl = new URL(req.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  try {
    const contextData = await getContextForWidget(page, widget, filters, baseUrl);
    const insightText = await generateInsight({
      page,
      widget,
      filters,
      data: contextData,
    });

    await query(
      `INSERT INTO actionable_insights (page_id, widget_id, filter_hash, insight_text, context_data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (page_id, widget_id, filter_hash)
       DO UPDATE SET insight_text = EXCLUDED.insight_text, context_data = EXCLUDED.context_data, computed_at = NOW()`,
      [page, widget, filterHash, insightText, JSON.stringify(contextData)]
    );

    return NextResponse.json({
      cached: false,
      insight: insightText,
      computed: true,
    });
  } catch (err) {
    console.error("Insight compute error:", err);
    return NextResponse.json(
      { error: "Failed to compute insight" },
      { status: 500 }
    );
  }
}
