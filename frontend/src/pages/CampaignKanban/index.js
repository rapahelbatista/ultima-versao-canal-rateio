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
} from "lucide-react";
import api from "../../services/api";
import { toast } from "react-toastify";

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

const CampaignKanban = () => {
  const { user, socket } = useContext(AuthContext);
  const [liveTick, setLiveTick] = useState(0); // pulso visual ao receber evento
  const refetchTimer = useRef(null);
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

  // Histórico de atualizações em massa
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyScope, setHistoryScope] = useState("campaign"); // "campaign" | "all"
  const [historyDetail, setHistoryDetail] = useState(null); // { log, shippings }
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);

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
    setBulkUpdating(true);

    // Optimistic
    const prev = shipping;
    const now = new Date().toISOString();
    const next = shipping.map((s) => {
      if (!ids.includes(s.id)) return s;
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
    });
    setShipping(next);

    try {
      const { data } = await api.post(
        `/campaigns/${campaignId}/shipping/bulk-status`,
        { status: newStatus, shippingIds: ids, source: "kanban" }
      );
      const ok = data?.successCount ?? ids.length;
      const fail = data?.failedCount ?? 0;
      setBulkUpdating(false);
      if (fail === 0) {
        toast.success(`${ok} envio(s) atualizados para "${newStatus}"`);
      } else if (ok === 0) {
        setShipping(prev);
        toast.error("Falha ao atualizar envios");
      } else {
        toast.warn(`${ok} atualizados, ${fail} falharam`);
        fetchShipping();
      }
      clearSelection();
    } catch (err) {
      setBulkUpdating(false);
      setShipping(prev);
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

  useEffect(() => {
    fetchShipping();
  }, [fetchShipping]);

  // Real-time: escuta eventos do socket da empresa para refletir mudanças instantaneamente
  useEffect(() => {
    if (!socket || !user?.companyId || !campaignId) return;
    const channel = `company-${user.companyId}-campaign`;

    const scheduleRefetch = () => {
      if (refetchTimer.current) return;
      refetchTimer.current = setTimeout(() => {
        refetchTimer.current = null;
        fetchShipping();
      }, 400); // debounce p/ rajadas de eventos
    };

    const pulse = () => setLiveTick((t) => t + 1);

    const onEvent = (data) => {
      if (!data) return;
      // Só processa eventos da campanha ativa, quando a info estiver presente
      if (data.campaignId && Number(data.campaignId) !== Number(campaignId)) return;

      switch (data.action) {
        case "shipping-update":
        case "shipping-content-update":
        case "delivered":
        case "confirmed":
        case "update":
        case "create":
        case "delete":
          pulse();
          scheduleRefetch();
          break;
        default:
          // Ações de campanha (start/finish) também justificam refresh
          pulse();
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
  }, [socket, user?.companyId, campaignId, fetchShipping]);

  // grouped derivado do columnsState (paginação por coluna)
  const grouped = useMemo(() => ({
    pending: columnsState.pending.items,
    delivered: columnsState.delivered.items,
    confirmed: columnsState.confirmed.items,
    failed: columnsState.failed.items,
  }), [columnsState]);

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
    // movemos TODOS os selecionados em massa.
    if (hasSelection && selectedIds.has(draggedId)) {
      await bulkUpdateStatus(newStatus);
      return;
    }

    // Optimistic update individual
    const prev = shipping;
    const next = shipping.map((s) => {
      if (String(s.id) !== shippingId) return s;
      const patch = { ...s };
      const now = new Date().toISOString();
      switch (newStatus) {
        case "pending":
          patch.deliveredAt = null;
          patch.confirmedAt = null;
          break;
        case "delivered":
          patch.deliveredAt = patch.deliveredAt || now;
          patch.confirmedAt = null;
          break;
        case "confirmed":
          patch.deliveredAt = patch.deliveredAt || now;
          patch.confirmedAt = now;
          break;
        case "failed":
          patch.deliveredAt = null;
          patch.confirmedAt = null;
          patch.message = `[FAILED] ${(patch.message || "").replace(/^\[FAILED\]\s*/, "")}`;
          break;
        default:
          break;
      }
      return patch;
    });
    setShipping(next);

    try {
      await api.patch(`/campaigns/${campaignId}/shipping/${shippingId}`, {
        status: newStatus,
      });
      toast.success("Status atualizado");
      // Refetch para refletir movimentação entre colunas paginadas
      fetchShipping();
    } catch (e) {
      setShipping(prev);
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Kanban de Campanha</h1>
          <p className="text-xs text-slate-500">
            Arraste cards entre colunas para atualizar o status do envio
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none"
            >
              {campaigns.length === 0 && <option value="">Nenhuma campanha</option>}
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <Search size={14} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchShipping()}
              placeholder="Buscar número ou nome..."
              className="w-48 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors
              ${showFilters || filterPhone || filterStartDate || filterEndDate
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}
            `}
          >
            <Filter size={14} />
            Filtros
            {(filterPhone || filterStartDate || filterEndDate) && (
              <span className="rounded-full bg-emerald-500 px-1.5 text-[10px] text-white">
                {[filterPhone, filterStartDate, filterEndDate].filter(Boolean).length}
              </span>
            )}
          </button>
          <LiveBadge tick={liveTick} connected={!!socket?.connected} />
          <button
            onClick={fetchShipping}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600 disabled:opacity-50"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </div>

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
                      ref={provided.innerRef}
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
                  onClick={() => { setHistoryOpen(false); setHistoryDetail(null); }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
              {/* Lista */}
              <div className="overflow-y-auto border-r border-slate-100">
                {historyLoading ? (
                  <div className="p-6 text-center text-sm text-slate-400">Carregando...</div>
                ) : historyRecords.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">Nenhuma atualização em massa registrada.</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {historyRecords.map((r) => {
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
                                    {new Date(r.createdAt).toLocaleString("pt-BR")}
                                  </p>
                                </div>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cc.chip}`}>
                                {col?.label || r.newStatus}
                              </span>
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

// Indicador de "ao vivo" — pulsa quando recebe um evento do socket
const LiveBadge = ({ tick, connected }) => {
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (!tick) return;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 800);
    return () => clearTimeout(t);
  }, [tick]);

  return (
    <div
      title={connected ? "Atualizações em tempo real ativas" : "Conexão em tempo real indisponível"}
      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-colors
        ${connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-400"}
      `}
    >
      <span className="relative flex h-2 w-2">
        {connected && pulsing && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            connected ? "bg-emerald-500" : "bg-slate-300"
          }`}
        />
      </span>
      {connected ? "AO VIVO" : "OFFLINE"}
    </div>
  );
};

export default CampaignKanban;
