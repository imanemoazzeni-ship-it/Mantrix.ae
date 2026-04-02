const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function wantsJson(request) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";

  return accept.includes("application/json") || contentType.includes("application/json");
}

function collapseWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeText(value, maxLength) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtmlEmail({ name, email, company, message }) {
  const companyBlock = company
    ? `<p style="margin:0 0 14px;"><strong>Company:</strong> ${escapeHtml(company)}</p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;padding:32px;background:#0b1017;color:#f7f2eb;">
      <div style="max-width:680px;margin:0 auto;border-radius:24px;overflow:hidden;border:1px solid rgba(216,176,122,0.24);background:#111926;">
        <div style="padding:28px 30px;background:linear-gradient(135deg,#1b2838,#0d1520);border-bottom:1px solid rgba(216,176,122,0.18);">
          <p style="margin:0 0 10px;color:#d8b07a;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">Mantrix Website Inquiry</p>
          <h1 style="margin:0;font-size:32px;line-height:1.05;">New contact form message</h1>
        </div>
        <div style="padding:30px;">
          <p style="margin:0 0 14px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin:0 0 14px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${companyBlock}
          <div style="margin-top:22px;padding:20px;border-radius:18px;background:#0a1119;border:1px solid rgba(216,176,122,0.14);">
            <p style="margin:0 0 10px;color:#d8b07a;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Message</p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.7;color:#d9dee6;">${escapeHtml(message)}</p>
          </div>
        </div>
      </div>
    </div>
  `.trim();
}

function buildTextEmail({ name, email, company, message }) {
  const companyLine = company ? `Company: ${company}\n` : "";

  return `New contact form message

Name: ${name}
Email: ${email}
${companyLine}
Message:
${message}`.trim();
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function htmlResponse(title, message, status = 200) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body{margin:0;font-family:Arial,sans-serif;background:#071018;color:#f8f4ed;display:grid;place-items:center;min-height:100vh;padding:24px}
    main{max-width:680px;background:#111926;border:1px solid rgba(216,176,122,.22);border-radius:24px;padding:32px;box-shadow:0 24px 60px rgba(0,0,0,.35)}
    h1{margin:0 0 12px;font-size:34px}
    p{margin:0 0 16px;line-height:1.7;color:#c2cad4}
    a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:999px;background:linear-gradient(135deg,#ddb887,#af733f);color:#150e08;font-weight:700;text-decoration:none}
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a href="/contact.html">Return to contact page</a>
  </main>
</body>
</html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}

function respond(request, body, status, htmlTitle, htmlMessage) {
  if (wantsJson(request)) {
    return jsonResponse(body, status);
  }

  return htmlResponse(htmlTitle, htmlMessage, status);
}

async function parseRequest(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

async function handleRequest(request) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  let body;

  try {
    body = await parseRequest(request);
  } catch {
    return respond(
      request,
      { ok: false, error: "We could not read the form submission." },
      400,
      "Message not sent",
      "We could not read the form submission. Please try again."
    );
  }

  const name = collapseWhitespace(normalizeText(body.name, 120));
  const email = collapseWhitespace(normalizeText(body.email, 160));
  const company = collapseWhitespace(normalizeText(body.company, 160));
  const message = normalizeText(body.message, 4000);
  const honeypot = collapseWhitespace(normalizeText(body.website, 120));

  if (honeypot) {
    return respond(
      request,
      { ok: true, message: "Your inquiry has been sent." },
      200,
      "Message sent",
      "Your inquiry has been sent."
    );
  }

  if (!name || !email || !message) {
    return respond(
      request,
      { ok: false, error: "Please complete your name, email address, and message." },
      400,
      "Missing details",
      "Please complete your name, email address, and message."
    );
  }

  if (!SIMPLE_EMAIL_REGEX.test(email)) {
    return respond(
      request,
      { ok: false, error: "Please enter a valid email address." },
      400,
      "Invalid email",
      "Please enter a valid email address."
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "iman@mantrix.ae";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "noreply@mantrix.ae";

  if (!resendApiKey) {
    return respond(
      request,
      {
        ok: false,
        error: "The secure email service is not configured yet. Please email iman@mantrix.ae directly for now.",
      },
      503,
      "Email service not ready",
      "The secure email service is not configured yet. Please email iman@mantrix.ae directly for now."
    );
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      from: `Mantrix Website <${fromEmail}>`,
      to: [toEmail],
      subject: `New website inquiry from ${name}`,
      html: buildHtmlEmail({ name, email, company, message }),
      text: buildTextEmail({ name, email, company, message }),
      headers: {
        "Reply-To": email,
      },
    }),
  });

  if (!resendResponse.ok) {
    const errorBody = await resendResponse.json().catch(() => ({}));
    const statusCode = resendResponse.status === 401 || resendResponse.status === 403 ? 503 : 502;
    const messageText =
      statusCode === 503
        ? "The email service credentials still need to be configured."
        : "We could not send your message right now. Please email iman@mantrix.ae directly.";

    return respond(
      request,
      {
        ok: false,
        error: messageText,
        providerError: errorBody?.message || errorBody?.error || null,
      },
      statusCode,
      "Message not sent",
      messageText
    );
  }

  return respond(
    request,
    { ok: true, message: "Your inquiry has been sent securely." },
    200,
    "Message sent",
    "Your inquiry has been sent securely."
  );
}

export default {
  fetch(request) {
    return handleRequest(request);
  },
};
