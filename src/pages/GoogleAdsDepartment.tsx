import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Megaphone, LayoutDashboard, Ticket, BarChart3, FileText, Upload, DollarSign, MousePointerClick, Target, Percent } from "lucide-react";
import { DepartmentOverview } from "@/components/department/DepartmentOverview";
import { TicketsTab } from "@/components/department/TicketsTab";
import { ComingSoonTab } from "@/components/department/ComingSoonTab";
import { UploadsTab } from "@/components/department/UploadsTab";
import { useDepartmentTeam } from "@/hooks/useDepartmentTeam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const tabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "tickets", label: "Tickets", icon: Ticket },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "uploads", label: "Uploads", icon: Upload },
];

const kpis = [
  { label: "Ad Spend", value: "$4,280", change: "+8.5% vs last month", changeType: "neutral" as const, icon: DollarSign, gradient: "blue" as const },
  { label: "Clicks", value: "3,412", change: "+22.1%", changeType: "positive" as const, icon: MousePointerClick, gradient: "green" as const },
  { label: "Conversions", value: 187, change: "+15 this week", changeType: "positive" as const, icon: Target, gradient: "amber" as const },
  { label: "CTR", value: "5.48%", change: "+0.32%", changeType: "positive" as const, icon: Percent, gradient: "purple" as const },
];

const services = [
  "Dashboard Access", "Analytics Review", "Monthly Performance Report",
  "Call Volume Issues", "Wrong Call Tracking", "Campaign Adjustments", "Others",
];

const trafficData = [
  { label: "Mon", value: 480 }, { label: "Tue", value: 520 },
  { label: "Wed", value: 490 }, { label: "Thu", value: 560 },
  { label: "Fri", value: 610 }, { label: "Sat", value: 380 },
  { label: "Sun", value: 310 },
];


const campaigns = [
  { name: "Brand Awareness", spend: "$1,200", clicks: "1,020", conversions: 62, ctr: "6.2%" },
  { name: "Emergency Services", spend: "$980", clicks: "842", conversions: 48, ctr: "5.8%" },
  { name: "Dental Care Promo", spend: "$750", clicks: "680", conversions: 35, ctr: "4.9%" },
  { name: "New Client Offer", spend: "$650", clicks: "540", conversions: 28, ctr: "4.3%" },
  { name: "Wellness Plans", spend: "$700", clicks: "330", conversions: 14, ctr: "5.1%" },
];

function CampaignsCard() {
  return (
    <Card className="overflow-hidden hover-lift">
      <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          Campaigns
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
            {campaigns.map(c => (
              <TableRow key={c.name}>
                <TableCell className="font-medium">{c.name}</TableCell>
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
  );
}

export default function GoogleAdsDepartment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

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
              <h1 className="text-xl sm:text-2xl font-bold">Google Ads</h1>
            </div>
            <p className="text-primary-foreground/80 text-xs sm:text-sm max-w-lg">
              Monitor ad campaigns, track conversions, and optimize your advertising spend.
            </p>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })} className="w-full">
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
              extraSection={<CampaignsCard />}
            />
          </TabsContent>
          <TabsContent value="tickets" className="mt-4"><TicketsTab department="google_ads" services={services} /></TabsContent>
          <TabsContent value="analytics" className="mt-4"><ComingSoonTab label="Analytics" /></TabsContent>
          <TabsContent value="reports" className="mt-4"><ComingSoonTab label="Reports" /></TabsContent>
          <TabsContent value="uploads" className="mt-4"><UploadsTab department="google_ads" /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
