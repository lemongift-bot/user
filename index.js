export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const BOT_TOKEN = env.BOT_TOKEN;
    const API_KEY = env.API_KEY;

    // 🔐 API KEY check (webhook bundan mustasno)
    if (url.pathname !== "/webhook") {
      const key = request.headers.get("x-api-key");
      if (key !== API_KEY) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
    }

    try {
      // =========================
      // 🔹 HEALTH CHECK
      // =========================
      if (url.pathname === "/") {
        return json({
          ok: true,
          message: "Telegram Bot API Worker ishlayapti 🚀",
        });
      }

      // =========================
      // 🔹 SEND MESSAGE (shortcut)
      // =========================
      if (url.pathname === "/api/sendmessage") {
        const body = await getBody(request);

        return await tgFetch("sendMessage", body, BOT_TOKEN);
      }

      // =========================
      // 🔹 UNIVERSAL TELEGRAM API
      // =========================
      if (url.pathname.startsWith("/api/")) {
        const method = url.pathname.split("/")[2];

        if (!method) {
          return json({ ok: false, error: "Method required" }, 400);
        }

        const body = await getBody(request);

        return await tgFetch(method, body, BOT_TOKEN);
      }

      // =========================
      // 🔹 WEBHOOK
      // =========================
      if (url.pathname === "/webhook") {
        const update = await request.json();

        await handleUpdate(update, BOT_TOKEN);

        return new Response("ok");
      }

      return json({ ok: false, error: "Not found" }, 404);
    } catch (err) {
      return json({ ok: false, error: err.message }, 500);
    }
  },
};

// =========================
// 🔧 TELEGRAM FETCH
// =========================
async function tgFetch(method, body, token) {
  const res = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}

// =========================
// 🔧 REQUEST BODY HELPER
// =========================
async function getBody(request) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const obj = {};
    url.searchParams.forEach((v, k) => (obj[k] = v));
    return obj;
  }

  return await request.json();
}

// =========================
// 🤖 UPDATE HANDLER
// =========================
async function handleUpdate(update, token) {
  // 🟢 MESSAGE
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text || "";

    if (text === "/start") {
      await send(token, {
        chat_id: chatId,
        text: "Salom 👋 Bot ishlayapti!",
      });
    } else {
      await send(token, {
        chat_id: chatId,
        text: `Echo: ${text}`,
      });
    }
  }

  // 🔘 CALLBACK (inline button bosilganda)
  if (update.callback_query) {
    const query = update.callback_query;

    await send(token, {
      chat_id: query.message.chat.id,
      text: `Siz bosdingiz: ${query.data}`,
    });

    // loading ni yopish
    await fetch(
      `https://api.telegram.org/bot${token}/answerCallbackQuery`,
      {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          callback_query_id: query.id,
        }),
      }
    );
  }
}

// =========================
// 📤 SEND HELPER
// =========================
async function send(token, body) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });
}

// =========================
// 📦 JSON RESPONSE
// =========================
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}