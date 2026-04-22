import React, { useEffect, useMemo, useState, useCallback, useContext, useRef } from "react";
import { AuthContext } from "../../context/Auth/AuthContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Clock,
  CheckCircle2,
  CheckCheck,
  XCircle,
  RefreshCcw,
  Search,
  ChevronDown,
  X,
  Save,
  Phone,
  Mail,
  Calendar,
  Hash,
  AlertCircle,
  Filter,
  History,
  User as UserIcon,
  ExternalLink,
  Undo2,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Menu,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Divider,
} from "@material-ui/core";
import HistoryIcon from "@material-ui/icons/History";
import SearchIcon from "@material-ui/icons/Search";
import ClearIcon from "@material-ui/icons/Clear";
import SaveIcon from "@material-ui/icons/Save";
import RefreshIcon from "@material-ui/icons/Refresh";
import FilterListIcon from "@material-ui/icons/FilterList";
import GetAppIcon from "@material-ui/icons/GetApp";
import DescriptionIcon from "@material-ui/icons/Description";
import TableChartIcon from "@material-ui/icons/TableChart";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

const useKanbanHeaderStyles = makeStyles((theme) => ({
  headerControl: {
    minWidth: 200,
    marginRight: theme.spacing(1),
    "& .MuiOutlinedInput-root": { borderRadius: 10 },
  },
  searchControl: {
    minWidth: 220,
    marginRight: theme.spacing(1),
    "& .MuiOutlinedInput-root": { borderRadius: 10 },
  },
  button: {
    borderRadius: 10,
  },
  filtersPaper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderRadius: 10,
    border: `1px solid ${theme.palette.divider}`,
  },
  filterField: {
    width: "100%",
    "& .MuiOutlinedInput-root": { borderRadius: 10 },
  },
  filterActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  presetsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  presetInputRow: {
    display: "flex",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
    alignItems: "center",
    flexWrap: "wrap",
  },
  presetChip: {
    margin: theme.spacing(0.5),
  },
  statusBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.5),
    marginBottom: theme.spacing(2),
    borderRadius: 10,
  },
  statusBarRight: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  quickFilter: {
    "& .MuiOutlinedInput-root": { borderRadius: 10 },
    minWidth: 220,
  },
  statusChipActive: {
    fontWeight: 700,
    "&:hover": { opacity: 0.9 },
  },
}));

/**
 * Kanban de Campanha — visualiza e move shippings entre colunas de status.
 * Colunas: pending | delivered | confirmed | failed
 * As mudanças são persistidas via PATCH /campaigns/:id/shipping/:shippingId
 */

const COLUMNS = [
  { id: "pending", label: "Pendente", icon: Clock, color: "amber", border: "border-amber-300" },
  { id: "delivered", label: "Entregue", icon: CheckCircle2, color: "sky", border: "border-sky-300" },
  { id: "confirmed", label: "Confirmado", icon: CheckCheck, color: "emerald", border: "border-emerald-300" },
  { id: "failed", label: "Falhou", icon: XCircle, color: "rose", border: "border-rose-300" },
];

const colorMap = {
  amber: { bg: "bg-amber-50", text: "text-amber-700", chip: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  sky: { bg: "bg-sky-50", text: "text-sky-700", chip: "bg-sky-100 text-sky-700", dot: "bg-sky-400" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", chip: "bg-rose-100 text-rose-700", dot: "bg-rose-400" },
};

const inferStatus = (s) => {
  if (!s) return "pending";
  const msg = (s.message || "").toString();
  if (msg.startsWith("[FAILED]")) return "failed";
  if (s.confirmedAt) return "confirmed";
  if (s.deliveredAt) return "delivered";
  return "pending";
};

// Separa a parte "mensagem" da parte "[NOTE]observações" persistida no campo message.
const parseMessage = (raw) => {
  const m = (raw || "").replace(/^\[FAILED\]\s*/, "");
  const idx = m.indexOf("\n[NOTE]");
  if (idx === -1) return { message: m, notes: "" };
  return { message: m.slice(0, idx), notes: m.slice(idx + "\n[NOTE]".length) };
};

// Sentinela para infinite scroll: dispara `onReach` quando o elemento entra
// no viewport do container scrollável (rootMargin grande = pré-carrega antes do fim).
const InfiniteSentinel = ({ onReach, disabled, rootRef }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (disabled) return;
    const node = ref.current;
    if (!node) return;
    const root = rootRef?.current || null;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { onReach(); break; }
        }
      },
      { root, rootMargin: "400px 0px", threshold: 0 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [onReach, disabled, rootRef]);
  return <div ref={ref} aria-hidden className="h-1 w-full" />;
};

