import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Shield, Globe, Key, Calendar, Search, RefreshCw, LogOut,
  TrendingUp, Server, Download, Filter, ChevronDown, ChevronUp,
  Eye, EyeOff, AlertTriangle, CheckCircle, Clock, Activity,
  Monitor, Cpu, MapPin, ChevronRight, X, ExternalLink,
  Ban, Unlock, ShieldAlert, ShieldCheck, Lock, Trash2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── TYPES ────────────────────────────────────────────────────────────────────
interface Installation {
  id: number;
  ip: string;
  frontend_url: string;
  backend_url: string;
  admin_url?: string;
  deploy_password?: string;
  master_password?: string;
  hostname?: string;
  os_info?: string;
  installer_version?: string;
  is_blocked: boolean;
  block_reason?: string;
  blocked_at?: string;
  created_at: string;
  updated_at: string;
}

const PALETTE = ["hsl(213,94%,58%)", "hsl(152,68%,46%)", "hsl(36,94%,54%)", "hsl(280,65%,60%)", "hsl(0,72%,55%)"];
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

interface BlockedEntry { reason: string; blockedAt: string; }

// ── API HELPERS ───────────────────────────────────────────────────────────────
async function apiFetch(path: string, opts?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── BLOCKED PAGE PREVIEW MODAL ────────────────────────────────────────────────
function BlockedPreviewModal({ inst, entry, onClose }: {
  inst: Installation; entry?: BlockedEntry; onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in flex items-center justify-center p-6" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto animate-slide-up"
          style={{ boxShadow: "0 32px 80px hsl(0 0% 0% / 0.7)" }}>
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-3 rounded-t-xl"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", borderBottom: "none" }}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="ml-1 font-mono">{inst.frontend_url}</span>
            </div>
            <button onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Simulated blocked page */}
          <div className="rounded-b-xl overflow-hidden"
            style={{ background: "#0a0a0a", border: "1px solid hsl(var(--border))" }}>
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              {/* Animated warning icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse"
                  style={{ background: "hsl(0,72%,55%)" }} />
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(0,72%,55%,0.15), hsl(0,72%,55%,0.05))",
                    border: "2px solid hsl(0,72%,55%,0.5)"
                  }}>
                  <Ban className="w-12 h-12" style={{ color: "hsl(0,72%,55%)" }} />
                </div>
              </div>

              <div className="mb-2 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                style={{ background: "hsl(0,72%,55%,0.12)", color: "hsl(0,72%,55%)", border: "1px solid hsl(0,72%,55%,0.3)" }}>
                ⛔ Acesso Bloqueado
              </div>

              <h1 className="text-3xl font-black text-white mt-4 mb-3 tracking-tight">
                Esta instalação foi bloqueada
              </h1>

              <p className="text-gray-400 text-sm leading-relaxed max-w-md mb-4">
                O uso desta versão do software foi identificado como <strong className="text-red-400">não autorizado</strong>.
                Esta instância foi desativada por violação dos termos de uso e da
                <strong className="text-white"> Lei de Direitos Autorais (Lei 9.610/98)</strong>.
              </p>

              {/* Reason box */}
              {entry?.reason && (
                <div className="w-full max-w-sm rounded-xl px-5 py-3 mb-4 text-left"
                  style={{ background: "hsl(0,72%,55%,0.08)", border: "1px solid hsl(0,72%,55%,0.3)" }}>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Motivo do bloqueio</p>
                  <p className="text-sm font-semibold" style={{ color: "hsl(0,80%,75%)" }}>{entry.reason}</p>
                </div>
              )}

              <div className="w-full max-w-sm rounded-xl px-5 py-4 mb-6 text-left space-y-2"
                style={{ background: "hsl(0,72%,55%,0.06)", border: "1px solid hsl(0,72%,55%,0.2)" }}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">IP bloqueado</span>
                  <code className="text-red-400 font-mono">{inst.ip}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Hostname</span>
                  <code className="text-gray-300 font-mono">{inst.hostname || "—"}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Versão</span>
                  <code className="text-gray-300 font-mono">{inst.installer_version || "—"}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Bloqueado em</span>
                  <code className="text-gray-300 font-mono">
                    {entry?.blockedAt ? format(new Date(entry.blockedAt), "dd/MM/yyyy HH:mm") : format(new Date(), "dd/MM/yyyy HH:mm")}
                  </code>
                </div>
              </div>

              <p className="text-gray-600 text-xs">
                Para regularizar sua licença, entre em contato com{" "}
                <span className="text-gray-400 font-semibold">EquipeChat — By Raphael Batista</span>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Prévia da página que o cliente verá ao acessar o sistema
          </p>
        </div>
      </div>
    </>
  );
}

