import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ClipboardList, Plus, Copy, Check, ExternalLink, Clock,
  CheckCircle2, User, Building2, FileText, ShieldCheck, ShieldAlert,
  ChevronDown, ChevronUp, Trash2, Loader2
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

export default function ClientLinksPanel() {
  const [links, setLinks] = useState<PurchaseLink[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [expandedLink, setExpandedLink] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [linksRes, reqsRes] = await Promise.all([
        supabase.from("purchase_links").select("*").order("created_at", { ascending: false }),
        supabase.from("purchase_requests").select("*").order("created_at", { ascending: false }),
      ]);
      if (linksRes.data) setLinks(linksRes.data as PurchaseLink[]);
      if (reqsRes.data) setRequests(reqsRes.data as PurchaseRequest[]);
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

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
          <span className="text-sm font-semibold text-foreground">Formulários de Clientes</span>
          <span className="badge-primary">{links.length}</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "hsl(var(--warning) / 0.12)", color: "hsl(var(--warning))", border: "1px solid hsl(var(--warning) / 0.3)" }}>
              {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
            </span>
          )}
          {completedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))", border: "1px solid hsl(var(--success) / 0.3)" }}>
              {completedCount} preenchido{completedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.3)", color: "hsl(var(--primary))" }}>
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
          />
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
        <div className="px-6 py-12 flex items-center justify-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando...
        </div>
      ) : links.length === 0 ? (
        <div className="px-6 py-12 text-center text-muted-foreground text-sm">
          Nenhum link gerado ainda. Clique em "Gerar novo link" para começar.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {links.map((link) => {
            const req = getRequestForLink(link.id);
            const isCompleted = link.status === "completed";
            const isExpanded = expandedLink === link.id;

            return (
              <div key={link.id}>
                {/* Row */}
                <div className="px-6 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                  {/* Status icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
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
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                        style={isCompleted ? {
                          background: "hsl(var(--success) / 0.12)",
                          color: "hsl(var(--success))"
                        } : {
                          background: "hsl(var(--warning) / 0.12)",
                          color: "hsl(var(--warning))"
                        }}>
                        {isCompleted ? "Preenchido" : "Pendente"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criado em {format(new Date(link.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => copyLink(link.token)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                      title="Copiar link">
                      {copiedToken === link.token
                        ? <Check className="w-3.5 h-3.5 text-primary" />
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
                  <div className="px-6 pb-4 pt-1">
                    <div className="rounded-xl p-5 space-y-4"
                      style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>
                      
                      {/* Company info */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> Dados da Empresa
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Empresa:</span>{" "}
                            <span className="text-foreground font-medium">{req.company_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{req.document_type.toUpperCase()}:</span>{" "}
                            <span className="text-foreground font-medium">{req.document_number}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3 h-3" /> Contato
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Nome:</span>{" "}
                            <span className="text-foreground font-medium">{req.contact_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">E-mail:</span>{" "}
                            <span className="text-foreground font-medium">{req.contact_email}</span>
                          </div>
                          {req.contact_phone && (
                            <div>
                              <span className="text-muted-foreground">Telefone:</span>{" "}
                              <span className="text-foreground font-medium">{req.contact_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Usage & agreement */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3 h-3" /> Informações de Uso
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Finalidade:</span>{" "}
                            <span className="text-foreground font-medium">
                              {req.usage_type === "internal" ? "Uso interno" : "Revenda de planos"}
                            </span>
                          </div>
                          {req.how_found_us && (
                            <div>
                              <span className="text-muted-foreground">Como conheceu:</span>{" "}
                              <span className="text-foreground font-medium">{req.how_found_us}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Anti-piracy agreement */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        {req.agreed_anti_piracy ? (
                          <>
                            <ShieldCheck className="w-4 h-4" style={{ color: "hsl(var(--success))" }} />
                            <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>
                              ✓ Cliente concordou com os termos antipirataria
                            </span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4" style={{ color: "hsl(var(--danger))" }} />
                            <span className="text-xs font-semibold" style={{ color: "hsl(var(--danger))" }}>
                              ✗ Cliente NÃO concordou com os termos
                            </span>
                          </>
                        )}
                      </div>

                      {/* Notes */}
                      {req.notes && (
                        <div className="pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">Observações:</span>
                          <p className="text-xs text-foreground mt-1">{req.notes}</p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground pt-2 border-t border-border">
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
    </div>
  );
}
