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
} from "@material-ui/core";
import {
  Headphones,
  UserPlus,
  X,
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

  // Edit modal
  const [editingUser, setEditingUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // Confirm delete
  const [deletingUser, setDeletingUser] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

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

  const setExtra = (userId, patch) => {
    setExtras((prev) => {
      const next = { ...prev, [userId]: { ...(prev[userId] || {}), ...patch } };
      saveExtras(next);
      return next;
    });
  };

  const handleAddAgent = async () => {
    if (!form.email || !form.password || !form.name) {
      toast.warn("Preencha e-mail, senha e nome");
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
      setForm({ email: "", password: "", name: "", phone: "", comments: "" });
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

  const handleToggleActive = async (user) => {
    // active=true → admin/user normal; active=false → bloqueia via tokenVersion incrementando
    const nextActive = !(user.active === false);
    try {
      // Tenta endpoint dedicado se existir; se não, faz update do profile genérico
      await api.put(`/users/${user.id}`, { ...user, active: !nextActive });
      dispatch({
        type: "UPDATE_USERS",
        payload: { ...user, active: !nextActive },
      });
      toast.success(nextActive ? "Agente desativado" : "Agente ativado");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Não foi possível alterar o status";
      toast.error(msg);
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
            startIcon={<X size={14} />}
            onClick={() => setFormOpen((v) => !v)}
          >
            {formOpen ? "Fechar" : "Abrir"}
          </Button>
        }
      >
        {formOpen && (
          <>
            <div className={classes.formGrid}>
              <TextField
                label="E-mail"
                variant="outlined"
                size="small"
                fullWidth
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <TextField
                label="Senha"
                type="password"
                variant="outlined"
                size="small"
                fullWidth
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
              <TextField
                label="Full Name"
                variant="outlined"
                size="small"
                fullWidth
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              <TextField
                label="Número de Celular"
                variant="outlined"
                size="small"
                fullWidth
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
              <TextField
                label="Short Comment"
                variant="outlined"
                size="small"
                fullWidth
                multiline
                minRows={3}
                className={classes.fullSpan}
                value={form.comments}
                onChange={(e) =>
                  setForm((f) => ({ ...f, comments: e.target.value }))
                }
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <Button
                className={classes.primaryBtn}
                disabled={submitting}
                onClick={handleAddAgent}
              >
                {submitting ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </>
        )}
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
                  const active = user.active !== false;
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
                        <Switch
                          checked={active}
                          onChange={() => handleToggleActive(user)}
                          size="small"
                        />
                      </td>
                      <td className={classes.td} style={{ textAlign: "center" }}>
                        <Tooltip title="Ver conversas do agente">
                          <IconButton
                            size="small"
                            className={classes.iconActionBlue}
                            onClick={() => handleViewConversations(user)}
                          >
                            <Eye size={16} />
                          </IconButton>
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
