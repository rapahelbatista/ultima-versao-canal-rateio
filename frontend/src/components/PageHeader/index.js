import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";

/**
 * PageHeader compartilhado do modo Campanhas / WhatsApp.
 * Padrão visual:
 *  - Card branco com borda e sombra suave
 *  - Ícone arredondado verde-água à esquerda
 *  - Título (h1) + subtítulo
 *  - Slot `actions` à direita (botões/links)
 *
 * Props:
 *  - icon: ReactNode (ex: <Send size={20} />)
 *  - title: string
 *  - subtitle: string
 *  - actions: ReactNode opcional
 */
const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius * 2,
    background: "#fff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      alignItems: "flex-start",
      padding: theme.spacing(2),
    },
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "#d1fae5",
    color: "#059669",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: 700,
    fontSize: "1.125rem",
    color: "#1e293b",
    lineHeight: 1.2,
    margin: 0,
    [theme.breakpoints.down("xs")]: { fontSize: "1rem" },
  },
  subtitle: {
    marginTop: 4,
    fontSize: "0.8125rem",
    color: "#64748b",
    lineHeight: 1.4,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    flexWrap: "wrap",
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      "& > *": { flex: 1 },
    },
  },
}));

const PageHeader = ({ icon, title, subtitle, actions }) => {
  const classes = useStyles();
  return (
    <header className={classes.root}>
      {icon && <div className={classes.iconBox}>{icon}</div>}
      <div className={classes.textWrap}>
        <Typography variant="h1" className={classes.title}>
          {title}
        </Typography>
        {subtitle && (
          <div className={classes.subtitle}>{subtitle}</div>
        )}
      </div>
      {actions && <div className={classes.actions}>{actions}</div>}
    </header>
  );
};

export default PageHeader;
