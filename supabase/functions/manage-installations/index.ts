import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmailNotification } from "../_shared/notify.ts";
import { sendWhatsAppMessage, getTemplate } from "../_shared/whatsapp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT from Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Não autorizado" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  // Validate the user session using getClaims (works with signing-keys)
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(
      JSON.stringify({ error: "Não autorizado" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const userId = claimsData.claims.sub;

  // Use service role client for data operations and role checks
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify user has admin role
  const { data: roleData, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !roleData) {
    return new Response(
      JSON.stringify({ error: "Acesso negado: permissão de admin necessária" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // GET - listar instalações
    if (req.method === "GET") {
      const { data, error } = await adminClient
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
      const { data: installation } = await adminClient
        .from("installations")
        .select("*")
        .eq("id", id)
        .single();

      if (bodyAction === "block") {
        const { error } = await adminClient
          .from("installations")
          .update({
            is_blocked: true,
            block_reason: reason || "Motivo não informado",
            blocked_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;

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

          // Send WhatsApp block notification using template
          try {
            const { data: purchaseReq } = await adminClient
              .from("purchase_requests")
              .select("contact_phone, contact_name, company_name")
              .not("contact_phone", "is", null)
              .limit(50);

            if (purchaseReq && purchaseReq.length > 0) {
              for (const pr of purchaseReq) {
                if (pr.contact_phone) {
                  const variables = {
                    contact_name: pr.contact_name,
                    company_name: pr.company_name || "—",
                    reason: reason || "Uso irregular detectado",
                    hostname: installation.hostname || installation.ip,
                    date: new Date().toLocaleString("pt-BR"),
                  };
                  const defaultMsg = `⚠️ *AVISO DE BLOQUEIO*\n\nPrezado(a) *${pr.contact_name}*,\nInstalação bloqueada. Motivo: ${reason || "Uso irregular"}.\n— EquipeChat`;
                  const blockMsg = await getTemplate(adminClient, "block", variables, defaultMsg);
                  await sendWhatsAppMessage(adminClient, pr.contact_phone, blockMsg);
                  break;
                }
              }
            }
          } catch (whatsErr) {
            console.error("WhatsApp block notification error:", whatsErr);
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (bodyAction === "unblock") {
        const { error } = await adminClient
          .from("installations")
          .update({
            is_blocked: false,
            block_reason: null,
            blocked_at: null,
          })
          .eq("id", id);

        if (error) throw error;

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

          // Send WhatsApp unblock notification using template
          try {
            const { data: purchaseReq } = await adminClient
              .from("purchase_requests")
              .select("contact_phone, contact_name, company_name")
              .not("contact_phone", "is", null)
              .limit(50);

            if (purchaseReq && purchaseReq.length > 0) {
              for (const pr of purchaseReq) {
                if (pr.contact_phone) {
                  const variables = {
                    contact_name: pr.contact_name,
                    company_name: pr.company_name || "—",
                    hostname: installation.hostname || installation.ip,
                    date: new Date().toLocaleString("pt-BR"),
                  };
                  const defaultMsg = `✅ *DESBLOQUEIO*\n\nPrezado(a) *${pr.contact_name}*,\nInstalação desbloqueada com sucesso.\n— EquipeChat`;
                  const unblockMsg = await getTemplate(adminClient, "unblock", variables, defaultMsg);
                  await sendWhatsAppMessage(adminClient, pr.contact_phone, unblockMsg);
                  break;
                }
              }
            }
          } catch (whatsErr) {
            console.error("WhatsApp unblock notification error:", whatsErr);
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (bodyAction === "delete") {
        const { error } = await adminClient
          .from("installations")
          .delete()
          .eq("id", id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Ação inválida. Use 'block', 'unblock' ou 'delete'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Erro:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
