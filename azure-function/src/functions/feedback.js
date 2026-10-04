const { app } = require("@azure/functions");
const { EmailClient } = require("@azure/communication-email");

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://ostify.co.uk";
const RECIPIENT = process.env.FEEDBACK_RECIPIENT || process.env.ENQUIRY_RECIPIENT || "info@ostify.co.uk";
const CONNECTION_STRING = process.env.ACS_CONNECTION_STRING;
const SENDER_ADDRESS = process.env.ACS_SENDER_ADDRESS;

const PLAN_VALUES = new Set(["Always free", "Founder", "Not sure"]);
const KIND_VALUES = new Set(["Something did not work", "Something was confusing", "An idea or suggestion", "A general comment"]);
// Optional questions: an empty answer is allowed, anything else must be one of these.
const OPTIONAL_VALUES = {
  role: new Set(["Doctor", "Nurse", "Pharmacist", "Allied health professional", "Manager or administrator", "Other"]),
  organisation: new Set(["GP practice", "NHS trust or hospital", "Community or mental health service", "Private clinic or practice", "Other"]),
  miss: new Set(["Very disappointed", "Somewhat disappointed", "Not disappointed"]),
  recommend: new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]),
  pilot: new Set(["Yes", "Maybe", "No"])
};
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

app.http("feedback", {
  route: "feedback",
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
    const kind = typeof body.kind === "string" ? body.kind.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const usecase = typeof body.usecase === "string" ? body.usecase.trim() : "";
    const optional = {};
    for (const key of Object.keys(OPTIONAL_VALUES)) {
      optional[key] = typeof body[key] === "string" ? body[key].trim() : "";
    }
    const browser = typeof body.browser === "string" ? body.browser.trim().slice(0, 400) : "";
    const honeypot = typeof body.company === "string" ? body.company.trim() : "";

    // Bots that fill the hidden "company" field get a fake success, not an error to learn from.
    if (honeypot) {
      return json(202, { ok: true });
    }

    if (!name || name.length > 120) {
      return json(400, { error: "Invalid name" });
    }
    // Email is optional: testers only give one if they want a reply.
    if (email && (email.length > 254 || !EMAIL_RE.test(email))) {
      return json(400, { error: "Invalid email" });
    }
    if (!PLAN_VALUES.has(plan)) {
      return json(400, { error: "Invalid plan" });
    }
    if (!KIND_VALUES.has(kind)) {
      return json(400, { error: "Invalid kind" });
    }
    if (usecase.length > 300) {
      return json(400, { error: "Invalid usecase" });
    }
    for (const [key, allowed] of Object.entries(OPTIONAL_VALUES)) {
      if (optional[key] && !allowed.has(optional[key])) {
        return json(400, { error: `Invalid ${key}` });
      }
    }
    if (!message || message.length > 5000) {
      return json(400, { error: "Invalid message" });
    }

    if (!emailClient || !SENDER_ADDRESS) {
      context.error("ACS_CONNECTION_STRING or ACS_SENDER_ADDRESS is not configured");
      return json(500, { error: "Not configured" });
    }

    const fields = [["Name", name], ["Email", email || "Not given"], ["Plan", plan], ["Type", kind],
      ["Role", optional.role || "Not given"], ["Organisation", optional.organisation || "Not given"], ["Wants to build", usecase || "Not given"],
      ["If Ostify went away", optional.miss || "Not given"], ["Recommend (0-10)", optional.recommend || "Not given"], ["Wants a pilot", optional.pilot || "Not given"],
      ["Browser", browser || "Not given"]];
    const plainBody = fields.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${message}`;
    const htmlBody = fields.map(([k, v]) => `<p><strong>${k}:</strong> ${escapeHtml(v)}</p>`).join("") + `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;

    try {
      const poller = await emailClient.beginSend({
        senderAddress: SENDER_ADDRESS,
        content: {
          subject: `Ostify tester feedback: ${kind} (${plan})`,
          plainText: plainBody,
          html: htmlBody
        },
        recipients: { to: [{ address: RECIPIENT }] },
        ...(email ? { replyTo: [{ address: email, displayName: name }] } : {})
      });
      await poller.pollUntilDone();
    } catch (err) {
      context.error("Email send failed", err);
      return json(502, { error: "Delivery failed" });
    }

    return json(200, { ok: true });
  }
});
