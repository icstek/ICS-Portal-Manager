import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, Wrench, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "New Report", path: "/reports/new", icon: Plus },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Technicians", path: "/technicians", icon: Wrench },
  { label: "Parts", path: "/parts", icon: Package },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold font-inter tracking-tight text-foreground">
            ICS<span className="text-primary">,</span> Inc.
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Service Management</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path === "/" 
              ? location.pathname === "/" 
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            6038 Tampa Ave., Tarzana, CA 91356
          </p>
        </div>
      </aside>
    </>
  );
}