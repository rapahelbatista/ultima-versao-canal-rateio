import React, { useContext, useState, useMemo } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { AuthContext } from "../context/Auth/AuthContext";
import { makeStyles } from "@material-ui/core/styles";
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Badge,
  Divider,
  Tooltip,
  InputBase,
  Box,
} from "@material-ui/core";
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
  ChevronLeft,
  ChevronRight,
  Layers,
  BarChart3,
  Facebook,
  FileText,
  Workflow,
  Bot,
  Megaphone,
  QrCode,
  Lock,
} from "lucide-react";
import useCanManageMeta from "../hooks/useCanManageMeta";

const drawerWidth = 260;
const collapsedWidth = 72;

const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "WhatsApp QR Plugin",
    items: [
      { to: "/connections", label: "Adicionar WhatsApp por QR", icon: QrCode },
      { to: "/whatsapp-warmer", label: "Aquecedor de WhatsApp", icon: Flame },
      { to: "/messages-api", label: "Rest API", icon: Code2 },
    ],
  },
  {
    label: "Conexão WA Meta",
    items: [
      { to: "/meta-api-keys", label: "Vincular Meta WhatsApp", icon: Facebook },
    ],
  },
  {
    label: "Automação e Bots",
    items: [
      { to: "/flowbuilders", label: "Fluxos de Automação", icon: Workflow },
      { to: "/chatbot-wa", label: "Chatbot de WA", icon: Bot },
    ],
  },
  {
    label: "Transmissão",
    items: [
      { to: "/create-meta-template", label: "Create Meta Template", icon: FileText },
      { to: "/campaigns", label: "Nova Campanha", icon: Send },
      { to: "/campaigns-config", label: "Listas & Config", icon: ListChecks },
      { to: "/contact-lists", label: "Phonebook", icon: Users },
      { to: "/campaigns-kanban", label: "Kanban de Campanha", icon: KanbanSquare },
    ],
  },
  {
    label: "Relatórios",
    items: [{ to: "/reports", label: "Relatórios", icon: BarChart3 }],
  },
];

const ADMIN_ITEMS = [
  { to: "/users", label: "Usuários", icon: Users },
  { to: "/settings", label: "Configurações", icon: Settings },
];

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#f8fafc",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerCollapsed: {
    width: collapsedWidth,
  },
  drawerPaper: {
    width: drawerWidth,
    overflowX: "hidden",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperCollapsed: {
    width: collapsedWidth,
  },
  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "18px 16px",
    borderBottom: "1px solid #f1f5f9",
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: "linear-gradient(135deg, #34d399, #059669)",
    color: "#fff",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
    fontSize: 13,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
    lineHeight: 1.1,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#059669",
  },
  collapseBtn: {
    marginLeft: "auto",
    padding: 6,
    color: "#94a3b8",
  },
  searchBox: {
    margin: "12px 12px 0",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
    borderRadius: 12,
    color: "#94a3b8",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
  },
  nav: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 12px",
  },
  groupLabel: {
    padding: "8px 12px 4px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 500,
    color: "#475569",
    textDecoration: "none",
    transition: "all .15s",
    marginBottom: 2,
    "&:hover": {
      backgroundColor: "#f8fafc",
      color: "#047857",
    },
  },
  navItemActive: {
    backgroundColor: "#ecfdf5",
    color: "#047857",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    color: "#64748b",
    flexShrink: 0,
  },
  navIconActive: {
    background: "#10b981",
    color: "#fff",
    boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
  },
  versionBox: {
    padding: "12px 16px",
    borderTop: "1px solid #f1f5f9",
    fontSize: 11,
    color: "#94a3b8",
  },
  versionTag: {
    marginLeft: 6,
    background: "#d1fae5",
    color: "#047857",
    padding: "2px 6px",
    borderRadius: 4,
    fontWeight: 700,
    fontSize: 10,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topbar: {
    background: "#fff",
    color: "#334155",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "none",
  },
  topbarToolbar: {
    display: "flex",
    justifyContent: "space-between",
    minHeight: 60,
  },
  crumb: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#64748b",
    fontSize: 13,
  },
  crumbActive: {
    color: "#1e293b",
    fontWeight: 600,
  },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 8,
    color: "#64748b",
    "&:hover": { background: "#f8fafc" },
  },
  langBtn: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 500,
    color: "#475569",
    background: "transparent",
    cursor: "pointer",
    "&:hover": { background: "#f8fafc" },
  },
  avatar: {
    width: 36,
    height: 36,
    background: "linear-gradient(135deg, #34d399, #059669)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    border: "2px solid #d1fae5",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    background: "#f8fafc",
    padding: 24,
  },
}));

