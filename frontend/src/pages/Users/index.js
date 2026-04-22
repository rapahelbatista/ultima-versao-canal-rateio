import React, { useState, useEffect, useReducer, useContext, useMemo } from "react";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  IconButton,
  TextField,
  TablePagination,
  CircularProgress,
  Tooltip,
  Avatar,
  Chip,
  Collapse,
  Fade,
} from "@material-ui/core";
import {
  Headphones,
  UserPlus,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  LogIn,
  Eye,
  Trash2,
  MoreVertical,
  Search,
} from "lucide-react";
import { useHistory } from "react-router-dom";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import PageHeader from "../../components/PageHeader";
import SectionCard from "../../components/SectionCard";
import ForbiddenPage from "../../components/ForbiddenPage";
import ConfirmationModal from "../../components/ConfirmationModal";
import UserModal from "../../components/UserModal";
import { AuthContext } from "../../context/Auth/AuthContext";

const LS_EXTRAS_KEY = "agent_extras_v1";

const loadExtras = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_EXTRAS_KEY) || "{}");
  } catch {
    return {};
  }
};
const saveExtras = (extras) => {
  try {
    localStorage.setItem(LS_EXTRAS_KEY, JSON.stringify(extras));
  } catch {}
};

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_USERS": {
      const incoming = action.payload || [];
      const next = [...state];
      incoming.forEach((u) => {
        const idx = next.findIndex((x) => x.id === u.id);
        if (idx !== -1) next[idx] = u;
        else next.push(u);
      });
      return next;
    }
    case "UPDATE_USERS": {
      const u = action.payload;
      const idx = state.findIndex((x) => x.id === u.id);
      if (idx !== -1) {
        const next = [...state];
        next[idx] = u;
        return next;
      }
      return [u, ...state];
    }
    case "DELETE_USER":
      return state.filter((x) => x.id !== action.payload);
    case "RESET":
      return [];
    default:
      return state;
  }
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    width: "100%",
    overflow: "auto",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(2),
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr",
    },
  },
  fullSpan: { gridColumn: "1 / -1" },
  formWrap: { position: "relative" },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    borderRadius: 10,
    backdropFilter: "blur(2px)",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#047857",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 12,
  },
  primaryBtn: {
    background: "#10b981",
    color: "#fff",
    fontWeight: 600,
    textTransform: "none",
    borderRadius: 10,
    padding: "8px 18px",
    boxShadow: "0 4px 10px rgba(16,185,129,0.3)",
    "&:hover": { background: "#059669" },
  },
  closeBtn: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    color: "#475569",
    textTransform: "none",
    fontWeight: 600,
    borderRadius: 10,
    padding: "6px 14px",
    "&:hover": { background: "#f8fafc" },
  },
  countChip: {
    background: "#d1fae5",
    color: "#047857",
    fontWeight: 700,
    fontSize: 11,
    marginLeft: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: "12px 14px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    verticalAlign: "middle",
  },
  agentName: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 600,
    color: "#1e293b",
  },
  agentAvatar: {
    width: 28,
    height: 28,
    fontSize: 12,
    background: "#d1fae5",
    color: "#047857",
    fontWeight: 700,
  },
  iconActionBlue: { color: "#2563eb", "&:hover": { background: "#dbeafe" } },
  iconActionEmerald: { color: "#059669", "&:hover": { background: "#d1fae5" } },
  iconActionRed: { color: "#dc2626", "&:hover": { background: "#fee2e2" } },
  iconActionSlate: { color: "#475569", "&:hover": { background: "#f1f5f9" } },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "6px 12px",
    minWidth: 240,
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    flex: 1,
    fontSize: 13,
    color: "#1e293b",
  },
  tableWrap: { overflowX: "auto" },
}));

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("") || "?";

// ===== Validação do formulário "Adicionar Agente" =====
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}\s'.-]{1,79}$/u; // letras (qualquer idioma), espaço, apóstrofo, ponto, hífen
const PHONE_DIGITS_MIN = 10;
const PHONE_DIGITS_MAX = 15;

