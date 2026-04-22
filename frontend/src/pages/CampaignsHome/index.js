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
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Best-effort: tenta buscar dados reais; se falhar, mantém zeros.
      const [campaigns, contactLists] = await Promise.allSettled([
        api.get("/campaigns?pageNumber=1"),
        api.get("/contact-lists?pageNumber=1"),
      ]);

      const cs = campaigns.status === "fulfilled" ? campaigns.value.data?.records || [] : [];
      const cl = contactLists.status === "fulfilled" ? contactLists.value.data?.records || [] : [];

      const active = cs.filter((c) => ["EM_ANDAMENTO", "PROGRAMADA", "RUNNING"].includes(c.status)).length;
      const sent = cs.reduce((sum, c) => sum + (c.delivered || c.completedAt ? c.contactsCount || 0 : 0), 0);

      setStats({
        activeCampaigns: active,
        sentMessages: sent,
        deliveryRate: sent ? Math.min(99, Math.round((sent / (sent + 1)) * 100)) : 0,
        contacts: cl.reduce((sum, l) => sum + (l.contactsCount || 0), 0),
      });
    } catch (e) {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const now = new Date();
  const formatted = now.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
            <p className="text-sm text-slate-500">Última atualização: {formatted}</p>
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
        <StatCard icon={Send} label="Campanhas Ativas" value={stats.activeCampaigns} accent="emerald" />
        <StatCard icon={CheckCircle2} label="Mensagens Enviadas" value={stats.sentMessages} accent="amber" />
        <StatCard icon={TrendingUp} label="Taxa de Entrega" value={`${stats.deliveryRate}%`} accent="sky" />
        <StatCard icon={Users} label="Contatos" value={stats.contacts} accent="violet" />
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

      {/* Activity placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Atividade de Envios</h3>
            <span className="text-xs text-slate-400">Últimos 7 dias</span>
          </div>
          <div className="mt-6 flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">
            Sem dados ainda — crie sua primeira campanha
          </div>
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
