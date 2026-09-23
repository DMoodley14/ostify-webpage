const { app } = require("@azure/functions");
const { EmailClient } = require("@azure/communication-email");

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://ostify.co.uk";
const RECIPIENT = process.env.ENQUIRY_RECIPIENT || "info@ostify.co.uk";
const CONNECTION_STRING = process.env.ACS_CONNECTION_STRING;
const SENDER_ADDRESS = process.env.ACS_SENDER_ADDRESS;

const PLAN_VALUES = new Set(["Always free", "Founder", "Not sure yet"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailClient = CONNECTION_STRING ? new EmailClient(CONNECTION_STRING) : null;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
}

function json(status, body) {
  return { status, headers: { ...corsHeaders(), "Content-Type": "application/json" }, jsonBody: body };
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

app.http("enquiry", {
  route: "enquiry",
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") {
      return { status: 204, headers: corsHeaders() };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }
    if (!body || typeof body !== "object") {
      return json(400, { error: "Invalid body" });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const plan = typeof body.plan === "string" ? body.plan.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const honeypot = typeof body.company === "string" ? body.company.trim() : "";

    // Bots that fill the hidden "company" field get a fake success, not an error to learn from.
    if (honeypot) {
      return json(202, { ok: true });
    }

    if (!name || name.length > 120) {
      return json(400, { error: "Invalid name" });
    }
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return json(400, { error: "Invalid email" });
    }
    if (!message || message.length > 3000) {
      return json(400, { error: "Invalid message" });
    }
    if (!PLAN_VALUES.has(plan)) {
      return json(400, { error: "Invalid plan" });
    }

    if (!emailClient || !SENDER_ADDRESS) {
      context.error("ACS_CONNECTION_STRING or ACS_SENDER_ADDRESS is not configured");
      return json(500, { error: "Not configured" });
    }

    const plainBody = `Name: ${name}\nEmail: ${email}\nPlan: ${plan}\n\n${message}`;
    const htmlBody = `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Plan:</strong> ${escapeHtml(plan)}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;

    try {
      const poller = await emailClient.beginSend({
        senderAddress: SENDER_ADDRESS,
        content: {
          subject: `Ostify enquiry: ${plan}`,
          plainText: plainBody,
          html: htmlBody
        },
        recipients: { to: [{ address: RECIPIENT }] },
        replyTo: [{ address: email, displayName: name }]
      });
      await poller.pollUntilDone();
    } catch (err) {
      context.error("Email send failed", err);
      return json(502, { error: "Delivery failed" });
    }

    return json(200, { ok: true });
  }
});
