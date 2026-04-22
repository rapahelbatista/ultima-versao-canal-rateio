import React, { useState, useEffect, useReducer, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@material-ui/core";
import {
  CreditCard,
  Crown,
  Check,
  AlertTriangle,
  Calendar,
  Users as UsersIcon,
  Smartphone,
  Layers,
  Sparkles,
  Minus,
  Plus,
  X as XIcon,
  GitCompare,
} from "lucide-react";
import moment from "moment";

import MainContainer from "../../components/MainContainer";
import SubscriptionModal from "../../components/SubscriptionModal";
import BillingFAQ from "./BillingFAQ";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";

const reducer = (state, action) => {
  if (action.type === "LOAD_INVOICES") {
    const invoices = action.payload.invoices || action.payload;
    const newInvoices = [];
    invoices.forEach((invoice) => {
      const idx = state.findIndex((i) => i.id === invoice.id);
      if (idx !== -1) state[idx] = invoice;
      else newInvoices.push(invoice);
    });
    return [...state, ...newInvoices];
  }
  if (action.type === "RESET") return [];
  return state;
};

const useStyles = makeStyles((theme) => ({
  root: { display: "flex", flexDirection: "column", gap: 20, padding: 20 },
  hero: {
    background:
      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
    color: "#fff",
    borderRadius: 20,
    padding: 24,
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 18px 40px rgba(99,102,241,0.25)",
  },
  heroLeft: { display: "flex", alignItems: "center", gap: 16, minWidth: 0 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: "rgba(255,255,255,0.18)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
  },
  planName: { fontSize: 22, fontWeight: 800, lineHeight: 1.1 },
  planSub: { fontSize: 13, opacity: 0.85, marginTop: 4 },
  heroBadges: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 },
  pill: {
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.35)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
  heroRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },
  dueLabel: { fontSize: 11, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5 },
  dueDate: { fontSize: 18, fontWeight: 800 },
  expiredBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    margin: "8px 0 4px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  sectionSub: { fontSize: 12, color: "#64748b", marginBottom: 12 },
  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  planCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    transition: "transform .2s, box-shadow .2s, border-color .2s",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
      borderColor: "#c7d2fe",
    },
  },
  planCardCurrent: {
    borderColor: "#6366f1",
    background: "linear-gradient(180deg, #eef2ff 0%, #ffffff 60%)",
    boxShadow: "0 12px 30px rgba(99,102,241,0.18)",
  },
  planCardPopular: {
    borderColor: "#10b981",
  },
  planTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  planTitle: { fontSize: 16, fontWeight: 800, color: "#0f172a" },
  planTag: {
    fontSize: 10,
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: 999,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  planPrice: { display: "flex", alignItems: "baseline", gap: 4 },
  priceValue: { fontSize: 28, fontWeight: 800, color: "#0f172a" },
  priceUnit: { fontSize: 12, color: "#64748b" },
  planFeatures: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  planFeature: {
    fontSize: 13,
    color: "#334155",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  selectBtn: { marginTop: "auto" },
  seatBox: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  seatRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  seatLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  seatStepper: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: 2,
  },
  seatBtn: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
    "&:hover:not(:disabled)": { background: "#eef2ff", color: "#4338ca" },
    "&:disabled": { opacity: 0.35, cursor: "not-allowed" },
  },
  seatCount: {
    minWidth: 28,
    textAlign: "center",
    fontWeight: 800,
    color: "#0f172a",
    fontSize: 13,
  },
  seatHint: { fontSize: 11, color: "#64748b" },
  invoicesPaper: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    background: "#fff",
    overflowY: "auto",
    maxHeight: 480,
  },
  loaderBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    color: "#64748b",
    gap: 8,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14,
  },
  summaryCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    position: "relative",
    overflow: "hidden",
    transition: "transform .2s, box-shadow .2s",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
    },
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.1,
  },
  summaryHint: { fontSize: 11, color: "#94a3b8" },
  statusDot: {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    marginRight: 6,
  },
  limitsRow: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 4,
  },
  limitItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#334155",
    fontWeight: 600,
  },
  compareWrap: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
  },
  compareScroll: { overflowX: "auto" },
  compareTable: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 560,
    "& th, & td": {
      padding: "12px 14px",
      fontSize: 13,
      borderBottom: "1px solid #f1f5f9",
      textAlign: "center",
      color: "#334155",
    },
    "& th:first-child, & td:first-child": {
      textAlign: "left",
      fontWeight: 600,
      color: "#0f172a",
      position: "sticky",
      left: 0,
      background: "#fff",
      zIndex: 1,
    },
    "& thead th": {
      background: "#f8fafc",
      fontWeight: 800,
      color: "#0f172a",
      fontSize: 13,
      textTransform: "none",
      letterSpacing: 0,
      borderBottom: "1px solid #e2e8f0",
    },
    "& tbody tr:hover td": { background: "#f8fafc" },
  },
  compareHeadCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  compareHeadName: { fontWeight: 800, color: "#0f172a" },
  compareHeadPrice: { fontSize: 12, color: "#475569", fontWeight: 700 },
  compareTagPopular: {
    fontSize: 9,
    fontWeight: 800,
    padding: "2px 6px",
    borderRadius: 999,
    background: "#10b981",
    color: "#fff",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  compareTagCurrent: {
    fontSize: 9,
    fontWeight: 800,
    padding: "2px 6px",
    borderRadius: 999,
    background: "#6366f1",
    color: "#fff",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  iconYes: { color: "#10b981" },
  iconNo: { color: "#cbd5e1" },
}));

