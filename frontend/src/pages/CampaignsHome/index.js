import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Send,
  CheckCircle2,
  Users,
  Smartphone,
  TrendingUp,
  Plus,
  Flame,
  Code2,
  Webhook,
  RefreshCcw,
} from "lucide-react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
} from "@material-ui/core";
import api from "../../services/api";

const PALETTES = {
  emerald: { bg: "#ecfdf5", text: "#059669", bar: "#34d399" },
  amber: { bg: "#fffbeb", text: "#d97706", bar: "#fbbf24" },
  sky: { bg: "#f0f9ff", text: "#0284c7", bar: "#38bdf8" },
  violet: { bg: "#f5f3ff", text: "#7c3aed", bar: "#a78bfa" },
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
    padding: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      gap: theme.spacing(2),
      padding: theme.spacing(2),
    },
  },
  card: {
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius * 2,
    border: "1px solid #e2e8f0",
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    transition: "box-shadow .2s",
    "&:hover": { boxShadow: "0 6px 18px rgba(0,0,0,0.06)" },
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(2),
    },
  },
  welcome: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius * 2,
    background: "#fff",
    border: "1px solid #e2e8f0",
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      alignItems: "stretch",
      padding: theme.spacing(2),
    },
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#d1fae5",
    color: "#059669",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  welcomeTitle: {
    fontWeight: 700,
    color: "#1e293b",
    fontSize: "1.125rem",
    lineHeight: 1.3,
    [theme.breakpoints.down("xs")]: {
      fontSize: "1rem",
    },
  },
  welcomeSubtitle: {
    color: "#64748b",
    fontSize: "0.8125rem",
    marginTop: theme.spacing(0.5),
  },
  primaryBtn: {
    background: "#10b981",
    color: "#fff",
    fontWeight: 600,
    textTransform: "none",
    borderRadius: 12,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
    "&:hover": { background: "#059669" },
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  statHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing(1),
  },
  statLabel: {
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
    lineHeight: 1.4,
  },
  statValue: {
    marginTop: theme.spacing(1),
    fontSize: "1.75rem",
    fontWeight: 700,
    lineHeight: 1.15,
    [theme.breakpoints.down("sm")]: {
      fontSize: "1.5rem",
    },
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bars: {
    marginTop: theme.spacing(2),
    display: "flex",
    alignItems: "flex-end",
    gap: 4,
    height: 40,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 2,
  },
  sectionLabel: {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: theme.spacing(1.5),
  },
  quick: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    fontFamily: "inherit",
    transition: "all .15s",
    "&:hover": {
      borderColor: "#6ee7b7",
      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    },
    "&:focus-visible": {
      outline: "2px solid #10b981",
      outlineOffset: 2,
    },
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  quickLabel: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#1e293b",
    lineHeight: 1.3,
  },
  quickHint: {
    fontSize: "0.6875rem",
    color: "#94a3b8",
    marginTop: 2,
  },
  panelTitle: {
    fontWeight: 700,
    color: "#1e293b",
    fontSize: "0.9375rem",
  },
  panelCaption: {
    color: "#94a3b8",
    fontSize: "0.75rem",
  },
  chartHost: {
    marginTop: theme.spacing(3),
    display: "flex",
    alignItems: "flex-end",
    gap: theme.spacing(1),
    height: 192,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    [theme.breakpoints.down("xs")]: {
      height: 150,
      gap: theme.spacing(0.5),
    },
  },
  chartBar: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    background: "linear-gradient(to top, #34d399, #6ee7b7)",
  },
  chartEmpty: {
    marginTop: theme.spacing(3),
    height: 192,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px dashed #e2e8f0",
    borderRadius: 12,
    color: "#94a3b8",
    fontSize: "0.8125rem",
    textAlign: "center",
    padding: theme.spacing(2),
  },
}));

