import { ArrowForwardIos } from "@mui/icons-material";
import React, { memo, useState, useEffect, useRef } from "react";
import { Handle } from "react-flow-renderer";
import HubIcon from "@mui/icons-material/Hub";
import DataObjectIcon from "@mui/icons-material/DataObject";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CodeIcon from "@mui/icons-material/Code";

const ORIGINS = [
  { value: "chatbot", label: "Chatbot" },
  { value: "webhook", label: "Webhook Automation" },
];

const VARIABLES = [
  "{{{senderName}}}",
  "{{{senderMessage}}}",
  "{{{senderMobile}}}",
];

export default memo(({ data, isConnectable, id }) => {
  const [origin, setOrigin] = useState(data?.origin || "chatbot");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // persistir no nó (data) sem disparar reset
    if (data && origin !== data.origin) {
      data.origin = origin;
    }
  }, [origin, data]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedLabel =
    ORIGINS.find((o) => o.value === origin)?.label || "Chatbot";

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "14px 16px 16px",
        borderRadius: "16px",
        boxShadow:
          "0 0 0 1px rgba(58,186,56,0.55), 0 8px 24px -8px rgba(58,186,56,0.35)",
        border: "1px solid rgba(58,186,56,0.45)",
        minWidth: 320,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(58,186,56,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HubIcon style={{ fontSize: 18, color: "#1f7d1d" }} />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#1f7d1d",
              letterSpacing: 0.2,
            }}
          >
            Nó Inicial
          </span>
        </div>
        <span
          style={{
            background: "rgba(58,186,56,0.18)",
            color: "#1f7d1d",
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 999,
          }}
        >
          Chatbot de WA
        </span>
      </div>

      {/* Origem */}
      <div
        ref={wrapperRef}
        style={{
          position: "relative",
          border: "1px solid rgba(58,186,56,0.35)",
          borderRadius: 28,
          padding: "8px 14px 6px",
          background: "#FFFFFF",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: -9,
            left: 14,
            background: "#FFFFFF",
            padding: "0 6px",
            color: "#1f7d1d",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Origem
        </span>
        <div
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            paddingTop: 2,
          }}
        >
          <span style={{ fontSize: 16, color: "#222", fontWeight: 500 }}>
            {selectedLabel}
          </span>
          {open ? (
            <KeyboardArrowUpIcon style={{ color: "#666" }} />
          ) : (
            <KeyboardArrowDownIcon style={{ color: "#666" }} />
          )}
        </div>
        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 8,
              right: 8,
              marginTop: 6,
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            {ORIGINS.map((o) => (
              <div
                key={o.value}
                onClick={() => {
                  setOrigin(o.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  background:
                    o.value === origin ? "rgba(58,186,56,0.10)" : "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(58,186,56,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    o.value === origin ? "rgba(58,186,56,0.10)" : "transparent")
                }
              >
                <CodeIcon style={{ fontSize: 16, color: "#1f7d1d" }} />
                <span style={{ fontSize: 14, color: "#222" }}>{o.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variáveis Disponíveis */}
      <div
        style={{
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 14,
          padding: "10px 12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <DataObjectIcon style={{ fontSize: 16, color: "#4f46e5" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>
            Variáveis Disponíveis
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {VARIABLES.map((v) => (
            <span
              key={v}
              style={{
                fontFamily:
                  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11,
                color: "#1f7d1d",
                background: "rgba(58,186,56,0.10)",
                border: "1px solid rgba(58,186,56,0.30)",
                padding: "3px 8px",
                borderRadius: 999,
              }}
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#3aba38",
          width: "16px",
          height: "16px",
          top: "50%",
          right: "-9px",
          cursor: "pointer",
          border: "2px solid #fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffff",
            width: "8px",
            height: "8px",
            marginLeft: "2.5px",
            marginBottom: "1px",
            pointerEvents: "none",
          }}
        />
      </Handle>
    </div>
  );
});
