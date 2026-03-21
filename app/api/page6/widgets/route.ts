import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id") || "";

  if (!userId) return NextResponse.json({ widgets: [] });

  const { data, error } = await supabase
    .from("custom_widgets")
    .select("id, title, prompt, sql_query, widget_type, config, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ widgets: [], error: error.message });
  return NextResponse.json({ widgets: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    user_id?: string;
    title?: string;
    prompt?: string;
    sql_query?: string;
    widget_type?: string;
    config?: Record<string, unknown>;
  };

  const { user_id, title, prompt, sql_query, widget_type, config } = body;

  if (!title || !prompt || !sql_query || !widget_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!user_id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("custom_widgets")
    .insert({
      user_id,
      title,
      prompt,
      sql_query,
      widget_type,
      config: config ?? {},
    })
    .select("id, title, prompt, sql_query, widget_type, config, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ widget: data });
}
