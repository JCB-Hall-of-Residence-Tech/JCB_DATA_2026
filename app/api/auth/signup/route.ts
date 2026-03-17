import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authQuery } from "@/lib/auth-db";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, name, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const existing = await authQuery<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );
  if (existing.rowCount && existing.rowCount > 0) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const inserted = await authQuery<{ id: string }>(
    "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
    [email, hash, name ?? null]
  );

  const userId = inserted.rows[0]?.id;
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8); // 8 hours

  await authQuery(
    "INSERT INTO sessions (user_id, session_token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [
      userId,
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

