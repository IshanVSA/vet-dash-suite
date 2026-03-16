import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Link2, Hash, TrendingUp, ArrowUp, ArrowDown, Minus, BarChart3, Target, Activity } from "lucide-react";
import { useSeoAnalytics, type SeoAnalyticsRow, type SeoKeyword } from "@/hooks/useSeoAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  clinicId: string;
}

function pctChange(cur: number, prev: number | undefined) {
  if (prev === undefined || prev === null) return null;
  if (prev === 0 && cur === 0) return { pct: 0, text: "No change", direction: "neutral" as const };
  if (prev === 0) return { pct: 100, text: `+${cur} (new)`, direction: "up" as const };
  const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
  return {
    pct,
    text: `${pct >= 0 ? "+" : ""}${pct}%`,
    direction: pct > 0 ? "up" as const : pct < 0 ? "down" as const : "neutral" as const,
  };
}

function ChangeIndicator({ change }: { change: ReturnType<typeof pctChange> }) {
  if (!change) return <span className="text-xs text-muted-foreground">—</span>;
  const colorMap = { up: "text-success", down: "text-destructive", neutral: "text-muted-foreground" };
  const IconMap = { up: ArrowUp, down: ArrowDown, neutral: Minus };
  const Icon = IconMap[change.direction];
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", colorMap[change.direction])}>
      <Icon className="h-3 w-3" />
      {change.text}
    </span>
  );
}

function KPICard({ icon: Icon, label, value, change, accentClass }: {
  icon: React.ElementType;
  label: string;
  value: string;
  change: ReturnType<typeof pctChange>;
  accentClass: string;
}) {
  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", accentClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <ChangeIndicator change={change} />
        </div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

export function SeoAnalyticsTab({ clinicId }: Props) {
  const { rows, isLoading } = useSeoAnalytics(clinicId);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const months = useMemo(() => rows.map(r => r.month).sort().reverse(), [rows]);
  const activeMonth = selectedMonth || months[0] || "";
  const current = useMemo(() => rows.find(r => r.month === activeMonth) || null, [rows, activeMonth]);
  const prevMonth = useMemo(() => {
    if (!activeMonth || months.length < 2) return null;
    const idx = months.indexOf(activeMonth);
    return idx < months.length - 1 ? rows.find(r => r.month === months[idx + 1]) || null : null;
  }, [rows, months, activeMonth]);

  const trafficTrend = useMemo(() =>
    [...rows].sort((a, b) => a.month.localeCompare(b.month)).map(r => ({
      month: r.month,
      traffic: r.organic_traffic,
      da: r.domain_authority,
      backlinks: r.backlinks,
      keywords: r.keywords_top_10,
    })),
    [rows]
  );

  if (!clinicId) {
    return <p className="text-sm text-muted-foreground text-center py-12">Select a clinic to view SEO analytics.</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No SEO data available</p>
          <p className="text-xs text-muted-foreground mt-1">Upload an SEO report to populate this section.</p>
        </CardContent>
      </Card>
    );
  }

  const keywords: SeoKeyword[] = current?.top_keywords || [];

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" /> SEO Performance
        </h2>
        <Select value={activeMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      {current && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={Globe} label="Domain Authority" value={current.domain_authority.toString()} change={pctChange(current.domain_authority, prevMonth?.domain_authority)} accentClass="bg-primary/10 text-primary" />
          <KPICard icon={Link2} label="Backlinks" value={current.backlinks.toLocaleString()} change={pctChange(current.backlinks, prevMonth?.backlinks)} accentClass="bg-success/10 text-success" />
          <KPICard icon={Hash} label="Keywords Top 10" value={current.keywords_top_10.toString()} change={pctChange(current.keywords_top_10, prevMonth?.keywords_top_10)} accentClass="bg-warning/10 text-warning" />
          <KPICard icon={TrendingUp} label="Organic Traffic" value={current.organic_traffic.toLocaleString()} change={pctChange(current.organic_traffic, prevMonth?.organic_traffic)} accentClass="bg-accent/20 text-accent-foreground" />
        </div>
      )}

      {/* Charts row */}
      {trafficTrend.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Traffic trend */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Organic Traffic Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficTrend}>
                    <defs>
                      <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="traffic" stroke="hsl(var(--primary))" fill="url(#trafficGrad)" strokeWidth={2} name="Traffic" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* DA + Backlinks trend */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> DA & Backlinks Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trafficTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                    <Bar yAxisId="right" dataKey="backlinks" fill="hsl(var(--success))" opacity={0.7} radius={[4, 4, 0, 0]} name="Backlinks" />
                    <Line yAxisId="left" type="monotone" dataKey="da" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="DA" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keywords table */}
      {keywords.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Top Keywords — {activeMonth}
              </CardTitle>
              <span className="text-[10px] text-muted-foreground">{keywords.length} keywords</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-right w-24">Position</TableHead>
                  <TableHead className="text-right w-24">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.map((kw, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium text-sm">{kw.keyword}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">#{kw.position}</TableCell>
                    <TableCell className={cn(
                      "text-right tabular-nums text-sm font-medium",
                      kw.change.startsWith("+") ? "text-success" : kw.change.startsWith("-") ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {kw.change}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Historical overview table */}
      {rows.length > 1 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Month-over-Month History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">DA</TableHead>
                  <TableHead className="text-right">Backlinks</TableHead>
                  <TableHead className="text-right">Keywords Top 10</TableHead>
                  <TableHead className="text-right">Organic Traffic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...rows].sort((a, b) => b.month.localeCompare(a.month)).map(r => (
                  <TableRow key={r.id} className={r.month === activeMonth ? "bg-muted/40" : ""}>
                    <TableCell className="font-medium text-sm">{r.month}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{r.domain_authority}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{r.backlinks.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{r.keywords_top_10}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{r.organic_traffic.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
