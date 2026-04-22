import React, { useMemo, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Button, IconButton, Tooltip, Chip } from "@material-ui/core";
import {
  BookOpen,
  Code2,
  Copy,
  Check,
  KeyRound,
  Smartphone,
  Send,
  ListChecks,
  Users,
  AlertCircle,
  Webhook,
  Search,
  Terminal,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SectionCard from "../../components/SectionCard";
import { toast } from "react-toastify";

/* ====================== Estilos ====================== */
const useStyles = makeStyles((theme) => ({
  layout: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: 16,
    [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
  },
  sideNav: {
    position: "sticky",
    top: 16,
    alignSelf: "start",
    background: "#fff",
    border: "1px solid #f1f5f9",
    borderRadius: 14,
    padding: 12,
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
  },
  sideTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#94a3b8",
    padding: "8px 10px 4px",
  },
  sideItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 13,
    color: "#475569",
    cursor: "pointer",
    textDecoration: "none",
    "&:hover": { background: "#f1f5f9", color: "#0f172a" },
  },
  sideItemActive: {
    background: "#ecfdf5",
    color: "#047857",
    fontWeight: 700,
  },
  search: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
    borderRadius: 10,
    padding: "6px 10px",
    margin: "0 6px 8px",
    fontSize: 12,
    color: "#94a3b8",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 12,
    color: "#0f172a",
  },
  section: {
    scrollMarginTop: 80,
  },
  h2: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    margin: "4px 0 8px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  lead: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.6,
    marginBottom: 12,
  },
  endpointRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    background: "#0f172a",
    color: "#e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 13,
    marginBottom: 10,
  },
  method: {
    fontWeight: 800,
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  mGet: { background: "#0ea5e9", color: "#fff" },
  mPost: { background: "#10b981", color: "#fff" },
  mPut: { background: "#f59e0b", color: "#fff" },
  mDelete: { background: "#ef4444", color: "#fff" },
  copyBtn: {
    marginLeft: "auto",
    color: "#94a3b8",
    "&:hover": { color: "#fff" },
  },
  tabs: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid #e2e8f0",
    marginBottom: 8,
  },
  tab: {
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    "&:hover": { color: "#0f172a" },
  },
  tabActive: {
    color: "#047857",
    borderBottomColor: "#10b981",
  },
  code: {
    background: "#0f172a",
    color: "#e2e8f0",
    borderRadius: 10,
    padding: 14,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12.5,
    lineHeight: 1.55,
    whiteSpace: "pre",
    overflowX: "auto",
    position: "relative",
  },
  codeWrap: { position: "relative", marginBottom: 14 },
  codeCopy: {
    position: "absolute",
    top: 8,
    right: 8,
    color: "#94a3b8",
    background: "rgba(15,23,42,0.6)",
    "&:hover": { color: "#fff", background: "rgba(15,23,42,0.85)" },
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12.5,
    marginBottom: 14,
    background: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #f1f5f9",
  },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 700,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  td: {
    padding: "8px 10px",
    borderTop: "1px solid #f1f5f9",
    color: "#1e293b",
    verticalAlign: "top",
  },
  tag: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 6,
    background: "#e0f2fe",
    color: "#0369a1",
    marginRight: 6,
  },
  required: { background: "#fee2e2", color: "#b91c1c" },
  callout: {
    background: "linear-gradient(135deg, #ecfeff, #f0fdfa)",
    border: "1px solid #99f6e4",
    color: "#115e59",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 14,
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
  },
  warn: {
    background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
    border: "1px solid #fde68a",
    color: "#78350f",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 14,
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
  },
}));

/* ====================== Helpers ====================== */
const baseUrl =
  typeof window !== "undefined" ? window.location.origin : "https://seu-dominio";

const methodClass = (m, classes) =>
  ({
    GET: classes.mGet,
    POST: classes.mPost,
    PUT: classes.mPut,
    DELETE: classes.mDelete,
  }[m] || classes.mGet);

const CodeBlock = ({ children, classes }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className={classes.codeWrap}>
      <pre className={classes.code}>{children}</pre>
      <Tooltip title="Copiar">
        <IconButton size="small" className={classes.codeCopy} onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </IconButton>
      </Tooltip>
    </div>
  );
};

