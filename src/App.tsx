import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import LoginMonitor from "./pages/LoginMonitor";
import MonitorDashboard from "./pages/MonitorDashboard";
import BlockedPage from "./pages/BlockedPage";
import PurchaseForm from "./pages/PurchaseForm";
import ClientFormsDashboard from "./pages/ClientFormsDashboard";
import WhatsAppPanel from "./pages/WhatsAppPanel";

function RequireAuth({ children, session }: { children: React.ReactNode; session: Session | null }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Pega sessão atual
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Ouve mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Aguarda verificação de sessão antes de renderizar
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/blocked" element={<BlockedPage />} />
        <Route path="/comprar/:token" element={<PurchaseForm />} />
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <LoginMonitor />}
        />
        <Route
          path="/"
          element={
            <RequireAuth session={session}>
              <MonitorDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/formularios"
          element={
            <RequireAuth session={session}>
              <ClientFormsDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
