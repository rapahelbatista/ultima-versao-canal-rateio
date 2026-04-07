import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Lock, AlertTriangle } from "lucide-react";
import { login } from "@/lib/api";

export default function LoginMonitor({ onLogin }: { onLogin: () => void }) {
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

    try {
      await login(email.trim(), pass);
      onLogin();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, hsl(var(--primary)) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-[-10%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, hsl(var(--glow-secondary)) 0%, transparent 70%)" }}
        />
      </div>

      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />

      <div className="w-full max-w-sm animate-slide-up relative z-10">

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-50"
              style={{ background: "hsl(var(--primary))" }}
            />
            <div
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.15))",
                border: "1px solid hsl(var(--primary) / 0.6)",
                boxShadow: "0 8px 32px hsl(var(--primary) / 0.3)"
              }}
            >
              <Shield className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
            </div>
          </div>
          <h1 className="text-2xl font-bold glow-text tracking-tight mb-1 text-foreground">
            Monitor de Instalações
          </h1>
          <p className="text-muted-foreground text-sm">EquipeChat · Acesso restrito</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8" style={{ boxShadow: "0 24px 64px hsl(0 0% 0% / 0.5)" }}>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm animate-slide-in"
                style={{
                  background: "hsl(var(--destructive) / 0.12)",
                  border: "1px solid hsl(var(--destructive) / 0.4)",
                  color: "hsl(var(--destructive))"
                }}
              >
                <Lock className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !pass}
              className="w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed
                         hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(199 89% 38%))",
                color: "hsl(var(--primary-foreground))",
                boxShadow: "0 4px 20px hsl(var(--primary) / 0.4)",
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
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: "hsl(var(--glow-secondary))" }} />
          <span>Área restrita — acesso monitorado e registrado</span>
        </div>
      </div>
    </div>
  );
}
