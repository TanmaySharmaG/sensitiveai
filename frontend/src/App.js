import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Scanner from "./pages/Scanner";
import TextScanner from "./pages/TextScanner";
import Dashboard from "./pages/Dashboard";
import Compare from "./pages/Compare";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
 
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
 
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
 
      <div className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {/* Mobile top bar with hamburger */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#111111] border-b border-white/[0.06] sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70
                       hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber/20 border border-amber/30 flex items-center justify-center">
              <span className="text-[#F59E0B] text-xs font-bold">S</span>
            </div>
            <span className="font-display font-semibold text-white text-sm">
              Sensitive<span className="text-[#F59E0B]">AI</span>
            </span>
          </div>
        </div>
 
        {/* Page content */}
        <div className="flex-1">
          <Routes>
            <Route path="/scanner"   element={<Scanner />} />
            <Route path="/text"      element={<TextScanner />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/compare"   element={<Compare />} />
            <Route path="/reports"   element={<Reports />} />
            <Route path="/settings"  element={<Settings />} />
            <Route path="*"          element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
 
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e1e1e",
            color: "#e5e5e5",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px"
          },
          success: { iconTheme: { primary: "#10B981", secondary: "#151515" } },
          error:   { iconTheme: { primary: "#FF6B6B", secondary: "#151515" } },
        }}
      />
      <Routes>
        <Route path="/"   element={<Landing />} />
        <Route path="/*"  element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
