/**
 * Data ingestion pipeline: parse uploads, map to schema, insert into videos,
 * and recompute summary tables.
 */

import { pool } from "@/lib/db";
import type { PoolClient } from "pg";

/** Normalize date strings to ISO (YYYY-MM-DD HH:MM:SS) for PostgreSQL */
function toTimestamp(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s) return null;
  // Already ISO-like (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmy) {
    const [, day, month, year, h = "0", m = "0", sec = "0"] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${h.padStart(2, "0")}:${m.padStart(2, "0")}:${sec.padStart(2, "0")}`;
  }
  return s;
}

function slugify(str: string, maxLen = 30): string {
  if (!str || typeof str !== "string") return "unknown";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, maxLen) || "unknown";
}

function toVideoRow(raw: Record<string, unknown>): Record<string, unknown> | null {
  const clientId = String(raw.client_id ?? raw.clientId ?? "").trim();
  const channelName = String(raw.channel_name ?? raw.channelName ?? raw.channel ?? "").trim();
  const userName = String(raw.user_name ?? raw.userName ?? raw.user ?? "").trim();
  const videoId = raw.video_id ?? raw.videoId;

  if (!clientId || !channelName || !userName) return null;
  if (videoId === undefined || videoId === null || videoId === "") return null;

  const channelId = (raw.channel_id ?? raw.channelId ?? slugify(channelName)) as string;
  const userId = (raw.user_id ?? raw.userId ?? slugify(userName)) as string;

  const publishedFlag = raw.published_flag ?? raw.publishedFlag ?? raw.published ?? false;
  const published = ["true", "1", "yes", "y"].includes(String(publishedFlag).toLowerCase());

  return {
    video_id: Number(videoId) || videoId,
    client_id: clientId.slice(0, 20),
    channel_id: String(channelId).slice(0, 30),
    user_id: String(userId).slice(0, 30),
    input_type_id: raw.input_type_id ?? raw.inputTypeId ?? null,
    input_type_name: raw.input_type_name ?? raw.inputTypeName ?? null,
    output_type_id: raw.output_type_id ?? raw.outputTypeId ?? null,
    output_type_name: raw.output_type_name ?? raw.outputTypeName ?? null,
    language_id: raw.language_id ?? raw.languageId ?? null,
    language_name: raw.language_name ?? raw.languageName ?? null,
    duration: raw.duration != null && String(raw.duration).trim() ? String(raw.duration) : null,
    uploaded_at: toTimestamp(raw.uploaded_at ?? raw.uploadedAt),
    processed_at: toTimestamp(raw.processed_at ?? raw.processedAt),
    published_at: toTimestamp(raw.published_at ?? raw.publishedAt),
    published_flag: published,
    published_platform: raw.published_platform ?? raw.publishedPlatform ?? null,
    published_url: raw.published_url ?? raw.publishedUrl ?? null,
  };
}

export async function ingestRows(
  rows: Record<string, unknown>[],
  client?: PoolClient
): Promise<{ rawInserted: number; videosInserted: number; errors: string[] }> {
  const pg = client ?? await pool.connect();
  const release = !client;
  const errors: string[] = [];
  let rawInserted = 0;
  let videosInserted = 0;

  try {
    // 1. Insert into raw_uploads (full row as JSONB)
    for (const row of rows) {
      const clientId = (row.client_id ?? row.clientId ?? null) as string | null;
      try {
        await pg.query(
          `INSERT INTO raw_uploads (client_id, data) VALUES ($1, $2::jsonb)`,
          [clientId ? String(clientId).slice(0, 20) : null, JSON.stringify(row)]
        );
        rawInserted++;
      } catch (e) {
        errors.push(`raw_uploads: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 2. Map to video rows
    const videoRows: Record<string, unknown>[] = [];
    for (const row of rows) {
      const mapped = toVideoRow(row);
      if (mapped) videoRows.push(mapped);
    }

    if (videoRows.length === 0) {
      return { rawInserted, videosInserted, errors };
    }

    // 3. Upsert clients
    const clientIds = [...new Set(videoRows.map((r) => r.client_id as string))];
    for (const cid of clientIds) {
      try {
        await pg.query(
          `INSERT INTO clients (client_id) VALUES ($1) ON CONFLICT (client_id) DO NOTHING`,
          [cid]
        );
      } catch (e) {
        // clients table might not exist; continue
      }
    }

    // 4. Upsert users (channels table not used — channel_id comes from videos)
    const userKeys = new Set<string>();
    for (const r of videoRows) {
      const key = `${r.client_id}|${r.user_id}`;
      if (!userKeys.has(key)) {
        userKeys.add(key);
        try {
          await pg.query(
            `INSERT INTO users (client_id, user_id, user_name) VALUES ($1, $2, $3)
             ON CONFLICT (client_id, user_id) DO UPDATE SET user_name = EXCLUDED.user_name`,
            [r.client_id, r.user_id, r.user_name ?? r.user_id]
          );
        } catch (e) {
          // users table might not exist
        }
      }
    }

    // 5. Upsert videos
    for (const r of videoRows) {
      try {
        const res = await pg.query(
          `INSERT INTO videos (
            video_id, client_id, channel_id, user_id,
            input_type_id, input_type_name, output_type_id, output_type_name,
            language_id, language_name, duration,
            uploaded_at, processed_at, published_at, published_flag,
            published_platform, published_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (video_id) DO UPDATE SET
            client_id = EXCLUDED.client_id,
            channel_id = EXCLUDED.channel_id,
            user_id = EXCLUDED.user_id,
            input_type_id = EXCLUDED.input_type_id,
            input_type_name = EXCLUDED.input_type_name,
            output_type_id = EXCLUDED.output_type_id,
            output_type_name = EXCLUDED.output_type_name,
            language_id = EXCLUDED.language_id,
            language_name = EXCLUDED.language_name,
            duration = EXCLUDED.duration,
            uploaded_at = EXCLUDED.uploaded_at,
            processed_at = EXCLUDED.processed_at,
            published_at = EXCLUDED.published_at,
            published_flag = EXCLUDED.published_flag,
            published_platform = EXCLUDED.published_platform,
            published_url = EXCLUDED.published_url`,
          [
            r.video_id,
            r.client_id,
            r.channel_id,
            r.user_id,
            r.input_type_id ?? null,
            r.input_type_name ?? null,
            r.output_type_id ?? null,
            r.output_type_name ?? null,
            r.language_id ?? null,
            r.language_name ?? null,
            r.duration ?? null,
            r.uploaded_at ?? null,
            r.processed_at ?? null,
            r.published_at ?? null,
            r.published_flag ?? false,
            r.published_platform ?? null,
            r.published_url ?? null,
          ]
        );
        if (res.rowCount === 1) videosInserted++;
      } catch (e) {
        errors.push(`videos: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 6. Recompute summary tables (only if videos were inserted/updated)
    if (videosInserted > 0) {
      await recomputeSummaryTables(pg);
    }
  } finally {
    if (release) pg.release();
  }

  return { rawInserted, videosInserted, errors };
}

async function recomputeSummaryTables(pg: PoolClient): Promise<void> {
  const tables = [
    "channel_processing_summary",
    "channel_user_processing_summary",
    "user_processing_summary",
    "input_type_processing_summary",
    "output_type_processing_summary",
    "language_processing_summary",
    "monthly_processing_summary",
    "monthly_duration_summary",
    "channel_wise_publishing_counts",
    "channel_wise_publishing_duration",
  ];

  await pg.query("BEGIN");
  try {
    for (const table of tables) {
      await runAggregation(pg, table);
    }
    await pg.query("COMMIT");
  } catch (e) {
    await pg.query("ROLLBACK");
    throw e;
  }
}

/** SQL expression: parse videos.duration (TEXT) to seconds. Handles "00:05:20", "320", null, empty. Never passes "" to ::interval. */
const DUR_SECS = `CASE
  WHEN v.duration IS NULL OR TRIM(COALESCE(v.duration::text, '')) = '' THEN 0
  ELSE COALESCE(EXTRACT(EPOCH FROM (v.duration::text::interval))::numeric, 0)
END`;

/** SQL expression: sum duration seconds and return as INTERVAL (matches DB column type) */
function durSum(filter: string): string {
  return `(FLOOR(COALESCE(SUM(${DUR_SECS}) FILTER (${filter}), 0))::bigint || ' seconds')::interval`;
}

async function runAggregation(pg: PoolClient, table: string): Promise<void> {
  switch (table) {
    case "channel_processing_summary": {
      await pg.query(`DELETE FROM channel_processing_summary`);
      await pg.query(`
        INSERT INTO channel_processing_summary (client_id, channel_id, channel_name, uploaded_count, created_count, published_count, uploaded_duration_hh_mm_ss, created_duration_hh_mm_ss, published_duration_hh_mm_ss)
        SELECT v.client_id, v.channel_id, v.channel_id AS channel_name,
               COUNT(*) FILTER (WHERE v.uploaded_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.processed_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.published_flag)::int,
               ${durSum("WHERE v.uploaded_at IS NOT NULL")},
               ${durSum("WHERE v.processed_at IS NOT NULL")},
               ${durSum("WHERE v.published_flag")}
        FROM videos v
        GROUP BY v.client_id, v.channel_id
      `);
      break;
    }
    case "channel_user_processing_summary": {
      await pg.query(`DELETE FROM channel_user_processing_summary`);
      await pg.query(`
        INSERT INTO channel_user_processing_summary (client_id, channel_id, user_id, channel_name, user_name, uploaded_count, created_count, published_count, uploaded_duration_hh_mm_ss, created_duration_hh_mm_ss, published_duration_hh_mm_ss)
        SELECT v.client_id, v.channel_id, v.user_id,
               v.channel_id AS channel_name, COALESCE(u.user_name, v.user_id) AS user_name,
               COUNT(*) FILTER (WHERE v.uploaded_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.processed_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.published_flag)::int,
               ${durSum("WHERE v.uploaded_at IS NOT NULL")},
               ${durSum("WHERE v.processed_at IS NOT NULL")},
               ${durSum("WHERE v.published_flag")}
        FROM videos v
        LEFT JOIN users u ON v.client_id = u.client_id AND v.user_id = u.user_id
        GROUP BY v.client_id, v.channel_id, v.user_id, COALESCE(u.user_name, v.user_id)
      `);
      break;
    }
    case "user_processing_summary": {
      await pg.query(`DELETE FROM user_processing_summary`);
      await pg.query(`
        INSERT INTO user_processing_summary (client_id, user_id, user_name, uploaded_count, created_count, published_count, uploaded_duration_hh_mm_ss, created_duration_hh_mm_ss, published_duration_hh_mm_ss)
        SELECT v.client_id, v.user_id, COALESCE(u.user_name, v.user_id),
               COUNT(*) FILTER (WHERE v.uploaded_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.processed_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.published_flag)::int,
               ${durSum("WHERE v.uploaded_at IS NOT NULL")},
               ${durSum("WHERE v.processed_at IS NOT NULL")},
               ${durSum("WHERE v.published_flag")}
        FROM videos v
        LEFT JOIN users u ON v.client_id = u.client_id AND v.user_id = u.user_id
        GROUP BY v.client_id, v.user_id, COALESCE(u.user_name, v.user_id)
      `);
      break;
    }
    case "input_type_processing_summary": {
      await pg.query(`DELETE FROM input_type_processing_summary`);
      await pg.query(`
        INSERT INTO input_type_processing_summary (client_id, input_type, uploaded_count, created_count, published_count, uploaded_duration_hh_mm_ss, created_duration_hh_mm_ss, published_duration_hh_mm_ss)
        SELECT v.client_id, COALESCE(v.input_type_name, 'unknown'),
               COUNT(*) FILTER (WHERE v.uploaded_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.processed_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.published_flag)::int,
               ${durSum("WHERE v.uploaded_at IS NOT NULL")},
               ${durSum("WHERE v.processed_at IS NOT NULL")},
               ${durSum("WHERE v.published_flag")}
        FROM videos v
        GROUP BY v.client_id, COALESCE(v.input_type_name, 'unknown')
      `);
      break;
    }
    case "output_type_processing_summary": {
      await pg.query(`DELETE FROM output_type_processing_summary`);
      await pg.query(`
        INSERT INTO output_type_processing_summary (client_id, output_type, uploaded_count, created_count, published_count, uploaded_duration_hh_mm_ss, created_duration_hh_mm_ss, published_duration_hh_mm_ss)
        SELECT v.client_id, COALESCE(v.output_type_name, 'unknown'),
               COUNT(*) FILTER (WHERE v.uploaded_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.processed_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.published_flag)::int,
               ${durSum("WHERE v.uploaded_at IS NOT NULL")},
               ${durSum("WHERE v.processed_at IS NOT NULL")},
               ${durSum("WHERE v.published_flag")}
        FROM videos v
        GROUP BY v.client_id, COALESCE(v.output_type_name, 'unknown')
      `);
      break;
    }
    case "language_processing_summary": {
      await pg.query(`DELETE FROM language_processing_summary`);
      await pg.query(`
        INSERT INTO language_processing_summary (client_id, language, uploaded_count, created_count, published_count, uploaded_duration_hh_mm_ss, created_duration_hh_mm_ss, published_duration_hh_mm_ss)
        SELECT v.client_id, COALESCE(v.language_name, 'unknown'),
               COUNT(*) FILTER (WHERE v.uploaded_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.processed_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.published_flag)::int,
               ${durSum("WHERE v.uploaded_at IS NOT NULL")},
               ${durSum("WHERE v.processed_at IS NOT NULL")},
               ${durSum("WHERE v.published_flag")}
        FROM videos v
        GROUP BY v.client_id, COALESCE(v.language_name, 'unknown')
      `);
      break;
    }
    case "monthly_processing_summary": {
      await pg.query(`DELETE FROM monthly_processing_summary`);
      await pg.query(`
        INSERT INTO monthly_processing_summary (client_id, month, total_uploaded, total_created, total_published)
        SELECT v.client_id, TO_CHAR(COALESCE(v.uploaded_at, v.published_at, v.processed_at, NOW()), 'YYYY-MM'),
               COUNT(*) FILTER (WHERE v.uploaded_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.processed_at IS NOT NULL)::int,
               COUNT(*) FILTER (WHERE v.published_flag)::int
        FROM videos v
        GROUP BY v.client_id, TO_CHAR(COALESCE(v.uploaded_at, v.published_at, v.processed_at, NOW()), 'YYYY-MM')
      `);
      break;
    }
    case "monthly_duration_summary": {
      await pg.query(`DELETE FROM monthly_duration_summary`);
      await pg.query(`
        INSERT INTO monthly_duration_summary (client_id, month, total_uploaded_duration, total_created_duration, total_published_duration)
        SELECT v.client_id, TO_CHAR(COALESCE(v.uploaded_at, v.published_at, v.processed_at, NOW()), 'YYYY-MM'),
               ${durSum("WHERE v.uploaded_at IS NOT NULL")},
               ${durSum("WHERE v.processed_at IS NOT NULL")},
               ${durSum("WHERE v.published_flag")}
        FROM videos v
        GROUP BY v.client_id, TO_CHAR(COALESCE(v.uploaded_at, v.published_at, v.processed_at, NOW()), 'YYYY-MM')
      `);
      break;
    }
    case "channel_wise_publishing_counts": {
      await pg.query(`DELETE FROM channel_wise_publishing_counts`);
      await pg.query(`
        INSERT INTO channel_wise_publishing_counts (client_id, channel_id, channel_name, facebook_count, instagram_count, linkedin_count, reels_count, shorts_count, x_count, youtube_count, threads_count)
        SELECT v.client_id, v.channel_id, v.channel_id AS channel_name,
               COUNT(*) FILTER (WHERE LOWER(v.published_platform::text) = 'facebook')::int,
               COUNT(*) FILTER (WHERE LOWER(v.published_platform::text) = 'instagram')::int,
               COUNT(*) FILTER (WHERE LOWER(v.published_platform::text) = 'linkedin')::int,
               COUNT(*) FILTER (WHERE LOWER(v.published_platform::text) = 'reels')::int,
               COUNT(*) FILTER (WHERE LOWER(v.published_platform::text) = 'shorts')::int,
               COUNT(*) FILTER (WHERE LOWER(v.published_platform::text) IN ('x', 'twitter'))::int,
               COUNT(*) FILTER (WHERE LOWER(v.published_platform::text) = 'youtube')::int,
               COUNT(*) FILTER (WHERE LOWER(v.published_platform::text) = 'threads')::int
        FROM videos v
        WHERE v.published_flag
        GROUP BY v.client_id, v.channel_id
      `);
      break;
    }
    case "channel_wise_publishing_duration": {
      const platDur = (plat: string) =>
        `(FLOOR(COALESCE(SUM(${DUR_SECS}) FILTER (WHERE v.published_flag AND LOWER(v.published_platform::text) = '${plat}'), 0))::bigint || ' seconds')::interval`;
      await pg.query(`DELETE FROM channel_wise_publishing_duration`);
      await pg.query(`
        INSERT INTO channel_wise_publishing_duration (client_id, channel_id, channel_name, facebook_duration, instagram_duration, linkedin_duration, reels_duration, shorts_duration, x_duration, youtube_duration, threads_duration)
        SELECT v.client_id, v.channel_id, v.channel_id AS channel_name,
               ${platDur("facebook")}, ${platDur("instagram")}, ${platDur("linkedin")}, ${platDur("reels")}, ${platDur("shorts")},
               (FLOOR(COALESCE(SUM(${DUR_SECS}) FILTER (WHERE v.published_flag AND LOWER(v.published_platform::text) IN ('x', 'twitter')), 0))::bigint || ' seconds')::interval,
               ${platDur("youtube")}, ${platDur("threads")}
        FROM videos v
        WHERE v.published_flag
        GROUP BY v.client_id, v.channel_id
      `);
      break;
    }
    default:
      break;
  }
}
