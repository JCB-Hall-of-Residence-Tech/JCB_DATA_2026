import { pool } from "@/lib/db";

export async function GET() {
  const client = await pool.connect();
  try {

    const [
      efficiencyRes,
      clientsRes,
      usersRes,
      monthlyContribRes,
      clientShareRes,
      languageByClientRes,
    ] = await Promise.all([
      // 1. Efficiency Matrix – channel_processing_summary (include client_id for filtering)
      client.query<{
        client_id: string;
        channel_name: string;
        created_count: number;
        published_count: number;
        publish_rate: number;
      }>(`
        SELECT
          client_id,
          channel_name,
          COALESCE(created_count, 0)::int AS created_count,
          COALESCE(published_count, 0)::int AS published_count,
          CASE WHEN COALESCE(created_count, 0) = 0 THEN 0
               ELSE ROUND(COALESCE(published_count, 0)::numeric / created_count * 100, 1)
          END AS publish_rate
        FROM channel_processing_summary
        WHERE channel_name IS NOT NULL
        ORDER BY created_count DESC
      `),

      // 2. Clients ranked by published count (from channel_processing_summary)
      client.query<{
        client_id: string;
        published_count: number;
        created_count: number;
        publish_rate: number;
      }>(`
        SELECT
          client_id,
          COALESCE(SUM(published_count), 0)::int AS published_count,
          COALESCE(SUM(created_count), 0)::int AS created_count,
          CASE WHEN COALESCE(SUM(created_count), 0) = 0 THEN 0
               ELSE ROUND(COALESCE(SUM(published_count), 0)::numeric / SUM(created_count) * 100, 1)
          END AS publish_rate
        FROM channel_processing_summary
        WHERE client_id IS NOT NULL
        GROUP BY client_id
        ORDER BY published_count DESC
      `),

      // 3. All users with their client_id, ranked by published count
      client.query<{
        client_id: string;
        user_name: string;
        published_count: number;
        created_count: number;
        publish_rate: number;
      }>(`
        SELECT
          client_id,
          user_name,
          COALESCE(published_count, 0)::int AS published_count,
          COALESCE(created_count, 0)::int AS created_count,
          CASE WHEN COALESCE(created_count, 0) = 0 THEN 0
               ELSE ROUND(COALESCE(published_count, 0)::numeric / created_count * 100, 1)
          END AS publish_rate
        FROM user_processing_summary
        WHERE user_name IS NOT NULL AND client_id IS NOT NULL
        ORDER BY published_count DESC
      `),

      // 4. Monthly client contribution (stacked area)
      client.query<{
        client_id: string;
        month: string;
        created_hours: number;
      }>(`
        SELECT client_id, month,
          ROUND(CASE WHEN total_created_duration IS NOT NULL AND TRIM(COALESCE(total_created_duration::text, '')) != ''
            THEN EXTRACT(EPOCH FROM (total_created_duration::text::interval)) ELSE 0 END / 3600, 1)::numeric AS created_hours
        FROM monthly_duration_summary
        ORDER BY month, client_id
      `),

      // 5. Client share of billing hours
      client.query<{
        client_id: string;
        created_hours: number;
        published_hours: number;
        uploaded_hours: number;
      }>(`
        SELECT client_id,
          ROUND(SUM(CASE WHEN total_created_duration IS NOT NULL AND TRIM(COALESCE(total_created_duration::text, '')) != ''
            THEN EXTRACT(EPOCH FROM (total_created_duration::text::interval)) ELSE 0 END) / 3600, 1)::numeric AS created_hours,
          ROUND(SUM(CASE WHEN total_published_duration IS NOT NULL AND TRIM(COALESCE(total_published_duration::text, '')) != ''
            THEN EXTRACT(EPOCH FROM (total_published_duration::text::interval)) ELSE 0 END) / 3600, 1)::numeric AS published_hours,
          ROUND(SUM(CASE WHEN total_uploaded_duration IS NOT NULL AND TRIM(COALESCE(total_uploaded_duration::text, '')) != ''
            THEN EXTRACT(EPOCH FROM (total_uploaded_duration::text::interval)) ELSE 0 END) / 3600, 1)::numeric AS uploaded_hours
        FROM monthly_duration_summary
        GROUP BY client_id ORDER BY created_hours DESC
      `),

      // 6. Language × Client (for LanguageHeatmap)
      client.query<{
        client_id: string;
        language: string;
        uploaded_hours: number;
        created_hours: number;
        published_hours: number;
        uploaded_count: number;
        created_count: number;
        published_count: number;
      }>(`
        SELECT client_id, language,
          ROUND(SUM(CASE WHEN uploaded_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(uploaded_duration_hh_mm_ss::text, '')) != ''
            THEN EXTRACT(EPOCH FROM (uploaded_duration_hh_mm_ss::text::interval)) ELSE 0 END)/3600, 1)::numeric AS uploaded_hours,
          ROUND(SUM(CASE WHEN created_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(created_duration_hh_mm_ss::text, '')) != ''
            THEN EXTRACT(EPOCH FROM (created_duration_hh_mm_ss::text::interval)) ELSE 0 END)/3600, 1)::numeric AS created_hours,
          ROUND(SUM(CASE WHEN published_duration_hh_mm_ss IS NOT NULL AND TRIM(COALESCE(published_duration_hh_mm_ss::text, '')) != ''
            THEN EXTRACT(EPOCH FROM (published_duration_hh_mm_ss::text::interval)) ELSE 0 END)/3600, 1)::numeric AS published_hours,
          SUM(uploaded_count)::int AS uploaded_count,
          SUM(created_count)::int AS created_count,
          SUM(published_count)::int AS published_count
        FROM language_processing_summary
        GROUP BY client_id, language ORDER BY client_id, created_hours DESC
      `),
    ]);

    // Build monthlyContribution + clientIds
    const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const formatMonth = (ym: string) => {
      const [y, m] = String(ym).split("-");
      const idx = parseInt(m || "1", 10) - 1;
      return `${MONTH_NAMES[idx] ?? m}, ${y ?? ""}`;
    };
    const monthMap = new Map<string, Record<string, number>>();
    const clientIds = new Set<string>();
    for (const r of monthlyContribRes.rows) {
      clientIds.add(r.client_id);
      if (!monthMap.has(r.month)) monthMap.set(r.month, {});
      monthMap.get(r.month)![r.client_id] = Number(r.created_hours);
    }
    const sortedMonths = [...monthMap.keys()].sort();
    const monthlyContribution = sortedMonths.map((ym) => ({ month: formatMonth(ym), ...monthMap.get(ym)! }));

    // Build languageMatrix (LanguageHeatmap expects same shape as page4)
    const languages = new Set<string>();
    const langMatrix: Record<
      string,
      Record<
        string,
        {
          uploadedHours: number;
          processingHours: number;
          publishedHours: number;
          uploadedCount: number;
          processingCount: number;
          publishedCount: number;
          hours: number;
          published: number;
        }
      >
    > = {};
    for (const r of languageByClientRes.rows) {
      languages.add(r.language);
      if (!langMatrix[r.client_id]) langMatrix[r.client_id] = {};
      langMatrix[r.client_id][r.language] = {
        uploadedHours: Number(r.uploaded_hours),
        processingHours: Number(r.created_hours),
        publishedHours: Number(r.published_hours),
        uploadedCount: Number(r.uploaded_count),
        processingCount: Number(r.created_count),
        publishedCount: Number(r.published_count),
        hours: Number(r.created_hours),
        published: Number(r.published_count),
      };
    }

    return Response.json({
      efficiency: efficiencyRes.rows.map((r) => ({
        client_id: r.client_id,
        channel_name: r.channel_name,
        created_count: Number(r.created_count),
        published_count: Number(r.published_count),
        publish_rate: Number(r.publish_rate),
      })),
      clientRanking: clientsRes.rows.map((r) => ({
        client_id: r.client_id,
        published_count: Number(r.published_count),
        created_count: Number(r.created_count),
        publish_rate: Number(r.publish_rate),
      })),
      usersByClient: usersRes.rows.map((r) => ({
        client_id: r.client_id,
        user_name: r.user_name,
        published_count: Number(r.published_count),
        created_count: Number(r.created_count),
        publish_rate: Number(r.publish_rate),
      })),
      monthlyContribution,
      clientIds: Array.from(clientIds).sort(),
      clientShare: clientShareRes.rows.map((r) => ({
        client_id: r.client_id,
        createdHours: Number(r.created_hours),
        publishedHours: Number(r.published_hours),
        uploadedHours: Number(r.uploaded_hours),
      })),
      languageMatrix: {
        clients: Object.keys(langMatrix).sort(),
        languages: Array.from(languages).sort(),
        data: langMatrix,
      },
    });
  } catch (err) {
    console.error("Page3 API failed", err);
    return Response.json(
      { error: "Page3 API failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