const StatCard = ({ icon: Icon, label, value, accent = "emerald", trend = [] }) => {
  const classes = useStyles();
  const palette = PALETTES[accent];
  const bars = trend.length ? trend : [40, 65, 50, 80, 60, 90, 70];

  return (
    <Paper className={classes.card} elevation={0}>
      <div className={classes.statHeader}>
        <div>
          <div className={classes.statLabel}>{label}</div>
          <div className={classes.statValue} style={{ color: palette.text }}>
            {value}
          </div>
        </div>
        <div
          className={classes.statIcon}
          style={{ background: palette.bg, color: palette.text }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div className={classes.bars}>
        {bars.map((h, i) => (
          <div
            key={i}
            className={classes.bar}
            style={{
              height: `${Math.max(h, 4)}%`,
              background: palette.bar,
              opacity: 0.4 + (i % 4) * 0.15,
            }}
          />
        ))}
      </div>
    </Paper>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, accent = "emerald" }) => {
  const classes = useStyles();
  const palette = PALETTES[accent];
  return (
    <button onClick={onClick} className={classes.quick} type="button">
      <div
        className={classes.quickIcon}
        style={{ background: palette.bg, color: palette.text }}
      >
        <Icon size={18} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className={classes.quickLabel}>{label}</div>
        <div className={classes.quickHint}>Acessar →</div>
      </div>
    </button>
  );
};

const CampaignsHome = () => {
  const classes = useStyles();
  const history = useHistory();
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    sentMessages: 0,
    deliveryRate: 0,
    contacts: 0,
    totalCampaigns: 0,
    totalMessages: 0,
    series: [],
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/campaigns/dashboard-stats", {
        params: { days: 7 },
      });
      setStats({
        activeCampaigns: data.activeCampaigns || 0,
        sentMessages: data.sentMessages || 0,
        deliveryRate: data.deliveryRate || 0,
        contacts: data.uniqueContacts || 0,
        totalCampaigns: data.totalCampaigns || 0,
        totalMessages: data.totalMessages || 0,
        series: Array.isArray(data.series) ? data.series : [],
      });
      setLastUpdate(new Date(data.generatedAt || Date.now()));
    } catch (e) {
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatted = (lastUpdate || new Date()).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sparkline = (() => {
    const days = 7;
    const today = new Date();
    const map = new Map((stats.series || []).map((p) => [p.date, p.sent]));
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push(map.get(key) || 0);
    }
    const max = Math.max(...arr, 1);
    return arr.map((v) => Math.round((v / max) * 100));
  })();

  return (
    <div className={classes.root}>
      {/* Welcome */}
      <Paper className={classes.welcome} elevation={0}>
        <Box display="flex" alignItems="flex-start" style={{ gap: 16 }}>
          <div className={classes.welcomeIcon}>
            <TrendingUp size={22} />
          </div>
          <div>
            <Typography variant="h6" style={{ fontWeight: 700, color: "#1e293b" }}>
              Bem-vindo de volta!
            </Typography>
            <Typography variant="body2" style={{ color: "#64748b" }}>
              Última atualização: {formatted}
              {loading && (
                <span style={{ marginLeft: 8, color: "#059669" }}>• atualizando...</span>
              )}
            </Typography>
          </div>
        </Box>
        <Button
          onClick={fetchStats}
          disabled={loading}
          className={classes.primaryBtn}
          startIcon={
            loading ? (
              <CircularProgress size={14} style={{ color: "#fff" }} />
            ) : (
              <RefreshCcw size={14} />
            )
          }
        >
          Atualizar
        </Button>
      </Paper>

      {/* Stat cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard icon={Send} label="Campanhas Ativas" value={stats.activeCampaigns} accent="emerald" trend={sparkline} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard icon={CheckCircle2} label="Mensagens Enviadas" value={stats.sentMessages.toLocaleString("pt-BR")} accent="amber" trend={sparkline} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard icon={TrendingUp} label="Taxa de Entrega" value={`${stats.deliveryRate}%`} accent="sky" trend={sparkline} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard icon={Users} label="Contatos Únicos" value={stats.contacts.toLocaleString("pt-BR")} accent="violet" trend={sparkline} />
        </Grid>
      </Grid>

      {/* Quick actions */}
      <div>
        <div className={classes.sectionLabel}>Ações Rápidas</div>
        <Grid container spacing={2}>
          <Grid item xs={6} lg={3}>
            <QuickAction icon={Plus} label="Nova Campanha" onClick={() => history.push("/campaigns")} accent="emerald" />
          </Grid>
          <Grid item xs={6} lg={3}>
            <QuickAction icon={Flame} label="Aquecer Chip" onClick={() => history.push("/whatsapp-warmer")} accent="amber" />
          </Grid>
          <Grid item xs={6} lg={3}>
            <QuickAction icon={Code2} label="Documentação API" onClick={() => history.push("/messages-api")} accent="sky" />
          </Grid>
          <Grid item xs={6} lg={3}>
            <QuickAction icon={Webhook} label="Conexões WhatsApp" onClick={() => history.push("/connections")} accent="violet" />
          </Grid>
        </Grid>
      </div>

      {/* Atividade real */}
      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Paper className={classes.card} elevation={0} style={{ padding: 24 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography style={{ fontWeight: 700, color: "#1e293b" }}>
                Atividade de Envios
              </Typography>
              <Typography variant="caption" style={{ color: "#94a3b8" }}>
                Últimos 7 dias
              </Typography>
            </Box>
            {sparkline.some((v) => v > 0) ? (
              <div className={classes.chartHost}>
                {sparkline.map((h, i) => {
                  const day = new Date();
                  day.setDate(day.getDate() - (6 - i));
                  const label = day.toLocaleDateString("pt-BR", { weekday: "short" });
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                      <div
                        className={classes.chartBar}
                        style={{ height: `${Math.max(h, 4)}%` }}
                        title={label}
                      />
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={classes.chartEmpty}>
                Sem dados ainda — crie sua primeira campanha
              </div>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper className={classes.card} elevation={0} style={{ padding: 24 }}>
            <Typography style={{ fontWeight: 700, color: "#1e293b" }}>
              Conexões WhatsApp
            </Typography>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={4}
              style={{ gap: 8, textAlign: "center" }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#d1fae5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Smartphone size={20} />
              </div>
              <Typography style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Tudo certo!
              </Typography>
              <Typography style={{ fontSize: 11, color: "#94a3b8" }}>
                Gerencie seus chips em Conexões
              </Typography>
              <Button
                onClick={() => history.push("/connections")}
                className={classes.primaryBtn}
                size="small"
                style={{ marginTop: 8 }}
              >
                Abrir Conexões
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default CampaignsHome;
