import React, { useContext, useState, useMemo } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { AuthContext } from "../context/Auth/AuthContext";
import {
  LayoutDashboard,
  Send,
  ListChecks,
  Users,
  Flame,
  Smartphone,
  Code2,
  Webhook,
  KanbanSquare,
  Settings,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Layers,
  BarChart3,
} from "lucide-react";

/**
 * CampaignLayout
 * Layout claro/verde inspirado no whatsCRM, ativo quando CAMPAIGN_ONLY_MODE=true.
 * Mantém apenas itens relacionados a campanhas, APIs, warmup e kanban opcional.
 */

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Campanhas",
    items: [
      { to: "/campaigns", label: "Nova Campanha", icon: Send },
      { to: "/campaigns-config", label: "Listas & Config", icon: ListChecks },
      { to: "/contact-lists", label: "Phonebook", icon: Users },
      { to: "/campaigns-kanban", label: "Kanban de Campanha", icon: KanbanSquare },
    ],
  },
  {
    label: "Anti-ban & Warmup",
    items: [
      { to: "/whatsapp-warmer", label: "WhatsApp Warmer", icon: Flame },
      { to: "/connections", label: "Conexões WA", icon: Smartphone },
    ],
  },
  {
    label: "APIs & Integrações",
    items: [
      { to: "/api-keys", label: "API Keys", icon: Code2 },
      { to: "/webhooks", label: "Webhooks", icon: Webhook },
      { to: "/messages-api", label: "Documentação API", icon: Layers },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { to: "/reports", label: "Relatórios", icon: BarChart3 },
    ],
  },
];

const ADMIN_ITEMS = [
  { to: "/users", label: "Usuários", icon: Users },
  { to: "/settings", label: "Configurações", icon: Settings },
];

const CampaignLayout = ({ children }) => {
  const { user, handleLogout } = useContext(AuthContext);
  const location = useLocation();
  const history = useHistory();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);

  const initials = useMemo(() => {
    const name = user?.name || "U";
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user]);

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  const SidebarItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <Link
        to={item.to}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
          ${active
            ? "bg-emerald-50 text-emerald-700 shadow-sm"
            : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"}
        `}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all
          ${active ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"}
        `}
        >
          <Icon size={16} />
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${dark ? "bg-slate-900" : "bg-slate-50"}`}>
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col border-r border-slate-200 bg-white transition-all duration-300
          ${collapsed ? "w-[72px]" : "w-[260px]"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold shadow-md shadow-emerald-500/30">
            EC
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-800">EquipeChat</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                Campaigns
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-400 border border-slate-100">
              <Search size={14} />
              <input
                placeholder="Buscar menu..."
                className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {!collapsed && group.label && (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((it) => (
                  <SidebarItem key={it.to} item={it} />
                ))}
              </div>
            </div>
          ))}

          {user?.profile === "admin" && (
            <div>
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Admin
                </p>
              )}
              <div className="space-y-1">
                {ADMIN_ITEMS.map((it) => (
                  <SidebarItem key={it.to} item={it} />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Versão */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400">
            EquipeChat Campaigns <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700 font-semibold">v6.0</span>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <LayoutDashboard size={14} />
            <span className="text-slate-700 font-medium">
              {NAV_GROUPS.flatMap((g) => g.items).find((i) => isActive(i))?.label || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              🇧🇷 Português
            </button>
            <button
              onClick={() => setDark((v) => !v)}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              title="Tema"
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="relative rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
              <Bell size={15} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                0
              </span>
            </button>
            <div className="ml-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white ring-2 ring-emerald-100">
                {initials}
              </div>
              <button
                onClick={() => {
                  handleLogout && handleLogout();
                  history.push("/login");
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-rose-500"
                title="Sair"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
};

export default CampaignLayout;
