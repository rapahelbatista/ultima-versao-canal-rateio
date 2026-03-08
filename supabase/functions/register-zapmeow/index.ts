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
    const { zapmeow_url, instance_id, installer_key } = body;

    // Simple key validation — installer sends the same key used for registration
    const EXPECTED_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!installer_key || installer_key !== EXPECTED_KEY) {
      return new Response(
        JSON.stringify({ error: "Chave inválida" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!zapmeow_url) {
      return new Response(
        JSON.stringify({ error: "zapmeow_url é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert: if config exists, update it; otherwise insert
    const { data: existing } = await supabaseAdmin
      .from("whatsapp_config")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("whatsapp_config")
        .update({
          zapmeow_url: zapmeow_url.replace(/\/+$/, ""),
          instance_id: instance_id || "equipechat",
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin
        .from("whatsapp_config")
        .insert({
          zapmeow_url: zapmeow_url.replace(/\/+$/, ""),
          instance_id: instance_id || "equipechat",
        });
    }

    return new Response(
      JSON.stringify({ success: true, message: "ZapMeow registrado com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Register ZapMeow error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
