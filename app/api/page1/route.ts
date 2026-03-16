import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export async function GET() {
  try {
    const [
      humanHoursRes,
      timeToMarketRes,
      contentWasteRes,
      clientConcentrationRes,
      totalUploadedCountRes,
      totalUploadedDurRes,
      totalCreatedRes,
      topOutputRes,
      monthlyProcRes,
      monthlyDurRes,
      lifecycleCountRes,
      lifecycleDurRes,
      efficiencyRes,
      topFormatsRes,
      dataHealthRes,
    ] = await Promise.all([
      // 1. Human Hours Saved: SUM(total_uploaded_duration) * 3
      query(`
        SELECT COALESCE(SUM(
          EXTRACT(EPOCH FROM (total_uploaded_duration)::interval)
        ), 0)::numeric AS total_seconds
        FROM monthly_duration_summary
        WHERE total_uploaded_duration IS NOT NULL AND total_uploaded_duration != ''
      `),

      // 2. Time-to-Market: AVG(published_at - uploaded_at)
      query(`
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM (published_at - uploaded_at)) / 3600)::numeric, 2) AS avg_hours
        FROM videos
        WHERE published_flag = true
          AND published_at IS NOT NULL
          AND uploaded_at IS NOT NULL
      `),

      // 3. Content Waste: total_created - total_published duration
      query(`
        WITH agg AS (
          SELECT
            COALESCE(SUM(EXTRACT(EPOCH FROM (total_created_duration)::interval)), 0)::numeric AS created_sec,
            COALESCE(SUM(EXTRACT(EPOCH FROM (total_published_duration)::interval)), 0)::numeric AS published_sec
          FROM monthly_duration_summary
          WHERE total_created_duration IS NOT NULL AND total_created_duration != ''
             OR total_published_duration IS NOT NULL AND total_published_duration != ''
        )
        SELECT GREATEST(created_sec - published_sec, 0) AS waste_seconds FROM agg
      `),

      // 4. Client Concentration Risk: top client duration / total
      query(`
        WITH by_client AS (
          SELECT
            client_id,
            COALESCE(SUM(EXTRACT(EPOCH FROM (uploaded_duration_hh_mm_ss)::interval)), 0)::numeric AS client_sec
          FROM channel_processing_summary
          WHERE uploaded_duration_hh_mm_ss IS NOT NULL AND uploaded_duration_hh_mm_ss != ''
          GROUP BY client_id
        ),
        totals AS (
          SELECT SUM(client_sec) AS total_sec FROM by_client
        )
        SELECT
          (SELECT client_id FROM by_client ORDER BY client_sec DESC LIMIT 1) AS top_client,
          (SELECT client_sec FROM by_client ORDER BY client_sec DESC LIMIT 1) AS top_sec,
          (SELECT total_sec FROM totals) AS total_sec
      `),

      // 5. Total Uploaded (count + duration)
      query(`
        SELECT COALESCE(SUM(total_uploaded), 0)::int AS total_uploaded
        FROM monthly_processing_summary
      `),
      query(`
        SELECT COALESCE(SUM(
          EXTRACT(EPOCH FROM (total_uploaded_duration)::interval)
        ), 0)::numeric AS total_seconds
        FROM monthly_duration_summary
        WHERE total_uploaded_duration IS NOT NULL AND total_uploaded_duration != ''
      `),

      // 6. Total AI-Generated Output
      query(`
        SELECT COALESCE(SUM(total_created), 0)::int AS total_created
        FROM monthly_processing_summary
      `),

      // 7 & 9. Top output type (for multiplier we need both uploaded and created)
      query(`
        SELECT output_type_name, COUNT(*)::int AS cnt
        FROM videos
        WHERE published_flag = true AND output_type_name IS NOT NULL
        GROUP BY output_type_name
        ORDER BY cnt DESC
        LIMIT 1
      `),

      // 8. Monthly processing for PoP and pipeline
      query(`
        SELECT month,
          SUM(total_uploaded)::int AS total_uploaded,
          SUM(total_created)::int AS total_created,
          SUM(total_published)::int AS total_published
        FROM monthly_processing_summary
        GROUP BY month
        ORDER BY month
      `),

      // Monthly duration for trend (human hours by month)
      query(`
        SELECT month, client_id,
          EXTRACT(EPOCH FROM (total_uploaded_duration)::interval)::numeric AS total_seconds
        FROM monthly_duration_summary
        WHERE total_uploaded_duration IS NOT NULL AND total_uploaded_duration != ''
        ORDER BY month, client_id
      `),

      // Lifecycle by client (count)
      query(`
        SELECT client_id, month, SUM(total_uploaded)::int AS total_uploaded
        FROM monthly_processing_summary
        GROUP BY client_id, month
        ORDER BY month, client_id
      `),

      // Lifecycle by client (duration)
      query(`
        SELECT client_id, month,
          EXTRACT(EPOCH FROM (total_uploaded_duration)::interval)::numeric AS total_seconds
        FROM monthly_duration_summary
        WHERE total_uploaded_duration IS NOT NULL AND total_uploaded_duration != ''
        ORDER BY month, client_id
      `),

      // Efficiency Matrix
      query(`
        SELECT client_id, channel_name, created_count, published_count
        FROM channel_processing_summary
        WHERE channel_name IS NOT NULL
        ORDER BY created_count DESC
      `),

      // Top formats over time
      query(`
        SELECT
          TO_CHAR(published_at, 'YYYY-MM') AS month,
          output_type_name AS output_type,
          COUNT(*)::int AS cnt
        FROM videos
        WHERE published_flag = true
          AND published_at IS NOT NULL
          AND output_type_name IS NOT NULL
        GROUP BY TO_CHAR(published_at, 'YYYY-MM'), output_type_name
        ORDER BY month, output_type_name
      `),

      // Data Health Alerts (videos table has no headline column in schema)
      query(`
        SELECT video_id, published_platform, user_id,
          CASE
            WHEN published_platform IS NULL AND (user_id IS NULL OR user_id = '') THEN 'Missing platform & user'
            WHEN published_platform IS NULL THEN 'Missing platform'
            WHEN user_id IS NULL OR user_id = '' THEN 'Missing user'
            ELSE 'Other'
          END AS issue_type
        FROM videos
        WHERE published_flag = true
          AND (published_platform IS NULL OR user_id IS NULL OR user_id = '')
        ORDER BY video_id
        LIMIT 100
      `),
    ]);

    // Parse results
    const humanHoursSec = Number((humanHoursRes.rows[0] as { total_seconds: string })?.total_seconds ?? 0);
    const humanHoursSaved = humanHoursSec * 3;

    const timeToMarketHours = Number((timeToMarketRes.rows[0] as { avg_hours: string })?.avg_hours ?? 0);

    const contentWasteSec = Number((contentWasteRes.rows[0] as { waste_seconds: string })?.waste_seconds ?? 0);

    const ccRow = clientConcentrationRes.rows[0] as { top_sec: string; total_sec: string } | undefined;
    const topSec = Number(ccRow?.top_sec ?? 0);
    const totalSec = Number(ccRow?.total_sec ?? 1);
    const clientConcentrationPct = totalSec > 0 ? (topSec / totalSec) * 100 : 0;

    const totalUploadedCount = Number((totalUploadedCountRes.rows[0] as { total_uploaded: string })?.total_uploaded ?? 0);
    const totalUploadedDurationSec = Number((totalUploadedDurRes.rows[0] as { total_seconds: string })?.total_seconds ?? 0);

    const totalCreated = Number((totalCreatedRes.rows[0] as { total_created: string })?.total_created ?? 0);

    const topOutputRow = topOutputRes.rows[0] as { output_type_name: string } | undefined;
    const topPerformingOutputType = topOutputRow?.output_type_name ?? "—";

    const monthlyRows = monthlyProcRes.rows as { month: string; total_uploaded: string; total_created: string; total_published: string }[];
    const sortedMonths = [...new Set(monthlyRows.map((r) => r.month))].sort();
    const currentMonth = sortedMonths[sortedMonths.length - 1] ?? "";
    const prevMonth = sortedMonths[sortedMonths.length - 2] ?? "";

    const currentRow = monthlyRows.find((r) => r.month === currentMonth);
    const prevRow = monthlyRows.find((r) => r.month === prevMonth);

    const currentUploaded = Number(currentRow?.total_uploaded ?? 0);
    const currentPublished = Number(currentRow?.total_published ?? 0);
    const prevUploaded = Number(prevRow?.total_uploaded ?? 0);
    const prevPublished = Number(prevRow?.total_published ?? 0);

    const currentCombined = currentUploaded + currentPublished;
    const prevCombined = prevUploaded + prevPublished;
    const popGrowthPct =
      prevCombined > 0 ? ((currentCombined - prevCombined) / prevCombined) * 100 : 0;

    // Trend % for each KPI (current vs prev month)
    type MonthlyDurRow = { month: string; total_seconds: string };
    const monthlyDurRows = monthlyDurRes.rows as MonthlyDurRow[];
    const humanHoursCurrent = monthlyDurRows
      .filter((r) => r.month === currentMonth)
      .reduce((s, r) => s + Number(r.total_seconds ?? 0), 0);
    const humanHoursPrev = monthlyDurRows
      .filter((r) => r.month === prevMonth)
      .reduce((s, r) => s + Number(r.total_seconds ?? 0), 0);
    const humanHoursTrendPct =
      humanHoursPrev > 0 ? ((humanHoursCurrent * 3 - humanHoursPrev * 3) / (humanHoursPrev * 3)) * 100 : 0;

    const aiMultiplier = totalUploadedCount > 0 ? totalCreated / totalUploadedCount : 0;

    // Build lifecycle trend by client
    const lifecycleCountRows = lifecycleCountRes.rows as { client_id: string; month: string; total_uploaded: string }[];
    const lifecycleDurRows = lifecycleDurRes.rows as { client_id: string; month: string; total_seconds: string }[];

    const clients = [...new Set(lifecycleCountRows.map((r) => r.client_id))].sort();
    const byClient: Record<string, { month: string; count: number; duration: number }[]> = {};
    for (const c of clients) {
      byClient[c] = [];
    }
    const allMonths = [...new Set(lifecycleCountRows.map((r) => r.month))].sort();
    for (const m of allMonths) {
      for (const c of clients) {
        const countRow = lifecycleCountRows.find((r) => r.client_id === c && r.month === m);
        const durRow = lifecycleDurRows.find((r) => r.client_id === c && r.month === m);
        byClient[c].push({
          month: m,
          count: Number(countRow?.total_uploaded ?? 0),
          duration: Number(durRow?.total_seconds ?? 0),
        });
      }
    }

    // Pipeline stats monthly
    const pipelineMonthly = monthlyRows.map((r) => ({
      month: r.month,
      uploaded: Number(r.total_uploaded),
      created: Number(r.total_created),
    }));

    // Efficiency matrix (EfficiencyMatrix expects created_count, published_count, publish_rate)
    const efficiencyMatrix = (efficiencyRes.rows as { client_id: string; channel_name: string; created_count: string; published_count: string }[]).map((r) => {
      const created = Number(r.created_count);
      const published = Number(r.published_count);
      return {
        client_id: r.client_id,
        channel_name: r.channel_name,
        created_count: created,
        published_count: published,
        publish_rate: created > 0 ? Math.round((published / created) * 1000) / 10 : 0,
      };
    });

    // Top formats over time - reshape for stacked chart
    const topFormatsRows = topFormatsRes.rows as { month: string; output_type: string; cnt: string }[];
    const topFormatsByMonth = new Map<string, Record<string, number>>();
    for (const r of topFormatsRows) {
      if (!topFormatsByMonth.has(r.month)) topFormatsByMonth.set(r.month, {});
      const row = topFormatsByMonth.get(r.month)!;
      row[r.output_type] = Number(r.cnt);
    }
    const topFormatsOverTime = Array.from(topFormatsByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, types]) => ({ month, ...types }));

    const outputTypes = [...new Set(topFormatsRows.map((r) => r.output_type))].sort();

    // Data health alerts
    const dataHealthAlerts = (dataHealthRes.rows as { video_id: string; published_platform: string | null; user_id: string; issue_type: string }[]).map((r) => ({
      video_id: r.video_id,
      headline: "—",
      published_platform: r.published_platform ?? "—",
      user_id: r.user_id ?? "—",
      issue_type: r.issue_type,
    }));

    // Trend for time-to-market: compare current vs prev month avg
    const timeToMarketTrendPct = 0; // Would need per-month velocity query - skip for now
    const contentWasteTrendPct = 0;
    const clientConcentrationTrendPct = 0;
    const totalUploadedTrendPct = prevUploaded > 0 ? ((currentUploaded - prevUploaded) / prevUploaded) * 100 : 0;
    const totalCreatedTrendPct = prevRow ? (Number(prevRow.total_created) > 0 ? ((currentRow ? Number(currentRow.total_created) : 0) - Number(prevRow.total_created)) / Number(prevRow.total_created) * 100 : 0) : 0;
    const aiMultiplierTrendPct = 0; // Derived metric

    const response = {
      kpis: {
        humanHoursSaved: Math.round(humanHoursSaved / 3600),
        humanHoursSavedFormatted: formatDuration(humanHoursSaved),
        humanHoursTrendPct,

        timeToMarketHours: Math.round(timeToMarketHours * 10) / 10,
        timeToMarketTrendPct,

        contentWasteFormatted: formatDuration(contentWasteSec),
        contentWasteSeconds: contentWasteSec,
        contentWasteTrendPct,

        clientConcentrationPct: Math.round(clientConcentrationPct * 10) / 10,
        clientConcentrationTrendPct,

        totalUploadedCount,
        totalUploadedDurationFormatted: formatDuration(totalUploadedDurationSec),
        totalUploadedTrendPct,

        totalCreated,
        totalCreatedTrendPct,

        aiContentMultiplier: Math.round(aiMultiplier * 10) / 10,
        aiMultiplierTrendPct,

        periodOverPeriodGrowthPct: Math.round(popGrowthPct * 10) / 10,

        topPerformingOutputType,
      },
      lifecycleTrend: { byClient: byClient, clients },
      pipelineStats: {
        totalUploaded: totalUploadedCount,
        totalProcessed: totalCreated,
        monthly: pipelineMonthly,
      },
      efficiencyMatrix,
      topFormatsOverTime,
      topFormatsOutputTypes: outputTypes,
      dataHealthAlerts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Page1 API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CEO dashboard data" },
      { status: 500 }
    );
  }
}
