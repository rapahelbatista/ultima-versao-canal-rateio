import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated, setToken } from "@/lib/api";
import LoginMonitor from "./pages/LoginMonitor";
import MonitorDashboard from "./pages/MonitorDashboard";
import BlockedPage from "./pages/BlockedPage";
import PurchaseForm from "./pages/PurchaseForm";
import ClientFormsDashboard from "./pages/ClientFormsDashboard";
import WhatsAppPanel from "./pages/WhatsAppPanel";

function RequireAuth({ children, authed }: { children: React.ReactNode; authed: boolean }) {
  if (!authed) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [authed, setAuthed] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  // Listen for storage changes (logout from another tab)
  useEffect(() => {
    const handler = () => setAuthed(isAuthenticated());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (authed === undefined) {
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
          element={authed ? <Navigate to="/" replace /> : <LoginMonitor onLogin={() => setAuthed(true)} />}
        />
        <Route
          path="/"
          element={
            <RequireAuth authed={authed}>
              <MonitorDashboard onLogout={() => setAuthed(false)} />
            </RequireAuth>
          }
        />
        <Route
          path="/formularios"
          element={
            <RequireAuth authed={authed}>
              <ClientFormsDashboard onLogout={() => setAuthed(false)} />
            </RequireAuth>
          }
        />
        <Route
          path="/whatsapp"
          element={
            <RequireAuth authed={authed}>
              <WhatsAppPanel onLogout={() => setAuthed(false)} />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
