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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Grid,
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
import KanbanSpinner from "./KanbanSpinner";

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
  // ---- Board / Columns / Cards (Phase 3) ----
  board: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.spacing(3),
    padding: theme.spacing(0.5),
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: theme.spacing(3),
    },
    [theme.breakpoints.up("lg")]: {
      gridTemplateColumns: "repeat(var(--cols, 4), 1fr)",
      gap: theme.spacing(3),
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
    borderRadius: 14,
    border: `1px solid ${theme.palette.type === "dark" ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
    background: theme.palette.type === "dark" ? "rgba(255,255,255,0.02)" : "#ffffff",
    overflow: "hidden",
    minHeight: 360,
    boxShadow: theme.palette.type === "dark"
      ? "0 1px 2px rgba(0,0,0,0.3)"
      : "0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.03)",
    transition: "box-shadow .2s, transform .2s",
    "&:hover": {
      boxShadow: theme.palette.type === "dark"
        ? "0 4px 12px rgba(0,0,0,0.4)"
        : "0 4px 12px rgba(15,23,42,0.08)",
    },
  },
  columnHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1.75, 2),
    borderBottom: `1px solid ${theme.palette.type === "dark" ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`,
    background: theme.palette.type === "dark" ? "rgba(255,255,255,0.02)" : "#fafbfc",
  },
  columnHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  columnIcon: {
    width: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  columnTitle: {
    fontSize: "0.875rem",
    fontWeight: 700,
  },
  columnCount: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: theme.spacing(0.25, 1),
    borderRadius: 999,
  },
  columnSelectAll: {
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "none",
    padding: theme.spacing(0.25, 0.75),
    minWidth: 0,
  },
  columnList: {
    flex: 1,
    minHeight: 280,
    maxHeight: "70vh",
    overflowY: "auto",
    padding: theme.spacing(1.5),
    transition: "background-color .2s",
    ...theme.scrollbarStyles,
  },
  columnDraggingOver: {
    background: theme.palette.action.hover,
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 128,
    borderRadius: 12,
    border: `2px dashed ${theme.palette.divider}`,
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
  },
  loadMoreBtn: {
    width: "100%",
    marginTop: theme.spacing(1),
    borderRadius: 10,
    textTransform: "none",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  // Card
  card: {
    position: "relative",
    background: theme.palette.background.paper,
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.25),
    marginBottom: theme.spacing(1),
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    cursor: "pointer",
    transition: "box-shadow .15s, border-color .15s, background .15s",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      borderColor: theme.palette.primary.light,
    },
  },
  cardDragging: {
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    borderColor: theme.palette.primary.main,
  },
  cardSelected: {
    borderColor: theme.palette.primary.main,
    background: theme.palette.action.selected,
  },
  cardVirtual: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  cardRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  cardCheck: {
    width: 20,
    height: 20,
    borderRadius: 4,
    border: `1px solid ${theme.palette.divider}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: theme.palette.background.paper,
    color: "transparent",
    transition: "all .15s",
  },
  cardCheckActive: {
    background: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    color: "#fff",
  },
  cardAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: theme.palette.action.hover,
    color: theme.palette.text.secondary,
    fontSize: "0.7rem",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardName: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: theme.palette.text.primary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardNumber: {
    fontSize: "0.7rem",
    color: theme.palette.text.secondary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardMessage: {
    marginTop: theme.spacing(1),
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardNotes: {
    marginTop: theme.spacing(0.5),
    fontSize: "0.65rem",
    color: "#92400e",
    background: "#fef3c7",
    borderRadius: 4,
    padding: theme.spacing(0.25, 0.75),
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardFooter: {
    marginTop: theme.spacing(1),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.65rem",
    color: theme.palette.text.disabled,
  },
  cardBadgeMulti: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 24,
    height: 24,
    padding: theme.spacing(0, 0.75),
    borderRadius: 999,
    background: theme.palette.primary.main,
    color: "#fff",
    fontSize: "0.7rem",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
    border: "2px solid #fff",
    zIndex: 2,
  },
  // ---- Dialogs (Phase 3 modals) ----
  dialogPaper: { borderRadius: 12 },
  dialogHeader: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  dialogHeaderAvatar: {
    width: 40,
    height: 40,
    background: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },
  dialogActions: {
    padding: theme.spacing(1.5, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.default,
  },
  dialogButton: { borderRadius: 10, textTransform: "none", fontWeight: 600 },
  historySplit: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 0,
    [theme.breakpoints.up("md")]: { gridTemplateColumns: "1fr 1fr" },
    minHeight: 380,
  },
  historyListWrapper: {
    overflowY: "auto",
    maxHeight: 480,
    borderRight: `1px solid ${theme.palette.divider}`,
    ...theme.scrollbarStyles,
  },
  historyDetailWrapper: {
    overflowY: "auto",
    maxHeight: 480,
    background: theme.palette.background.default,
    padding: theme.spacing(2),
    ...theme.scrollbarStyles,
  },
  historyEmpty: {
    padding: theme.spacing(4),
    textAlign: "center",
    fontSize: "0.85rem",
    color: theme.palette.text.secondary,
  },
  historyItemActive: {
    background: theme.palette.action.selected,
  },
  detailsField: { marginTop: theme.spacing(1.5) },
  detailsHeaderChip: {
    fontWeight: 700,
    fontSize: "0.7rem",
    height: 22,
  },
}));

// Color tokens used by columns (header background/chip/text). Hex values keep
// the same visual identity used previously by Tailwind classes.
const columnColorTokens = {
  amber:   { headerBg: "#fffbeb", text: "#b45309", chipBg: "#fde68a", chipText: "#92400e" },
  sky:     { headerBg: "#f0f9ff", text: "#0369a1", chipBg: "#bae6fd", chipText: "#075985" },
  emerald: { headerBg: "#ecfdf5", text: "#047857", chipBg: "#a7f3d0", chipText: "#065f46" },
  rose:    { headerBg: "#fff1f2", text: "#be123c", chipBg: "#fecdd3", chipText: "#9f1239" },
};

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

