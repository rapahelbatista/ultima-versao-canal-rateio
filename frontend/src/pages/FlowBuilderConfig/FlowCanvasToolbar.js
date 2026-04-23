import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

import SaveIcon from "@mui/icons-material/Save";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import HubIcon from "@mui/icons-material/Hub";
import MoreVertIcon from "@mui/icons-material/MoreVert";

/* ============================================================
 * FlowCanvasToolbar
 * - Pill toolbar (top-right) with: Salvar / Novo / Importar / Fluxos / Menu de Nós
 * - Right drawer "Menu de Nós" with chips and search
 * - Left drawer "Flows" with search and saved flows
 * ============================================================ */

const PILL_BTN = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  background: "rgba(58,186,56,0.15)",
  color: "#1f7d1d",
  transition: "all .15s ease",
};

const Tooltip = ({ label, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f172a",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1600,
            fontFamily: "Inter, system-ui, sans-serif",
            boxShadow: "0 6px 16px rgba(15,23,42,0.25)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -4,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 8,
              height: 8,
              background: "#0f172a",
              borderRadius: 1,
            }}
          />
          {label}
        </div>
      )}
    </div>
  );
};

/* -------- Node categories for the right drawer -------- */
const NODE_CATALOG = [
  {
    key: "sendMessage",
    name: "Enviar Mensagem",
    desc: "Enviar texto, mídia ou mensagens interativas",
    cat: "message",
    type: "text",
    color: "#22c55e",
    icon: "send",
  },
  {
    key: "wa-template",
    name: "Send WA Template",
    desc: "Send an approved WhatsApp message template",
    cat: "message",
    type: "interactiveMenu",
    color: "#22c55e",
    icon: "wa",
  },
  {
    key: "condition",
    name: "Condição",
    desc: "Rotear com base em condições",
    cat: "logic",
    type: "conditionCompare",
    color: "#22c55e",
    icon: "branch",
  },
  {
    key: "saveAnswer",
    name: "Salvar Resposta",
    desc: "Salvar resposta em variáveis",
    cat: "input",
    type: "variable",
    color: "#3b82f6",
    icon: "save",
  },
  {
    key: "disableAuto",
    name: "Desativar Resposta Automática",
    desc: "Desativa temporariamente a resposta automática",
    cat: "logic",
    type: "attendant",
    color: "#ef4444",
    icon: "off",
  },
  {
    key: "request",
    name: "Fazer Requisição",
    desc: "Chamar APIs externas",
    cat: "request",
    type: "httpRequest",
    color: "#3b82f6",
    icon: "http",
  },
  {
    key: "delay",
    name: "Atraso",
    desc: "Pausar o fluxo pelo número especificado de segundos",
    cat: "logic",
    type: "interval",
    color: "#f59e0b",
    icon: "clock",
  },
  {
    key: "resetSession",
    name: "Redefinir Sessão",
    desc: "Limpar todas as variáveis salvas",
    cat: "logic",
    type: "variable",
    color: "#22c55e",
    icon: "refresh",
  },
  {
    key: "email",
    name: "Enviar E-mail",
    desc: "Enviar um e-mail via SMTP",
    cat: "request",
    type: "httpRequest",
    color: "#3b82f6",
    icon: "mail",
  },
  {
    key: "gsheet",
    name: "Google Sheets",
    desc: "Escrever dados no Google Sheets",
    cat: "request",
    type: "httpRequest",
    color: "#22c55e",
    icon: "sheet",
  },
  {
    key: "agent",
    name: "Transferência para Agente",
    desc: "Passar para um agente humano",
    cat: "logic",
    type: "attendant",
    color: "#f59e0b",
    icon: "agent",
  },
  {
    key: "ai-transfer",
    name: "Transferência para IA",
    desc: "Passar para assistente de IA",
    cat: "logic",
    type: "openai",
    color: "#22c55e",
    icon: "ai",
    pro: true,
  },
  {
    key: "mysql",
    name: "Consulta MySQL",
    desc: "Executar uma consulta no banco de dados MySQL",
    cat: "request",
    type: "httpRequest",
    color: "#3b82f6",
    icon: "db",
  },
  {
    key: "input",
    name: "Campo de Entrada",
    desc: "Coletar entrada do usuário",
    cat: "input",
    type: "input",
    color: "#3b82f6",
    icon: "input",
  },
];

