const { app } = require("@azure/functions");
const { EmailClient } = require("@azure/communication-email");

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://ostify.co.uk";
const RECIPIENT = process.env.APPLICATION_RECIPIENT || process.env.ENQUIRY_RECIPIENT || "info@ostify.co.uk";
const CONNECTION_STRING = process.env.ACS_CONNECTION_STRING;
const SENDER_ADDRESS = process.env.ACS_SENDER_ADDRESS;

const FOUNDER_ROLE = "Co-founder & CCO";
const ROLE_VALUES = new Set([FOUNDER_ROLE, "Clinical Advisor"]);
const MESSAGE_MAX_WORDS = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_RE = /^https:\/\/([a-z]+\.)?linkedin\.com\/[^\s]+$/i;
const CV_MAX_BYTES = 3 * 1024 * 1024;
// Accepted CV types, checked against the file's first bytes as well as its name.
const CV_TYPES = {
  pdf: { contentType: "application/pdf", magic: Buffer.from("%PDF") },
  docx: { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: Buffer.from([0x50, 0x4b, 0x03, 0x04]) }
};

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

app.http("application", {
  route: "application",
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
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const current = typeof body.current === "string" ? body.current.trim() : "";
    const link = typeof body.link === "string" ? body.link.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const cvName = typeof body.cvName === "string" ? body.cvName.trim() : "";
    const cvBase64 = typeof body.cv === "string" ? body.cv : "";
    const hasEquity = body.equityMin !== undefined || body.equityMax !== undefined;
    const equityMin = Number(body.equityMin);
    const equityMax = Number(body.equityMax);
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
    if (!ROLE_VALUES.has(role)) {
      return json(400, { error: "Invalid role" });
    }
    // The equity range is only asked for the co-founder role.
    const isPercent = (n, v) => typeof v === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
    if (hasEquity && (role !== FOUNDER_ROLE || !isPercent(equityMin, body.equityMin) || !isPercent(equityMax, body.equityMax) || equityMax < equityMin)) {
      return json(400, { error: "Invalid equity" });
    }
    if (current.length > 200) {
      return json(400, { error: "Invalid current" });
    }
    if (!link || link.length > 300 || !LINK_RE.test(link)) {
      return json(400, { error: "Invalid link" });
    }
    if (!message || message.length > 1500 || message.split(/\s+/).length > MESSAGE_MAX_WORDS) {
      return json(400, { error: "Invalid message" });
    }

    const cvExt = (cvName.match(/\.([a-z]+)$/i) || [])[1];
    const cvType = cvExt ? CV_TYPES[cvExt.toLowerCase()] : undefined;
    if (!cvType || !cvBase64 || cvBase64.length > Math.ceil(CV_MAX_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(cvBase64)) {
      return json(400, { error: "Invalid cv" });
    }
    const cvBytes = Buffer.from(cvBase64, "base64");
    if (cvBytes.length > CV_MAX_BYTES || !cvBytes.subarray(0, cvType.magic.length).equals(cvType.magic)) {
      return json(400, { error: "Invalid cv" });
    }
    // The attachment is named by us, not by the uploaded file name.
    const attachmentName = `CV ${name.replace(/[^A-Za-z0-9 .'-]/g, "").trim() || "applicant"}.${cvExt.toLowerCase()}`;

    if (!emailClient || !SENDER_ADDRESS) {
      context.error("ACS_CONNECTION_STRING or ACS_SENDER_ADDRESS is not configured");
      return json(500, { error: "Not configured" });
    }

    const fields = [["Name", name], ["Email", email], ["Role", role],
      ["Current role", current || "Not given"],
      ...(hasEquity ? [["Equity expected", `${equityMin}% to ${equityMax}%`]] : []),
      ["LinkedIn", link]];
    const plainBody = fields.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${message}`;
    const htmlBody = fields.map(([k, v]) => `<p><strong>${k}:</strong> ${escapeHtml(v)}</p>`).join("") + `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;

    try {
      const poller = await emailClient.beginSend({
        senderAddress: SENDER_ADDRESS,
        content: {
          subject: `Application: ${role} - ${name}`,
          plainText: plainBody,
          html: htmlBody
        },
        recipients: { to: [{ address: RECIPIENT }] },
        replyTo: [{ address: email, displayName: name }],
        attachments: [{ name: attachmentName, contentType: cvType.contentType, contentInBase64: cvBytes.toString("base64") }]
      });
      await poller.pollUntilDone();
    } catch (err) {
      context.error("Email send failed", err);
      return json(502, { error: "Delivery failed" });
    }

    return json(200, { ok: true });
  }
});
