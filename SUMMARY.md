# Frammer AI Analytics Dashboard - Complete KPI and Visualization Summary

This document is the detailed reference for all KPI cards, charts, drilldowns, and analytics capabilities across the dashboard.

---

## 1. Dashboard at a Glance

- **Platform:** Next.js + TypeScript + PostgreSQL
- **Scope:** 6 sections of dashboard + global AI Chat
- **Primary outcomes:** executive visibility, operational diagnostics, multi-level drilldowns, and self-serve analytics
---

## 2. Core Metric System

The platform tracks content across three lifecycle stages:

- **Uploaded** -> incoming raw content
- **Processed/Created** -> AI-generated outputs
- **Published** -> outputs made live on destination platforms

Most charts and KPIs use one or more of these lifecycle measures as count and/or duration.

---

## 3. Section 1 - Executive Overview (CEO Dashboard)

**Audience:** leadership, founders, client success heads  
**Purpose:** high-level business and operational health

### 3.1 KPI Cards (Primary Executive KPIs)

Each KPI card supports:
- primary value
- period-over-period trend (`trendPct`)
- current vs previous month context
- definition tooltip (`?`)
- AI insight action

#### KPI definitions

1. **Estimated Human Hours Saved**  
   `sum(uploaded duration) * 3`  
   Interprets automation ROI (1 hour input approximated as 3 hours manual effort avoided).

2. **Time to Market / Production Velocity**  
   `avg(published_at - uploaded_at)` in hours  
   Lower values indicate faster publishing cycle time.

3. **Content Waste Index**  
   `total created duration - total published duration`  
   Quantifies produced content that did not reach publication.

4. **Client Concentration Risk**  
   `(top client share / total) * 100`  
   Higher value means dependency risk on few accounts.

5. **Total Uploaded Volume**  
   Total uploaded video count + uploaded duration.

6. **Total AI-Generated Output**  
   Processed/created count + created duration.

7. **AI Content Multiplier**  
   `total created / total uploaded`  
   Shows amplification capability of AI processing.

8. **Period-over-Period Growth**  
   `((current combined) - (previous combined)) / previous * 100`  
   Combined business movement metric for lifecycle volume.

9. **Top Performing Output Type**  
   Output type with highest published contribution in active period.

### 3.2 Lifecycle Trend Chart

- **Type:** multi-client monthly trend
- **Metric mode:** count and duration view
- **Interaction:** month-point drill opens ranked client breakdown with relative share

### 3.3 Pipeline Stats

Three summary blocks with micro trends:
- Total Uploaded Count
- Total Processed Count
- Total Published Count

Each includes sparkline trend and quick navigation to deeper funnel analysis.

### 3.4 Data Health Alert Board

Focused alert table for published records with missing metadata:
- missing platform
- missing user
- missing both

Includes issue classification and capped preview list for triage.

### 3.5 Top Performing Formats

- **Type:** stacked composition chart by month
- **Purpose:** format mix evolution over time
- **Readout:** contribution split across output types (e.g., Shorts, Reels, Summary, etc.)

---

## 4. Section 2 - Analysis & Funnel

**Audience:** analytics, operations, client success  
**Purpose:** conversion diagnostics and multidimensional breakdown

### 4.1 Funnel KPIs

- Uploaded total
- Processed total
- Published total 
- Publish rate

Formulas:
- `process rate = processed / uploaded * 100`
- `publish rate = published / processed * 100`

### 4.2 Multi-Dimension Donut Analysis

Breakdowns by:
- language
- input type
- output type
- platform
- client

Supports count/duration context and segment drilldown with share, lifecycle metrics, and conversion interpretation.

### 4.3 Trend Chart (Uploaded vs Processed vs Published)

- time-series comparison of all 3 lifecycle signals
- line-level toggle controls
- click-driven drill into month -> client -> full monthly arc

### 4.4 Analysis Bar Chart

Configurable by:
- dimension: channel/client/user/input/output/language
- metric: uploaded/processed/published
- mode: grouped / stacked / 100% stacked

### 4.5 Breakdown List Table

Sortable ranking table with:
- uploaded, processed, published
- publish-rate emphasis (color coded)

---

## 5. Section 3 - Channels / Operational Efficiency

**Audience:** account managers, operations, client success  
**Purpose:** identify high-efficiency and low-efficiency channel behaviors

### 5.1 Efficiency Matrix

- **Type:** scatter analysis
- **Axes:** created vs published
- **Signal:** quickly identifies strong channels and bottleneck channels