const TONE = {
  current: { bg: "#6366f1", color: "#fff", label: "Plano atual" },
  popular: { bg: "#10b981", color: "#fff", label: "Mais popular" },
};

const Financeiro = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { getPlanList, getPlanCompany } = usePlans();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [invoices, dispatch] = useReducer(reducer, []);
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  // Assentos extras escolhidos por plano: { [planId]: extraSeats }
  const [extraSeats, setExtraSeats] = useState({});
  const SEAT_PRICE = 11; // R$ por usuário extra/mês (alinhado ao PaymentForm)
  const MAX_EXTRA_SEATS = 50;

  const getExtra = (id) => extraSeats[id] || 0;
  const changeSeats = (id, delta) =>
    setExtraSeats((s) => {
      const next = Math.min(MAX_EXTRA_SEATS, Math.max(0, (s[id] || 0) + delta));
      return { ...s, [id]: next };
    });

  const isCompanyExpired =
    user?.company?.dueDate && moment().isAfter(moment(user.company.dueDate));

  // Carregar planos disponíveis e plano atual
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingPlans(true);
        const [allPlans, mine] = await Promise.all([
          getPlanList().catch(() => []),
          user?.companyId ? getPlanCompany({}, user.companyId).catch(() => null) : Promise.resolve(null),
        ]);
        if (!alive) return;
        setPlans(Array.isArray(allPlans) ? allPlans : []);
        setCurrentPlan(mine?.plan || mine || null);
      } catch (err) {
        toastError(err);
      } finally {
        if (alive) setLoadingPlans(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId]);

  // Faturas
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/invoices/all", { params: { pageNumber } });
        dispatch({ type: "LOAD_INVOICES", payload: data });
        setHasMore(Boolean(data?.hasMore));
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pageNumber]);

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      setPageNumber((p) => p + 1);
    }
  };

  const rowStatus = (record) => {
    if (record.status === "paid") return "Pago";
    const diasRestantes = moment(record.dueDate).diff(moment().startOf("day"), "days");
    return diasRestantes < 0 ? "Vencido" : "Em Aberto";
  };

  const handleSelectPlan = (plan, extra = 0) => {
    const basePrice = Number(plan.value || plan.price || 0);
    const totalUsers = Number(plan.users || 0) + Number(extra || 0);
    const totalPrice = basePrice + Number(extra || 0) * SEAT_PRICE;

    setSelectedInvoice({
      id: plan.id,
      detail: plan.name,
      value: totalPrice,
      users: totalUsers,
      connections: plan.connections,
      queues: plan.queues,
      planId: plan.id,
    });
    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      value: totalPrice,
      price: totalPrice,
      amount: totalPrice,
      users: totalUsers,
      connections: plan.connections,
      queues: plan.queues,
    });
    setContactModalOpen(true);
  };

  const fmtMoney = (v) =>
    Number(v || 0).toLocaleString("pt-br", { style: "currency", currency: "BRL" });

  const planFeatures = (p) => [
    { icon: UsersIcon, label: `${p.users || 0} usuários` },
    { icon: Smartphone, label: `${p.connections || 0} conexões` },
    { icon: Layers, label: `${p.queues || 0} filas` },
    p.useCampaigns && { icon: Sparkles, label: "Campanhas inclusas" },
    p.useOpenAi && { icon: Sparkles, label: "Integração OpenAI" },
    p.useKanban && { icon: Sparkles, label: "Kanban de tickets" },
  ].filter(Boolean);

  const isCurrent = (p) => currentPlan && (currentPlan.id === p.id || currentPlan.planId === p.id);

  return (
    <MainContainer>
      <SubscriptionModal
        open={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setSelectedPlan(null);
        }}
        Invoice={selectedInvoice}
        selectedPlan={selectedPlan}
        contactId={null}
      />

      <div className={classes.root}>
        {/* Hero / plano atual */}
        <div className={classes.hero}>
          <div className={classes.heroLeft}>
            <div className={classes.heroIcon}>
              <Crown size={28} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className={classes.planName}>
                {currentPlan?.name || user?.company?.plan?.name || "Plano atual"}
              </div>
              <div className={classes.planSub}>
                {currentPlan?.value || currentPlan?.price
                  ? `${fmtMoney(currentPlan.value || currentPlan.price)} / mês`
                  : "Resumo da sua assinatura"}
              </div>
              <div className={classes.heroBadges}>
                {currentPlan?.users != null && (
                  <span className={classes.pill}>
                    <UsersIcon size={11} /> {currentPlan.users} usuários
                  </span>
                )}
                {currentPlan?.connections != null && (
                  <span className={classes.pill}>
                    <Smartphone size={11} /> {currentPlan.connections} conexões
                  </span>
                )}
                {currentPlan?.queues != null && (
                  <span className={classes.pill}>
                    <Layers size={11} /> {currentPlan.queues} filas
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={classes.heroRight}>
            <span className={classes.dueLabel}>Próximo vencimento</span>
            <span className={classes.dueDate}>
              <Calendar size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              {user?.company?.dueDate
                ? moment(user.company.dueDate).format("DD/MM/YYYY")
                : "—"}
            </span>
          </div>
        </div>

        {/* Painel de Resumo do Plano Atual */}
        {(() => {
          const price = Number(currentPlan?.value ?? currentPlan?.price ?? user?.company?.plan?.value ?? 0);
          const dueDate = user?.company?.dueDate;
          const daysLeft = dueDate ? moment(dueDate).startOf("day").diff(moment().startOf("day"), "days") : null;
          const expired = daysLeft !== null && daysLeft < 0;
          const trial = price === 0;

          let statusColor = "#10b981";
          let statusLabel = "Ativo";
          if (expired) { statusColor = "#ef4444"; statusLabel = "Vencido"; }
          else if (daysLeft !== null && daysLeft <= 5) { statusColor = "#f59e0b"; statusLabel = "Vence em breve"; }
          else if (trial) { statusColor = "#6366f1"; statusLabel = "Plano gratuito"; }

          const nextCycle = dueDate ? moment(dueDate).format("DD/MM/YYYY") : "—";
          const nextCycleHint =
            daysLeft === null
              ? "Sem data definida"
              : expired
              ? `Venceu há ${Math.abs(daysLeft)} dia(s)`
              : daysLeft === 0
              ? "Vence hoje"
              : `Em ${daysLeft} dia(s)`;

          return (
            <div className={classes.summaryGrid}>
              <div className={classes.summaryCard}>
                <div className={classes.summaryIcon} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  <CreditCard size={18} />
                </div>
                <span className={classes.summaryLabel}>Preço mensal</span>
                <span className={classes.summaryValue}>{fmtMoney(price)}</span>
                <span className={classes.summaryHint}>
                  {currentPlan?.name ? `Plano ${currentPlan.name}` : "Mensalidade da assinatura"}
                </span>
              </div>

              <div className={classes.summaryCard}>
                <div className={classes.summaryIcon} style={{ background: `linear-gradient(135deg, ${statusColor}, ${statusColor}cc)` }}>
                  <Sparkles size={18} />
                </div>
                <span className={classes.summaryLabel}>Status</span>
                <span className={classes.summaryValue}>
                  <span className={classes.statusDot} style={{ background: statusColor }} />
                  {statusLabel}
                </span>
                <span className={classes.summaryHint}>
                  {expired ? "Regularize para reativar" : "Sua assinatura está em ordem"}
                </span>
              </div>

              <div className={classes.summaryCard}>
                <div className={classes.summaryIcon} style={{ background: "linear-gradient(135deg,#0ea5e9,#22d3ee)" }}>
                  <Calendar size={18} />
                </div>
                <span className={classes.summaryLabel}>Próximo ciclo</span>
                <span className={classes.summaryValue}>{nextCycle}</span>
                <span className={classes.summaryHint}>{nextCycleHint}</span>
              </div>

              <div className={classes.summaryCard}>
                <div className={classes.summaryIcon} style={{ background: "linear-gradient(135deg,#10b981,#34d399)" }}>
                  <Layers size={18} />
                </div>
                <span className={classes.summaryLabel}>Limites do plano</span>
                <div className={classes.limitsRow}>
                  <div className={classes.limitItem}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <UsersIcon size={13} style={{ color: "#64748b" }} /> Usuários
                    </span>
                    <span style={{ color: "#0f172a", fontWeight: 800 }}>{currentPlan?.users ?? "—"}</span>
                  </div>
                  <div className={classes.limitItem}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Smartphone size={13} style={{ color: "#64748b" }} /> Conexões
                    </span>
                    <span style={{ color: "#0f172a", fontWeight: 800 }}>{currentPlan?.connections ?? "—"}</span>
                  </div>
                  <div className={classes.limitItem}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Layers size={13} style={{ color: "#64748b" }} /> Filas
                    </span>
                    <span style={{ color: "#0f172a", fontWeight: 800 }}>{currentPlan?.queues ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {isCompanyExpired && (
          <div className={classes.expiredBanner}>
            <AlertTriangle size={16} />
            Sua assinatura está vencida. Selecione um plano abaixo ou pague uma fatura em aberto para regularizar.
          </div>
        )}

        {/* Planos disponíveis */}
        <div>
          <div className={classes.sectionTitle}>
            <Sparkles size={16} /> Planos disponíveis
          </div>
          <div className={classes.sectionSub}>
            Faça upgrade ou downgrade quando quiser. As alterações geram uma nova fatura.
          </div>

          {loadingPlans ? (
            <div className={classes.loaderBox}>
              <CircularProgress size={18} /> Carregando planos…
            </div>
          ) : plans.length === 0 ? (
            <div className={classes.loaderBox}>Nenhum plano disponível no momento.</div>
          ) : (
            <div className={classes.plansGrid}>
              {(() => {
                const visible = plans
                  .filter((p) => p.isPublic !== false && p.deletedAt == null)
                  .slice()
                  .sort(
                    (a, b) =>
                      Number(a.value || a.price || 0) - Number(b.value || b.price || 0)
                  );
                const popularIdx =
                  visible.length >= 3 ? Math.floor(visible.length / 2) : visible.length - 1;
                return visible.map((p, idx) => {
                  const current = isCurrent(p);
                  const popular = !current && idx === popularIdx && visible.length > 1;
                  const tone = current ? TONE.current : popular ? TONE.popular : null;
                  const price = Number(p.value || p.price || 0);
                  const extra = getExtra(p.id);
                  const baseUsers = Number(p.users || 0);
                  const totalUsers = baseUsers + extra;
                  const totalPrice = price + extra * SEAT_PRICE;
                  return (
                    <div
                      key={p.id}
                      className={`${classes.planCard} ${current ? classes.planCardCurrent : ""} ${
                        popular ? classes.planCardPopular : ""
                      }`}
                      style={popular ? { transform: "translateY(-4px)" } : undefined}
                    >
                      <div className={classes.planTopRow}>
                        <div className={classes.planTitle}>{p.name}</div>
                        {tone && (
                          <span
                            className={classes.planTag}
                            style={{ background: tone.bg, color: tone.color }}
                          >
                            {tone.label}
                          </span>
                        )}
                      </div>

                      <div className={classes.planPrice}>
                        {totalPrice === 0 ? (
                          <span className={classes.priceValue}>Grátis</span>
                        ) : (
                          <>
                            <span className={classes.priceValue}>{fmtMoney(totalPrice)}</span>
                            <span className={classes.priceUnit}>/ mês</span>
                          </>
                        )}
                      </div>

                      <ul className={classes.planFeatures}>
                        {planFeatures({ ...p, users: totalUsers }).map((f, i) => {
                          const Ic = f.icon;
                          return (
                            <li key={i} className={classes.planFeature}>
                              <Check size={14} style={{ color: "#10b981" }} />
                              <Ic size={14} style={{ color: "#64748b" }} />
                              {f.label}
                            </li>
                          );
                        })}
                      </ul>

                      {price > 0 && (
                        <div className={classes.seatBox}>
                          <div className={classes.seatRow}>
                            <span className={classes.seatLabel}>
                              <UsersIcon size={13} /> Usuários adicionais
                            </span>
                            <div className={classes.seatStepper}>
                              <button
                                type="button"
                                className={classes.seatBtn}
                                onClick={() => changeSeats(p.id, -1)}
                                disabled={extra <= 0 || current}
                                aria-label="Remover usuário"
                              >
                                <Minus size={14} />
                              </button>
                              <span className={classes.seatCount}>{extra}</span>
                              <button
                                type="button"
                                className={classes.seatBtn}
                                onClick={() => changeSeats(p.id, +1)}
                                disabled={extra >= MAX_EXTRA_SEATS || current}
                                aria-label="Adicionar usuário"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                          <span className={classes.seatHint}>
                            {extra > 0
                              ? `+${fmtMoney(extra * SEAT_PRICE)} / mês • Total: ${totalUsers} usuários`
                              : `${fmtMoney(SEAT_PRICE)} por usuário extra • Inclui ${baseUsers} no plano`}
                          </span>
                        </div>
                      )}

                      <Button
                        className={classes.selectBtn}
                        variant={current ? "outlined" : "contained"}
                        color="primary"
                        disabled={current}
                        onClick={() => handleSelectPlan(p, extra)}
                        startIcon={<CreditCard size={16} />}
                        fullWidth
                      >
                        {current
                          ? "Plano atual"
                          : price === 0
                          ? "Começar agora"
                          : extra > 0
                          ? `Assinar com +${extra} usuário${extra > 1 ? "s" : ""}`
                          : "Assinar este plano"}
                      </Button>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Comparação de planos */}
        {(() => {
          const visible = plans
            .filter((p) => p.isPublic !== false && p.deletedAt == null)
            .slice()
            .sort(
              (a, b) =>
                Number(a.value || a.price || 0) - Number(b.value || b.price || 0)
            );
          if (visible.length < 2) return null;
          const popularIdx =
            visible.length >= 3 ? Math.floor(visible.length / 2) : visible.length - 1;

          const rows = [
            { label: "Usuários inclusos", get: (p) => p.users || 0 },
            { label: "Conexões WhatsApp", get: (p) => p.connections || 0 },
            { label: "Filas de atendimento", get: (p) => p.queues || 0 },
            { label: "WhatsApp (não oficial)", get: (p) => !!p.useWhatsapp, bool: true },
            { label: "WhatsApp Oficial (Meta)", get: (p) => !!p.useWhatsappOfficial, bool: true },
            { label: "Facebook Messenger", get: (p) => !!p.useFacebook, bool: true },
            { label: "Instagram Direct", get: (p) => !!p.useInstagram, bool: true },
            { label: "Campanhas em massa", get: (p) => !!p.useCampaigns, bool: true },
            { label: "Agendamentos", get: (p) => !!p.useSchedules, bool: true },
            { label: "Chat interno", get: (p) => !!p.useInternalChat, bool: true },
            { label: "Kanban de tickets", get: (p) => !!p.useKanban, bool: true },
            { label: "Integração OpenAI", get: (p) => !!p.useOpenAi, bool: true },
            { label: "Integrações externas", get: (p) => !!p.useIntegrations, bool: true },
            { label: "API externa", get: (p) => !!p.useExternalApi, bool: true },
            { label: "Chamadas de voz (Wavoip)", get: (p) => !!p.wavoip, bool: true },
          ];

          return (
            <div>
              <div className={classes.sectionTitle}>
                <GitCompare size={16} /> Comparar planos
              </div>
              <div className={classes.sectionSub}>
                Veja lado a lado o que cada plano inclui antes de decidir.
              </div>

              <div className={classes.compareWrap}>
                <div className={classes.compareScroll}>
                  <table className={classes.compareTable}>
                    <thead>
                      <tr>
                        <th>Recurso</th>
                        {visible.map((p, idx) => {
                          const current = isCurrent(p);
                          const popular = !current && idx === popularIdx;
                          const price = Number(p.value || p.price || 0);
                          return (
                            <th key={p.id}>
                              <div className={classes.compareHeadCol}>
                                <span className={classes.compareHeadName}>{p.name}</span>
                                <span className={classes.compareHeadPrice}>
                                  {price === 0 ? "Grátis" : `${fmtMoney(price)}/mês`}
                                </span>
                                {current ? (
                                  <span className={classes.compareTagCurrent}>Atual</span>
                                ) : popular ? (
                                  <span className={classes.compareTagPopular}>Popular</span>
                                ) : null}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          {visible.map((p) => {
                            const v = row.get(p);
                            return (
                              <td key={p.id}>
                                {row.bool ? (
                                  v ? (
                                    <Check size={18} className={classes.iconYes} />
                                  ) : (
                                    <XIcon size={18} className={classes.iconNo} />
                                  )
                                ) : (
                                  <strong style={{ color: "#0f172a" }}>{v}</strong>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td>Ação</td>
                        {visible.map((p) => {
                          const current = isCurrent(p);
                          const price = Number(p.value || p.price || 0);
                          return (
                            <td key={p.id}>
                              <Button
                                size="small"
                                variant={current ? "outlined" : "contained"}
                                color="primary"
                                disabled={current}
                                onClick={() => handleSelectPlan(p, getExtra(p.id))}
                              >
                                {current
                                  ? "Atual"
                                  : price === 0
                                  ? "Começar"
                                  : "Assinar"}
                              </Button>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Faturas */}
        <div>
          <div className={classes.sectionTitle}>
            <CreditCard size={16} /> Histórico de faturas ({invoices.length})
          </div>
          <Paper className={classes.invoicesPaper} variant="outlined" onScroll={handleScroll}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Detalhes</TableCell>
                  <TableCell align="center">Usuários</TableCell>
                  <TableCell align="center">Conexões</TableCell>
                  <TableCell align="center">Filas</TableCell>
                  <TableCell align="center">Valor</TableCell>
                  <TableCell align="center">Vencimento</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => {
                  const status = rowStatus(inv);
                  const tone =
                    status === "Pago"
                      ? { bg: "#dcfce7", color: "#15803d" }
                      : status === "Vencido"
                      ? { bg: "#fee2e2", color: "#b91c1c" }
                      : { bg: "#fef9c3", color: "#a16207" };
                  return (
                    <TableRow key={inv.id}>
                      <TableCell align="center">{inv.detail}</TableCell>
                      <TableCell align="center">{inv.users}</TableCell>
                      <TableCell align="center">{inv.connections}</TableCell>
                      <TableCell align="center">{inv.queues}</TableCell>
                      <TableCell align="center" style={{ fontWeight: 700 }}>
                        {fmtMoney(inv.value)}
                      </TableCell>
                      <TableCell align="center">
                        {moment(inv.dueDate).format("DD/MM/YYYY")}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={status}
                          style={{
                            background: tone.bg,
                            color: tone.color,
                            fontWeight: 700,
                            borderRadius: 999,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {status !== "Pago" ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setSelectedPlan(null); // pagar fatura existente, não trocar plano
                              setContactModalOpen(true);
                            }}
                          >
                            Pagar
                          </Button>
                        ) : (
                          <Button size="small" variant="outlined" disabled>
                            Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {loading && <TableRowSkeleton columns={8} />}
              </TableBody>
            </Table>
          </Paper>
        </div>
      </div>
    </MainContainer>
  );
};

export default Financeiro;
