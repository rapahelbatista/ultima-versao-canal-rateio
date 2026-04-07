import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, logout as apiLogout } from "@/lib/api";
import { toast } from "sonner";
import {
  ClipboardList, Plus, Copy, Check, ExternalLink, Clock,
  CheckCircle2, User, Building2, FileText, ShieldCheck, ShieldAlert,
  ChevronDown, ChevronUp, Trash2, Loader2, ArrowLeft, Search,
  RefreshCw, LogOut, Shield
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PurchaseLink {
  id: string;
  token: string;
  client_label: string | null;
  status: string;
  created_at: string;
}

interface PurchaseRequest {
  id: string;
  company_name: string;
  document_type: string;
  document_number: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  usage_type: string;
  how_found_us: string | null;
  agreed_anti_piracy: boolean;
  notes: string | null;
  created_at: string;
  link_id: string | null;
}

export default function ClientFormsDashboard({ onLogout }: { onLogout?: () => void }) {
  const navigate = useNavigate();
  const [links, setLinks] = useState<PurchaseLink[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [expandedLink, setExpandedLink] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [linksData, reqsData] = await Promise.all([
        apiFetch("/api/purchase/links"),
        apiFetch("/api/purchase/requests"),
      ]);
      if (linksData.data) setLinks(linksData.data as PurchaseLink[]);
      if (reqsData.data) setRequests(reqsData.data as PurchaseRequest[]);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createLink = async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase
        .from("purchase_links")
        .insert({ client_label: newLabel.trim() });
      if (error) throw error;
      toast.success("Link criado com sucesso!");
      setNewLabel("");
      setShowCreate(false);
      await loadData();
    } catch {
      toast.error("Erro ao criar link");
    } finally {
      setCreating(false);
    }
  };

  const deleteLink = async (id: string) => {
    try {
      await supabase.from("purchase_links").delete().eq("id", id);
      toast.success("Link removido");
      await loadData();
    } catch {
      toast.error("Erro ao remover link");
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/comprar/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getRequestForLink = (linkId: string) =>
    requests.find((r) => r.link_id === linkId);

  const pendingCount = links.filter((l) => l.status === "pending").length;
  const completedCount = links.filter((l) => l.status === "completed").length;

  const filtered = links.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const req = getRequestForLink(l.id);
      return (
        (l.client_label?.toLowerCase().includes(q) ?? false) ||
        (req?.company_name.toLowerCase().includes(q) ?? false) ||
        (req?.contact_name.toLowerCase().includes(q) ?? false) ||
        (req?.contact_email.toLowerCase().includes(q) ?? false) ||
        (req?.document_number.includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 120% 40% at 50% -5%, hsl(var(--primary) / 0.07), transparent)" }} />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border"
        style={{ background: "hsl(var(--card) / 0.85)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.3)" }}>
              <ClipboardList className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm glow-text">EquipeChat</span>
              <span className="text-muted-foreground text-xs hidden sm:inline">Formulários de Clientes</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{ background: "hsl(var(--warning) / 0.08)", border: "1px solid hsl(var(--warning) / 0.25)", color: "hsl(var(--warning))" }}>
                <Clock className="w-3 h-3" />
                <span className="font-semibold">{pendingCount} pendente{pendingCount !== 1 ? "s" : ""}</span>
              </div>
            )}
            {completedCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{ background: "hsl(var(--success) / 0.08)", border: "1px solid hsl(var(--success) / 0.25)", color: "hsl(var(--success))" }}>
                <CheckCircle2 className="w-3 h-3" />
                <span className="font-semibold">{completedCount} preenchido{completedCount !== 1 ? "s" : ""}</span>
              </div>
            )}
            <button onClick={loadData}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card flex items-start gap-4 animate-slide-up">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.25)" }}>
              <ClipboardList className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold text-foreground leading-none tabular-nums">{links.length}</p>
              <p className="text-xs text-muted-foreground mt-1">formulários</p>
            </div>
          </div>
          <div className="stat-card flex items-start gap-4 animate-slide-up" style={{ animationDelay: "60ms" }}>
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--warning) / 0.1)", border: "1px solid hsl(var(--warning) / 0.25)" }}>
              <Clock className="w-5 h-5" style={{ color: "hsl(var(--warning))" }} />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-foreground leading-none tabular-nums">{pendingCount}</p>
              <p className="text-xs text-muted-foreground mt-1">aguardando</p>
            </div>
          </div>
          <div className="stat-card flex items-start gap-4 animate-slide-up" style={{ animationDelay: "120ms" }}>
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--success) / 0.1)", border: "1px solid hsl(var(--success) / 0.25)" }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "hsl(var(--success))" }} />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Preenchidos</p>
              <p className="text-2xl font-bold text-foreground leading-none tabular-nums">{completedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">respondidos</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="glass-card overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Status filter */}
              <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: "1px solid hsl(var(--border))" }}>
                {([
                  { key: "all", label: "Todos" },
                  { key: "pending", label: "Pendentes" },
                  { key: "completed", label: "Preenchidos" },
                ] as { key: "all" | "pending" | "completed"; label: string }[]).map(s => (
                  <button key={s.key} onClick={() => setStatusFilter(s.key)}
                    className="px-3 py-1.5 font-medium transition-all"
                    style={statusFilter === s.key ? {
                      background: "hsl(var(--primary) / 0.15)",
                      color: "hsl(var(--primary))"
                    } : { background: "hsl(var(--input))", color: "hsl(var(--muted-foreground))" }}>
                    {s.label}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="input-base pl-9 pr-3 py-1.5 text-xs w-48"
                />
              </div>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              <Plus className="w-3.5 h-3.5" />
              Gerar novo link
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="px-6 py-4 border-b border-border flex items-center gap-3"
              style={{ background: "hsl(var(--muted) / 0.3)" }}>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createLink()}
                placeholder="Nome do cliente (ex: Empresa XYZ)"
                className="input-base flex-1 px-3 py-2 text-sm"
                autoFocus
              />
              <button onClick={() => { setShowCreate(false); setNewLabel(""); }}
                className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                style={{ border: "1px solid hsl(var(--border))" }}>
                Cancelar
              </button>
              <button onClick={createLink} disabled={creating || !newLabel.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Criar
              </button>
            </div>
          )}

          {/* Links list */}
          {loading ? (
            <div className="px-6 py-16 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando formulários...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <ClipboardList className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {links.length === 0
                  ? 'Nenhum link gerado ainda. Clique em "Gerar novo link" para começar.'
                  : "Nenhum resultado encontrado para esta busca."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((link) => {
                const req = getRequestForLink(link.id);
                const isCompleted = link.status === "completed";
                const isExpanded = expandedLink === link.id;

                return (
                  <div key={link.id}>
                    {/* Row */}
                    <div className="px-6 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                      {/* Status icon */}
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                        style={isCompleted ? {
                          background: "hsl(var(--success) / 0.12)",
                          border: "1px solid hsl(var(--success) / 0.3)"
                        } : {
                          background: "hsl(var(--warning) / 0.12)",
                          border: "1px solid hsl(var(--warning) / 0.3)"
                        }}>
                        {isCompleted
                          ? <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(var(--success))" }} />
                          : <Clock className="w-4 h-4" style={{ color: "hsl(var(--warning))" }} />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {link.client_label || "Sem nome"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                            style={isCompleted ? {
                              background: "hsl(var(--success) / 0.12)",
                              color: "hsl(var(--success))"
                            } : {
                              background: "hsl(var(--warning) / 0.12)",
                              color: "hsl(var(--warning))"
                            }}>
                            {isCompleted ? "Preenchido" : "Pendente"}
                          </span>
                          {isCompleted && req?.agreed_anti_piracy && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                              style={{ background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }}>
                              <ShieldCheck className="w-3 h-3 inline mr-0.5" />
                              Acordo aceito
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isCompleted && req
                            ? `${req.company_name} · ${req.contact_email}`
                            : `Criado em ${format(new Date(link.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                          }
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyLink(link.token)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                          title="Copiar link">
                          {copiedToken === link.token
                            ? <Check className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                        <a href={`/comprar/${link.token}`} target="_blank" rel="noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                          title="Abrir link">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {isCompleted && (
                          <button onClick={() => setExpandedLink(isExpanded ? null : link.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                            title="Ver dados">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {!isCompleted && (
                          <button onClick={() => deleteLink(link.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            title="Remover link">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && req && (
                      <div className="px-6 pb-5 pt-1">
                        <div className="rounded-xl p-5 space-y-5"
                          style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>

                          {/* Company info */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Building2 className="w-3 h-3" /> Dados da Empresa
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-lg p-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                                <span className="text-xs text-muted-foreground block mb-0.5">Empresa</span>
                                <span className="text-sm text-foreground font-medium">{req.company_name}</span>
                              </div>
                              <div className="rounded-lg p-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                                <span className="text-xs text-muted-foreground block mb-0.5">{req.document_type.toUpperCase()}</span>
                                <span className="text-sm text-foreground font-medium font-mono">{req.document_number}</span>
                              </div>
                            </div>
                          </div>

                          {/* Contact */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <User className="w-3 h-3" /> Contato
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="rounded-lg p-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                                <span className="text-xs text-muted-foreground block mb-0.5">Nome</span>
                                <span className="text-sm text-foreground font-medium">{req.contact_name}</span>
                              </div>
                              <div className="rounded-lg p-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                                <span className="text-xs text-muted-foreground block mb-0.5">E-mail</span>
                                <span className="text-sm text-foreground font-medium">{req.contact_email}</span>
                              </div>
                              {req.contact_phone && (
                                <div className="rounded-lg p-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                                  <span className="text-xs text-muted-foreground block mb-0.5">Telefone</span>
                                  <span className="text-sm text-foreground font-medium">{req.contact_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Usage */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <FileText className="w-3 h-3" /> Informações de Uso
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-lg p-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                                <span className="text-xs text-muted-foreground block mb-0.5">Finalidade</span>
                                <span className="text-sm text-foreground font-medium">
                                  {req.usage_type === "internal" ? "Uso interno" : "Revenda de planos"}
                                </span>
                              </div>
                              {req.how_found_us && (
                                <div className="rounded-lg p-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                                  <span className="text-xs text-muted-foreground block mb-0.5">Como conheceu</span>
                                  <span className="text-sm text-foreground font-medium">{req.how_found_us}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Anti-piracy agreement */}
                          <div className="flex items-center gap-3 pt-3 border-t border-border">
                            {req.agreed_anti_piracy ? (
                              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
                                style={{ background: "hsl(var(--success) / 0.08)", border: "1px solid hsl(var(--success) / 0.3)" }}>
                                <ShieldCheck className="w-5 h-5" style={{ color: "hsl(var(--success))" }} />
                                <span className="text-sm font-semibold" style={{ color: "hsl(var(--success))" }}>
                                  Cliente concordou com os termos antipirataria
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
                                style={{ background: "hsl(var(--danger) / 0.08)", border: "1px solid hsl(var(--danger) / 0.3)" }}>
                                <ShieldAlert className="w-5 h-5" style={{ color: "hsl(var(--danger))" }} />
                                <span className="text-sm font-semibold" style={{ color: "hsl(var(--danger))" }}>
                                  Cliente NÃO concordou com os termos
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {req.notes && (
                            <div className="pt-3 border-t border-border">
                              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Observações</span>
                              <p className="text-sm text-foreground mt-1.5">{req.notes}</p>
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground pt-3 border-t border-border">
                            Preenchido em {format(new Date(req.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground"
            style={{ background: "hsl(var(--muted) / 0.3)" }}>
            <span>{filtered.length} de {links.length} formulários</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              Dados sigilosos — uso restrito
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
