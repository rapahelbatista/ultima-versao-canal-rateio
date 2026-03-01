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

    // Aceita GET com query params ou POST com body JSON
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

    // Busca instalação pelo IP e/ou frontend_url
    let query = supabase
      .from("installations")
      .select("id, ip, frontend_url, is_blocked, block_reason, blocked_at")
      .limit(1);

    if (ip && frontend_url) {
      query = query.eq("ip", ip).eq("frontend_url", frontend_url);
    } else if (ip) {
      query = query.eq("ip", ip);
    } else {
      query = query.eq("frontend_url", frontend_url!);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Erro na consulta:", error);
      return new Response(
        JSON.stringify({ error: "Erro interno ao verificar status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Instalação não encontrada — considera como não bloqueada (pode não ter sido registrada ainda)
    if (!data) {
      return new Response(
        JSON.stringify({
          blocked: false,
          found: false,
          message: "Instalação não encontrada no sistema"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.is_blocked) {
      return new Response(
        JSON.stringify({
          blocked: true,
          found: true,
          id: data.id,
          reason: data.block_reason ?? "Acesso bloqueado pelo administrador",
          blocked_at: data.blocked_at,
          message: "Esta instalação está bloqueada"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        blocked: false,
        found: true,
        id: data.id,
        message: "Instalação ativa"
      }),
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
