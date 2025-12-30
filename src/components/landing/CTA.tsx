import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-glow-secondary/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-12 md:p-16 text-center glow-box">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-500 mb-8 animate-bounce-subtle">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>

            {/* Content */}
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pronto para{" "}
              <span className="gradient-text">revolucionar</span>
              <br />
              seu atendimento?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Agende uma demonstração gratuita e descubra como o EquipeChat 
              pode transformar seu negócio. Sem compromisso.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" className="group">
                <Sparkles className="w-5 h-5" />
                Agendar Demonstração Grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="heroOutline" size="xl">
                <MessageCircle className="w-5 h-5" />
                Falar pelo WhatsApp
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">
                Empresas que confiam no EquipeChat
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
                {["TechCorp", "StartupX", "MegaShop", "DigiAgency", "FastDelivery"].map((company) => (
                  <span key={company} className="text-lg font-semibold text-muted-foreground">
                    {company}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