Drilldown path:
- channel point -> client/channel ranking context -> channel detail -> raw records

### 5.2 Client & User Performance Ranking

Hierarchical ranking:
- client row expands to user-level performance
- publish-rate bars with threshold-based color coding
- supports top/bottom focus modes

### 5.3 Monthly Client Billing Contribution

- **Type:** stacked monthly contribution trend
- **Purpose:** which clients drive processing volume over time
- **Drill:** selected month -> client contribution detail -> client monthly arc

### 5.4 Client Growth Momentum

Per-client momentum view with:
- total hours
- mini trend sparkline
- short-window growth badge
- deeper client/month inspection on click

### 5.5 Client Processing Share

Client share distribution view:
- segment by processed contribution
- click reveals lifecycle detail and related context

### 5.6 Language Coverage Heatmap

Matrix view of client vs language intensity with selectable metric modes:
- count or hours
- uploaded / processed / published

Cell click opens client-language funnel detail and optional raw record view.

---

## 6. Section 4 - Content Mix / Strategic Growth

**Audience:** editorial, product, operations  
**Purpose:** product adoption, format strategy, throughput efficiency

### 6.1 Strategic KPI Cards

1. **Total Processed Hours**
2. **Data Completeness Score**
3. **Feature Penetration**
4. **Publish Efficiency (Hours)**
5. **At-Risk Accounts**

These cards are aimed at strategic health and expansion readiness.

### 6.2 Content Amplification Factor

Client-level uploaded/processed/published comparison for identifying high amplification vs low conversion clients.

### 6.3 Platform Hours Chart

Platform-level published-hours distribution with platform -> client drilldown and contribution context.

### 6.4 Content Flow Network

Flow model:
- input types -> channels -> output types

Used to understand production pathways and high-volume transformation routes.

### 6.5 Platform Publishing Mix

100% composition view by platform showing output-type distribution per platform.

### 6.6 Production Velocity Distribution

Platform-wise turnaround distribution using statistics such as:
- min / Q1 / median / Q3 / max / avg

Identifies slow platforms and variation spread.

### 6.7 Language Heatmap (Content-Mix Context)

Reinforces language-level operational coverage in content strategy workflows.

### 6.8 Feature Adoption Heatmap (Client x Output Type)

Adoption intensity matrix for upsell and capability penetration analysis.

---

## 7. Section 5 - Data Explorer & Data Quality

**Audience:** data team, product, operations  
**Purpose:** deep auditability, table-level exploration, quality governance

### 7.1 Data Quality Alerts Panel

Severity model:
- **Critical**
- **Warning**
- **Info**

Checks include null-rate risk, duplicates, missing required publishing metadata, and freshness-related signals.

### 7.2 Videos Table (Raw-Level Exploration)

Capabilities:
- global search
- multi-column filters
- column visibility control
- sorting
- CSV export
- expandable table modal
- add-column workflow via API

### 7.3 Summary Tables Panel

Prebuilt summary tables across channel, user, language, input/output type, and monthly aggregates with export and insights support.

### 7.4 Resizable Layout Panes

User-controlled space management for alerts vs tables and raw vs summary exploration.

### 7.5 Upload Data Modal

Supports CSV/XLSX/JSON ingest with processing outcome feedback.

---

## 8. Section 6 - Custom Widgets (AI-Powered)

**Audience:** all stakeholders  
**Purpose:** no-code custom KPI/chart creation from plain language prompts

### 8.1 Prompt -> Widget Generation Pipeline

1. user prompt
2. schema-aware LLM interpretation
3. SQL generation
4. query execution
5. widget spec generation
6. preview and save


### 8.2 Supported Widget Types

- KPI
- Bar chart
- Line chart
- Pie/Donut
- Table

### 8.3 Saved Widgets

Persisted custom widgets include title, prompt, SQL, type, config, and timestamp for reusable, stakeholder-specific analytics views.

---

## 9. Global AI Chat

Available across all pages for natural-language analytics:

- converts question -> SQL
- executes on live data
- returns result table/chart + insight bullets
- supports multi-turn context
- uses page context awareness for better relevance

Typical usage:
- "Which channels have the biggest publish gap?"
- "Show monthly published trend by client."
- "Which channels have the biggest processed vs published gap?"

---

## 10. Why The Summary Matters

