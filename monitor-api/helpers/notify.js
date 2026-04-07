async function sendEmail(subject, html) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY não configurada — email ignorado.");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "EquipeChat <noreply@equipechat.com.br>",
        to: [process.env.ADMIN_EMAIL || "admin@equipechat.com"],
        subject,
        html,
      }),
    });
    if (!res.ok) console.error("Erro email:", await res.text());
  } catch (err) {
    console.error("sendEmail error:", err);
  }
}

module.exports = { sendEmail };
