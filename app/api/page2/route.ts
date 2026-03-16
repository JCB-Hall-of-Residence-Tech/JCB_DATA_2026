import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function durationToMinutes(dur: string | null): number {
  if (!dur) return 0;
  const parts = dur.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return Number(dur) || 0;
}

interface SummaryRow {
  name: string;
  uploaded_count: string | number;
  created_count: string | number;
  published_count: string | number;
  uploaded_dur?: string;
  created_dur?: string;
  published_dur?: string;
}

function toBreakdown(rows: SummaryRow[]) {
  return rows.map((r, i) => {
    const up = Number(r.uploaded_count);
    const pr = Number(r.created_count);
    const pb = Number(r.published_count);
    return {
      id: `${r.name}-${i}`,
      name: r.name,
      up,
      pr,
      pb,
      rate: pr > 0 ? Math.round((pb / pr) * 100) : 0,
      durationUploaded: durationToMinutes(r.uploaded_dur ?? null),
      durationCreated: durationToMinutes(r.created_dur ?? null),
      durationPublished: durationToMinutes(r.published_dur ?? null),
    };
  });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const clientFilter = sp.get("client") || "all";

  try {
    const clientWhere =
      clientFilter !== "all" ? ` WHERE client_id = $1` : "";
    const clientWhereAnd =
      clientFilter !== "all" ? ` AND v.client_id = $1` : "";
    const clientWhereAndCps =
      clientFilter !== "all" ? ` AND client_id = $1` : "";
    const params = clientFilter !== "all" ? [clientFilter] : [];

    const [
      clientsRes,
      channelRes,
      userRes,
      inputTypeRes,
      outputTypeRes,
      languageRes,
      monthlyRes,
      overallRes,
    ] = await Promise.all([
      query("SELECT DISTINCT client_id FROM channel_processing_summary WHERE client_id IS NOT NULL ORDER BY client_id"),

      query(
        `SELECT channel_name AS name,
                SUM(uploaded_count) AS uploaded_count,
                SUM(created_count) AS created_count,
                SUM(published_count) AS published_count,
                (SUM(CASE WHEN uploaded_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(uploaded_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (uploaded_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS uploaded_dur,
                (SUM(CASE WHEN created_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(created_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (created_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS created_dur,
                (SUM(CASE WHEN published_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(published_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (published_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS published_dur
         FROM channel_processing_summary
         ${clientWhere}
         GROUP BY channel_name
         ORDER BY SUM(uploaded_count) DESC`,
        params
      ),

      query(
        `SELECT user_name AS name,
                SUM(uploaded_count) AS uploaded_count,
                SUM(created_count) AS created_count,
                SUM(published_count) AS published_count,
                (SUM(CASE WHEN uploaded_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(uploaded_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (uploaded_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS uploaded_dur,
                (SUM(CASE WHEN created_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(created_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (created_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS created_dur,
                (SUM(CASE WHEN published_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(published_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (published_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS published_dur
         FROM user_processing_summary
         ${clientWhere}
         GROUP BY user_name
         ORDER BY SUM(uploaded_count) DESC`,
        params
      ),

      query(
        `SELECT input_type AS name,
                SUM(uploaded_count) AS uploaded_count,
                SUM(created_count) AS created_count,
                SUM(published_count) AS published_count,
                (SUM(CASE WHEN uploaded_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(uploaded_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (uploaded_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS uploaded_dur,
                (SUM(CASE WHEN created_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(created_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (created_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS created_dur,
                (SUM(CASE WHEN published_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(published_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (published_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS published_dur
         FROM input_type_processing_summary
         ${clientWhere}
         GROUP BY input_type
         ORDER BY SUM(uploaded_count) DESC`,
        params
      ),

      query(
        `SELECT output_type AS name,
                SUM(uploaded_count) AS uploaded_count,
                SUM(created_count) AS created_count,
                SUM(published_count) AS published_count,
                (SUM(CASE WHEN uploaded_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(uploaded_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (uploaded_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS uploaded_dur,
                (SUM(CASE WHEN created_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(created_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (created_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS created_dur,
                (SUM(CASE WHEN published_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(published_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (published_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS published_dur
         FROM output_type_processing_summary
         ${clientWhere}
         GROUP BY output_type
         ORDER BY SUM(uploaded_count) DESC`,
        params
      ),

      query(
        `SELECT language AS name,
                SUM(uploaded_count) AS uploaded_count,
                SUM(created_count) AS created_count,
                SUM(published_count) AS published_count,
                (SUM(CASE WHEN uploaded_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(uploaded_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (uploaded_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS uploaded_dur,
                (SUM(CASE WHEN created_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(created_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (created_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS created_dur,
                (SUM(CASE WHEN published_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(published_duration_hh_mm_ss::text, '')) != ''
                     THEN EXTRACT(EPOCH FROM (published_duration_hh_mm_ss::text::interval)) ELSE 0 END) || ' seconds')::interval::text AS published_dur
         FROM language_processing_summary
         ${clientWhere}
         GROUP BY language
         ORDER BY SUM(uploaded_count) DESC`,
        params
      ),

      query(
        `SELECT month,
                SUM(total_uploaded) AS total_uploaded,
                SUM(total_created) AS total_created,
                SUM(total_published) AS total_published
         FROM monthly_processing_summary
         ${clientWhere}
         GROUP BY month
         ORDER BY month`,
        params
      ),

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
         WHERE 1=1 ${clientWhereAndCps}`,
        params
      ),
    ]);

    const overall = (overallRes.rows[0] as Record<string, string>) || {};
    const totalUploaded = Number(overall.total_uploaded) || 0;
    const totalProcessed = Number(overall.total_processed) || 0;
    const totalPublished = Number(overall.total_published) || 0;

    const trendData = (
      monthlyRes.rows as {
        month: string;
        total_uploaded: string;
        total_created: string;
        total_published: string;
      }[]
    ).map((r) => ({
      month: r.month,
      uploaded: Number(r.total_uploaded),
      processed: Number(r.total_created),
      published: Number(r.total_published),
    }));

    const clientAggRes = await query(
      `SELECT client_id AS name,
              SUM(uploaded_count) AS uploaded_count,
              SUM(created_count) AS created_count,
              SUM(published_count) AS published_count
       FROM channel_processing_summary
       GROUP BY client_id
       ORDER BY SUM(published_count) DESC`
    );
    const clientBreakdown = toBreakdown(clientAggRes.rows as SummaryRow[]);

    const response = {
      filters: {
        clients: (clientsRes.rows as { client_id: string }[]).map(
          (r) => r.client_id
        ),
      },
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
        avgDuration:
          Math.round((Number(overall.avg_dur) || 0) * 10) / 10,
        dropGap: totalProcessed - totalPublished,
      },
      breakdowns: {
        channel: toBreakdown(channelRes.rows as SummaryRow[]),
        client: clientBreakdown,
        user: toBreakdown(userRes.rows as SummaryRow[]),
        inputType: toBreakdown(inputTypeRes.rows as SummaryRow[]),
        outputType: toBreakdown(outputTypeRes.rows as SummaryRow[]),
        language: toBreakdown(languageRes.rows as SummaryRow[]),
      },
      trend: trendData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Page2 API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
