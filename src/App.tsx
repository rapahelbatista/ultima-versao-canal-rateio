import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginMonitor from "./pages/LoginMonitor";
import MonitorDashboard from "./pages/MonitorDashboard";
import BlockedPage from "./pages/BlockedPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!sessionStorage.getItem("monitor_auth")) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/blocked" element={<BlockedPage />} />
        <Route path="/login" element={<LoginMonitor />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <MonitorDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

