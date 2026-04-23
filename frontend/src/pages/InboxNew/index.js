import React, { useState, useEffect, useContext, useMemo, useRef, useCallback, Suspense } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  Avatar,
  Badge,
  Button,
  CircularProgress,
  IconButton,
  InputBase,
  MenuItem,
  Popover,
  Select,
  TextField,
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
  InfoOutlined as InfoIcon,
  GetApp as ExportIcon,
  FlashOn as QuickReplyIcon,
  NotificationsActive as NotifIcon,
  NotificationsOff as NotifOffIcon,
  Send as SendIcon,
  Close as CloseIcon,
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
  const [infoOpen, setInfoOpen] = useState(false);

  // Reset do estado de info ao trocar de ticket
  useEffect(() => {
    setInfoOpen(false);
  }, [ticketId]);

  // Sincroniza com o drawer interno do Ticket: se o usuário clicar no
  // header do Ticket (TicketInfo), o drawer abre. Observamos o DOM via
  // MutationObserver na classe do mainWrapperShift para refletir o estado.
  useEffect(() => {
    const root = document.querySelector(".inbox-chat");
    if (!root) return;
    const sync = () => {
      const shifted = root.querySelector('[class*="mainWrapperShift"]');
      setInfoOpen(!!shifted);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [ticketId]);

  const toggleInfoDrawer = (e) => {
    e?.stopPropagation();
    window.dispatchEvent(new CustomEvent("ticket:toggle-drawer"));
  };


  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [newTicketOpen, setNewTicketOpen] = useState(false);

  // ---- Popovers (anchors) ----
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [optionsAnchor, setOptionsAnchor] = useState(null);
  const [newConvAnchor, setNewConvAnchor] = useState(null);
  const [msgFilterAnchor, setMsgFilterAnchor] = useState(null);
  const [quickReplyAnchor, setQuickReplyAnchor] = useState(null);

  // ---- Filtros sidebar ----
  const [filterOrigin, setFilterOrigin] = useState("all"); // all|whatsapp|telegram|meta
  const [filterAgent, setFilterAgent] = useState("all");
  const [tempOrigin, setTempOrigin] = useState("all");
  const [tempAgent, setTempAgent] = useState("all");

  // ---- Filtro de mensagens (chat) ----
  const [msgSearch, setMsgSearch] = useState("");
  const [tempMsgSearch, setTempMsgSearch] = useState("");

  // ---- Som de notificação ----
  const [notifSound, setNotifSound] = useState(() => {
    return localStorage.getItem("inbox:notifSound") !== "off";
  });
  useEffect(() => {
    localStorage.setItem("inbox:notifSound", notifSound ? "on" : "off");
  }, [notifSound]);

  // ---- Carregar agentes (apenas para admin) ----
  const [agents, setAgents] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/users/");
        if (!cancelled) setAgents(data?.users || []);
      } catch (e) {
        // silencioso
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- Carregar conexões para "Iniciar Nova Conversa" ----
  const [whatsapps, setWhatsapps] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/whatsapp/?session=0");
        if (!cancelled) setWhatsapps((data || []).filter((w) => w.status === "CONNECTED"));
      } catch (e) {
        // silencioso
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- Quick replies ----
  const [quickReplies, setQuickReplies] = useState([]);
  const loadQuickReplies = useCallback(async () => {
    try {
      const { data } = await api.get("/quickMessages", { params: { searchParam: "" } });
      setQuickReplies(data?.records || data || []);
    } catch (e) {
      // silencioso
    }
  }, []);

  // ---- Form de nova conversa ----
  const [ncWhatsappId, setNcWhatsappId] = useState("");
  const [ncNumber, setNcNumber] = useState("");
  const [ncMessage, setNcMessage] = useState("");
  const [ncSending, setNcSending] = useState(false);
  const handleSendNewConversation = async () => {
    if (!ncWhatsappId || !ncNumber.trim() || !ncMessage.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      setNcSending(true);
      await api.post("/api/messages/send", {
        number: ncNumber.replace(/\D/g, ""),
        body: ncMessage,
        whatsappId: ncWhatsappId,
      });
      toast.success("Mensagem enviada!");
      setNewConvAnchor(null);
      setNcNumber("");
      setNcMessage("");
    } catch (err) {
      toastError(err);
    } finally {
      setNcSending(false);
    }
  };


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
    let arr = Array.from(map.values());

    if (filterOrigin !== "all") {
      arr = arr.filter((t) => getChannelTag(t).label.toLowerCase() === filterOrigin);
    }
    if (filterAgent !== "all") {
      arr = arr.filter(
        (t) => String(t.userId || t.user?.id || "") === String(filterAgent)
      );
    }

    return arr.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
  }, [openPag.tickets, pendingPag.tickets, tabConfig, filterOrigin, filterAgent]);

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

  // Feedback visual por linha
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const updateTicket = async (ticket, payload, successMsg) => {
    try {
      setActionLoadingId(ticket.id);
      await api.put(`/tickets/${ticket.id}`, payload);
      toast.success(successMsg);
      if (
        payload.status === "closed" &&
        String(ticket.uuid || ticket.id) === String(ticketId)
      ) {
        history.push("/inbox");
      }
    } catch (err) {
      toastError(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRead = (e, ticket) => {
    e.stopPropagation();
    const isUnread =
      (ticket.unreadMessages || 0) > 0 || ticket.status === "pending";
    updateTicket(
      ticket,
      isUnread ? { status: "open" } : { status: "pending" },
      isUnread ? "Marcado como lido" : "Marcado como não lido"
    );
  };

  const handleArchive = (e, ticket) => {
    e.stopPropagation();
    updateTicket(ticket, { status: "closed" }, "Conversa arquivada");
  };

  const handleQuickReply = (e, ticket) => {
    e.stopPropagation();
    history.push(`/inbox/${ticket.uuid || ticket.id}`);
    setTimeout(() => {
      const input = document.querySelector(
        ".inbox-chat textarea, .inbox-chat input[type='text']"
      );
      if (input) input.focus();
    }, 300);
  };

  const currentTicket = useMemo(
    () => filteredTickets.find((t) => String(t.uuid || t.id) === String(ticketId)),
    [filteredTickets, ticketId]
  );

  // Exportar conversa atual em .txt
  const handleExportConversation = async (ticket) => {
    if (!ticket) return;
    try {
      toast.info("Preparando exportação...");
      const { data } = await api.get(`/messages/${ticket.id}`, {
        params: { pageNumber: 1 },
      });
      const messages = data?.messages || [];
      const lines = messages.map((m) => {
        const who = m.fromMe ? "Eu" : (ticket.contact?.name || "Contato");
        const ts = m.createdAt ? format(new Date(m.createdAt), "dd/MM/yy HH:mm") : "";
        return `[${ts}] ${who}: ${m.body || (m.mediaUrl ? "[mídia]" : "")}`;
      });
      const blob = new Blob(
        [
          `Conversa com ${ticket.contact?.name || "?"}\n` +
            `${ticket.contact?.number || ""}\n` +
            `Exportado em ${format(new Date(), "dd/MM/yy HH:mm")}\n` +
            `\n${lines.join("\n")}`,
        ],
        { type: "text/plain;charset=utf-8" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversa-${ticket.contact?.name || ticket.id}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Conversa exportada!");
    } catch (err) {
      toastError(err);
    }
  };

  // Aplica busca dentro da conversa via highlight no DOM dos balões
  useEffect(() => {
    const root = document.querySelector(".inbox-chat");
    if (!root) return;
    // limpa highlights anteriores
    root.querySelectorAll(".inbox-msg-hl").forEach((el) => {
      el.classList.remove("inbox-msg-hl");
    });
    if (!msgSearch?.trim()) return;
    const q = msgSearch.trim().toLowerCase();
    const bubbles = root.querySelectorAll('[class*="messageRight"], [class*="messageLeft"], [class*="messageOut"], [class*="messageIn"]');
    bubbles.forEach((b) => {
      if ((b.textContent || "").toLowerCase().includes(q)) {
        b.classList.add("inbox-msg-hl");
      }
    });
  }, [msgSearch, ticketId]);

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
          <Tooltip title="Options">
            <IconButton
              size="small"
              className="inbox-icon-btn"
              onClick={(e) => setOptionsAnchor(e.currentTarget)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
            <Tooltip title="Filtros">
              <IconButton
                size="small"
                className={`inbox-icon-btn inbox-icon-filter ${
                  filterOrigin !== "all" || filterAgent !== "all" ? "is-active" : ""
                }`}
                onClick={(e) => {
                  setTempOrigin(filterOrigin);
                  setTempAgent(filterAgent);
                  setFilterAnchor(e.currentTarget);
                }}
              >
                <FilterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Badge>
          <Tooltip title="Iniciar Nova Conversa">
            <IconButton
              size="small"
              className="inbox-icon-btn inbox-icon-new"
              onClick={(e) => setNewConvAnchor(e.currentTarget)}
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
            const isUnread =
              (t.unreadMessages || 0) > 0 || t.status === "pending";
            const isBusy = actionLoadingId === t.id;
            return (
              <div
                key={t.id}
                className={`inbox-item ${isSelected ? "selected" : ""} ${
                  isBusy ? "is-busy" : ""
                }`}
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

                {/* Ações rápidas no card (aparecem no hover) */}
                <div className="inbox-item-actions">
                  <Tooltip
                    title={isUnread ? "Marcar como lido" : "Marcar como não lido"}
                  >
                    <IconButton
                      size="small"
                      className="inbox-card-action"
                      disabled={isBusy}
                      onClick={(e) => handleToggleRead(e, t)}
                    >
                      {isUnread ? (
                        <MarkReadIcon fontSize="small" />
                      ) : (
                        <MarkUnreadIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Responder">
                    <IconButton
                      size="small"
                      className="inbox-card-action inbox-card-reply"
                      disabled={isBusy}
                      onClick={(e) => handleQuickReply(e, t)}
                    >
                      <ReplyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Arquivar">
                    <IconButton
                      size="small"
                      className="inbox-card-action inbox-card-archive"
                      disabled={isBusy}
                      onClick={(e) => handleArchive(e, t)}
                    >
                      <ArchiveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {isBusy && (
                    <CircularProgress size={14} className="inbox-card-spinner" />
                  )}
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
          <>
            {/* Toolbar flutuante com ações do chat (espelha mockup) */}
            {currentTicket && (
              <div className="inbox-chat-actionbar">
                <Tooltip title="Marcar como não lido">
                  <IconButton
                    size="small"
                    className="inbox-chat-action"
                    disabled={actionLoadingId === currentTicket.id}
                    onClick={(e) => handleToggleRead(e, currentTicket)}
                  >
                    <MarkUnreadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Resolver / Arquivar">
                  <IconButton
                    size="small"
                    className="inbox-chat-action inbox-chat-action-archive"
                    disabled={actionLoadingId === currentTicket.id}
                    onClick={(e) => handleArchive(e, currentTicket)}
                  >
                    <DoneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <span className="inbox-chat-actionbar-sep" />
                <Tooltip title="Filtrar Mensagens">
                  <IconButton
                    size="small"
                    className={`inbox-chat-action ${msgSearch ? "inbox-chat-action-info-active" : ""}`}
                    onClick={(e) => {
                      setTempMsgSearch(msgSearch);
                      setMsgFilterAnchor(e.currentTarget);
                    }}
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export Conversation">
                  <IconButton
                    size="small"
                    className="inbox-chat-action"
                    onClick={() => handleExportConversation(currentTicket)}
                  >
                    <ExportIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={infoOpen ? "Hide info" : "Show info"}>
                  <IconButton
                    size="small"
                    className={`inbox-chat-action ${infoOpen ? "inbox-chat-action-info-active" : ""}`}
                    onClick={toggleInfoDrawer}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {actionLoadingId === currentTicket.id && (
                  <CircularProgress size={16} style={{ marginLeft: 4 }} />
                )}
              </div>
            )}
            <Suspense
              fallback={
                <div className="inbox-loader" style={{ height: "100%" }}>
                  <CircularProgress />
                </div>
              }
            >
              <Ticket />
            </Suspense>
          </>
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

      {/* ============== MODAL NOVA CONVERSA (legado, ainda disponível) ============== */}
      <NewTicketModal
        modalOpen={newTicketOpen}
        onClose={() => setNewTicketOpen(false)}
      />

      {/* ============== POPOVER: FILTROS (sidebar) ============== */}
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "inbox-pop" }}
      >
        <div className="inbox-pop-header">
          <FilterIcon fontSize="small" /> <span>Filtros</span>
        </div>
        <div className="inbox-pop-body">
          <label className="inbox-pop-label">Origem</label>
          <Select
            value={tempOrigin}
            onChange={(e) => setTempOrigin(e.target.value)}
            fullWidth
            variant="outlined"
            margin="dense"
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="telegram">Telegram</MenuItem>
            <MenuItem value="meta">Meta</MenuItem>
          </Select>

          <label className="inbox-pop-label">Agente</label>
          <Select
            value={tempAgent}
            onChange={(e) => setTempAgent(e.target.value)}
            fullWidth
            variant="outlined"
            margin="dense"
          >
            <MenuItem value="all">Todos</MenuItem>
            {agents.map((a) => (
              <MenuItem key={a.id} value={String(a.id)}>{a.name}</MenuItem>
            ))}
          </Select>
        </div>
        <div className="inbox-pop-footer">
          <Button
            className="inbox-pop-btn-outline"
            onClick={() => {
              setFilterOrigin("all");
              setFilterAgent("all");
              setTempOrigin("all");
              setTempAgent("all");
              setFilterAnchor(null);
            }}
          >
            Redefinir
          </Button>
          <Button
            className="inbox-pop-btn-primary"
            onClick={() => {
              setFilterOrigin(tempOrigin);
              setFilterAgent(tempAgent);
              setFilterAnchor(null);
            }}
          >
            Aplicar
          </Button>
        </div>
      </Popover>

      {/* ============== POPOVER: OPTIONS (Respostas Rápidas + Som) ============== */}
      <Popover
        open={Boolean(optionsAnchor)}
        anchorEl={optionsAnchor}
        onClose={() => setOptionsAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ className: "inbox-pop inbox-pop-options" }}
      >
        <div className="inbox-pop-header"><span>OPTIONS</span></div>
        <div className="inbox-pop-options-row">
          <Tooltip title="Som de Notificação">
            <IconButton
              className={`inbox-pop-circle ${notifSound ? "active" : ""}`}
              onClick={() => {
                setNotifSound((v) => !v);
                toast.success(`Som de notificação ${!notifSound ? "ativado" : "desativado"}`);
              }}
            >
              {notifSound ? <NotifIcon /> : <NotifOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Respostas Rápidas">
            <IconButton
              className="inbox-pop-circle active"
              onClick={(e) => {
                loadQuickReplies();
                setQuickReplyAnchor(e.currentTarget);
                setOptionsAnchor(null);
              }}
            >
              <QuickReplyIcon />
            </IconButton>
          </Tooltip>
        </div>
      </Popover>

      {/* ============== POPOVER: RESPOSTAS RÁPIDAS ============== */}
      <Popover
        open={Boolean(quickReplyAnchor)}
        anchorEl={quickReplyAnchor}
        onClose={() => setQuickReplyAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ className: "inbox-pop" }}
      >
        <div className="inbox-pop-header"><QuickReplyIcon fontSize="small" /> <span>Respostas Rápidas</span></div>
        <div className="inbox-pop-body" style={{ maxHeight: 320, overflow: "auto", minWidth: 280 }}>
          {quickReplies.length === 0 && (
            <div style={{ fontSize: 12, color: "#94a3b8", padding: "8px 4px" }}>
              Nenhuma resposta rápida cadastrada.
            </div>
          )}
          {quickReplies.map((q) => (
            <div
              key={q.id}
              className="inbox-quick-item"
              onClick={() => {
                navigator.clipboard?.writeText(q.message || "");
                toast.success(`"/${q.shortcode}" copiada`);
                setQuickReplyAnchor(null);
              }}
            >
              <strong>/{q.shortcode}</strong>
              <span>{q.message}</span>
            </div>
          ))}
        </div>
      </Popover>

      {/* ============== POPOVER: INICIAR NOVA CONVERSA ============== */}
      <Popover
        open={Boolean(newConvAnchor)}
        anchorEl={newConvAnchor}
        onClose={() => setNewConvAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "inbox-pop" }}
      >
        <div className="inbox-pop-header"><AddIcon fontSize="small" /> <span>Iniciar Nova Conversa</span></div>
        <div className="inbox-pop-body" style={{ minWidth: 300 }}>
          <Select
            value={ncWhatsappId}
            onChange={(e) => setNcWhatsappId(e.target.value)}
            displayEmpty
            fullWidth
            variant="outlined"
            margin="dense"
          >
            <MenuItem value="" disabled>De</MenuItem>
            {whatsapps.map((w) => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </Select>
          <TextField
            placeholder="Para (número)"
            value={ncNumber}
            onChange={(e) => setNcNumber(e.target.value)}
            fullWidth
            variant="outlined"
            margin="dense"
          />
          <TextField
            placeholder="Mensagem"
            value={ncMessage}
            onChange={(e) => setNcMessage(e.target.value)}
            fullWidth
            variant="outlined"
            margin="dense"
            multiline
            minRows={4}
          />
        </div>
        <div className="inbox-pop-footer">
          <Button
            className="inbox-pop-btn-primary"
            disabled={ncSending || !ncWhatsappId || !ncNumber || !ncMessage}
            onClick={handleSendNewConversation}
            startIcon={ncSending ? <CircularProgress size={14} /> : <SendIcon fontSize="small" />}
            fullWidth
          >
            Enviar Mensagem
          </Button>
        </div>
      </Popover>

      {/* ============== POPOVER: FILTRAR MENSAGENS ============== */}
      <Popover
        open={Boolean(msgFilterAnchor)}
        anchorEl={msgFilterAnchor}
        onClose={() => setMsgFilterAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "inbox-pop" }}
      >
        <div className="inbox-pop-header"><SearchIcon fontSize="small" /> <span>Filtrar Mensagens</span></div>
        <div className="inbox-pop-body" style={{ minWidth: 280 }}>
          <div className="inbox-pop-search">
            <SearchIcon fontSize="small" />
            <InputBase
              placeholder="Buscar na conversa..."
              value={tempMsgSearch}
              onChange={(e) => setTempMsgSearch(e.target.value)}
              fullWidth
              autoFocus
            />
          </div>
        </div>
        <div className="inbox-pop-footer">
          <Button
            className="inbox-pop-btn-outline"
            onClick={() => {
              setTempMsgSearch("");
              setMsgSearch("");
              setMsgFilterAnchor(null);
            }}
          >
            Redefinir
          </Button>
          <Button
            className="inbox-pop-btn-primary"
            onClick={() => {
              setMsgSearch(tempMsgSearch);
              setMsgFilterAnchor(null);
            }}
          >
            Aplicar
          </Button>
        </div>
      </Popover>
    </div>
  );
};

export default InboxNew;
