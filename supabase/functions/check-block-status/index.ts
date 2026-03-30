import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    let ip: string | null = null;
    let frontend_url: string | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      ip = url.searchParams.get("ip");
      frontend_url = url.searchParams.get("frontend_url");
    } else if (req.method === "POST") {
      const body = await req.json();
      ip = body.ip ?? null;
      frontend_url = body.frontend_url ?? null;
    } else {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ip && !frontend_url) {
      return new Response(
        JSON.stringify({ error: "Informe ao menos 'ip' ou 'frontend_url'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Busca por frontend_url primeiro (mais preciso), depois por ip
    let data = null;

    if (frontend_url) {
      const { data: byUrl } = await supabase
        .from("installations")
        .select("id, ip, frontend_url, is_blocked, block_reason, blocked_at")
        .eq("frontend_url", frontend_url)
        .limit(1)
        .maybeSingle();
      data = byUrl;
    }

    if (!data && ip) {
      const { data: byIp } = await supabase
        .from("installations")
        .select("id, ip, frontend_url, is_blocked, block_reason, blocked_at")
        .eq("ip", ip)
        .limit(1)
        .maybeSingle();
      data = byIp;
    }

    // Não encontrou — registra automaticamente (apenas se tiver ip E frontend_url)
    if (!data) {
      let newId: number | null = null;
      if (ip && frontend_url) {
        const { data: newRec, error: insertErr } = await supabase
          .from("installations")
          .insert({
            ip,
            frontend_url,
            backend_url: frontend_url.replace(/^(https?:\/\/)/, '$1api.'),
          })
          .select("id")
          .single();

        if (!insertErr && newRec) {
          newId = newRec.id;
          console.log(`[check-block-status] Nova instalação registrada: ID ${newId}`);
        }
      }

      return new Response(
        JSON.stringify({ blocked: false, found: false, registered: !!newId, id: newId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Encontrou — atualiza updated_at e ip (pode ter mudado)
    if (ip && data.ip !== ip) {
      await supabase
        .from("installations")
        .update({ ip, updated_at: new Date().toISOString() })
        .eq("id", data.id);
    } else {
      await supabase
        .from("installations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.id);
    }

    if (data.is_blocked) {
      return new Response(
        JSON.stringify({
          blocked: true, found: true, id: data.id,
          reason: data.block_reason ?? "Acesso bloqueado pelo administrador",
          blocked_at: data.blocked_at,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ blocked: false, found: true, id: data.id }),
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
