import React, { useMemo } from "react";
import { Paper, Typography, Grid, Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Inbox,
  CheckCircleOutline,
  HourglassEmpty,
  AccessTime,
  Star,
  AttachMoney,
} from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  wrapper: {
    margin: theme.spacing(2, 0),
  },
  kpiCard: {
    padding: theme.spacing(2),
    borderRadius: 14,
    border: `1px solid ${theme.palette.type === "dark" ? "rgba(255,255,255,0.06)" : "#e2e8f0"}`,
    background: theme.palette.type === "dark" ? "rgba(255,255,255,0.02)" : "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
    height: "100%",
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.type === "dark" ? "#94a3b8" : "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
    color: theme.palette.text.primary,
    lineHeight: 1.1,
  },
  kpiHelp: {
    fontSize: 11,
    color: theme.palette.type === "dark" ? "#94a3b8" : "#94a3b8",
    marginTop: 2,
  },
  chartCard: {
    padding: theme.spacing(2),
    borderRadius: 14,
    border: `1px solid ${theme.palette.type === "dark" ? "rgba(255,255,255,0.06)" : "#e2e8f0"}`,
    background: theme.palette.type === "dark" ? "rgba(255,255,255,0.02)" : "#ffffff",
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
    height: "100%",
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1.5),
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chartSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 500,
  },
}));

const STATUS_COLORS = {
  open: "#3b82f6",
  pending: "#f59e0b",
  closed: "#10b981",
  group: "#8b5cf6",
};
const STATUS_LABELS = {
  open: "Aberto",
  pending: "Pendente",
  closed: "Fechado",
  group: "Grupo",
};
const PIE_PALETTE = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#22c55e"];

const KpiCard = ({ icon, iconBg, iconColor, label, value, help }) => {
  const classes = useStyles();
  return (
    <Paper className={classes.kpiCard} elevation={0}>
      <Box className={classes.kpiIcon} style={{ background: iconBg, color: iconColor }}>
        {icon}
      </Box>
      <Box style={{ minWidth: 0, flex: 1 }}>
        <Typography className={classes.kpiLabel}>{label}</Typography>
        <Typography className={classes.kpiValue}>{value}</Typography>
        {help && <Typography className={classes.kpiHelp}>{help}</Typography>}
      </Box>
    </Paper>
  );
};

