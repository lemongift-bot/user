import { createClient } from "@libsql/client/web";

export async function registerUser(request, env) {
  // ===== GLOBAL CORS =====
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Only GET allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  // ===== QUERY PARAMS =====
  const url = new URL(request.url);

  const user_id = url.searchParams.get("user_id"); // MAJBURIY
  const name = url.searchParams.get("name");
  const first_name = url.searchParams.get("first_name");
  const photo_url = url.searchParams.get("photo_url");

  if (!user_id) {
    return new Response(
      JSON.stringify({ error: "user_id is required" }),
      { status: 400, headers: corsHeaders }
    );
  }

  // ===== TURSO INLINE =====
  const db = createClient({
    url: env.TURSO_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  try {
    // User borligini tekshiramiz
    const existing = await db.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [user_id]
    );

    // Agar BOR bo‘lsa → UPDATE
    if (existing.rows.length > 0) {
      await db.execute(
        `
        UPDATE users
        SET
          name = ?,
          first_name = ?,
          photo_url = ?
        WHERE user_id = ?
        `,
        [name, first_name, photo_url, user_id]
      );

      return new Response(
        JSON.stringify({
          status: "updated",
          message: "Foydalanuvchi malumotlari yangilandi",
          user_id,
        }),
        { headers: corsHeaders }
      );
    }

    // Agar YO‘Q bo‘lsa → INSERT
    await db.execute(
      `
      INSERT INTO users (user_id, name, first_name, photo_url)
      VALUES (?, ?, ?, ?)
      `,
      [user_id, name, first_name, photo_url]
    );

    return new Response(
      JSON.stringify({
        status: "created",
        message: "Xisob Yaratildi",
        user_id,
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
