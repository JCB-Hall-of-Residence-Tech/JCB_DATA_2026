/**
 * AI-powered KPI generator: converts natural language to SQL using Groq.
 * Requires GROQ_API_KEY in environment.
 * Get your key at https://console.groq.com/keys
 */

import OpenAI from "openai";

const DB_SCHEMA = `
PostgreSQL database schema (analytics):

-- Core tables
videos (video_id BIGINT PK, client_id, channel_id, user_id, input_type_name, output_type_name, language_name, duration TEXT, uploaded_at, processed_at, published_at, published_flag BOOLEAN, published_platform, published_url)
clients (client_id VARCHAR PK)
users (client_id, user_id, user_name - PK(client_id, user_id))

-- Summary tables (all have client_id)
monthly_processing_summary (client_id, month, total_uploaded, total_created, total_published)
monthly_duration_summary (client_id, month, total_uploaded_duration TEXT, total_created_duration TEXT, total_published_duration TEXT - durations are interval strings like '01:30:00')
channel_processing_summary (client_id, channel_id, channel_name, uploaded_count, created_count, published_count, uploaded_duration_hh_mm_ss, created_duration_hh_mm_ss, published_duration_hh_mm_ss)
channel_user_processing_summary (client_id, channel_id, user_id, channel_name, user_name, uploaded_count, created_count, published_count, ...)
user_processing_summary (client_id, user_id, user_name, uploaded_count, created_count, published_count, ...)
input_type_processing_summary (client_id, input_type, uploaded_count, created_count, published_count, ...)
output_type_processing_summary (client_id, output_type, uploaded_count, created_count, published_count, ...)
language_processing_summary (client_id, language, uploaded_count, created_count, published_count, ...)
channel_wise_publishing_counts (client_id, channel_id, channel_name, facebook_count, instagram_count, linkedin_count, reels_count, shorts_count, x_count, youtube_count, threads_count)
channel_wise_publishing_duration (client_id, channel_id, channel_name, facebook_duration, instagram_duration, ...)
raw_uploads (id, client_id, data JSONB)
-- Analytics DB Schema
-- 1. Create database (once): createdb -U postgres analytics_db
-- 2. Apply schema: psql -U postgres -d analytics_db -f sql/schema.sql
-- 3. Load data: PGPASSWORD=password npm run db:load

-- ---------------------------------------------------------------------------
-- Reference / dimension tables (PKs only; no FKs between them)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clients (
  client_id VARCHAR(20) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  client_id VARCHAR(20) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, user_id),
  CONSTRAINT fk_users_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------------
-- Fact table: videos (references clients, channels, users)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS videos (
  video_id BIGINT PRIMARY KEY,
  client_id VARCHAR(20) NOT NULL,
  channel_id VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  input_type_id VARCHAR(20),
  input_type_name VARCHAR(100),
  output_type_id VARCHAR(20),
  output_type_name VARCHAR(100),
  language_id VARCHAR(20),
  language_name VARCHAR(20),
  duration TEXT,
  uploaded_at TIMESTAMP,
  processed_at TIMESTAMP,
  published_at TIMESTAMP,
  published_flag BOOLEAN NOT NULL DEFAULT FALSE,
  published_platform VARCHAR(50),
  published_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_videos_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_videos_channel FOREIGN KEY (client_id, channel_id) REFERENCES channels(client_id, channel_id) ON DELETE CASCADE,
  CONSTRAINT fk_videos_user FOREIGN KEY (client_id, user_id) REFERENCES users(client_id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_videos_client ON videos(client_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos(client_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(client_id, user_id);
CREATE INDEX IF NOT EXISTS idx_videos_uploaded ON videos(uploaded_at);

-- ---------------------------------------------------------------------------
-- Summary tables (all reference clients; some reference channel/user)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS monthly_processing_summary (
  client_id VARCHAR(20) NOT NULL,
  month VARCHAR(20) NOT NULL,
  total_uploaded INTEGER NOT NULL DEFAULT 0,
  total_created INTEGER NOT NULL DEFAULT 0,
  total_published INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, month),
  CONSTRAINT fk_monthly_processing_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT chk_monthly_uploaded CHECK (total_uploaded >= 0),
  CONSTRAINT chk_monthly_created CHECK (total_created >= 0),
  CONSTRAINT chk_monthly_published CHECK (total_published >= 0)
);

CREATE TABLE IF NOT EXISTS monthly_duration_summary (
  client_id VARCHAR(20) NOT NULL,
  month VARCHAR(20) NOT NULL,
  total_uploaded_duration TEXT NOT NULL,
  total_created_duration TEXT NOT NULL,
  total_published_duration TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, month),
  CONSTRAINT fk_monthly_duration_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS channel_processing_summary (
  client_id VARCHAR(20) NOT NULL,
  channel_id VARCHAR(30) NOT NULL,
  channel_name VARCHAR(100) NOT NULL,
  uploaded_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  uploaded_duration_hh_mm_ss TEXT,
  created_duration_hh_mm_ss TEXT,
  published_duration_hh_mm_ss TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, channel_id),
  CONSTRAINT fk_channel_summary_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_channel_summary_channel FOREIGN KEY (client_id, channel_id) REFERENCES channels(client_id, channel_id) ON DELETE CASCADE,
  CONSTRAINT chk_channel_uploaded CHECK (uploaded_count >= 0),
  CONSTRAINT chk_channel_created CHECK (created_count >= 0),
  CONSTRAINT chk_channel_published CHECK (published_count >= 0)
);

CREATE TABLE IF NOT EXISTS channel_user_processing_summary (
  client_id VARCHAR(20) NOT NULL,
  channel_id VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  channel_name VARCHAR(100) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  uploaded_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  uploaded_duration_hh_mm_ss TEXT,
  created_duration_hh_mm_ss TEXT,
  published_duration_hh_mm_ss TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, channel_id, user_id),
  CONSTRAINT fk_channel_user_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_channel_user_channel FOREIGN KEY (client_id, channel_id) REFERENCES channels(client_id, channel_id) ON DELETE CASCADE,
  CONSTRAINT fk_channel_user_user FOREIGN KEY (client_id, user_id) REFERENCES users(client_id, user_id) ON DELETE CASCADE,
  CONSTRAINT chk_channel_user_uploaded CHECK (uploaded_count >= 0),
  CONSTRAINT chk_channel_user_created CHECK (created_count >= 0),
  CONSTRAINT chk_channel_user_published CHECK (published_count >= 0)
);

CREATE TABLE IF NOT EXISTS user_processing_summary (
  client_id VARCHAR(20) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  uploaded_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  uploaded_duration_hh_mm_ss TEXT,
  created_duration_hh_mm_ss TEXT,
  published_duration_hh_mm_ss TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, user_id),
  CONSTRAINT fk_user_summary_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_summary_user FOREIGN KEY (client_id, user_id) REFERENCES users(client_id, user_id) ON DELETE CASCADE,
  CONSTRAINT chk_user_uploaded CHECK (uploaded_count >= 0),
  CONSTRAINT chk_user_created CHECK (created_count >= 0),
  CONSTRAINT chk_user_published CHECK (published_count >= 0)
);

CREATE TABLE IF NOT EXISTS input_type_processing_summary (
  client_id VARCHAR(20) NOT NULL,
  input_type VARCHAR(100) NOT NULL,
  uploaded_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  uploaded_duration_hh_mm_ss TEXT,
  created_duration_hh_mm_ss TEXT,
  published_duration_hh_mm_ss TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, input_type),
  CONSTRAINT fk_input_type_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT chk_input_uploaded CHECK (uploaded_count >= 0),
  CONSTRAINT chk_input_created CHECK (created_count >= 0),
  CONSTRAINT chk_input_published CHECK (published_count >= 0)
);

CREATE TABLE IF NOT EXISTS output_type_processing_summary (
  client_id VARCHAR(20) NOT NULL,
  output_type VARCHAR(100) NOT NULL,
  uploaded_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  uploaded_duration_hh_mm_ss TEXT,
  created_duration_hh_mm_ss TEXT,
  published_duration_hh_mm_ss TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, output_type),
  CONSTRAINT fk_output_type_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT chk_output_uploaded CHECK (uploaded_count >= 0),
  CONSTRAINT chk_output_created CHECK (created_count >= 0),
  CONSTRAINT chk_output_published CHECK (published_count >= 0)
);

CREATE TABLE IF NOT EXISTS language_processing_summary (
  client_id VARCHAR(20) NOT NULL,
  language VARCHAR(20) NOT NULL,
  uploaded_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  uploaded_duration_hh_mm_ss TEXT,
  created_duration_hh_mm_ss TEXT,
  published_duration_hh_mm_ss TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, language),
  CONSTRAINT fk_language_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT chk_language_uploaded CHECK (uploaded_count >= 0),
  CONSTRAINT chk_language_created CHECK (created_count >= 0),
  CONSTRAINT chk_language_published CHECK (published_count >= 0)
);

CREATE TABLE IF NOT EXISTS channel_wise_publishing_counts (
  client_id VARCHAR(20) NOT NULL,
  channel_id VARCHAR(30) NOT NULL,
  channel_name VARCHAR(100) NOT NULL,
  facebook_count INTEGER NOT NULL DEFAULT 0,
  instagram_count INTEGER NOT NULL DEFAULT 0,
  linkedin_count INTEGER NOT NULL DEFAULT 0,
  reels_count INTEGER NOT NULL DEFAULT 0,
  shorts_count INTEGER NOT NULL DEFAULT 0,
  x_count INTEGER NOT NULL DEFAULT 0,
  youtube_count INTEGER NOT NULL DEFAULT 0,
  threads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, channel_id),
  CONSTRAINT fk_pub_counts_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_pub_counts_channel FOREIGN KEY (client_id, channel_id) REFERENCES channels(client_id, channel_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS channel_wise_publishing_duration (
  client_id VARCHAR(20) NOT NULL,
  channel_id VARCHAR(30) NOT NULL,
  channel_name VARCHAR(100) NOT NULL,
  facebook_duration TEXT,
  instagram_duration TEXT,
  linkedin_duration TEXT,
  reels_duration TEXT,
  shorts_duration TEXT,
  x_duration TEXT,
  youtube_duration TEXT,
  threads_duration TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, channel_id),
  CONSTRAINT fk_pub_duration_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_pub_duration_channel FOREIGN KEY (client_id, channel_id) REFERENCES channels(client_id, channel_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Raw uploads staging (stores all rows as JSONB; dynamic columns preserved)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw_uploads (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(20),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raw_uploads_client ON raw_uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_raw_uploads_uploaded_at ON raw_uploads(uploaded_at);



Notes:
- Duration columns store interval strings (e.g. '01:30:00'). Use: EXTRACT(EPOCH FROM (col::text::interval)) for seconds.
- published_flag = true means video was published.
- For counts, use COUNT(*) or SUM(column) from summary tables.
`;

