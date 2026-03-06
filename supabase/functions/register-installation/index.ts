import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmailNotification } from "../_shared/notify.ts";

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

    // Notificação por email
    const isNew = data.created_at === data.updated_at;
    const subject = isNew
      ? `✅ Nova Instalação Registrada — ${hostname || ip}`
      : `🔄 Instalação Atualizada — ${hostname || ip}`;

    const html = `
      <h2>${isNew ? "Nova instalação registrada" : "Instalação atualizada"}</h2>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td><strong>IP</strong></td><td>${ip}</td></tr>
        <tr><td><strong>Hostname</strong></td><td>${hostname || "-"}</td></tr>
        <tr><td><strong>Frontend URL</strong></td><td><a href="${frontend_url}">${frontend_url}</a></td></tr>
        <tr><td><strong>Backend URL</strong></td><td><a href="${backend_url}">${backend_url}</a></td></tr>
        ${admin_url ? `<tr><td><strong>Admin URL</strong></td><td><a href="${admin_url}">${admin_url}</a></td></tr>` : ""}
        <tr><td><strong>OS</strong></td><td>${os_info || "-"}</td></tr>
        <tr><td><strong>Versão do Installer</strong></td><td>${installer_version || "-"}</td></tr>
        <tr><td><strong>Senha Deploy</strong></td><td>${deploy_password || "-"}</td></tr>
        <tr><td><strong>Senha Master</strong></td><td>${master_password || "-"}</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:16px;">Notificação automática — EquipeChat Monitor</p>
    `;

    await sendEmailNotification(subject, html);

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
