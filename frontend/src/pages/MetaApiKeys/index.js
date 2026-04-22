import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  IconButton,
  InputBase,
  TextField,
  Tooltip,
} from "@material-ui/core";
import {
  Facebook,
  Search,
  Save,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import SectionCard from "../../components/SectionCard";

const useStyles = makeStyles((theme) => ({
  root: { display: "flex", flexDirection: "column", gap: theme.spacing(2) },
  tabs: {
    display: "flex",
    gap: theme.spacing(1),
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 6,
    width: "fit-content",
  },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "none",
    background: "transparent",
    padding: "8px 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer",
    "&:hover": { background: "#f8fafc" },
  },
  tabActive: {
    background: "#10b981",
    color: "#fff",
    boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
    "&:hover": { background: "#10b981" },
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: "#475569" },
  fieldHint: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  webhookBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    fontFamily: "monospace",
    fontSize: 12,
    color: "#475569",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  saveBar: {
    display: "flex",
    gap: 8,
    marginTop: theme.spacing(2),
  },
  saveBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: 700,
    textTransform: "none",
    borderRadius: 10,
    padding: "12px",
    boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
    "&:hover": { background: "linear-gradient(135deg, #059669, #047857)" },
  },
  searchBtn: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "8px 16px",
    fontWeight: 600,
    textTransform: "none",
    color: "#475569",
  },
}));

const MetaApiKeys = () => {
  const classes = useStyles();
  const [tab, setTab] = useState("manual");
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${window.location.origin}/api/inbox/webhook/${Math.random()
    .toString(36)
    .slice(2, 18)}`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook copiado!");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={classes.root}>
      <PageHeader
        icon={<Facebook size={22} />}
        title="Chaves de API da Meta"
        subtitle="Conecte sua conta do WhatsApp Business."
      />

      <div className={classes.tabs}>
        <button
          className={`${classes.tab} ${tab === "embed" ? classes.tabActive : ""}`}
          onClick={() => setTab("embed")}
        >
          <Facebook size={14} />
          Login Incorporado
        </button>
        <button
          className={`${classes.tab} ${tab === "manual" ? classes.tabActive : ""}`}
          onClick={() => setTab("manual")}
        >
          <Save size={14} />
          Configuração Manual
        </button>
      </div>

      {tab === "manual" && (
        <SectionCard>
          <div className={classes.field} style={{ marginBottom: 16 }}>
            <span className={classes.fieldLabel}>🔗 Sua URL de Webhook</span>
            <div className={classes.webhookBar}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                {webhookUrl}
              </span>
              <Tooltip title={copied ? "Copiado!" : "Copiar"}>
                <IconButton size="small" onClick={copyWebhook}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <TextField
              label="ID da Conta do WhatsApp Business"
              variant="outlined"
              size="small"
              fullWidth
              placeholder="XXXXXXXXXXXXXXXXXXXXXXX"
            />
            <div>
              <TextField
                label="Token de Acesso da Meta"
                variant="outlined"
                size="small"
                fullWidth
                placeholder="XXXXXXXXXXXXXXXXXXXXXXX"
              />
              <div className={classes.fieldHint}>Token permanente recomendado</div>
            </div>
            <TextField
              label="ID do Número de Telefone Comercial"
              variant="outlined"
              size="small"
              fullWidth
              placeholder="XXXXXXXXXXXXXXXXXXXXXXX"
            />
            <TextField
              label="ID do App"
              variant="outlined"
              size="small"
              fullWidth
              placeholder="XXXXXXXXXXXXXXXXXXXXXXX"
            />
          </div>

          <div className={classes.saveBar}>
            <Button
              className={classes.saveBtn}
              startIcon={<Save size={16} />}
              onClick={() => toast.success("Configuração salva!")}
            >
              Salvar
            </Button>
            <Button
              className={classes.searchBtn}
              startIcon={<Search size={16} />}
            >
              Buscar
            </Button>
          </div>
        </SectionCard>
      )}

      {tab === "embed" && (
        <SectionCard
          icon={<Facebook size={18} />}
          title="Login com Facebook"
          subtitle="Conecte sua conta Business diretamente para configurar tudo automaticamente."
        >
          <div style={{ textAlign: "center", padding: 24 }}>
            <Button
              variant="contained"
              style={{
                background: "#1877F2",
                color: "#fff",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 10,
                padding: "12px 24px",
              }}
              startIcon={<Facebook size={16} />}
            >
              Continuar com Facebook
            </Button>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

const MetaApiKeysGuarded = (props) => {
  // eslint-disable-next-line global-require
  const useCanManageMeta = require("../../hooks/useCanManageMeta").default;
  // eslint-disable-next-line global-require
  const LockedPage = require("../../components/LockedPage").default;
  const { allowed } = useCanManageMeta();
  if (!allowed) {
    return (
      <LockedPage
        title="Vincular Meta WhatsApp bloqueado"
        description="As chaves de API da Meta são sensíveis. Apenas super usuários ou administradores podem visualizar e gerenciar."
        resource="Meta API Keys"
      />
    );
  }
  return <MetaApiKeys {...props} />;
};

export default MetaApiKeysGuarded;
