import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Check if GROQ_API_KEY is configured (does not expose the key) */
export async function GET() {
  //const GROQ_API_KEY =  "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"
  const configured = Boolean(process.env.GROQ_API_KEY?.trim());
  return NextResponse.json({
    configured,
    message: configured
      ? "Groq API key is configured."
      : "GROQ_API_KEY is not set. Add it to .env and restart the server.",
  });
}
