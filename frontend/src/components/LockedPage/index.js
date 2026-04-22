import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Lock, ShieldAlert } from "lucide-react";

const useStyles = makeStyles(() => ({
  wrap: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    border: "1px solid #f1f5f9",
    borderRadius: 16,
    padding: 32,
    textAlign: "center",
    boxShadow: "0 10px 30px -15px rgba(15,23,42,0.15)",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #fee2e2, #fecaca)",
    color: "#b91c1c",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.6,
    marginBottom: 16,
  },
  hint: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
}));

/**
 * Tela de bloqueio padrão para recursos restritos por permissão.
 * Mantém o item visível na sidebar, mas com cadeado e mensagem clara.
 */
const LockedPage = ({
  title = "Acesso restrito",
  description = "Este recurso só está disponível para super usuários ou administradores da empresa. Solicite acesso ao responsável pela conta.",
  resource = "Recurso restrito",
}) => {
  const classes = useStyles();
  return (
    <div className={classes.wrap}>
      <div className={classes.card}>
        <div className={classes.iconWrap}>
          <Lock size={28} />
        </div>
        <div className={classes.title}>{title}</div>
        <div className={classes.desc}>{description}</div>
        <span className={classes.hint}>
          <ShieldAlert size={12} />
          {resource}
        </span>
      </div>
    </div>
  );
};

export default LockedPage;
