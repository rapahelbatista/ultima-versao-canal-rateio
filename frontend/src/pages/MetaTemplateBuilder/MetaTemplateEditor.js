import React, { useState, useEffect, useRef, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  TextField,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
} from "@material-ui/core";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  CreditCard,
  Image as ImageIcon,
  ShoppingBag,
  Plus,
  FileText,
  ArrowLeft,
  Send,
  Play,
} from "lucide-react";
import { toast } from "react-toastify";
import SectionCard from "../../components/SectionCard";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const STEPS = [
  "Informações Básicas",
  "Cabeçalho",
  "Corpo",
  "Botões",
  "Variáveis",
  "Revisar e Enviar",
];

const TYPES = [
  { id: "standard", name: "Standard", desc: "Texto, mídia, botões", icon: FileText, tone: "violet" },
  { id: "carousel", name: "Carousel", desc: "Múltiplos cards de imagem", icon: ImageIcon, tone: "amber" },
  { id: "catalog", name: "Catalog", desc: "Mensagem de catálogo", icon: ShoppingBag, tone: "emerald" },
];

const TONES = {
  violet: { bg: "#ede9fe", color: "#7c3aed" },
  amber: { bg: "#fef3c7", color: "#d97706" },
  emerald: { bg: "#d1fae5", color: "#059669" },
};

const STATUS_TONES = {
  draft: { bg: "#e2e8f0", color: "#475569", label: "Rascunho" },
  pending: { bg: "#fef3c7", color: "#92400e", label: "Pendente" },
  approved: { bg: "#d1fae5", color: "#047857", label: "Aprovado" },
  rejected: { bg: "#fee2e2", color: "#b91c1c", label: "Rejeitado" },
};

const useStyles = makeStyles((theme) => ({
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#0f766e",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    padding: 0,
  },
  savingTag: { fontSize: 12, color: "#10b981", fontWeight: 600 },
  root: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: theme.spacing(2),
    [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
  },
  main: { display: "flex", flexDirection: "column", gap: theme.spacing(2) },
  stepper: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 0", overflowX: "auto",
  },
  step: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    flex: 1, minWidth: 90, position: "relative", cursor: "pointer",
  },
  stepBubble: {
    width: 30, height: 30, borderRadius: "50%",
    background: "#e2e8f0", color: "#94a3b8",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 13, transition: "all .2s", zIndex: 1,
  },
  stepBubbleActive: {
    background: "#10b981", color: "#fff",
    boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
  },
  stepBubbleDone: { background: "#10b981", color: "#fff" },
  stepLabel: { fontSize: 11, fontWeight: 600, color: "#64748b", textAlign: "center" },
  stepLabelActive: { color: "#1e293b" },
  connector: {
    position: "absolute", top: 15, left: "calc(50% + 20px)", right: "calc(-50% + 20px)",
    height: 2, background: "#e2e8f0", zIndex: 0,
  },
  connectorDone: { background: "#10b981" },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: theme.spacing(2),
  },
  typeCard: {
    border: "1px solid #e2e8f0", borderRadius: 12, padding: theme.spacing(2),
    cursor: "pointer", transition: "all .15s",
    display: "flex", flexDirection: "column", gap: 8,
    "&:hover": { borderColor: "#a7f3d0", background: "#f8fafc" },
  },
  typeCardActive: {
    borderColor: "#10b981", background: "#ecfdf5",
    boxShadow: "0 4px 10px rgba(16,185,129,0.15)",
  },
  typeIcon: {
    width: 36, height: 36, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  typeName: { fontSize: 14, fontWeight: 700, color: "#1e293b" },
  typeDesc: { fontSize: 12, color: "#64748b" },
  hint: {
    display: "flex", gap: 10, padding: "12px 14px",
    background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 10,
    color: "#1e40af", fontSize: 12,
  },
  navBar: {
    display: "flex", justifyContent: "space-between", gap: 8,
    marginTop: theme.spacing(1),
  },
  navBtn: {
    textTransform: "none", fontWeight: 600, borderRadius: 10,
    border: "1px solid #e2e8f0",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
    fontWeight: 700, textTransform: "none", borderRadius: 10,
    boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
    "&:hover": { background: "linear-gradient(135deg, #059669, #047857)" },
  },
  preview: {
    background: "#000", borderRadius: 32, padding: 8,
    boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
    height: "fit-content", position: "sticky", top: 24,
  },
  phoneInner: {
    background: "#075E54", borderRadius: 24, overflow: "hidden",
    minHeight: 480, display: "flex", flexDirection: "column",
  },
  phoneTop: {
    padding: "12px 16px", color: "#fff",
    display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 14,
  },
  phoneAvatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "#10b981", display: "flex", alignItems: "center",
    justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13,
  },
  phoneBody: {
    flex: 1,
    background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%23ddd5c4' fill-opacity='0.4'%3E%3Cpath d='M20 20a4 4 0 100-8 4 4 0 000 8z'/%3E%3C/g%3E%3C/svg%3E\") #ECE5DD",
    padding: 12,
  },
  bubble: {
    background: "#fff", borderRadius: 8, padding: "8px 10px",
    fontSize: 12, color: "#1e293b", maxWidth: "80%",
    boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
  },
  bubbleHeader: { fontWeight: 700, marginBottom: 2 },
  bubbleFooter: { fontSize: 10, color: "#64748b", marginTop: 4, textAlign: "right" },
  phoneInput: {
    display: "flex", alignItems: "center", gap: 8, padding: 8,
    background: "#fff", borderTop: "1px solid #e2e8f0",
  },
  phoneInputBox: {
    flex: 1, padding: "8px 12px", background: "#f8fafc",
    borderRadius: 20, color: "#94a3b8", fontSize: 12,
  },
  phoneSend: {
    width: 32, height: 32, borderRadius: "50%",
    background: "#10b981", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
}));

