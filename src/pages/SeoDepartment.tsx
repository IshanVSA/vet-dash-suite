import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, LayoutDashboard, Ticket, MessageSquare, FileText, Upload, TrendingUp, Link2, Hash, Globe, Pencil } from "lucide-react";
import { DepartmentOverview } from "@/components/department/DepartmentOverview";
import { TicketsTab } from "@/components/department/TicketsTab";
import { ComingSoonTab } from "@/components/department/ComingSoonTab";
import { SeoReportsTab } from "@/components/department/SeoReportsTab";
import { UploadsTab } from "@/components/department/UploadsTab";
import { ClinicSelector } from "@/components/department/ClinicSelector";
import { useDepartmentTeam } from "@/hooks/useDepartmentTeam";
import { useClinicSelector } from "@/hooks/useClinicSelector";
import { useSeoAnalytics } from "@/hooks/useSeoAnalytics";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UpdateSeoAnalyticsDialog } from "@/components/department/UpdateSeoAnalyticsDialog";
import { useState } from "react";
import type { SeoKeyword } from "@/hooks/useSeoAnalytics";

const tabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "tickets", label: "Tickets", icon: Ticket },
  { value: "seo-thread", label: "SEO Thread", icon: MessageSquare },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "uploads", label: "Uploads", icon: Upload },
];

const services = [
  "Backlinking", "Ranking Reports", "Keyword Research", "Manual Work Reports",
  "Search Atlas Integration", "SEO Thread Updates", "Others",
];

// Fallback static data when no DB records exist
const fallbackKpis = [
  { label: "Domain Authority", value: 0, icon: Globe, gradient: "blue" as const },
  { label: "Backlinks", value: 0, icon: Link2, gradient: "green" as const },
  { label: "Keywords Top 10", value: 0, icon: Hash, gradient: "amber" as const },
  { label: "Organic Traffic", value: 0, icon: TrendingUp, gradient: "purple" as const },
];

function TopKeywordsCard({ keywords }: { keywords: SeoKeyword[] }) {
  if (keywords.length === 0) {
    return (
      <Card className="overflow-hidden hover-lift">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            Top Keywords
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">No keyword data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover-lift">
      <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          Top Keywords
        </CardTitle>
      </CardHeader>
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

export default function SeoDepartment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const { clinics, selectedClinicId, setSelectedClinicId, loading: clinicsLoading } = useClinicSelector();
  const { team } = useDepartmentTeam("seo", selectedClinicId);
  const { latest, trafficData, topKeywords, isLoading: seoLoading, upsertSeoAnalytics, isUpserting } = useSeoAnalytics(selectedClinicId);
  const canEdit = useCanEditSeo();
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedClinicName = clinics.find(c => c.id === selectedClinicId)?.clinic_name;

  // Build dynamic KPIs from latest record
  const kpis = latest
    ? [
        { label: "Domain Authority", value: latest.domain_authority, icon: Globe, gradient: "blue" as const },
        { label: "Backlinks", value: latest.backlinks.toLocaleString(), icon: Link2, gradient: "green" as const },
        { label: "Keywords Top 10", value: latest.keywords_top_10, icon: Hash, gradient: "amber" as const },
        { label: "Organic Traffic", value: latest.organic_traffic.toLocaleString(), icon: TrendingUp, gradient: "purple" as const },
      ]
    : fallbackKpis;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 via-teal-500/90 to-emerald-500 p-5 sm:p-8 text-primary-foreground shadow-lg">
          <div className="absolute inset-0 dot-grid opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">SEO</h1>
                  {selectedClinicName && (
                    <p className="text-primary-foreground/70 text-xs sm:text-sm font-medium -mt-0.5">{selectedClinicName}</p>
                  )}
                </div>
              </div>
              {canEdit && selectedClinicId && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                  onClick={() => setDialogOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Update Analytics</span>
                </Button>
              )}
            </div>
            <p className="text-primary-foreground/80 text-xs sm:text-sm max-w-lg">
              Track search rankings, keyword performance, and organic traffic growth.
            </p>
          </div>
        </div>

        <ClinicSelector clinics={clinics} selectedClinicId={selectedClinicId} onSelect={setSelectedClinicId} loading={clinicsLoading} />

        <Tabs value={currentTab} onValueChange={(v) => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("tab", v); return next; }, { replace: true })} className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 h-11 p-1 overflow-x-auto">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <DepartmentOverview
              kpis={kpis}
              services={services}
              trafficData={trafficData.length > 0 ? trafficData : [{ label: "No data", value: 0 }]}
              trafficLabel="Organic Traffic Trend"
              team={team}
              department="seo"
              accentColor="hsl(166, 72%, 40%)"
              extraSection={<TopKeywordsCard keywords={topKeywords} />}
              clinicId={selectedClinicId}
            />
          </TabsContent>
          <TabsContent value="tickets" className="mt-4"><TicketsTab department="seo" services={services} clinicId={selectedClinicId} /></TabsContent>
          <TabsContent value="seo-thread" className="mt-4"><ComingSoonTab label="SEO Thread" /></TabsContent>
          <TabsContent value="reports" className="mt-4"><ComingSoonTab label="Reports" /></TabsContent>
          <TabsContent value="uploads" className="mt-4"><UploadsTab department="seo" clinicId={selectedClinicId} /></TabsContent>
        </Tabs>
      </div>

      {selectedClinicId && (
        <UpdateSeoAnalyticsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          clinicId={selectedClinicId}
          onSubmit={upsertSeoAnalytics}
          isSubmitting={isUpserting}
          defaults={latest ? {
            month: latest.month,
            domain_authority: latest.domain_authority,
            backlinks: latest.backlinks,
            keywords_top_10: latest.keywords_top_10,
            organic_traffic: latest.organic_traffic,
            top_keywords: latest.top_keywords,
          } : undefined}
        />
      )}
    </DashboardLayout>
  );
}
