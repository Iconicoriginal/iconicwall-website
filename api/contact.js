function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function sendJson(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Metodo non consentito." });
  }

  const webhookUrl = process.env.GHL_CONTACT_WEBHOOK_URL;
  if (!webhookUrl) {
    return sendJson(res, 500, { error: "Configurazione mancante: GHL_CONTACT_WEBHOOK_URL non impostata." });
  }

  const body = parseBody(req);
  const payload = {
    full_name: String(body.full_name || "").trim(),
    email: String(body.email || "").trim(),
    phone: String(body.phone || "").trim(),
    company: String(body.company || "").trim(),
    profile_type: String(body.profile_type || "").trim(),
    request_type: String(body.request_type || "").trim(),
    message: String(body.message || "").trim(),
  };

  if (!payload.full_name) {
    return sendJson(res, 400, { error: "Il nome e obbligatorio." });
  }

  if (!payload.email) {
    return sendJson(res, 400, { error: "L'email e obbligatoria." });
  }

  if (!payload.profile_type) {
    return sendJson(res, 400, { error: "Il profilo e obbligatorio." });
  }

  if (!payload.request_type) {
    return sendJson(res, 400, { error: "Il tipo di richiesta e obbligatorio." });
  }

  if (!payload.message) {
    return sendJson(res, 400, { error: "Il messaggio e obbligatorio." });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return sendJson(res, 502, { error: "Invio al webhook non riuscito." });
    }

    return sendJson(res, 200, { ok: true });
  } catch {
    return sendJson(res, 502, { error: "Errore durante l'invio al webhook." });
  }
};
