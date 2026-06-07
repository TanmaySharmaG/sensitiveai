import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Scanner from "./pages/Scanner";
import TextScanner from "./pages/TextScanner";
import Dashboard from "./pages/Dashboard";
import Compare from "./pages/Compare";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1e1e1e", color: "#e5e5e5", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" },
          success: { iconTheme: { primary: "#10B981", secondary: "#151515" } },
          error: { iconTheme: { primary: "#FF6B6B", secondary: "#151515" } },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/*"
          element={
            <div className="flex h-screen overflow-hidden">
              <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              <div className="flex-1 overflow-y-auto min-w-0">
                <Routes>
                  <Route path="/scanner" element={<Scanner />} />
                  <Route path="/text" element={<TextScanner />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
