/**
 * Maps natural language KPI definitions to SQL queries.
 * User input is matched against keywords; first match wins.
 */

export type KPIResultFormat = "number" | "duration" | "percent" | "text";

export interface KPIDefinition {
  id: string;
  label: string;
  keywords: string[];
  sql: string;
  valueColumn: string;
  format: KPIResultFormat;
  description?: string;
}

export const KPI_DEFINITIONS: KPIDefinition[] = [
  {
    id: "total_videos_published",
    label: "Total Videos Published",
    keywords: ["total videos published", "published count", "count published", "videos published", "published videos"],
    sql: `SELECT COUNT(*)::int AS value FROM videos WHERE published_flag = true`,
    valueColumn: "value",
    format: "number",
    description: "Total number of videos that have been published.",
  },
  {
    id: "total_videos_uploaded",
    label: "Total Videos Uploaded",
    keywords: ["total videos uploaded", "uploaded count", "count uploaded", "videos uploaded", "uploaded videos"],
    sql: `SELECT COALESCE(SUM(total_uploaded), 0)::int AS value FROM monthly_processing_summary`,
    valueColumn: "value",
    format: "number",
    description: "Total number of videos uploaded across all clients.",
  },
  {
    id: "total_videos_created",
    label: "Total AI-Generated Content",
    keywords: ["total created", "ai generated", "content created", "created count", "total ai output"],
    sql: `SELECT COALESCE(SUM(total_created), 0)::int AS value FROM monthly_processing_summary`,
    valueColumn: "value",
    format: "number",
    description: "Total AI-generated content pieces created.",
  },
  {
    id: "time_to_market",
    label: "Average Time to Market (hours)",
    keywords: ["time to market", "avg time to market", "average time to market", "ttm", "publish time"],
    sql: `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (published_at - uploaded_at)) / 3600)::numeric, 2) AS value
          FROM videos
          WHERE published_flag = true AND published_at IS NOT NULL AND uploaded_at IS NOT NULL`,
    valueColumn: "value",
    format: "number",
    description: "Average hours from upload to publish.",
  },
  {
    id: "content_waste",
    label: "Content Waste (duration)",
    keywords: ["content waste", "wasted content", "created but not published", "unpublished duration"],
    sql: `WITH agg AS (
            SELECT
              COALESCE(SUM(CASE WHEN total_created_duration IS NOT NULL AND TRIM(COALESCE(total_created_duration::text, '')) != ''
                THEN EXTRACT(EPOCH FROM (total_created_duration::text::interval)) ELSE 0 END), 0)::numeric AS created_sec,
              COALESCE(SUM(CASE WHEN total_published_duration IS NOT NULL AND TRIM(COALESCE(total_published_duration::text, '')) != ''
                THEN EXTRACT(EPOCH FROM (total_published_duration::text::interval)) ELSE 0 END), 0)::numeric AS published_sec
            FROM monthly_duration_summary
          )
          SELECT GREATEST(created_sec - published_sec, 0) AS value FROM agg`,
    valueColumn: "value",
    format: "duration",
    description: "Duration of content created but not published.",
  },
  {
    id: "human_hours_saved",
    label: "Human Hours Saved",
    keywords: ["human hours saved", "hours saved", "time saved", "efficiency hours"],
    sql: `SELECT (COALESCE(SUM(
      CASE WHEN total_uploaded_duration IS NOT NULL AND TRIM(COALESCE(total_uploaded_duration::text, '')) != ''
           THEN EXTRACT(EPOCH FROM (total_uploaded_duration::text::interval))
           ELSE NULL
      END
    ), 0) * 3)::numeric AS total_seconds FROM monthly_duration_summary`,
    valueColumn: "total_seconds",
    format: "duration",
    description: "Uploaded duration × 3 (3x human effort saved).",
  },
  {
    id: "total_channels",
    label: "Total Channels",
    keywords: ["total channels", "number of channels", "channel count", "how many channels"],
    sql: `SELECT COUNT(DISTINCT channel_id)::int AS value FROM channel_processing_summary`,
    valueColumn: "value",
    format: "number",
    description: "Number of unique channels in the system.",
  },
  {
    id: "total_clients",
    label: "Total Clients",
    keywords: ["total clients", "number of clients", "client count", "how many clients"],
    sql: `SELECT COUNT(*)::int AS value FROM clients`,
    valueColumn: "value",
    format: "number",
    description: "Number of unique clients.",
  },
  {
    id: "total_users",
    label: "Total Users",
    keywords: ["total users", "number of users", "user count", "how many users"],
    sql: `SELECT COUNT(*)::int AS value FROM users`,
    valueColumn: "value",
    format: "number",
    description: "Number of unique users.",
  },
  {
    id: "publish_rate",
    label: "Overall Publish Rate (%)",
    keywords: ["publish rate", "publication rate", "publish percentage", "conversion rate", "percentage of content published", "published vs created", "content published vs created"],
    sql: `WITH agg AS (
            SELECT COALESCE(SUM(total_created), 0)::numeric AS created,
                   COALESCE(SUM(total_published), 0)::numeric AS published
            FROM monthly_processing_summary
          )
          SELECT CASE WHEN created = 0 THEN 0
                      ELSE ROUND((published / created * 100)::numeric, 1)
                 END AS value FROM agg`,
    valueColumn: "value",
    format: "percent",
    description: "Published / Created × 100.",
  },
  {
    id: "youtube_published",
    label: "YouTube Published Count",
    keywords: ["youtube published", "youtube count", "youtube videos"],
    sql: `SELECT COALESCE(SUM(youtube_count), 0)::int AS value FROM channel_wise_publishing_counts`,
    valueColumn: "value",
    format: "number",
    description: "Videos published to YouTube.",
  },
  {
    id: "instagram_published",
    label: "Instagram Published Count",
    keywords: ["instagram published", "instagram count", "instagram videos"],
    sql: `SELECT COALESCE(SUM(instagram_count), 0)::int AS value FROM channel_wise_publishing_counts`,
    valueColumn: "value",
    format: "number",
    description: "Videos published to Instagram.",
  },
  {
    id: "linkedin_published",
    label: "LinkedIn Published Count",
    keywords: ["linkedin published", "linkedin count", "linkedin videos"],
    sql: `SELECT COALESCE(SUM(linkedin_count), 0)::int AS value FROM channel_wise_publishing_counts`,
    valueColumn: "value",
    format: "number",
    description: "Videos published to LinkedIn.",
  },
  {
    id: "facebook_published",
    label: "Facebook Published Count",
    keywords: ["facebook published", "facebook count", "facebook videos"],
    sql: `SELECT COALESCE(SUM(facebook_count), 0)::int AS value FROM channel_wise_publishing_counts`,
    valueColumn: "value",
    format: "number",
    description: "Videos published to Facebook.",
  },
  {
    id: "unpublished_count",
    label: "Unpublished Videos",
    keywords: ["unpublished", "not published", "pending publish", "unpublished count"],
    sql: `SELECT COUNT(*)::int AS value FROM videos WHERE published_flag = false`,
    valueColumn: "value",
    format: "number",
    description: "Videos created but not yet published.",
  },
];

