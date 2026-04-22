import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  TextField,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@material-ui/core";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  CreditCard,
  Image as ImageIcon,
  ShoppingBag,
  Plus,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SectionCard from "../../components/SectionCard";

const STEPS = [
  "Informações Básicas",
  "Cabeçalho",
  "Corpo",
  "Botões",
  "Variáveis",
  "Revisar e Enviar",
];

const useStyles = makeStyles((theme) => ({
  root: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  main: { display: "flex", flexDirection: "column", gap: theme.spacing(2) },
  stepper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 0",
    overflowX: "auto",
  },
  step: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 90,
    position: "relative",
  },
  stepBubble: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#e2e8f0",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    transition: "all .2s",
    zIndex: 1,
  },
  stepBubbleActive: {
    background: "#10b981",
    color: "#fff",
    boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
  },
  stepBubbleDone: {
    background: "#10b981",
    color: "#fff",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textAlign: "center",
  },
  stepLabelActive: { color: "#1e293b" },
  connector: {
    position: "absolute",
    top: 15,
    left: "calc(50% + 20px)",
    right: "calc(-50% + 20px)",
    height: 2,
    background: "#e2e8f0",
    zIndex: 0,
  },
  connectorDone: { background: "#10b981" },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: theme.spacing(2),
  },
  typeCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: theme.spacing(2),
    cursor: "pointer",
    transition: "all .15s",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    "&:hover": { borderColor: "#a7f3d0", background: "#f8fafc" },
  },
  typeCardActive: {
    borderColor: "#10b981",
    background: "#ecfdf5",
    boxShadow: "0 4px 10px rgba(16,185,129,0.15)",
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  typeName: { fontSize: 14, fontWeight: 700, color: "#1e293b" },
  typeDesc: { fontSize: 12, color: "#64748b" },
  hint: {
    display: "flex",
    gap: 10,
    padding: "12px 14px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: 10,
    color: "#1e40af",
    fontSize: 12,
  },
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    marginTop: theme.spacing(1),
  },
  navBtn: {
    textTransform: "none",
    fontWeight: 600,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: 700,
    textTransform: "none",
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(16,185,129,0.35)",
    "&:hover": { background: "linear-gradient(135deg, #059669, #047857)" },
  },
  preview: {
    background: "#000",
    borderRadius: 32,
    padding: 8,
    boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
    height: "fit-content",
    position: "sticky",
    top: 24,
  },
  phoneInner: {
    background: "#075E54",
    borderRadius: 24,
    overflow: "hidden",
    minHeight: 480,
    display: "flex",
    flexDirection: "column",
  },
  phoneTop: {
    padding: "12px 16px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 700,
    fontSize: 14,
  },
  phoneAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
  },
  phoneBody: {
    flex: 1,
    background:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%23ddd5c4' fill-opacity='0.4'%3E%3Cpath d='M20 20a4 4 0 100-8 4 4 0 000 8z'/%3E%3C/g%3E%3C/svg%3E\") #ECE5DD",
    padding: 12,
  },
  bubble: {
    background: "#fff",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 12,
    color: "#1e293b",
    maxWidth: "80%",
    boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
  },
  bubbleHeader: { fontWeight: 700, marginBottom: 2 },
  bubbleFooter: { fontSize: 10, color: "#64748b", marginTop: 4, textAlign: "right" },
  phoneInput: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 8,
    background: "#fff",
    borderTop: "1px solid #e2e8f0",
  },
  phoneInputBox: {
    flex: 1,
    padding: "8px 12px",
    background: "#f8fafc",
    borderRadius: 20,
    color: "#94a3b8",
    fontSize: 12,
  },
  phoneSend: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#10b981",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
}));

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

