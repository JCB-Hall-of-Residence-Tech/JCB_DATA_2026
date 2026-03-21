import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/chat/sessions?user_id=xxx — load all sessions for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id") || "";
  if (!userId) return NextResponse.json({ sessions: [] });

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, messages, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ sessions: [] });
  return NextResponse.json({ sessions: data ?? [] });
}

// POST /api/chat/sessions — create or update a session
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    id: string;
    user_id: string;
    title: string;
    messages: unknown[];
  };

  const { error } = await supabase.from("chat_sessions").upsert(
    {
      id: body.id,
      user_id: body.user_id,
      title: body.title,
      messages: body.messages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
