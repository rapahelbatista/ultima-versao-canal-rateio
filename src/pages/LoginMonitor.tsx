import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Lock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function LoginMonitor() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (authError) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, hsl(var(--primary)) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-[-10%] w-[400px] h-[400px] rounded-full opacity-6"
          style={{ background: "radial-gradient(ellipse, hsl(var(--accent)) 0%, transparent 70%)" }} />
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

      <div className="w-full max-w-sm animate-slide-up relative z-10">

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-40"
              style={{ background: "hsl(var(--primary))" }} />
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary-glow) / 0.1))",
                border: "1px solid hsl(var(--primary) / 0.4)",
                boxShadow: "0 8px 32px hsl(var(--primary) / 0.2)"
              }}>
              <Shield className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
            </div>
          </div>
          <h1 className="text-2xl font-bold glow-text tracking-tight mb-1">
            Monitor de Instalações
          </h1>
          <p className="text-muted-foreground text-sm">EquipeChat · Acesso restrito</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8" style={{ boxShadow: "0 24px 64px hsl(0 0% 0% / 0.4)" }}>
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-base w-full px-4 py-3 text-sm"
                placeholder="admin@equipechat.com"
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  className="input-base w-full px-4 py-3 pr-12 text-sm font-mono"
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm animate-slide-in"
                style={{
                  background: "hsl(var(--danger) / 0.08)",
                  border: "1px solid hsl(var(--danger) / 0.35)",
                  color: "hsl(var(--danger))"
                }}>
                <Lock className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !pass}
              className="w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))",
                color: "hsl(var(--primary-foreground))",
                boxShadow: "0 4px 20px hsl(var(--primary) / 0.35)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verificando...
                </span>
              ) : "Acessar Painel"}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: "hsl(var(--warning))" }} />
          <span>Área restrita — acesso monitorado e registrado</span>
        </div>
      </div>
    </div>
  );
}
