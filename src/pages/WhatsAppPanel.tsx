import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, logout as apiLogout } from "@/lib/api";
import { toast } from "sonner";
import {
  MessageSquare, QrCode, RefreshCw, Wifi, WifiOff,
  ArrowLeft, LogOut, Send, Loader2, CheckCircle,
  XCircle, Shield, Smartphone, Power, Zap, Ban,
  Unlock, UserPlus, Bell, Pencil, Save, RotateCcw, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

async function whatsappApi(action: string, extra: Record<string, any> = {}) {
  return apiFetch("/api/whatsapp-proxy", {
    method: "POST",
    body: JSON.stringify({ action, ...extra }),
  });
}

type ConnectionStatus = "disconnected" | "connected" | "loading" | "not_configured";

interface Template {
  id: string;
  template_key: string;
  title: string;
  message_body: string;
  is_active: boolean;
}

const VARIABLE_HINTS: Record<string, string[]> = {
  welcome: ["{{contact_name}}", "{{company_name}}"],
  block: ["{{contact_name}}", "{{company_name}}", "{{reason}}", "{{hostname}}", "{{date}}"],
  unblock: ["{{contact_name}}", "{{company_name}}", "{{hostname}}", "{{date}}"],
};

const TEMPLATE_ICONS: Record<string, any> = {
  welcome: UserPlus,
  block: Ban,
  unblock: Unlock,
};

const TEMPLATE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  welcome: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  block: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  unblock: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

export default function WhatsAppPanel({ onLogout }: { onLogout?: () => void }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [sendPhone, setSendPhone] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await whatsappApi("status");
      if (data.configured === false) { setStatus("not_configured"); return; }
      if (data?.Connected || data?.connected || data?.status === "connected") {
        setStatus("connected");
        const profileData = await whatsappApi("profile");
        setProfile(profileData);
        setQrCode(null);
      } else {
        setStatus("disconnected");
      }
    } catch { setStatus("disconnected"); }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const result = await apiFetch("/api/templates");
      if (result.data) setTemplates(result.data as Template[]);
    } catch {}
  }, []);

  useEffect(() => { checkStatus(); loadTemplates(); }, [checkStatus, loadTemplates]);

  const fetchQrCode = async () => {
    setQrLoading(true);
    try {
      const data = await whatsappApi("qrcode");
      if (data?.QRCode || data?.qrcode || data?.qr) {
        setQrCode(data.QRCode || data.qrcode || data.qr);
        toast.success("QR Code gerado! Escaneie com o WhatsApp.");
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
        setTimeout(() => clearInterval(interval), 120000);
      } else { toast.error("Não foi possível gerar o QR Code."); }
    } catch { toast.error("Erro ao buscar QR Code."); }
    finally { setQrLoading(false); }
  };

  const handleLogout = async () => {
    try {
      await whatsappApi("logout");
      setStatus("disconnected"); setProfile(null); setQrCode(null);
      toast.success("WhatsApp desconectado.");
    } catch { toast.error("Erro ao desconectar."); }
  };

  const handleSend = async () => {
    if (!sendPhone.trim() || !sendMessage.trim()) { toast.error("Preencha o número e a mensagem."); return; }
    setSending(true);
    try {
      const data = await whatsappApi("send-text", { phone: sendPhone.trim(), message: sendMessage.trim() });
      if (data?.error) toast.error(`Erro: ${data.error}`);
      else { toast.success("Mensagem enviada!"); setSendMessage(""); }
    } catch { toast.error("Erro ao enviar mensagem."); }
    finally { setSending(false); }
  };

  const startEdit = (tpl: Template) => {
    setEditingKey(tpl.template_key);
    setEditBody(tpl.message_body);
    setPreviewKey(null);
  };

  const cancelEdit = () => { setEditingKey(null); setEditBody(""); };

  const saveTemplate = async (tpl: Template) => {
    setSavingTemplate(true);
    try {
      await apiFetch(`/api/templates/${tpl.id}`, {
        method: "PUT",
        body: JSON.stringify({ message_body: editBody }),
      });
      toast.success(`Template "${tpl.title}" salvo!`);
      setEditingKey(null);
      loadTemplates();
    } catch { toast.error("Erro ao salvar template."); }
    finally { setSavingTemplate(false); }
  };

  const toggleActive = async (tpl: Template) => {
    try {
      await apiFetch(`/api/templates/${tpl.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !tpl.is_active }),
      });
    } catch { toast.error("Erro ao atualizar."); return; }
    toast.success(tpl.is_active ? `"${tpl.title}" desativada` : `"${tpl.title}" ativada`);
    loadTemplates();
  };

  const getPreview = (body: string, key: string) => {
    const sampleVars: Record<string, string> = {
      contact_name: "João Silva",
      company_name: "Empresa Exemplo",
      reason: "Uso não autorizado detectado",
      hostname: "srv-exemplo.com",
      date: new Date().toLocaleString("pt-BR"),
    };
    let preview = body;
    for (const [k, v] of Object.entries(sampleVars)) {
      preview = preview.split(`{{${k}}}`).join(v);
    }
    return preview;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <Button variant="ghost" size="sm" onClick={() => { checkStatus(); loadTemplates(); }} title="Atualizar">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { apiLogout(); onLogout?.(); navigate("/login"); }}>
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
              Execute o instalador no servidor VPS para registrar automaticamente.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left font-mono text-sm max-w-lg mx-auto">
              <p className="text-muted-foreground mb-1"># No seu servidor VPS:</p>
              <p className="text-foreground">curl -sSL https://animate-sale-spark.lovable.app/scripts/instalador_zapmeow.sh | sudo bash</p>
            </div>
          </div>
        )}

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
              <p className="text-sm text-muted-foreground">Escaneie o QR Code com o WhatsApp do celular.</p>
              {!qrCode ? (
                <Button onClick={fetchQrCode} disabled={qrLoading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  {qrLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</> : <><QrCode className="w-4 h-4 mr-2" /> Gerar QR Code</>}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 flex items-center justify-center">
                    <img src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64 object-contain" />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">WhatsApp → Aparelhos conectados → Conectar</p>
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
                <li>Escaneie o QR Code</li>
              </ol>
            </div>
          </div>
        )}

        {/* Connected */}
        {status === "connected" && (
          <div className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
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
                    {profile.Name && <div className="flex justify-between"><span className="text-muted-foreground">Nome:</span><span className="font-medium">{profile.Name || profile.name}</span></div>}
                    {(profile.Phone || profile.phone) && <div className="flex justify-between"><span className="text-muted-foreground">Telefone:</span><span className="font-medium">{profile.Phone || profile.phone}</span></div>}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Enviar Mensagem</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Número (com DDD)</label>
                    <Input placeholder="5511999999999" value={sendPhone} onChange={(e) => setSendPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Mensagem</label>
                    <Textarea placeholder="Sua mensagem..." value={sendMessage} onChange={(e) => setSendMessage(e.target.value)} rows={4} />
                  </div>
                  <Button onClick={handleSend} disabled={sending} className="w-full bg-green-600 hover:bg-green-700 text-white">
                    {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4 mr-2" /> Enviar</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Section - always visible when not loading/not_configured */}
        {(status === "connected" || status === "disconnected") && templates.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Automações & Templates</h2>
              <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                {templates.filter(t => t.is_active).length} ativas
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Edite as mensagens automáticas ou use o padrão. Variáveis disponíveis são substituídas automaticamente.
            </p>

            <div className="space-y-4">
              {templates.map((tpl) => {
                const Icon = TEMPLATE_ICONS[tpl.template_key] || MessageSquare;
                const colors = TEMPLATE_COLORS[tpl.template_key] || { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" };
                const isEditing = editingKey === tpl.template_key;
                const isPreviewing = previewKey === tpl.template_key;
                const hints = VARIABLE_HINTS[tpl.template_key] || [];

                return (
                  <div key={tpl.id} className={`rounded-lg border ${colors.border} ${colors.bg} p-4 space-y-3 transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${colors.color}`} />
                        <span className="text-sm font-semibold">{tpl.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(tpl)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            tpl.is_active
                              ? "bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {tpl.is_active ? "Ativa" : "Inativa"}
                        </button>
                        {!isEditing && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setPreviewKey(isPreviewing ? null : tpl.template_key)} title="Pré-visualizar">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => startEdit(tpl)} title="Editar">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Variable hints */}
                    {hints.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {hints.map(h => (
                          <span key={h} className="text-[10px] font-mono bg-background/60 border border-border/50 px-1.5 py-0.5 rounded">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Editing mode */}
                    {isEditing && (
                      <div className="space-y-3">
                        <Textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={10}
                          className="font-mono text-xs bg-background"
                          placeholder="Corpo da mensagem..."
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => saveTemplate(tpl)} disabled={savingTemplate} className="bg-green-600 hover:bg-green-700 text-white">
                            {savingTemplate ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Preview mode */}
                    {isPreviewing && !isEditing && (
                      <div className="rounded-lg bg-background/80 border border-border/50 p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Pré-visualização</p>
                        <pre className="text-xs whitespace-pre-wrap text-foreground/80 font-sans leading-relaxed">
                          {getPreview(tpl.message_body, tpl.template_key)}
                        </pre>
                      </div>
                    )}

                    {/* Collapsed view - just first line */}
                    {!isEditing && !isPreviewing && (
                      <p className="text-xs text-muted-foreground truncate">
                        {tpl.message_body.split("\n")[0]}...
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bell className="w-4 h-4 text-muted-foreground" />
                Como funciona
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5 ml-6 list-disc">
                <li><strong>Boas-vindas:</strong> Dispara ao enviar o formulário de aquisição</li>
                <li><strong>Bloqueio:</strong> Envia aviso automático ao bloquear uma instalação</li>
                <li><strong>Desbloqueio:</strong> Confirma regularização ao desbloquear</li>
                <li>Variáveis como <code className="bg-background/60 px-1 rounded">{"{{contact_name}}"}</code> são substituídas automaticamente</li>
                <li>Desative uma automação para parar o envio sem excluir o template</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
