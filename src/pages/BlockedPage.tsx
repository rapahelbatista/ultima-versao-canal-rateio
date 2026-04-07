import React, { useState, useEffect } from "react";
import { Ban, RefreshCw, AlertTriangle, Shield, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const CHECK_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/check-block-status`;

interface BlockStatus {
  blocked: boolean;
  found: boolean;
  reason?: string;
  blocked_at?: string;
  message?: string;
}

// Pega IP público do cliente
async function getClientIP(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip ?? null;
  } catch {
    return null;
  }
}

async function checkBlock(ip: string, frontendUrl?: string): Promise<BlockStatus> {
  const params = new URLSearchParams({ ip });
  if (frontendUrl) params.set("frontend_url", frontendUrl);
  const res = await fetch(`${CHECK_URL}?${params}`);
  return res.json();
}

// ── LOADING ───────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#070a0f" }}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-xl opacity-20 animate-pulse"
          style={{ background: "hsl(213,94%,58%)" }} />
        <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "hsl(213,94%,58%,0.12)", border: "1px solid hsl(213,94%,58%,0.3)" }}>
          <Shield className="w-8 h-8 animate-pulse" style={{ color: "hsl(213,94%,58%)" }} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(213,94%,58%)" }}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Verificando status da instalação...</span>
      </div>
    </div>
  );
}

// ── NOT BLOCKED ───────────────────────────────────────────────────────────────
function ActiveScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center"
      style={{ background: "#070a0f" }}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-25 animate-pulse"
          style={{ background: "hsl(152,68%,46%)" }} />
        <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "hsl(152,68%,46%,0.12)",
            border: "2px solid hsl(152,68%,46%,0.4)"
          }}>
          <Shield className="w-12 h-12" style={{ color: "hsl(152,68%,46%)" }} />
        </div>
      </div>
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
          style={{ background: "hsl(152,68%,46%,0.12)", color: "hsl(152,68%,46%)", border: "1px solid hsl(152,68%,46%,0.3)" }}>
          ✓ Instalação Ativa
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Sistema autorizado</h1>
        <p className="text-sm" style={{ color: "hsl(0,0%,55%)" }}>
          Esta instalação está ativa e autorizada pelo EquipeChat.
        </p>
      </div>
    </div>
  );
}

// ── BLOCKED ───────────────────────────────────────────────────────────────────
function BlockedScreen({ status, ip }: { status: BlockStatus; ip: string | null }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#070a0f" }}>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(0,72%,55%,0.08), transparent)" }} />

      <div className="w-full max-w-lg relative z-10">

        {/* Top badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{
              background: "hsl(0,72%,55%,0.1)",
              border: "1px solid hsl(0,72%,55%,0.3)",
              color: "hsl(0,72%,55%)"
            }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            EquipeChat — Sistema de Proteção
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse"
              style={{ background: "hsl(0,72%,55%)" }} />
            <div className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(0,72%,55%,0.15), hsl(0,72%,55%,0.05))",
                border: "2px solid hsl(0,72%,55%,0.5)",
                boxShadow: "0 0 60px hsl(0,72%,55%,0.2)"
              }}>
              <Ban className="w-14 h-14" style={{ color: "hsl(0,72%,55%)" }} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight leading-tight">
            Acesso Bloqueado
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "hsl(0,0%,60%)" }}>
            O uso desta versão do software foi identificado como{" "}
            <strong style={{ color: "hsl(0,72%,70%)" }}>não autorizado</strong>.
            Esta instância foi desativada por violação dos termos de uso e da{" "}
            <strong className="text-white">Lei de Direitos Autorais (Lei 9.610/98)</strong>.
          </p>
        </div>

        {/* Reason box */}
        {status.reason && (
          <div className="rounded-2xl p-5 mb-4"
            style={{
              background: "hsl(0,72%,55%,0.07)",
              border: "1px solid hsl(0,72%,55%,0.25)"
            }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-2"
              style={{ color: "hsl(0,72%,55%,0.7)" }}>
              Motivo do bloqueio
            </p>
            <p className="text-base font-semibold" style={{ color: "hsl(0,80%,78%)" }}>
              {status.reason}
            </p>
          </div>
        )}

        {/* Info box */}
        <div className="rounded-2xl p-5 mb-8 space-y-3"
          style={{
            background: "hsl(0,0%,100%,0.03)",
            border: "1px solid hsl(0,0%,100%,0.08)"
          }}>
          {ip && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "hsl(0,0%,45%)" }}>IP identificado</span>
              <code style={{ color: "hsl(0,72%,70%)", fontFamily: "monospace" }}>{ip}</code>
            </div>
          )}
          {status.blocked_at && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "hsl(0,0%,45%)" }}>Bloqueado em</span>
              <code style={{ color: "hsl(0,0%,65%)", fontFamily: "monospace" }}>
                {format(new Date(status.blocked_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </code>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "hsl(0,0%,45%)" }}>Status</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: "hsl(0,72%,55%,0.15)",
                color: "hsl(0,72%,70%)",
                border: "1px solid hsl(0,72%,55%,0.3)"
              }}>
              ⛔ BLOQUEADO
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-6 text-center"
          style={{
            background: "hsl(213,94%,58%,0.05)",
            border: "1px solid hsl(213,94%,58%,0.2)"
          }}>
          <p className="text-sm font-semibold text-white mb-1">
            Regularize sua licença
          </p>
          <p className="text-xs mb-5" style={{ color: "hsl(0,0%,50%)" }}>
            Entre em contato com o suporte do EquipeChat para regularizar sua situação.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/5511999999999?text=Preciso+regularizar+minha+licença+EquipeChat"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, hsl(142,70%,40%), hsl(142,70%,32%))",
                color: "#fff",
                boxShadow: "0 4px 20px hsl(142,70%,40%,0.35)"
              }}>
              <Phone className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href="mailto:contato@equipechat.com?subject=Regularização de licença"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "hsl(213,94%,58%,0.12)",
                color: "hsl(213,94%,70%)",
                border: "1px solid hsl(213,94%,58%,0.3)"
              }}>
              <Mail className="w-4 h-4" />
              E-mail
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "hsl(0,0%,30%)" }}>
          EquipeChat — By Raphael Batista · Sistema Anti-Pirataria · Lei 9.610/98
        </p>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function BlockedPage() {
  const [loading, setLoading] = useState(true);
  const [ip, setIp] = useState<string | null>(null);
  const [status, setStatus] = useState<BlockStatus | null>(null);

  // frontend_url pode vir por query param (passado pelo instalador)
  const params = new URLSearchParams(window.location.search);
  const frontendUrl = params.get("frontend_url") ?? window.location.origin;

  useEffect(() => {
    async function run() {
      try {
        const clientIp = await getClientIP();
        setIp(clientIp);
        const result = await checkBlock(clientIp ?? "", frontendUrl);
        setStatus(result);
      } catch {
        setStatus({ blocked: false, found: false });
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  if (loading) return <LoadingScreen />;
  if (!status || !status.blocked) return <ActiveScreen />;
  return <BlockedScreen status={status} ip={ip} />;
}
