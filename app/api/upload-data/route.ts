import { NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ingestRows } from "@/lib/data-ingestion";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/json",
];

function parseCSV(buffer: Buffer): Record<string, unknown>[] {
  const text = buffer.toString("utf-8");
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });
  if (result.errors.length > 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }
  return result.data.filter((row) => Object.keys(row).some((k) => row[k] != null && String(row[k]).trim() !== ""));
}

function parseXLSX(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("Excel file has no sheets");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      const key = String(k).trim().toLowerCase().replace(/\s+/g, "_");
      out[key] = v;
    }
    return out;
  });
}

function parseJSON(buffer: Buffer): Record<string, unknown>[] {
  const text = buffer.toString("utf-8");
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === "object" && parsed !== null) return [parsed];
  throw new Error("JSON must be an array of objects or a single object");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file", details: "No file was uploaded" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large", details: `Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = (file.name || "").toLowerCase();
    const type = file.type || "";

    let rows: Record<string, unknown>[];

    if (name.endsWith(".csv") || type === "text/csv") {
      rows = parseCSV(buffer);
    } else if (
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      type.includes("spreadsheet") ||
      type.includes("excel")
    ) {
      rows = parseXLSX(buffer);
    } else if (name.endsWith(".json") || type === "application/json") {
      rows = parseJSON(buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported format", details: "Use CSV, XLSX, or JSON" },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Empty file", details: "No valid rows found" },
        { status: 400 }
      );
    }

    // Validate required fields (at least one row must have client_id, channel_name, user_name, video_id)
    const sample = rows[0];
    const keys = Object.keys(sample).map((k) => k.toLowerCase().replace(/\s/g, ""));
    const hasClient = keys.some((k) => k === "client_id" || k === "clientid");
    const hasChannel = keys.some((k) => k === "channel_name" || k === "channelname" || k === "channel");
    const hasUser = keys.some((k) => k === "user_name" || k === "username" || k === "user");
    const hasVideoId = keys.some((k) => k === "video_id" || k === "videoid");

    if (!hasClient || !hasChannel || !hasUser || !hasVideoId) {
      return NextResponse.json(
        {
          error: "Missing required columns",
          details: "CSV/Excel/JSON must include: client_id, channel_name (or channel), user_name (or user), video_id",
        },
        { status: 400 }
      );
    }

    const result = await ingestRows(rows);

    return NextResponse.json({
      success: true,
      rawInserted: result.rawInserted,
      videosInserted: result.videosInserted,
      rowsProcessed: rows.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
