/**
 * SQL Chatbot helpers: chart inference, chart spec, insights generation
 * Main agent logic is in lib/sql-agent.ts (LangChain + system prompt + memory)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export function inferChartType(
  columns: string[],
  rows: Record<string, unknown>[],
  firstCol: string
): "line" | "bar" | "pie" | "funnel" | "table" {
  if (rows.length === 0) return "table";
  // Single-row results (scalars, single values) are not chart-worthy — show as table
  if (rows.length === 1) return "table";
  const hasDate = /date|time|month|year|day/i.test(firstCol) || columns.some((c) => /month|date|time|year/i.test(c));
  const numCols = columns.filter((c) => {
    const v = rows[0]?.[c];
    return typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)));
  });
  if (hasDate && numCols.length >= 1) return "line";
  if (rows.length <= 10 && numCols.length >= 1) return "bar";
  if (rows.length <= 10 && columns.length === 2 && numCols.length === 1) return "pie";
  return "table";
}

/** Serialize cell for JSON/chart; prevents [object Object] for pg interval etc. */
function serializeCell(v: unknown): string | number {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof (o as { toPostgres?: unknown }).toPostgres === "function") {
      return String((o as { toPostgres: () => unknown }).toPostgres());
    }
    if (
      typeof o.hours === "number" ||
      typeof o.minutes === "number" ||
      typeof o.milliseconds === "number" ||
      typeof o.seconds === "number" ||
      typeof o.days === "number"
    ) {
      const h = Number(o.hours ?? 0) + Number(o.days ?? 0) * 24;
      const m = Number(o.minutes ?? 0);
      const s =
        o.seconds != null
          ? Math.floor(Number(o.seconds))
          : Math.floor(Number(o.milliseconds ?? 0) / 1000);
      return [h, m, s].map((n) => String(Math.floor(n)).padStart(2, "0")).join(":");
    }
    return JSON.stringify(v);
  }
  return typeof v === "number" ? v : String(v);
}

export function buildChartSpec(
  columns: string[],
  rows: Record<string, unknown>[],
  chartType: "line" | "bar" | "pie" | "funnel" | "table"
): Record<string, unknown> {
  const labels = columns[0]
    ? rows.map((r) => String(serializeCell(r[columns[0]])))
    : [];
  const dataCols = columns.slice(1).filter((c) => {
    const v = rows[0]?.[c];
    return typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)));
  });
  const datasets = dataCols.map((col) => ({
    name: col,
    data: rows.map((r) => {
      const v = r[col];
      return typeof v === "number" ? v : Number(v) || 0;
    }),
  }));

  if (chartType === "pie" && datasets[0]) {
    return {
      type: "pie",
      labels,
      values: datasets[0].data,
    };
  }
  if (chartType === "line") {
    return {
      type: "line",
      labels,
      datasets,
    };
  }
  if (chartType === "bar") {
    return {
      type: "bar",
      labels,
      datasets,
    };
  }
  return {
    type: "table",
    columns,
    rows: rows.map((r) => columns.map((c) => serializeCell(r[c]))),
  };
}

/** Extract JSON array from LLM response, handling markdown code blocks and stray text */
function parseInsightsJson(text: string): string[] {
  let cleaned = text.trim();
  // Strip markdown code blocks: ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }
  // Strip any remaining backticks
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "").trim();
  // Try parsing directly
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((x) => cleanInsightText(typeof x === "string" ? x : String(x)));
    }
  } catch {
    /* continue */
  }
  // Try to find a JSON array anywhere in the string
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((x) => cleanInsightText(typeof x === "string" ? x : String(x)));
      }
    } catch {
      /* continue */
    }
  }
  // Fallback: split by newlines/bullets, treat each line as an insight
  const lines = cleaned.split(/\n+/).map((s) => s.replace(/^[-*•]\s*/, "").replace(/^`+|\s*`+$/g, "").trim()).filter(Boolean);
  const result = lines.length > 0 ? lines : (cleaned ? [cleaned] : []);
  return result.map(cleanInsightText);
}

/** Strip markdown only; do not truncate LLM output */
function cleanInsightText(s: string): string {
  return String(s)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

export async function generateInsights(
  question: string,
  sql: string,
  rows: Record<string, unknown>[],
  apiKey: string
): Promise<string[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  const sample = rows.slice(0, 10).map((r) => JSON.stringify(r));
  const prompt = `You are a data analyst. Explain what this query result MEANS for the user.

Question: "${question}"
SQL: ${sql}

Result rows (sample of ${rows.length} total):
${sample.join("\n")}

Write 3-4 bullet-point insights. Each insight should be 2-3 sentences explaining what the data means and what to do next.
- Plain text only: NO markdown (**bold**), NO backticks, NO code.
- Be substantive: explain context, implications, and recommendations.
Return ONLY a JSON array of strings. No other text.`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = parseInsightsJson(text);
  const insights = parsed.length > 0 ? parsed : [cleanInsightText(text)];
  return insights.slice(0, 4); // cap at 4 to avoid walls of text
}

/** @deprecated Use chatWithSQL from lib/sql-agent.ts with LangChain memory */
