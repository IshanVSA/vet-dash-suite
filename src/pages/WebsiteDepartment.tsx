import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Globe, LayoutDashboard, Ticket, BarChart3, FileText, Upload, Search, MessageSquare, Hash, Link2, TrendingUp, Pencil, Eye, TrendingDown, Clock, Layers } from "lucide-react";
import { DepartmentOverview } from "@/components/department/DepartmentOverview";
import { TicketsTab } from "@/components/department/TicketsTab";
import { WebsiteAnalyticsTab } from "@/components/department/WebsiteAnalyticsTab";
import { WebsiteReportsTab } from "@/components/department/WebsiteReportsTab";
import { UploadsTab } from "@/components/department/UploadsTab";
import { ClinicSelector } from "@/components/department/ClinicSelector";
import { useDepartmentTeam } from "@/hooks/useDepartmentTeam";
import { useClinicSelector } from "@/hooks/useClinicSelector";
import { useWebsiteKPIs } from "@/hooks/useWebsiteKPIs";
import { useSeoAnalytics } from "@/hooks/useSeoAnalytics";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ComingSoonTab } from "@/components/department/ComingSoonTab";
import { SeoReportsTab } from "@/components/department/SeoReportsTab";
import { UpdateSeoAnalyticsDialog } from "@/components/department/UpdateSeoAnalyticsDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SeoKeyword } from "@/hooks/useSeoAnalytics";

// ── Website config ──
const websiteTabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "tickets", label: "Tickets", icon: Ticket },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "uploads", label: "Uploads", icon: Upload },
];

const websiteServices = [
  "Time Changes", "Pop-up Offers", "Theme Updates", "Add/Remove Team Members",
  "New Forms", "Paper-to-Digital Conversion", "Price List Updates",
  "3rd-Party Integrations", "Payment Options", "Others",
];

// ── SEO config ──
const seoTabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "tickets", label: "Tickets", icon: Ticket },
  { value: "seo-thread", label: "SEO Thread", icon: MessageSquare },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "uploads", label: "Uploads", icon: Upload },
];

const seoServices = ["Backlinking", "Ranking Reports", "Keyword Research", "Manual Work Reports", "Search Atlas Integration", "SEO Thread Updates", "Others"];

// ── Helpers ──
function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatChange(current: number, previous: number, suffix = ""): { text: string; type: "positive" | "negative" | "neutral" } {
  if (previous === 0 && current === 0) return { text: "No data", type: "neutral" };
  if (previous === 0) return { text: `+${current}${suffix} (new)`, type: "positive" };
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 1000) / 10;
  const sign = pct >= 0 ? "+" : "";
  return { text: `${sign}${pct}% vs last week`, type: pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral" };
}

