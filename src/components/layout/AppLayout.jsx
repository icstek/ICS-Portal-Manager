import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import { useUserSettings } from "@/hooks/useUserSettings";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useUserSettings(); // Initialize dark mode on mount

  return (
    <div className="min-h-screen bg-background font-inter flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 p-4 border-b border-border bg-card sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <img
            src="https://media.base44.com/images/public/69c3f70dbcee7c1afb484046/41d498c1a_ICS-Color-Logo.png"
            alt="ICS Inc."
            className="w-8 h-8 rounded-md object-contain bg-white"
          />
          <h1 className="text-lg font-bold font-inter">ICS<span className="text-primary">,</span> Inc.</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}