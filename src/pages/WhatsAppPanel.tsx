import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MessageSquare, QrCode, RefreshCw, Wifi, WifiOff,
  ArrowLeft, LogOut, Send, Phone, Loader2, CheckCircle,
  XCircle, Shield, Smartphone, Power
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

async function whatsappApi(action: string, extra: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");
  const res = await fetch(`${BASE_URL}/whatsapp-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...extra }),
  });
  return res.json();
}

type ConnectionStatus = "disconnected" | "connected" | "loading" | "not_configured";

export default function WhatsAppPanel() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [sendPhone, setSendPhone] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);

  const checkStatus = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await whatsappApi("status");
      if (data.configured === false) {
        setStatus("not_configured");
        return;
      }
      if (data?.Connected || data?.connected || data?.status === "connected") {
        setStatus("connected");
        // Fetch profile
        const profileData = await whatsappApi("profile");
        setProfile(profileData);
        setQrCode(null);
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const fetchQrCode = async () => {
    setQrLoading(true);
    try {
      const data = await whatsappApi("qrcode");
      if (data?.QRCode || data?.qrcode || data?.qr) {
        setQrCode(data.QRCode || data.qrcode || data.qr);
        toast.success("QR Code gerado! Escaneie com o WhatsApp.");
        // Poll status every 5 sec
        const interval = setInterval(async () => {
          const st = await whatsappApi("status");
          if (st?.Connected || st?.connected || st?.status === "connected") {
            clearInterval(interval);
            setQrCode(null);
            setStatus("connected");
            const p = await whatsappApi("profile");
            setProfile(p);
            toast.success("WhatsApp conectado com sucesso!");
          }
        }, 5000);
        // Stop polling after 2 min
        setTimeout(() => clearInterval(interval), 120000);
      } else {
        toast.error("Não foi possível gerar o QR Code.");
      }
    } catch {
      toast.error("Erro ao buscar QR Code.");
    } finally {
      setQrLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await whatsappApi("logout");
      setStatus("disconnected");
      setProfile(null);
      setQrCode(null);
      toast.success("WhatsApp desconectado.");
    } catch {
      toast.error("Erro ao desconectar.");
    }
  };

  const handleSend = async () => {
    if (!sendPhone.trim() || !sendMessage.trim()) {
      toast.error("Preencha o número e a mensagem.");
      return;
    }
    setSending(true);
    try {
      const data = await whatsappApi("send-text", {
        phone: sendPhone.trim(),
        message: sendMessage.trim(),
      });
      if (data?.error) {
        toast.error(`Erro: ${data.error}`);
      } else {
        toast.success("Mensagem enviada!");
        setSendMessage("");
      }
    } catch {
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  const handleLogoutAuth = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <MessageSquare className="w-5 h-5 text-green-500" />
            <h1 className="text-base font-semibold">WhatsApp</h1>
            {status === "connected" && (
              <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                <Wifi className="w-3 h-3" /> Conectado
              </span>
            )}
            {status === "disconnected" && (
              <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                <WifiOff className="w-3 h-3" /> Desconectado
              </span>
            )}
            {status === "not_configured" && (
              <span className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                <XCircle className="w-3 h-3" /> Não configurado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={checkStatus} title="Atualizar status">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogoutAuth}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Not configured */}
        {status === "not_configured" && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold">ZapMeow não configurado</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Execute o instalador do ZapMeow no seu servidor VPS. Ele vai registrar automaticamente a URL da API aqui.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left font-mono text-sm max-w-lg mx-auto">
              <p className="text-muted-foreground mb-1"># No seu servidor VPS:</p>
              <p className="text-foreground">curl -sSL https://animate-sale-spark.lovable.app/scripts/instalador_zapmeow.sh | sudo bash</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {status === "loading" && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Disconnected - QR Code */}
        {status === "disconnected" && (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold">Conectar WhatsApp</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Clique para gerar o QR Code e escaneie com o WhatsApp do seu celular.
              </p>
              {!qrCode ? (
                <Button
                  onClick={fetchQrCode}
                  disabled={qrLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {qrLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
                  ) : (
                    <><QrCode className="w-4 h-4 mr-2" /> Gerar QR Code</>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 flex items-center justify-center">
                    <img
                      src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Abra o WhatsApp → Aparelhos conectados → Conectar aparelho
                  </p>
                  <Button variant="outline" onClick={fetchQrCode} className="w-full" size="sm">
                    <RefreshCw className="w-3 h-3 mr-2" /> Novo QR Code
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Instruções</h2>
              </div>
              <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                <li>Clique em <strong>"Gerar QR Code"</strong></li>
                <li>Abra o <strong>WhatsApp</strong> no celular</li>
                <li>Vá em <strong>Configurações → Aparelhos conectados</strong></li>
                <li>Toque em <strong>"Conectar um aparelho"</strong></li>
                <li>Escaneie o QR Code exibido aqui</li>
                <li>Aguarde a confirmação de conexão</li>
              </ol>
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✅ Após conectado, mensagens de boas-vindas serão enviadas automaticamente
                  quando clientes preencherem o formulário de aquisição.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connected */}
        {status === "connected" && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Profile / Status */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-semibold">WhatsApp Conectado</h2>
                </div>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <Power className="w-3 h-3 mr-1" /> Desconectar
                </Button>
              </div>
              {profile && (
                <div className="space-y-2 text-sm">
                  {profile.Name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{profile.Name || profile.name}</span>
                    </div>
                  )}
                  {(profile.Phone || profile.phone) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-medium">{profile.Phone || profile.phone}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✅ Mensagens de boas-vindas automáticas estão ativas.
                  Cada formulário preenchido enviará uma confirmação via WhatsApp.
                </p>
              </div>
            </div>

            {/* Send manual message */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Enviar Mensagem</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Número (com DDD)</label>
                  <Input
                    placeholder="5511999999999"
                    value={sendPhone}
                    onChange={(e) => setSendPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Mensagem</label>
                  <Textarea
                    placeholder="Sua mensagem..."
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Enviar</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