const MetaTemplateEditor = ({ templateId, onBack }) => {
  const classes = useStyles();
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [templateType, setTemplateType] = useState("standard");
  const [language, setLanguage] = useState("pt_BR");
  const [category, setCategory] = useState("Utility");
  const [status, setStatus] = useState("draft");
  const [statusReason, setStatusReason] = useState("");

  const [headerFmt, setHeaderFmt] = useState("none");
  const [headerText, setHeaderText] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttonType, setButtonType] = useState("none");
  const [variableValues, setVariableValues] = useState({});
  const [simulating, setSimulating] = useState(false);
  const [simulatedAt, setSimulatedAt] = useState(null);

  const skipNextSave = useRef(true);
  const saveTimer = useRef(null);
  const simTimer = useRef(null);

  // Carrega template
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get(`/meta-templates/${templateId}`);
        if (!active) return;
        setName(data.name || "");
        setTemplateType(data.templateType || "standard");
        setLanguage(data.language || "pt_BR");
        setCategory(data.category || "Utility");
        setStatus(data.status || "draft");
        setStatusReason(data.statusReason || "");
        setStep(data.currentStep || 0);
        const p = data.payload || {};
        setHeaderFmt(p.headerFmt || "none");
        setHeaderText(p.headerText || "");
        setBody(p.body || "");
        setFooter(p.footer || "");
        setButtonType(p.buttonType || "none");
        setVariableValues(p.variableValues && typeof p.variableValues === "object" ? p.variableValues : {});
      } catch (err) {
        toastError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [templateId]);

  // Auto-save
  const collectPayload = useCallback(() => ({
    name,
    templateType,
    language,
    category,
    currentStep: step,
    payload: { headerFmt, headerText, body, footer, buttonType, variableValues },
  }), [name, templateType, language, category, step, headerFmt, headerText, body, footer, buttonType, variableValues]);

  useEffect(() => {
    if (loading) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        setSaving(true);
        await api.put(`/meta-templates/${templateId}`, collectPayload());
      } catch (err) {
        toastError(err);
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [collectPayload, loading, templateId]);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await api.put(`/meta-templates/${templateId}`, {
        ...collectPayload(),
        status: "pending",
      });
      setStatus("pending");
      toast.success("Modelo enviado para aprovação da Meta");
    } catch (err) {
      toastError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Variáveis e simulação =====
  const detectVariables = useCallback((text) => {
    const matches = String(text || "").match(/\{\{(\d+)\}\}/g) || [];
    const set = new Set(matches.map((m) => m.replace(/[{}]/g, "")));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, []);

  const allVariables = React.useMemo(
    () => detectVariables(`${headerText} ${body} ${footer}`),
    [headerText, body, footer, detectVariables]
  );

  const interpolate = useCallback(
    (text, { highlight = false } = {}) => {
      if (!text) return text;
      const parts = String(text).split(/(\{\{\d+\}\})/g);
      return parts.map((part, idx) => {
        const m = part.match(/^\{\{(\d+)\}\}$/);
        if (!m) return part;
        const key = m[1];
        const value = variableValues[key];
        if (value) return value;
        if (highlight) {
          return (
            <span
              key={idx}
              style={{
                background: "#fef3c7",
                color: "#92400e",
                padding: "0 4px",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {`{{${key}}}`}
            </span>
          );
        }
        return part;
      });
    },
    [variableValues]
  );

  const handleSimulate = useCallback(() => {
    if (simTimer.current) clearTimeout(simTimer.current);
    setSimulating(true);
    simTimer.current = setTimeout(() => {
      setSimulating(false);
      setSimulatedAt(Date.now());
    }, 900);
  }, []);

  useEffect(() => () => simTimer.current && clearTimeout(simTimer.current), []);

  if (loading) {
    return <div style={{ padding: 24, color: "#64748b" }}>Carregando modelo…</div>;
  }

  const statusTone = STATUS_TONES[status] || STATUS_TONES.draft;

  return (
    <div>
      <div className={classes.topBar}>
        <button className={classes.back} onClick={onBack}>
          <ArrowLeft size={14} /> Voltar para a lista
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saving && <span className={classes.savingTag}>salvando…</span>}
          <Chip
            size="small"
            label={statusTone.label}
            style={{ background: statusTone.bg, color: statusTone.color, fontWeight: 700 }}
          />
        </div>
      </div>

      {status === "rejected" && statusReason && (
        <div style={{
          marginBottom: 12, padding: "10px 14px",
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 10, color: "#991b1b", fontSize: 12,
        }}>
          <strong>Rejeitado pela Meta:</strong> {statusReason}
        </div>
      )}

      <div className={classes.root}>
        <div className={classes.main}>
          <SectionCard>
            <div className={classes.stepper}>
              {STEPS.map((label, i) => {
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <div key={label} className={classes.step} onClick={() => setStep(i)}>
                    <div className={`${classes.stepBubble} ${isActive ? classes.stepBubbleActive : ""} ${isDone ? classes.stepBubbleDone : ""}`}>
                      {isDone ? <Check size={14} /> : i + 1}
                    </div>
                    <div className={`${classes.stepLabel} ${isActive ? classes.stepLabelActive : ""}`}>
                      {label}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`${classes.connector} ${isDone ? classes.connectorDone : ""}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {step === 0 && (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
                    Template Type
                  </div>
                  <div className={classes.typeGrid}>
                    {TYPES.map((t) => {
                      const Ic = t.icon;
                      const tone = TONES[t.tone];
                      return (
                        <div
                          key={t.id}
                          className={`${classes.typeCard} ${templateType === t.id ? classes.typeCardActive : ""}`}
                          onClick={() => setTemplateType(t.id)}
                        >
                          <div className={classes.typeIcon} style={{ background: tone.bg, color: tone.color }}>
                            <Ic size={18} />
                          </div>
                          <div className={classes.typeName}>{t.name}</div>
                          <div className={classes.typeDesc}>{t.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <TextField
                  label="Nome do Modelo" variant="outlined" size="small" fullWidth
                  placeholder="e.g. order_confirmation"
                  value={name} onChange={(e) => setName(e.target.value)}
                  helperText="Apenas letras minúsculas, números e sublinhados"
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <TextField select label="Idioma" variant="outlined" size="small"
                    value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <MenuItem value="pt_BR">Português (BR)</MenuItem>
                    <MenuItem value="en_US">English (US)</MenuItem>
                    <MenuItem value="es_ES">Español</MenuItem>
                  </TextField>
                  <TextField select label="Categoria" variant="outlined" size="small"
                    value={category} onChange={(e) => setCategory(e.target.value)}>
                    <MenuItem value="Utility">Utility</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Authentication">Authentication</MenuItem>
                  </TextField>
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
                    Formato do Cabeçalho
                  </div>
                  <RadioGroup row value={headerFmt} onChange={(e) => setHeaderFmt(e.target.value)}>
                    <FormControlLabel value="none" control={<Radio color="primary" />} label="None" />
                    <FormControlLabel value="text" control={<Radio color="primary" />} label="Text" />
                    <FormControlLabel value="media" control={<Radio color="primary" />} label="Media" />
                  </RadioGroup>
                </div>
                {headerFmt === "text" && (
                  <TextField
                    label="Texto do Cabeçalho" variant="outlined" size="small" fullWidth
                    inputProps={{ maxLength: 60 }}
                    value={headerText} onChange={(e) => setHeaderText(e.target.value)}
                  />
                )}
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                      Corpo da mensagem *
                    </span>
                    <button style={{
                      background: "transparent", border: "none", color: "#10b981",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }} onClick={() => setBody((b) => `${b}{{${(b.match(/\{\{\d+\}\}/g) || []).length + 1}}}`)}>
                      <Plus size={12} /> Adicionar Variável
                    </button>
                  </div>
                  <TextField
                    multiline rows={5} variant="outlined" size="small" fullWidth
                    value={body} onChange={(e) => setBody(e.target.value)}
                    inputProps={{ maxLength: 1024 }}
                    helperText={`${body.length}/1024`}
                  />
                </div>
                <TextField
                  label="Rodapé (opcional)" variant="outlined" size="small" fullWidth
                  value={footer} onChange={(e) => setFooter(e.target.value)}
                  inputProps={{ maxLength: 60 }}
                  helperText={`${footer.length}/60`}
                />
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
                    Tipo de Botão
                  </div>
                  <RadioGroup row value={buttonType} onChange={(e) => setButtonType(e.target.value)}>
                    <FormControlLabel value="none" control={<Radio color="primary" />} label="None" />
                    <FormControlLabel value="quick" control={<Radio color="primary" />} label="Quick Reply" />
                    <FormControlLabel value="cta" control={<Radio color="primary" />} label="Call to Action" />
                  </RadioGroup>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className={classes.hint}>
                <CreditCard size={16} />
                <div>
                  Configure os valores de exemplo para cada variável usada no corpo da mensagem.
                </div>
              </div>
            )}

            {step === 5 && (
              <div style={{ display: "grid", gap: 12 }}>
                <div className={classes.hint}>
                  <CreditCard size={16} />
                  <div>Revise as informações e envie o modelo para aprovação da Meta.</div>
                </div>
                <Button
                  className={classes.primaryBtn}
                  startIcon={<Send size={14} />}
                  onClick={handleSubmit}
                  disabled={submitting || status === "pending" || status === "approved"}
                >
                  {status === "approved"
                    ? "Aprovado"
                    : status === "pending"
                    ? "Aguardando aprovação"
                    : "Enviar para a Meta"}
                </Button>
              </div>
            )}

            <div className={classes.navBar}>
              <Button className={classes.navBtn} onClick={prev} disabled={step === 0}
                startIcon={<ChevronLeft size={14} />}>
                Voltar
              </Button>
              <div style={{ display: "flex", gap: 8 }}>
                <Button className={classes.navBtn}
                  startIcon={showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                  onClick={() => setShowPreview((v) => !v)}>
                  {showPreview ? "Ocultar Prévia" : "Mostrar Prévia"}
                </Button>
                <Button className={classes.primaryBtn}
                  endIcon={<ChevronRight size={14} />}
                  onClick={next} disabled={step === STEPS.length - 1}>
                  Próximo
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>

        {showPreview && (
          <div className={classes.preview}>
            <div className={classes.phoneInner}>
              <div className={classes.phoneTop}>
                <ChevronLeft size={18} />
                <div className={classes.phoneAvatar}>B</div>
                <div style={{ flex: 1 }}>
                  <div>Negócio</div>
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>online</div>
                </div>
              </div>
              <div className={classes.phoneBody}>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <span style={{
                    background: "#fff", borderRadius: 8, padding: "4px 10px",
                    fontSize: 10, color: "#64748b", fontWeight: 600,
                  }}>HOJE</span>
                </div>
                <div className={classes.bubble}>
                  {headerFmt === "text" && headerText && (
                    <div className={classes.bubbleHeader}>{headerText}</div>
                  )}
                  <div>{body || "Sua mensagem aparecerá aqui..."}</div>
                  {footer && (
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{footer}</div>
                  )}
                  <div className={classes.bubbleFooter}>12:23 ✓✓</div>
                </div>
              </div>
              <div className={classes.phoneInput}>
                <div className={classes.phoneInputBox}>Digite uma mensagem</div>
                <div className={classes.phoneSend}>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaTemplateEditor;
