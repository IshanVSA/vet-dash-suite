import { useState, useEffect, useMemo } from "react";
import { format, subDays, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { Eye, Users, TrendingDown, FileText, Globe, Clock, CalendarIcon } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Pageview {
  session_id: string;
  path: string;
  referrer: string | null;
  created_at: string;
}

interface Props {
  clinicId: string;
}

export function WebsiteAnalyticsTab({ clinicId }: Props) {
  const [pageviews, setPageviews] = useState<Pageview[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const totalDays = differenceInDays(dateRange.to, dateRange.from) + 1;
  const isPresetRange = [7, 14, 30, 90].includes(totalDays) && 
    format(dateRange.to, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!clinicId) { setLoading(false); return; }

    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("website_pageviews")
        .select("session_id, path, referrer, created_at")
        .eq("clinic_id", clinicId)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });
      setPageviews((data as Pageview[] | null) || []);
      setLoading(false);
    };
    fetchData();
  }, [clinicId, dateRange]);

  const analytics = useMemo(() => {
    if (!pageviews.length) return null;

    const midpoint = new Date((dateRange.from.getTime() + dateRange.to.getTime()) / 2).getTime();

    const currentPeriod = pageviews.filter(p => new Date(p.created_at).getTime() >= midpoint);
    const prevPeriod = pageviews.filter(p => new Date(p.created_at).getTime() < midpoint);


    const calcKPIs = (views: Pageview[]) => {
      const sessions: Record<string, Pageview[]> = {};
      views.forEach(p => {
        if (!sessions[p.session_id]) sessions[p.session_id] = [];
        sessions[p.session_id].push(p);
      });
      const sessionList = Object.values(sessions);
      const totalSessions = sessionList.length;
      const totalViews = views.length;
      const bounces = sessionList.filter(s => s.length === 1).length;
      const bounceRate = totalSessions > 0 ? Math.round((bounces / totalSessions) * 1000) / 10 : 0;
      const durations = sessionList
        .filter(s => s.length > 1)
        .map(s => {
          const times = s.map(p => new Date(p.created_at).getTime());
          return (Math.max(...times) - Math.min(...times)) / 1000;
        });
      const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
      return { totalViews, uniqueVisitors: totalSessions, bounceRate, avgDuration };
    };

    const current = calcKPIs(currentPeriod);
    const prev = calcKPIs(prevPeriod);

    // Daily traffic
    const dailyMap: Record<string, number> = {};
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = subDays(dateRange.to, i);
      const key = format(d, "yyyy-MM-dd");
      dailyMap[key] = 0;
    }
    pageviews.forEach(p => {
      const key = p.created_at.slice(0, 10);
      if (key in dailyMap) dailyMap[key]++;
    });
    const dailyTraffic = Object.entries(dailyMap).map(([date, views]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views,
    }));

    // Top pages
    const pageCounts: Record<string, { views: number; visitors: Set<string> }> = {};
    pageviews.forEach(p => {
      if (!pageCounts[p.path]) pageCounts[p.path] = { views: 0, visitors: new Set() };
      pageCounts[p.path].views++;
      pageCounts[p.path].visitors.add(p.session_id);
    });
    const topPages = Object.entries(pageCounts)
      .map(([path, d]) => ({ path, views: d.views, visitors: d.visitors.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top referrers
    const refCounts: Record<string, number> = {};
    pageviews.forEach(p => {
      const ref = p.referrer || "Direct";
      refCounts[ref] = (refCounts[ref] || 0) + 1;
    });
    const topReferrers = Object.entries(refCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly breakdown
    const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, label: `${i.toString().padStart(2, "0")}:00`, views: 0 }));
    pageviews.forEach(p => {
      const h = new Date(p.created_at).getHours();
      hourly[h].views++;
    });

    return { current, prev, dailyTraffic, topPages, topReferrers, hourly };
  }, [pageviews, dateRange, totalDays]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!clinicId) {
    return <p className="text-muted-foreground text-sm text-center py-12">Select a clinic to view analytics.</p>;
  }

  if (!analytics || (analytics.current.totalViews === 0 && analytics.prev.totalViews === 0)) {
    return (
      <div className="space-y-6">
        {/* Keep date picker visible even with no data */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {[7, 14, 30, 90].map(days => (
              <Button
                key={days}
                size="sm"
                variant={totalDays === days ? "default" : "outline"}
                onClick={() => setDateRange({ from: subDays(new Date(), days), to: new Date() })}
                className="text-xs"
              >
                {days}d
              </Button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs gap-1.5", isPresetRange ? "text-muted-foreground" : "text-foreground border-primary/50")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {!isPresetRange && <span className="font-medium">Custom Range:</span>}
                {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to });
                  else if (range?.from) setDateRange({ from: range.from, to: range.from });
                }}
                disabled={(date) => date > new Date()}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="text-center py-16 space-y-2">
          <Globe className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">No pageview data for this date range.</p>
        </div>
      </div>
    );
  }

  const { current, prev, dailyTraffic, topPages, topReferrers, hourly } = analytics;

  const pctChange = (cur: number, prv: number, invertBetter = false) => {
    if (prv === 0 && cur === 0) return { text: "No change", type: "neutral" as const };
    if (prv === 0) return { text: `+${cur} (new)`, type: "positive" as const };
    const pct = Math.round(((cur - prv) / prv) * 1000) / 10;
    const sign = pct >= 0 ? "+" : "";
    let type: "positive" | "negative" | "neutral" = pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral";
    if (invertBetter) type = type === "positive" ? "negative" : type === "negative" ? "positive" : "neutral";
    return { text: `${sign}${pct}% vs prev`, type };
  };

  const viewsChange = pctChange(current.totalViews, prev.totalViews);
  const visitorsChange = pctChange(current.uniqueVisitors, prev.uniqueVisitors);
  const bounceChange = pctChange(current.bounceRate, prev.bounceRate, true);
  const durationChange = pctChange(current.avgDuration, prev.avgDuration);

  const formatDuration = (s: number) => {
    if (s <= 0) return "0s";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {[7, 14, 30, 90].map(days => (
            <Button
              key={days}
              size="sm"
              variant={totalDays === days ? "default" : "outline"}
              onClick={() => setDateRange({ from: subDays(new Date(), days), to: new Date() })}
              className="text-xs"
            >
              {days}d
            </Button>
          ))}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("text-xs gap-1.5", isPresetRange ? "text-muted-foreground" : "text-foreground border-primary/50")}>
              <CalendarIcon className="h-3.5 w-3.5" />
              {!isPresetRange && <span className="font-medium">Custom Range:</span>}
              {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to });
                else if (range?.from) setDateRange({ from: range.from, to: range.from });
              }}
              disabled={(date) => date > new Date()}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Page Views" value={current.totalViews.toLocaleString()} icon={Eye} change={viewsChange.text} changeType={viewsChange.type} index={0} />
        <StatsCard title="Unique Visitors" value={current.uniqueVisitors.toLocaleString()} icon={Users} change={visitorsChange.text} changeType={visitorsChange.type} index={1} />
        <StatsCard title="Bounce Rate" value={`${current.bounceRate}%`} icon={TrendingDown} change={bounceChange.text} changeType={bounceChange.type} index={2} />
        <StatsCard title="Avg. Session" value={formatDuration(current.avgDuration)} icon={Clock} change={durationChange.text} changeType={durationChange.type} index={3} />
      </div>

      {/* Daily Traffic Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Daily Traffic ({totalDays} Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ views: { label: "Page Views", color: "hsl(25, 95%, 53%)" } }} className="h-[260px] w-full">
            <AreaChart data={dailyTraffic}>
              <defs>
                <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="views" stroke="hsl(25, 95%, 53%)" fill="url(#fillViews)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Path</TableHead>
                  <TableHead className="text-xs text-right">Views</TableHead>
                  <TableHead className="text-xs text-right">Visitors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.map(p => (
                  <TableRow key={p.path}>
                    <TableCell className="text-xs font-mono truncate max-w-[200px]">{p.path}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.views}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.visitors}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" /> Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topReferrers.map(r => (
                  <TableRow key={r.source}>
                    <TableCell className="text-xs truncate max-w-[240px]">{r.source}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{r.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Traffic by Hour of Day</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ views: { label: "Page Views", color: "hsl(25, 95%, 53%)" } }} className="h-[200px] w-full">
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="views" fill="hsl(25, 95%, 53%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
