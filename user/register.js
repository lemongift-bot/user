import { createClient } from "@libsql/client/web";

export async function registerUser(request, env) {
  // ===== CORS =====
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Only GET allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  // ===== Query params =====
  const url = new URL(request.url);

  const user_id = url.searchParams.get("user_id"); // MAJBURIY
  const name = url.searchParams.get("name");
  const username = url.searchParams.get("username");
  const photo_url = url.searchParams.get("photo_url");

  if (!user_id) {
    return new Response(
      JSON.stringify({ error: "user_id is required" }),
      { status: 400, headers: corsHeaders }
    );
  }

  // ===== Turso ulanish (INLINE) =====
  const db = createClient({
    url: env.TURSO_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  try {
    // user bor-yo‘qligini tekshiramiz
    const existing = await db.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [user_id]
    );

    if (existing.rows.length > 0) {
      return new Response(
        JSON.stringify({
          status: "exists",
          message: "User already registered",
          user_id,
        }),
        { headers: corsHeaders }
      );
    }

    // yangi user qo‘shamiz
    await db.execute(
      `INSERT INTO users (user_id, name, username, photo_url)
       VALUES (?, ?, ?, ?)`,
      [user_id, name, username, photo_url]
    );

    return new Response(
      JSON.stringify({
        status: "ok",
        message: "User registered successfully",
        user: {
          user_id,
          name,
          username,
          photo_url,
        },
      }),
      { headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Database error",
        details: err.message,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
      }
