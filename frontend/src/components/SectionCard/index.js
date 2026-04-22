import React from "react";
import { makeStyles } from "@material-ui/core/styles";

/**
 * SectionCard — wrapper branco padronizado para seções.
 * Usado em todas as telas do modo Campanhas/WhatsApp.
 */
const useStyles = makeStyles((theme) => ({
  root: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    padding: theme.spacing(2.5),
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(2),
    },
  },
  withIcon: {
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1.5),
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0 },
  title: {
    fontWeight: 700,
    fontSize: "0.9375rem",
    color: "#1e293b",
    lineHeight: 1.2,
  },
  subtitle: {
    marginTop: 2,
    fontSize: "0.8125rem",
    color: "#64748b",
    lineHeight: 1.4,
  },
}));

const TONES = {
  emerald: { bg: "#d1fae5", color: "#059669" },
  amber:   { bg: "#fef3c7", color: "#d97706" },
  sky:     { bg: "#dbeafe", color: "#2563eb" },
  violet:  { bg: "#ede9fe", color: "#7c3aed" },
  rose:    { bg: "#ffe4e6", color: "#e11d48" },
  slate:   { bg: "#f1f5f9", color: "#475569" },
};

const SectionCard = ({
  icon,
  tone = "emerald",
  title,
  subtitle,
  actions,
  children,
  className = "",
  style,
}) => {
  const classes = useStyles();
  const t = TONES[tone] || TONES.emerald;

  if (!icon && !title && !subtitle && !actions) {
    return (
      <section className={`${classes.root} ${className}`.trim()} style={style}>
        {children}
      </section>
    );
  }

  return (
    <section className={`${classes.root} ${className}`.trim()} style={style}>
      <div className={classes.withIcon}>
        {icon && (
          <div
            className={classes.iconBox}
            style={{ background: t.bg, color: t.color }}
          >
            {icon}
          </div>
        )}
        <div className={classes.body}>
          {title && <div className={classes.title}>{title}</div>}
          {subtitle && <div className={classes.subtitle}>{subtitle}</div>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children && (
        <div style={{ marginTop: 16 }}>{children}</div>
      )}
    </section>
  );
};

export default SectionCard;