function TopKeywordsCard({ keywords }: { keywords: SeoKeyword[] }) {
  if (keywords.length === 0) {
    return (
      <Card className="border-border/60">
        <div className="px-4 py-3 border-b border-border/40">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Top Keywords
          </h3>
        </div>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground text-center">No keyword data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <div className="px-4 py-3 border-b border-border/40">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Top Keywords
        </h3>
      </div>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Keyword</TableHead>
              <TableHead className="text-right w-20">Position</TableHead>
              <TableHead className="text-right w-20">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((kw, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{kw.keyword}</TableCell>
                <TableCell className="text-right tabular-nums">{kw.position}</TableCell>
                <TableCell className={`text-right tabular-nums font-medium ${kw.change.startsWith("+") ? "text-success" : kw.change.startsWith("-") ? "text-destructive" : ""}`}>
                  {kw.change}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function useCanEditSeo() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile-team-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("team_role").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  return role === "admin" || profile?.team_role === "SEO Lead";
}

const fallbackSeoKpis = [
  { label: "Domain Authority", value: 0, icon: Globe, gradient: "blue" as const },
  { label: "Backlinks", value: 0, icon: Link2, gradient: "green" as const },
  { label: "Keywords Top 10", value: 0, icon: Hash, gradient: "amber" as const },
  { label: "Organic Traffic", value: 0, icon: TrendingUp, gradient: "purple" as const },
];

export default function WebsiteDepartment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<"website" | "seo">("website");
  const currentTab = searchParams.get("tab") || "overview";
  const { clinics, selectedClinicId, setSelectedClinicId, loading: clinicsLoading } = useClinicSelector();

  // Website hooks
  const { team: websiteTeam } = useDepartmentTeam("website", selectedClinicId);
  const kpiData = useWebsiteKPIs(selectedClinicId);

  // SEO hooks
  const { team: seoTeam } = useDepartmentTeam("seo", selectedClinicId);
  const { latest, trafficData: seoTrafficData, topKeywords, isLoading: seoLoading, upsertSeoAnalytics, isUpserting } = useSeoAnalytics(selectedClinicId);
  const canEditSeo = useCanEditSeo();
  const [seoDialogOpen, setSeoDialogOpen] = useState(false);

  const selectedClinicName = clinics.find(c => c.id === selectedClinicId)?.clinic_name;

  // Website KPIs
  const visitorsChange = formatChange(kpiData.visitorsToday, kpiData.visitorsLastWeek);
  const bounceChange = formatChange(kpiData.bounceRate, kpiData.bounceRatePrev, "%");
  const bounceChangeAdjusted = { ...bounceChange, type: bounceChange.type === "positive" ? "negative" as const : bounceChange.type === "negative" ? "positive" as const : "neutral" as const };
  const durationChange = formatChange(kpiData.avgSessionDuration, kpiData.avgSessionDurationPrev);
  const pagesChange = formatChange(kpiData.pagesPerSession, kpiData.pagesPerSessionPrev);

  const websiteKpis = [
    { label: "Visitors Today", value: kpiData.loading ? "—" : kpiData.visitorsToday.toLocaleString(), change: kpiData.loading ? "" : visitorsChange.text, changeType: visitorsChange.type, icon: Eye, gradient: "blue" as const },
    { label: "Bounce Rate", value: kpiData.loading ? "—" : `${kpiData.bounceRate}%`, change: kpiData.loading ? "" : bounceChangeAdjusted.text, changeType: bounceChangeAdjusted.type, icon: TrendingDown, gradient: "green" as const },
    { label: "Avg. Session", value: kpiData.loading ? "—" : formatDuration(kpiData.avgSessionDuration), change: kpiData.loading ? "" : durationChange.text, changeType: durationChange.type, icon: Clock, gradient: "amber" as const },
    { label: "Pages/Session", value: kpiData.loading ? "—" : kpiData.pagesPerSession.toString(), change: kpiData.loading ? "" : pagesChange.text, changeType: pagesChange.type, icon: Layers, gradient: "purple" as const },
  ];

  const websiteTrafficData = kpiData.dailyTraffic.length > 0 ? kpiData.dailyTraffic : [{ label: "—", value: 0 }];

  // SEO KPIs
  const seoKpis = latest
    ? [
        { label: "Domain Authority", value: latest.domain_authority, icon: Globe, gradient: "blue" as const },
        { label: "Backlinks", value: latest.backlinks.toLocaleString(), icon: Link2, gradient: "green" as const },
        { label: "Keywords Top 10", value: latest.keywords_top_10, icon: Hash, gradient: "amber" as const },
        { label: "Organic Traffic", value: latest.organic_traffic.toLocaleString(), icon: TrendingUp, gradient: "purple" as const },
      ]
    : fallbackSeoKpis;

  const handleTabChange = (v: string) => {
    setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("tab", v); return next; }, { replace: true });
  };

  const handleModeSwitch = (newMode: "website" | "seo") => {
    setMode(newMode);
    setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("tab", "overview"); return next; }, { replace: true });
  };

  const tabs = mode === "website" ? websiteTabs : seoTabs;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[hsl(var(--dept-website))]/10 flex items-center justify-center">
              {mode === "website" ? <Globe className="h-4 w-4 text-[hsl(var(--dept-website))]" /> : <Search className="h-4 w-4 text-[hsl(var(--dept-seo))]" />}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Website + SEO</h1>
              {selectedClinicName && <p className="text-xs text-muted-foreground -mt-0.5">{selectedClinicName}</p>}
            </div>

            {/* Pill toggle */}
            <div className="relative flex items-center rounded-full bg-muted p-0.5 ml-1">
              <motion.div
                className="absolute top-0.5 bottom-0.5 rounded-full bg-primary shadow-sm"
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{
                  left: mode === "website" ? "2px" : "50%",
                  right: mode === "seo" ? "2px" : "50%",
                }}
              />
              <button
                onClick={() => handleModeSwitch("website")}
                className={cn(
                  "relative z-10 px-3.5 py-1 text-xs font-semibold rounded-full transition-colors duration-200",
                  mode === "website" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Website
              </button>
              <button
                onClick={() => handleModeSwitch("seo")}
                className={cn(
                  "relative z-10 px-3.5 py-1 text-xs font-semibold rounded-full transition-colors duration-200",
                  mode === "seo" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                SEO
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === "seo" && canEditSeo && selectedClinicId && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setSeoDialogOpen(true)}>
                <Pencil className="h-3 w-3" /> Update
              </Button>
            )}
            <ClinicSelector clinics={clinics} selectedClinicId={selectedClinicId} onSelect={setSelectedClinicId} loading={clinicsLoading} />
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 h-10 p-1 overflow-x-auto">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs data-[state=active]:shadow-sm">
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "seo" ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "seo" ? -24 : 24 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
          {mode === "website" ? (
            <>
              <TabsContent value="overview" className="mt-4">
                <DepartmentOverview kpis={websiteKpis} services={websiteServices} trafficData={websiteTrafficData} trafficLabel="Weekly Traffic" team={websiteTeam} department="website" accentColor="hsl(var(--dept-website))" clinicId={selectedClinicId} />
              </TabsContent>
              <TabsContent value="tickets" className="mt-4"><TicketsTab department="website" services={websiteServices} clinicId={selectedClinicId} /></TabsContent>
              <TabsContent value="analytics" className="mt-4"><WebsiteAnalyticsTab clinicId={selectedClinicId} /></TabsContent>
              <TabsContent value="reports" className="mt-4"><WebsiteReportsTab clinicId={selectedClinicId} /></TabsContent>
              <TabsContent value="uploads" className="mt-4"><UploadsTab department="website" clinicId={selectedClinicId} /></TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="overview" className="mt-4">
                <DepartmentOverview kpis={seoKpis} services={seoServices} trafficData={seoTrafficData.length > 0 ? seoTrafficData : [{ label: "No data", value: 0 }]} trafficLabel="Organic Traffic Trend" team={seoTeam} department="seo" accentColor="hsl(var(--dept-seo))" extraSection={<TopKeywordsCard keywords={topKeywords} />} clinicId={selectedClinicId} />
              </TabsContent>
              <TabsContent value="tickets" className="mt-4"><TicketsTab department="seo" services={seoServices} clinicId={selectedClinicId} /></TabsContent>
              <TabsContent value="seo-thread" className="mt-4"><ComingSoonTab label="SEO Thread" /></TabsContent>
              <TabsContent value="reports" className="mt-4"><SeoReportsTab clinicId={selectedClinicId} /></TabsContent>
              <TabsContent value="uploads" className="mt-4"><UploadsTab department="seo" clinicId={selectedClinicId} /></TabsContent>
            </>
          )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>

      {mode === "seo" && selectedClinicId && (
        <UpdateSeoAnalyticsDialog
          open={seoDialogOpen} onOpenChange={setSeoDialogOpen} clinicId={selectedClinicId} onSubmit={upsertSeoAnalytics} isSubmitting={isUpserting}
          defaults={latest ? { month: latest.month, domain_authority: latest.domain_authority, backlinks: latest.backlinks, keywords_top_10: latest.keywords_top_10, organic_traffic: latest.organic_traffic, top_keywords: latest.top_keywords } : undefined}
        />
      )}
    </DashboardLayout>
  );
}
