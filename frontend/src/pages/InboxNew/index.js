import React, { useState, useEffect, useContext, useMemo, useRef, useCallback, Suspense } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  Avatar,
  Badge,
  CircularProgress,
  IconButton,
  InputBase,
  Tooltip,
} from "@material-ui/core";
import {
  Inbox as InboxIcon,
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  CheckBox as CheckBoxIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  MarkunreadOutlined as MarkUnreadIcon,
  DraftsOutlined as MarkReadIcon,
  Reply as ReplyIcon,
  CheckCircleOutline as DoneIcon,
} from "@material-ui/icons";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "react-toastify";

import useTickets from "../../hooks/useTickets";
import { AuthContext } from "../../context/Auth/AuthContext";
import NewTicketModal from "../../components/NewTicketModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import "../../styles/inboxNew.css";

const Ticket = React.lazy(() => import("../../components/Ticket"));

/* ---------- helpers ---------- */
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM/yy");
};

const getInitials = (name = "?") =>
  name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const getChannelTag = (ticket) => {
  const ch = (ticket?.channel || ticket?.whatsapp?.channel || "whatsapp").toLowerCase();
  if (ch.includes("telegram")) return { label: "Telegram", cls: "tag-telegram" };
  if (ch.includes("instagram") || ch.includes("facebook") || ch.includes("meta"))
    return { label: "Meta", cls: "tag-meta" };
  return { label: "WhatsApp", cls: "tag-whatsapp" };
};

const TABS = [
  { id: "all", label: "Todos", statuses: ["open", "pending"] },
  { id: "unread", label: "Não lidas", statuses: ["pending"] },
  { id: "read", label: "Lidas", statuses: ["open"] },
];

/* ============================================================
   Hook auxiliar: paginação acumulativa por status
   - mantém um array crescente de tickets
   - reseta quando search/queueIds/status mudam
   ============================================================ */
const usePaginatedTickets = ({ status, search, queueIds, showAll, enabled }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [accumulated, setAccumulated] = useState([]);

  // Reset ao trocar filtros
  useEffect(() => {
    setPageNumber(1);
    setAccumulated([]);
  }, [status, search, queueIds, showAll]);

  const { tickets, loading, hasMore, count } = useTickets({
    pageNumber,
    status: enabled ? status : undefined,
    showAll,
    queueIds,
    searchParam: search,
  });

  // Acumula resultados conforme as páginas chegam
  useEffect(() => {
    if (!enabled) return;
    if (!Array.isArray(tickets)) return;
    setAccumulated((prev) => {
      if (pageNumber === 1) return tickets;
      const map = new Map(prev.map((t) => [t.id, t]));
      tickets.forEach((t) => map.set(t.id, t));
      return Array.from(map.values());
    });
  }, [tickets, pageNumber, enabled]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setPageNumber((p) => p + 1);
  }, [loading, hasMore]);

  return { tickets: accumulated, loading, hasMore, count, loadMore, pageNumber };
};

