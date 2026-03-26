import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, Wrench, Package, Plus, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { isAdmin } = useRole();
  const { user } = useAuth();

  const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, always: true },
  { label: "New Report", path: "/reports/new", icon: Plus, always: true },
  { label: "Reports", path: "/reports", icon: FileText, always: true },
  { label: "Customers", path: "/customers", icon: Users, always: true },
  { label: "Technicians", path: "/technicians", icon: Wrench, adminOnly: true },
  { label: "Parts", path: "/parts", icon: Package, adminOnly: true }].
  filter((item) => item.always || item.adminOnly && isAdmin);

  return (
    <>
      {open &&
      <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      }
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69c3f70dbcee7c1afb484046/41d498c1a_ICS-Color-Logo.png"
            alt="ICS Inc."
            className="w-16 h-16 rounded-lg object-contain bg-white" />
          
          <div>
            

            
            <p className="text-muted-foreground text-base font-bold">Service Management</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path === "/" ?
            location.pathname === "/" :
            location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive ?
                  "bg-primary text-primary-foreground shadow-sm" :
                  "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}>
                
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>);

          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
           <Link
             to="/settings"
             onClick={onClose}
             className={cn(
               "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
               location.pathname === "/settings" ?
               "bg-primary text-primary-foreground shadow-sm" :
               "text-muted-foreground hover:text-foreground hover:bg-muted"
             )}>

             <Settings className="w-4 h-4" />
             Settings
           </Link>
           <button
             onClick={() => base44.auth.logout()}
             className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">

             <LogOut className="w-4 h-4" />
             Logout
           </button>

           {user && (
             <div className="pt-3 border-t border-border flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                 {user.profile_picture ? (
                   <img src={user.profile_picture} alt={user.full_name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-sm font-medium text-amber-600">
                     {user.full_name?.[0]?.toUpperCase()}
                   </div>
                 )}
               </div>
               <div className="min-w-0 flex-1">
                 <p className="text-xs font-medium truncate">{user.full_name}</p>
                 <p className="text-xs text-muted-foreground truncate">{user.email}</p>
               </div>
             </div>
           )}
         </div>
      </aside>
    </>);

}