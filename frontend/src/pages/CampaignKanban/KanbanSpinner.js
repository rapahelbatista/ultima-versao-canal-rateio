import React from "react";
import { Loader2 } from "lucide-react";

/**
 * KanbanSpinner
 * Indicador de carregamento dedicado do CampaignKanban.
 * Usa a keyframe global `kanban-spin` definida em assets/style.css.
 *
 * Props:
 *  - size: tamanho em px (default 16)
 *  - color: cor do ícone (default "currentColor")
 *  - label: texto opcional ao lado do spinner
 *  - inline: se true, renderiza inline-flex ao invés de flex
 *  - className: classe extra opcional
 *  - style: estilo extra opcional
 */
const KanbanSpinner = ({
  size = 16,
  color = "currentColor",
  label,
  inline = false,
  className = "",
  style = {},
}) => {
  return (
    <span
      className={`kanban-spinner ${className}`.trim()}
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        gap: label ? 8 : 0,
        color,
        ...style,
      }}
      role="status"
      aria-live="polite"
      aria-label={label || "Carregando"}
    >
      <Loader2
        size={size}
        className="kanban-spin"
        style={{ flexShrink: 0 }}
      />
      {label && (
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      )}
    </span>
  );
};

export default KanbanSpinner;
