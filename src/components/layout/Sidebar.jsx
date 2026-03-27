import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, Wrench, Package, Plus, Settings, LogOut, ShieldAlert, UserPlus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/lib/AuthContext";
import { useBranding } from "@/lib/BrandingContext";
import { base44 } from "@/api/base44Client";

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { isAdmin, isGlobalAdmin, isTechnician } = useRole();
  const { user } = useAuth();
  const { companyName, companyLogoUrl } = useBranding();

  const displayName = companyName || "ICS Service Report System";
  const displayLogo = companyLogoUrl || "https://media.base44.com/images/public/69c3f70dbcee7c1afb484046/41d498c1a_ICS-Color-Logo.png";

  const mainNav = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard, always: true },
    { label: "Reports", path: "/reports", icon: FileText, always: true },
    { label: "Customers", path: "/customers", icon: Users, always: true },
    { label: "Parts", path: "/parts", icon: Package, show: isAdmin },
    { label: "Technicians", path: "/technicians", icon: Wrench, show: !isGlobalAdmin && isAdmin },
    { label: "Services", path: "/services", icon: Tag, show: isAdmin },
    { label: "User Management", path: "/users", icon: ShieldAlert, show: isGlobalAdmin },
  ].filter((item) => item.always || item.show);

  const quickActions = [
    { label: "New Report", path: "/reports/new", icon: Plus, always: true },
    { label: "Add Customer", path: "/customers?action=new", icon: UserPlus, always: true },
    { label: "Add Part", path: "/parts?action=new", icon: Package, show: isAdmin },
    { label: "Add Service", path: "/services?action=new", icon: Tag, show: isAdmin },
  ].filter((item) => item.always || item.show);

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
            src={displayLogo}
            alt={displayName}
            className="w-14 h-14 rounded-lg object-contain bg-white p-1" />
          <p className="text-foreground text-sm font-bold leading-tight">{displayName}</p>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {mainNav.map((item) => {
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
                </Link>
              );
            })}
          </div>

          <div className="mt-5">
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
            <div className="space-y-1">
              {quickActions.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
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
                 {user.picture || user.profile_picture ? (
                   <img src={user.picture || user.profile_picture} alt={user.full_name} className="w-full h-full object-cover" />
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