export interface GeneratedKPI {
  sql: string;
  label: string;
  valueColumn: string;
  format: "number" | "duration" | "percent" | "text";
  /** For breakdown queries (per channel, by client): column name for the dimension label */
  labelColumn?: string;
  /** True when query returns multiple rows (GROUP BY breakdown) */
  multiRow?: boolean;
}

const FORBIDDEN_PATTERNS = [
  /\b(DROP|DELETE|UPDATE|INSERT|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i,
  /;\s*SELECT/i, // multiple statements
];

function isSafeSQL(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith("SELECT")) return false;
  for (const pat of FORBIDDEN_PATTERNS) {
    if (pat.test(sql)) return false;
  }
  return true;
}

function extractSQL(text: string): string | null {
  const blockMatch = text.match(/```(?:sql)?\s*([\s\S]*?)```/);
  if (blockMatch) {
    return blockMatch[1].trim();
  }
  const lines = text.trim().split("\n");
  const sqlLines: string[] = [];
  for (const line of lines) {
    const upper = line.trim().toUpperCase();
    if (upper.startsWith("SELECT") || (sqlLines.length > 0 && !upper.startsWith("--"))) {
      sqlLines.push(line);
    }
  }
  if (sqlLines.length > 0) return sqlLines.join("\n").trim();
  return null;
}

