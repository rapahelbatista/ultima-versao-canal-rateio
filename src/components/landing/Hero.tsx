import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, Zap, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="EquipeChat Dashboard"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-glow-secondary/10" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float-slow delay-500" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-glow-secondary/10 rounded-full blur-3xl animate-float delay-300" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="opacity-0-initial animate-fade-in-down mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              +2.500 empresas já usam
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="opacity-0-initial animate-fade-in-up delay-100 text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Revolucione seu{" "}
            <span className="gradient-text glow-text">Atendimento</span>
            <br />
            com EquipeChat
          </h1>

          {/* Subtitle */}
          <p className="opacity-0-initial animate-fade-in-up delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A solução completa para atendimento multicanal com APIs oficiais do 
            WhatsApp, Facebook e Instagram. Automatize, escale e venda mais.
          </p>

          {/* CTA Buttons */}
          <div className="opacity-0-initial animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="hero" size="xl" className="group">
              Agendar Demonstração Grátis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="xl" className="group">
              <Play className="w-5 h-5" />
              Ver Planos e Preços
            </Button>
          </div>

          {/* Stats */}
          <div className="opacity-0-initial animate-fade-in-up delay-400 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="glass-card rounded-2xl p-6 hover-glow group">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold gradient-text mb-1">2.5K+</div>
              <div className="text-sm text-muted-foreground">Clientes Ativos</div>
            </div>
            <div className="glass-card rounded-2xl p-6 hover-glow group">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold gradient-text mb-1">10M+</div>
              <div className="text-sm text-muted-foreground">Mensagens/Mês</div>
            </div>
            <div className="col-span-2 md:col-span-1 glass-card rounded-2xl p-6 hover-glow group">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold gradient-text mb-1">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime Garantido</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
