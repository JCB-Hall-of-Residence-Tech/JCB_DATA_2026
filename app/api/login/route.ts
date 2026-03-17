// Legacy route no longer used; kept to avoid 404s if called accidentally.
export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(
    { error: "Use /api/auth/login instead." },
    { status: 410 }
  );
}

