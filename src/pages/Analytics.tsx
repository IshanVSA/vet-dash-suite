import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-hero rounded-xl p-6 -mx-2 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            {role === "admin" ? "Agency-wide performance metrics" : "Your clinic performance"}
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading analytics...</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover-lift animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
              <CardHeader className="bg-gradient-hero rounded-t-lg">
                <CardTitle className="text-base">Analytics Records Over Time</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="records" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
              <CardHeader className="bg-gradient-hero rounded-t-lg">
                <CardTitle className="text-base">Records by Month</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="records" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {summaryStats.map((stat, i) => (
                <div key={i} className={`border-l-4 pl-3 ${stat.accent}`}>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {stat.isText ? (
                    <p className="text-sm font-medium text-foreground">{stat.value}</p>
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