export async function generateKPIFromPrompt(
  userPrompt: string
): Promise<GeneratedKPI | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const systemPrompt = `You are a SQL expert for a PostgreSQL analytics database. Given a KPI definition in natural language, generate a PostgreSQL SELECT query.

${DB_SCHEMA}

Rules:
1. Return ONLY a valid PostgreSQL SELECT query.
2. For "X per channel", "X by channel", "X per client", "breakdown by Y" etc.: Use GROUP BY and return MULTIPLE rows (one per channel/client/etc). Include a label column (e.g. channel_name, client_id) and a value column. Set multiRow: true, labelColumn: "channel_name" (or the dimension column).
3. For single-value KPIs: Return exactly ONE row with ONE value column. Use alias "value" (or "total_seconds" for duration).
4. Use COALESCE/NULLIF where needed to avoid nulls.
5. For durations: convert interval strings using EXTRACT(EPOCH FROM (col::text::interval)) to get seconds.
6. For "videos published per channel": Use channel_processing_summary (channel_name, published_count) or GROUP BY channel from videos. Return channel_name and published_count.
7. Output format as JSON: { "sql": "...", "label": "Human-readable KPI name", "valueColumn": "value" or "published_count", "labelColumn": "channel_name" (for breakdowns), "format": "number"|"duration"|"percent"|"text", "multiRow": true/false }
8. format: use "number" for counts/ints, "duration" for time (seconds), "percent" for percentages, "text" for strings.
9. Do not include any explanation, only the JSON object.`;

  const userMessage = `Generate a KPI query for: "${userPrompt}"`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) return null;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        sql?: string;
        label?: string;
        valueColumn?: string;
        labelColumn?: string;
        format?: string;
        multiRow?: boolean;
      };
      const sql = parsed.sql?.trim();
      if (!sql || !isSafeSQL(sql)) return null;
      return {
        sql,
        label: parsed.label ?? userPrompt,
        valueColumn: parsed.valueColumn ?? "value",
        labelColumn: parsed.labelColumn,
        format: (parsed.format as GeneratedKPI["format"]) ?? "number",
        multiRow: parsed.multiRow ?? false,
      };
    }
  } catch {
    // fallback
  }

  const sql = extractSQL(content);
  if (!sql || !isSafeSQL(sql)) return null;

  return {
    sql,
    label: userPrompt,
    valueColumn: "value",
    format: "number",
  };
}
