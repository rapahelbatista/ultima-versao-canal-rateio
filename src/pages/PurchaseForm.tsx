import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ShieldAlert, Building2 } from "lucide-react";

const purchaseSchema = z.object({
  company_name: z.string().min(2, "Nome da empresa é obrigatório").max(255),
  document_type: z.enum(["cpf", "cnpj"], { required_error: "Selecione CPF ou CNPJ" }),
  document_number: z.string().min(11, "Documento inválido").max(18, "Documento inválido"),
  contact_name: z.string().min(2, "Nome de contato é obrigatório").max(255),
  contact_email: z.string().email("E-mail inválido").max(255),
  contact_phone: z.string().max(20).optional().or(z.literal("")),
  usage_type: z.enum(["internal", "resale"], { required_error: "Selecione o tipo de uso" }),
  how_found_us: z.string().max(255).optional().or(z.literal("")),
  agreed_anti_piracy: z.literal(true, {
    errorMap: () => ({ message: "Você deve concordar com os termos antipirataria" }),
  }),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

const ANTI_PIRACY_TEXT = `Ao prosseguir, declaro que estou ciente e de acordo com as políticas antipirataria do EquipeChat:

1. É terminantemente proibida a revenda, distribuição ou comercialização do sistema EquipeChat em marketplaces e plataformas de vendas online, incluindo, mas não se limitando a: Mercado Livre, OLX, Shopee, Amazon, entre outros.

2. O descumprimento desta política resultará em:
   • Bloqueio imediato e permanente da instalação;
   • Perda de todos os benefícios, suporte e atualizações;
   • Possíveis medidas legais cabíveis conforme a Lei nº 9.610/98 (Lei de Direitos Autorais).

3. O sistema é licenciado exclusivamente para o uso declarado neste formulário (uso interno ou revenda autorizada de planos).

4. Me comprometo a não modificar, descompilar, realizar engenharia reversa ou redistribuir o software sem autorização expressa do EquipeChat.`;

export default function PurchaseForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      company_name: "",
      document_type: undefined,
      document_number: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      usage_type: undefined,
      how_found_us: "",
      agreed_anti_piracy: undefined as unknown as true,
      notes: "",
    },
  });

  const onSubmit = async (data: PurchaseFormData) => {
    setSubmitting(true);
    setError("");
    try {
      const { error: dbError } = await supabase
        .from("purchase_requests")
        .insert({
          company_name: data.company_name.trim(),
          document_type: data.document_type,
          document_number: data.document_number.trim(),
          contact_name: data.contact_name.trim(),
          contact_email: data.contact_email.trim(),
          contact_phone: data.contact_phone?.trim() || null,
          usage_type: data.usage_type,
          how_found_us: data.how_found_us?.trim() || null,
          agreed_anti_piracy: data.agreed_anti_piracy,
          notes: data.notes?.trim() || null,
        });

      if (dbError) throw dbError;
      setSubmitted(true);
    } catch (err: any) {
      setError("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Solicitação Enviada!</h1>
          <p className="text-muted-foreground">
            Recebemos suas informações. Nossa equipe entrará em contato em breve pelo e-mail informado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Formulário de Aquisição
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Preencha os dados abaixo para iniciar o processo de aquisição do EquipeChat.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl shadow-black/20">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Info Section */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Dados da Empresa
                </h2>

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Minha Empresa LTDA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="document_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="document_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do Documento</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00 ou 00.000.000/0001-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Dados de Contato
                </h2>

                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Usage Section */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Informações de Uso
                </h2>

                <FormField
                  control={form.control}
                  name="usage_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Finalidade do Uso</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a finalidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internal">Uso interno da minha empresa</SelectItem>
                          <SelectItem value="resale">Revenda de planos para clientes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="how_found_us"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Como nos conheceu? (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma opção" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="google">Google / Pesquisa</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="indicacao">Indicação de amigo/colega</SelectItem>
                          <SelectItem value="grupo_whatsapp">Grupo de WhatsApp</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Alguma informação adicional que queira compartilhar..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Anti-Piracy Terms */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-destructive" />
                  Termos Antipirataria
                </div>

                <div className="rounded-xl border border-border bg-secondary/50 p-4 max-h-48 overflow-y-auto text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {ANTI_PIRACY_TEXT}
                </div>

                <FormField
                  control={form.control}
                  name="agreed_anti_piracy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-foreground cursor-pointer">
                          Li e concordo com os termos antipirataria do EquipeChat
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} EquipeChat — Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
