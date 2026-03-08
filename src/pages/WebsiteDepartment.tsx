import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Globe, LayoutDashboard, Ticket, BarChart3, FileText, Upload } from "lucide-react";
import { DepartmentOverview } from "@/components/department/DepartmentOverview";
import { TicketsTab } from "@/components/department/TicketsTab";
import { ComingSoonTab } from "@/components/department/ComingSoonTab";
import { UploadsTab } from "@/components/department/UploadsTab";
import { useDepartmentTeam } from "@/hooks/useDepartmentTeam";
import { Eye, TrendingDown, Clock, Layers } from "lucide-react";

const tabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "tickets", label: "Tickets", icon: Ticket },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "uploads", label: "Uploads", icon: Upload },
];

const kpis = [
  { label: "Visitors Today", value: "1,247", change: "+12.3% vs last week", changeType: "positive" as const, icon: Eye, gradient: "blue" as const },
  { label: "Bounce Rate", value: "34.2%", change: "-2.1%", changeType: "positive" as const, icon: TrendingDown, gradient: "green" as const },
  { label: "Avg. Session", value: "3m 42s", change: "+18s", changeType: "positive" as const, icon: Clock, gradient: "amber" as const },
  { label: "Pages/Session", value: "4.8", change: "+0.3", changeType: "positive" as const, icon: Layers, gradient: "purple" as const },
];

const services = [
  "Time Changes", "Pop-up Offers", "Theme Updates", "Add/Remove Team Members",
  "New Forms", "Paper-to-Digital Conversion", "Price List Updates",
  "3rd-Party Integrations", "Payment Options", "Others",
];

const trafficData = [
  { label: "Mon", value: 320 }, { label: "Tue", value: 410 },
  { label: "Wed", value: 380 }, { label: "Thu", value: 450 },
  { label: "Fri", value: 520 }, { label: "Sat", value: 280 },
  { label: "Sun", value: 210 },
];

export default function WebsiteDepartment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const { team } = useDepartmentTeam("website");

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
              <h1 className="text-xl sm:text-2xl font-bold">Website</h1>
            </div>
            <p className="text-primary-foreground/80 text-xs sm:text-sm max-w-lg">
              Manage website updates, performance tracking, and client requests.
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
              trafficLabel="Weekly Traffic"
              team={team}
              department="website"
              accentColor="hsl(25, 95%, 53%)"
            />
          </TabsContent>
          <TabsContent value="tickets" className="mt-4"><TicketsTab department="website" services={services} /></TabsContent>
          <TabsContent value="analytics" className="mt-4"><ComingSoonTab label="Analytics" /></TabsContent>
          <TabsContent value="reports" className="mt-4"><ComingSoonTab label="Reports" /></TabsContent>
          <TabsContent value="uploads" className="mt-4"><UploadsTab department="website" /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
