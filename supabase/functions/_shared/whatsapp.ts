import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sends a WhatsApp message using the ZapMeow API configured in whatsapp_config.
 * Returns { sent: boolean, error?: string }
 */
export async function sendWhatsAppMessage(
  supabaseAdmin: any,
  phone: string,
  message: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    const { data: config } = await supabaseAdmin
      .from("whatsapp_config")
      .select("zapmeow_url, instance_id")
      .eq("is_active", true)
      .maybeSingle();

    if (!config?.zapmeow_url) {
      return { sent: false, error: "WhatsApp não configurado" };
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return { sent: false, error: "Número de telefone inválido" };
    }

    const jid = `${cleanPhone}@s.whatsapp.net`;
    const instance = config.instance_id || "equipechat";

    const res = await fetch(`${config.zapmeow_url}/${instance}/chat/send/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: jid, message }),
    });

    if (!res.ok) {
      return { sent: false, error: `ZapMeow HTTP ${res.status}` };
    }

    return { sent: true };
  } catch (err) {
    console.error("sendWhatsAppMessage error:", err);
    return { sent: false, error: String(err) };
  }
}
