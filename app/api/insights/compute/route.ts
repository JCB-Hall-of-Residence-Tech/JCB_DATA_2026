import { NextRequest, NextResponse } from "next/server";
import { generateInsight } from "@/lib/insight-generator";

export const dynamic = "force-dynamic";

const PAGE_API: Record<string, string> = {
  page1: "/api/page1",
  page2: "/api/page2",
  page3: "/api/page3",
  page4: "/api/page4",
  page5: "/api/page5",
};

export async function POST(req: NextRequest) {
  let body: { page?: string; widget?: string; filters?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const page = body.page;
  const widget = body.widget;
  const filters = body.filters || {};
  if (!page || !widget) {
    return NextResponse.json({ error: "Missing required fields: page, widget" }, { status: 400 });
  }

  const reqUrl = new URL(req.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
  let contextData: Record<string, unknown> = {};

  const apiPath = PAGE_API[page];
  if (apiPath) {
    try {
      const res = await fetch(`${baseUrl}${apiPath}`);
      if (res.ok) contextData = (await res.json()) as Record<string, unknown>;
    } catch {
      contextData = {};
    }
  }

  const insight = await generateInsight({ page, widget, filters, data: contextData });
  return NextResponse.json({ insight, computed: true });
}
