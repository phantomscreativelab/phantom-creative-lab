export async function onRequestPost(context) {
  try {
    const request = context.request;
    if (!(request.headers.get("content-type") || "").includes("application/json")) {
      return new Response("Unsupported Media Type", { status: 415 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const turnstileToken = String(body.turnstileToken || "").trim();

    if (!name || !email || !message || !turnstileToken) {
      return Response.json({ ok: false, message: "必須項目を入力してください。" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return Response.json({ ok: false, message: "メールアドレスをご確認ください。" }, { status: 400 });
    }

    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: context.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get("CF-Connecting-IP") || ""
      })
    });

    const result = await verify.json();
    if (!result.success) {
      return Response.json({ ok: false, message: "認証に失敗しました。もう一度お試しください。" }, { status: 403 });
    }

    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: context.env.CONTACT_FROM_EMAIL,
        to: [context.env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `[PHANTOM CREATIVE LAB] お問い合わせ: ${name}`,
        text: `お名前: ${name}\nメールアドレス: ${email}\n\nお問い合わせ内容:\n${message}`
      })
    });

    if (!mail.ok) {
      console.error("Resend error:", await mail.text());
      return Response.json({ ok: false, message: "送信に失敗しました。時間をおいて再度お試しください。" }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return Response.json({ ok: false, message: "送信に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }
}
