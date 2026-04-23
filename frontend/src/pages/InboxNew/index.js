import React, { useState, useEffect, useContext, useMemo, Suspense } from "react";
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
} from "@material-ui/icons";
import { format, isToday, isYesterday } from "date-fns";

import useTickets from "../../hooks/useTickets";
import { AuthContext } from "../../context/Auth/AuthContext";
import NewTicketModal from "../../components/NewTicketModal";
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

const InboxNew = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [pageNumber] = useState(1);
  const [newTicketOpen, setNewTicketOpen] = useState(false);

  const tabConfig = TABS.find((t) => t.id === activeTab) || TABS[0];

  const queueIds = useMemo(
    () => (user?.queues?.length ? user.queues.map((q) => q.id) : []),
    [user]
  );

  // Buscar tickets para cada status e mesclar (cobre "Todos")
  const { tickets: openTickets, loading: l1 } = useTickets({
    pageNumber,
    status: "open",
    showAll: user?.profile === "admin" ? "true" : undefined,
    queueIds: JSON.stringify(queueIds),
    searchParam: search,
  });

  const { tickets: pendingTickets, loading: l2 } = useTickets({
    pageNumber,
    status: "pending",
    showAll: user?.profile === "admin" ? "true" : undefined,
    queueIds: JSON.stringify(queueIds),
    searchParam: search,
  });

  const loading = l1 || l2;

  const filteredTickets = useMemo(() => {
    let list = [];
    if (tabConfig.statuses.includes("open")) list = list.concat(openTickets || []);
    if (tabConfig.statuses.includes("pending")) list = list.concat(pendingTickets || []);
    const map = new Map();
    list.forEach((t) => map.set(t.id, t));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
  }, [openTickets, pendingTickets, tabConfig]);

  const unreadCount = useMemo(
    () => (pendingTickets || []).reduce((acc, t) => acc + (t.unreadMessages || 0), 0),
    [pendingTickets]
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
          <Badge badgeContent={unreadCount || 0} color="primary" overlap="rectangular">
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

        {/* Abas pílula */}
        <div className="inbox-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`inbox-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Lista de tickets */}
        <div className="inbox-list">
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
        </div>
      </aside>

      {/* ============== ÁREA DE CHAT ==============
          O componente <Ticket /> é a fonte única de verdade:
          - Lê o ticketId da URL (useParams)
          - Faz fetch dos dados via /tickets/u/:id
          - Mantém socket sincronizado (atualizações em tempo real)
          - Renderiza TicketHeader (com botão (i) que abre/fecha
            o ContactDrawer interno) + MessagesList + MessageInput
          ================================================ */}
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