const validateAgentForm = (form) => {
  const errors = {};
  const email = (form.email || "").trim();
  const password = form.password || "";
  const name = (form.name || "").trim();
  const phone = (form.phone || "").trim();
  const comments = (form.comments || "").trim();

  if (!email) errors.email = "E-mail é obrigatório";
  else if (email.length > 255) errors.email = "E-mail muito longo (máx. 255)";
  else if (!EMAIL_RE.test(email)) errors.email = "E-mail inválido";

  if (!password) errors.password = "Senha é obrigatória";
  else if (password.length < 6) errors.password = "Mínimo de 6 caracteres";
  else if (password.length > 72) errors.password = "Máximo de 72 caracteres";

  if (!name) errors.name = "Nome é obrigatório";
  else if (name.length < 2) errors.name = "Nome muito curto";
  else if (name.length > 80) errors.name = "Nome muito longo (máx. 80)";
  else if (!NAME_RE.test(name))
    errors.name = "Use apenas letras, espaços, apóstrofo, ponto ou hífen";

  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < PHONE_DIGITS_MIN || digits.length > PHONE_DIGITS_MAX)
      errors.phone = `Celular deve ter entre ${PHONE_DIGITS_MIN} e ${PHONE_DIGITS_MAX} dígitos`;
    else if (!/^[+\d\s().-]+$/.test(phone))
      errors.phone = "Use apenas números e os símbolos + ( ) - .";
  }

  if (comments && comments.length > 500)
    errors.comments = "Comentário muito longo (máx. 500)";

  return errors;
};

