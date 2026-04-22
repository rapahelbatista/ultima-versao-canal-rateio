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
import api from "../../services/api";

/**
 * Dashboard inicial do modo CAMPAIGN_ONLY.
 * Mostra cards de visão geral + atalhos rápidos. Visual estilo whatsCRM.
 */

const StatCard = ({ icon: Icon, label, value, accent = "emerald", trend = [] }) => {
  const palette = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-400" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-400" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", bar: "bg-sky-400" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", bar: "bg-violet-400" },
  }[accent];

  const bars = trend.length ? trend : [40, 65, 50, 80, 60, 90, 70];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className={`mt-2 text-3xl font-bold ${palette.text}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette.bg} ${palette.text}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 flex items-end gap-1 h-10">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${palette.bar} opacity-${30 + (i % 4) * 15}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, color = "emerald" }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-emerald-300 hover:shadow-md transition-all"
  >
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${color}-50 text-${color}-600`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500">Acessar →</p>
    </div>
  </button>
);

const CampaignsHome = () => {
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
      // mantém zeros — a home não deve quebrar
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // auto-refresh 1 min
    return () => clearInterval(interval);
  }, []);

  const formatted = (lastUpdate || new Date()).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Sparkline normalizado (últimos 7 dias) — preenche com 0 onde não houver dado
  const sparkline = (() => {
    const days = 7;
    const today = new Date();
    const map = new Map((stats.series || []).map(p => [p.date, p.sent]));
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push(map.get(key) || 0);
    }
    const max = Math.max(...arr, 1);
    return arr.map(v => Math.round((v / max) * 100));
  })();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Bem-vindo de volta!
            </h1>
            <p className="text-sm text-slate-500">
              Última atualização: {formatted}
              {loading && <span className="ml-2 text-emerald-600">• atualizando...</span>}
            </p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600 disabled:opacity-50"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Send} label="Campanhas Ativas" value={stats.activeCampaigns} accent="emerald" trend={sparkline} />
        <StatCard icon={CheckCircle2} label="Mensagens Enviadas" value={stats.sentMessages.toLocaleString("pt-BR")} accent="amber" trend={sparkline} />
        <StatCard icon={TrendingUp} label="Taxa de Entrega" value={`${stats.deliveryRate}%`} accent="sky" trend={sparkline} />
        <StatCard icon={Users} label="Contatos Únicos" value={stats.contacts.toLocaleString("pt-BR")} accent="violet" trend={sparkline} />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction icon={Plus} label="Nova Campanha" onClick={() => history.push("/campaigns")} color="emerald" />
          <QuickAction icon={Flame} label="Aquecer Chip" onClick={() => history.push("/whatsapp-warmer")} color="amber" />
          <QuickAction icon={Code2} label="Gerar API Key" onClick={() => history.push("/api-keys")} color="sky" />
          <QuickAction icon={Webhook} label="Configurar Webhook" onClick={() => history.push("/webhooks")} color="violet" />
        </div>
      </div>

      {/* Atividade real */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Atividade de Envios</h3>
            <span className="text-xs text-slate-400">Últimos 7 dias</span>
          </div>
          {sparkline.some(v => v > 0) ? (
            <div className="mt-6 flex items-end gap-2 h-48 px-2">
              {sparkline.map((h, i) => {
                const day = new Date();
                day.setDate(day.getDate() - (6 - i));
                const label = day.toLocaleDateString("pt-BR", { weekday: "short" });
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-emerald-400 to-emerald-300 transition-all"
                      style={{ height: `${Math.max(h, 4)}%` }}
                      title={`${label}`}
                    />
                    <span className="text-[10px] text-slate-400">{label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">
              Sem dados ainda — crie sua primeira campanha
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-800">Conexões WhatsApp</h3>
          <div className="mt-4 flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Smartphone size={20} />
            </div>
            <p className="text-sm font-semibold text-slate-700">Tudo certo!</p>
            <p className="text-xs text-slate-400">Gerencie seus chips em Conexões</p>
            <button
              onClick={() => history.push("/connections")}
              className="mt-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              Abrir Conexões
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignsHome;
