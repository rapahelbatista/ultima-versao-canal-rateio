import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    const {
      ip,
      frontend_url,
      backend_url,
      admin_url,
      deploy_password,
      master_password,
      hostname,
      os_info,
      installer_version,
    } = body;

    if (!ip || !frontend_url || !backend_url) {
      return new Response(
        JSON.stringify({ error: "ip, frontend_url e backend_url são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert: se já existe instalação com esse IP + frontend_url, atualiza; senão insere
    const { data, error } = await supabase
      .from("installations")
      .upsert(
        {
          ip,
          frontend_url,
          backend_url,
          admin_url: admin_url || null,
          deploy_password: deploy_password || null,
          master_password: master_password || null,
          hostname: hostname || null,
          os_info: os_info || null,
          installer_version: installer_version || null,
        },
        {
          onConflict: "ip,frontend_url",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar instalação:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
