import React from "react";
import { CloudOff, CloudUpload, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Indicador unificado de status de sincronização para auto-save.
 *
 * Props:
 *  - status: "idle" | "saving" | "saved" | "error"
 *  - lastSavedAt: number (timestamp ms) — opcional
 *  - errorMessage: string — opcional
 *  - onRetry: () => void — opcional, exibe botão "tentar novamente" quando em erro
 */
const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const baseStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid transparent",
  whiteSpace: "nowrap",
};

const TONES = {
  idle: { color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
  saving: { color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
  saved: { color: "#047857", bg: "#d1fae5", border: "#a7f3d0" },
  error: { color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
};

const SyncStatusBadge = ({ status = "idle", lastSavedAt, errorMessage, onRetry }) => {
  const tone = TONES[status] || TONES.idle;
  const style = {
    ...baseStyle,
    color: tone.color,
    background: tone.bg,
    borderColor: tone.border,
  };

  if (status === "saving") {
    return (
      <span style={style} title="Sincronizando alterações...">
        <CloudUpload size={12} />
        Salvando…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span style={style} title={lastSavedAt ? `Última sincronização: ${fmtTime(lastSavedAt)}` : ""}>
        <CheckCircle2 size={12} />
        Salvo {lastSavedAt ? `às ${fmtTime(lastSavedAt)}` : ""}
      </span>
    );
  }

  if (status === "error") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={style} title={errorMessage || "Erro ao sincronizar"}>
          <AlertCircle size={12} />
          Erro ao salvar
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: "#b91c1c",
              background: "transparent",
              border: "1px solid #fecaca",
              borderRadius: 999,
              padding: "3px 8px",
              cursor: "pointer",
            }}
            title="Tentar sincronizar novamente"
          >
            <RefreshCw size={11} />
            Tentar novamente
          </button>
        )}
      </span>
    );
  }

  return (
    <span style={style}>
      <CloudOff size={12} />
      Sem alterações
    </span>
  );
};

export default SyncStatusBadge;