const Endpoint = ({ method, path, classes }) => {
  const url = `${baseUrl}${path}`;
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Endpoint copiado!");
  };
  return (
    <div className={classes.endpointRow}>
      <span className={`${classes.method} ${methodClass(method, classes)}`}>{method}</span>
      <span style={{ wordBreak: "break-all" }}>{path}</span>
      <Tooltip title="Copiar URL completa">
        <IconButton size="small" className={classes.copyBtn} onClick={handleCopy}>
          <Copy size={14} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

const ParamsTable = ({ rows, classes }) => (
  <table className={classes.table}>
    <thead>
      <tr>
        <th className={classes.th}>Campo</th>
        <th className={classes.th}>Tipo</th>
        <th className={classes.th}>Descrição</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.name}>
          <td className={classes.td}>
            <code>{r.name}</code>{" "}
            <span
              className={`${classes.tag} ${r.required ? classes.required : ""}`}
            >
              {r.required ? "obrigatório" : "opcional"}
            </span>
          </td>
          <td className={classes.td}>{r.type}</td>
          <td className={classes.td}>{r.desc}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ExampleTabs = ({ examples, classes }) => {
  const [tab, setTab] = useState(Object.keys(examples)[0]);
  return (
    <>
      <div className={classes.tabs}>
        {Object.keys(examples).map((k) => (
          <div
            key={k}
            className={`${classes.tab} ${tab === k ? classes.tabActive : ""}`}
            onClick={() => setTab(k)}
          >
            {k}
          </div>
        ))}
      </div>
      <CodeBlock classes={classes}>{examples[tab]}</CodeBlock>
    </>
  );
};

/* ====================== Conteúdo ====================== */
const SECTIONS = [
  { id: "overview", label: "Visão geral", icon: BookOpen },
  { id: "auth", label: "Autenticação", icon: KeyRound },
  { id: "connections", label: "Conexões WA/QR", icon: Smartphone },
  { id: "send-text", label: "Enviar texto", icon: Send },
  { id: "send-media", label: "Enviar mídia", icon: Send },
  { id: "send-bulk", label: "Envio em lote", icon: ListChecks },
  { id: "send-buttons", label: "Botões/Listas", icon: ListChecks },
  { id: "check-number", label: "Validar número", icon: Users },
  { id: "v2", label: "API v2 (API Key)", icon: Code2 },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "errors", label: "Erros", icon: AlertCircle },
];

