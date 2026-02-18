import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmailNotification } from "../_shared/notify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

const ADMIN_KEY = "equipechat@2024";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verificar chave de admin no header
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== ADMIN_KEY) {
    return new Response(
      JSON.stringify({ error: "Não autorizado" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);

  try {
    // GET - listar instalações
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("installations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST - bloquear/desbloquear
    if (req.method === "POST") {
      const body = await req.json();
      const { id, action: bodyAction, reason } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: "id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar dados da instalação para a notificação
      const { data: installation } = await supabase
        .from("installations")
        .select("*")
        .eq("id", id)
        .single();

      if (bodyAction === "block") {
        const { error } = await supabase
          .from("installations")
          .update({
            is_blocked: true,
            block_reason: reason || "Motivo não informado",
            blocked_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;

        // Notificação de bloqueio
        if (installation) {
          const subject = `🚫 Instalação Bloqueada — ${installation.hostname || installation.ip}`;
          const html = `
            <h2>Instalação bloqueada</h2>
            <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
              <tr><td><strong>IP</strong></td><td>${installation.ip}</td></tr>
              <tr><td><strong>Hostname</strong></td><td>${installation.hostname || "-"}</td></tr>
              <tr><td><strong>Frontend URL</strong></td><td><a href="${installation.frontend_url}">${installation.frontend_url}</a></td></tr>
              <tr><td><strong>Motivo do Bloqueio</strong></td><td style="color:#c0392b;">${reason || "Motivo não informado"}</td></tr>
              <tr><td><strong>Bloqueado em</strong></td><td>${new Date().toLocaleString("pt-BR")}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:16px;">Notificação automática — EquipeChat Monitor</p>
          `;
          await sendEmailNotification(subject, html);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (bodyAction === "unblock") {
        const { error } = await supabase
          .from("installations")
          .update({
            is_blocked: false,
            block_reason: null,
            blocked_at: null,
          })
          .eq("id", id);

        if (error) throw error;

        // Notificação de desbloqueio
        if (installation) {
          const subject = `✅ Instalação Desbloqueada — ${installation.hostname || installation.ip}`;
          const html = `
            <h2>Instalação desbloqueada</h2>
            <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
              <tr><td><strong>IP</strong></td><td>${installation.ip}</td></tr>
              <tr><td><strong>Hostname</strong></td><td>${installation.hostname || "-"}</td></tr>
              <tr><td><strong>Frontend URL</strong></td><td><a href="${installation.frontend_url}">${installation.frontend_url}</a></td></tr>
              <tr><td><strong>Desbloqueado em</strong></td><td>${new Date().toLocaleString("pt-BR")}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:16px;">Notificação automática — EquipeChat Monitor</p>
          `;
          await sendEmailNotification(subject, html);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Ação inválida. Use 'block' ou 'unblock'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Erro:", err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