const InboxNew = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [newTicketOpen, setNewTicketOpen] = useState(false);

  const tabConfig = TABS.find((t) => t.id === activeTab) || TABS[0];

  const queueIds = useMemo(
    () => JSON.stringify(user?.queues?.length ? user.queues.map((q) => q.id) : []),
    [user]
  );
  const showAll = user?.profile === "admin" ? "true" : undefined;

  // Paginação independente para "open" e "pending"
  const openPag = usePaginatedTickets({
    status: "open",
    search,
    queueIds,
    showAll,
    enabled: tabConfig.statuses.includes("open"),
  });

  const pendingPag = usePaginatedTickets({
    status: "pending",
    search,
    queueIds,
    showAll,
    enabled: tabConfig.statuses.includes("pending"),
  });

  // Lista combinada (dedup + ordenada por updatedAt desc)
  const filteredTickets = useMemo(() => {
    let list = [];
    if (tabConfig.statuses.includes("open")) list = list.concat(openPag.tickets || []);
    if (tabConfig.statuses.includes("pending")) list = list.concat(pendingPag.tickets || []);
    const map = new Map();
    list.forEach((t) => map.set(t.id, t));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
  }, [openPag.tickets, pendingPag.tickets, tabConfig]);

  // Totais por aba (vindos do backend via count)
  const counts = useMemo(() => ({
    all: (openPag.count || 0) + (pendingPag.count || 0),
    unread: pendingPag.count || 0,
    read: openPag.count || 0,
  }), [openPag.count, pendingPag.count]);

  const unreadBadge = useMemo(
    () => (pendingPag.tickets || []).reduce((acc, t) => acc + (t.unreadMessages || 0), 0),
    [pendingPag.tickets]
  );

  const loading =
    (tabConfig.statuses.includes("open") && openPag.loading) ||
    (tabConfig.statuses.includes("pending") && pendingPag.loading);

  const hasMore =
    (tabConfig.statuses.includes("open") && openPag.hasMore) ||
    (tabConfig.statuses.includes("pending") && pendingPag.hasMore);

  // Carregar mais (scroll infinito)
  const handleLoadMore = useCallback(() => {
    if (loading) return;
    if (tabConfig.statuses.includes("open") && openPag.hasMore) openPag.loadMore();
    if (tabConfig.statuses.includes("pending") && pendingPag.hasMore) pendingPag.loadMore();
  }, [loading, tabConfig, openPag, pendingPag]);

  // Scroll listener
  const listRef = useRef(null);
  const handleScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      if (!el) return;
      // dispara quando faltam < 120px do fim
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
        handleLoadMore();
      }
    },
    [handleLoadMore]
  );

  const handleSelectTicket = (t) => {
    history.push(`/inbox/${t.uuid || t.id}`);
  };

  return (
    <div className="inbox-new">
      {/* ============== SIDEBAR ESQUERDA ============== */}
      <aside className="inbox-sidebar">
        {/* Header verde */}
        <div className="inbox-header">
          <div className="inbox-header-left">
            <span className="inbox-header-icon">
              <InboxIcon fontSize="small" />
            </span>
            <span className="inbox-header-title">Caixa de Entrada</span>
          </div>
          <Tooltip title="Marcar tudo como lido">
            <IconButton size="small" className="inbox-header-action">
              <CheckBoxIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>

        {/* Barra de busca + ações */}
        <div className="inbox-search-row">
          <IconButton size="small" className="inbox-icon-btn">
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <div className="inbox-search">
            <SearchIcon fontSize="small" className="inbox-search-icon" />
            <InputBase
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </div>
          <Badge badgeContent={unreadBadge || 0} color="primary" overlap="rectangular">
            <IconButton size="small" className="inbox-icon-btn inbox-icon-filter">
              <FilterIcon fontSize="small" />
            </IconButton>
          </Badge>
          <Tooltip title="Nova conversa">
            <IconButton
              size="small"
              className="inbox-icon-btn inbox-icon-new"
              onClick={() => setNewTicketOpen(true)}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>

        {/* Abas pílula com contadores */}
        <div className="inbox-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`inbox-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              <span className="inbox-tab-count">{counts[t.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Lista de tickets com scroll infinito */}
        <div className="inbox-list" ref={listRef} onScroll={handleScroll}>
          {loading && filteredTickets.length === 0 && (
            <div className="inbox-loader">
              <CircularProgress size={24} />
            </div>
          )}

          {!loading && filteredTickets.length === 0 && (
            <div className="inbox-empty">
              <strong>Nada por aqui</strong>
              <span>Nenhuma conversa encontrada.</span>
            </div>
          )}

          {filteredTickets.map((t) => {
            const isSelected = String(t.uuid || t.id) === String(ticketId);
            const tag = getChannelTag(t);
            const isImportant = (t.tags || []).some((tg) =>
              (tg.name || "").toLowerCase().includes("import")
            );
            return (
              <div
                key={t.id}
                className={`inbox-item ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectTicket(t)}
              >
                <div className="inbox-item-avatar">
                  <Avatar
                    src={t.contact?.profilePicUrl}
                    style={{ background: "#10b981", color: "#fff" }}
                  >
                    {getInitials(t.contact?.name)}
                  </Avatar>
                </div>
                <div className="inbox-item-body">
                  <div className="inbox-item-row1">
                    <span className="inbox-item-name">
                      {t.contact?.name || "Sem nome"}
                    </span>
                    <span className="inbox-item-date">{formatDate(t.updatedAt)}</span>
                  </div>
                  <div className="inbox-item-preview">
                    <span>↳ {t.lastMessage || "Sem mensagens"}</span>
                  </div>
                  <div className="inbox-item-tags">
                    <span className={`inbox-tag ${tag.cls}`}>{tag.label}</span>
                    {isImportant && (
                      <span className="inbox-tag tag-important">Important</span>
                    )}
                    {t.unreadMessages > 0 && (
                      <span className="inbox-unread">{t.unreadMessages}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loader de "carregando mais" */}
          {loading && filteredTickets.length > 0 && (
            <div className="inbox-loader" style={{ padding: 14 }}>
              <CircularProgress size={20} />
            </div>
          )}

          {/* Indicador fim da lista */}
          {!loading && !hasMore && filteredTickets.length > 0 && (
            <div className="inbox-end">
              {filteredTickets.length} de {counts[activeTab] || filteredTickets.length} conversas
            </div>
          )}
        </div>
      </aside>

      {/* ============== ÁREA DE CHAT ============== */}
      <main className="inbox-chat">
        {ticketId ? (
          <Suspense
            fallback={
              <div className="inbox-loader" style={{ height: "100%" }}>
                <CircularProgress />
              </div>
            }
          >
            <Ticket />
          </Suspense>
        ) : (
          <div className="inbox-empty-chat">
            <div className="inbox-empty-chat-card">
              <div className="inbox-empty-chat-icon">
                <InboxIcon style={{ fontSize: 56 }} />
              </div>
              <h2>Selecione uma conversa</h2>
              <p>Escolha um contato à esquerda para começar a conversar.</p>
            </div>
          </div>
        )}
      </main>

      {/* ============== MODAL NOVA CONVERSA ============== */}
      <NewTicketModal
        modalOpen={newTicketOpen}
        onClose={() => setNewTicketOpen(false)}
      />
    </div>
  );
};

export default InboxNew;
