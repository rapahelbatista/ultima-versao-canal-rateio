import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppMessage, getTemplate } from "../_shared/whatsapp.ts";

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
    const { phone, contact_name, company_name } = body;

    if (!phone || !contact_name) {
      return new Response(
        JSON.stringify({ error: "phone e contact_name são obrigatórios", sent: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const variables = {
      contact_name,
      company_name: company_name || "sua empresa",
    };

    const defaultMessage = `🎉 *Olá, ${contact_name}!*\n\nSeja muito bem-vindo(a) ao *EquipeChat*! 🚀\n\nRecebemos o formulário de aquisição da empresa *${company_name || "sua empresa"}* com sucesso. ✅\n\n— *Equipe EquipeChat*`;

    const message = await getTemplate(supabaseAdmin, "welcome", variables, defaultMessage);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return new Response(
        JSON.stringify({ error: "Número de telefone inválido", sent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendWhatsAppMessage(supabaseAdmin, cleanPhone, message);

    return new Response(
      JSON.stringify(result),
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
