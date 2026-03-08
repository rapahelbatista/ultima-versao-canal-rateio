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
    // Auth check — admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ZAPMEOW_URL = Deno.env.get("ZAPMEOW_URL");
    const ZAPMEOW_INSTANCE = Deno.env.get("ZAPMEOW_INSTANCE") || "equipechat";

    if (!ZAPMEOW_URL) {
      return new Response(
        JSON.stringify({ error: "ZAPMEOW_URL não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    // ── GET QR CODE ────────────────────────────────────────────
    if (action === "qrcode") {
      const res = await fetch(`${ZAPMEOW_URL}/${ZAPMEOW_INSTANCE}/qrcode`, {
        method: "GET",
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET STATUS ─────────────────────────────────────────────
    if (action === "status") {
      const res = await fetch(`${ZAPMEOW_URL}/${ZAPMEOW_INSTANCE}/status`, {
        method: "GET",
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET PROFILE ────────────────────────────────────────────
    if (action === "profile") {
      const res = await fetch(`${ZAPMEOW_URL}/${ZAPMEOW_INSTANCE}/profile`, {
        method: "GET",
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SEND TEXT ──────────────────────────────────────────────
    if (action === "send-text") {
      const { phone, message } = body;
      if (!phone || !message) {
        return new Response(
          JSON.stringify({ error: "phone e message são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Normalize phone: remove non-digits, add @s.whatsapp.net
      const cleanPhone = phone.replace(/\D/g, "");
      const jid = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

      const res = await fetch(`${ZAPMEOW_URL}/${ZAPMEOW_INSTANCE}/chat/send/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: jid, message }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── LOGOUT ─────────────────────────────────────────────────
    if (action === "logout") {
      const res = await fetch(`${ZAPMEOW_URL}/${ZAPMEOW_INSTANCE}/logout`, {
        method: "POST",
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use: qrcode, status, profile, send-text, logout" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("WhatsApp proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
