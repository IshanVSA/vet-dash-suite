import { type ContentPost } from "@/types/content-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyDashboardProps {
  posts: ContentPost[];
}

export function StrategyDashboard({ posts }: StrategyDashboardProps) {
  if (posts.length === 0) return null;

  // Content type distribution
  const typeCounts: Record<string, number> = {};
  posts.forEach((p) => {
    typeCounts[p.content_type] = (typeCounts[p.content_type] || 0) + 1;
  });
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  // Tag-based analysis for funnel & pillars
  const tags = posts.flatMap((p) => p.tags || []).map((t) => t.toLowerCase());
  const funnelData = [
    { name: "TOFU", value: tags.filter((t) => t.includes("awareness") || t.includes("top") || t.includes("tofu")).length || 0 },
    { name: "MOFU", value: tags.filter((t) => t.includes("consideration") || t.includes("middle") || t.includes("mofu")).length || 0 },
    { name: "BOFU", value: tags.filter((t) => t.includes("decision") || t.includes("bottom") || t.includes("bofu")).length || 0 },
  ];

  // Promo vs Educational
  const promo = tags.filter((t) => t.includes("promo") || t.includes("offer") || t.includes("sale")).length;
  const educational = tags.filter((t) => t.includes("educational") || t.includes("tip") || t.includes("health")).length;
  const totalTagged = promo + educational || 1;
  const promoPercent = Math.round((promo / totalTagged) * 100);
  const promoWarning = promoPercent > 40;

  const barColors = [
    "hsl(221, 83%, 53%)",
    "hsl(142, 71%, 45%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 65%, 60%)",
    "hsl(350, 80%, 55%)",
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Content Mix */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Mix</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={typeData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {typeData.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Funnel */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funnel Split</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={funnelData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={40} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                <Cell fill="hsl(221, 83%, 53%)" />
                <Cell fill="hsl(38, 92%, 50%)" />
                <Cell fill="hsl(142, 71%, 45%)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Promo vs Education */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Promo vs Education</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Promotional</span>
            <span className="text-xs font-semibold text-foreground">{promoPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", promoWarning ? "bg-destructive" : "bg-primary")}
              style={{ width: `${promoPercent}%` }}
            />
          </div>
          {promoWarning && (
            <div className="flex items-center gap-1 text-[10px] text-destructive">
              <AlertTriangle className="h-3 w-3" />
              Promotional content exceeds 40%
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
