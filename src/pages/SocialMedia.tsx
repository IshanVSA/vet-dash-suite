import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Share2, LayoutDashboard, FileCheck, CalendarDays, ClipboardList, BarChart3 } from "lucide-react";
import { SocialOverview } from "@/components/social/SocialOverview";
import { lazy, Suspense } from "react";

// Lazy load tab content to avoid importing everything upfront
import { TicketsTab } from "@/components/department/TicketsTab";

const ContentRequestsContent = lazy(() => import("@/components/social/ContentRequestsContent"));
const ContentCalendarContent = lazy(() => import("@/components/social/ContentCalendarContent"));
const IntakeFormsContent = lazy(() => import("@/components/social/IntakeFormsContent"));
const AnalyticsContent = lazy(() => import("@/components/social/AnalyticsContent"));

const TabFallback = () => (
  <div className="py-12 flex items-center justify-center">
    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const allTabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "requests", label: "Content Requests", icon: FileCheck },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
  { value: "intake", label: "Intake", icon: ClipboardList },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function SocialMedia() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useUserRole();
  const currentTab = searchParams.get("tab") || "overview";

  // Client sees fewer tabs
  const visibleTabs = role === "client"
    ? allTabs.filter(t => ["overview", "requests"].includes(t.value))
    : allTabs;

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-[hsl(280,65%,60%)] p-5 sm:p-8 text-primary-foreground shadow-lg">
          <div className="absolute inset-0 dot-grid opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">Social Media</h1>
            </div>
            <p className="text-primary-foreground/80 text-xs sm:text-sm max-w-lg">
              Manage content creation, scheduling, and performance across all your social channels.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 h-11 p-1 overflow-x-auto">
            {visibleTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ").pop()}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <SocialOverview />
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <ContentRequestsContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <ContentCalendarContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="intake" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <IntakeFormsContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <AnalyticsContent />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