const CampaignKanban = () => {
  const { user, socket } = useContext(AuthContext);
  const [liveTick, setLiveTick] = useState(0); // pulso visual ao receber evento
  const refetchTimer = useRef(null);
  // Refs por coluna p/ infinite scroll (usadas como root do IntersectionObserver)
  const columnScrollRefs = useRef({ pending: null, delivered: null, confirmed: null, failed: null });
  const setColumnScrollRef = (status) => (node) => { columnScrollRefs.current[status] = node; };
  const getColumnScrollRef = (status) => ({ current: columnScrollRefs.current[status] });
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState("");
  const [shipping, setShipping] = useState([]); // mantido p/ compatibilidade c/ bulk/optimistic
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  // Filtros avançados
  const [showFilters, setShowFilters] = useState(false);
  const [filterPhone, setFilterPhone] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [pageSize, setPageSize] = useState(50);
  // Presets de filtros avançados (persistidos por usuário em localStorage)
  const presetsStorageKey = useMemo(
    () => `campaignKanban:filterPresets:${user?.id || "anon"}`,
    [user?.id]
  );
  const [filterPresets, setFilterPresets] = useState([]);
  const [presetName, setPresetName] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(presetsStorageKey);
      setFilterPresets(raw ? JSON.parse(raw) : []);
    } catch { setFilterPresets([]); }
  }, [presetsStorageKey]);
  const persistPresets = useCallback((next) => {
    setFilterPresets(next);
    try { localStorage.setItem(presetsStorageKey, JSON.stringify(next)); } catch {}
  }, [presetsStorageKey]);
  const saveCurrentAsPreset = useCallback(() => {
    const name = presetName.trim();
    if (!name) { toast.warn("Dê um nome ao preset"); return; }
    const preset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      filters: {
        search,
        filterPhone,
        filterStartDate,
        filterEndDate,
        pageSize,
        visibleStatuses: Array.from(visibleStatuses),
      },
    };
    // Substitui se já existir um com mesmo nome (case-insensitive)
    const without = filterPresets.filter(
      (p) => p.name.toLowerCase() !== name.toLowerCase()
    );
    persistPresets([preset, ...without].slice(0, 20));
    setPresetName("");
    toast.success(`Preset "${name}" salvo`);
  }, [presetName, search, filterPhone, filterStartDate, filterEndDate, pageSize, visibleStatuses, filterPresets, persistPresets]);
  const applyPreset = useCallback((p) => {
    if (!p?.filters) return;
    setSearch(p.filters.search || "");
    setFilterPhone(p.filters.filterPhone || "");
    setFilterStartDate(p.filters.filterStartDate || "");
    setFilterEndDate(p.filters.filterEndDate || "");
    setPageSize(p.filters.pageSize || 50);
    if (Array.isArray(p.filters.visibleStatuses) && p.filters.visibleStatuses.length) {
      setVisibleStatuses(new Set(p.filters.visibleStatuses));
    }
    toast.success(`Preset "${p.name}" aplicado`);
  }, []);
  const deletePreset = useCallback((id) => {
    persistPresets(filterPresets.filter((p) => p.id !== id));
  }, [filterPresets, persistPresets]);
  // Visibilidade por status (todos visíveis por padrão)
  const [visibleStatuses, setVisibleStatuses] = useState(() => new Set(["pending", "delivered", "confirmed", "failed"]));
  const toggleStatusVisible = (id) =>
    setVisibleStatuses((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      // Sempre manter ao menos um visível
      return n.size === 0 ? prev : n;
    });
  const showOnly = (id) => setVisibleStatuses(new Set([id]));
  const showAll = () => setVisibleStatuses(new Set(["pending", "delivered", "confirmed", "failed"]));
  // Quick filter: busca local no nome/número (não dispara fetch)
  const [quickFilter, setQuickFilter] = useState("");
  const matchesQuickFilter = useCallback((item) => {
    const q = quickFilter.trim().toLowerCase();
    if (!q) return true;
    const name = (item.contact?.name || "").toLowerCase();
    const number = (item.number || "").toLowerCase();
    return name.includes(q) || number.includes(q);
  }, [quickFilter]);
  // Estado por coluna: { items, page, total, hasMore, loading }
  const [columnsState, setColumnsState] = useState(() => ({
    pending: { items: [], page: 0, total: 0, hasMore: true, loading: false },
    delivered: { items: [], page: 0, total: 0, hasMore: true, loading: false },
    confirmed: { items: [], page: 0, total: 0, hasMore: true, loading: false },
    failed: { items: [], page: 0, total: 0, hasMore: true, loading: false },
  }));
  const [selected, setSelected] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  // Progresso visual da operação em massa: { total, processed, status, success, failed, phase }
  // phase: "processing" | "done" | "error"
  const [bulkProgress, setBulkProgress] = useState(null);
  const bulkProgressTimer = useRef(null);
  // Confirmação pendente após drag de um card selecionado (move massa)
  const [pendingBulkMove, setPendingBulkMove] = useState(null); // { newStatus, count, sourceStatus }

  // Última atualização em massa (botão "Desfazer" temporário)
  const [lastBulkUpdate, setLastBulkUpdate] = useState(null); // { id, status, count, expiresAt }
  const [undoing, setUndoing] = useState(false);
  const [undoTick, setUndoTick] = useState(0);

  // Histórico de atualizações em massa
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyScope, setHistoryScope] = useState("campaign"); // "campaign" | "all"
  const [historyDetail, setHistoryDetail] = useState(null); // { log, shippings }
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all"); // "all" | status id

  const filteredHistoryRecords = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return historyRecords.filter((r) => {
      if (historyStatusFilter !== "all" && r.newStatus !== historyStatusFilter) return false;
      if (!q) return true;
      const name = (r.userName || "").toLowerCase();
      const id = String(r.id || "");
      return name.includes(q) || id.includes(q);
    });
  }, [historyRecords, historySearch, historyStatusFilter]);

  const historyStatusCounts = useMemo(() => {
    const map = {};
    for (const r of historyRecords) {
      map[r.newStatus] = (map[r.newStatus] || 0) + 1;
    }
    return map;
  }, [historyRecords]);

  const fetchHistory = useCallback(async (scope = historyScope) => {
    setHistoryLoading(true);
    try {
      const params = { pageSize: 50, pageNumber: 1 };
      if (scope === "campaign" && campaignId) params.campaignId = campaignId;
      const { data } = await api.get("/campaigns/bulk-updates/history", { params });
      setHistoryRecords(data?.records || []);
    } catch (e) {
      toast.error("Falha ao carregar histórico");
    } finally {
      setHistoryLoading(false);
    }
  }, [campaignId, historyScope]);

  const openHistory = () => {
    setHistoryOpen(true);
    fetchHistory(historyScope);
  };

  const openHistoryDetail = async (logId) => {
    setHistoryDetailLoading(true);
    setHistoryDetail({ log: null, shippings: [] });
    try {
      const { data } = await api.get(`/campaigns/bulk-updates/${logId}`);
      setHistoryDetail(data);
    } catch (e) {
      toast.error("Falha ao carregar detalhes");
      setHistoryDetail(null);
    } finally {
      setHistoryDetailLoading(false);
    }
  };

  // Tick a cada 1s p/ contador regressivo + auto-dismiss do banner de undo
  useEffect(() => {
    if (!lastBulkUpdate) return;
    const t = setInterval(() => setUndoTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [lastBulkUpdate]);
  useEffect(() => {
    if (!lastBulkUpdate) return;
    if (Date.now() >= lastBulkUpdate.expiresAt) setLastBulkUpdate(null);
  }, [undoTick, lastBulkUpdate]);

  const undoBulkUpdate = async (bulkId) => {
    if (!bulkId || undoing) return;
    setUndoing(true);
    try {
      const { data } = await api.post(`/campaigns/bulk-updates/${bulkId}/undo`);
      const restored = data?.restored ?? 0;
      const failed = data?.failed ?? 0;

      // Normaliza lista de falhas vindo do backend (vários formatos possíveis)
      const rawFailures =
        data?.failures ||
        data?.failedItems ||
        data?.errors ||
        (Array.isArray(data?.failedIds)
          ? data.failedIds.map((id) => ({ id, reason: data?.failedReason || "Não foi possível restaurar" }))
          : []);
      const failures = Array.isArray(rawFailures)
        ? rawFailures.map((f) => ({
            id: f?.id ?? f?.shippingId ?? f?.shipping_id ?? "?",
            reason: f?.reason || f?.error || f?.message || "Motivo não informado",
          }))
        : [];

      if (restored > 0 && failed === 0) {
        toast.success(`Atualização revertida — ${restored} envio(s) restaurado(s)`, { autoClose: 4000 });
      } else if (failed > 0) {
        // Agrupa por motivo
        const byReason = failures.reduce((acc, f) => {
          (acc[f.reason] ||= []).push(f.id);
          return acc;
        }, {});
        const reasonEntries = Object.entries(byReason);

        const ToastBody = (
          <div className="text-[12px] leading-snug">
            <div className="font-bold mb-1">
              ⚠️ Desfazer parcial: {restored} restaurado(s), {failed} falharam
            </div>
            {reasonEntries.length > 0 ? (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {reasonEntries.map(([reason, ids]) => (
                  <li key={reason}>
                    <div className="font-semibold text-rose-700">{reason}</div>
                    <div className="text-slate-600 text-[11px] break-words">
                      {ids.length} envio(s): {ids.slice(0, 12).map((i) => `#${i}`).join(", ")}
                      {ids.length > 12 ? `, +${ids.length - 12}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-slate-600">
                O servidor não retornou detalhes dos envios que falharam.
              </div>
            )}
          </div>
        );

        if (restored > 0) {
          toast.warn(ToastBody, { autoClose: 9000, closeOnClick: false });
        } else {
          toast.error(ToastBody, { autoClose: 10000, closeOnClick: false });
        }
      } else {
        toast.error("Não foi possível desfazer — nenhum envio restaurado");
      }

      setLastBulkUpdate(null);
      // Atualiza histórico aberto e board
      if (historyOpen) fetchHistory(historyScope);
      if (historyDetail?.log?.id === bulkId) {
        try {
          const { data: refreshed } = await api.get(`/campaigns/bulk-updates/${bulkId}`);
          setHistoryDetail(refreshed);
        } catch { /* ignore */ }
      }
      fetchShipping();
    } catch (err) {
      const status = err?.response?.status;
      const payload = err?.response?.data || {};
      const baseMsg = payload.error || payload.message || "Falha ao desfazer";
      const failures = Array.isArray(payload.failures || payload.failedItems)
        ? (payload.failures || payload.failedItems)
        : [];
      if (failures.length > 0) {
        toast.error(
          <div className="text-[12px] leading-snug">
            <div className="font-bold mb-1">❌ {baseMsg}{status ? ` (HTTP ${status})` : ""}</div>
            <ul className="space-y-0.5 max-h-40 overflow-y-auto pr-1 text-[11px] text-slate-700">
              {failures.slice(0, 20).map((f, i) => (
                <li key={i}>
                  <span className="font-mono">#{f.id ?? f.shippingId ?? "?"}</span>
                  {" — "}
                  <span className="text-rose-700">{f.reason || f.error || f.message || "erro"}</span>
                </li>
              ))}
              {failures.length > 20 && (
                <li className="italic text-slate-500">+{failures.length - 20} outro(s)…</li>
              )}
            </ul>
          </div>,
          { autoClose: 10000, closeOnClick: false }
        );
      } else {
        toast.error(`${baseMsg}${status ? ` (HTTP ${status})` : ""}`, { autoClose: 6000 });
      }
    } finally {
      setUndoing(false);
    }
  };

  const isSelected = (id) => selectedIds.has(id);
  const hasSelection = selectedIds.size > 0;

  const toggleSelect = (id) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectAllInColumn = (items) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      const ids = items.map((i) => i.id).filter(Boolean);
      const allIn = ids.every((id) => n.has(id));
      if (allIn) ids.forEach((id) => n.delete(id));
      else ids.forEach((id) => n.add(id));
      return n;
    });
  };

  const bulkUpdateStatus = async (newStatus) => {
    if (!hasSelection || !campaignId) return;
    const ids = Array.from(selectedIds);
    const total = ids.length;
    setBulkUpdating(true);

    // Inicia indicador de progresso. Como o backend processa em lote sem streaming,
    // simulamos avanço suave (assintótico até ~92%) e fechamos quando a resposta chega.
    setBulkProgress({ total, processed: 0, status: newStatus, success: 0, failed: 0, phase: "processing" });
    if (bulkProgressTimer.current) clearInterval(bulkProgressTimer.current);
    const startedAt = Date.now();
    bulkProgressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      // Curva: ~80% em ~3s, satura em 92%; nunca passa para evitar falsa promessa
      const ratio = 1 - Math.exp(-elapsed / 1500);
      const projected = Math.min(0.92, ratio * 0.92);
      setBulkProgress((p) => p && p.phase === "processing"
        ? { ...p, processed: Math.max(p.processed, Math.floor(total * projected)) }
        : p);
    }, 120);

    const stopProgress = () => {
      if (bulkProgressTimer.current) {
        clearInterval(bulkProgressTimer.current);
        bulkProgressTimer.current = null;
      }
    };

    // Optimistic local: aplica imediatamente em columnsState (movendo os cards) e em shipping
    const prevShipping = shipping;
    applyStatusLocally(ids, newStatus);

    try {
      const { data } = await api.post(
        `/campaigns/${campaignId}/shipping/bulk-status`,
        { status: newStatus, shippingIds: ids, source: "kanban" }
      );
      const ok = data?.successCount ?? ids.length;
      const fail = data?.failedCount ?? 0;
      const bulkId = data?.bulkUpdateId;
      stopProgress();
      setBulkProgress({ total, processed: total, status: newStatus, success: ok, failed: fail, phase: fail === total ? "error" : "done" });
      // Auto-some após 2.2s
      setTimeout(() => setBulkProgress(null), 2200);
      setBulkUpdating(false);
      if (fail === 0) {
        toast.success(`${ok} envio(s) atualizados para "${newStatus}"`);
        reconcileShipping(ids, newStatus);
      } else if (ok === 0) {
        setShipping(prevShipping);
        fetchShipping();
        toast.error("Falha ao atualizar envios");
      } else {
        toast.warn(`${ok} atualizados, ${fail} falharam`);
        reconcileShipping(ids, newStatus);
      }
      if (bulkId && ok > 0) {
        setLastBulkUpdate({
          id: bulkId,
          status: newStatus,
          count: ok,
          expiresAt: Date.now() + 30_000
        });
      }
      clearSelection();
    } catch (err) {
      stopProgress();
      setBulkProgress({ total, processed: total, status: newStatus, success: 0, failed: total, phase: "error" });
      setTimeout(() => setBulkProgress(null), 2500);
      setBulkUpdating(false);
      setShipping(prevShipping);
      fetchShipping();
      toast.error("Falha ao atualizar envios");
    }
  };

  const openDetails = (item) => {
    // Em modo seleção, clique no card alterna seleção em vez de abrir modal
    if (hasSelection) {
      toggleSelect(item.id);
      return;
    }
    if (!item.id) {
      toast.warn("Envio ainda não processado — sem detalhes para exibir");
      return;
    }
    const parsed = parseMessage(item.message);
    setSelected(item);
    setEditMessage(parsed.message);
    setEditNotes(parsed.notes);
  };

  const closeDetails = () => {
    setSelected(null);
    setEditMessage("");
    setEditNotes("");
  };

  const saveContent = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { data } = await api.put(
        `/campaigns/${campaignId}/shipping/${selected.id}`,
        { message: editMessage, notes: editNotes }
      );
      // Atualiza local
      setShipping((arr) =>
        arr.map((s) => (s.id === selected.id ? { ...s, message: data.message } : s))
      );
      toast.success("Envio atualizado");
      closeDetails();
    } catch (e) {
      toast.error("Falha ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  // Buscar lista de campanhas para o seletor
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/campaigns/list");
        const list = Array.isArray(data) ? data : data?.records || [];
        setCampaigns(list);
        if (list.length && !campaignId) setCampaignId(String(list[0].id));
      } catch (e) {
        toast.error("Erro ao carregar campanhas");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega mais uma página de uma coluna específica
  const loadColumn = useCallback(async (status) => {
    if (!campaignId) return;
    let nextPage = 1;
    setColumnsState((prev) => {
      const cur = prev[status];
      if (cur.loading || !cur.hasMore) { nextPage = -1; return prev; }
      nextPage = (cur.page || 0) + 1;
      return { ...prev, [status]: { ...cur, loading: true } };
    });
    if (nextPage === -1) return;

    try {
      const term = (filterPhone || search || "").trim();
      const { data } = await api.get(`/campaigns/${campaignId}/shipping`, {
        params: {
          page: nextPage,
          pageSize,
          status,
          searchParam: term || undefined,
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
        },
      });
      const items = data?.shipping || [];
      const total = data?.count ?? 0;
      setColumnsState((prev) => {
        const baseItems = [...prev[status].items, ...items];
        return {
          ...prev,
          [status]: {
            items: baseItems,
            page: nextPage,
            total,
            hasMore: baseItems.length < total,
            loading: false,
          },
        };
      });
      setShipping((cur) => {
        const ids = new Set(items.filter((i) => i.id).map((i) => i.id));
        const merged = cur.filter((s) => !s.id || !ids.has(s.id));
        return [...merged, ...items];
      });
    } catch (e) {
      toast.error(`Erro ao carregar mais (${status})`);
      setColumnsState((prev) => ({ ...prev, [status]: { ...prev[status], loading: false } }));
    }
  }, [campaignId, filterPhone, search, pageSize, filterStartDate, filterEndDate]);

  // Recarrega todas as colunas em paralelo
  const fetchShipping = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      setColumnsState({
        pending: { items: [], page: 0, total: 0, hasMore: true, loading: true },
        delivered: { items: [], page: 0, total: 0, hasMore: true, loading: true },
        confirmed: { items: [], page: 0, total: 0, hasMore: true, loading: true },
        failed: { items: [], page: 0, total: 0, hasMore: true, loading: true },
      });
      const term = (filterPhone || search || "").trim();
      const results = await Promise.all(
        ["pending", "delivered", "confirmed", "failed"].map((status) =>
          api.get(`/campaigns/${campaignId}/shipping`, {
            params: {
              page: 1,
              pageSize,
              status,
              searchParam: term || undefined,
              startDate: filterStartDate || undefined,
              endDate: filterEndDate || undefined,
            },
          }).then((r) => ({ status, data: r.data }))
        )
      );
      const newCols = {};
      const flat = [];
      results.forEach(({ status, data }) => {
        const items = data?.shipping || [];
        const total = data?.count ?? items.length;
        newCols[status] = {
          items,
          page: 1,
          total,
          hasMore: items.length < total,
          loading: false,
        };
        flat.push(...items);
      });
      setColumnsState(newCols);
      setShipping(flat);
    } catch (e) {
      toast.error("Erro ao buscar envios");
    } finally {
      setLoading(false);
    }
  }, [campaignId, search, filterPhone, filterStartDate, filterEndDate, pageSize]);

  // Aplica novo status a um conjunto de envios DIRETAMENTE no estado local (columnsState + shipping)
  // movendo os cards para a coluna alvo sem refetch.
  const applyStatusLocally = useCallback((ids, newStatus) => {
    const idSet = new Set(ids.map((x) => Number(x)).filter(Boolean));
    if (idSet.size === 0) return;
    const now = new Date().toISOString();

    const patchItem = (s) => {
      const patch = { ...s };
      switch (newStatus) {
        case "pending":
          patch.deliveredAt = null; patch.confirmedAt = null; break;
        case "delivered":
          patch.deliveredAt = patch.deliveredAt || now; patch.confirmedAt = null; break;
        case "confirmed":
          patch.deliveredAt = patch.deliveredAt || now; patch.confirmedAt = now; break;
        case "failed":
          patch.deliveredAt = null; patch.confirmedAt = null;
          patch.message = `[FAILED] ${(patch.message || "").replace(/^\[FAILED\]\s*/, "")}`;
          break;
        default: break;
      }
      return patch;
    };

    setColumnsState((prev) => {
      const next = {
        pending: { ...prev.pending },
        delivered: { ...prev.delivered },
        confirmed: { ...prev.confirmed },
        failed: { ...prev.failed },
      };
      const moved = [];

      // Remove dos demais e coleta os movidos com o patch aplicado
      ["pending", "delivered", "confirmed", "failed"].forEach((col) => {
        if (col === newStatus) return;
        const keep = [];
        let removed = 0;
        next[col].items.forEach((it) => {
          if (it.id && idSet.has(Number(it.id))) {
            moved.push(patchItem(it));
            removed += 1;
          } else {
            keep.push(it);
          }
        });
        if (removed > 0) {
          next[col] = {
            ...next[col],
            items: keep,
            total: Math.max(0, (next[col].total || 0) - removed),
          };
        }
      });

      // Patch in-place dos que já estão na coluna alvo
      const targetItems = next[newStatus].items.map((it) =>
        it.id && idSet.has(Number(it.id)) ? patchItem(it) : it
      );

      // Adiciona os movidos no topo da coluna alvo (sem duplicar)
      const existing = new Set(targetItems.map((i) => i.id).filter(Boolean));
      const fresh = moved.filter((m) => !existing.has(Number(m.id)));
      next[newStatus] = {
        ...next[newStatus],
        items: [...fresh, ...targetItems],
        total: (next[newStatus].total || 0) + fresh.length,
      };
      return next;
    });

    setShipping((cur) => cur.map((s) => (s.id && idSet.has(Number(s.id)) ? patchItem(s) : s)));
  }, []);

  // Reconciliação leve com debounce: confirma com o servidor se os ids realmente
  // estão na coluna esperada. Só dispara `fetchShipping` completo se houver divergência.
  const reconcileTimer = useRef(null);
  const reconcileShipping = useCallback((ids, expectedStatus) => {
    if (!campaignId || !ids || ids.length === 0) return;
    if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
    reconcileTimer.current = setTimeout(async () => {
      reconcileTimer.current = null;
      try {
        const expected = new Set(ids.map((x) => Number(x)).filter(Boolean));
        const sample = Math.max(50, Math.min(500, expected.size * 4));
        const { data } = await api.get(`/campaigns/${campaignId}/shipping`, {
          params: {
            page: 1,
            pageSize: sample,
            status: expectedStatus,
          },
        });
        const returned = new Set((data?.shipping || []).map((s) => Number(s.id)).filter(Boolean));
        const missing = [...expected].filter((id) => !returned.has(id));
        // Divergência: backend não confirma estado esperado — recarrega tudo
        if (missing.length > 0) fetchShipping();
      } catch {
        // Em erro de rede, evita fetch agressivo; socket eventualmente dispara refresh
      }
    }, 600);
  }, [campaignId, fetchShipping]);

  useEffect(() => {
    fetchShipping();
  }, [fetchShipping]);

  // Ref síncrona com o campaignId atual — evita closures obsoletas em listeners de socket
  const campaignIdRef = useRef(null);
  useEffect(() => {
    campaignIdRef.current = campaignId ? Number(campaignId) : null;
  }, [campaignId]);

  // Refs do histórico p/ uso dentro de handlers de socket sem rebind do efeito
  const historyOpenRef = useRef(false);
  const historyScopeRef = useRef("campaign");
  const historyDetailRef = useRef(null);
  const fetchHistoryRef = useRef(null);
  useEffect(() => { historyOpenRef.current = historyOpen; }, [historyOpen]);
  useEffect(() => { historyScopeRef.current = historyScope; }, [historyScope]);
  useEffect(() => { historyDetailRef.current = historyDetail; }, [historyDetail]);
  useEffect(() => { fetchHistoryRef.current = fetchHistory; }, [fetchHistory]);

  // Ref síncrona com o estado das colunas — usada em lookups dentro de handlers de socket
  const columnsStateRef = useRef(null);
  useEffect(() => { columnsStateRef.current = columnsState; }, [columnsState]);


  // Estado de conexão do socket: "connected" | "reconnecting" | "disconnected"
  const [connState, setConnState] = useState(() => (socket?.connected ? "connected" : "disconnected"));
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wasConnectedRef = useRef(!!socket?.connected);

  useEffect(() => {
    if (!socket) {
      setConnState("disconnected");
      return;
    }
    setConnState(socket.connected ? "connected" : "disconnected");

    const onConnect = () => {
      setConnState("connected");
      setReconnectAttempt(0);
      // Avisar apenas em RECONEXÃO (não na conexão inicial)
      if (wasConnectedRef.current === false) {
        toast.success("Conexão em tempo real restabelecida");
        // Refaz o fetch para garantir consistência após período offline
        if (campaignIdRef.current) fetchShipping();
      }
      wasConnectedRef.current = true;
    };

    const onDisconnect = (reason) => {
      setConnState("disconnected");
      if (wasConnectedRef.current) {
        // Não polui com toast em quedas silenciosas (ex.: HMR), mas avisa nas reais
        if (reason !== "io client disconnect") {
          toast.warn("Conexão em tempo real perdida — tentando reconectar...");
        }
      }
      wasConnectedRef.current = false;
    };

    const onReconnectAttempt = (attempt) => {
      setConnState("reconnecting");
      setReconnectAttempt(Number(attempt) || 0);
    };

    const onReconnect = () => {
      // Engine.io também dispara `connect` em seguida — onConnect cuidará do toast
      setConnState("connected");
      setReconnectAttempt(0);
    };

    const onReconnectError = () => {
      setConnState("reconnecting");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    // socket.io v3/v4: eventos de reconexão emitidos no manager
    const mgr = socket.io;
    if (mgr) {
      mgr.on("reconnect_attempt", onReconnectAttempt);
      mgr.on("reconnect", onReconnect);
      mgr.on("reconnect_error", onReconnectError);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      if (mgr) {
        mgr.off("reconnect_attempt", onReconnectAttempt);
        mgr.off("reconnect", onReconnect);
        mgr.off("reconnect_error", onReconnectError);
      }
    };
  }, [socket, fetchShipping]);

  // Tenta reconectar manualmente
  const reconnectSocket = useCallback(() => {
    if (!socket) return;
    if (socket.connected) {
      toast.info("Já conectado");
      return;
    }
    setConnState("reconnecting");
    try {
      socket.connect();
    } catch { /* ignore */ }
  }, [socket]);

  // Quando a aba volta a ficar visível e o socket está caído, tenta reconectar
  useEffect(() => {
    if (!socket) return;
    const onVis = () => {
      if (document.visibilityState === "visible" && !socket.connected) {
        setConnState("reconnecting");
        try { socket.connect(); } catch { /* ignore */ }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [socket]);

  // Real-time: escuta eventos do socket da empresa para refletir mudanças instantaneamente.
  // Garantias:
  //  - Só processa eventos cujo `campaignId` bate EXATAMENTE com o atualmente aberto.
  //  - Eventos sem `campaignId` são ignorados (não há como confirmar pertencimento).
  //  - Se `campaignId` mudar entre o agendamento e a execução do refetch, o callback é descartado.
  //  - Cada handler é "carimbado" com o id da campanha em que foi montado (boundCampaignId)
  //    e qualquer divergência (ex.: troca rápida de campanha) descarta o evento.
  useEffect(() => {
    if (!socket || !user?.companyId || !campaignId) return;
    const channel = `company-${user.companyId}-campaign`;
    const boundCampaignId = Number(campaignId);

    const scheduleRefetch = () => {
      if (refetchTimer.current) return;
      refetchTimer.current = setTimeout(() => {
        refetchTimer.current = null;
        // Se a campanha mudou nesse meio tempo, descarta
        if (campaignIdRef.current !== boundCampaignId) return;
        fetchShipping();
      }, 400); // debounce p/ rajadas de eventos
    };

    const pulse = () => {
      if (campaignIdRef.current !== boundCampaignId) return;
      setLiveTick((t) => t + 1);
    };

    // Aplica mudança incremental de status diretamente nas colunas, evitando refetch.
    // Retorna true se conseguiu aplicar localmente; false se precisa de refetch.
    const tryApplyEventLocally = (data) => {
      // Caso 1: bulk com lista explícita de ids + status alvo
      if (
        (data.action === "shipping-bulk-update" || data.action === "shipping-bulk-undo") &&
        Array.isArray(data.shippingIds) && data.shippingIds.length > 0 &&
        typeof data.status === "string"
      ) {
        applyStatusLocally(data.shippingIds, data.status);
        return true;
      }
      // Caso 2: update individual — precisa do id do shipping e de algum sinal de status
      const sid = data.shippingId ?? data.shipping?.id ?? data.record?.id;
      if (sid != null) {
        let newStatus = null;
        if (typeof data.status === "string") {
          newStatus = data.status;
        } else if (data.shipping || data.record) {
          newStatus = inferStatus(data.shipping || data.record);
        } else if (data.action === "delivered") {
          newStatus = "delivered";
        } else if (data.action === "confirmed") {
          newStatus = "confirmed";
        }
        if (newStatus && ["pending", "delivered", "confirmed", "failed"].includes(newStatus)) {
          applyStatusLocally([sid], newStatus);
          return true;
        }
      }
      return false;
    };

    // Cache de deduplicação de eventos: chave estável -> timestamp da 1ª vez vista.
    // Evita reprocessar eventos repetidos (broadcast duplicado, reconexão com replay, etc.).
    const seenEvents = new Map(); // key -> firstSeenAt
    const SEEN_TTL_MS = 15_000; // janela onde repetições são consideradas duplicatas
    const SEEN_MAX = 500;       // limite p/ não crescer indefinidamente

    const buildEventKey = (data) => {
      // Preferimos o id explícito do evento se houver; é a chave mais forte.
      if (data.eventId) return `evt:${data.eventId}`;
      if (data.id && data.action && data.timestamp) {
        return `id:${data.id}:${data.action}:${data.timestamp}`;
      }
      const action = data.action || "?";
      const ts = data.timestamp || data.updatedAt || data.shipping?.updatedAt || "";
      const status = data.status || "";
      const sid = data.shippingId ?? data.shipping?.id ?? data.record?.id ?? "";
      const ids = Array.isArray(data.shippingIds) && data.shippingIds.length
        ? [...data.shippingIds].sort((a, b) => Number(a) - Number(b)).join(",")
        : "";
      const bulkId = data.bulkUpdateId ?? "";
      // Sem ts confiável: usamos só estrutura — duplicatas exatas em <SEEN_TTL_MS são bloqueadas.
      return `k:${action}|c:${data.campaignId ?? ""}|s:${status}|sid:${sid}|ids:${ids}|b:${bulkId}|t:${ts}`;
    };

    const isDuplicateEvent = (data) => {
      const key = buildEventKey(data);
      const now = Date.now();
      // GC: remove entradas expiradas (rápido — Map preserva ordem de inserção)
      if (seenEvents.size > SEEN_MAX || (seenEvents.size > 0 && now % 17 === 0)) {
        for (const [k, t] of seenEvents) {
          if (now - t > SEEN_TTL_MS) seenEvents.delete(k);
          else break; // entradas seguintes são mais recentes
        }
      }
      const prev = seenEvents.get(key);
      if (prev != null && now - prev <= SEEN_TTL_MS) return true;
      seenEvents.set(key, now);
      // Limite duro: descarta a entrada mais antiga
      if (seenEvents.size > SEEN_MAX) {
        const firstKey = seenEvents.keys().next().value;
        if (firstKey != null) seenEvents.delete(firstKey);
      }
      return false;
    };

    // Cache de mapeamento shippingId -> campaignId para o fallback de eventos sem campaignId.
    // TTL curto: o vínculo é estável, mas evita uso de memória ilimitada.
    const shippingCampaignCache = new Map(); // shippingId -> { campaignId, at }
    const SHIPPING_CACHE_TTL_MS = 60_000;
    const SHIPPING_CACHE_MAX = 1000;
    const inflightLookups = new Map(); // shippingId -> Promise<campaignId|null>

    const lookupCampaignIdForShipping = (sid) => {
      const key = Number(sid);
      if (!Number.isFinite(key)) return Promise.resolve(null);

      // 1) Cache local — itens carregados nas colunas têm campaignId conhecido
      for (const col of ["pending", "delivered", "confirmed", "failed"]) {
        const item = columnsStateRef.current?.[col]?.items?.find((it) => Number(it.id) === key);
        if (item?.campaignId != null) return Promise.resolve(Number(item.campaignId));
      }

      // 2) Cache TTL
      const cached = shippingCampaignCache.get(key);
      if (cached && Date.now() - cached.at < SHIPPING_CACHE_TTL_MS) {
        return Promise.resolve(cached.campaignId);
      }

      // 3) Inflight dedupe
      if (inflightLookups.has(key)) return inflightLookups.get(key);

      const p = api.get(`/shippings/${key}`)
        .then(({ data }) => {
          const cid = data?.campaignId != null ? Number(data.campaignId) : null;
          shippingCampaignCache.set(key, { campaignId: cid, at: Date.now() });
          if (shippingCampaignCache.size > SHIPPING_CACHE_MAX) {
            const firstKey = shippingCampaignCache.keys().next().value;
            if (firstKey != null) shippingCampaignCache.delete(firstKey);
          }
          return cid;
        })
        .catch(() => null) // 404/erro: descarta com segurança
        .finally(() => { inflightLookups.delete(key); });

      inflightLookups.set(key, p);
      return p;
    };

    const onEvent = async (data) => {
      if (!data) return;

      // 1. Handler obsoleto (campanha já foi trocada antes do cleanup)
      if (campaignIdRef.current !== boundCampaignId) return;

      // 2. Resolve campaignId do evento. Se ausente, faz fallback consultando o backend pelo shippingId.
      let evtCampaignId = data.campaignId != null ? Number(data.campaignId) : null;
      if (evtCampaignId == null) {
        const sid = data.shippingId ?? data.shipping?.id ?? data.record?.id ??
          (Array.isArray(data.shippingIds) ? data.shippingIds[0] : null);
        if (sid == null) return; // sem como confirmar pertencimento — descarta
        const resolved = await lookupCampaignIdForShipping(sid);
        // Após o await: a campanha pode ter mudado. Revalida tudo.
        if (campaignIdRef.current !== boundCampaignId) return;
        if (resolved == null) return; // não foi possível confirmar — descarta com segurança
        evtCampaignId = resolved;
      }
      if (evtCampaignId !== boundCampaignId) return;

      // 3. Deduplicação: ignora repetições dentro da janela TTL (sem refetch nem pulso).
      if (isDuplicateEvent(data)) return;

      pulse();

      switch (data.action) {
        case "shipping-bulk-undo": {
          // Aplica mudança no board
          const applied = tryApplyEventLocally(data);
          if (!applied) scheduleRefetch();

          // Feedback visual imediato (somente se veio de outro usuário/aba)
          const ownUserId = Number(user?.id);
          const evtUserId = data.undoneByUserId != null ? Number(data.undoneByUserId) : null;
          const isOwnAction = evtUserId != null && ownUserId === evtUserId;
          if (!isOwnAction) {
            const who = data.undoneByUserName || "Outro usuário";
            const count = Array.isArray(data.shippingIds) ? data.shippingIds.length : (data.restored ?? 0);
            toast.info(
              <div className="text-[12px] leading-snug">
                <div className="font-bold">↩️ Undo aplicado por {who}</div>
                <div className="text-slate-600">
                  {count} envio(s) restaurado(s){data.bulkUpdateId ? ` — atualização #${data.bulkUpdateId}` : ""}
                </div>
              </div>,
              { autoClose: 5000 }
            );
          }

          // Atualiza histórico aberto e detalhe
          if (historyOpenRef.current) fetchHistoryRef.current?.(historyScopeRef.current);
          const detailLogId = historyDetailRef.current?.log?.id;
          if (detailLogId && data.bulkUpdateId && Number(detailLogId) === Number(data.bulkUpdateId)) {
            api.get(`/campaigns/bulk-updates/${detailLogId}`)
              .then(({ data: refreshed }) => setHistoryDetail(refreshed))
              .catch(() => { /* ignore */ });
          }
          break;
        }
        case "shipping-update":
        case "shipping-bulk-update":
        case "delivered":
        case "confirmed":
        case "update": {
          // Tenta aplicar incrementalmente; se não conseguir, faz reconciliação leve
          const applied = tryApplyEventLocally(data);
          if (!applied) scheduleRefetch();
          break;
        }
        case "shipping-content-update": {
          // Mudança de conteúdo (mensagem/observações) — não muda coluna nem total.
          // Patch in-place se tivermos os dados; caso contrário, ignora (sem refetch).
          const sid = data.shippingId ?? data.shipping?.id;
          const patch = data.shipping || data.changes;
          if (sid != null && patch && typeof patch === "object") {
            setColumnsState((prev) => {
              const next = { ...prev };
              ["pending", "delivered", "confirmed", "failed"].forEach((col) => {
                let touched = false;
                const items = prev[col].items.map((it) => {
                  if (Number(it.id) === Number(sid)) { touched = true; return { ...it, ...patch }; }
                  return it;
                });
                if (touched) next[col] = { ...prev[col], items };
              });
              return next;
            });
            setShipping((cur) => cur.map((s) => (Number(s.id) === Number(sid) ? { ...s, ...patch } : s)));
          }
          break;
        }
        case "create":
        case "delete":
          // Criação/remoção mexe nos totals — refetch leve para refletir corretamente
          scheduleRefetch();
          break;
        default:
          // Ações desconhecidas (start/finish/etc.) — refetch defensivo
          scheduleRefetch();
      }
    };

    socket.on(channel, onEvent);
    return () => {
      socket.off(channel, onEvent);
      if (refetchTimer.current) {
        clearTimeout(refetchTimer.current);
        refetchTimer.current = null;
      }
    };
  }, [socket, user?.companyId, campaignId, fetchShipping, applyStatusLocally]);

  // grouped derivado do columnsState (paginação por coluna)
  const grouped = useMemo(() => ({
    pending: columnsState.pending.items,
    delivered: columnsState.delivered.items,
    confirmed: columnsState.confirmed.items,
    failed: columnsState.failed.items,
  }), [columnsState]);

  // ===== Exportação (CSV/PDF) dos envios filtrados/carregados =====
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Coleta envios atualmente visíveis (colunas ativas + quickFilter aplicado).
  const collectExportRows = useCallback(() => {
    const statusLabel = {
      pending: "Pendente",
      delivered: "Entregue",
      confirmed: "Confirmado",
      failed: "Falhou",
    };
    const rows = [];
    ["pending", "delivered", "confirmed", "failed"].forEach((st) => {
      if (!visibleStatuses.has(st)) return;
      const all = columnsState[st]?.items || [];
      const filtered = quickFilter ? all.filter(matchesQuickFilter) : all;
      filtered.forEach((it) => {
        if (!it) return;
        const { message, notes } = parseMessage(it.message);
        rows.push({
          id: it.id ?? "",
          contactName: it.contact?.name || "",
          number: it.number || "",
          status: statusLabel[st],
          message: message || "",
          notes: notes || "",
          createdAt: it.createdAt || "",
          deliveredAt: it.deliveredAt || "",
          confirmedAt: it.confirmedAt || "",
        });
      });
    });
    return rows;
  }, [columnsState, visibleStatuses, quickFilter, matchesQuickFilter]);

  const formatDateBR = (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-BR");
  };

  const downloadFile = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportCSV = useCallback(() => {
    const rows = collectExportRows();
    if (rows.length === 0) { toast.warn("Nada para exportar"); return; }
    const headers = ["ID", "Contato", "Telefone", "Status", "Mensagem", "Observações", "Criado em", "Entregue em", "Confirmado em"];
    const esc = (v) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(";")];
    rows.forEach((r) => {
      lines.push([
        r.id, r.contactName, r.number, r.status, r.message, r.notes,
        formatDateBR(r.createdAt), formatDateBR(r.deliveredAt), formatDateBR(r.confirmedAt),
      ].map(esc).join(";"));
    });
    // BOM para Excel reconhecer UTF-8
    const csv = "\uFEFF" + lines.join("\n");
    const campName = (campaigns.find((c) => String(c.id) === String(campaignId))?.name || "campanha")
      .replace(/[^\w\-]+/g, "_").slice(0, 40);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadFile(`kanban_${campName}_${stamp}.csv`, csv, "text/csv;charset=utf-8");
    toast.success(`${rows.length} envio(s) exportados`);
    setExportMenuOpen(false);
  }, [collectExportRows, campaigns, campaignId]);

  const exportPDF = useCallback(() => {
    const rows = collectExportRows();
    if (rows.length === 0) { toast.warn("Nada para exportar"); return; }
    const campName = campaigns.find((c) => String(c.id) === String(campaignId))?.name || "Campanha";
    const generatedAt = new Date().toLocaleString("pt-BR");
    const escHtml = (s) => String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const statusBadge = (s) => {
      const map = {
        Pendente: "#fef3c7;color:#92400e",
        Entregue: "#dbeafe;color:#1e40af",
        Confirmado: "#d1fae5;color:#065f46",
        Falhou: "#fee2e2;color:#991b1b",
      };
      return `<span style="background:${map[s] || "#e5e7eb;color:#374151"};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600">${escHtml(s)}</span>`;
    };
    const tableRows = rows.map((r) => `
      <tr>
        <td>${escHtml(r.contactName || "—")}<div style="color:#64748b;font-size:10px">${escHtml(r.number)}</div></td>
        <td>${statusBadge(r.status)}</td>
        <td style="max-width:380px">${escHtml(r.message).slice(0, 500)}</td>
        <td style="font-size:10px;color:#475569">
          ${r.createdAt ? `Criado: ${escHtml(formatDateBR(r.createdAt))}<br/>` : ""}
          ${r.deliveredAt ? `Entregue: ${escHtml(formatDateBR(r.deliveredAt))}<br/>` : ""}
          ${r.confirmedAt ? `Confirmado: ${escHtml(formatDateBR(r.confirmedAt))}` : ""}
        </td>
      </tr>`).join("");
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>Kanban — ${escHtml(campName)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;color:#0f172a}
  h1{font-size:18px;margin:0 0 4px}
  .meta{color:#64748b;font-size:11px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#f1f5f9;text-align:left;padding:8px;border-bottom:2px solid #cbd5e1;text-transform:uppercase;font-size:10px;letter-spacing:.04em}
  td{padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top}
  tr:nth-child(even) td{background:#fafafa}
  @media print{ @page{size:A4 landscape;margin:12mm} }
</style></head><body>
<h1>Kanban — ${escHtml(campName)}</h1>
<div class="meta">Gerado em ${escHtml(generatedAt)} • ${rows.length} envio(s)${quickFilter ? ` • filtro: "${escHtml(quickFilter)}"` : ""}</div>
<table>
  <thead><tr><th>Contato</th><th>Status</th><th>Mensagem</th><th>Datas</th></tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Bloqueado pelo navegador. Permita pop-ups."); return; }
    w.document.open(); w.document.write(html); w.document.close();
    toast.success(`${rows.length} envio(s) prontos para PDF`);
    setExportMenuOpen(false);
  }, [collectExportRows, campaigns, campaignId, quickFilter]);

  // ---------- Export do histórico de bulk updates ----------
  const statusLabelFor = useCallback((id) => {
    const c = COLUMNS.find((x) => x.id === id);
    return c?.label || id;
  }, []);

  const exportHistoryCSV = useCallback(() => {
    const rows = filteredHistoryRecords;
    if (rows.length === 0) { toast.warn("Nada para exportar"); return; }
    const headers = ["ID", "Data", "Usuário", "Campanha", "Status destino", "Total", "Sucesso", "Falhas", "Origem", "Desfeito em", "Desfeito por"];
    const esc = (v) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(";")];
    rows.forEach((r) => {
      const total = (Array.isArray(r.shippingIds) ? r.shippingIds.length : 0) || ((r.successCount || 0) + (r.failedCount || 0));
      lines.push([
        r.id,
        formatDateBR(r.createdAt),
        r.userName || "",
        r.campaign?.name || "",
        statusLabelFor(r.newStatus),
        total,
        r.successCount ?? 0,
        r.failedCount ?? 0,
        r.source || "",
        r.undoneAt ? formatDateBR(r.undoneAt) : "",
        r.undoneByUserName || "",
      ].map(esc).join(";"));
    });
    const csv = "\uFEFF" + lines.join("\n");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadFile(`historico_bulk_${stamp}.csv`, csv, "text/csv;charset=utf-8");
    toast.success(`${rows.length} registro(s) exportados`);
  }, [filteredHistoryRecords, statusLabelFor]);

  const exportHistoryPDF = useCallback(() => {
    const rows = filteredHistoryRecords;
    if (rows.length === 0) { toast.warn("Nada para exportar"); return; }
    const generatedAt = new Date().toLocaleString("pt-BR");
    const escHtml = (s) => String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const statusBadge = (s) => {
      const label = statusLabelFor(s);
      return `<span style="background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600">${escHtml(label)}</span>`;
    };
    const tableRows = rows.map((r) => {
      const total = (Array.isArray(r.shippingIds) ? r.shippingIds.length : 0) || ((r.successCount || 0) + (r.failedCount || 0));
      return `
        <tr>
          <td style="font-family:monospace;color:#475569">#${escHtml(r.id)}</td>
          <td>${escHtml(r.userName || "—")}<div style="color:#64748b;font-size:10px">${escHtml(formatDateBR(r.createdAt))}</div></td>
          <td>${escHtml(r.campaign?.name || "—")}</td>
          <td>${statusBadge(r.newStatus)}</td>
          <td style="text-align:center">${total}</td>
          <td style="text-align:center;color:#059669;font-weight:600">${r.successCount ?? 0}</td>
          <td style="text-align:center;color:${(r.failedCount||0)>0?"#b91c1c":"#94a3b8"};font-weight:600">${r.failedCount ?? 0}</td>
          <td style="font-size:10px;color:#475569">
            ${r.undoneAt ? `<span style="color:#b91c1c">Desfeito ${escHtml(formatDateBR(r.undoneAt))}${r.undoneByUserName ? " por " + escHtml(r.undoneByUserName) : ""}</span>` : ""}
          </td>
        </tr>`;
    }).join("");
    const filterInfo = [
      historyScope === "campaign" ? "Esta campanha" : "Todas as campanhas",
      historyStatusFilter !== "all" ? `Status: ${statusLabelFor(historyStatusFilter)}` : null,
      historySearch ? `Busca: "${historySearch}"` : null,
    ].filter(Boolean).join(" • ");
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>Histórico de atualizações em massa</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;color:#0f172a}
  h1{font-size:18px;margin:0 0 4px}
  .meta{color:#64748b;font-size:11px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#f1f5f9;text-align:left;padding:8px;border-bottom:2px solid #cbd5e1;text-transform:uppercase;font-size:10px;letter-spacing:.04em}
  td{padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top}
  tr:nth-child(even) td{background:#fafafa}
  @media print{ @page{size:A4 landscape;margin:12mm} }
</style></head><body>
<h1>Histórico de atualizações em massa</h1>
<div class="meta">Gerado em ${escHtml(generatedAt)} • ${rows.length} registro(s)${filterInfo ? ` • ${escHtml(filterInfo)}` : ""}</div>
<table>
  <thead><tr><th>ID</th><th>Usuário / Data</th><th>Campanha</th><th>Status destino</th><th>Total</th><th>OK</th><th>Falhas</th><th>Observações</th></tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Bloqueado pelo navegador. Permita pop-ups."); return; }
    w.document.open(); w.document.write(html); w.document.close();
    toast.success(`${rows.length} registro(s) prontos para PDF`);
  }, [filteredHistoryRecords, historyScope, historyStatusFilter, historySearch, statusLabelFor]);


  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const shippingId = draggableId.replace("ship-", "");
    if (shippingId.startsWith("virtual-")) {
      toast.warn("Envio ainda não foi processado e não pode ser movido");
      return;
    }

    const newStatus = destination.droppableId;
    const draggedId = Number(shippingId);

    // Se houver seleção e o card arrastado faz parte dela,
    // pedimos confirmação antes de mover TODOS os selecionados em massa.
    if (hasSelection && selectedIds.has(draggedId) && selectedIds.size > 1) {
      setPendingBulkMove({
        newStatus,
        count: selectedIds.size,
        sourceStatus: source.droppableId,
      });
      return;
    }
    // Caso degenerado: 1 card selecionado e arrastado — segue como single update normal abaixo.

    // Optimistic local: move o card imediatamente entre colunas (sem refetch)
    const prev = shipping;
    applyStatusLocally([draggedId], newStatus);

    try {
      await api.patch(`/campaigns/${campaignId}/shipping/${shippingId}`, {
        status: newStatus,
      });
      toast.success("Status atualizado");
      // Reconciliação leve: confirma com o servidor; só recarrega se houver divergência
      reconcileShipping([draggedId], newStatus);
    } catch (e) {
      setShipping(prev);
      fetchShipping();
      toast.error("Falha ao atualizar status");
    }
  };

  const Card = ({ item, index }) => {
    const draggableId = `ship-${item.id ?? `virtual-${item.number}`}`;
    const isVirtual = !item.id;
    const parsed = parseMessage(item.message);
    const status = inferStatus(item);
    const checked = !isVirtual && isSelected(item.id);

    const handleCardClick = (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        e.preventDefault();
        toggleSelect(item.id);
        return;
      }
      openDetails(item);
    };

    return (
      <Draggable draggableId={draggableId} index={index} isDragDisabled={isVirtual}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={(e) => !snapshot.isDragging && handleCardClick(e)}
            className={`group relative mb-2 rounded-xl border bg-white p-3 shadow-sm transition-all cursor-pointer
              ${snapshot.isDragging ? "shadow-lg ring-2 ring-emerald-300" : "hover:shadow-md hover:border-emerald-300"}
              ${checked ? "ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/40" : ""}
              ${isVirtual ? "opacity-60 cursor-not-allowed" : ""}
            `}
          >
            {/* Badge "+N" quando arrastando um card que faz parte de uma seleção múltipla */}
            {snapshot.isDragging && checked && selectedIds.size > 1 && (
              <span className="absolute -top-2 -right-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white shadow-lg ring-2 ring-white">
                +{selectedIds.size - 1}
              </span>
            )}
            <div className="flex items-center gap-2">
              {!isVirtual && (
                <span
                  onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all cursor-pointer
                    ${checked
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-slate-300 bg-white text-transparent group-hover:border-emerald-400"}
                    ${hasSelection || checked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                  `}
                >
                  {checked && <CheckCircle2 size={12} />}
                </span>
              )}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                {(item.contact?.name || item.number || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {item.contact?.name || "Sem nome"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{item.number}</p>
              </div>
              {status === "failed" && (
                <AlertCircle size={14} className="text-rose-500 shrink-0" />
              )}
            </div>
            {parsed.message && (
              <p className="mt-2 text-xs text-slate-600 line-clamp-2">{parsed.message}</p>
            )}
            {parsed.notes && (
              <p className="mt-1 text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 line-clamp-1">
                📝 {parsed.notes}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>
                {item.deliveredAt
                  ? new Date(item.deliveredAt).toLocaleString("pt-BR")
                  : item.createdAt
                  ? new Date(item.createdAt).toLocaleString("pt-BR")
                  : "Aguardando"}
              </span>
              {isVirtual && <span className="rounded bg-slate-100 px-1.5 py-0.5">Virtual</span>}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const headerClasses = useKanbanHeaderStyles();
  const exportBtnRef = useRef(null);

  return (
    <MainContainer>
      <MainHeader>
        <Title>Kanban de Campanha</Title>
        <MainHeaderButtonsWrapper>
          <FormControl
            variant="outlined"
            size="small"
            className={headerClasses.headerControl}
          >
            <InputLabel id="campaign-select-label">Campanha</InputLabel>
            <MuiSelect
              labelId="campaign-select-label"
              label="Campanha"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              {campaigns.length === 0 && (
                <MenuItem value="">
                  <em>Nenhuma campanha</em>
                </MenuItem>
              )}
              {campaigns.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          <TextField
            label="Buscar número/nome"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchShipping()}
            className={headerClasses.searchControl}
          />

          <Button
            variant={
              showFilters || filterPhone || filterStartDate || filterEndDate
                ? "contained"
                : "outlined"
            }
            color="primary"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters((v) => !v)}
            className={headerClasses.button}
          >
            Filtros
            {(filterPhone || filterStartDate || filterEndDate) && (
              <span style={{ marginLeft: 6 }}>
                ({[filterPhone, filterStartDate, filterEndDate].filter(Boolean).length})
              </span>
            )}
          </Button>

          <span ref={exportBtnRef} style={{ display: "inline-flex" }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<GetAppIcon />}
              onClick={() => setExportMenuOpen((v) => !v)}
              className={headerClasses.button}
              title="Exportar envios visíveis"
            >
              Exportar
            </Button>
          </span>
          <Menu
            anchorEl={exportBtnRef.current}
            open={exportMenuOpen}
            onClose={() => setExportMenuOpen(false)}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                setExportMenuOpen(false);
                exportCSV();
              }}
            >
              <TableChartIcon
                fontSize="small"
                style={{ marginRight: 8, color: "#16a34a" }}
              />
              CSV (Excel)
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportMenuOpen(false);
                exportPDF();
              }}
            >
              <DescriptionIcon
                fontSize="small"
                style={{ marginRight: 8, color: "#e11d48" }}
              />
              PDF
            </MenuItem>
          </Menu>

          <LiveBadge
            tick={liveTick}
            state={connState}
            attempt={reconnectAttempt}
            onRetry={reconnectSocket}
          />

          <Button
            variant="contained"
            color="primary"
            startIcon={
              <RefreshIcon
                className={loading ? "animate-spin" : ""}
                style={loading ? { animation: "spin 1s linear infinite" } : {}}
              />
            }
            onClick={fetchShipping}
            disabled={loading}
            className={headerClasses.button}
          >
            Atualizar
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <div className="space-y-4">
        {/* (Header migrado para MainHeader acima) */}


      {/* Painel de filtros avançados */}
      {showFilters && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Telefone / mensagem</label>
              <input
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                placeholder="ex.: 5511..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Data inicial</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Data final</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Itens por página</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setFilterPhone("");
                setFilterStartDate("");
                setFilterEndDate("");
                setPageSize(50);
              }}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Limpar
            </button>
            <button
              onClick={fetchShipping}
              className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              Aplicar
            </button>
          </div>

          {/* Presets de filtros — salvar combinação atual e aplicar com 1 clique */}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Presets salvos
              </span>
              <span className="text-[10px] text-slate-400">
                {filterPresets.length}/20
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCurrentAsPreset(); } }}
                placeholder="Nome do preset (ex.: SP — últimos 7 dias)"
                className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none"
              />
              <button
                onClick={saveCurrentAsPreset}
                disabled={!presetName.trim()}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                Salvar filtros atuais
              </button>
            </div>
            {filterPresets.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Nenhum preset salvo ainda. Configure filtros acima e dê um nome para salvar.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filterPresets.map((p) => (
                  <div
                    key={p.id}
                    className="group flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 pl-3 pr-1 py-1 text-xs hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    <button
                      onClick={() => applyPreset(p)}
                      title={`Aplicar: ${[
                        p.filters.search && `busca: ${p.filters.search}`,
                        p.filters.filterPhone && `tel: ${p.filters.filterPhone}`,
                        p.filters.filterStartDate && `de ${p.filters.filterStartDate}`,
                        p.filters.filterEndDate && `até ${p.filters.filterEndDate}`,
                        `${p.filters.pageSize}/pág`,
                      ].filter(Boolean).join(" • ")}`}
                      className="font-semibold text-slate-700 group-hover:text-emerald-700"
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => deletePreset(p.id)}
                      title="Excluir preset"
                      className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filtros rápidos por status */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
          Status:
        </span>
        {COLUMNS.map((col) => {
          const cc = colorMap[col.color];
          const Icon = col.icon;
          const active = visibleStatuses.has(col.id);
          const total = columnsState[col.id]?.total ?? 0;
          return (
            <button
              key={col.id}
              onClick={() => toggleStatusVisible(col.id)}
              onDoubleClick={() => showOnly(col.id)}
              title="Clique para alternar • Duplo clique para isolar"
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all
                ${active
                  ? `${cc.chip} border-transparent shadow-sm`
                  : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"}
              `}
            >
              <Icon size={12} />
              {col.label}
              <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/60" : "bg-slate-200"}`}>
                {total}
              </span>
            </button>
          );
        })}
        {visibleStatuses.size < 4 && (
          <button
            onClick={showAll}
            className="ml-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
          >
            Mostrar todos
          </button>
        )}

        {/* Busca rápida por contato (filtra cards já carregados) */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
            <Search size={12} className="text-slate-400" />
            <input
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              placeholder="Filtrar por nome ou número..."
              className="w-44 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            />
            {quickFilter && (
              <button
                onClick={() => setQuickFilter("")}
                title="Limpar filtro"
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {quickFilter && (
            <button
              onClick={() => {
                const ids = [];
                COLUMNS.forEach((c) => {
                  if (!visibleStatuses.has(c.id)) return;
                  (columnsState[c.id]?.items || []).forEach((it) => {
                    if (it.id && matchesQuickFilter(it)) ids.push(it.id);
                  });
                });
                if (ids.length === 0) {
                  toast.info("Nenhum envio corresponde ao filtro");
                  return;
                }
                setSelectedIds(new Set(ids));
                toast.success(`${ids.length} envio(s) selecionado(s)`);
              }}
              className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30"
            >
              Selecionar filtrados
            </button>
          )}
          <button
            onClick={openHistory}
            title="Histórico de atualizações em massa"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
          >
            <History size={12} />
            Histórico
          </button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={`grid grid-cols-1 gap-4 ${
          visibleStatuses.size === 1 ? "md:grid-cols-1" :
          visibleStatuses.size === 2 ? "md:grid-cols-2" :
          visibleStatuses.size === 3 ? "md:grid-cols-2 xl:grid-cols-3" :
          "md:grid-cols-2 xl:grid-cols-4"
        }`}>
          {COLUMNS.filter((col) => visibleStatuses.has(col.id)).map((col) => {
            const c = colorMap[col.color];
            const Icon = col.icon;
            const colState = columnsState[col.id] || { items: [], total: 0, hasMore: false, loading: false };
            const allItems = colState.items;
            const items = quickFilter ? allItems.filter(matchesQuickFilter) : allItems;
            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-2xl border ${col.border} bg-slate-50/60 overflow-hidden`}
              >
                <div className={`flex items-center justify-between px-4 py-3 ${c.bg} border-b ${col.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.chip}`}>
                      <Icon size={14} />
                    </span>
                    <span className={`text-sm font-bold ${c.text}`}>{col.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {items.some((i) => i.id) && (
                      <button
                        onClick={() => selectAllInColumn(items)}
                        title="Selecionar todos os visíveis nesta coluna"
                        className={`text-[10px] font-semibold underline-offset-2 hover:underline ${c.text} opacity-70 hover:opacity-100`}
                      >
                        {items.filter((i) => i.id).every((i) => isSelected(i.id)) ? "Limpar" : "Todos"}
                      </button>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.chip}`}>
                      {items.length}
                      {(quickFilter ? allItems.length : colState.total) > items.length
                        ? `/${quickFilter ? allItems.length : colState.total}`
                        : ""}
                    </span>
                  </div>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={(node) => { provided.innerRef(node); setColumnScrollRef(col.id)(node); }}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[300px] max-h-[70vh] overflow-y-auto p-3 transition-colors
                        ${snapshot.isDraggingOver ? `${c.bg}` : ""}`}
                    >
                      {items.length === 0 && !colState.loading && (
                        <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400">
                          Sem envios
                        </div>
                      )}
                      {items.map((item, idx) => (
                        <Card
                          key={item.id ?? `virtual-${item.number}-${idx}`}
                          item={item}
                          index={idx}
                        />
                      ))}
                      {provided.placeholder}
                      {/* Sentinela: dispara loadColumn ~400px antes do fim p/ pré-carregar */}
                      {colState.hasMore && !quickFilter && (
                        <InfiniteSentinel
                          rootRef={getColumnScrollRef(col.id)}
                          disabled={colState.loading}
                          onReach={() => loadColumn(col.id)}
                        />
                      )}
                      {colState.hasMore && (
                        <button
                          onClick={() => loadColumn(col.id)}
                          disabled={colState.loading}
                          className={`mt-2 w-full rounded-xl border ${col.border} bg-white py-2 text-xs font-semibold ${c.text} hover:bg-slate-50 disabled:opacity-50`}
                        >
                          {colState.loading
                            ? "Carregando..."
                            : `Carregar mais (${Math.max(colState.total - items.length, 0)} restantes)`}
                        </button>
                      )}
                      {colState.loading && items.length === 0 && (
                        <div className="flex h-32 items-center justify-center text-xs text-slate-400">
                          Carregando...
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal de confirmação: drag em seleção múltipla */}
      {pendingBulkMove && (() => {
        const statusLabel = {
          pending: "Pendente", delivered: "Entregue", confirmed: "Confirmado", failed: "Falhou",
        };
        const targetLabel = statusLabel[pendingBulkMove.newStatus] || pendingBulkMove.newStatus;
        const sourceLabel = statusLabel[pendingBulkMove.sourceStatus] || pendingBulkMove.sourceStatus;
        const confirm = async () => {
          const status = pendingBulkMove.newStatus;
          setPendingBulkMove(null);
          await bulkUpdateStatus(status);
        };
        const cancel = () => setPendingBulkMove(null);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-move-confirm-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter") confirm();
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
              <div className="flex items-start gap-3 px-5 pt-5 pb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 id="bulk-move-confirm-title" className="text-base font-bold text-slate-900">
                    Mover {pendingBulkMove.count} envios selecionados?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Você arrastou um card que faz parte da seleção. Todos os{" "}
                    <strong>{pendingBulkMove.count}</strong> envios selecionados serão movidos
                    de <span className="font-semibold text-slate-700">"{sourceLabel}"</span> para{" "}
                    <span className="font-semibold text-emerald-700">"{targetLabel}"</span>.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Você poderá desfazer essa ação por 30 segundos depois de confirmar.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 bg-slate-50 px-5 py-3 border-t border-slate-100">
                <button
                  autoFocus
                  onClick={cancel}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirm}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600"
                >
                  Mover {pendingBulkMove.count} envios
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Indicador de progresso do bulk update — barra flutuante no topo */}
      {bulkProgress && (() => {
        const pct = bulkProgress.total > 0
          ? Math.min(100, Math.round((bulkProgress.processed / bulkProgress.total) * 100))
          : 0;
        const statusLabel = {
          pending: "Pendente", delivered: "Entregue", confirmed: "Confirmado", failed: "Falhou",
        }[bulkProgress.status] || bulkProgress.status;
        const phase = bulkProgress.phase;
        const tone = phase === "error"
          ? { ring: "border-rose-200", bar: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" }
          : phase === "done"
          ? { ring: "border-emerald-200", bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" }
          : { ring: "border-emerald-200", bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-white" };
        return (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(440px,calc(100vw-2rem))] rounded-2xl border ${tone.ring} ${tone.bg} shadow-xl shadow-emerald-500/10 px-4 py-3 animate-in fade-in slide-in-from-top-2`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${tone.text}`}>
                {phase === "processing" && <RefreshCcw size={12} className="animate-spin" />}
                {phase === "done" && <CheckCheck size={12} />}
                {phase === "error" && <AlertCircle size={12} />}
                {phase === "processing" && `Atualizando para "${statusLabel}"`}
                {phase === "done" && (bulkProgress.failed > 0
                  ? `Concluído com ${bulkProgress.failed} falha(s)`
                  : "Concluído")}
                {phase === "error" && "Falha na atualização"}
              </div>
              <span className={`text-xs font-mono font-semibold ${tone.text}`}>
                {bulkProgress.processed}/{bulkProgress.total}
                <span className="ml-1 opacity-60">({pct}%)</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full ${tone.bar} transition-all duration-200 ease-out ${phase === "processing" ? "" : ""}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {phase === "done" && (
              <div className="mt-2 flex gap-3 text-[11px] text-slate-600">
                <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-500" /> {bulkProgress.success} sucesso</span>
                {bulkProgress.failed > 0 && (
                  <span className="flex items-center gap-1"><XCircle size={11} className="text-rose-500" /> {bulkProgress.failed} falha</span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Banner flutuante "Desfazer" — aparece após bulk update bem-sucedido (30s) */}
      {lastBulkUpdate && (() => {
        const remaining = Math.max(0, Math.ceil((lastBulkUpdate.expiresAt - Date.now()) / 1000));
        const col = COLUMNS.find((c) => c.id === lastBulkUpdate.status);
        return (
          <div
            className={`fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white shadow-2xl
              ${hasSelection ? "bottom-24" : "bottom-6"}`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs">
                <Undo2 size={14} />
              </span>
              <div className="text-sm">
                <span className="font-semibold">{lastBulkUpdate.count}</span> envio(s) movido(s) para{" "}
                <span className="font-semibold">"{col?.label || lastBulkUpdate.status}"</span>
              </div>
            </div>
            <button
              onClick={() => undoBulkUpdate(lastBulkUpdate.id)}
              disabled={undoing}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
            >
              <Undo2 size={12} />
              {undoing ? "Desfazendo..." : `Desfazer (${remaining}s)`}
            </button>
            <button
              onClick={() => setLastBulkUpdate(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              title="Fechar"
            >
              <X size={14} />
            </button>
          </div>
        );
      })()}

      {/* Barra flutuante de ações em massa */}
      {hasSelection && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-2xl shadow-emerald-500/20">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              {selectedIds.size}
            </span>
            <span className="text-sm font-semibold text-slate-700">selecionado(s)</span>
          </div>
          <span className="text-xs text-slate-500 mr-1">Mover para:</span>
          {COLUMNS.map((col) => {
            const cc = colorMap[col.color];
            const Icon = col.icon;
            return (
              <button
                key={col.id}
                onClick={() => bulkUpdateStatus(col.id)}
                disabled={bulkUpdating}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${cc.chip}`}
              >
                <Icon size={12} />
                {col.label}
              </button>
            );
          })}
          <button
            onClick={clearSelection}
            disabled={bulkUpdating}
            className="ml-1 flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={12} />
            Cancelar
          </button>
        </div>
      )}

      {/* Modal de detalhes do envio */}
      {/* Modal de histórico de atualizações em massa */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={() => { setHistoryOpen(false); setHistoryDetail(null); }}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-indigo-50 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <History size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800">Histórico de atualizações em massa</h3>
                  <p className="text-[11px] text-slate-500">Quem atualizou, quando e quais envios foram afetados</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 text-[11px] font-semibold">
                  <button
                    onClick={() => { setHistoryScope("campaign"); fetchHistory("campaign"); setHistoryDetail(null); }}
                    disabled={!campaignId}
                    className={`px-3 py-1 rounded-lg ${historyScope === "campaign" ? "bg-indigo-500 text-white" : "text-slate-600 hover:bg-slate-100"} disabled:opacity-40`}
                  >
                    Esta campanha
                  </button>
                  <button
                    onClick={() => { setHistoryScope("all"); fetchHistory("all"); setHistoryDetail(null); }}
                    className={`px-3 py-1 rounded-lg ${historyScope === "all" ? "bg-indigo-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    Todas
                  </button>
                </div>
                <button
                  onClick={exportHistoryCSV}
                  disabled={filteredHistoryRecords.length === 0}
                  title="Exportar histórico como CSV"
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet size={13} /> CSV
                </button>
                <button
                  onClick={exportHistoryPDF}
                  disabled={filteredHistoryRecords.length === 0}
                  title="Exportar histórico como PDF"
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText size={13} /> PDF
                </button>
                <button
                  onClick={() => { setHistoryOpen(false); setHistoryDetail(null); }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Busca */}
            <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Buscar por usuário ou ID da atualização..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Limpar busca"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {historySearch && (
                <p className="mt-1 text-[10px] text-slate-400">
                  {filteredHistoryRecords.length} de {historyRecords.length} registro(s)
                </p>
              )}

              {/* Filtro por Status destino */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mr-1">
                  Status destino:
                </span>
                <button
                  onClick={() => setHistoryStatusFilter("all")}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-colors ${
                    historyStatusFilter === "all"
                      ? "bg-indigo-500 text-white border-indigo-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  Todos ({historyRecords.length})
                </button>
                {COLUMNS.map((col) => {
                  const count = historyStatusCounts[col.id] || 0;
                  const cc = colorMap[col.color || "amber"];
                  const active = historyStatusFilter === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => setHistoryStatusFilter(col.id)}
                      disabled={count === 0}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        active
                          ? `${cc.chip} border-transparent ring-2 ring-offset-1 ring-indigo-300`
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {col.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
              {/* Lista */}
              <div className="overflow-y-auto border-r border-slate-100">
                {historyLoading ? (
                  <div className="p-6 text-center text-sm text-slate-400">Carregando...</div>
                ) : historyRecords.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">Nenhuma atualização em massa registrada.</div>
                ) : filteredHistoryRecords.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Nenhum registro corresponde aos filtros aplicados
                    {historySearch && <> para "<span className="font-semibold text-slate-600">{historySearch}</span>"</>}.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filteredHistoryRecords.map((r) => {
                      const col = COLUMNS.find((c) => c.id === r.newStatus);
                      const cc = colorMap[col?.color || "amber"];
                      const total = (Array.isArray(r.shippingIds) ? r.shippingIds.length : 0) || (r.successCount + r.failedCount);
                      const isActive = historyDetail?.log?.id === r.id;
                      return (
                        <li key={r.id}>
                          <button
                            onClick={() => openHistoryDetail(r.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-indigo-50/40 transition-colors ${isActive ? "bg-indigo-50" : ""}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                  <UserIcon size={12} />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">
                                    {r.userName || "Usuário desconhecido"}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    #{r.id} · {new Date(r.createdAt).toLocaleString("pt-BR")}
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-1">
                                {r.undoneAt && (
                                  <span
                                    title={`Desfeito em ${new Date(r.undoneAt).toLocaleString("pt-BR")}`}
                                    className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500"
                                  >
                                    <Undo2 size={9} /> desfeito
                                  </span>
                                )}
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cc.chip}`}>
                                  {col?.label || r.newStatus}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                              <span>📦 {total} envio(s)</span>
                              <span className="text-emerald-600">✓ {r.successCount}</span>
                              {r.failedCount > 0 && <span className="text-rose-600">✗ {r.failedCount}</span>}
                              {r.campaign?.name && (
                                <span className="ml-auto truncate text-slate-400">📣 {r.campaign.name}</span>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Detalhe */}
              <div className="overflow-y-auto bg-slate-50">
                {!historyDetail ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Selecione um registro para ver os envios afetados.
                  </div>
                ) : historyDetailLoading ? (
                  <div className="p-6 text-center text-sm text-slate-400">Carregando detalhes...</div>
                ) : (
                  <div className="p-4">
                    <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700">
                            {historyDetail.log?.userName || "Usuário"} alterou {historyDetail.shippings?.length || 0} envio(s) para{" "}
                            <span className="text-indigo-700">"{historyDetail.log?.newStatus}"</span>
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {historyDetail.log && new Date(historyDetail.log.createdAt).toLocaleString("pt-BR")}
                            {" · "}
                            Origem: {historyDetail.log?.source || "—"}
                          </p>
                        </div>
                        {historyDetail.log?.undoneAt ? (
                          <span
                            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"
                            title={`Desfeito por ${historyDetail.log.undoneByUserName || "—"} em ${new Date(historyDetail.log.undoneAt).toLocaleString("pt-BR")}`}
                          >
                            <Undo2 size={11} /> Desfeito
                          </span>
                        ) : (
                          <button
                            onClick={() => undoBulkUpdate(historyDetail.log.id)}
                            disabled={undoing || !(historyDetail.log?.previousState?.length)}
                            title={
                              historyDetail.log?.previousState?.length
                                ? "Reverter esta atualização"
                                : "Snapshot anterior indisponível"
                            }
                            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Undo2 size={11} />
                            {undoing ? "Desfazendo..." : "Desfazer"}
                          </button>
                        )}
                      </div>
                      {historyDetail.log?.undoneAt && (
                        <p className="mt-2 text-[10px] text-slate-400">
                          Desfeito por {historyDetail.log.undoneByUserName || "—"} em{" "}
                          {new Date(historyDetail.log.undoneAt).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {(historyDetail.shippings || []).map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={() => {
                              setHistoryOpen(false);
                              setHistoryDetail(null);
                              openDetails(s);
                            }}
                            className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                          >
                            <div className="min-w-0 text-left">
                              <p className="font-semibold text-slate-700 truncate">
                                {s.contact?.name || s.number || `#${s.id}`}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{s.number}</p>
                            </div>
                            <ExternalLink size={12} className="text-indigo-500 shrink-0" />
                          </button>
                        </li>
                      ))}
                      {(!historyDetail.shippings || historyDetail.shippings.length === 0) && (
                        <li className="text-center text-xs text-slate-400 py-4">
                          Nenhum envio encontrado (podem ter sido removidos).
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (() => {
        const status = inferStatus(selected);
        const col = COLUMNS.find((c) => c.id === status);
        const c = colorMap[col?.color || "amber"];
        const isFailed = status === "failed";
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={closeDetails}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 ${c.bg} border-b ${col?.border || "border-slate-200"}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700`}>
                    {(selected.contact?.name || selected.number || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {selected.contact?.name || "Sem nome"}
                    </h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.chip}`}>
                      {col?.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeDetails}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Detalhes */}
              <div className="px-6 py-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow icon={Phone} label="Número" value={selected.number} />
                  <InfoRow icon={Hash} label="ID" value={selected.id} />
                  {selected.contact?.email && (
                    <InfoRow icon={Mail} label="Email" value={selected.contact.email} />
                  )}
                  <InfoRow
                    icon={Calendar}
                    label="Criado em"
                    value={selected.createdAt ? new Date(selected.createdAt).toLocaleString("pt-BR") : "—"}
                  />
                  <InfoRow
                    icon={CheckCircle2}
                    label="Entregue em"
                    value={selected.deliveredAt ? new Date(selected.deliveredAt).toLocaleString("pt-BR") : "—"}
                  />
                  <InfoRow
                    icon={CheckCheck}
                    label="Confirmado em"
                    value={selected.confirmedAt ? new Date(selected.confirmedAt).toLocaleString("pt-BR") : "—"}
                  />
                </div>

                {/* Mensagem */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Mensagem
                  </label>
                  <textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    disabled={!isFailed}
                    rows={4}
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition-colors
                      ${isFailed
                        ? "border-rose-200 bg-rose-50/40 focus:border-rose-400"
                        : "border-slate-200 bg-slate-50 text-slate-500"}
                    `}
                  />
                  {!isFailed && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Mensagem só pode ser editada quando o status é "Falhou".
                    </p>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Observações {isFailed && <span className="text-rose-500">(editável)</span>}
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    disabled={!isFailed}
                    rows={3}
                    placeholder={isFailed ? "Ex.: número inválido, sem WhatsApp, bloqueado..." : "Sem observações"}
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition-colors
                      ${isFailed
                        ? "border-amber-200 bg-amber-50/40 focus:border-amber-400"
                        : "border-slate-200 bg-slate-50 text-slate-500"}
                    `}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
                <button
                  onClick={closeDetails}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Fechar
                </button>
                <button
                  onClick={saveContent}
                  disabled={!isFailed || saving}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save size={14} />
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </MainContainer>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={14} className="mt-0.5 text-slate-400 shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm text-slate-700 truncate">{value || "—"}</p>
    </div>
  </div>
);

// Indicador de "ao vivo" — pulsa quando recebe um evento, mostra estado de conexão e botão de retry
const LiveBadge = ({ tick, state = "disconnected", attempt = 0, onRetry }) => {
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (!tick) return;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 800);
    return () => clearTimeout(t);
  }, [tick]);

  const isConnected = state === "connected";
  const isReconnecting = state === "reconnecting";

  const styles = isConnected
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : isReconnecting
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-rose-200 bg-rose-50 text-rose-600";

  const dot = isConnected
    ? "bg-emerald-500"
    : isReconnecting
    ? "bg-amber-500"
    : "bg-rose-500";

  const label = isConnected
    ? "AO VIVO"
    : isReconnecting
    ? `RECONECTANDO${attempt ? ` ${attempt}` : "…"}`
    : "OFFLINE";

  const title = isConnected
    ? "Atualizações em tempo real ativas"
    : isReconnecting
    ? `Tentando reconectar${attempt ? ` (tentativa ${attempt})` : "..."}`
    : "Conexão em tempo real perdida — clique para tentar novamente";

  return (
    <div className="flex items-center gap-1">
      <div
        title={title}
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${styles}`}
      >
        <span className="relative flex h-2 w-2">
          {isConnected && pulsing && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          {isReconnecting && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
        </span>
        {label}
      </div>
      {!isConnected && (
        <button
          onClick={onRetry}
          title="Reconectar agora"
          className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
        >
          <RefreshCcw size={12} className={isReconnecting ? "animate-spin" : ""} />
        </button>
      )}
    </div>
  );
};

export default CampaignKanban;
