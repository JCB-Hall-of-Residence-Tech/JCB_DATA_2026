import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authQuery } from "@/lib/auth-db";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const userRes = await authQuery<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email]
  );
  if (!userRes.rowCount) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const user = userRes.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);

  await authQuery(
    "INSERT INTO sessions (user_id, session_token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [
      user.id,
      token,
      null,
      null,
      expiresAt.toISOString(),
    ]
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}