const ReportsDashboard = ({ tickets = [] }) => {
  const classes = useStyles();

  const stats = useMemo(() => {
    const total = tickets.length;
    let closed = 0;
    let open = 0;
    let pending = 0;
    let totalRating = 0;
    let ratingCount = 0;
    let totalDurationMs = 0;
    let durationCount = 0;
    let totalSaleValue = 0;
    let saleCount = 0;

    const byUser = new Map();
    const byQueue = new Map();
    const byChannel = new Map();
    const byDay = new Map();
    const statusCounts = { open: 0, pending: 0, closed: 0, group: 0 };

    for (const t of tickets) {
      const status = (t.status || "").toLowerCase();
      if (status === "closed") closed++;
      else if (status === "open") open++;
      else if (status === "pending") pending++;
      if (statusCounts[status] !== undefined) statusCounts[status]++;

      // rating
      const r = Number(t?.userRating ?? t?.rate ?? t?.NPS ?? 0);
      if (!Number.isNaN(r) && r > 0) {
        totalRating += r;
        ratingCount++;
      }

      // duration (createdAt -> updatedAt when closed)
      if (status === "closed" && t.createdAt && t.updatedAt) {
        const d = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
        if (d > 0 && d < 1000 * 60 * 60 * 24 * 30) {
          totalDurationMs += d;
          durationCount++;
        }
      }

      // sale value
      const sale = Number(t?.value ?? t?.saleValue ?? 0);
      if (sale > 0) {
        totalSaleValue += sale;
        saleCount++;
      }

      // by user
      const userName = t?.user?.name || "Sem responsável";
      byUser.set(userName, (byUser.get(userName) || 0) + 1);

      // by queue
      const queueName = t?.queue?.name || "Sem fila";
      byQueue.set(queueName, (byQueue.get(queueName) || 0) + 1);

      // by channel
      const channel = t?.channel || t?.whatsapp?.name || "WhatsApp";
      byChannel.set(channel, (byChannel.get(channel) || 0) + 1);

      // by day
      if (t.createdAt) {
        const day = new Date(t.createdAt).toISOString().slice(0, 10);
        byDay.set(day, (byDay.get(day) || 0) + 1);
      }
    }

    const avgDurationMin = durationCount > 0 ? Math.round(totalDurationMs / durationCount / 60000) : 0;
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "—";

    const usersData = Array.from(byUser.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const queueData = Array.from(byQueue.entries()).map(([name, value]) => ({ name, value }));
    const channelData = Array.from(byChannel.entries()).map(([name, value]) => ({ name, value }));
    const statusData = Object.entries(statusCounts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({ name: STATUS_LABELS[key] || key, key, value }));

    const dayData = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({
        date: date.slice(5).replace("-", "/"),
        atendimentos: value,
      }));

    return {
      total,
      open,
      pending,
      closed,
      avgRating,
      avgDurationMin,
      totalSaleValue,
      saleCount,
      usersData,
      queueData,
      channelData,
      statusData,
      dayData,
    };
  }, [tickets]);

  const formatMin = (mins) => {
    if (!mins) return "—";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className={classes.wrapper}>
      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <KpiCard
            icon={<Inbox />}
            iconBg="#dbeafe"
            iconColor="#1d4ed8"
            label="Total de tickets"
            value={stats.total}
            help="No filtro atual"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <KpiCard
            icon={<CheckCircleOutline />}
            iconBg="#d1fae5"
            iconColor="#047857"
            label="Finalizados"
            value={stats.closed}
            help={stats.total ? `${Math.round((stats.closed / stats.total) * 100)}% do total` : "—"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <KpiCard
            icon={<HourglassEmpty />}
            iconBg="#fef3c7"
            iconColor="#b45309"
            label="Em aberto"
            value={stats.open + stats.pending}
            help={`${stats.open} abertos · ${stats.pending} pendentes`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <KpiCard
            icon={<AccessTime />}
            iconBg="#ede9fe"
            iconColor="#6d28d9"
            label="Tempo médio"
            value={formatMin(stats.avgDurationMin)}
            help="Atendimento (fechados)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <KpiCard
            icon={<Star />}
            iconBg="#fef3c7"
            iconColor="#d97706"
            label="Avaliação média"
            value={stats.avgRating}
            help="NPS / Rating"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <KpiCard
            icon={<AttachMoney />}
            iconBg="#dcfce7"
            iconColor="#15803d"
            label="Vendas (R$)"
            value={formatBRL(stats.totalSaleValue)}
            help={`${stats.saleCount} venda(s)`}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} style={{ marginTop: 4 }}>
        {/* Line: tickets per day */}
        <Grid item xs={12} md={8}>
          <Paper className={classes.chartCard} elevation={0}>
            <Typography className={classes.chartTitle}>Atendimentos por dia</Typography>
            <Typography className={classes.chartSubtitle}>
              Volume diário de tickets criados no período
            </Typography>
            <Box style={{ width: "100%", height: 260, marginTop: 8 }}>
              <ResponsiveContainer>
                <LineChart data={stats.dayData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="atendimentos"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#10b981" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Pie: status */}
        <Grid item xs={12} md={4}>
          <Paper className={classes.chartCard} elevation={0}>
            <Typography className={classes.chartTitle}>Distribuição por status</Typography>
            <Typography className={classes.chartSubtitle}>Composição dos tickets</Typography>
            <Box style={{ width: "100%", height: 260, marginTop: 8 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {stats.statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Bar: by user */}
        <Grid item xs={12} md={7}>
          <Paper className={classes.chartCard} elevation={0}>
            <Typography className={classes.chartTitle}>Top atendentes</Typography>
            <Typography className={classes.chartSubtitle}>Tickets atribuídos por usuário</Typography>
            <Box style={{ width: "100%", height: 280, marginTop: 8 }}>
              <ResponsiveContainer>
                <BarChart
                  data={stats.usersData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                    width={120}
                  />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Donut: by queue */}
        <Grid item xs={12} md={5}>
          <Paper className={classes.chartCard} elevation={0}>
            <Typography className={classes.chartTitle}>Por fila</Typography>
            <Typography className={classes.chartSubtitle}>Distribuição por fila de atendimento</Typography>
            <Box style={{ width: "100%", height: 280, marginTop: 8 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.queueData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {stats.queueData.map((_, i) => (
                      <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default ReportsDashboard;
