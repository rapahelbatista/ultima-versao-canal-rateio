import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Clock,
  CheckCircle2,
  CheckCheck,
  XCircle,
  RefreshCcw,
  Search,
  ChevronDown,
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

const CampaignKanban = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState("");
  const [shipping, setShipping] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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
    return (
      <Draggable draggableId={draggableId} index={index} isDragDisabled={isVirtual}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-2 rounded-xl border bg-white p-3 shadow-sm transition-all
              ${snapshot.isDragging ? "shadow-lg ring-2 ring-emerald-300" : "hover:shadow-md"}
              ${isVirtual ? "opacity-60" : ""}
            `}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                {(item.contact?.name || item.number || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {item.contact?.name || "Sem nome"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{item.number}</p>
              </div>
            </div>
            {item.message && (
              <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                {item.message.replace(/^\[FAILED\]\s*/, "")}
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
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.chip}`}>
                    {items.length}
                  </span>
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
    </div>
  );
};

export default CampaignKanban;
