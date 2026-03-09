import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, differenceInMilliseconds } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Users, TrendingDown, Clock, Globe, BarChart3, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addVSALogoToAllPages } from "@/lib/pdf-logo";

interface Pageview {
  session_id: string;
  path: string;
  referrer: string | null;
  created_at: string;
}

interface Props {
  clinicId: string;
}

type ReportPeriod = "last7" | "last30" | "last90" | "this_month" | "last_month";

const periodLabels: Record<ReportPeriod, string> = {
  last7: "Last 7 Days",
  last30: "Last 30 Days",
  last90: "Last 90 Days",
  this_month: "This Month",
  last_month: "Last Month",
};

function getDateRange(period: ReportPeriod): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "last7": return { from: subDays(now, 7), to: now };
    case "last30": return { from: subDays(now, 30), to: now };
    case "last90": return { from: subDays(now, 90), to: now };
    case "this_month": return { from: startOfMonth(now), to: now };
    case "last_month": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
  }
}

function getPrevRange(range: { from: Date; to: Date }): { from: Date; to: Date } {
  const duration = differenceInMilliseconds(range.to, range.from);
  const prevTo = new Date(range.from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);
  return { from: prevFrom, to: prevTo };
}

function formatDuration(s: number): string {
  if (s <= 0) return "0s";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

interface Metrics {
  totalViews: number;
  totalSessions: number;
  bounceRate: number;
  avgDuration: number;
  pagesPerSession: number;
  topPages: { path: string; views: number; visitors: number }[];
  topReferrers: { source: string; count: number }[];
  dailyTraffic: { date: string; count: number }[];
}

function calcMetrics(views: Pageview[]): Metrics {
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
  const pagesPerSession = totalSessions > 0 ? Math.round((totalViews / totalSessions) * 10) / 10 : 0;
  const durations = sessionList
    .filter(s => s.length > 1)
    .map(s => {
      const times = s.map(p => new Date(p.created_at).getTime());
      return (Math.max(...times) - Math.min(...times)) / 1000;
    });
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const pageCounts: Record<string, { views: number; visitors: Set<string> }> = {};
  views.forEach(p => {
    if (!pageCounts[p.path]) pageCounts[p.path] = { views: 0, visitors: new Set() };
    pageCounts[p.path].views++;
    pageCounts[p.path].visitors.add(p.session_id);
  });
  const topPages = Object.entries(pageCounts)
    .map(([path, d]) => ({ path, views: d.views, visitors: d.visitors.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const refCounts: Record<string, number> = {};
  views.forEach(p => {
    const ref = p.referrer || "Direct";
    refCounts[ref] = (refCounts[ref] || 0) + 1;
  });
  const topReferrers = Object.entries(refCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const dailyMap: Record<string, number> = {};
  views.forEach(p => {
    const key = p.created_at.slice(0, 10);
    dailyMap[key] = (dailyMap[key] || 0) + 1;
  });
  const dailyTraffic = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return { totalViews, totalSessions, bounceRate, avgDuration, pagesPerSession, topPages, topReferrers, dailyTraffic };
}

function pctChange(cur: number, prev: number, invertBetter = false): { pct: number; text: string; type: "positive" | "negative" | "neutral" } {
  if (prev === 0 && cur === 0) return { pct: 0, text: "No change", type: "neutral" };
  if (prev === 0) return { pct: 100, text: `+${cur} (new)`, type: invertBetter ? "negative" : "positive" };
  const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
  const sign = pct >= 0 ? "+" : "";
  let type: "positive" | "negative" | "neutral" = pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral";
  if (invertBetter) type = type === "positive" ? "negative" : type === "negative" ? "positive" : "neutral";
  return { pct, text: `${sign}${pct}%`, type };
}

export function WebsiteReportsTab({ clinicId }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>("last30");
  const [pageviews, setPageviews] = useState<Pageview[]>([]);
  const [prevPageviews, setPrevPageviews] = useState<Pageview[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState("");
  const [generating, setGenerating] = useState(false);

  const range = useMemo(() => getDateRange(period), [period]);
  const prevRange = useMemo(() => getPrevRange(range), [range]);

  useEffect(() => {
    if (!clinicId) { setLoading(false); return; }
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: pvData }, { data: prevData }, { data: clinicData }] = await Promise.all([
        supabase
          .from("website_pageviews")
          .select("session_id, path, referrer, created_at")
          .eq("clinic_id", clinicId)
          .gte("created_at", range.from.toISOString())
          .lte("created_at", range.to.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("website_pageviews")
          .select("session_id, path, referrer, created_at")
          .eq("clinic_id", clinicId)
          .gte("created_at", prevRange.from.toISOString())
          .lte("created_at", prevRange.to.toISOString()),
        supabase.from("clinics").select("clinic_name").eq("id", clinicId).single(),
      ]);
      setPageviews((pvData as Pageview[] | null) || []);
      setPrevPageviews((prevData as Pageview[] | null) || []);
      setClinicName(clinicData?.clinic_name || "Unknown Clinic");
      setLoading(false);
    };
    fetchAll();
  }, [clinicId, range, prevRange]);

  const metrics = useMemo(() => (pageviews.length > 0 ? calcMetrics(pageviews) : null), [pageviews]);
  const prevMetrics = useMemo(() => (prevPageviews.length > 0 ? calcMetrics(prevPageviews) : null), [prevPageviews]);

  const changes = useMemo(() => {
    if (!metrics) return null;
    const pm = prevMetrics || { totalViews: 0, totalSessions: 0, bounceRate: 0, avgDuration: 0, pagesPerSession: 0 };
    return {
      views: pctChange(metrics.totalViews, pm.totalViews),
      visitors: pctChange(metrics.totalSessions, pm.totalSessions),
      bounce: pctChange(metrics.bounceRate, pm.bounceRate, true),
      duration: pctChange(metrics.avgDuration, pm.avgDuration),
      pages: pctChange(metrics.pagesPerSession, pm.pagesPerSession),
    };
  }, [metrics, prevMetrics]);

  const generatePDF = useCallback(async () => {
    if (!metrics || !changes) return;
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const dateStr = `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`;
      const prevDateStr = `${format(prevRange.from, "MMM d")} – ${format(prevRange.to, "MMM d")}`;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Website Performance Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(clinicName, 14, 30);
      doc.text(dateStr, 14, 36);
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 40, 196, 40);

      // KPI Summary with comparison
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Key Metrics", 14, 50);
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text(`Compared to previous period (${prevDateStr})`, 14, 56);

      const pm = prevMetrics || { totalViews: 0, totalSessions: 0, bounceRate: 0, avgDuration: 0, pagesPerSession: 0 };

      autoTable(doc, {
        startY: 60,
        head: [["Metric", "Current", "Previous", "Change"]],
        body: [
          ["Page Views", metrics.totalViews.toLocaleString(), pm.totalViews.toLocaleString(), changes.views.text],
          ["Unique Visitors", metrics.totalSessions.toLocaleString(), pm.totalSessions.toLocaleString(), changes.visitors.text],
          ["Bounce Rate", `${metrics.bounceRate}%`, `${pm.bounceRate}%`, changes.bounce.text],
          ["Avg. Session Duration", formatDuration(metrics.avgDuration), formatDuration(pm.avgDuration), changes.duration.text],
          ["Pages per Session", metrics.pagesPerSession.toString(), pm.pagesPerSession.toString(), changes.pages.text],
        ],
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 10 },
        columnStyles: {
          3: {
            fontStyle: "bold",
          },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 3) {
            const val = data.cell.text[0] || "";
            if (val.startsWith("+")) data.cell.styles.textColor = [22, 163, 74];
            else if (val.startsWith("-")) data.cell.styles.textColor = [220, 38, 38];
            else data.cell.styles.textColor = [120, 120, 120];
          }
        },
      });

      // Daily Traffic
      const afterKPI = (doc as any).lastAutoTable?.finalY || 110;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Daily Traffic", 14, afterKPI + 12);

      autoTable(doc, {
        startY: afterKPI + 16,
        head: [["Date", "Page Views"]],
        body: metrics.dailyTraffic.map(d => [d.date, d.count.toString()]),
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 9 },
      });

      // Top Pages
      const afterDaily = (doc as any).lastAutoTable?.finalY || 160;
      if (afterDaily > 240) doc.addPage();
      const topPagesY = afterDaily > 240 ? 20 : afterDaily + 12;

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Top Pages", 14, topPagesY);

      autoTable(doc, {
        startY: topPagesY + 4,
        head: [["Path", "Views", "Visitors"]],
        body: metrics.topPages.map(p => [p.path, p.views.toString(), p.visitors.toString()]),
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 100 } },
      });

      // Top Referrers
      const afterPages = (doc as any).lastAutoTable?.finalY || 200;
      if (afterPages > 240) doc.addPage();
      const refY = afterPages > 240 ? 20 : afterPages + 12;

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Top Referrers", 14, refY);

      autoTable(doc, {
        startY: refY + 4,
        head: [["Source", "Visits"]],
        body: metrics.topReferrers.map(r => [r.source, r.count.toString()]),
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 120 } },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}  •  Page ${i} of ${pageCount}`, 14, 290);
      }

      await addVSALogoToAllPages(doc);
      doc.save(`${clinicName.replace(/\s+/g, "_")}_Website_Report_${format(range.from, "yyyy-MM-dd")}.pdf`);
    } finally {
      setGenerating(false);
    }
  }, [metrics, prevMetrics, changes, clinicName, range, prevRange]);

  if (!clinicId) {
    return <p className="text-muted-foreground text-sm text-center py-12">Select a clinic to generate reports.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" /> Generate Website Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Report Period</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(periodLabels) as [ReportPeriod, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generatePDF}
              disabled={loading || !metrics || generating}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {generating ? "Generating…" : "Download PDF Report"}
            </Button>
          </div>
          {loading && <p className="text-xs text-muted-foreground mt-3">Loading data…</p>}
          {!loading && !metrics && <p className="text-xs text-muted-foreground mt-3">No data available for this period.</p>}
        </CardContent>
      </Card>

      {/* Preview */}
      {metrics && changes && !loading && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Report Preview — {periodLabels[period]}
              </CardTitle>
              <span className="text-[10px] text-muted-foreground">
                vs {format(prevRange.from, "MMM d")} – {format(prevRange.to, "MMM d")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <PreviewStat icon={Eye} label="Page Views" value={metrics.totalViews.toLocaleString()} change={changes.views} />
              <PreviewStat icon={Users} label="Visitors" value={metrics.totalSessions.toLocaleString()} change={changes.visitors} />
              <PreviewStat icon={TrendingDown} label="Bounce Rate" value={`${metrics.bounceRate}%`} change={changes.bounce} />
              <PreviewStat icon={Clock} label="Avg. Session" value={formatDuration(metrics.avgDuration)} change={changes.duration} />
              <PreviewStat icon={Globe} label="Pages/Session" value={metrics.pagesPerSession.toString()} change={changes.pages} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Top Pages</h4>
                <div className="space-y-1">
                  {metrics.topPages.slice(0, 5).map(p => (
                    <div key={p.path} className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="font-mono truncate max-w-[200px]">{p.path}</span>
                      <span className="tabular-nums text-muted-foreground">{p.views} views</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Top Referrers</h4>
                <div className="space-y-1">
                  {metrics.topReferrers.slice(0, 5).map(r => (
                    <div key={r.source} className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="truncate max-w-[200px]">{r.source}</span>
                      <span className="tabular-nums text-muted-foreground">{r.count} visits</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ChangeInfo {
  pct: number;
  text: string;
  type: "positive" | "negative" | "neutral";
}

function PreviewStat({ icon: Icon, label, value, change }: { icon: React.ElementType; label: string; value: string; change: ChangeInfo }) {
  const ChangeIcon = change.type === "positive" ? ArrowUp : change.type === "negative" ? ArrowDown : Minus;
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <div className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5",
        change.type === "positive" && "bg-emerald-500/10 text-emerald-600",
        change.type === "negative" && "bg-red-500/10 text-red-600",
        change.type === "neutral" && "bg-muted text-muted-foreground",
      )}>
        <ChangeIcon className="h-2.5 w-2.5" />
        {change.text}
      </div>
    </div>
  );
}
