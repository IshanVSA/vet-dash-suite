import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { usePendingCounts } from "@/hooks/usePendingCounts";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Users, BarChart3, Settings, LogOut, Menu, X, ChevronRight,
  ShieldCheck, LayoutDashboard, UserCheck,
  Sun, Moon, PanelLeftClose, PanelLeft, Share2, Megaphone, Globe, Search, Plus, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import vsaLogo from "@/assets/vsa-logo.jpg";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PageTransition } from "@/components/PageTransition";
import { NewTicketDialog } from "@/components/department/NewTicketDialog";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const departmentServices: Record<string, { label: string; services: string[] }> = {
  website: {
    label: "Website",
    services: ["Time Changes", "Pop-up Offers", "Theme Updates", "Add/Remove Team Members", "New Forms", "Paper-to-Digital Conversion", "Price List Updates", "Tech Issues", "Others"],
  },
  seo: {
    label: "SEO",
    services: ["Backlinking", "Ranking Reports", "Keyword Research", "Manual Work Reports", "Search Atlas Integration", "SEO Thread Updates", "Others"],
  },
  google_ads: {
    label: "Google Ads",
    services: ["Dashboard Access", "Analytics Review", "Monthly Performance Report", "Call Volume Issues", "Wrong Call Tracking", "Campaign Adjustments", "Others"],
  },
  social_media: {
    label: "Social Media",
    services: ["Content Calendar", "Post Approval", "Analytics", "Campaign Planning", "Others"],
  },
};

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
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    ],
  },
  {
    title: "DEPARTMENTS",
    items: [
      { label: "Website", icon: Globe, path: "/website" },
      { label: "SEO", icon: Search, path: "/seo" },
      { label: "Google Ads", icon: Megaphone, path: "/google-ads" },
      { label: "Social Media", icon: Share2, path: "/social" },
    ],
  },
  {
    title: "WORKSPACE",
    items: [
      { label: "Clinics", icon: Building2, path: "/clinics" },
      { label: "Team", icon: Users, path: "/employees" },
      { label: "Clients", icon: UserCheck, path: "/clients" },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { label: "Reports", icon: FileText, path: "/reports" },
      { label: "Review Queue", icon: ShieldCheck, path: "/review" },
      { label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

const conciergeSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    ],
  },
  {
    title: "DEPARTMENTS",
    items: [
      { label: "Website", icon: Globe, path: "/website" },
      { label: "SEO", icon: Search, path: "/seo" },
      { label: "Google Ads", icon: Megaphone, path: "/google-ads" },
      { label: "Social Media", icon: Share2, path: "/social" },
    ],
  },
  {
    title: "WORKSPACE",
    items: [
      { label: "My Clinics", icon: Building2, path: "/clinics" },
      { label: "Reports", icon: FileText, path: "/reports" },
      { label: "Settings", icon: Settings, path: "/settings" },
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

// Page title map
const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/website": "Website",
  "/seo": "SEO",
  "/google-ads": "Google Ads",
  "/social": "Social Media",
  "/review": "Admin Review",
  "/clinics": "Clinics",
  "/employees": "Team Members",
  "/clients": "Clients",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role } = useUserRole();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const [clientClinicId, setClientClinicId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const { pendingRequests, pendingReview } = usePendingCounts();

  // Global ticket dialog state
  const [deptPickerOpen, setDeptPickerOpen] = useState(false);
  const [globalTicketOpen, setGlobalTicketOpen] = useState(false);
  const [globalTicketDept, setGlobalTicketDept] = useState("website");

  // Chat assistant is now a self-contained floating widget

  // Listen for global new-ticket event
  useEffect(() => {
    const handler = () => setDeptPickerOpen(true);
    window.addEventListener("open-new-ticket", handler);
    return () => window.removeEventListener("open-new-ticket", handler);
  }, []);

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
      ],
    },
    {
      title: "DEPARTMENTS",
      items: [
        { label: "Website", icon: Globe, path: "/website" },
        { label: "SEO", icon: Search, path: "/seo" },
        { label: "Google Ads", icon: Megaphone, path: "/google-ads" },
        { label: "Social Media", icon: Share2, path: "/social" },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { label: "Settings", icon: Settings, path: "/settings" },
      ],
    },
  ];

  // Inject badge counts into nav items
  const injectBadges = (sections: NavSection[]): NavSection[] =>
    sections.map(s => ({
      ...s,
      items: s.items.map(item => ({
        ...item,
        badge:
          item.path === "/social" ? pendingRequests :
          item.path === "/review" ? pendingReview :
          item.badge,
      })),
    }));

  const sections = injectBadges(
    role === "admin" ? adminSections : role === "concierge" ? conciergeSections : clientSections
  );

  const currentPageTitle = pageTitles[location.pathname] || "";

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const sidebarWidth = collapsed ? "w-[68px]" : "w-[260px]";

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col transition-[width,transform] duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:z-auto",
        "bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]",
        sidebarWidth,
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center h-16 border-b border-[hsl(var(--sidebar-border))]", collapsed ? "px-3 justify-center" : "px-5 gap-3")}>
          <img src={vsaLogo} alt="VSA Vet Media" className="h-9 w-9 rounded-xl object-cover shadow-lg shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-sm tracking-tight">
                <span className="text-[hsl(var(--sidebar-primary))]">VSA</span> Vetmedia
              </h1>
              <p className="text-[10px] text-[hsl(var(--sidebar-muted))] tracking-wide">Content Platform</p>
            </div>
          )}
          <button onClick={toggleCollapse} className="hidden lg:flex p-1.5 rounded-md hover:bg-[hsl(var(--sidebar-accent))]/50 transition-colors shrink-0" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeft className="h-4 w-4 text-[hsl(var(--sidebar-muted))]" /> : <PanelLeftClose className="h-4 w-4 text-[hsl(var(--sidebar-muted))]" />}
          </button>
          <button className="lg:hidden p-1 rounded-md hover:bg-[hsl(var(--sidebar-accent))]" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4 text-[hsl(var(--sidebar-muted))]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 py-4 space-y-6 overflow-y-auto", collapsed ? "px-1.5" : "px-3")}>
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && !collapsed && (
                <p className="px-3 mb-2.5 text-[10px] font-bold tracking-[0.15em] text-[hsl(var(--sidebar-muted))]/60 uppercase select-none">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.path === "/" ? location.pathname === "/" : location.pathname === item.path || location.pathname.startsWith(item.path + "/") || (item.path === "/social" && location.pathname === "/social");
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center rounded-lg font-medium transition-all duration-200 group relative",
                        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5 text-[13px]",
                        active
                          ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
                          : "text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]/50"
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[hsl(var(--sidebar-primary))] rounded-r-full" />
                      )}
                      <div className="relative shrink-0">
                        <item.icon className={cn(
                          "h-[18px] w-[18px] transition-colors duration-200",
                          active ? "text-[hsl(var(--sidebar-primary))]" : "group-hover:text-[hsl(var(--sidebar-foreground))]"
                        )} />
                        {collapsed && (item.badge ?? 0) > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {!collapsed && item.label}
                      {!collapsed && (item.badge ?? 0) > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                      {!collapsed && active && !item.badge && <ChevronRight className="h-3 w-3 ml-auto text-[hsl(var(--sidebar-primary))]/50" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className={cn("py-4 border-t border-[hsl(var(--sidebar-border))]", collapsed ? "px-1.5" : "px-3")}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg bg-[hsl(var(--sidebar-accent))]/60">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(var(--sidebar-primary))]/30 to-[hsl(280,65%,55%)]/20 flex items-center justify-center ring-1 ring-[hsl(var(--sidebar-primary))]/20">
                <span className="text-xs font-semibold text-[hsl(var(--sidebar-primary))]">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[hsl(var(--sidebar-foreground))] truncate">{profile?.full_name || "User"}</p>
                <p className="text-[11px] text-[hsl(var(--sidebar-muted))] truncate capitalize">{role}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-[hsl(var(--sidebar-muted))] hover:text-destructive hover:bg-destructive/10 rounded-lg text-[13px]",
              collapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={signOut}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/40 px-4 lg:px-8 h-14 flex items-center gap-4">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          
          {currentPageTitle && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">VSA</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <span className="font-medium text-foreground">{currentPageTitle}</span>
            </div>
          )}

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium"
            onClick={() => setDeptPickerOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Ticket</span>
          </Button>

          <button
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => {
              document.documentElement.classList.toggle("dark");
              localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
            }}
          >
            <Sun className="h-4 w-4 text-muted-foreground dark:hidden" />
            <Moon className="h-4 w-4 text-muted-foreground hidden dark:block" />
          </button>

          <NotificationBell />

          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-border">
            <span className="text-xs font-semibold text-primary">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
        </header>
        
        <div className="flex-1 p-4 lg:p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* Department Picker Dialog */}
      <Dialog open={deptPickerOpen} onOpenChange={setDeptPickerOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Department</DialogTitle>
            <DialogDescription>Choose a department for your new ticket.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            {Object.entries(departmentServices).map(([key, { label }]) => (
              <Button
                key={key}
                variant="outline"
                className="h-auto py-3 flex flex-col gap-1"
                onClick={() => {
                  setGlobalTicketDept(key);
                  setDeptPickerOpen(false);
                  setGlobalTicketOpen(true);
                }}
              >
                <span className="text-sm font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Global New Ticket Dialog */}
      <NewTicketDialog
        open={globalTicketOpen}
        onOpenChange={setGlobalTicketOpen}
        department={globalTicketDept}
        services={departmentServices[globalTicketDept]?.services ?? []}
        onCreated={() => {}}
      />

      {/* Chat Assistant - floating popup */}
      <ChatAssistant />
    </div>
  );
}