/** Phrases that indicate user wants a breakdown (per channel, by client, etc.) - use AI, not predefined */
const BREAKDOWN_PHRASES = [
  "per channel",
  "by channel",
  "each channel",
  "per client",
  "by client",
  "each client",
  "per user",
  "by user",
  "each user",
  "per language",
  "by language",
  "breakdown by",
  "group by",
];

/**
 * Find a matching KPI definition from user input.
 * Returns the first definition whose keywords match (case-insensitive).
 * Skips predefined match when user asks for a breakdown (e.g. "per channel").
 */
export function transcribeKPI(userInput: string): KPIDefinition | null {
  const normalized = userInput.trim().toLowerCase();
  if (!normalized) return null;

  // If user wants a breakdown, don't match predefined "total" KPIs - let AI handle it
  const wantsBreakdown = BREAKDOWN_PHRASES.some((p) => normalized.includes(p));
  if (wantsBreakdown) return null;

  for (const def of KPI_DEFINITIONS) {
    for (const kw of def.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        return def;
      }
    }
  }
  return null;
}

/**
 * Format a raw value for display based on KPI format type.
 */
export function formatKPIValue(
  rawValue: unknown,
  format: KPIResultFormat
): string {
  if (rawValue === null || rawValue === undefined) return "—";

  switch (format) {
    case "number":
      return Number(rawValue).toLocaleString();
    case "percent":
      return `${Number(rawValue).toFixed(1)}%`;
    case "duration": {
      const sec = Number(rawValue);
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    }
    case "text":
    default:
      return String(rawValue);
  }
}
