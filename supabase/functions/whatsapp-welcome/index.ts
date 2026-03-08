import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { phone, contact_name, company_name, link_id } = body;

    if (!phone || !contact_name) {
      return new Response(
        JSON.stringify({ error: "phone e contact_name são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ZAPMEOW_URL = Deno.env.get("ZAPMEOW_URL");
    const ZAPMEOW_INSTANCE = Deno.env.get("ZAPMEOW_INSTANCE") || "equipechat";

    if (!ZAPMEOW_URL) {
      return new Response(
        JSON.stringify({ error: "ZAPMEOW_URL não configurada", sent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return new Response(
        JSON.stringify({ error: "Número de telefone inválido", sent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jid = `${cleanPhone}@s.whatsapp.net`;

    const message = `🎉 *Olá, ${contact_name}!*

Seja muito bem-vindo(a) ao *EquipeChat*! 🚀

Recebemos o formulário de aquisição da empresa *${company_name || "sua empresa"}* com sucesso. ✅

Nossa equipe já está analisando suas informações e em breve entraremos em contato com os próximos passos.

📋 *Resumo:*
• Empresa: ${company_name || "—"}
• Contato: ${contact_name}

Se tiver qualquer dúvida, responda esta mensagem que ficaremos felizes em ajudar! 😊

— *Equipe EquipeChat*`;

    const res = await fetch(`${ZAPMEOW_URL}/${ZAPMEOW_INSTANCE}/chat/send/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: jid, message }),
    });

    const data = await res.json();

    return new Response(
      JSON.stringify({ sent: res.ok, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Welcome message error:", err);
    return new Response(
      JSON.stringify({ error: "Erro ao enviar mensagem", sent: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
