# Actionable Insights Architecture

## Overview

When a user clicks a KPI or plot, they see an LLM-generated actionable insight using **Gemini**. To avoid expensive, slow API calls on every page load, insights are **cached in the database** and only recomputed when the underlying data changes.

## Setup

1. **Environment variables** (each developer must create `.env.local` locally; this file is git-ignored):

   ```env
   # Gemini API for actionable insights
   GEMINI_API_KEY=your_gemini_api_key_here

   # Optional: override default model (defaults to gemini-1.5-flash)
   GEMINI_MODEL=gemini-1.5-flash
   ```

2. **Database**: Run `sql/actionable_insights.sql` to create the cache table.

---

## Problem Statement

| Concern | Without caching | With DB caching |
|---------|-----------------|-----------------|
| **Filter combinations** | Page 2: `All Clients` + each client = N+1 combinations. Each breakdown (channel, user, input type, etc.) × each filter = many combinations | Compute once per combination, store, serve from DB |
| **LLM latency** | 2–5+ seconds per insight | 0ms (cache hit) or 2–5s only on first click / after data change |
| **API cost** | Every page load × every widget × every filter | One inference per unique (page, widget, filters) until data changes |
| **User experience** | Slow, inconsistent | Fast after first load |

---

## Design Principles

1. **Compute once, serve many** — Store insights in PostgreSQL.
2. **Invalidate on data change** — When `recomputeSummaryTables()` runs (after upload), invalidate or delete affected insights.
3. **Lazy computation** — Compute on first click (cache miss), not proactively for all combinations.
4. **Deterministic cache key** — Same (page, widget, filters) always maps to same insight row.

---

## Database Schema

```sql
-- Add to sql/schema.sql

CREATE TABLE IF NOT EXISTS actionable_insights (
  id SERIAL PRIMARY KEY,
  page_id VARCHAR(50) NOT NULL,
  widget_id VARCHAR(100) NOT NULL,
  filter_hash VARCHAR(500) NOT NULL,
  insight_text TEXT NOT NULL,
  context_data JSONB,
  data_version BIGINT NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_id, widget_id, filter_hash)
);

CREATE INDEX IF NOT EXISTS idx_insights_lookup 
  ON actionable_insights(page_id, widget_id, filter_hash);

-- Tracks "data version" - increment when summary tables are recomputed
-- Used to invalidate stale insights without deleting rows eagerly
CREATE TABLE IF NOT EXISTS insight_data_version (
  id INT PRIMARY KEY DEFAULT 1,
  version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Alternative (simpler):** Delete all insights when data changes instead of versioning. Fewer tables, easier logic.

```sql
-- Simpler: just delete all insights when recomputeSummaryTables runs
-- No data_version table needed
```

---

## Cache Key Structure

| Field | Example | Description |
|-------|---------|-------------|
| `page_id` | `page1`, `page2`, `page3`, `page4`, `page5` | Dashboard page |
| `widget_id` | `kpi_publish_rate`, `funnel_bars`, `breakdown_channel`, `lifecycle_trend` | KPI or chart identifier |
| `filter_hash` | `{}`, `{"client":"all"}`, `{"client":"C123"}` | JSON string of active filters (sorted keys for consistency) |

**Example keys:**
- `page2 | kpi_publish_rate | {"client":"all"}`
- `page2 | breakdown_channel | {"client":"C001"}`
- `page1 | kpi_human_hours_saved | {}`

---

## Widget Registry (Clickable Targets)

Enumerate all widgets that can show insights. Add new ones as you build.

| Page | Widget ID | Description |
|------|------------|-------------|
| page1 | `kpi_human_hours_saved` | Human hours saved KPI |
| page1 | `kpi_time_to_market` | Time to market KPI |
| page1 | `lifecycle_trend` | Lifecycle trend chart |
| page1 | `pipeline_stats` | Pipeline stats |
| page2 | `kpi_total_uploaded` | Total uploaded |
| page2 | `kpi_publish_rate` | Publish rate % |
| page2 | `kpi_process_rate` | Process rate % |
| page2 | `funnel_bars` | Funnel bar chart |
| page2 | `trend_chart` | Monthly trend chart |
| page2 | `breakdown_channel` | Channel breakdown |
| page2 | `breakdown_user` | User breakdown |
| page2 | `breakdown_input_type` | Input type breakdown |
| ... | ... | ... |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS KPI/PLOT                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Client: GET /api/insights?page=page2&widget=kpi_publish_rate&filters=...  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. API: Lookup actionable_insights by (page_id, widget_id, filter_hash)     │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    │ HIT                                │ MISS
                    ▼                                    ▼
┌──────────────────────────────┐    ┌──────────────────────────────────────────┐
│ 4a. Return cached insight     │    │ 4b. Fetch context data for widget        │
│     (instant)                 │    │     (same queries as page API)            │
└──────────────────────────────┘    └──────────────────────┬───────────────────┘
                                                            │
                                                            ▼
                                            ┌──────────────────────────────────┐
                                            │ 4c. Call LLM with context        │
                                            │     (OpenAI / Anthropic)         │
                                            └──────────────────────┬───────────┘
                                                            │
                                                            ▼
                                            ┌──────────────────────────────────┐
                                            │ 4d. INSERT into actionable_insights│
                                            │ 4e. Return insight to client      │
                                            └──────────────────────────────────┘
```

