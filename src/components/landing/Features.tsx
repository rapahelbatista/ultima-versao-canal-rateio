import { MessageSquare, Bot, BarChart3, Users, Smartphone, Globe } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Atendimento Multicanal",
    description: "Centralize WhatsApp, Facebook e Instagram em uma única plataforma. Nunca mais perca uma mensagem.",
  },
  {
    icon: Bot,
    title: "Chatbots Inteligentes",
    description: "Automatize respostas com IA avançada. Atenda 24/7 sem precisar de equipe adicional.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Completos",
    description: "Métricas em tempo real sobre atendimentos, conversões e desempenho da equipe.",
  },
  {
    icon: Users,
    title: "Gestão de Equipes",
    description: "Distribua atendimentos automaticamente. Monitore a produtividade de cada colaborador.",
  },
  {
    icon: Smartphone,
    title: "App Mobile",
    description: "Atenda de qualquer lugar com nosso app para iOS e Android. Sempre conectado.",
  },
  {
    icon: Globe,
    title: "API Aberta",
    description: "Integre com seu CRM, ERP ou qualquer sistema. Documentação completa e suporte dedicado.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm text-primary mb-4">
            Recursos Poderosos
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Tudo que você precisa para{" "}
            <span className="gradient-text">vender mais</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Uma plataforma completa com todos os recursos necessários para 
            revolucionar seu atendimento ao cliente.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group glass-card rounded-2xl p-8 hover-glow transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
