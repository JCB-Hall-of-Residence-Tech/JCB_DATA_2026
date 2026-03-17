#!/usr/bin/env node
/**
 * Quick test to verify GROQ_API_KEY is working.
 * Run: node scripts/test-groq.js
 */

const fs = require("fs");
const path = require("path");

// Load .env if GROQ_API_KEY not already set
if (!process.env.GROQ_API_KEY) {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*GROQ_API_KEY\s*=\s*["']?([^"'\s#]+)/);
      if (m) {
        process.env.GROQ_API_KEY = m[1].trim();
        break;
      }
    }
  }
}

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    console.error("❌ GROQ_API_KEY is not set in .env");
    process.exit(1);
  }

  console.log("Testing Groq API connection...");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Say 'OK' if you can read this." }],
        max_tokens: 10,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Groq API error:", data.error?.message || res.statusText);
      if (data.error?.code === "invalid_api_key") {
        console.error("   Your API key may be invalid or expired. Get a new one at https://console.groq.com/keys");
      }
      process.exit(1);
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    console.log("✅ Groq API is working!");
    console.log("   Response:", reply || "(empty)");
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
}

testGroq();
