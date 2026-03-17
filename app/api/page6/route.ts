import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  transcribeKPI,
  formatKPIValue,
} from "@/lib/kpi-transcriber";
import { generateKPIFromPrompt } from "@/lib/kpi-ai-generator";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const kpiDefinition = (body.kpiDefinition ?? body.kpi ?? "").trim();

    if (!kpiDefinition) {
      return NextResponse.json(
        { error: "KPI definition is required", success: false },
        { status: 400 }
      );
    }

    let sql: string;
    let label: string;
    let valueColumn: string;
    let format: "number" | "duration" | "percent" | "text";
    let description: string | undefined;
    let id: string;
    let labelColumn: string | undefined;
    let multiRow = false;

    // 1. Try predefined KPI first (fast, no API cost)
    const predefined = transcribeKPI(kpiDefinition);

    if (predefined) {
      sql = predefined.sql;
      label = predefined.label;
      valueColumn = predefined.valueColumn;
      format = predefined.format;
      description = predefined.description;
      id = predefined.id;
    } else {
      // 2. Use AI (Groq) to generate SQL for custom KPI definitions
      if (!process.env.GROQ_API_KEY) {
        return NextResponse.json(
          {
            error: "Custom KPI definitions require a Groq API key.",
            details: "Add GROQ_API_KEY to your .env file. Get a key at https://console.groq.com/keys",
            success: false,
          },
          { status: 503 }
        );
      }

      const generated = await generateKPIFromPrompt(kpiDefinition);

      if (!generated) {
        return NextResponse.json(
          {
            error:
              "Could not generate a valid SQL query for your KPI. Try being more specific (e.g. 'count of published videos', 'average time from upload to publish').",
            success: false,
          },
          { status: 400 }
        );
      }

      sql = generated.sql;
      label = generated.label;
      valueColumn = generated.valueColumn;
      format = generated.format;
      description = `Custom KPI: ${kpiDefinition}`;
      id = "custom";
      labelColumn = generated.labelColumn;
      multiRow = generated.multiRow ?? false;
    }

    const result = await query<Record<string, unknown>>(sql);

    if (!result.rows?.length) {
      return NextResponse.json({
        success: true,
        kpi: {
          id,
          label,
          value: formatKPIValue(null, format),
          rawValue: null,
          format,
          description,
        },
        sql,
      });
    }

    // Multi-row: breakdown (e.g. videos per channel)
    const inferredLabelCol =
      labelColumn ?? (result.rows[0] && Object.keys(result.rows[0] as object).find((k) => k !== valueColumn));
    if ((multiRow || (id === "custom" && result.rows.length > 1)) && result.rows.length > 1) {
      const rows = result.rows.map((r) => {
        const labelVal = inferredLabelCol ? r[inferredLabelCol] : Object.values(r)[0];
        const val = r[valueColumn];
        return {
          label: String(labelVal ?? "—"),
          value: formatKPIValue(val, format),
        };
      });
      return NextResponse.json({
        success: true,
        kpi: {
          id,
          label,
          value: null,
          rows,
          format,
          description,
        },
        sql,
      });
    }

    // Single value
    const row = result.rows[0];
    const rawValue = row[valueColumn];
    const formattedValue = formatKPIValue(rawValue, format);

    return NextResponse.json({
      success: true,
      kpi: {
        id,
        label,
        value: formattedValue,
        rawValue,
        format,
        description,
      },
      sql,
    });
  } catch (err) {
    console.error("KPI API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Failed to compute KPI",
        details: message,
        success: false,
        ...(message.includes("GROQ_API_KEY") || message.includes("OPENAI_API_KEY")
          ? { hint: "Add GROQ_API_KEY to your .env file for custom KPI definitions. Get a key at https://console.groq.com/keys" }
          : {}),
      },
      { status: 500 }
    );
  }
}

/** GET: return list of available KPI definitions for autocomplete/hints */
export async function GET() {
  const { KPI_DEFINITIONS } = await import("@/lib/kpi-transcriber");
  return NextResponse.json({
    available: KPI_DEFINITIONS.map((d) => ({
      id: d.id,
      label: d.label,
      keywords: d.keywords.slice(0, 3),
      description: d.description,
    })),
    customSupported: true,
  });
}
