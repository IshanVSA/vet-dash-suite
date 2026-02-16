import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Users, BarChart3, Settings, LogOut, Menu, X, ChevronRight,
  CalendarDays, ShieldCheck, ClipboardList, Sparkles, LayoutDashboard, MessageSquare
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
      { label: "Content Calendar", icon: CalendarDays, path: "/content" },
      { label: "Admin Review", icon: ShieldCheck, path: "/review" },
      { label: "AI Content Engine", icon: Sparkles, path: "/ai-content" },
      { label: "Client Intake", icon: ClipboardList, path: "/intake-forms" },
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
      { label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

const conciergeSections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Content Calendar", icon: CalendarDays, path: "/content" },
      { label: "AI Content Engine", icon: Sparkles, path: "/ai-content" },
      { label: "Client Intake", icon: ClipboardList, path: "/intake-forms" },
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
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-[2px] bg-gradient-to-r from-primary via-[hsl(280,65%,60%)] to-primary/40" />

        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm text-foreground">
              <span className="text-primary">VSA</span> Vetmedia
            </h1>
            <p className="text-xs text-muted-foreground">Content Calendar Platform</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
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
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                        active
                          ? "bg-primary/10 text-primary border-l-[3px] border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary hover:translate-x-0.5"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 transition-transform duration-200 group-hover:scale-110", active && "text-primary")} />
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                      {active && !item.badge && <ChevronRight className="h-3 w-3 ml-auto text-primary" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/10">
              <span className="text-xs font-semibold text-primary">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-8 py-3 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
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