This dashboard is not just a set of charts - it is a complete decision system with:
- executive KPI tracking,
- funnel and conversion diagnostics,
- channel/client/user performance intelligence,
- data quality governance,
- AI-assisted exploration,
- and no-code extensibility through custom widgets.

It supports both **boardroom-level decisions** and **day-to-day operational actions** from the same analytics foundation.

---

## 12. SQL Schema Reference (Detailed)

This section documents the SQL schema used by the dashboard backend (`lib/schema.sql`) with table purpose, keys, and relationship behavior.

### 12.1 Relationship Overview

- **Core anchor dimension:** `clients`
- **User dimension (scoped by client):** `users`
- **Main fact table:** `videos`
- **Aggregated marts:** all `*_summary` and `channel_wise_*` tables
- **Staging table:** `raw_uploads`

Most foreign keys use `ON DELETE CASCADE`, so deleting a client can remove all dependent user/fact/summary rows.

### 12.2 `clients`

**Purpose:** master client list used as root dimension for almost every table.

- **Primary Key:** `client_id` (`VARCHAR(20)`)
- **Columns:**
  - `client_id` - unique client identifier
  - `created_at` - row creation timestamp
- **Referenced by:** `users`, `videos`, and all summary tables

### 12.3 `users`

**Purpose:** user dimension per client (same `user_id` may exist under different clients).

- **Primary Key (composite):** (`client_id`, `user_id`)
- **Foreign Key:** `client_id` -> `clients(client_id)` with cascade delete
- **Columns:**
  - `client_id`
  - `user_id`
  - `user_name`
  - `created_at`
- **Used for:** user-level attribution and user performance summaries

### 12.4 `videos` (Fact Table)

**Purpose:** atomic event-level content pipeline records (uploaded/processed/published lifecycle).

- **Primary Key:** `video_id` (`BIGINT`)
- **Foreign Keys:**
  - `client_id` -> `clients(client_id)`
  - (`client_id`, `channel_id`) -> `channels(client_id, channel_id)` *(see schema note below)*
  - (`client_id`, `user_id`) -> `users(client_id, user_id)`
- **Important columns:**
  - identifiers: `video_id`, `client_id`, `channel_id`, `user_id`
  - dimensions: `input_type_id`, `input_type_name`, `output_type_id`, `output_type_name`, `language_id`, `language_name`
  - lifecycle fields: `uploaded_at`, `processed_at`, `published_at`
  - publishing fields: `published_flag`, `published_platform`, `published_url`
  - measure field: `duration` (stored as text in current schema)
  - metadata: `created_at`
- **Indexes:**
  - `idx_videos_client` on (`client_id`)
  - `idx_videos_channel` on (`client_id`, `channel_id`)
  - `idx_videos_user` on (`client_id`, `user_id`)
  - `idx_videos_uploaded` on (`uploaded_at`)
- **Used for:** all core KPIs, drilldowns, trend analysis, and source aggregation.

### 12.5 `monthly_processing_summary`

**Purpose:** monthly client-level lifecycle counts.

- **Primary Key (composite):** (`client_id`, `month`)
- **Foreign Key:** `client_id` -> `clients(client_id)`
- **Columns:**
  - `month`
  - `total_uploaded`
  - `total_created`
  - `total_published`
  - `created_at`
- **Constraints:** non-negative checks on all count columns
- **Used by:** Page 1 and Page 2 trend/funnel components

### 12.6 `monthly_duration_summary`

**Purpose:** monthly client-level lifecycle durations.

- **Primary Key (composite):** (`client_id`, `month`)
- **Foreign Key:** `client_id` -> `clients(client_id)`
- **Columns:**
  - `total_uploaded_duration`
  - `total_created_duration`
  - `total_published_duration`
  - `created_at`
- **Used by:** executive duration KPIs, growth views, billing contribution charts

### 12.7 `channel_processing_summary`

**Purpose:** channel-level lifecycle counts and durations per client.

- **Primary Key (composite):** (`client_id`, `channel_id`)
- **Foreign Keys:**
  - `client_id` -> `clients(client_id)`
  - (`client_id`, `channel_id`) -> `channels(client_id, channel_id)` *(schema note below)*
- **Columns:**
  - `channel_name`
  - `uploaded_count`, `created_count`, `published_count`
  - `uploaded_duration_hh_mm_ss`, `created_duration_hh_mm_ss`, `published_duration_hh_mm_ss`
  - `created_at`
- **Constraints:** non-negative checks for count columns
- **Used by:** channel efficiency matrix and channel operational charts

### 12.8 `channel_user_processing_summary`

