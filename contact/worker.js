export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  try {
    const origin = request.headers.get("Origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json({ ok: false, message: "Invalid request origin." }, 403);
    }

    const data = await request.json();
    const name = clean(data.name, 120);
    const email = clean(data.email, 254);
    const message = clean(data.message, 5000);
    const token = clean(data.turnstileToken, 4096);
    const honeypot = clean(data.website, 200);

    if (honeypot) return json({ ok: true });
    if (!name || !email || !message || !token) {
      return json({ ok: false, message: "Please complete all fields." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, message: "Please enter a valid email address." }, 400);
    }

    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || "",
      }),
    });
    const result = await verify.json();
    if (!result.success) {
      return json({ ok: false, message: "Verification failed. Please try again." }, 403);
    }

    const subject = `PHANTOM CREATIVE LAB — Website Inquiry from ${name}`;
    const text = `PHANTOM CREATIVE LAB — Website Inquiry\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const html = `<h2>PHANTOM CREATIVE LAB — Website Inquiry</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><hr><p><strong>Message:</strong></p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

    await env.EMAIL.send({
      from: "noreply@phantomcreativelab.com",
      to: env.EMAIL_TO,
      replyTo: email,
      subject,
      text,
      html,
    });

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ ok: false, message: "Unable to send your inquiry right now." }, 500);
  }
}

function clean(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function escapeHtml(v) {
  return v.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store"}
  });
}
