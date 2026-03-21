import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page");
  const widget = searchParams.get("widget");
  const filtersKey = searchParams.get("filters") || "";

  if (!page || !widget) {
    return NextResponse.json({ error: "Missing page or widget" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("insights_cache")
    .select("insight, updated_at")
    .eq("page", page)
    .eq("widget", widget)
    .eq("filters_key", filtersKey)
    .single();

  if (error || !data) {
    return NextResponse.json({ cached: false, insight: null }, { status: 404 });
  }

  return NextResponse.json({ cached: true, insight: data.insight, updatedAt: data.updated_at });
}