const FILTERS = [
  { key: "all", label: "Todos", color: "#16a34a", solid: true },
  { key: "message", label: "Mensagem", color: "#16a34a" },
  { key: "request", label: "Requisição", color: "#6366f1" },
  { key: "input", label: "Campo de Entrada", color: "#f59e0b" },
  { key: "logic", label: "Lógica", color: "#f59e0b" },
];

const NodeIcon = ({ icon, color }) => {
  // simple unicode/emoji-ish glyphs to match the mock without adding deps
  const glyph = {
    send: "▶",
    wa: "✆",
    branch: "⇄",
    save: "💾",
    off: "⏻",
    http: "{ }",
    clock: "⏱",
    refresh: "↻",
    mail: "✉",
    sheet: "▦",
    agent: "👤",
    ai: "✶",
    db: "≡",
    input: "✎",
  }[icon] || "•";
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: `${color}1a`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {glyph}
    </div>
  );
};

const FlowCanvasToolbar = ({
  flowName = "Untitled",
  onRenameFlow,
  onSave,
  onAddNode,
  currentFlowId,
  categories, // catálogo testado vindo do FlowBuilderConfig (nodeCategories)
}) => {
  const history = useHistory();

  const [name, setName] = useState(flowName);
  useEffect(() => setName(flowName), [flowName]);

  const [nodesOpen, setNodesOpen] = useState(false);
  const [flowsOpen, setFlowsOpen] = useState(false);

  const [nodeFilter, setNodeFilter] = useState("all");
  const [nodeSearch, setNodeSearch] = useState("");

  const [flows, setFlows] = useState([]);
  const [flowSearch, setFlowSearch] = useState("");
  const [loadingFlows, setLoadingFlows] = useState(false);

  // Load flows whenever Flows drawer opens
  useEffect(() => {
    if (!flowsOpen) return;
    let active = true;
    (async () => {
      setLoadingFlows(true);
      try {
        const { data } = await api.get("/flowbuilder");
        if (active) setFlows(data?.flows || []);
      } catch (err) {
        toastError(err);
      } finally {
        if (active) setLoadingFlows(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [flowsOpen]);

  // ====== Catálogo: usa "categories" testado quando existir ======
  const useTestedCatalog = Array.isArray(categories) && categories.length > 0;

  const dynamicFilters = useMemo(() => {
    if (!useTestedCatalog) return FILTERS;
    const palette = ["#16a34a", "#6366f1", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6"];
    return [
      { key: "all", label: "Todos", color: "#16a34a", solid: true },
      ...categories.map((c, i) => ({
        key: c.name,
        label: c.name,
        color: palette[i % palette.length],
      })),
    ];
  }, [categories, useTestedCatalog]);

  const flatNodesFromCategories = useMemo(() => {
    if (!useTestedCatalog) return [];
    const palette = ["#16a34a", "#6366f1", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6"];
    const out = [];
    categories.forEach((cat, i) => {
      const color = palette[i % palette.length];
      (cat.nodes || []).forEach((n) => {
        out.push({
          key: `${cat.name}-${n.type}`,
          name: n.name,
          desc: n.description || "",
          cat: cat.name,
          type: n.type,
          color,
          iconNode: n.icon, // ReactNode pronto vindo do catálogo testado
        });
      });
    });
    return out;
  }, [categories, useTestedCatalog]);

  const filteredNodes = useMemo(() => {
    const source = useTestedCatalog ? flatNodesFromCategories : NODE_CATALOG;
    return source.filter((n) => {
      if (nodeFilter !== "all" && n.cat !== nodeFilter) return false;
      if (nodeSearch.trim()) {
        const q = nodeSearch.toLowerCase();
        return (
          n.name.toLowerCase().includes(q) ||
          (n.desc || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [nodeFilter, nodeSearch, useTestedCatalog, flatNodesFromCategories]);

  const filteredFlows = useMemo(() => {
    if (!flowSearch.trim()) return flows;
    const q = flowSearch.toLowerCase();
    return flows.filter((f) => (f.name || "").toLowerCase().includes(q));
  }, [flows, flowSearch]);

  const handleNewFlow = async () => {
    try {
      const { data } = await api.post("/flowbuilder", {
        name: `Novo Fluxo ${new Date().toLocaleString("pt-BR")}`,
      });
      const newId = data?.flow?.id || data?.id;
      toast.success("Novo fluxo criado");
      if (newId) history.push(`/flowbuilder-config/${newId}`);
      else window.location.reload();
    } catch (err) {
      toastError(err);
    }
  };

  const handleImport = () => {
    toast.info("Importar Modelos: em breve");
  };

  const handleRename = () => {
    if (onRenameFlow && name && name !== flowName) onRenameFlow(name);
  };

  return (
    <>
      {/* ============ TOOLBAR PILL (top-right) ============ */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: 6,
          background: "#FFFFFF",
          borderRadius: 999,
          boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
          border: "1px solid rgba(15,23,42,0.06)",
          zIndex: 1200,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="Untitled"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 13,
            fontWeight: 600,
            color: "#1f7d1d",
            padding: "0 14px",
            width: 130,
          }}
        />

        <Tooltip label="Salvar Fluxo">
          <button
            style={PILL_BTN}
            onClick={onSave}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(58,186,56,0.28)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(58,186,56,0.15)")
            }
          >
            <SaveIcon style={{ fontSize: 18 }} />
          </button>
        </Tooltip>

        <Tooltip label="Novo Fluxo">
          <button
            style={{
              ...PILL_BTN,
              background: "rgba(245,158,11,0.18)",
              color: "#b45309",
            }}
            onClick={handleNewFlow}
          >
            <AutorenewIcon style={{ fontSize: 18 }} />
          </button>
        </Tooltip>

        <Tooltip label="Importar Modelos">
          <button style={PILL_BTN} onClick={handleImport}>
            <CloudUploadIcon style={{ fontSize: 18 }} />
          </button>
        </Tooltip>

        <Tooltip label="Fluxos">
          <button style={PILL_BTN} onClick={() => setFlowsOpen(true)}>
            <LibraryBooksIcon style={{ fontSize: 18 }} />
          </button>
        </Tooltip>

        <Tooltip label="Menu de Nós">
          <button style={PILL_BTN} onClick={() => setNodesOpen(true)}>
            <KeyboardDoubleArrowLeftIcon style={{ fontSize: 18 }} />
          </button>
        </Tooltip>
      </div>

      {/* ============ RIGHT DRAWER — MENU DE NÓS ============ */}
      {nodesOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 360,
            background: "#FFFFFF",
            borderLeft: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "-12px 0 30px rgba(15,23,42,0.06)",
            zIndex: 1300,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(15,23,42,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HubIcon style={{ color: "#1f7d1d" }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                Menu de Nós
              </span>
            </div>
            <button
              onClick={() => setNodesOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          <div style={{ padding: "10px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#F1F5F9",
                borderRadius: 999,
                padding: "8px 12px",
              }}
            >
              <SearchIcon style={{ fontSize: 18, color: "#64748b" }} />
              <input
                placeholder="Buscar nós..."
                value={nodeSearch}
                onChange={(e) => setNodeSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  flex: 1,
                  fontSize: 13,
                  color: "#0f172a",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 12,
              }}
            >
              {FILTERS.map((f) => {
                const active = nodeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setNodeFilter(f.key)}
                    style={{
                      border: `1px solid ${f.color}`,
                      color: active ? "#fff" : f.color,
                      background: active ? f.color : "transparent",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "4px 12px 16px",
            }}
          >
            {filteredNodes.map((n) => (
              <div
                key={n.key}
                onClick={() => {
                  if (onAddNode) onAddNode(n.type);
                  setNodesOpen(false);
                }}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                  marginBottom: 4,
                  background: "transparent",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F8FAFC")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <NodeIcon icon={n.icon} color={n.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {n.name}
                    {n.pro && (
                      <span
                        style={{
                          background: "#fef3c7",
                          color: "#b45309",
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 999,
                          fontWeight: 700,
                        }}
                      >
                        PRO
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#64748b",
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {n.desc}
                  </div>
                </div>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: n.color,
                    marginTop: 10,
                    flexShrink: 0,
                  }}
                />
              </div>
            ))}
            {filteredNodes.length === 0 && (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                Nenhum nó encontrado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ LEFT DRAWER — FLOWS ============ */}
      {flowsOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 280,
            background: "#FFFFFF",
            borderRight: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "12px 0 30px rgba(15,23,42,0.06)",
            zIndex: 1300,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(15,23,42,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HubIcon style={{ color: "#1f7d1d" }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                Flows
              </span>
              <span
                style={{
                  background: "rgba(58,186,56,0.15)",
                  color: "#1f7d1d",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {flows.length}
              </span>
            </div>
            <button
              onClick={() => setFlowsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          <div style={{ padding: "10px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#F1F5F9",
                borderRadius: 999,
                padding: "8px 12px",
              }}
            >
              <SearchIcon style={{ fontSize: 18, color: "#64748b" }} />
              <input
                placeholder="Buscar fluxos..."
                value={flowSearch}
                onChange={(e) => setFlowSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  flex: 1,
                  fontSize: 13,
                  color: "#0f172a",
                }}
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "4px 12px 16px",
            }}
          >
            {loadingFlows && (
              <div
                style={{
                  padding: 16,
                  fontSize: 13,
                  color: "#64748b",
                  textAlign: "center",
                }}
              >
                Carregando...
              </div>
            )}
            {!loadingFlows && filteredFlows.length === 0 && (
              <div
                style={{
                  padding: 16,
                  fontSize: 13,
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                Nenhum fluxo encontrado.
              </div>
            )}
            {filteredFlows.map((f) => {
              const active = String(f.id) === String(currentFlowId);
              const initial = (f.name || "F").charAt(0).toUpperCase();
              const nodesCount =
                f?.flow?.nodes?.length ?? f?.nodesCount ?? "—";
              return (
                <div
                  key={f.id}
                  onClick={() =>
                    history.push(`/flowbuilder-config/${f.id}`)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px",
                    borderRadius: 12,
                    cursor: "pointer",
                    marginBottom: 4,
                    background: active
                      ? "rgba(58,186,56,0.10)"
                      : "transparent",
                    border: active
                      ? "1px solid rgba(58,186,56,0.35)"
                      : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      e.currentTarget.style.background = "#F8FAFC";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(58,186,56,0.18)",
                      color: "#1f7d1d",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {f.name || "sem nome"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>
                        {f.updatedAt
                          ? new Date(f.updatedAt).toLocaleDateString("pt-BR")
                          : ""}
                      </span>
                      <span
                        style={{
                          background: "rgba(99,102,241,0.10)",
                          color: "#4f46e5",
                          padding: "1px 6px",
                          borderRadius: 999,
                          fontWeight: 700,
                        }}
                      >
                        {nodesCount} nodes
                      </span>
                    </div>
                  </div>
                  <MoreVertIcon style={{ color: "#94a3b8", fontSize: 18 }} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default FlowCanvasToolbar;
