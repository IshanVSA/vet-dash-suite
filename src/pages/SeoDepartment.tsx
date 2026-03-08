import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, LayoutDashboard, Ticket, MessageSquare, FileText, Upload, TrendingUp, Link2, Hash, Globe } from "lucide-react";
import { DepartmentOverview } from "@/components/department/DepartmentOverview";
import { TicketsTab } from "@/components/department/TicketsTab";
import { ComingSoonTab } from "@/components/department/ComingSoonTab";
import { UploadsTab } from "@/components/department/UploadsTab";
import { ClinicSelector } from "@/components/department/ClinicSelector";
import { useDepartmentTeam } from "@/hooks/useDepartmentTeam";
import { useClinicSelector } from "@/hooks/useClinicSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const tabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "tickets", label: "Tickets", icon: Ticket },
  { value: "seo-thread", label: "SEO Thread", icon: MessageSquare },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "uploads", label: "Uploads", icon: Upload },
];

const kpis = [
  { label: "Domain Authority", value: 42, change: "+3 this month", changeType: "positive" as const, icon: Globe, gradient: "blue" as const },
  { label: "Backlinks", value: "1,280", change: "+45 new", changeType: "positive" as const, icon: Link2, gradient: "green" as const },
  { label: "Keywords Top 10", value: 87, change: "+12", changeType: "positive" as const, icon: Hash, gradient: "amber" as const },
  { label: "Organic Traffic", value: "8.4K", change: "+18.2%", changeType: "positive" as const, icon: TrendingUp, gradient: "purple" as const },
];

const services = [
  "Backlinking", "Ranking Reports", "Keyword Research", "Manual Work Reports",
  "Search Atlas Integration", "SEO Thread Updates", "Others",
];

const trafficData = [
  { label: "Sep", value: 5200 }, { label: "Oct", value: 5800 },
  { label: "Nov", value: 6100 }, { label: "Dec", value: 5900 },
  { label: "Jan", value: 7200 }, { label: "Feb", value: 7800 },
  { label: "Mar", value: 8400 },
];

const topKeywords = [
  { rank: 1, keyword: "veterinary clinic near me", position: 3, change: "+2" },
  { rank: 2, keyword: "pet dental care", position: 5, change: "+1" },
  { rank: 3, keyword: "emergency vet services", position: 7, change: "-1" },
  { rank: 4, keyword: "pet vaccinations", position: 8, change: "+3" },
  { rank: 5, keyword: "animal hospital reviews", position: 12, change: "+5" },
];

function TopKeywordsCard() {
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
            {topKeywords.map(kw => (
              <TableRow key={kw.rank}>
                <TableCell className="font-medium text-muted-foreground">{kw.rank}</TableCell>
                <TableCell className="font-medium">{kw.keyword}</TableCell>
                <TableCell className="text-right tabular-nums">{kw.position}</TableCell>
                <TableCell className={`text-right tabular-nums font-medium ${kw.change.startsWith("+") ? "text-success" : "text-destructive"}`}>
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

export default function SeoDepartment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const { team } = useDepartmentTeam("seo");
  const { clinics, selectedClinicId, setSelectedClinicId, loading: clinicsLoading } = useClinicSelector();

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 via-teal-500/90 to-emerald-500 p-5 sm:p-8 text-primary-foreground shadow-lg">
          <div className="absolute inset-0 dot-grid opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">SEO</h1>
            </div>
            <p className="text-primary-foreground/80 text-xs sm:text-sm max-w-lg">
              Track search rankings, keyword performance, and organic traffic growth.
            </p>
          </div>
        </div>

        {/* Clinic Selector */}
        <ClinicSelector
          clinics={clinics}
          selectedClinicId={selectedClinicId}
          onSelect={setSelectedClinicId}
          loading={clinicsLoading}
        />

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
              trafficData={trafficData}
              trafficLabel="Organic Traffic Trend"
              team={team}
              department="seo"
              accentColor="hsl(166, 72%, 40%)"
              extraSection={<TopKeywordsCard />}
              clinicId={selectedClinicId}
            />
          </TabsContent>
          <TabsContent value="tickets" className="mt-4"><TicketsTab department="seo" services={services} clinicId={selectedClinicId} /></TabsContent>
          <TabsContent value="seo-thread" className="mt-4"><ComingSoonTab label="SEO Thread" /></TabsContent>
          <TabsContent value="reports" className="mt-4"><ComingSoonTab label="Reports" /></TabsContent>
          <TabsContent value="uploads" className="mt-4"><UploadsTab department="seo" clinicId={selectedClinicId} /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
