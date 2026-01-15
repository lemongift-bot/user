import { createClient } from "@libsql/client/web";

export async function getUsers(request, env) {
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

  // ===== Turso (INLINE) =====
  const db = createClient({
    url: env.TURSO_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  try {
    // 1️⃣ Umumiy userlar soni
    const countRes = await db.execute(
      "SELECT COUNT(*) as total FROM users"
    );

    const total_users = countRes.rows[0]?.total || 0;

    // 2️⃣ Userlar ro‘yxati
    const usersRes = await db.execute(`
      SELECT 
        user_id,
        name,
        username,
        photo_url
      FROM users
      ORDER BY created_at DESC
    `);

    return new Response(
      JSON.stringify({
        total_users,
        users: usersRes.rows,
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
