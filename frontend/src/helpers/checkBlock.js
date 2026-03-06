const CHECK_URL = "https://cicwzhpsiewdpugmceqm.supabase.co/functions/v1/check-block-status";

/**
 * Verifica se esta instalação está bloqueada.
 * Se bloqueada, redireciona para a página de bloqueio do monitor.
 */
export async function checkBlockStatus() {
  try {
    const frontendUrl = window.location.origin;

    const res = await fetch(
      `${CHECK_URL}?frontend_url=${encodeURIComponent(frontendUrl)}`
    );

    if (!res.ok) return;

    const data = await res.json();

    if (data.blocked === true) {
      window.location.href = `https://animate-sale-spark.lovable.app/blocked?frontend_url=${encodeURIComponent(frontendUrl)}`;
    }
  } catch (err) {
    console.warn("[AntiPiracy] Falha ao verificar status:", err.message);
  }
}