---

## Invalidation Strategy

**When to invalidate:** When `recomputeSummaryTables()` runs (after data upload).

**Option A: Delete all insights**
```typescript
// In data-ingestion.ts, after recomputeSummaryTables():
await pg.query('DELETE FROM actionable_insights');
```
- Pros: Simple, no version table
- Cons: All insights recomputed on next click

**Option B: Delete by page (if you know which pages are affected)**
- All pages use summary tables → delete all is fine

**Option C: Version-based (keep rows, check version on read)**
- Store `data_version` in `insight_data_version`
- On read: if `insight.data_version < current_version` → treat as miss, recompute
- More complex, allows gradual invalidation later

**Recommendation:** Start with **Option A** (delete all on ingestion). It's simple and your data uploads are likely infrequent.

---

## API Design

### GET /api/insights

**Query params:**
- `page` (required): `page1` | `page2` | `page3` | `page4` | `page5`
- `widget` (required): widget ID from registry
- `filters` (optional): JSON string, e.g. `{"client":"all"}`. Default `{}`

**Responses:**
- `200`: `{ insight: string, cached: boolean }`
- `202`: `{ status: "computing", message: "Generating insight..." }` — if you want async compute
- `404`: No cached insight; client can trigger POST to compute

### POST /api/insights/compute (optional)

For async flow: client calls this when GET returns 404. Server computes in background, stores, returns when done. Client can poll GET or use Server-Sent Events.

---

## Implementation Phases

### Phase 1: Foundation
1. Add `actionable_insights` table to schema
2. Create `GET /api/insights` route (lookup only, return 404 if miss)
3. Add `DELETE FROM actionable_insights` in `recomputeSummaryTables()`

### Phase 2: LLM Integration
1. Add OpenAI/Anthropic SDK
2. Create `lib/insight-generator.ts`: given (page, widget, contextData), call LLM, return insight text
3. In `/api/insights`: on cache miss, compute synchronously, store, return
4. Add `OPENAI_API_KEY` (or similar) to env

### Phase 3: UI Components
1. Create `InsightModal` or `InsightDrawer` component
2. Make KPIs and charts clickable (wrap in `onClick` or use `InsightTrigger` wrapper)
3. On click: fetch `/api/insights`, show modal with loading state → insight text

### Phase 4: Widget Registry & Context Fetchers
1. For each widget, define what context data the LLM needs (e.g. for `kpi_publish_rate`: `{ totalUploaded, totalProcessed, totalPublished, publishRate }`)
2. Create `getContextForWidget(page, widget, filters)` that returns the right data
3. Pass this to the LLM prompt

---

## Context Data for LLM

Each widget needs a small "context payload" for the LLM. Examples:

| Widget | Context (summary) |
|--------|-------------------|
| `kpi_publish_rate` | `{ publishRate, totalProcessed, totalPublished, totalUploaded }` |
| `breakdown_channel` | `{ breakdowns: [{ name, up, pr, pb, rate }], topItem, lowRateItem }` |
| `trend_chart` | `{ monthlyData: [...], trend }` |

Keep it small (few hundred tokens) so prompts stay cheap and fast.

---

## Cost & Performance Notes

- **Storage:** ~100–500 bytes per insight. 1000 insights ≈ 100–500 KB.
- **Compute:** Only on cache miss. With ~50 widgets × ~10 filter combos = 500 max insights. After first ingestion, most will be computed over time.
- **LLM cost:** ~$0.01–0.05 per insight (GPT-4o-mini). 500 insights ≈ $5–25 one-time.
- **Invalidation:** After each upload, all insights cleared. Next clicks recompute. If uploads are rare (e.g. weekly), this is acceptable.

---

## Next Steps

1. Add migration for `actionable_insights` table
2. Implement `GET /api/insights` with cache lookup
3. Add invalidation hook in `data-ingestion.ts`
4. Implement `lib/insight-generator.ts` with LLM
5. Build `InsightModal` and wire click handlers on Page 2 first (most filter combinations)
6. Expand to other pages
