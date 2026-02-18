export async function sendEmailNotification(subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("RESEND_API_KEY não configurada — notificação por email ignorada.");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EquipeChat <noreply@equipechat.com.br>",
      to: ["admin@equipechat.com"],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Erro ao enviar email via Resend:", err);
  } else {
    console.log("Email enviado com sucesso:", subject);
  }
}
