import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Waves,
  FileText,
  Users,
  Building2,
  CreditCard,
  LogOut,
  LayoutDashboard,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pages", label: "Páginas", icon: FileText },
  { href: "/assets", label: "Ativos", icon: LayoutGrid },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border">
          <Waves className="h-6 w-6 text-sidebar-primary" />
          <span className="font-bold text-sidebar-accent-foreground tracking-tight">
            WaveManager
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 mb-1 rounded-md transition-colors",
              pathname === "/profile"
                ? "bg-sidebar-accent"
                : "hover:bg-sidebar-accent/50"
            )}
          >
            <div className="h-7 w-7 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-sidebar-foreground truncate">
                {user?.role || "sem cargo"}
              </p>
            </div>
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