// Tokens de cor por status (sem dependência de Tailwind).
// `chip` é um objeto de estilos inline aplicado nos botões/etiquetas.
const colorMap = {
  amber: {
    bg: "#fffbeb",
    text: "#b45309",
    chip: { backgroundColor: "#fef3c7", color: "#b45309" },
    dot: "#fbbf24",
  },
  sky: {
    bg: "#f0f9ff",
    text: "#0369a1",
    chip: { backgroundColor: "#e0f2fe", color: "#0369a1" },
    dot: "#38bdf8",
  },
  emerald: {
    bg: "#ecfdf5",
    text: "#047857",
    chip: { backgroundColor: "#d1fae5", color: "#047857" },
    dot: "#34d399",
  },
  rose: {
    bg: "#fff1f2",
    text: "#be123c",
    chip: { backgroundColor: "#ffe4e6", color: "#be123c" },
    dot: "#fb7185",
  },
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
// Card memoizado a nível de módulo: evita remount/rerender em listas grandes.
// O comparador customizado só re-renderiza quando algo realmente visível mudou.
const KanbanCard = React.memo(
  function KanbanCard({ item, index, checked, classes, onOpen, onToggleSelect, selectedCount }) {
    const draggableId = `ship-${item.id ?? `virtual-${item.number}`}`;
    const isVirtual = !item.id;
    const parsed = parseMessage(item.message);
    const status = inferStatus(item);

    const handleCardClick = (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        e.preventDefault();
        onToggleSelect(item.id);
        return;
      }
      onOpen(item);
    };

    const cardClassName = [
      classes.card,
      checked ? classes.cardSelected : "",
      isVirtual ? classes.cardVirtual : "",
    ].filter(Boolean).join(" ");

    return (
      <Draggable draggableId={draggableId} index={index} isDragDisabled={isVirtual}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={(e) => !snapshot.isDragging && handleCardClick(e)}
            className={`${cardClassName} ${snapshot.isDragging ? classes.cardDragging : ""}`}
          >
            {snapshot.isDragging && checked && selectedCount > 1 && (
              <span className={classes.cardBadgeMulti}>+{selectedCount - 1}</span>
            )}
            <div className={classes.cardRow}>
              {!isVirtual && (
                <span
                  onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
                  className={`${classes.cardCheck} ${checked ? classes.cardCheckActive : ""}`}
                >
                  {checked && <CheckCircle2 size={12} />}
                </span>
              )}
              <span className={classes.cardAvatar}>
                {(item.contact?.name || item.number || "?").slice(0, 2).toUpperCase()}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={classes.cardName}>{item.contact?.name || "Sem nome"}</div>
                <div className={classes.cardNumber}>{item.number}</div>
              </div>
              {status === "failed" && (
                <AlertCircle size={14} style={{ color: "#f43f5e", flexShrink: 0 }} />
              )}
            </div>
            {parsed.message && (
              <div className={classes.cardMessage}>{parsed.message}</div>
            )}
            {parsed.notes && (
              <div className={classes.cardNotes}>📝 {parsed.notes}</div>
            )}
            <div className={classes.cardFooter}>
              <span>
                {item.deliveredAt
                  ? new Date(item.deliveredAt).toLocaleString("pt-BR")
                  : item.createdAt
                  ? new Date(item.createdAt).toLocaleString("pt-BR")
                  : "Aguardando"}
              </span>
              {isVirtual && (
                <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                  Virtual
                </span>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );
  },
  (prev, next) => {
    // Re-renderiza apenas quando muda algo visível para este card.
    if (prev.item !== next.item) return false;
    if (prev.index !== next.index) return false;
    if (prev.checked !== next.checked) return false;
    if (prev.classes !== next.classes) return false;
    // selectedCount só importa enquanto o card está selecionado (badge no drag)
    if (prev.checked && prev.selectedCount !== next.selectedCount) return false;
    // onOpen / onToggleSelect são estáveis (useCallback no pai)
    return true;
  }
);

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
  return <div ref={ref} aria-hidden style={{ height: 4, width: "100%" }} />;
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

  // ---- Persisted filters (per-user, localStorage) ----
  const filtersStorageKey = useMemo(
    () => `campaignKanban:filters:${user?.id || "anon"}`,
    [user?.id]
  );
  const persistedFilters = useMemo(() => {
    try {
      const raw = localStorage.getItem(filtersStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersStorageKey]);

  const [campaignId, setCampaignId] = useState(persistedFilters.campaignId || "");
  const [shipping, setShipping] = useState([]); // mantido p/ compatibilidade c/ bulk/optimistic
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(persistedFilters.search || "");
  // Filtros avançados
  const [showFilters, setShowFilters] = useState(false);
  const [filterPhone, setFilterPhone] = useState(persistedFilters.filterPhone || "");
  const [filterStartDate, setFilterStartDate] = useState(persistedFilters.filterStartDate || "");
  const [filterEndDate, setFilterEndDate] = useState(persistedFilters.filterEndDate || "");
  const [pageSize, setPageSize] = useState(persistedFilters.pageSize || 50);
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
  // Visibilidade por status (todos visíveis por padrão) — DEVE ficar antes de
  // saveCurrentAsPreset/applyPreset porque eles referenciam `visibleStatuses`.
  const [visibleStatuses, setVisibleStatuses] = useState(() => {
    const saved = persistedFilters.visibleStatuses;
    if (Array.isArray(saved) && saved.length) return new Set(saved);
    return new Set(["pending", "delivered", "confirmed", "failed"]);
  });
  const toggleStatusVisible = (id) =>
    setVisibleStatuses((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      // Sempre manter ao menos um visível
      return n.size === 0 ? prev : n;
    });
  const showOnly = (id) => setVisibleStatuses(new Set([id]));
  const showAll = () => setVisibleStatuses(new Set(["pending", "delivered", "confirmed", "failed"]));

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
  // (visibleStatuses + helpers movidos para cima — antes de saveCurrentAsPreset/applyPreset
  // — para evitar TDZ ReferenceError que causava tela em branco no carregamento.)
  // Quick filter: busca local no nome/número (não dispara fetch)
  const [quickFilter, setQuickFilter] = useState(persistedFilters.quickFilter || "");

  // Persist filters whenever they change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const payload = {
          campaignId,
          search,
          filterPhone,
          filterStartDate,
          filterEndDate,
          pageSize,
          visibleStatuses: Array.from(visibleStatuses),
          quickFilter,
        };
        localStorage.setItem(filtersStorageKey, JSON.stringify(payload));
      } catch { /* ignore quota errors */ }
    }, 300);
    return () => clearTimeout(t);
  }, [
    filtersStorageKey,
    campaignId,
    search,
    filterPhone,
    filterStartDate,
    filterEndDate,
    pageSize,
    visibleStatuses,
    quickFilter,
  ]);
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
          <div style={{ fontSize: 12, lineHeight: 1.35 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              ⚠️ Desfazer parcial: {restored} restaurado(s), {failed} falharam
            </div>
            {reasonEntries.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 192, overflowY: "auto", paddingRight: 4 }}>
                {reasonEntries.map(([reason, ids]) => (
                  <li key={reason} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: "#be123c" }}>{reason}</div>
                    <div style={{ color: "#475569", fontSize: 11, wordBreak: "break-word" }}>
                      {ids.length} envio(s): {ids.slice(0, 12).map((i) => `#${i}`).join(", ")}
                      {ids.length > 12 ? `, +${ids.length - 12}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: "#475569" }}>
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
          <div style={{ fontSize: 12, lineHeight: 1.35 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>❌ {baseMsg}{status ? ` (HTTP ${status})` : ""}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 160, overflowY: "auto", paddingRight: 4, fontSize: 11, color: "#334155" }}>
              {failures.slice(0, 20).map((f, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  <span style={{ fontFamily: "monospace" }}>#{f.id ?? f.shippingId ?? "?"}</span>
                  {" — "}
                  <span style={{ color: "#be123c" }}>{f.reason || f.error || f.message || "erro"}</span>
                </li>
              ))}
              {failures.length > 20 && (
                <li style={{ fontStyle: "italic", color: "#64748b" }}>+{failures.length - 20} outro(s)…</li>
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

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);
  const hasSelection = selectedIds.size > 0;

  const toggleSelect = useCallback((id) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectAllInColumn = useCallback((items) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      const ids = items.map((i) => i.id).filter(Boolean);
      const allIn = ids.every((id) => n.has(id));
      if (allIn) ids.forEach((id) => n.delete(id));
      else ids.forEach((id) => n.add(id));
      return n;
    });
  }, []);

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

  // Ref síncrona com selectedIds — permite handlers estáveis (sem deps).
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);

  const openDetails = useCallback((item) => {
    // Em modo seleção, clique no card alterna seleção em vez de abrir modal
    if (selectedIdsRef.current.size > 0) {
      if (item.id) {
        setSelectedIds((prev) => {
          const n = new Set(prev);
          n.has(item.id) ? n.delete(item.id) : n.add(item.id);
          return n;
        });
      }
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
  }, []);


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
        // Mantém o campaignId persistido se ainda existir; senão, usa o primeiro
        const ids = list.map((c) => String(c.id));
        if (campaignId && !ids.includes(String(campaignId))) {
          setCampaignId(list.length ? String(list[0].id) : "");
        } else if (list.length && !campaignId) {
          setCampaignId(String(list[0].id));
        }
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
              <div style={{ fontSize: 12, lineHeight: 1.35 }}>
                <div style={{ fontWeight: 700 }}>↩️ Undo aplicado por {who}</div>
                <div style={{ color: "#475569" }}>
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

  // Lista filtrada por coluna + flag allSelected, calculada uma única vez por
  // mudança de columnsState/quickFilter/selectedIds. Evita .filter() em cada render
  // para listas grandes (centenas/milhares de envios).
  const quickFilterNorm = useMemo(
    () => quickFilter.trim().toLowerCase(),
    [quickFilter]
  );
  const columnViews = useMemo(() => {
    const out = {};
    for (const col of COLUMNS) {
      const colState = columnsState[col.id] || { items: [], total: 0, hasMore: false, loading: false };
      const allItems = colState.items;
      let items = allItems;
      if (quickFilterNorm) {
        items = [];
        for (let i = 0; i < allItems.length; i++) {
          const it = allItems[i];
          const name = (it.contact?.name || "").toLowerCase();
          const number = (it.number || "").toLowerCase();
          if (name.includes(quickFilterNorm) || number.includes(quickFilterNorm)) {
            items.push(it);
          }
        }
      }
      // allSelected: todos os itens com id estão selecionados (e existe ao menos um)
      let withId = 0;
      let selectedWithId = 0;
      for (let i = 0; i < items.length; i++) {
        const id = items[i].id;
        if (!id) continue;
        withId++;
        if (selectedIds.has(id)) selectedWithId++;
      }
      out[col.id] = {
        colState,
        allItems,
        items,
        allSelected: withId > 0 && withId === selectedWithId,
        hasAnyId: withId > 0,
      };
    }
    return out;
  }, [columnsState, quickFilterNorm, selectedIds]);


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
      const filtered = columnViews[st]?.items || [];
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
  }, [columnViews, visibleStatuses]);


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

  // (Card foi extraído para o componente memoizado `KanbanCard` no topo do módulo
  // — evita rerenders em cascata em listas grandes.)

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
              loading ? (
                <KanbanSpinner size={16} color="inherit" inline />
              ) : (
                <RefreshIcon />
              )
            }
            onClick={fetchShipping}
            disabled={loading}
            className={headerClasses.button}
          >
            Atualizar
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* (Header migrado para MainHeader acima) */}


      {/* Painel de filtros avançados */}
      {showFilters && (
        <Paper variant="outlined" className={headerClasses.filtersPaper}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <TextField
              label="Telefone / mensagem"
              variant="outlined"
              size="small"
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              placeholder="ex.: 5511..."
              className={headerClasses.filterField}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Data inicial"
              type="date"
              variant="outlined"
              size="small"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className={headerClasses.filterField}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Data final"
              type="date"
              variant="outlined"
              size="small"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className={headerClasses.filterField}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl variant="outlined" size="small" className={headerClasses.filterField}>
              <InputLabel id="page-size-label" shrink>Itens por página</InputLabel>
              <MuiSelect
                labelId="page-size-label"
                label="Itens por página"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
                <MenuItem value={200}>200</MenuItem>
                <MenuItem value={500}>500</MenuItem>
              </MuiSelect>
            </FormControl>
          </div>

          <div className={headerClasses.filterActions}>
            <Button
              variant="outlined"
              size="small"
              className={headerClasses.button}
              onClick={() => {
                setFilterPhone("");
                setFilterStartDate("");
                setFilterEndDate("");
                setPageSize(50);
              }}
            >
              Limpar
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              className={headerClasses.button}
              onClick={fetchShipping}
            >
              Aplicar
            </Button>
          </div>

          <Divider style={{ margin: "16px 0 12px" }} />

          {/* Presets */}
          <div className={headerClasses.presetsHeader}>
            <Title>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Presets salvos</span>
            </Title>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{filterPresets.length}/20</span>
          </div>

          <div className={headerClasses.presetInputRow}>
            <TextField
              variant="outlined"
              size="small"
              fullWidth
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCurrentAsPreset(); } }}
              placeholder="Nome do preset (ex.: SP — últimos 7 dias)"
              style={{ flex: 1, minWidth: 200 }}
              InputProps={{ style: { borderRadius: 10 } }}
            />
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<SaveIcon />}
              disabled={!presetName.trim()}
              onClick={saveCurrentAsPreset}
              className={headerClasses.button}
            >
              Salvar filtros
            </Button>
          </div>

          {filterPresets.length === 0 ? (
            <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
              Nenhum preset salvo ainda. Configure filtros acima e dê um nome para salvar.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {filterPresets.map((p) => (
                <Chip
                  key={p.id}
                  label={p.name}
                  onClick={() => applyPreset(p)}
                  onDelete={() => deletePreset(p.id)}
                  variant="outlined"
                  color="primary"
                  size="small"
                  className={headerClasses.presetChip}
                  title={[
                    p.filters.search && `busca: ${p.filters.search}`,
                    p.filters.filterPhone && `tel: ${p.filters.filterPhone}`,
                    p.filters.filterStartDate && `de ${p.filters.filterStartDate}`,
                    p.filters.filterEndDate && `até ${p.filters.filterEndDate}`,
                    `${p.filters.pageSize}/pág`,
                  ].filter(Boolean).join(" • ")}
                />
              ))}
            </div>
          )}
        </Paper>
      )}

      {/* Filtros rápidos por status */}
      <Paper variant="outlined" className={headerClasses.statusBar}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginRight: 4 }}>
          Status:
        </span>
        {COLUMNS.map((col) => {
          const cc = colorMap[col.color];
          const Icon = col.icon;
          const active = visibleStatuses.has(col.id);
          const total = columnsState[col.id]?.total ?? 0;
          const chipColors = {
            amber: "#f59e0b",
            sky: "#0ea5e9",
            emerald: "#10b981",
            rose: "#f43f5e",
          };
          return (
            <Tooltip key={col.id} title="Clique para alternar • Duplo clique para isolar">
              <Chip
                icon={<Icon size={14} />}
                label={`${col.label} (${total})`}
                clickable
                onClick={() => toggleStatusVisible(col.id)}
                onDoubleClick={() => showOnly(col.id)}
                size="small"
                className={headerClasses.statusChipActive}
                style={{
                  backgroundColor: active ? chipColors[col.color] : "transparent",
                  color: active ? "#fff" : "#94a3b8",
                  border: `1px solid ${active ? chipColors[col.color] : "#e2e8f0"}`,
                  fontWeight: 700,
                }}
              />
            </Tooltip>
          );
        })}
        {visibleStatuses.size < 4 && (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={showAll}
            className={headerClasses.button}
          >
            Mostrar todos
          </Button>
        )}

        <div className={headerClasses.statusBarRight}>
          <TextField
            variant="outlined"
            size="small"
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            placeholder="Filtrar por nome ou número..."
            className={headerClasses.quickFilter}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" style={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
              endAdornment: quickFilter ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuickFilter("")} title="Limpar filtro">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          {quickFilter && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              className={headerClasses.button}
              onClick={() => {
                const ids = [];
                COLUMNS.forEach((c) => {
                  if (!visibleStatuses.has(c.id)) return;
                  const view = columnViews[c.id];
                  if (!view) return;
                  for (let i = 0; i < view.items.length; i++) {
                    const it = view.items[i];
                    if (it.id) ids.push(it.id);
                  }
                });
                if (ids.length === 0) {
                  toast.info("Nenhum envio corresponde ao filtro");
                  return;
                }
                setSelectedIds(new Set(ids));
                toast.success(`${ids.length} envio(s) selecionado(s)`);
              }}
            >
              Selecionar filtrados
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={openHistory}
            title="Histórico de atualizações em massa"
            className={headerClasses.button}
            style={{ color: "#4f46e5", borderColor: "#c7d2fe" }}
          >
            Histórico
          </Button>
        </div>
      </Paper>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className={headerClasses.board}
          style={{ "--cols": Math.max(visibleStatuses.size, 1) }}
        >
          {COLUMNS.filter((col) => visibleStatuses.has(col.id)).map((col) => {
            const tokens = columnColorTokens[col.color] || columnColorTokens.amber;
            const Icon = col.icon;
            const view = columnViews[col.id] || { colState: { items: [], total: 0, hasMore: false, loading: false }, allItems: [], items: [], allSelected: false, hasAnyId: false };
            const { colState, allItems, items, allSelected, hasAnyId } = view;
            return (
              <div key={col.id} className={headerClasses.column}>
                <div
                  className={headerClasses.columnHeader}
                  style={{ background: tokens.headerBg }}
                >
                  <div className={headerClasses.columnHeaderLeft}>
                    <span
                      className={headerClasses.columnIcon}
                      style={{ background: tokens.chipBg, color: tokens.chipText }}
                    >
                      <Icon size={14} />
                    </span>
                    <span className={headerClasses.columnTitle} style={{ color: tokens.text }}>
                      {col.label}
                    </span>
                  </div>
                  <div className={headerClasses.columnHeaderLeft}>
                    {hasAnyId && (
                      <Button
                        size="small"
                        onClick={() => selectAllInColumn(items)}
                        title="Selecionar todos os visíveis nesta coluna"
                        className={headerClasses.columnSelectAll}
                        style={{ color: tokens.text }}
                      >
                        {allSelected ? "Limpar" : "Todos"}
                      </Button>
                    )}
                    <span
                      className={headerClasses.columnCount}
                      style={{ background: tokens.chipBg, color: tokens.chipText }}
                    >
                      {items.length}
                      {(quickFilterNorm ? allItems.length : colState.total) > items.length
                        ? `/${quickFilterNorm ? allItems.length : colState.total}`
                        : ""}
                    </span>
                  </div>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={(node) => { provided.innerRef(node); setColumnScrollRef(col.id)(node); }}
                      {...provided.droppableProps}
                      className={`${headerClasses.columnList} ${snapshot.isDraggingOver ? headerClasses.columnDraggingOver : ""}`}
                    >
                      {items.length === 0 && !colState.loading && (
                        <div className={headerClasses.emptyState}>Sem envios</div>
                      )}
                      {items.map((item, idx) => (
                        <KanbanCard
                          key={item.id ?? `virtual-${item.number}-${idx}`}
                          item={item}
                          index={idx}
                          checked={!!item.id && selectedIds.has(item.id)}
                          classes={headerClasses}
                          onOpen={openDetails}
                          onToggleSelect={toggleSelect}
                          selectedCount={selectedIds.size}
                        />
                      ))}
                      {provided.placeholder}
                      {colState.hasMore && !quickFilterNorm && (
                        <InfiniteSentinel
                          rootRef={getColumnScrollRef(col.id)}
                          disabled={colState.loading}
                          onReach={() => loadColumn(col.id)}
                        />
                      )}

                      {colState.hasMore && (
                        <Button
                          variant="outlined"
                          onClick={() => loadColumn(col.id)}
                          disabled={colState.loading}
                          className={headerClasses.loadMoreBtn}
                          style={{ color: tokens.text, borderColor: tokens.chipBg }}
                        >
                          {colState.loading
                            ? "Carregando..."
                            : `Carregar mais (${Math.max(colState.total - items.length, 0)} restantes)`}
                        </Button>
                      )}
                      {colState.loading && items.length === 0 && (
                        <div className={headerClasses.emptyState} style={{ border: "none" }}>
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
          <Dialog
            open
            onClose={cancel}
            maxWidth="sm"
            fullWidth
            classes={{ paper: headerClasses.dialogPaper }}
            aria-labelledby="bulk-move-confirm-title"
          >
            <DialogTitle id="bulk-move-confirm-title" disableTypography>
              <div className={headerClasses.dialogHeader} style={{ padding: 0, borderBottom: "none" }}>
                <Avatar className={headerClasses.dialogHeaderAvatar} style={{ background: "#fde68a", color: "#92400e" }}>
                  <AlertCircle size={20} />
                </Avatar>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700 }}>
                    Mover {pendingBulkMove.count} envios selecionados?
                  </div>
                </div>
              </div>
            </DialogTitle>
            <DialogContent dividers>
              <DialogContentText>
                Você arrastou um card que faz parte da seleção. Todos os{" "}
                <strong>{pendingBulkMove.count}</strong> envios selecionados serão movidos
                de <strong>"{sourceLabel}"</strong> para <strong>"{targetLabel}"</strong>.
              </DialogContentText>
              <DialogContentText style={{ fontSize: "0.75rem", marginBottom: 0 }}>
                Você poderá desfazer essa ação por 30 segundos depois de confirmar.
              </DialogContentText>
            </DialogContent>
            <DialogActions className={headerClasses.dialogActions}>
              <Button onClick={cancel} variant="outlined" className={headerClasses.dialogButton} autoFocus>
                Cancelar
              </Button>
              <Button onClick={confirm} variant="contained" color="primary" className={headerClasses.dialogButton}>
                Mover {pendingBulkMove.count} envios
              </Button>
            </DialogActions>
          </Dialog>
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
          ? { ring: "#fecdd3", bar: "#f43f5e", text: "#be123c", bg: "#fff1f2" }
          : phase === "done"
          ? { ring: "#a7f3d0", bar: "#10b981", text: "#047857", bg: "#ecfdf5" }
          : { ring: "#a7f3d0", bar: "#10b981", text: "#047857", bg: "#ffffff" };
        return (
          <div
            style={{
              position: "fixed",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1500,
              width: "min(440px, calc(100vw - 32px))",
              borderRadius: 16,
              border: `1px solid ${tone.ring}`,
              backgroundColor: tone.bg,
              boxShadow: "0 10px 25px rgba(16,185,129,0.10)",
              padding: "12px 16px",
            }}
            role="status"
            aria-live="polite"
            className="kanban-overlay-progress"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: tone.text }}>
                {phase === "processing" && <KanbanSpinner size={12} color={tone.text} inline />}
                {phase === "done" && <CheckCheck size={12} />}
                {phase === "error" && <AlertCircle size={12} />}
                {phase === "processing" && `Atualizando para "${statusLabel}"`}
                {phase === "done" && (bulkProgress.failed > 0
                  ? `Concluído com ${bulkProgress.failed} falha(s)`
                  : "Concluído")}
                {phase === "error" && "Falha na atualização"}
              </div>
              <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: tone.text }}>
                {bulkProgress.processed}/{bulkProgress.total}
                <span style={{ marginLeft: 4, opacity: 0.6 }}>({pct}%)</span>
              </span>
            </div>
            <div style={{ height: 8, width: "100%", borderRadius: 999, backgroundColor: "#f1f5f9", overflow: "hidden" }}>
              <div
                style={{ height: "100%", backgroundColor: tone.bar, width: `${pct}%`, transition: "width 200ms ease-out" }}
              />
            </div>
            {phase === "done" && (
              <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 11, color: "#475569" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={11} style={{ color: "#10b981" }} /> {bulkProgress.success} sucesso</span>
                {bulkProgress.failed > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><XCircle size={11} style={{ color: "#f43f5e" }} /> {bulkProgress.failed} falha</span>
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
            className="kanban-overlay-undo"
            style={{
              position: "fixed",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: hasSelection ? 96 : 24,
              zIndex: 1400,
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderRadius: 16,
              border: "1px solid #1e293b",
              backgroundColor: "#0f172a",
              padding: "12px 16px",
              color: "#ffffff",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-flex", height: 28, width: 28, alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.1)", fontSize: 12 }}>
                <Undo2 size={14} />
              </span>
              <div style={{ fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>{lastBulkUpdate.count}</span> envio(s) movido(s) para{" "}
                <span style={{ fontWeight: 600 }}>"{col?.label || lastBulkUpdate.status}"</span>
              </div>
            </div>
            <button
              onClick={() => undoBulkUpdate(lastBulkUpdate.id)}
              disabled={undoing}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                borderRadius: 12, backgroundColor: "#ffffff", color: "#0f172a",
                padding: "6px 12px", fontSize: 12, fontWeight: 700,
                border: "none", cursor: undoing ? "not-allowed" : "pointer",
                opacity: undoing ? 0.5 : 1,
              }}
            >
              <Undo2 size={12} />
              {undoing ? "Desfazendo..." : `Desfazer (${remaining}s)`}
            </button>
            <button
              onClick={() => setLastBulkUpdate(null)}
              style={{
                borderRadius: 8, padding: 4, color: "#94a3b8",
                background: "transparent", border: "none", cursor: "pointer",
              }}
              title="Fechar"
            >
              <X size={14} />
            </button>
          </div>
        );
      })()}

      {/* Barra flutuante de ações em massa */}
      {hasSelection && (
        <div
          className="kanban-overlay-bulk"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 16,
            border: "1px solid #a7f3d0",
            backgroundColor: "#ffffff",
            padding: "12px 16px",
            boxShadow: "0 25px 50px -12px rgba(16,185,129,0.2)",
            flexWrap: "wrap",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 8, borderRight: "1px solid #e2e8f0" }}>
            <span style={{ display: "inline-flex", height: 28, width: 28, alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              {selectedIds.size}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>selecionado(s)</span>
          </div>
          <span style={{ fontSize: 12, color: "#64748b", marginRight: 4 }}>Mover para:</span>
          {COLUMNS.map((col) => {
            const cc = colorMap[col.color];
            const Icon = col.icon;
            return (
              <button
                key={col.id}
                onClick={() => bulkUpdateStatus(col.id)}
                disabled={bulkUpdating}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  borderRadius: 12, padding: "6px 12px",
                  fontSize: 12, fontWeight: 700,
                  border: "none",
                  cursor: bulkUpdating ? "not-allowed" : "pointer",
                  opacity: bulkUpdating ? 0.5 : 1,
                  transition: "transform 150ms",
                  ...cc.chip,
                }}
              >
                <Icon size={12} />
                {col.label}
              </button>
            );
          })}
          <button
            onClick={clearSelection}
            disabled={bulkUpdating}
            style={{
              marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 4,
              borderRadius: 12, border: "1px solid #e2e8f0",
              padding: "6px 12px", fontSize: 12, fontWeight: 600,
              color: "#475569", backgroundColor: "transparent",
              cursor: bulkUpdating ? "not-allowed" : "pointer",
              opacity: bulkUpdating ? 0.5 : 1,
            }}
          >
            <X size={12} />
            Cancelar
          </button>
        </div>
      )}

      {/* Modal de histórico de atualizações em massa */}
      <Dialog
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryDetail(null); }}
        maxWidth="md"
        fullWidth
        classes={{ paper: headerClasses.dialogPaper }}
      >
        <DialogTitle disableTypography>
          <div className={headerClasses.dialogHeader} style={{ padding: 0, borderBottom: "none", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar className={headerClasses.dialogHeaderAvatar} style={{ background: "#e0e7ff", color: "#4338ca" }}>
                <HistoryIcon fontSize="small" />
              </Avatar>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700 }}>Histórico de atualizações em massa</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Quem atualizou, quando e quais envios foram afetados</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button
                size="small"
                variant={historyScope === "campaign" ? "contained" : "outlined"}
                color="primary"
                disabled={!campaignId}
                onClick={() => { setHistoryScope("campaign"); fetchHistory("campaign"); setHistoryDetail(null); }}
                className={headerClasses.dialogButton}
              >
                Esta campanha
              </Button>
              <Button
                size="small"
                variant={historyScope === "all" ? "contained" : "outlined"}
                color="primary"
                onClick={() => { setHistoryScope("all"); fetchHistory("all"); setHistoryDetail(null); }}
                className={headerClasses.dialogButton}
              >
                Todas
              </Button>
              <Tooltip title="Exportar histórico como CSV">
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={exportHistoryCSV}
                    disabled={filteredHistoryRecords.length === 0}
                    startIcon={<TableChartIcon fontSize="small" />}
                    className={headerClasses.dialogButton}
                    style={{ color: "#047857", borderColor: "#a7f3d0" }}
                  >
                    CSV
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Exportar histórico como PDF">
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={exportHistoryPDF}
                    disabled={filteredHistoryRecords.length === 0}
                    startIcon={<DescriptionIcon fontSize="small" />}
                    className={headerClasses.dialogButton}
                    style={{ color: "#be123c", borderColor: "#fecdd3" }}
                  >
                    PDF
                  </Button>
                </span>
              </Tooltip>
              <IconButton size="small" onClick={() => { setHistoryOpen(false); setHistoryDetail(null); }}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        </DialogTitle>

        <DialogContent dividers style={{ padding: 0 }}>
          {/* Busca + filtros */}
          <div style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Buscar por usuário ou ID da atualização..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: historySearch ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setHistorySearch("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            {historySearch && (
              <div style={{ marginTop: 4, fontSize: "0.7rem", color: "#94a3b8" }}>
                {filteredHistoryRecords.length} de {historyRecords.length} registro(s)
              </div>
            )}

            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginRight: 4 }}>
                Status destino:
              </span>
              <Chip
                size="small"
                label={`Todos (${historyRecords.length})`}
                color={historyStatusFilter === "all" ? "primary" : "default"}
                onClick={() => setHistoryStatusFilter("all")}
                clickable
              />
              {COLUMNS.map((col) => {
                const count = historyStatusCounts[col.id] || 0;
                const tokens = columnColorTokens[col.color || "amber"];
                const active = historyStatusFilter === col.id;
                return (
                  <Chip
                    key={col.id}
                    size="small"
                    label={`${col.label} (${count})`}
                    onClick={() => count > 0 && setHistoryStatusFilter(col.id)}
                    disabled={count === 0}
                    clickable={count > 0}
                    style={{
                      background: active ? tokens.chipBg : undefined,
                      color: active ? tokens.chipText : undefined,
                      fontWeight: active ? 700 : 500,
                      border: active ? "1px solid #c7d2fe" : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Lista + Detalhe */}
          <div className={headerClasses.historySplit}>
            <div className={headerClasses.historyListWrapper}>
              {historyLoading ? (
                <div className={headerClasses.historyEmpty}>
                  <KanbanSpinner size={20} label="Carregando..." />
                </div>
              ) : historyRecords.length === 0 ? (
                <div className={headerClasses.historyEmpty}>Nenhuma atualização em massa registrada.</div>
              ) : filteredHistoryRecords.length === 0 ? (
                <div className={headerClasses.historyEmpty}>
                  Nenhum registro corresponde aos filtros aplicados
                  {historySearch && <> para "<strong>{historySearch}</strong>"</>}.
                </div>
              ) : (
                <List dense disablePadding>
                  {filteredHistoryRecords.map((r) => {
                    const col = COLUMNS.find((c) => c.id === r.newStatus);
                    const tokens = columnColorTokens[col?.color || "amber"];
                    const total = (Array.isArray(r.shippingIds) ? r.shippingIds.length : 0) || (r.successCount + r.failedCount);
                    const isActive = historyDetail?.log?.id === r.id;
                    return (
                      <ListItem
                        key={r.id}
                        button
                        divider
                        onClick={() => openHistoryDetail(r.id)}
                        className={isActive ? headerClasses.historyItemActive : ""}
                      >
                        <ListItemAvatar>
                          <Avatar style={{ width: 28, height: 28, background: "#f1f5f9", color: "#64748b" }}>
                            <UserIcon size={12} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                                {r.userName || "Usuário desconhecido"}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {r.undoneAt && (
                                  <Tooltip title={`Desfeito em ${new Date(r.undoneAt).toLocaleString("pt-BR")}`}>
                                    <Chip size="small" label="desfeito" style={{ height: 18, fontSize: "0.6rem" }} />
                                  </Tooltip>
                                )}
                                <Chip
                                  size="small"
                                  label={col?.label || r.newStatus}
                                  style={{ height: 18, fontSize: "0.6rem", fontWeight: 700, background: tokens.chipBg, color: tokens.chipText }}
                                />
                              </div>
                            </div>
                          }
                          secondary={
                            <>
                              <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                                #{r.id} · {new Date(r.createdAt).toLocaleString("pt-BR")}
                              </div>
                              <div style={{ marginTop: 4, fontSize: "0.7rem", color: "#64748b", display: "flex", gap: 12 }}>
                                <span>📦 {total} envio(s)</span>
                                <span style={{ color: "#059669" }}>✓ {r.successCount}</span>
                                {r.failedCount > 0 && <span style={{ color: "#e11d48" }}>✗ {r.failedCount}</span>}
                                {r.campaign?.name && (
                                  <span style={{ marginLeft: "auto", color: "#94a3b8" }}>📣 {r.campaign.name}</span>
                                )}
                              </div>
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </div>

            <div className={headerClasses.historyDetailWrapper}>
              {!historyDetail ? (
                <div className={headerClasses.historyEmpty}>
                  Selecione um registro para ver os envios afetados.
                </div>
              ) : historyDetailLoading ? (
                <div className={headerClasses.historyEmpty}>
                  <KanbanSpinner size={20} label="Carregando detalhes..." />
                </div>
              ) : (
                <div>
                  <Paper variant="outlined" style={{ padding: 12, marginBottom: 12, borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                          {historyDetail.log?.userName || "Usuário"} alterou {historyDetail.shippings?.length || 0} envio(s) para{" "}
                          <span style={{ color: "#4338ca" }}>"{historyDetail.log?.newStatus}"</span>
                        </div>
                        <div style={{ marginTop: 4, fontSize: "0.7rem", color: "#64748b" }}>
                          {historyDetail.log && new Date(historyDetail.log.createdAt).toLocaleString("pt-BR")}
                          {" · "}Origem: {historyDetail.log?.source || "—"}
                        </div>
                      </div>
                      {historyDetail.log?.undoneAt ? (
                        <Tooltip title={`Desfeito por ${historyDetail.log.undoneByUserName || "—"} em ${new Date(historyDetail.log.undoneAt).toLocaleString("pt-BR")}`}>
                          <Chip size="small" icon={<Undo2 size={11} />} label="Desfeito" />
                        </Tooltip>
                      ) : (
                        <Tooltip title={historyDetail.log?.previousState?.length ? "Reverter esta atualização" : "Snapshot anterior indisponível"}>
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              color="default"
                              onClick={() => undoBulkUpdate(historyDetail.log.id)}
                              disabled={undoing || !(historyDetail.log?.previousState?.length)}
                              startIcon={<Undo2 size={11} />}
                              className={headerClasses.dialogButton}
                              style={{ background: "#0f172a", color: "#fff" }}
                            >
                              {undoing ? "Desfazendo..." : "Desfazer"}
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    {historyDetail.log?.undoneAt && (
                      <div style={{ marginTop: 8, fontSize: "0.65rem", color: "#94a3b8" }}>
                        Desfeito por {historyDetail.log.undoneByUserName || "—"} em{" "}
                        {new Date(historyDetail.log.undoneAt).toLocaleString("pt-BR")}
                      </div>
                    )}
                  </Paper>

                  {(!historyDetail.shippings || historyDetail.shippings.length === 0) ? (
                    <div className={headerClasses.historyEmpty}>
                      Nenhum envio encontrado (podem ter sido removidos).
                    </div>
                  ) : (
                    <List dense disablePadding>
                      {historyDetail.shippings.map((s) => (
                        <ListItem
                          key={s.id}
                          button
                          divider
                          onClick={() => {
                            setHistoryOpen(false);
                            setHistoryDetail(null);
                            openDetails(s);
                          }}
                        >
                          <ListItemText
                            primary={<span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{s.contact?.name || s.number || `#${s.id}`}</span>}
                            secondary={<span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{s.number}</span>}
                          />
                          <ExternalLink size={12} style={{ color: "#6366f1" }} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do envio */}
      <Dialog
        open={!!selected}
        onClose={closeDetails}
        maxWidth="sm"
        fullWidth
        classes={{ paper: headerClasses.dialogPaper }}
      >
        {selected && (() => {
          const status = inferStatus(selected);
          const col = COLUMNS.find((c) => c.id === status);
          const tokens = columnColorTokens[col?.color || "amber"];
          const isFailed = status === "failed";
          const messageError = isFailed && !editMessage.trim();
          return (
            <>
              <DialogTitle disableTypography style={{ padding: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 24px",
                    background: tokens.headerBg,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar style={{ background: "#e2e8f0", color: "#334155", fontWeight: 700, fontSize: "0.85rem" }}>
                      {(selected.contact?.name || selected.number || "?").slice(0, 2).toUpperCase()}
                    </Avatar>
                    <div>
                      <div style={{ fontSize: "1rem", fontWeight: 700 }}>
                        {selected.contact?.name || "Sem nome"}
                      </div>
                      <Chip
                        size="small"
                        label={col?.label}
                        className={headerClasses.detailsHeaderChip}
                        style={{ background: tokens.chipBg, color: tokens.chipText, marginTop: 4 }}
                      />
                    </div>
                  </div>
                  <IconButton size="small" onClick={closeDetails}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </div>
              </DialogTitle>

              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={6}><InfoRow icon={Phone} label="Número" value={selected.number} /></Grid>
                  <Grid item xs={6}><InfoRow icon={Hash} label="ID" value={selected.id} /></Grid>
                  {selected.contact?.email && (
                    <Grid item xs={6}><InfoRow icon={Mail} label="Email" value={selected.contact.email} /></Grid>
                  )}
                  <Grid item xs={6}>
                    <InfoRow
                      icon={Calendar}
                      label="Criado em"
                      value={selected.createdAt ? new Date(selected.createdAt).toLocaleString("pt-BR") : "—"}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoRow
                      icon={CheckCircle2}
                      label="Entregue em"
                      value={selected.deliveredAt ? new Date(selected.deliveredAt).toLocaleString("pt-BR") : "—"}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoRow
                      icon={CheckCheck}
                      label="Confirmado em"
                      value={selected.confirmedAt ? new Date(selected.confirmedAt).toLocaleString("pt-BR") : "—"}
                    />
                  </Grid>
                </Grid>

                <TextField
                  className={headerClasses.detailsField}
                  label="Mensagem"
                  variant="outlined"
                  fullWidth
                  multiline
                  minRows={4}
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  disabled={!isFailed}
                  error={messageError}
                  helperText={
                    messageError
                      ? "A mensagem não pode ficar vazia."
                      : !isFailed
                        ? 'Mensagem só pode ser editada quando o status é "Falhou".'
                        : " "
                  }
                />

                <TextField
                  className={headerClasses.detailsField}
                  label={isFailed ? "Observações (editável)" : "Observações"}
                  variant="outlined"
                  fullWidth
                  multiline
                  minRows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  disabled={!isFailed}
                  placeholder={isFailed ? "Ex.: número inválido, sem WhatsApp, bloqueado..." : "Sem observações"}
                />
              </DialogContent>

              <DialogActions className={headerClasses.dialogActions}>
                <Button onClick={closeDetails} variant="outlined" className={headerClasses.dialogButton}>
                  Fechar
                </Button>
                <Button
                  onClick={saveContent}
                  disabled={!isFailed || saving || messageError}
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <KanbanSpinner size={14} color="inherit" inline /> : <SaveIcon fontSize="small" />}
                  className={headerClasses.dialogButton}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
      </div>
    </MainContainer>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
    <Icon size={14} style={{ marginTop: 2, color: "#94a3b8", flexShrink: 0 }} />
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", margin: 0 }}>{label}</p>
      <p style={{ fontSize: 14, color: "#334155", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value || "—"}</p>
    </div>
  </div>
);

// Indicador de "ao vivo" — sem Tailwind.
// Estados visuais:
//   connected  + tick recente -> dot com `kanban-ping` (onda)
//   connected  + idle         -> dot estático
//   reconnecting              -> dot com `kanban-ping` contínuo + botão com `kanban-spin`
//   disconnected              -> dot com `kanban-pulse` (atenção) + botão estático
const LiveBadge = ({ tick, state = "disconnected", attempt = 0, onRetry }) => {
  const [recentTick, setRecentTick] = useState(false);
  useEffect(() => {
    if (!tick) return;
    setRecentTick(true);
    const t = setTimeout(() => setRecentTick(false), 800);
    return () => clearTimeout(t);
  }, [tick]);

  const isConnected = state === "connected";
  const isReconnecting = state === "reconnecting";
  const isDisconnected = !isConnected && !isReconnecting;

  const tone = isConnected
    ? { border: "#a7f3d0", bg: "#ecfdf5", text: "#047857", dot: "#10b981", ping: "#34d399" }
    : isReconnecting
    ? { border: "#fde68a", bg: "#fffbeb", text: "#b45309", dot: "#f59e0b", ping: "#fbbf24" }
    : { border: "#fecdd3", bg: "#fff1f2", text: "#be123c", dot: "#f43f5e", ping: "#f43f5e" };

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

  // Quando exibir a onda de ping no dot
  const showPing = (isConnected && recentTick) || isReconnecting;
  // Quando o próprio dot deve pulsar (sinal de alerta sem ping)
  const dotAnimClass = isDisconnected ? "kanban-pulse" : "";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div
        title={title}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          borderRadius: 12, border: `1px solid ${tone.border}`,
          padding: "6px 10px", fontSize: 11, fontWeight: 700,
          backgroundColor: tone.bg, color: tone.text,
          transition: "background-color 200ms, color 200ms, border-color 200ms",
        }}
      >
        <span style={{ position: "relative", display: "inline-flex", height: 8, width: 8 }}>
          {showPing && (
            <span
              className="kanban-ping"
              style={{
                position: "absolute", display: "inline-flex",
                height: "100%", width: "100%",
                borderRadius: "50%",
                backgroundColor: tone.ping,
              }}
            />
          )}
          <span
            className={dotAnimClass}
            style={{
              position: "relative", display: "inline-flex",
              height: 8, width: 8, borderRadius: "50%",
              backgroundColor: tone.dot,
            }}
          />
        </span>
        {label}
      </div>
      {!isConnected && (
        <button
          onClick={onRetry}
          title="Reconectar agora"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#fff",
            padding: 6, color: "#64748b", cursor: "pointer",
          }}
        >
          {isReconnecting ? (
            <KanbanSpinner size={12} color="#64748b" inline />
          ) : (
            <RefreshCcw size={12} />
          )}
        </button>
      )}
    </div>
  );
};

export default CampaignKanban;