/* ====================== Página ====================== */
const ApiDocs = () => {
  const classes = useStyles();
  const [active, setActive] = useState("overview");
  const [filter, setFilter] = useState("");

  const visibleSections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter((s) => s.label.toLowerCase().includes(q));
  }, [filter]);

  const goTo = (id) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <PageHeader
        icon={<BookOpen size={22} />}
        title="Documentação da REST API"
        subtitle="Endpoints, parâmetros e exemplos prontos para integrar suas conexões WhatsApp QR."
        actions={
          <Button
            variant="outlined"
            startIcon={<Terminal size={14} />}
            onClick={() => goTo("auth")}
          >
            Começar agora
          </Button>
        }
      />

      <div style={{ marginTop: 16 }} className={classes.layout}>
        {/* Sidebar */}
        <nav className={classes.sideNav}>
          <div className={classes.search}>
            <Search size={12} />
            <input
              className={classes.searchInput}
              placeholder="Buscar seção..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className={classes.sideTitle}>Seções</div>
          {visibleSections.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.id}
                className={`${classes.sideItem} ${
                  active === s.id ? classes.sideItemActive : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(s.id);
                }}
                href={`#${s.id}`}
              >
                <Icon size={14} />
                {s.label}
              </a>
            );
          })}
        </nav>

        {/* Conteúdo */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* Visão geral */}
          <SectionCard>
            <section id="overview" className={classes.section}>
              <h2 className={classes.h2}>
                <BookOpen size={18} /> Visão geral
              </h2>
              <p className={classes.lead}>
                A API REST permite enviar mensagens, validar números e gerenciar
                campanhas a partir das suas conexões WhatsApp QR. São
                disponibilizadas duas versões:
              </p>
              <ul className={classes.lead}>
                <li>
                  <strong>v1 (legado)</strong> — autenticação por <em>token da
                  conexão</em> (gerado em <code>/connections</code>).
                </li>
                <li>
                  <strong>v2 (recomendada)</strong> — autenticação por <em>API
                  Key</em> com escopos (<code>messages:send</code>,{" "}
                  <code>campaigns:read</code>, etc.).
                </li>
              </ul>
              <div className={classes.callout}>
                <Code2 size={16} />
                <div>
                  <strong>Base URL:</strong>{" "}
                  <code>{baseUrl}</code>
                  <br />
                  Todas as respostas são <code>application/json</code>. Datas em
                  ISO 8601 UTC. Números de telefone no padrão{" "}
                  <code>E.164</code> sem o <code>+</code> (ex.{" "}
                  <code>5511999998888</code>).
                </div>
              </div>
            </section>
          </SectionCard>

          {/* Autenticação */}
          <SectionCard>
            <section id="auth" className={classes.section}>
              <h2 className={classes.h2}>
                <KeyRound size={18} /> Autenticação
              </h2>
              <p className={classes.lead}>
                Use <strong>uma</strong> das opções abaixo conforme a versão da
                rota.
              </p>
              <h4>v1 — Token da conexão</h4>
              <CodeBlock classes={classes}>{`Authorization: Bearer SEU_TOKEN_DA_CONEXAO`}</CodeBlock>
              <p className={classes.lead}>
                O token é exibido na tela <code>/connections</code> ao editar a
                conexão WhatsApp QR.
              </p>
              <h4>v2 — API Key (header dedicado)</h4>
              <CodeBlock classes={classes}>{`X-API-Key: lk_live_********************************`}</CodeBlock>
              <div className={classes.warn}>
                <AlertCircle size={16} />
                <div>
                  Mantenha as chaves <strong>fora do frontend</strong>. Use
                  apenas em servidores ou funções backend.
                </div>
              </div>
            </section>
          </SectionCard>

          {/* Conexões */}
          <SectionCard>
            <section id="connections" className={classes.section}>
              <h2 className={classes.h2}>
                <Smartphone size={18} /> Listar conexões WA/QR
              </h2>
              <p className={classes.lead}>
                Retorna as sessões WhatsApp QR vinculadas à empresa, com status
                de conexão e o ID que deve ser usado em <code>whatsappId</code>.
              </p>
              <Endpoint method="GET" path="/api/messages/connections" classes={classes} />
              <ExampleTabs
                classes={classes}
                examples={{
                  cURL: `curl -X GET "${baseUrl}/api/messages/connections" \\
  -H "Authorization: Bearer SEU_TOKEN_DA_CONEXAO"`,
                  "Node.js": `import axios from "axios";

const { data } = await axios.get(
  "${baseUrl}/api/messages/connections",
  { headers: { Authorization: "Bearer SEU_TOKEN_DA_CONEXAO" } }
);
console.log(data); // [{ id, name, status, number, ... }]`,
                  Python: `import requests

r = requests.get(
    "${baseUrl}/api/messages/connections",
    headers={"Authorization": "Bearer SEU_TOKEN_DA_CONEXAO"},
)
print(r.json())`,
                }}
              />
            </section>
          </SectionCard>

          {/* Enviar texto */}
          <SectionCard>
            <section id="send-text" className={classes.section}>
              <h2 className={classes.h2}>
                <Send size={18} /> Enviar mensagem de texto
              </h2>
              <Endpoint method="POST" path="/api/messages/send" classes={classes} />
              <ParamsTable
                classes={classes}
                rows={[
                  { name: "number", type: "string", required: true, desc: "Número no formato E.164 sem +. Ex: 5511999998888." },
                  { name: "body", type: "string", required: true, desc: "Texto da mensagem (suporta emojis e quebras)." },
                  { name: "whatsappId", type: "number", required: false, desc: "ID da conexão. Se omitido usa a conexão padrão." },
                ]}
              />
              <ExampleTabs
                classes={classes}
                examples={{
                  cURL: `curl -X POST "${baseUrl}/api/messages/send" \\
  -H "Authorization: Bearer SEU_TOKEN_DA_CONEXAO" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999998888",
    "body": "Olá! Mensagem enviada via API 🚀"
  }'`,
                  "Node.js": `await axios.post(
  "${baseUrl}/api/messages/send",
  {
    number: "5511999998888",
    body: "Olá! Mensagem enviada via API 🚀",
  },
  { headers: { Authorization: "Bearer SEU_TOKEN_DA_CONEXAO" } }
);`,
                  Python: `requests.post(
    "${baseUrl}/api/messages/send",
    json={"number": "5511999998888", "body": "Olá! Mensagem via API 🚀"},
    headers={"Authorization": "Bearer SEU_TOKEN_DA_CONEXAO"},
)`,
                }}
              />
            </section>
          </SectionCard>

          {/* Enviar mídia */}
          <SectionCard>
            <section id="send-media" className={classes.section}>
              <h2 className={classes.h2}>
                <Send size={18} /> Enviar mídia (imagem, áudio, documento)
              </h2>
              <p className={classes.lead}>
                Use <code>multipart/form-data</code> com o campo{" "}
                <code>medias</code> (até 10 arquivos) — ou envie por URL com a
                rota <code>/send/linkImage</code>.
              </p>
              <Endpoint method="POST" path="/api/messages/send" classes={classes} />
              <CodeBlock classes={classes}>{`curl -X POST "${baseUrl}/api/messages/send" \\
  -H "Authorization: Bearer SEU_TOKEN_DA_CONEXAO" \\
  -F "number=5511999998888" \\
  -F "body=Segue o comprovante" \\
  -F "medias=@/caminho/arquivo.pdf"`}</CodeBlock>

              <Endpoint method="POST" path="/api/messages/send/linkImage" classes={classes} />
              <CodeBlock classes={classes}>{`curl -X POST "${baseUrl}/api/messages/send/linkImage" \\
  -H "Authorization: Bearer SEU_TOKEN_DA_CONEXAO" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999998888",
    "url": "https://exemplo.com/imagem.png",
    "caption": "Confira nossa promoção"
  }'`}</CodeBlock>
            </section>
          </SectionCard>

          {/* Bulk */}
          <SectionCard>
            <section id="send-bulk" className={classes.section}>
              <h2 className={classes.h2}>
                <ListChecks size={18} /> Envio em lote
              </h2>
              <Endpoint method="POST" path="/api/messages/send/bulk" classes={classes} />
              <ParamsTable
                classes={classes}
                rows={[
                  { name: "numbers", type: "string[]", required: true, desc: "Lista de números E.164 sem +." },
                  { name: "body", type: "string", required: true, desc: "Mensagem (use {{name}} para variáveis se aplicável)." },
                  { name: "whatsappId", type: "number", required: false, desc: "ID da conexão." },
                  { name: "delaySeconds", type: "number", required: false, desc: "Atraso entre envios (recomendado 5–25s)." },
                ]}
              />
              <CodeBlock classes={classes}>{`curl -X POST "${baseUrl}/api/messages/send/bulk" \\
  -H "Authorization: Bearer SEU_TOKEN_DA_CONEXAO" \\
  -H "Content-Type: application/json" \\
  -d '{
    "numbers": ["5511999990001","5511999990002"],
    "body": "Olá! Confirme sua presença respondendo SIM.",
    "delaySeconds": 8
  }'`}</CodeBlock>
            </section>
          </SectionCard>

          {/* Botões */}
          <SectionCard>
            <section id="send-buttons" className={classes.section}>
              <h2 className={classes.h2}>
                <ListChecks size={18} /> Mensagens interativas
              </h2>
              <Endpoint method="POST" path="/api/messages/send/buttons" classes={classes} />
              <p className={classes.lead}>
                Suporta botões de resposta rápida, listas, URL e PIX
                (dependendo do tipo).
              </p>
              <CodeBlock classes={classes}>{`curl -X POST "${baseUrl}/api/messages/send/buttons" \\
  -H "Authorization: Bearer SEU_TOKEN_DA_CONEXAO" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999998888",
    "type": "buttons",
    "body": "Como prefere ser atendido?",
    "buttons": [
      { "id": "atend_1", "text": "Falar com humano" },
      { "id": "atend_2", "text": "Tirar dúvida no bot" }
    ]
  }'`}</CodeBlock>
            </section>
          </SectionCard>

          {/* Validar número */}
          <SectionCard>
            <section id="check-number" className={classes.section}>
              <h2 className={classes.h2}>
                <Users size={18} /> Validar número no WhatsApp
              </h2>
              <Endpoint method="POST" path="/api/messages/checkNumber" classes={classes} />
              <CodeBlock classes={classes}>{`curl -X POST "${baseUrl}/api/messages/checkNumber" \\
  -H "Authorization: Bearer SEU_TOKEN_DA_CONEXAO" \\
  -H "Content-Type: application/json" \\
  -d '{ "number": "5511999998888" }'

# Resposta
{ "exists": true, "jid": "5511999998888@s.whatsapp.net" }`}</CodeBlock>
            </section>
          </SectionCard>

          {/* v2 */}
          <SectionCard>
            <section id="v2" className={classes.section}>
              <h2 className={classes.h2}>
                <Code2 size={18} /> API v2 — autenticada por API Key
              </h2>
              <p className={classes.lead}>
                Versão moderna com escopos. Documentação Swagger disponível em{" "}
                <code>/api/v2/docs</code>.
              </p>

              <Endpoint method="GET" path="/api/v2/health" classes={classes} />
              <Endpoint method="GET" path="/api/v2/me" classes={classes} />
              <Endpoint method="POST" path="/api/v2/messages" classes={classes} />
              <Endpoint method="GET" path="/api/v2/campaigns" classes={classes} />
              <Endpoint method="POST" path="/api/v2/campaigns" classes={classes} />
              <Endpoint method="POST" path="/api/v2/contacts/bulk" classes={classes} />

              <h4 style={{ marginTop: 12 }}>Exemplo: enviar mensagem avulsa</h4>
              <ExampleTabs
                classes={classes}
                examples={{
                  cURL: `curl -X POST "${baseUrl}/api/v2/messages" \\
  -H "X-API-Key: lk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "whatsappId": 1,
    "number": "5511999998888",
    "message": "Olá da API v2"
  }'`,
                  "Node.js": `await axios.post(
  "${baseUrl}/api/v2/messages",
  { whatsappId: 1, number: "5511999998888", message: "Olá da API v2" },
  { headers: { "X-API-Key": "lk_live_xxx" } }
);`,
                  Python: `requests.post(
    "${baseUrl}/api/v2/messages",
    json={"whatsappId": 1, "number": "5511999998888", "message": "Olá da API v2"},
    headers={"X-API-Key": "lk_live_xxx"},
)`,
                }}
              />

              <div className={classes.callout}>
                <KeyRound size={16} />
                <div>
                  Gere e gerencie API Keys em <code>/api-keys</code>. Use
                  escopos mínimos por integração (princípio do menor
                  privilégio).
                </div>
              </div>
            </section>
          </SectionCard>

          {/* Webhooks */}
          <SectionCard>
            <section id="webhooks" className={classes.section}>
              <h2 className={classes.h2}>
                <Webhook size={18} /> Webhooks de eventos
              </h2>
              <p className={classes.lead}>
                Receba eventos de envio (<code>sent</code>, <code>delivered</code>,{" "}
                <code>read</code>, <code>replied</code>, <code>failed</code>) no
                seu servidor.
              </p>
              <Endpoint method="POST" path="/api/v2/webhooks" classes={classes} />
              <CodeBlock classes={classes}>{`curl -X POST "${baseUrl}/api/v2/webhooks" \\
  -H "X-API-Key: lk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://seu-servidor.com/wa/eventos",
    "events": ["sent","delivered","read","replied","failed"],
    "secret": "um_segredo_compartilhado"
  }'`}</CodeBlock>
              <p className={classes.lead}>
                Cada chamada inclui o header{" "}
                <code>X-Lovable-Signature: sha256=...</code> calculado com o{" "}
                <code>secret</code>. Valide antes de processar.
              </p>
            </section>
          </SectionCard>

          {/* Erros */}
          <SectionCard>
            <section id="errors" className={classes.section}>
              <h2 className={classes.h2}>
                <AlertCircle size={18} /> Códigos de erro
              </h2>
              <table className={classes.table}>
                <thead>
                  <tr>
                    <th className={classes.th}>HTTP</th>
                    <th className={classes.th}>Código</th>
                    <th className={classes.th}>Significado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["400", "VALIDATION_ERROR", "Corpo inválido ou faltando campos obrigatórios."],
                    ["401", "UNAUTHORIZED", "Token/API Key ausente ou inválido."],
                    ["403", "FORBIDDEN", "Sem escopo/permissão para o recurso."],
                    ["404", "NOT_FOUND", "Conexão, contato ou recurso não encontrado."],
                    ["409", "CONFLICT", "Estado incompatível (ex.: conexão desconectada)."],
                    ["429", "RATE_LIMITED", "Excesso de requisições. Reduza a taxa."],
                    ["502", "UPSTREAM_ERROR", "Falha ao falar com o WhatsApp."],
                    ["500", "SERVER_ERROR", "Erro inesperado no servidor."],
                  ].map(([h, c, d]) => (
                    <tr key={c}>
                      <td className={classes.td}>
                        <Chip
                          label={h}
                          size="small"
                          style={{
                            background: h.startsWith("4") ? "#fee2e2" : "#fef3c7",
                            color: h.startsWith("4") ? "#b91c1c" : "#92400e",
                            fontWeight: 700,
                          }}
                        />
                      </td>
                      <td className={classes.td}><code>{c}</code></td>
                      <td className={classes.td}>{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={classes.warn}>
                <AlertCircle size={16} />
                <div>
                  Toda resposta de erro segue o formato{" "}
                  <code>{`{ "error": "MENSAGEM", "code": "CODIGO" }`}</code>.
                </div>
              </div>
            </section>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
