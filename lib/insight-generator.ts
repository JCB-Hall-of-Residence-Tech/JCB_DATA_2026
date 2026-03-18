/**
 * Generates actionable insights for dashboard widgets using Gemini.
 * Insights are cached in actionable_insights table; recomputed only on data change.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface InsightContext {
  page: string;
  widget: string;
  filters: Record<string, string>;
  data: Record<string, unknown>;
}

// Default Gemini model; override with GEMINI_MODEL in env if needed.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// Reduce context size so Groq doesn't hit token limits.
// - Truncate long strings
// - Limit arrays to first N items
// - Recurse into objects up to a small depth
function compactValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return value;
  if (typeof value === "string") {
    return value.length > 400 ? value.slice(0, 400) + "…" : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((v) => compactValue(v, depth + 1));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = compactValue(v, depth + 1);
    }
    return result;
  }
  return value;
}

function buildPrompt(ctx: InsightContext): string {
  const { page, widget, data } = ctx;
  const compacted = compactValue(data) as Record<string, unknown>;
  const dataStr = JSON.stringify(compacted, null, 2);

  return `You are an expert data analyst for a video content analytics dashboard. A user has clicked on a KPI or chart widget to get an actionable insight.

**Page:** ${page}
**Widget:** ${widget}

**Data context (metrics, breakdowns, or chart data):**
\`\`\`json
${dataStr}
\`\`\`

Provide a single, concise actionable insight (2-4 sentences) that:
1. Interprets the key numbers or patterns
2. Highlights what's working well or what needs attention
3. Suggests a concrete next step or recommendation

Be specific to the data. Avoid generic advice. Use plain language.`;
}

/**
 * Generate insight using Gemini.
 * Requires GEMINI_API_KEY (or GOOGLE_API_KEY) in environment.
 */
export async function generateInsight(ctx: InsightContext): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return "Gemini API key not configured. Set GEMINI_API_KEY in .env.local for AI-generated insights.";
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildPrompt(ctx);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        // Allow longer, more complete insights
        maxOutputTokens: 2048,
      },
    });

    const content = result.response.text()?.trim();
    if (!content) {
      return "Unable to generate insight. Please try again.";
    }
    return content;
  } catch (err) {
    console.error("Gemini insight generation error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return `Insight generation failed: ${msg}. Check GEMINI_API_KEY and try again.`;
  }
}
