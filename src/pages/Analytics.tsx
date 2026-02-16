import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Card>
          <CardHeader><CardTitle>Engagement by Platform</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground">Loading...</p> : chartData.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No analytics data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(168, 60%, 32%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
