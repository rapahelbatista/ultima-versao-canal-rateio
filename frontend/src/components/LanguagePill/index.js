import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Pill estilo "BR Português ▾" no topbar.
 *
 * Props:
 *  - value: code atual (ex.: "pt-BR")
 *  - options: [{ code, label }]
 *  - onChange: (code) => void
 */
const FLAGS = {
  "pt-BR": "🇧🇷",
  pt: "🇧🇷",
  en: "🇺🇸",
  es: "🇪🇸",
  ar: "🇸🇦",
  tr: "🇹🇷",
};

const SHORT = {
  "pt-BR": "BR",
  pt: "BR",
  en: "EN",
  es: "ES",
  ar: "AR",
  tr: "TR",
};

const LanguagePill = ({ value, options = [], onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const current =
    options.find((o) => o.code === value) || options[0] || { code: "pt-BR", label: "Português" };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
          color: "#0f172a",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          lineHeight: 1,
        }}
        title="Selecionar idioma"
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            fontSize: 11,
            fontWeight: 700,
            color: "#334155",
          }}
        >
          {SHORT[current.code] || current.code.slice(0, 2).toUpperCase()}
        </span>
        <span>{current.label}</span>
        <ChevronDown size={14} style={{ opacity: 0.65 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 200,
            background: "#fff",
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
            padding: 6,
            zIndex: 1300,
          }}
        >
          {options.map((opt) => {
            const active = opt.code === current.code;
            return (
              <button
                key={opt.code}
                onClick={() => {
                  setOpen(false);
                  onChange?.(opt.code);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "8px 10px",
                  border: "none",
                  background: active ? "#f1f5f9" : "transparent",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#0f172a",
                  fontWeight: active ? 600 : 500,
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 16 }}>{FLAGS[opt.code] || "🌐"}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguagePill;
