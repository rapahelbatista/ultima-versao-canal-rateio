import React, { useEffect, useRef, useState } from "react";
import { User as UserIcon, CreditCard, LogOut, ChevronRight, Sparkles, Lock } from "lucide-react";

/**
 * Menu de perfil moderno (estilo card) acionado pelo avatar.
 *
 * Props:
 *  - name: string
 *  - email: string
 *  - avatarUrl: string
 *  - isPro?: boolean — controla badge "Pro" e desbloqueio das ações Pro.
 *  - subscriptionLabel?: string — rótulo dinâmico do item de assinatura
 *      (ex.: "Ver assinatura" ou "Fazer upgrade ✨").
 *  - proActions?: Array<{ key, label, icon, onClick }> — ações exclusivas Pro.
 *      Quando isPro=false, exibimos as mesmas ações com cadeado e clique
 *      redirecionado para onSubscription.
 *  - onProfile?: () => void
 *  - onSubscription?: () => void
 *  - onLogout?: () => void
 */
const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "U";

const UserProfileMenu = ({
  name = "Usuário",
  email = "",
  avatarUrl,
  isPro = false,
  subscriptionLabel,
  proActions = [],
  onProfile,
  onSubscription,
  onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const Avatar = ({ size = 36, ring = false }) => (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "linear-gradient(135deg, #34d399 0%, #10b981 50%, #14b8a6 100%)",
        padding: ring ? 3 : 0,
        boxShadow: ring ? "0 0 0 3px rgba(167,139,250,0.55)" : "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: avatarUrl ? `url(${avatarUrl}) center/cover no-repeat` : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: size * 0.38,
          letterSpacing: 0.5,
        }}
      >
        {!avatarUrl && initialsOf(name)}
      </div>
      <span
        style={{
          position: "absolute",
          right: -1,
          bottom: -1,
          width: Math.max(8, size * 0.22),
          height: Math.max(8, size * 0.22),
          borderRadius: "50%",
          background: "#22c55e",
          border: "2px solid #fff",
        }}
      />
    </div>
  );

  const itemBase = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "12px 14px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 10,
    textAlign: "left",
  };

  const iconWrap = (bg, color) => ({
    width: 30,
    height: 30,
    borderRadius: 8,
    background: bg,
    color,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          borderRadius: "50%",
        }}
        aria-label="Abrir menu de perfil"
      >
        <Avatar size={36} ring />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 280,
            background: "#fff",
            borderRadius: 16,
            boxShadow:
              "0 20px 50px rgba(15,23,42,0.18), 0 4px 12px rgba(15,23,42,0.06)",
            border: "1px solid rgba(15,23,42,0.06)",
            padding: 10,
            zIndex: 1300,
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 8px 14px",
            }}
          >
            <Avatar size={48} ring />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: 1.1,
                  }}
                >
                  {name}
                </span>
                {isPro && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      background:
                        "linear-gradient(135deg, #fde68a, #fbbf24)",
                      color: "#78350f",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 999,
                      letterSpacing: 0.3,
                    }}
                  >
                    🔒 Pro
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  marginTop: 3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={email}
              >
                {email}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(15,23,42,0.06)", margin: "2px 4px 6px" }} />

          <button
            style={itemBase}
            onClick={() => {
              setOpen(false);
              onProfile?.();
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={iconWrap("#dcfce7", "#15803d")}>
              <UserIcon size={16} />
            </span>
            <span style={{ flex: 1 }}>Perfil</span>
            <ChevronRight size={16} style={{ color: "#94a3b8" }} />
          </button>

          {onSubscription && (
            <button
              style={itemBase}
              onClick={() => {
                setOpen(false);
                onSubscription?.();
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={iconWrap(isPro ? "#fef3c7" : "#ede9fe", isPro ? "#b45309" : "#6d28d9")}>
                {isPro ? <CreditCard size={16} /> : <Sparkles size={16} />}
              </span>
              <span style={{ flex: 1 }}>
                {subscriptionLabel || (isPro ? "Ver assinatura" : "Fazer upgrade ✨")}
              </span>
              <ChevronRight size={16} style={{ color: "#94a3b8" }} />
            </button>
          )}

          {proActions.length > 0 && (
            <>
              <div style={{ height: 1, background: "rgba(15,23,42,0.06)", margin: "6px 4px" }} />
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "#94a3b8",
                  padding: "4px 14px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Sparkles size={10} /> Recursos Pro
              </div>
              {proActions.map((a) => {
                const Ic = a.icon || Sparkles;
                const locked = !isPro;
                return (
                  <button
                    key={a.key}
                    style={{
                      ...itemBase,
                      opacity: locked ? 0.85 : 1,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setOpen(false);
                      if (locked) onSubscription?.();
                      else a.onClick?.();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    title={locked ? "Disponível no plano Pro" : a.label}
                  >
                    <span style={iconWrap("#fef3c7", "#b45309")}>
                      <Ic size={16} />
                    </span>
                    <span style={{ flex: 1 }}>{a.label}</span>
                    {locked ? (
                      <Lock size={14} style={{ color: "#94a3b8" }} />
                    ) : (
                      <ChevronRight size={16} style={{ color: "#94a3b8" }} />
                    )}
                  </button>
                );
              })}
            </>
          )}

          <div style={{ height: 1, background: "rgba(15,23,42,0.06)", margin: "6px 4px" }} />

          <button
            style={{ ...itemBase, color: "#dc2626", fontWeight: 600 }}
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={iconWrap("#fee2e2", "#dc2626")}>
              <LogOut size={16} />
            </span>
            <span style={{ flex: 1 }}>Sair</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;