**Purpose:** user performance inside channel context (client + channel + user grain).

- **Primary Key (composite):** (`client_id`, `channel_id`, `user_id`)
- **Foreign Keys:**
  - `client_id` -> `clients(client_id)`
  - (`client_id`, `channel_id`) -> `channels(client_id, channel_id)` *(schema note below)*
  - (`client_id`, `user_id`) -> `users(client_id, user_id)`
- **Columns:**
  - `channel_name`, `user_name`
  - lifecycle counts and durations
  - `created_at`
- **Constraints:** non-negative checks for count columns
- **Used by:** hierarchical client-user ranking and productivity breakdowns

### 12.9 `user_processing_summary`

**Purpose:** user-level totals per client without channel split.

- **Primary Key (composite):** (`client_id`, `user_id`)
- **Foreign Keys:**
  - `client_id` -> `clients(client_id)`
  - (`client_id`, `user_id`) -> `users(client_id, user_id)`
- **Columns:** user name + lifecycle counts/durations + `created_at`
- **Used by:** user leaderboards and performance KPI tables

### 12.10 `input_type_processing_summary`

**Purpose:** lifecycle metrics grouped by input content type per client.

- **Primary Key (composite):** (`client_id`, `input_type`)
- **Foreign Key:** `client_id` -> `clients(client_id)`
- **Columns:** lifecycle counts/durations by `input_type`
- **Constraints:** non-negative checks for count columns
- **Used by:** input-type mix analysis and content flow diagnostics

### 12.11 `output_type_processing_summary`

**Purpose:** lifecycle metrics grouped by output type per client.

- **Primary Key (composite):** (`client_id`, `output_type`)
- **Foreign Key:** `client_id` -> `clients(client_id)`
- **Columns:** lifecycle counts/durations by `output_type`
- **Constraints:** non-negative checks for count columns
- **Used by:** top formats chart, feature adoption, output strategy views

### 12.12 `language_processing_summary`

**Purpose:** lifecycle metrics grouped by language per client.

- **Primary Key (composite):** (`client_id`, `language`)
- **Foreign Key:** `client_id` -> `clients(client_id)`
- **Columns:** lifecycle counts/durations by `language`
- **Constraints:** non-negative checks for count columns
- **Used by:** language heatmaps and multilingual coverage analytics

### 12.13 `channel_wise_publishing_counts`

**Purpose:** platform-wise published counts at client-channel grain.

- **Primary Key (composite):** (`client_id`, `channel_id`)
- **Foreign Keys:**
  - `client_id` -> `clients(client_id)`
  - (`client_id`, `channel_id`) -> `channels(client_id, channel_id)` *(schema note below)*
- **Columns:** per-platform counts (`facebook_count`, `instagram_count`, `linkedin_count`, `reels_count`, `shorts_count`, `x_count`, `youtube_count`, `threads_count`)
- **Used by:** channel/platform publication mix and cross-platform contribution views

### 12.14 `channel_wise_publishing_duration`

**Purpose:** platform-wise published durations at client-channel grain.

- **Primary Key (composite):** (`client_id`, `channel_id`)
- **Foreign Keys:**
  - `client_id` -> `clients(client_id)`
  - (`client_id`, `channel_id`) -> `channels(client_id, channel_id)` *(schema note below)*
- **Columns:** per-platform durations (`facebook_duration`, `instagram_duration`, etc.)
- **Used by:** platform-hours analytics and platform efficiency interpretation

### 12.15 `raw_uploads` (Staging)

**Purpose:** ingestion staging for raw uploaded files with dynamic schema retention.

- **Primary Key:** `id` (`SERIAL`)
- **Columns:**
  - `client_id` (nullable)
  - `uploaded_at` (`TIMESTAMPTZ`, defaults to now)
  - `data` (`JSONB`, required)
- **Indexes:**
  - `idx_raw_uploads_client`
  - `idx_raw_uploads_uploaded_at`
- **Used by:** upload workflows, parse/transform pipelines, and auditability of source payloads

### 12.16 `custom_widgets` (Application-managed)

This table is created by Page 6 API logic (`/api/page6/widgets`) when needed.

- **Primary Key:** `id` (`SERIAL`)
- **Columns (as created by API):**
  - `title`
  - `prompt`
  - `sql_query`
  - `widget_type`
  - `config` (`JSONB`)
  - `created_at` (`TIMESTAMPTZ`)
- **Used by:** persistent user-generated custom widgets on Page 6

