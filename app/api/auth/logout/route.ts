import { NextResponse } from "next/server";
import { authQuery } from "@/lib/auth-db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/session_token=([^;]+)/);
  const token = match?.[1];

  if (token) {
    try {
      await authQuery("DELETE FROM sessions WHERE session_token = $1", [token]);
    } catch {
      // ignore DB errors on logout
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}

