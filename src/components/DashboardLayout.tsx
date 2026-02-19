import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Users, BarChart3, Settings, LogOut, Menu, X, ChevronRight,
  CalendarDays, ShieldCheck, ClipboardList, LayoutDashboard, UserCheck, FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const adminSections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "Content Calendar", icon: CalendarDays, path: "/content" },
      { label: "Admin Review", icon: ShieldCheck, path: "/review" },
      { label: "Client Intake", icon: ClipboardList, path: "/intake-forms" },
      { label: "Content Requests", icon: FileCheck, path: "/content-requests" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { label: "Performance", icon: BarChart3, path: "/analytics" },
    ],
  },
  {
    items: [
      { label: "Clinics", icon: Building2, path: "/clinics" },
      { label: "Employees", icon: Users, path: "/employees" },
      { label: "Clients", icon: UserCheck, path: "/clients" },
      { label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

const conciergeSections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "Content Calendar", icon: CalendarDays, path: "/content" },
      { label: "Client Intake", icon: ClipboardList, path: "/intake-forms" },
      { label: "Content Requests", icon: FileCheck, path: "/content-requests" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { label: "Performance", icon: BarChart3, path: "/analytics" },
    ],
  },
  {
    items: [
      { label: "My Clinics", icon: Building2, path: "/clinics" },
    ],
  },
];

const defaultClientSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    ],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role } = useUserRole();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientClinicId, setClientClinicId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  useEffect(() => {
    if (role === "client" && user) {
      supabase.from("clinics").select("id").eq("owner_user_id", user.id).limit(1).maybeSingle()
        .then(({ data }) => { if (data) setClientClinicId(data.id); });
    }
  }, [role, user]);

  const clientSections: NavSection[] = [
    {
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/" },
        { label: "Content Requests", icon: FileCheck, path: "/content-requests" },
        ...(clientClinicId ? [{ label: "My Clinic", icon: Building2, path: `/clinics/${clientClinicId}` }] : []),
      ],
    },
  ];

  const sections = role === "admin" ? adminSections : role === "concierge" ? conciergeSections : clientSections;

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] bg-card border-r border-border/60 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Top accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-primary via-[hsl(280,65%,60%)] to-primary/30" />

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/40">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground tracking-tight">
              <span className="text-primary">VSA</span> Vetmedia
            </h1>
            <p className="text-[11px] text-muted-foreground">Content Platform</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="px-3 mb-2 text-[10px] font-bold tracking-[0.12em] text-muted-foreground/70 uppercase">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative",
                        active
                          ? "bg-primary/8 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                      )}
                      <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-all duration-200", active ? "text-primary" : "group-hover:text-foreground")} />
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                      {active && !item.badge && <ChevronRight className="h-3 w-3 ml-auto text-primary/50" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-border/40">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg bg-muted/40">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/10">
              <span className="text-xs font-semibold text-primary">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">{profile?.full_name || "User"}</p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">{role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive rounded-lg text-[13px]"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/40 px-4 lg:px-8 h-14 flex items-center gap-4">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1" />
        </header>
        <div className="p-4 lg:p-8 max-w-7xl page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
