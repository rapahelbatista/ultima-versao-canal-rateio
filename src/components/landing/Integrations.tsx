import { MessageCircle, Facebook, Instagram, Check } from "lucide-react";

const integrations = [
  {
    name: "WhatsApp Business API",
    icon: MessageCircle,
    color: "from-green-500 to-green-600",
    description: "API oficial do WhatsApp com total segurança e estabilidade.",
    features: ["Mensagens em massa", "Automação completa", "Chatbots inteligentes", "Relatórios detalhados"],
  },
  {
    name: "Facebook Pages API",
    icon: Facebook,
    color: "from-blue-600 to-blue-700",
    description: "Gerencie mensagens e comentários da sua página Facebook.",
    features: ["Inbox unificado", "Respostas automáticas", "Gestão de comentários", "Métricas de engajamento"],
  },
  {
    name: "Instagram Direct API",
    icon: Instagram,
    color: "from-pink-500 via-purple-500 to-orange-400",
    description: "Atenda seus clientes pelo Instagram Direct com eficiência.",
    features: ["Stories & DMs", "Respostas rápidas", "Etiquetas personalizadas", "Análise de conversas"],
  },
];

const Integrations = () => {
  return (
    <section id="integrations" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm text-primary mb-4">
            Integrações Oficiais
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Integração com{" "}
            <span className="gradient-text">APIs Oficiais da Meta</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Conecte-se com as maiores plataformas de comunicação do mundo 
            através de APIs oficiais, garantindo segurança e confiabilidade.
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {integrations.map((integration, index) => (
            <div
              key={integration.name}
              className="group relative glass-card rounded-3xl p-8 hover-glow transition-all duration-500 hover:-translate-y-3"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${integration.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                <integration.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-3">{integration.name}</h3>
              <p className="text-muted-foreground mb-6">{integration.description}</p>

              {/* Features */}
              <ul className="space-y-3">
                {integration.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${integration.color} flex items-center justify-center flex-shrink-0`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