const MetaTemplateBuilder = () => {
  const classes = useStyles();
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [type, setType] = useState("standard");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("English");
  const [category, setCategory] = useState("Utility");
  const [headerFmt, setHeaderFmt] = useState("none");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttonType, setButtonType] = useState("none");

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div>
      <PageHeader
        icon={<FileText size={22} />}
        title="Criar Modelo da Meta"
        subtitle="Construa e envie modelos de mensagem do WhatsApp para suas campanhas"
      />

      <div className={classes.root} style={{ marginTop: 16 }}>
        <div className={classes.main}>
          <SectionCard>
            <div className={classes.stepper}>
              {STEPS.map((label, i) => {
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <div key={label} className={classes.step}>
                    <div
                      className={`${classes.stepBubble} ${
                        isActive ? classes.stepBubbleActive : ""
                      } ${isDone ? classes.stepBubbleDone : ""}`}
                    >
                      {isDone ? <Check size={14} /> : i + 1}
                    </div>
                    <div
                      className={`${classes.stepLabel} ${
                        isActive ? classes.stepLabelActive : ""
                      }`}
                    >
                      {label}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`${classes.connector} ${
                          isDone ? classes.connectorDone : ""
                        }`}
                      />
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
                          className={`${classes.typeCard} ${
                            type === t.id ? classes.typeCardActive : ""
                          }`}
                          onClick={() => setType(t.id)}
                        >
                          <div
                            className={classes.typeIcon}
                            style={{ background: tone.bg, color: tone.color }}
                          >
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
                  label="Nome do Modelo"
                  variant="outlined"
                  size="small"
                  fullWidth
                  placeholder="e.g. order_confirmation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  helperText="Apenas letras, números e sublinhados são permitidos"
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <TextField
                    select
                    label="Idioma"
                    variant="outlined"
                    size="small"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Portuguese">Portuguese</MenuItem>
                    <MenuItem value="Spanish">Spanish</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Categoria"
                    variant="outlined"
                    size="small"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <MenuItem value="Utility">Utility</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Authentication">Authentication</MenuItem>
                  </TextField>
                </div>

                <div className={classes.hint}>
                  <CreditCard size={16} />
                  <div>
                    <strong>Diretrizes para Nome do Modelo</strong>
                    <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                      <li>Use apenas letras minúsculas</li>
                      <li>Use sublinhados no lugar de espaços (ex: atualizacao_pedido)</li>
                      <li>Máximo de 512 caracteres permitidos</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
                    Formato do Cabeçalho
                  </div>
                  <RadioGroup
                    row
                    value={headerFmt}
                    onChange={(e) => setHeaderFmt(e.target.value)}
                  >
                    <FormControlLabel value="none" control={<Radio color="primary" />} label="None" />
                    <FormControlLabel value="text" control={<Radio color="primary" />} label="Text" />
                    <FormControlLabel value="media" control={<Radio color="primary" />} label="Media" />
                  </RadioGroup>
                </div>

                {headerFmt === "text" && (
                  <TextField label="Texto do Cabeçalho" variant="outlined" size="small" fullWidth inputProps={{ maxLength: 60 }} />
                )}

                <div className={classes.hint}>
                  <CreditCard size={16} />
                  <div>
                    <strong>Diretrizes do Cabeçalho</strong>
                    <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                      <li>Cabeçalho de texto máximo 60 caracteres</li>
                      <li>As imagens devem ser nítidas e de alta qualidade</li>
                      <li>Vídeos máximo 16MB - apenas formato MP4</li>
                      <li>Documentos PDF são suportados</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                      Corpo da mensagem *
                    </span>
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#10b981",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Plus size={12} /> Adicionar Variável
                    </button>
                  </div>
                  <TextField
                    multiline
                    rows={5}
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    inputProps={{ maxLength: 1024 }}
                    helperText={`${body.length}/1024`}
                  />
                </div>
                <TextField
                  label="Rodapé (opcional)"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  inputProps={{ maxLength: 60 }}
                  helperText={`${footer.length}/60`}
                />
                <div className={classes.hint}>
                  <CreditCard size={16} />
                  <div>
                    <strong>Diretrizes do Corpo</strong>
                    <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                      <li>Use linguagem clara e concisa</li>
                      <li>Adicione variáveis dinâmicas como {"{{1}}"}, {"{{2}}"}</li>
                      <li>Forneça exemplos para todas as variáveis usadas</li>
                      <li>O rodapé é opcional, mas recomendado para conformidade</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
                    Tipo de Botão
                  </div>
                  <RadioGroup
                    row
                    value={buttonType}
                    onChange={(e) => setButtonType(e.target.value)}
                  >
                    <FormControlLabel value="none" control={<Radio color="primary" />} label="None" />
                    <FormControlLabel value="quick" control={<Radio color="primary" />} label="Quick Reply" />
                    <FormControlLabel value="cta" control={<Radio color="primary" />} label="Call to Action" />
                  </RadioGroup>
                </div>
                <div className={classes.hint}>
                  <CreditCard size={16} />
                  <div>
                    <strong>Diretrizes de Botão</strong>
                    <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                      <li>Máximo de 3 botões de resposta rápida permitidos</li>
                      <li>Máximo de 2 botões de chamada para ação permitidos</li>
                      <li>Texto do botão máximo 20 caracteres</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Configure os valores de exemplo para cada variável usada no corpo
                da mensagem.
              </div>
            )}

            {step === 5 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Revise as informações abaixo e envie o modelo para aprovação da Meta.
              </div>
            )}

            <div className={classes.navBar}>
              <Button
                className={classes.navBtn}
                onClick={prev}
                disabled={step === 0}
                startIcon={<ChevronLeft size={14} />}
              >
                Voltar
              </Button>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  className={classes.navBtn}
                  startIcon={showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? "Ocultar Prévia" : "Mostrar Prévia"}
                </Button>
                <Button
                  className={classes.primaryBtn}
                  endIcon={<ChevronRight size={14} />}
                  onClick={next}
                  disabled={step === STEPS.length - 1}
                >
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
                  <span
                    style={{
                      background: "#fff",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 10,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    HOJE
                  </span>
                </div>
                <div className={classes.bubble}>
                  {body && <div className={classes.bubbleHeader}>{body.split("\n")[0] || ""}</div>}
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

export default MetaTemplateBuilder;