// ── CONFIRM BLOCK MODAL ───────────────────────────────────────────────────────
const REASON_PRESETS = [
  "Uso não autorizado — pirataria",
  "Licença expirada",
  "Chargeback / inadimplência",
  "Violação dos termos de uso",
  "Revenda não autorizada do código",
];

function ConfirmBlockModal({
  inst, isBlocked, onConfirm, onCancel
}: {
  inst: Installation; isBlocked: boolean;
  onConfirm: (reason: string) => void; onCancel: () => void;
}) {
  const [reason, setReason] = useState(REASON_PRESETS[0]);
  const [custom, setCustom] = useState(false);

  const handleConfirm = () => {
    if (!isBlocked && !reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto animate-slide-up glass-card p-6"
          style={{
            boxShadow: "0 32px 80px hsl(0 0% 0% / 0.6)",
            borderColor: isBlocked ? "hsl(var(--success) / 0.4)" : "hsl(var(--danger) / 0.4)"
          }}>

          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: isBlocked ? "hsl(var(--success) / 0.12)" : "hsl(var(--danger) / 0.12)",
                border: `1px solid ${isBlocked ? "hsl(var(--success) / 0.3)" : "hsl(var(--danger) / 0.3)"}`
              }}>
              {isBlocked
                ? <Unlock className="w-6 h-6" style={{ color: "hsl(var(--success))" }} />
                : <Ban className="w-6 h-6" style={{ color: "hsl(var(--danger))" }} />
              }
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base mb-1">
                {isBlocked ? "Desbloquear instalação?" : "Bloquear instalação?"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isBlocked
                  ? "O acesso ao sistema será restaurado para este servidor."
                  : "O cliente verá uma página de bloqueio com o motivo informado."
                }
              </p>
            </div>
          </div>

          {/* Installation info */}
          <div className="rounded-lg p-3 mb-4 space-y-1.5 text-xs"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP</span>
              <code style={{ color: "hsl(var(--primary))" }}>{inst.ip}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hostname</span>
              <span className="text-foreground">{inst.hostname || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frontend</span>
              <span className="text-foreground truncate ml-4 text-right max-w-48">{inst.frontend_url}</span>
            </div>
          </div>

          {/* Reason field — only for blocking */}
          {!isBlocked && (
            <div className="mb-5 space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Motivo do bloqueio <span style={{ color: "hsl(var(--danger))" }}>*</span>
              </label>

              {/* Presets */}
              {!custom && (
                <div className="space-y-1.5">
                  {REASON_PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => setReason(p)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
                      style={reason === p ? {
                        background: "hsl(var(--danger) / 0.12)",
                        border: "1px solid hsl(var(--danger) / 0.4)",
                        color: "hsl(var(--danger))"
                      } : {
                        background: "hsl(var(--muted))",
                        border: "1px solid hsl(var(--border))",
                        color: "hsl(var(--muted-foreground))"
                      }}>
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => { setCustom(true); setReason(""); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
                    style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                    ✏️ Escrever motivo personalizado...
                  </button>
                </div>
              )}

              {/* Custom textarea */}
              {custom && (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Descreva o motivo do bloqueio..."
                    rows={3}
                    className="input-base w-full px-3 py-2 text-xs resize-none"
                  />
                  <button
                    onClick={() => { setCustom(false); setReason(REASON_PRESETS[0]); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    ← Usar motivo pré-definido
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              style={{ border: "1px solid hsl(var(--border))" }}>
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isBlocked && !reason.trim()}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={isBlocked ? {
                background: "hsl(var(--success) / 0.15)",
                color: "hsl(var(--success))",
                border: "1px solid hsl(var(--success) / 0.4)"
              } : {
                background: "linear-gradient(135deg, hsl(var(--danger)), hsl(0,80%,45%))",
                color: "#fff",
                boxShadow: "0 4px 16px hsl(var(--danger) / 0.35)"
              }}>
              {isBlocked ? "✓ Desbloquear" : "⛔ Confirmar Bloqueio"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── DETAIL DRAWER ─────────────────────────────────────────────────────────────
function SensitiveField({ value }: { value?: string }) {
  const [visible, setVisible] = useState(false);
  if (!value) return <span className="text-muted-foreground text-xs italic">—</span>;
  return (
    <div className="flex items-center gap-1.5 group">
      <code className="text-xs break-all" style={{ color: visible ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))" }}>
        {visible ? value : "••••••••••••"}
      </code>
      <button onClick={() => setVisible(!visible)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all">
        {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </div>
  );
}

function DetailDrawer({
  inst, isBlocked, onClose, onToggleBlock, onPreview
}: {
  inst: Installation; isBlocked: boolean; onClose: () => void;
  onToggleBlock: () => void; onPreview: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md flex flex-col animate-slide-in"
        style={{
          background: "hsl(var(--card))",
          borderLeft: "1px solid hsl(var(--border))",
          boxShadow: "-24px 0 80px hsl(0 0% 0% / 0.5)"
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            {isBlocked ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold badge-danger">
                <Ban className="w-3 h-3" /> BLOQUEADA
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold badge-success">
                <ShieldCheck className="w-3 h-3" /> ATIVA
              </div>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-0">
          {[
            ["#", <span className="text-xs font-mono text-muted-foreground">#{inst.id}</span>],
            ["IP do Servidor", <code className="text-xs font-mono" style={{ color: "hsl(var(--primary))" }}>{inst.ip}</code>],
            ["Hostname", <span className="text-xs text-foreground">{inst.hostname || "—"}</span>],
            ["Sistema Operacional", <span className="text-xs text-foreground">{inst.os_info || "—"}</span>],
            ["Versão do Instalador", inst.installer_version ? <span className="badge-primary">{inst.installer_version}</span> : <span className="text-xs text-muted-foreground">—</span>],
            ["URL Frontend", <a href={inst.frontend_url} target="_blank" rel="noreferrer"
              className="text-xs flex items-center gap-1 hover:underline break-all" style={{ color: "hsl(var(--accent))" }}>
              {inst.frontend_url} <ExternalLink className="w-3 h-3 flex-shrink-0" /></a>],
            ["URL Backend", <a href={inst.backend_url} target="_blank" rel="noreferrer"
              className="text-xs flex items-center gap-1 hover:underline text-muted-foreground break-all">
              {inst.backend_url} <ExternalLink className="w-3 h-3 flex-shrink-0" /></a>],
            ["URL Admin", inst.admin_url ? <a href={inst.admin_url} target="_blank" rel="noreferrer"
              className="text-xs flex items-center gap-1 hover:underline break-all" style={{ color: "hsl(var(--warning))" }}>
              {inst.admin_url} <ExternalLink className="w-3 h-3 flex-shrink-0" /></a> : <span className="text-xs text-muted-foreground">—</span>],
            ["Senha Deploy", <SensitiveField value={inst.deploy_password} />],
            ["Senha Master", <SensitiveField value={inst.master_password} />],
            ["Data de Instalação", <span className="text-xs text-foreground">
              {format(new Date(inst.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </span>],
          ].map(([label, content], i) => (
            <div key={i} className="py-3 border-b border-border last:border-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">{label as string}</p>
              <div>{content as React.ReactNode}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="px-6 py-4 border-t border-border space-y-2.5">
          {/* Preview blocked page */}
          <button onClick={onPreview}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--muted-foreground))"
            }}>
            <Eye className="w-4 h-4" />
            Prévia da página de bloqueio
          </button>

          {/* Block / Unblock */}
          <button onClick={onToggleBlock}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={isBlocked ? {
              background: "hsl(var(--success) / 0.12)",
              border: "1px solid hsl(var(--success) / 0.35)",
              color: "hsl(var(--success))"
            } : {
              background: "hsl(var(--danger) / 0.12)",
              border: "1px solid hsl(var(--danger) / 0.35)",
              color: "hsl(var(--danger))"
            }}>
            {isBlocked ? <><Unlock className="w-4 h-4" /> Desbloquear instalação</> : <><Ban className="w-4 h-4" /> Bloquear instalação</>}
          </button>
        </div>
      </div>
    </>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color?: string; delay?: number;
}) {
  return (
    <div className="stat-card flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          background: `${color ?? "hsl(var(--primary))"}1a`,
          border: `1px solid ${color ?? "hsl(var(--primary))"}40`
        }}>
        <Icon className="w-5 h-5" style={{ color: color ?? "hsl(var(--primary))" }} />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1 truncate">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-none tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────────
export default function MonitorDashboard() {
  const navigate = useNavigate();

  const [installations, setInstallations] = useState<Installation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof Installation>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // Modal states
  const [selectedInst, setSelectedInst] = useState<Installation | null>(null);
  const [confirmInst, setConfirmInst] = useState<Installation | null>(null);
  const [previewInst, setPreviewInst] = useState<Installation | null>(null);
  const [deleteInst, setDeleteInst] = useState<Installation | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch("/manage-installations");
      setInstallations(result.data ?? []);
    } catch (err) {
      console.error("Erro ao carregar instalações:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const versions = useMemo(() => {
    return Array.from(new Set(installations.map(i => i.installer_version || "?"))).sort();
  }, [installations]);

  const filtered = useMemo(() => {
    const cutoff = dateRange === "all" ? null : subDays(new Date(), parseInt(dateRange));
    let result = installations.filter(i => {
      const refDate = new Date(i.updated_at || i.created_at);
      return cutoff ? refDate >= cutoff : true;
    });
    if (statusFilter === "active") result = result.filter(i => !i.is_blocked);
    if (statusFilter === "blocked") result = result.filter(i => i.is_blocked);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.ip.includes(q) ||
        i.frontend_url.toLowerCase().includes(q) ||
        i.backend_url.toLowerCase().includes(q) ||
        (i.hostname?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...result].sort((a, b) => {
      const va = String(a[sortField] ?? "");
      const vb = String(b[sortField] ?? "");
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [installations, search, dateRange, sortField, sortDir, versionFilter, statusFilter]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  useEffect(() => { setPage(1); }, [search, dateRange, versionFilter, statusFilter]);

  // Stats
  const areaData = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const ds = format(date, "dd/MM");
    const count = installations.filter(inst => format(new Date(inst.created_at), "dd/MM") === ds).length;
    return { date: ds, Instalações: count };
  }), [installations]);

  const osData = useMemo(() => {
    const m: Record<string, number> = {};
    installations.forEach(i => { const k = i.os_info || "Desconhecido"; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [installations]);

  const versionData = useMemo(() => {
    const m: Record<string, number> = {};
    installations.forEach(i => { const k = i.installer_version || "?"; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [installations]);

  const handleSort = (field: keyof Installation) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const header = ["ID", "IP", "Hostname", "OS", "Frontend", "Backend", "Versão", "Status", "Data"];
    const rows = filtered.map(i => [
      i.id, i.ip, i.hostname || "", i.os_info || "",
      i.frontend_url, i.backend_url, i.installer_version || "",
      i.is_blocked ? "BLOQUEADA" : "ATIVA",
      format(new Date(i.created_at), "dd/MM/yyyy HH:mm")
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `instalacoes_${format(new Date(), "yyyyMMdd_HHmm")}.csv`
    });
    a.click();
  };

  const SortIcon = ({ field }: { field: keyof Installation }) => (
    sortField === field
      ? sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3 opacity-25" />
  );

  const blockedCount = installations.filter(i => i.is_blocked).length;
  const thisWeek = installations.filter(i => new Date(i.created_at) >= subDays(new Date(), 7)).length;
  const uniqueIPs = new Set(installations.map(i => i.ip)).size;

  // Handlers
  const handleBlockAction = (inst: Installation) => { setConfirmInst(inst); setSelectedInst(null); };
  const handleConfirmBlock = async (reason: string) => {
    if (!confirmInst) return;
    setActionLoading(true);
    try {
      const action = confirmInst.is_blocked ? "unblock" : "block";
      await apiFetch("/manage-installations", {
        method: "POST",
        body: JSON.stringify({ id: confirmInst.id, action, reason }),
      });
      await loadData();
      if (action === "unblock") {
        toast.success(`Instalação #${confirmInst.id} desbloqueada com sucesso`);
      } else {
        toast.success(`Instalação #${confirmInst.id} bloqueada com sucesso`);
      }
    } catch (err) {
      console.error("Erro ao bloquear/desbloquear:", err);
      toast.error("Erro ao executar ação. Tente novamente.");
    } finally {
      setActionLoading(false);
      setConfirmInst(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteInst) return;
    setActionLoading(true);
    try {
      await apiFetch("/manage-installations", {
        method: "POST",
        body: JSON.stringify({ id: deleteInst.id, action: "delete" }),
      });
      await loadData();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    } finally {
      setActionLoading(false);
      setDeleteInst(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 120% 40% at 50% -5%, hsl(var(--primary) / 0.07), transparent)" }} />

      {/* Modals */}
      {selectedInst && (
        <DetailDrawer
          inst={selectedInst}
          isBlocked={selectedInst.is_blocked}
          onClose={() => setSelectedInst(null)}
          onToggleBlock={() => handleBlockAction(selectedInst)}
          onPreview={() => { setPreviewInst(selectedInst); setSelectedInst(null); }}
        />
      )}
      {confirmInst && (
        <ConfirmBlockModal
          inst={confirmInst}
          isBlocked={confirmInst.is_blocked}
          onConfirm={handleConfirmBlock}
          onCancel={() => setConfirmInst(null)}
        />
      )}
      {deleteInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteInst(null)}>
          <div className="glass-card p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(var(--danger) / 0.12)", border: "1px solid hsl(var(--danger) / 0.3)" }}>
                <Trash2 className="w-5 h-5" style={{ color: "hsl(var(--danger))" }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Excluir Instalação</h3>
                <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <div className="p-3 rounded-lg mb-4" style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">#{deleteInst.id}</strong> — {deleteInst.hostname || deleteInst.ip}
                <br />
                <span style={{ color: "hsl(var(--accent))" }}>{deleteInst.frontend_url}</span>
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteInst(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                style={{ background: "hsl(var(--danger))", color: "white" }}>
                <Trash2 className="w-3 h-3" />
                {actionLoading ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
      {previewInst && (
        <BlockedPreviewModal
          inst={previewInst}
          entry={previewInst.is_blocked && previewInst.block_reason
            ? { reason: previewInst.block_reason, blockedAt: previewInst.blocked_at ?? new Date().toISOString() }
            : undefined}
          onClose={() => setPreviewInst(null)}
        />
      )}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 border-b border-border"
        style={{ background: "hsl(var(--card) / 0.85)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.3)" }}>
              <Shield className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm glow-text">EquipeChat</span>
              <span className="text-muted-foreground text-xs hidden sm:inline">Monitor de Instalações</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {blockedCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full badge-danger">
                <Ban className="w-3 h-3" />
                <span className="font-semibold">{blockedCount} bloqueada{blockedCount !== 1 ? "s" : ""}</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
              style={{ background: "hsl(var(--success) / 0.08)", border: "1px solid hsl(var(--success) / 0.25)", color: "hsl(var(--success))" }}>
              <span className="pulse-dot" />
              <span className="font-medium">Ativo</span>
            </div>
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

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Server} label="Total" value={installations.length} sub="instalações" delay={0} />
          <StatCard icon={Clock} label="Esta semana" value={thisWeek} sub="últimos 7 dias" color="hsl(var(--accent))" delay={60} />
          <StatCard icon={Globe} label="Servidores únicos" value={uniqueIPs} sub="IPs distintos" color="hsl(var(--warning))" delay={120} />
          <StatCard icon={Cpu} label="Versões" value={versions.length} sub="em uso" color="hsl(280,65%,60%)" delay={180} />
          <StatCard icon={Ban} label="Bloqueadas" value={blockedCount} sub="instalações" color="hsl(var(--danger))" delay={240} />
        </div>

        {/* ── BLOCKED ALERT ── */}
        {blockedCount > 0 && (
          <div className="glass-card px-5 py-4 flex items-center gap-4 animate-slide-up"
            style={{ borderColor: "hsl(var(--danger) / 0.5)", background: "hsl(var(--danger) / 0.04)" }}>
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--danger) / 0.12)", border: "1px solid hsl(var(--danger) / 0.3)" }}>
              <ShieldAlert className="w-5 h-5" style={{ color: "hsl(var(--danger))" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--danger))" }}>
                {blockedCount} instalação{blockedCount !== 1 ? "s" : ""} bloqueada{blockedCount !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Os clientes bloqueados estão vendo a página de aviso de pirataria.
              </p>
            </div>
            <button onClick={() => setStatusFilter("blocked")}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ background: "hsl(var(--danger) / 0.12)", border: "1px solid hsl(var(--danger) / 0.3)", color: "hsl(var(--danger))" }}>
              Ver bloqueadas →
            </button>
          </div>
        )}

        {/* ── CHARTS ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 lg:col-span-2 animate-fade-in">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              Instalações — últimos 14 dias
            </h2>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(213,94%,58%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(213,94%,58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)" }} labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }} />
                <Area type="monotone" dataKey="Instalações" stroke="hsl(213,94%,58%)" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <Monitor className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              Sistema Operacional
            </h2>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={osData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={3} labelLine={false}>
                  {osData.map((_, idx) => <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {osData.map((d, idx) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PALETTE[idx % PALETTE.length] }} />
                  <span className="text-muted-foreground truncate flex-1">{d.name}</span>
                  <span className="font-semibold text-foreground tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar: versions */}
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-5">
            <CheckCircle className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
            Distribuição por versão
          </h2>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={versionData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 5, 5, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── TABLE ── */}
        <div className="glass-card overflow-hidden animate-fade-in">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: "hsl(var(--warning))" }} />
                <span className="text-sm font-semibold text-foreground">Registro de Instalações</span>
                <span className="badge-primary">{filtered.length}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Status filter */}
                <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: "1px solid hsl(var(--border))" }}>
                  {([
                    { key: "all", label: "Todas" },
                    { key: "active", label: "Ativas" },
                    { key: "blocked", label: "Bloqueadas" },
                  ] as { key: "all" | "active" | "blocked"; label: string }[]).map(s => (
                    <button key={s.key} onClick={() => setStatusFilter(s.key)}
                      className="px-3 py-1.5 font-medium transition-all"
                      style={statusFilter === s.key ? {
                        background: s.key === "blocked" ? "hsl(var(--danger) / 0.15)" : "hsl(var(--primary) / 0.15)",
                        color: s.key === "blocked" ? "hsl(var(--danger))" : "hsl(var(--primary))"
                      } : { background: "hsl(var(--input))", color: "hsl(var(--muted-foreground))" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {/* Period */}
                <select value={dateRange} onChange={e => setDateRange(e.target.value)}
                  className="input-base text-xs px-3 py-1.5">
                  <option value="7">7 dias</option>
                  <option value="30">30 dias</option>
                  <option value="60">60 dias</option>
                  <option value="365">1 ano</option>
                  <option value="all">Todos</option>
                </select>
                {/* Version */}
                <select value={versionFilter} onChange={e => setVersionFilter(e.target.value)}
                  className="input-base text-xs px-3 py-1.5">
                  <option value="all">Todas as versões</option>
                  {versions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="IP, URL, hostname..."
                    className="input-base pl-9 pr-8 py-1.5 text-xs w-48" />
                  {search && (
                    <button onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Export */}
                <button onClick={exportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.3)", color: "hsl(var(--primary))" }}>
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex items-center justify-center gap-3 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
                <Search className="w-8 h-8 opacity-30" />
                <p className="text-sm">Nenhuma instalação encontrada.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: "hsl(var(--muted) / 0.6)", borderBottom: "1px solid hsl(var(--border))" }}>
                    {([
                      { key: "id", label: "#" },
                      { key: "ip", label: "IP" },
                      { key: "hostname", label: "Hostname" },
                      { key: "frontend_url", label: "Frontend" },
                      { key: "installer_version", label: "Versão" },
                      { key: "created_at", label: "Data" },
                      { key: null, label: "Status" },
                      { key: null, label: "Ação" },
                    ] as { key: keyof Installation | null; label: string }[]).map((col, ci) => (
                      <th key={ci}
                        className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap ${col.key ? "cursor-pointer hover:text-foreground transition-colors" : ""}`}
                        onClick={col.key ? () => handleSort(col.key!) : undefined}>
                        <span className="flex items-center gap-1">
                          {col.label}
                          {col.key && <SortIcon field={col.key} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((inst, idx) => {
                    const isInstBlocked = inst.is_blocked;
                    return (
                      <tr key={inst.id}
                        className="table-row-hover border-b border-border cursor-pointer"
                        style={{
                          background: isInstBlocked
                            ? `hsl(var(--danger) / ${idx % 2 === 0 ? "0.05" : "0.08"})`
                            : idx % 2 === 0 ? "transparent" : "hsl(var(--muted) / 0.2)"
                        }}
                        onClick={() => setSelectedInst(inst)}>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{inst.id}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: isInstBlocked ? "hsl(var(--danger))" : "hsl(var(--primary))" }}>
                          {inst.ip}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            {inst.hostname || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs max-w-48">
                          <span className="truncate block" style={{ color: isInstBlocked ? "hsl(var(--muted-foreground))" : "hsl(var(--accent))" }}>
                            {inst.frontend_url}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge-primary text-xs">{inst.installer_version || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(inst.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isInstBlocked ? (
                            <span className="badge-danger"><Ban className="w-3 h-3" />Bloqueada</span>
                          ) : (
                            <span className="badge-success"><ShieldCheck className="w-3 h-3" />Ativa</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setConfirmInst(inst)}
                              title={isInstBlocked ? "Desbloquear" : "Bloquear"}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                              style={isInstBlocked ? {
                                background: "hsl(var(--success) / 0.1)",
                                border: "1px solid hsl(var(--success) / 0.3)",
                                color: "hsl(var(--success))"
                              } : {
                                background: "hsl(var(--danger) / 0.1)",
                                border: "1px solid hsl(var(--danger) / 0.3)",
                                color: "hsl(var(--danger))"
                              }}>
                              {isInstBlocked
                                ? <><Unlock className="w-3 h-3" /> Desbloquear</>
                                : <><Ban className="w-3 h-3" /> Bloquear</>
                              }
                            </button>
                            <button
                              onClick={() => setDeleteInst(inst)}
                              title="Excluir instalação"
                              className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive transition-all"
                              style={{ background: "hsl(var(--muted) / 0.4)" }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 rounded-md transition-all disabled:opacity-40 hover:bg-secondary">← Anterior</button>
                <span className="px-2 tabular-nums">{page}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1 rounded-md transition-all disabled:opacity-40 hover:bg-secondary">Próxima →</button>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              Dados sigilosos — uso restrito
            </div>
          </div>
        </div>

        {/* ── ANTI-PIRACY FOOTER ── */}
        <div className="glass-card px-6 py-5 flex items-start gap-4"
          style={{ borderColor: "hsl(var(--warning) / 0.35)", background: "linear-gradient(135deg, hsl(var(--warning) / 0.04), hsl(var(--card)))" }}>
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
            style={{ background: "hsl(var(--warning) / 0.12)", border: "1px solid hsl(var(--warning) / 0.3)" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "hsl(var(--warning))" }} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--warning))" }}>
              Sistema de Monitoramento Anti-Pirataria Ativo
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Todas as instalações registram automaticamente IP, URLs e credenciais.
              Instalações bloqueadas exibem uma página de aviso de pirataria ao cliente.
              Uso não autorizado está sujeito à <strong className="text-foreground">Lei 9.610/98</strong>.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
