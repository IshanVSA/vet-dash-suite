import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts";
import { BarChart3 } from "lucide-react";

interface ChartPoint { date: string; records: number; }

export default function Analytics() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      let query = supabase.from("analytics").select("*").order("recorded_at", { ascending: true });

      if (role === "concierge" && user) {
        const { data: clinics } = await supabase.from("clinics").select("id").eq("assigned_concierge_id", user.id);
        if (clinics?.length) {
          query = query.in("clinic_id", clinics.map(c => c.id));
        }
      }

      const { data: rows } = await query;
      const analytics = rows || [];
      setData(analytics);

      const dateMap: Record<string, number> = {};
      analytics.forEach((r: any) => {
        const month = r.date?.slice(0, 7) || r.recorded_at?.slice(0, 7);
        if (month) dateMap[month] = (dateMap[month] || 0) + 1;
      });
      setChartData(
        Object.entries(dateMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([date, records]) => ({ date, records }))
      );
      setLoading(false);
    };
    if (role) fetchAnalytics();
  }, [role, user]);

  const summaryStats = [
    { label: "Total Records", value: data.length, accent: "border-l-primary" },
    { label: "Platforms", value: new Set(data.map(d => d.platform)).size, accent: "border-l-success" },
    { label: "Clinics", value: new Set(data.map(d => d.clinic_id).filter(Boolean)).size, accent: "border-l-warning" },
    { label: "Date Range", value: data.length > 0 ? `${data[0].date || data[0].recorded_at?.slice(0, 10)} – ${data[data.length - 1].date || data[data.length - 1].recorded_at?.slice(0, 10)}` : "—", accent: "border-l-[hsl(var(--chart-4))]", isText: true },
  ];

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem",
    boxShadow: "0 8px 24px -4px hsl(var(--foreground) / 0.1)",
    fontSize: "13px",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="hero-section">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Performance</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {role === "admin" ? "Agency-wide performance metrics" : "Your clinic performance"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading analytics...
            </div>
          </div>
        ) : data.length === 0 ? (
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {summaryStats.map((stat, i) => (
                <Card key={i} className="overflow-hidden hover-lift animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                  <CardContent className="p-4">
                    <div className={`border-l-[3px] pl-3 ${stat.accent}`}>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</p>
                      {stat.isText ? (
                        <p className="text-sm font-medium text-foreground mt-1">{stat.value}</p>
                      ) : (
                        <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">{stat.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="overflow-hidden border-border/60 hover-lift animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                  <CardTitle className="text-base">Analytics Trend</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="records" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorRecords)" dot={{ r: 4, fill: "hsl(var(--card))", stroke: "hsl(var(--primary))", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border/60 hover-lift animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                  <CardTitle className="text-base">Records by Month</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="records" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