const CampaignLayout = ({ children }) => {
  const classes = useStyles();
  const { user, handleLogout } = useContext(AuthContext);
  const location = useLocation();
  const history = useHistory();
  const [collapsed, setCollapsed] = useState(false);

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

  const renderItem = (item) => {
    const Icon = item.icon;
    const active = isActive(item);
    const node = (
      <Link
        to={item.to}
        className={`${classes.navItem} ${active ? classes.navItemActive : ""}`}
        style={collapsed ? { justifyContent: "center" } : undefined}
      >
        <span className={`${classes.navIcon} ${active ? classes.navIconActive : ""}`}>
          <Icon size={16} />
        </span>
        {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
      </Link>
    );
    return collapsed ? (
      <Tooltip title={item.label} placement="right" key={item.to}>
        <div>{node}</div>
      </Tooltip>
    ) : (
      <div key={item.to}>{node}</div>
    );
  };

  const currentLabel =
    NAV_GROUPS.flatMap((g) => g.items).find((i) => isActive(i))?.label || "Dashboard";

  return (
    <div className={classes.root}>
      <Drawer
        variant="permanent"
        className={`${classes.drawer} ${collapsed ? classes.drawerCollapsed : ""}`}
        classes={{
          paper: `${classes.drawerPaper} ${collapsed ? classes.drawerPaperCollapsed : ""}`,
        }}
      >
        <div className={classes.logoBox}>
          <div className={classes.logoIcon}>EC</div>
          {!collapsed && (
            <div>
              <div className={classes.brandTitle}>EquipeChat</div>
              <div className={classes.brandSub}>Campaigns</div>
            </div>
          )}
          <IconButton
            size="small"
            className={classes.collapseBtn}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </IconButton>
        </div>

        {!collapsed && (
          <div className={classes.searchBox}>
            <Search size={14} />
            <InputBase placeholder="Buscar menu..." className={classes.searchInput} />
          </div>
        )}

        <nav className={classes.nav}>
          {NAV_GROUPS.map((group, gi) => (
            <Box key={gi} mb={2}>
              {!collapsed && group.label && (
                <div className={classes.groupLabel}>{group.label}</div>
              )}
              {group.items.map(renderItem)}
            </Box>
          ))}

          {user?.profile === "admin" && (
            <Box mb={2}>
              {!collapsed && <div className={classes.groupLabel}>Admin</div>}
              {ADMIN_ITEMS.map(renderItem)}
            </Box>
          )}
        </nav>

        {!collapsed && (
          <div className={classes.versionBox}>
            EquipeChat Campaigns
            <span className={classes.versionTag}>v6.0</span>
          </div>
        )}
      </Drawer>

      <div className={classes.main}>
        <AppBar position="static" className={classes.topbar} elevation={0}>
          <Toolbar className={classes.topbarToolbar}>
            <div className={classes.crumb}>
              <LayoutDashboard size={14} />
              <span className={classes.crumbActive}>{currentLabel}</span>
            </div>

            <div className={classes.topActions}>
              <button className={classes.langBtn}>🇧🇷 Português</button>
              <Tooltip title="Notificações">
                <IconButton className={classes.iconBtn} size="small">
                  <Badge badgeContent={0} color="primary">
                    <Bell size={15} />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Avatar className={classes.avatar}>{initials}</Avatar>
              <Tooltip title="Sair">
                <IconButton
                  className={classes.iconBtn}
                  size="small"
                  onClick={() => {
                    handleLogout && handleLogout();
                    history.push("/login");
                  }}
                >
                  <LogOut size={15} />
                </IconButton>
              </Tooltip>
            </div>
          </Toolbar>
        </AppBar>

        <main className={classes.content}>{children}</main>
      </div>
    </div>
  );
};

export default CampaignLayout;
