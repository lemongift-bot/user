import { registerUser } from "./user/register";
import { getUsers } from "./user/get-users";

export default {
  async fetch(request, env) {
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

    const url = new URL(request.url);

    // ===== ROOT =====
    if (url.pathname === "/") {
      return new Response(
        "LemonGift🍋☄️",
        { headers: corsHeaders }
      );
    }

    // ===== ROUTES =====
    if (url.pathname === "/user/register") {
      return registerUser(request, env);
    }

    if (url.pathname === "/user/get-users") {
      return getUsers(request, env);
    }

    return new Response(
      "Not found",
      { status: 404, headers: corsHeaders }
    );
  },
};
