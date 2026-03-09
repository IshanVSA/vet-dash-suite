import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Megaphone, LayoutDashboard, Ticket, BarChart3, FileText, Upload, DollarSign, MousePointerClick, Target, Percent } from "lucide-react";
import { DepartmentOverview } from "@/components/department/DepartmentOverview";
import { TicketsTab } from "@/components/department/TicketsTab";
import { ComingSoonTab } from "@/components/department/ComingSoonTab";
import { GoogleAdsAnalyticsTab } from "@/components/department/GoogleAdsAnalyticsTab";
import { UploadsTab } from "@/components/department/UploadsTab";
import { ClinicSelector } from "@/components/department/ClinicSelector";
import { useDepartmentTeam } from "@/hooks/useDepartmentTeam";
import { useClinicSelector } from "@/hooks/useClinicSelector";
import { useGoogleAdsKPIs } from "@/hooks/useGoogleAdsKPIs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const tabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "tickets", label: "Tickets", icon: Ticket },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "uploads", label: "Uploads", icon: Upload },
];

const services = [
  "Dashboard Access", "Analytics Review", "Monthly Performance Report",
  "Call Volume Issues", "Wrong Call Tracking", "Campaign Adjustments", "Others",
];

export default function GoogleAdsDepartment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const { team } = useDepartmentTeam("google_ads");
  const { clinics, selectedClinicId, setSelectedClinicId, loading: clinicsLoading } = useClinicSelector();
  const adsData = useGoogleAdsKPIs(selectedClinicId);

  const selectedClinicName = clinics.find(c => c.id === selectedClinicId)?.clinic_name;

  const kpis = [
    {
      label: "Ad Spend",
      value: adsData.loading ? "—" : `$${adsData.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "Last 30 days",
      changeType: "neutral" as const,
      icon: DollarSign,
      gradient: "blue" as const,
    },
    {
      label: "Clicks",
      value: adsData.loading ? "—" : adsData.clicks.toLocaleString(),
      change: adsData.hasData ? `CPC: $${adsData.clicks > 0 ? (adsData.cost / adsData.clicks).toFixed(2) : "0"}` : "",
      changeType: "neutral" as const,
      icon: MousePointerClick,
      gradient: "green" as const,
    },
    {
      label: "Conversions",
      value: adsData.loading ? "—" : Math.round(adsData.conversions).toLocaleString(),
      change: adsData.hasData && adsData.conversions > 0 ? `$${(adsData.cost / adsData.conversions).toFixed(2)}/conv` : "",
      changeType: "neutral" as const,
      icon: Target,
      gradient: "amber" as const,
    },
    {
      label: "CTR",
      value: adsData.loading ? "—" : `${adsData.ctr}%`,
      change: adsData.hasData ? `${adsData.impressions.toLocaleString()} impr.` : "",
      changeType: "neutral" as const,
      icon: Percent,
      gradient: "purple" as const,
    },
  ];

  const trafficData = adsData.dailyTrend.length > 0
    ? adsData.dailyTrend
    : [{ label: "—", value: 0 }];

  const campaignsCard = adsData.hasData && adsData.campaigns.length > 0 ? (
    <Card className="overflow-hidden hover-lift">
      <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          Top Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Conv.</TableHead>
              <TableHead className="text-right">CTR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adsData.campaigns.map(c => (
              <TableRow key={c.name}>
                <TableCell className="font-medium truncate max-w-[180px]">{c.name}</TableCell>
                <TableCell className="text-right tabular-nums">{c.spend}</TableCell>
                <TableCell className="text-right tabular-nums">{c.clicks}</TableCell>
                <TableCell className="text-right tabular-nums">{c.conversions}</TableCell>
                <TableCell className="text-right tabular-nums">{c.ctr}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  ) : undefined;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-blue-400 p-5 sm:p-8 text-primary-foreground shadow-lg">
          <div className="absolute inset-0 dot-grid opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Google Ads</h1>
                {selectedClinicName && (
                  <p className="text-primary-foreground/70 text-xs sm:text-sm font-medium -mt-0.5">{selectedClinicName}</p>
                )}
              </div>
            </div>
            <p className="text-primary-foreground/80 text-xs sm:text-sm max-w-lg">
              Monitor ad campaigns, track conversions, and optimize your advertising spend.
            </p>
          </div>
        </div>

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
              trafficLabel="Weekly Click Trend"
              team={team}
              department="google_ads"
              accentColor="hsl(var(--primary))"
              extraSection={campaignsCard}
              clinicId={selectedClinicId}
            />
          </TabsContent>
          <TabsContent value="tickets" className="mt-4"><TicketsTab department="google_ads" services={services} clinicId={selectedClinicId} /></TabsContent>
          <TabsContent value="analytics" className="mt-4"><GoogleAdsAnalyticsTab clinicId={selectedClinicId} /></TabsContent>
          <TabsContent value="reports" className="mt-4"><ComingSoonTab label="Reports" /></TabsContent>
          <TabsContent value="uploads" className="mt-4"><UploadsTab department="google_ads" clinicId={selectedClinicId} /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
