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
  const [shipping, setShipping] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

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

    const results = await Promise.allSettled(
      ids.map((id) =>
        api.patch(`/campaigns/${campaignId}/shipping/${id}`, { status: newStatus })
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkUpdating(false);

    if (failed === 0) {
      toast.success(`${ids.length} envio(s) atualizados para "${newStatus}"`);
      clearSelection();
    } else if (failed === ids.length) {
      setShipping(prev);
      toast.error("Falha ao atualizar envios");
    } else {
      toast.warn(`${ids.length - failed} atualizados, ${failed} falharam`);
      fetchShipping();
      clearSelection();
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

  const fetchShipping = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/campaigns/${campaignId}/shipping`, {
        params: { page: 1, pageSize: 500, searchParam: search || undefined },
      });
      setShipping(data?.shipping || []);
    } catch (e) {
      toast.error("Erro ao buscar envios");
    } finally {
      setLoading(false);
    }
  }, [campaignId, search]);

  useEffect(() => {
    fetchShipping();
  }, [fetchShipping]);

  const grouped = useMemo(() => {
    const g = { pending: [], delivered: [], confirmed: [], failed: [] };
    shipping.forEach((s) => {
      g[inferStatus(s)].push(s);
    });
    return g;
  }, [shipping]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const shippingId = draggableId.replace("ship-", "");
    if (shippingId.startsWith("virtual-")) {
      toast.warn("Envio ainda não foi processado e não pode ser movido");
      return;
    }

    const newStatus = destination.droppableId;

    // Optimistic update
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
      <Draggable draggableId={draggableId} index={index} isDragDisabled={isVirtual || hasSelection}>
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
            onClick={fetchShipping}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600 disabled:opacity-50"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const c = colorMap[col.color];
            const Icon = col.icon;
            const items = grouped[col.id] || [];
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
                        title="Selecionar todos desta coluna"
                        className={`text-[10px] font-semibold underline-offset-2 hover:underline ${c.text} opacity-70 hover:opacity-100`}
                      >
                        {items.filter((i) => i.id).every((i) => isSelected(i.id)) ? "Limpar" : "Todos"}
                      </button>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.chip}`}>
                      {items.length}
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
                      {items.length === 0 && !loading && (
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

export default CampaignKanban;
