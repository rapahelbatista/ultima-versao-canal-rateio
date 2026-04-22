import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { HelpCircle, ChevronDown } from "lucide-react";

const useStyles = makeStyles(() => ({
  wrap: { display: "flex", flexDirection: "column", gap: 10 },
  title: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    margin: "8px 0 4px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  sub: { fontSize: 12, color: "#64748b", marginBottom: 12 },
  list: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
  },
  item: { borderBottom: "1px solid #f1f5f9", "&:last-child": { borderBottom: "none" } },
  q: {
    width: "100%",
    background: "transparent",
    border: "none",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    gap: 12,
    "&:hover": { background: "#f8fafc" },
  },
  qLeft: { display: "inline-flex", alignItems: "center", gap: 10 },
  badge: {
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#4338ca",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chev: { transition: "transform .2s", color: "#64748b", flexShrink: 0 },
  chevOpen: { transform: "rotate(180deg)" },
  a: {
    padding: "0 18px 16px 46px",
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.55,
  },
}));

const FAQ_ITEMS = [
  {
    cat: "Cobrança",
    q: "Como funciona a cobrança da assinatura?",
    a: "A cobrança é mensal e recorrente, baseada no plano que você escolheu. Uma nova fatura é gerada automaticamente próximo ao vencimento e fica disponível no histórico de faturas desta página.",
  },
  {
    cat: "Cobrança",
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos PIX, boleto bancário e cartão de crédito. Ao clicar em \"Pagar\" em uma fatura ou \"Assinar\" em um plano, você é direcionado ao checkout para escolher a forma de pagamento.",
  },
  {
    cat: "Cobrança",
    q: "Quando minha fatura é gerada?",
    a: "A fatura do próximo ciclo é gerada automaticamente alguns dias antes do vencimento. Você pode acompanhar a data exata no painel de resumo (\"Próximo ciclo\") no topo desta página.",
  },
  {
    cat: "Assinatura",
    q: "Posso fazer upgrade ou downgrade de plano?",
    a: "Sim, a qualquer momento. Basta escolher o plano desejado em \"Planos disponíveis\" e clicar em \"Assinar\". A diferença de valor é refletida na próxima fatura.",
  },
  {
    cat: "Assinatura",
    q: "Como funcionam os usuários adicionais?",
    a: "Cada plano inclui um número base de usuários. Você pode adicionar assentos extras pelo seletor (− / +) dentro do card do plano — cada usuário extra custa R$ 11/mês e o preço é recalculado em tempo real.",
  },
  {
    cat: "Cancelamento",
    q: "Como faço para cancelar minha assinatura?",
    a: "Para cancelar, basta deixar de pagar a próxima fatura ou entrar em contato com o suporte. Após o vencimento sem pagamento, o acesso é suspenso até a regularização ou encerramento definitivo.",
  },
  {
    cat: "Cancelamento",
    q: "O que acontece com meus dados se eu cancelar?",
    a: "Seus dados ficam preservados por um período de carência após o cancelamento, permitindo a reativação. Após esse período, podem ser removidos permanentemente conforme nossa política de privacidade.",
  },
  {
    cat: "Suporte",
    q: "E se minha fatura vencer?",
    a: "Se o pagamento atrasar, sua assinatura entra em status \"Vencido\" e o acesso pode ser limitado. Basta pagar a fatura em aberto pelo botão \"Pagar\" no histórico para reativar imediatamente.",
  },
];

export default function BillingFAQ() {
  const classes = useStyles();
  const [open, setOpen] = useState(0);

  return (
    <div className={classes.wrap}>
      <div className={classes.title}>
        <HelpCircle size={16} /> Perguntas frequentes
      </div>
      <div className={classes.sub}>
        Tire suas dúvidas sobre cobrança, assinatura e cancelamento.
      </div>
      <div className={classes.list}>
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className={classes.item}>
              <button
                type="button"
                className={classes.q}
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
              >
                <span className={classes.qLeft}>
                  <span className={classes.badge}>{item.cat}</span>
                  {item.q}
                </span>
                <ChevronDown
                  size={18}
                  className={`${classes.chev} ${isOpen ? classes.chevOpen : ""}`}
                />
              </button>
              {isOpen && <div className={classes.a}>{item.a}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