const Users = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user: loggedInUser } = useContext(AuthContext);

  const [users, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [extras, setExtras] = useState(loadExtras());

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  // Form (Adicionar Agente)
  const [formOpen, setFormOpen] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    comments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState(null); // { name, email } | null
  const [touched, setTouched] = useState({});

  const formErrors = useMemo(() => validateAgentForm(form), [form]);
  const isFormValid = Object.keys(formErrors).length === 0;
  const showError = (field) => (touched[field] ? formErrors[field] : undefined);
  const markTouched = (field) =>
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));

  // Edit modal
  const [editingUser, setEditingUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // Confirm delete
  const [deletingUser, setDeletingUser] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Live: status online + contagem de conversas (tickets) por usuário
  const [onlineMap, setOnlineMap] = useState({}); // { [userId]: { online, lastSeen } }
  const [ticketCounts, setTicketCounts] = useState({}); // { [userId]: number }

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.get("/users/", {
          params: { searchParam, pageNumber },
        });
        if (!active) return;
        dispatch({ type: "LOAD_USERS", payload: data.users });
        setHasMore(data.hasMore);
      } catch (err) {
        if (active) toastError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [searchParam, pageNumber]);

  // Buscar status online e contagem de tickets quando a lista de users mudar
  useEffect(() => {
    if (!users || users.length === 0) return;
    let cancelled = false;

    const fetchStats = async () => {
      // 1) Status online (endpoint dedicado)
      try {
        const { data } = await api.get("/users/online");
        if (!cancelled && Array.isArray(data)) {
          const map = {};
          data.forEach((u) => {
            map[u.id] = { online: !!u.online, lastSeen: u.lastSeen };
          });
          setOnlineMap((prev) => ({ ...prev, ...map }));
        }
      } catch {
        // fallback: usa campo `online` do próprio user
        const map = {};
        users.forEach((u) => {
          map[u.id] = { online: !!u.online, lastSeen: u.lastSeen };
        });
        if (!cancelled) setOnlineMap((prev) => ({ ...prev, ...map }));
      }

      // 2) Contagem de conversas (tickets) por usuário — em paralelo
      const results = await Promise.all(
        users.map(async (u) => {
          try {
            const { data } = await api.get("/tickets", {
              params: {
                users: JSON.stringify([u.id]),
                pageNumber: 1,
                status: "open,pending,closed",
                showAll: "true",
              },
            });
            return [u.id, data?.count ?? (data?.tickets?.length || 0)];
          } catch {
            return [u.id, 0];
          }
        })
      );
      if (!cancelled) {
        setTicketCounts((prev) => {
          const next = { ...prev };
          results.forEach(([id, c]) => {
            next[id] = c;
          });
          return next;
        });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh a cada 30s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [users]);

  const setExtra = (userId, patch) => {
    setExtras((prev) => {
      const next = { ...prev, [userId]: { ...(prev[userId] || {}), ...patch } };
      saveExtras(next);
      return next;
    });
  };

  const handleAddAgent = async () => {
    // marca todos como touched para revelar erros pendentes
    setTouched({
      email: true,
      password: true,
      name: true,
      phone: true,
      comments: true,
    });
    if (!isFormValid) {
      const firstError = Object.values(formErrors)[0];
      toast.warn(firstError || "Verifique os campos do formulário");
      return;
    }
    try {
      setSubmitting(true);
      const { data } = await api.post("/users", {
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        profile: "user",
      });
      // Guardar extras (telefone/comentário) localmente, atrelados ao novo userId
      if (data?.id && (form.phone || form.comments)) {
        setExtra(data.id, {
          phone: form.phone.trim(),
          comments: form.comments.trim(),
        });
      }
      toast.success("Agente adicionado");
      const created = { name: form.name.trim(), email: form.email.trim() };
      setLastCreated(created);
      // some o badge de sucesso após 5s
      setTimeout(() => {
        setLastCreated((curr) =>
          curr && curr.email === created.email ? null : curr
        );
      }, 5000);
      setForm({ email: "", password: "", name: "", phone: "", comments: "" });
      setTouched({});
      // Recarrega
      setPageNumber(1);
      dispatch({ type: "RESET" });
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Falha ao criar agente";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewConversations = (user) => {
    history.push(`/inbox?userId=${user.id}`);
  };

  const handleLoginAsAgent = async (user) => {
    const password = window.prompt(
      `Digite a senha de ${user.name} para entrar como este agente:`
    );
    if (!password) return;
    try {
      const { data } = await api.post("/auth/login", {
        email: user.email,
        password,
      });
      // Replica estratégia padrão do AuthContext
      localStorage.setItem("token", JSON.stringify(data.token));
      api.defaults.headers.Authorization = `Bearer ${data.token}`;
      toast.success(`Conectado como ${user.name}`);
      window.location.href = "/inbox";
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Falha ao autenticar como agente";
      toast.error(msg);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };
  const handleCloseEdit = () => {
    setEditingUser(null);
    setUserModalOpen(false);
  };

  const handleAskDelete = (user) => {
    setDeletingUser(user);
    setConfirmModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      dispatch({ type: "DELETE_USER", payload: id });
      const next = { ...extras };
      delete next[id];
      setExtras(next);
      saveExtras(next);
      toast.success(i18n.t("users.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingUser(null);
    setConfirmModalOpen(false);
  };

  const visibleUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return users.slice(start, start + rowsPerPage);
  }, [users, page, rowsPerPage]);

  if (loggedInUser?.profile === "user") return <ForbiddenPage />;

  return (
    <div className={classes.root}>
      <PageHeader
        icon={<Headphones size={22} />}
        title="Adicionar agente…"
        subtitle="Gerencie seus agentes de suporte"
      />

      <SectionCard
        icon={<UserPlus size={18} />}
        title="Adicionar Agente"
        subtitle="Gerencie seus agentes de suporte"
        actions={
          <Button
            className={classes.closeBtn}
            startIcon={
              formOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            }
            onClick={() => setFormOpen((v) => !v)}
            aria-expanded={formOpen}
            aria-controls="add-agent-form"
          >
            {formOpen ? "Recolher" : "Expandir"}
          </Button>
        }
      >
        <Fade in={!!lastCreated} unmountOnExit>
          <div className={classes.successBanner}>
            <CheckCircle2 size={16} />
            Agente <strong>{lastCreated?.name}</strong> ({lastCreated?.email})
            criado com sucesso.
            <button
              type="button"
              onClick={() => setLastCreated(null)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#047857",
                display: "inline-flex",
              }}
              aria-label="Fechar aviso"
            >
              <X size={14} />
            </button>
          </div>
        </Fade>

        <Collapse in={formOpen} timeout={250} unmountOnExit>
          <div id="add-agent-form" className={classes.formWrap}>
            {submitting && (
              <div className={classes.loadingOverlay}>
                <CircularProgress size={28} style={{ color: "#10b981" }} />
              </div>
            )}
            <div className={classes.formGrid}>
              <TextField
                label="E-mail"
                type="email"
                variant="outlined"
                size="small"
                fullWidth
                required
                disabled={submitting}
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                onBlur={() => markTouched("email")}
                error={!!showError("email")}
                helperText={showError("email") || " "}
                inputProps={{ maxLength: 255, autoComplete: "email" }}
              />
              <TextField
                label="Senha"
                type="password"
                variant="outlined"
                size="small"
                fullWidth
                required
                disabled={submitting}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                onBlur={() => markTouched("password")}
                error={!!showError("password")}
                helperText={showError("password") || "Mínimo de 6 caracteres"}
                inputProps={{ maxLength: 72, autoComplete: "new-password" }}
              />
              <TextField
                label="Nome completo"
                variant="outlined"
                size="small"
                fullWidth
                required
                disabled={submitting}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                onBlur={() => markTouched("name")}
                error={!!showError("name")}
                helperText={showError("name") || " "}
                inputProps={{ maxLength: 80 }}
              />
              <TextField
                label="Número de Celular"
                variant="outlined"
                size="small"
                fullWidth
                disabled={submitting}
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    // permite apenas dígitos e símbolos comuns de telefone
                    phone: e.target.value.replace(/[^+\d\s().-]/g, ""),
                  }))
                }
                onBlur={() => markTouched("phone")}
                error={!!showError("phone")}
                helperText={
                  showError("phone") || "Ex.: +55 (11) 91234-5678 (opcional)"
                }
                inputProps={{ maxLength: 25, inputMode: "tel" }}
              />
              <TextField
                label="Short Comment"
                variant="outlined"
                size="small"
                fullWidth
                multiline
                minRows={3}
                disabled={submitting}
                className={classes.fullSpan}
                value={form.comments}
                onChange={(e) =>
                  setForm((f) => ({ ...f, comments: e.target.value }))
                }
                onBlur={() => markTouched("comments")}
                error={!!showError("comments")}
                helperText={
                  showError("comments") ||
                  `${(form.comments || "").length}/500`
                }
                inputProps={{ maxLength: 500 }}
              />
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Button
                className={classes.primaryBtn}
                disabled={submitting}
                onClick={handleAddAgent}
                startIcon={
                  submitting ? (
                    <CircularProgress size={14} style={{ color: "#fff" }} />
                  ) : (
                    <UserPlus size={14} />
                  )
                }
              >
                {submitting ? "Adicionando..." : "Adicionar"}
              </Button>
              {submitting && (
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Criando agente, aguarde…
                </span>
              )}
            </div>
          </div>
        </Collapse>
      </SectionCard>

      <SectionCard>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
              👥 Lista de Agentes
            </span>
            <Chip
              size="small"
              className={classes.countChip}
              label={users.length}
            />
          </div>
          <div className={classes.searchWrap}>
            <Search size={14} color="#64748b" />
            <input
              className={classes.searchInput}
              placeholder="Buscar agente..."
              value={searchParam}
              onChange={(e) => setSearchParam(e.target.value.toLowerCase())}
            />
          </div>
        </div>

        <div className={classes.tableWrap}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>Login como</th>
                <th className={classes.th}>Nome</th>
                <th className={classes.th}>E-mail</th>
                <th className={classes.th}>Número de celular</th>
                <th className={classes.th}>Comments</th>
                <th className={classes.th} style={{ textAlign: "center" }}>
                  Active
                </th>
                <th className={classes.th} style={{ textAlign: "center" }}>
                  Conversas
                </th>
                <th className={classes.th} style={{ textAlign: "center" }}>
                  Ações
                </th>
                <th className={classes.th} style={{ textAlign: "center" }}>
                  Excluir
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={9} className={classes.empty}>
                    <CircularProgress size={20} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className={classes.empty}>
                    Nenhum agente cadastrado.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => {
                  const ex = extras[user.id] || {};
                  const phone = ex.phone || "—";
                  const comments = ex.comments || "—";
                  const status = onlineMap[user.id] || {
                    online: !!user.online,
                    lastSeen: user.lastSeen,
                  };
                  const isOnline = !!status.online;
                  const lastSeenLabel = status.lastSeen
                    ? new Date(status.lastSeen).toLocaleString()
                    : "—";
                  const convCount = ticketCounts[user.id];
                  return (
                    <tr key={user.id}>
                      <td className={classes.td}>
                        <Tooltip title="Entrar como este agente">
                          <IconButton
                            size="small"
                            className={classes.iconActionEmerald}
                            onClick={() => handleLoginAsAgent(user)}
                          >
                            <LogIn size={16} />
                          </IconButton>
                        </Tooltip>
                      </td>
                      <td className={classes.td}>
                        <span className={classes.agentName}>
                          <Avatar className={classes.agentAvatar}>
                            {initials(user.name)}
                          </Avatar>
                          {user.name}
                        </span>
                      </td>
                      <td className={classes.td}>{user.email}</td>
                      <td className={classes.td}>
                        <input
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 13,
                            width: "100%",
                            maxWidth: 160,
                          }}
                          defaultValue={phone === "—" ? "" : phone}
                          placeholder="—"
                          onBlur={(e) =>
                            setExtra(user.id, { phone: e.target.value })
                          }
                        />
                      </td>
                      <td className={classes.td}>
                        <input
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 13,
                            width: "100%",
                            maxWidth: 220,
                          }}
                          defaultValue={comments === "—" ? "" : comments}
                          placeholder="—"
                          onBlur={(e) =>
                            setExtra(user.id, { comments: e.target.value })
                          }
                        />
                      </td>
                      <td className={classes.td} style={{ textAlign: "center" }}>
                        <Tooltip
                          title={
                            isOnline
                              ? "Online agora"
                              : `Offline — visto por último: ${lastSeenLabel}`
                          }
                        >
                          <Chip
                            size="small"
                            label={isOnline ? "Online" : "Offline"}
                            style={{
                              background: isOnline ? "#d1fae5" : "#f1f5f9",
                              color: isOnline ? "#047857" : "#64748b",
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          />
                        </Tooltip>
                      </td>
                      <td className={classes.td} style={{ textAlign: "center" }}>
                        <Tooltip title="Ver conversas do agente">
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Chip
                              size="small"
                              label={
                                convCount === undefined ? "…" : convCount
                              }
                              style={{
                                background: "#dbeafe",
                                color: "#1d4ed8",
                                fontWeight: 700,
                                fontSize: 11,
                                minWidth: 28,
                              }}
                            />
                            <IconButton
                              size="small"
                              className={classes.iconActionBlue}
                              onClick={() => handleViewConversations(user)}
                            >
                              <Eye size={16} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </td>
                      <td className={classes.td} style={{ textAlign: "center" }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            className={classes.iconActionSlate}
                            onClick={() => handleEdit(user)}
                          >
                            <MoreVertical size={16} />
                          </IconButton>
                        </Tooltip>
                      </td>
                      <td className={classes.td} style={{ textAlign: "center" }}>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            className={classes.iconActionRed}
                            onClick={() => handleAskDelete(user)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          component="div"
          count={users.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100, 200]}
          labelRowsPerPage="Rows per page:"
        />

        {hasMore && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setPageNumber((p) => p + 1)}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Carregar mais"}
            </Button>
          </div>
        )}
      </SectionCard>

      <ConfirmationModal
        title={
          deletingUser
            ? `${i18n.t("users.confirmationModal.deleteTitle")} ${deletingUser.name}?`
            : ""
        }
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => deletingUser && handleDelete(deletingUser.id)}
      >
        {i18n.t("users.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <UserModal
        open={userModalOpen}
        onClose={handleCloseEdit}
        userId={editingUser?.id}
      />
    </div>
  );
};

export default Users;
