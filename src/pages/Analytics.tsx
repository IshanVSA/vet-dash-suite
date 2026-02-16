import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("analytics").select("*").order("recorded_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const chartData = analytics?.reduce((acc, item) => {
    const existing = acc.find((d) => d.platform === item.platform);
    if (existing) {
      existing.value += Number(item.value);
    } else {
      acc.push({ platform: item.platform, value: Number(item.value) });
    }
    return acc;
  }, [] as { platform: string; value: number }[]) ?? [];

  const summaryStats = [
    { label: "Total Records", value: analytics?.length ?? 0, accent: "border-l-primary" },
    { label: "Platforms", value: new Set(analytics?.map(d => d.platform)).size, accent: "border-l-success" },
    { label: "Clinics", value: new Set(analytics?.map(d => d.clinic_id).filter(Boolean)).size, accent: "border-l-warning" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-hero rounded-xl p-6 -mx-2 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Performance metrics across all platforms</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading analytics...</p>
        ) : !analytics?.length ? (
          <Card className="animate-fade-in">
            <CardContent className="py-12 text-center text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-accent-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground">No analytics data available</p>
              <p className="text-sm mt-1">Connect clinic API credentials and sync data to see metrics here.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="hover-lift animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
                <CardHeader className="bg-gradient-hero rounded-t-lg">
                  <CardTitle className="text-base">Engagement by Platform</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="hover-lift animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
                <CardHeader className="bg-gradient-hero rounded-t-lg">
                  <CardTitle className="text-base">Trend</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
              <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {summaryStats.map((stat, i) => (
                    <div key={i} className={`border-l-4 pl-3 ${stat.accent}`}>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
