import { PoolClient } from "pg";
import { query } from "@/lib/db";
import { generateInsight } from "./insight-generator";

function toFilterHash(filters: Record<string, string>): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce(
      (acc, k) => ({
        ...acc,
        [k]: filters[k],
      }),
      {} as Record<string, string>,
    );
  return JSON.stringify(sorted);
}

// Basic context fetchers similar to /api/insights/compute
async function getContextForPage2(
  filters: Record<string, string>,
): Promise<Record<string, unknown>> {
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
      params,
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
      params,
    ),
  ]);

  const o = (overallRes.rows[0] as Record<string, string | number>) || {};
  const totalUploaded = Number(o.total_uploaded) || 0;
  const totalProcessed = Number(o.total_processed) || 0;
  const totalPublished = Number(o.total_published) || 0;
  const avgDuration =
    o.avg_dur != null ? Math.round(Number(o.avg_dur) * 10) / 10 : null;

  const breakdowns = (channelRes.rows as Array<Record<string, string | number>>)
    .slice(0, 20)
    .map((r) => {
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
      publishRate:
        totalProcessed > 0
          ? Math.round((totalPublished / totalProcessed) * 1000) / 10
          : 0,
      processRate:
        totalUploaded > 0
          ? Math.round((totalProcessed / totalUploaded) * 1000) / 10
          : 0,
      dropGap: totalProcessed - totalPublished,
      avgDuration,
    },
    breakdowns,
  };
}

// Precompute a curated set of insights for common widgets (all clients / aggregated).
const PRECOMPUTE_WIDGETS: Array<{
  page: string;
  widget: string;
  filters: Record<string, string>;
}> = [
  // Page 1 KPIs and charts (no filters)
  { page: "page1", widget: "kpi_human_hours_saved", filters: {} },
  { page: "page1", widget: "kpi_time_to_market", filters: {} },
  { page: "page1", widget: "kpi_content_waste", filters: {} },
  { page: "page1", widget: "kpi_client_concentration", filters: {} },
  { page: "page1", widget: "kpi_total_uploaded", filters: {} },
  { page: "page1", widget: "kpi_total_created", filters: {} },
  { page: "page1", widget: "kpi_ai_multiplier", filters: {} },
  { page: "page1", widget: "kpi_pop_growth", filters: {} },
  { page: "page1", widget: "kpi_top_output_type", filters: {} },
  { page: "page1", widget: "lifecycle_trend", filters: {} },
  { page: "page1", widget: "pipeline_stats", filters: {} },
  { page: "page1", widget: "efficiency_matrix", filters: {} },
  { page: "page1", widget: "top_formats", filters: {} },
  { page: "page1", widget: "data_health", filters: {} },

  // Page 2 – overall (all clients)
  { page: "page2", widget: "kpi_publish_rate", filters: { client: "all" } },
  { page: "page2", widget: "kpi_process_rate", filters: { client: "all" } },
  { page: "page2", widget: "kpi_total_uploaded", filters: { client: "all" } },
  { page: "page2", widget: "kpi_total_published", filters: { client: "all" } },
  {
    page: "page2",
    widget: "kpi_avg_duration",
    filters: { client: "all" },
  },
  { page: "page2", widget: "kpi_drop_gap", filters: { client: "all" } },
  { page: "page2", widget: "multi_dim_bar", filters: { client: "all" } },
  { page: "page2", widget: "multi_dim_donut", filters: { client: "all" } },
  { page: "page2", widget: "trend_chart", filters: { client: "all" } },
  { page: "page2", widget: "funnel_kpi_uploaded", filters: { client: "all" } },
  {
    page: "page2",
    widget: "funnel_kpi_published",
    filters: { client: "all" },
  },
  {
    page: "page2",
    widget: "funnel_kpi_publish rate",
    filters: { client: "all" },
  },
];

export async function precomputeAllInsights(pg: PoolClient): Promise<void> {
  for (const item of PRECOMPUTE_WIDGETS) {
    const { page, widget, filters } = item;
    const filterHash = toFilterHash(filters);

    let context: Record<string, unknown> = {};
    if (page === "page2") {
      context = await getContextForPage2(filters);
    } else {
      // For other pages, rely on the API-based compute to build context later;
      // we still generate a high-level insight with minimal context
      context = { note: "precomputed insight (minimal context)" };
    }

    const insightText = await generateInsight({
      page,
      widget,
      filters,
      data: context,
    });

    await pg.query(
      `INSERT INTO actionable_insights (page_id, widget_id, filter_hash, insight_text, context_data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (page_id, widget_id, filter_hash)
       DO UPDATE SET insight_text = EXCLUDED.insight_text, context_data = EXCLUDED.context_data, computed_at = NOW()`,
      [page, widget, filterHash, insightText, JSON.stringify(context)],
    );
  }
}

