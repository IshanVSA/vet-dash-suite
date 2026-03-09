import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Globe, LayoutDashboard, Ticket, BarChart3, FileText, Upload } from "lucide-react";
import { DepartmentOverview } from "@/components/department/DepartmentOverview";
import { TicketsTab } from "@/components/department/TicketsTab";
import { ComingSoonTab } from "@/components/department/ComingSoonTab";
import { WebsiteAnalyticsTab } from "@/components/department/WebsiteAnalyticsTab";
import { WebsiteReportsTab } from "@/components/department/WebsiteReportsTab";
import { UploadsTab } from "@/components/department/UploadsTab";
import { ClinicSelector } from "@/components/department/ClinicSelector";
import { useDepartmentTeam } from "@/hooks/useDepartmentTeam";
import { useClinicSelector } from "@/hooks/useClinicSelector";
import { useWebsiteKPIs } from "@/hooks/useWebsiteKPIs";
import { Eye, TrendingDown, Clock, Layers } from "lucide-react";

const tabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "tickets", label: "Tickets", icon: Ticket },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "uploads", label: "Uploads", icon: Upload },
];

const services = [
  "Time Changes", "Pop-up Offers", "Theme Updates", "Add/Remove Team Members",
  "New Forms", "Paper-to-Digital Conversion", "Price List Updates",
  "3rd-Party Integrations", "Payment Options", "Others",
];

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
  return {
    text: `${sign}${pct}% vs last week`,
    type: pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral",
  };
}

export default function WebsiteDepartment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const { clinics, selectedClinicId, setSelectedClinicId, loading: clinicsLoading } = useClinicSelector();
  const { team } = useDepartmentTeam("website", selectedClinicId);
  const kpiData = useWebsiteKPIs(selectedClinicId);

  const selectedClinicName = clinics.find(c => c.id === selectedClinicId)?.clinic_name;

  const visitorsChange = formatChange(kpiData.visitorsToday, kpiData.visitorsLastWeek);
  // For bounce rate, lower is better so invert the change type
  const bounceChange = formatChange(kpiData.bounceRate, kpiData.bounceRatePrev, "%");
  const bounceChangeAdjusted = {
    ...bounceChange,
    type: bounceChange.type === "positive" ? "negative" as const : bounceChange.type === "negative" ? "positive" as const : "neutral" as const,
  };
  const durationChange = formatChange(kpiData.avgSessionDuration, kpiData.avgSessionDurationPrev);
  const pagesChange = formatChange(kpiData.pagesPerSession, kpiData.pagesPerSessionPrev);

  const kpis = [
    { label: "Visitors Today", value: kpiData.loading ? "—" : kpiData.visitorsToday.toLocaleString(), change: kpiData.loading ? "" : visitorsChange.text, changeType: visitorsChange.type, icon: Eye, gradient: "blue" as const },
    { label: "Bounce Rate", value: kpiData.loading ? "—" : `${kpiData.bounceRate}%`, change: kpiData.loading ? "" : bounceChangeAdjusted.text, changeType: bounceChangeAdjusted.type, icon: TrendingDown, gradient: "green" as const },
    { label: "Avg. Session", value: kpiData.loading ? "—" : formatDuration(kpiData.avgSessionDuration), change: kpiData.loading ? "" : durationChange.text, changeType: durationChange.type, icon: Clock, gradient: "amber" as const },
    { label: "Pages/Session", value: kpiData.loading ? "—" : kpiData.pagesPerSession.toString(), change: kpiData.loading ? "" : pagesChange.text, changeType: pagesChange.type, icon: Layers, gradient: "purple" as const },
  ];

  const trafficData = kpiData.dailyTraffic.length > 0
    ? kpiData.dailyTraffic
    : [{ label: "—", value: 0 }];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500/90 to-amber-500 p-5 sm:p-8 text-primary-foreground shadow-lg">
          <div className="absolute inset-0 dot-grid opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Website</h1>
                {selectedClinicName && (
                  <p className="text-primary-foreground/70 text-xs sm:text-sm font-medium -mt-0.5">{selectedClinicName}</p>
                )}
              </div>
            </div>
            <p className="text-primary-foreground/80 text-xs sm:text-sm max-w-lg">
              Manage website updates, performance tracking, and client requests.
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
              trafficLabel="Weekly Traffic"
              team={team}
              department="website"
              accentColor="hsl(25, 95%, 53%)"
              clinicId={selectedClinicId}
            />
          </TabsContent>
          <TabsContent value="tickets" className="mt-4"><TicketsTab department="website" services={services} clinicId={selectedClinicId} /></TabsContent>
          <TabsContent value="analytics" className="mt-4"><WebsiteAnalyticsTab clinicId={selectedClinicId} /></TabsContent>
          <TabsContent value="reports" className="mt-4"><WebsiteReportsTab clinicId={selectedClinicId} /></TabsContent>
          <TabsContent value="uploads" className="mt-4"><UploadsTab department="website" clinicId={selectedClinicId} /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
