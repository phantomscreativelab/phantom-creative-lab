document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const token = form.querySelector('input[name="cf-turnstile-response"]');

    if (!token?.value) {
      status.textContent = "認証を完了してください。";
      return;
    }

    button.disabled = true;
    status.textContent = "送信しています…";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          message: form.elements.message.value.trim(),
          turnstileToken: token.value
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "送信に失敗しました。");

      form.reset();
      status.textContent = "お問い合わせを送信しました。ありがとうございます。";
      window.turnstile?.reset();
    } catch (error) {
      status.textContent = error.message || "送信に失敗しました。時間をおいて再度お試しください。";
      window.turnstile?.reset();
    } finally {
      button.disabled = false;
    }
  });
});
