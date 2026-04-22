import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  IconButton,
  InputBase,
  Tooltip,
  Chip,
} from "@material-ui/core";
import {
  Flame,
  MessageSquare,
  Trash2,
  Send,
  Settings as SettingsIcon,
  ListChecks,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SectionCard from "../../components/SectionCard";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
  },
  tabs: {
    display: "flex",
    gap: theme.spacing(1),
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 6,
    width: "fit-content",
    [theme.breakpoints.down("xs")]: { width: "100%" },
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
    transition: "all .15s",
    "&:hover": { background: "#f8fafc" },
  },
  tabActive: {
    background: "#10b981",
    color: "#fff",
    boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
    "&:hover": { background: "#10b981" },
  },
  hint: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: 12,
    color: "#1e40af",
    fontSize: 13,
  },
  listHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
  },
  countChip: {
    background: "#d1fae5",
    color: "#047857",
    fontWeight: 700,
    fontSize: 11,
  },
  msgRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    background: "#fff",
    border: "1px solid #f1f5f9",
    borderRadius: 12,
    marginBottom: 8,
    transition: "all .15s",
    "&:hover": { borderColor: "#a7f3d0", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" },
  },
  msgIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "#ecfdf5",
    color: "#059669",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  msgText: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
  },
  delBtn: {
    color: "#ef4444",
    background: "#fef2f2",
    "&:hover": { background: "#fee2e2" },
  },
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  inputField: { flex: 1, fontSize: 13, color: "#334155" },
  sendBtn: {
    color: "#10b981",
    background: "#d1fae5",
    "&:hover": { background: "#a7f3d0" },
  },
  configGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: theme.spacing(2),
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: "#475569" },
  fieldInput: {
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 13,
    color: "#1e293b",
    "&:focus": { outline: "none", borderColor: "#10b981" },
  },
}));

const WhatsAppWarmer = () => {
  const classes = useStyles();
  const [tab, setTab] = useState("script");
  const [messages, setMessages] = useState([
    "hey there",
    "hey there",
    "hey",
    "hey man",
    "how are you",
    "i am good",
    "how are you doi",
    "hey",
    "yoa",
    "new",
    "message",
  ]);
  const [draft, setDraft] = useState("");

  const addMsg = () => {
    const v = draft.trim();
    if (!v) return;
    setMessages((m) => [...m, v]);
    setDraft("");
  };

  return (
    <div className={classes.root}>
      <PageHeader
        icon={<Flame size={22} />}
        title="Aquecedor de WhatsApp"
        subtitle="Comportamento humano automatizado para mensagens mais seguras."
      />

      <div className={classes.tabs}>
        <button
          className={`${classes.tab} ${tab === "script" ? classes.tabActive : ""}`}
          onClick={() => setTab("script")}
        >
          <ListChecks size={14} />
          Script do Aquecedor
        </button>
        <button
          className={`${classes.tab} ${tab === "config" ? classes.tabActive : ""}`}
          onClick={() => setTab("config")}
        >
          <SettingsIcon size={14} />
          Configurar Aquecedor
        </button>
      </div>

      {tab === "script" && (
        <>
          <div className={classes.hint}>
            <MessageSquare size={16} />
            Adicione mensagens ao script do aquecedor. Estas mensagens serão
            enviadas automaticamente entre seus dispositivos para simular
            conversas reais.
          </div>

          <SectionCard>
            <div className={classes.listHeader}>
              <div className={classes.listTitle}>Mensagens</div>
              <Chip
                size="small"
                className={classes.countChip}
                label={`${messages.length} Mensagens`}
                icon={<MessageSquare size={12} style={{ marginLeft: 6 }} />}
              />
            </div>

            <div>
              {messages.map((m, i) => (
                <div key={i} className={classes.msgRow}>
                  <span className={classes.msgIcon}>
                    <MessageSquare size={14} />
                  </span>
                  <span className={classes.msgText}>{m}</span>
                  <Tooltip title="Remover">
                    <IconButton
                      size="small"
                      className={classes.delBtn}
                      onClick={() =>
                        setMessages((arr) => arr.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </Tooltip>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <div className={classes.inputBar}>
              <InputBase
                placeholder="Digite uma mensagem para o script do aquecedor..."
                className={classes.inputField}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMsg()}
              />
              <IconButton
                size="small"
                className={classes.sendBtn}
                onClick={addMsg}
              >
                <Send size={16} />
              </IconButton>
            </div>
          </SectionCard>
        </>
      )}

      {tab === "config" && (
        <SectionCard
          icon={<SettingsIcon size={18} />}
          title="Parâmetros do aquecedor"
          subtitle="Defina intervalos, horários e limites para o envio automatizado."
        >
          <div className={classes.configGrid}>
            <div className={classes.field}>
              <span className={classes.fieldLabel}>Intervalo mínimo (s)</span>
              <input className={classes.fieldInput} type="number" defaultValue={20} />
            </div>
            <div className={classes.field}>
              <span className={classes.fieldLabel}>Intervalo máximo (s)</span>
              <input className={classes.fieldInput} type="number" defaultValue={60} />
            </div>
            <div className={classes.field}>
              <span className={classes.fieldLabel}>Mensagens por dia</span>
              <input className={classes.fieldInput} type="number" defaultValue={50} />
            </div>
            <div className={classes.field}>
              <span className={classes.fieldLabel}>Horário inicial</span>
              <input className={classes.fieldInput} type="time" defaultValue="09:00" />
            </div>
            <div className={classes.field}>
              <span className={classes.fieldLabel}>Horário final</span>
              <input className={classes.fieldInput} type="time" defaultValue="18:00" />
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              style={{
                background: "#10b981",
                color: "#fff",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 10,
                boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
              }}
            >
              Salvar configurações
            </Button>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default WhatsAppWarmer;
