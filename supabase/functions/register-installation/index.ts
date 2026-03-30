import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmailNotification } from "../_shared/notify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation helpers
function isValidIP(ip: string): boolean {
  // IPv4 or IPv6 basic validation
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv4.test(ip)) {
    return ip.split('.').every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
  }
  return ipv6.test(ip);
}

function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncate(val: string | null | undefined, maxLen: number): string | null {
  if (!val) return null;
  return String(val).slice(0, maxLen);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Reject oversized payloads (max 10KB)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10240) {
      return new Response(
        JSON.stringify({ error: "Payload too large" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Validate required fields
    if (!ip || !frontend_url || !backend_url) {
      return new Response(
        JSON.stringify({ error: "ip, frontend_url e backend_url são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate IP format
    if (typeof ip !== 'string' || !isValidIP(ip)) {
      return new Response(
        JSON.stringify({ error: "Formato de IP inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL formats
    if (!isValidURL(frontend_url)) {
      return new Response(
        JSON.stringify({ error: "frontend_url inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!isValidURL(backend_url)) {
      return new Response(
        JSON.stringify({ error: "backend_url inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (admin_url && !isValidURL(admin_url)) {
      return new Response(
        JSON.stringify({ error: "admin_url inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize and truncate all string fields
    const safeData = {
      ip: truncate(ip, 45)!,
      frontend_url: truncate(frontend_url, 500)!,
      backend_url: truncate(backend_url, 500)!,
      admin_url: truncate(admin_url, 500),
      deploy_password: truncate(deploy_password, 512),
      master_password: truncate(master_password, 512),
      hostname: truncate(hostname, 255),
      os_info: truncate(os_info, 500),
      installer_version: truncate(installer_version, 50),
    };

    // Sempre cria um novo registro — sem sobrescrever instalações anteriores
    const { data, error } = await supabase
      .from("installations")
      .insert(safeData)
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar instalação:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar instalação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Notificação por email — sem senhas
    const isNew = true; // Agora sempre é nova inserção
    const subject = isNew
      ? `✅ Nova Instalação Registrada — ${sanitizeHTML(safeData.hostname || safeData.ip)}`
      : `🔄 Instalação Atualizada — ${sanitizeHTML(safeData.hostname || safeData.ip)}`;

    const html = `
      <h2>${isNew ? "Nova instalação registrada" : "Instalação atualizada"}</h2>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td><strong>IP</strong></td><td>${sanitizeHTML(safeData.ip)}</td></tr>
        <tr><td><strong>Hostname</strong></td><td>${sanitizeHTML(safeData.hostname || "-")}</td></tr>
        <tr><td><strong>Frontend URL</strong></td><td>${sanitizeHTML(safeData.frontend_url)}</td></tr>
        <tr><td><strong>Backend URL</strong></td><td>${sanitizeHTML(safeData.backend_url)}</td></tr>
        ${safeData.admin_url ? `<tr><td><strong>Admin URL</strong></td><td>${sanitizeHTML(safeData.admin_url)}</td></tr>` : ""}
        <tr><td><strong>OS</strong></td><td>${sanitizeHTML(safeData.os_info || "-")}</td></tr>
        <tr><td><strong>Versão do Installer</strong></td><td>${sanitizeHTML(safeData.installer_version || "-")}</td></tr>
        <tr><td><strong>Senhas</strong></td><td><em>Disponíveis no painel administrativo</em></td></tr>
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
