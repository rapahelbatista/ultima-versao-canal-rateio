import { Button } from "@/components/ui/button";
import { Check, Star, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Ideal para pequenos negócios",
    price: "197",
    period: "/mês",
    features: [
      "1 Número WhatsApp",
      "2 Usuários",
      "Chatbot básico",
      "Relatórios simples",
      "Suporte por email",
    ],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Profissional",
    description: "Para empresas em crescimento",
    price: "497",
    period: "/mês",
    features: [
      "5 Números WhatsApp",
      "10 Usuários",
      "Chatbot avançado com IA",
      "Relatórios completos",
      "Integração com CRM",
      "Suporte prioritário",
      "API completa",
    ],
    cta: "Escolher Plano",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Solução personalizada",
    price: "Sob consulta",
    period: "",
    features: [
      "Números ilimitados",
      "Usuários ilimitados",
      "IA personalizada",
      "Servidor dedicado",
      "Gerente de conta",
      "SLA garantido",
      "Treinamento da equipe",
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm text-primary mb-4">
            Planos e Preços
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Escolha o plano{" "}
            <span className="gradient-text">perfeito para você</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Planos flexíveis para todos os tamanhos de negócio. 
            Comece grátis e escale conforme cresce.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative glass-card rounded-3xl p-8 transition-all duration-500 hover:-translate-y-3 ${
                plan.popular
                  ? "border-2 border-primary glow-box scale-105"
                  : "hover-glow"
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-blue-500 text-primary-foreground text-sm font-medium">
                    <Star className="w-4 h-4" />
                    Mais Popular
                  </span>
                </div>
              )}

              {/* Plan Info */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  {plan.price !== "Sob consulta" && (
                    <span className="text-muted-foreground text-lg">R$</span>
                  )}
                  <span className={`text-5xl font-bold ${plan.popular ? "gradient-text" : ""}`}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      plan.popular
                        ? "bg-gradient-to-br from-primary to-blue-500"
                        : "bg-primary/20"
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? "text-white" : "text-primary"}`} />
                    </div>
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : "heroOutline"}
                size="lg"
                className="w-full group"
              >
                {plan.cta}
                {plan.popular && (
                  <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
