import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, differenceInMilliseconds } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Download, Globe, Search, Megaphone, Share2,
  BarChart3, Eye, Users, TrendingDown, Clock, TrendingUp,
  Link2, Hash, DollarSign, MousePointerClick, Target, Percent,
} from "lucide-react";
import { useSeoAnalytics, type SeoKeyword } from "@/hooks/useSeoAnalytics";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addVSALogoToAllPages } from "@/lib/pdf-logo";

interface Props {
  clinicId: string;
}

type ReportPeriod = "last30" | "this_month" | "last_month";

const periodLabels: Record<ReportPeriod, string> = {
  last30: "Last 30 Days",
  this_month: "This Month",
  last_month: "Last Month",
};

function getDateRange(period: ReportPeriod): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "last30": return { from: subDays(now, 30), to: now };
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

function fmtCurrency(v: number): string {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pctText(cur: number, prev: number): string {
  if (prev === 0 && cur === 0) return "No change";
  if (prev === 0) return `+${cur} (new)`;
  const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct}%`;
}

interface WebMetrics {
  totalViews: number;
  totalSessions: number;
  bounceRate: number;
  avgDuration: number;
  pagesPerSession: number;
}

function calcWebMetrics(views: { session_id: string; path: string; created_at: string }[]): WebMetrics {
  const sessions: Record<string, typeof views> = {};
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
  const durations = sessionList.filter(s => s.length > 1).map(s => {
    const times = s.map(p => new Date(p.created_at).getTime());
    return (Math.max(...times) - Math.min(...times)) / 1000;
  });
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  return { totalViews, totalSessions, bounceRate, avgDuration, pagesPerSession };
}

export function UnifiedReportTab({ clinicId }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>("last30");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [clinicName, setClinicName] = useState("");

  // Website data
  const [webMetrics, setWebMetrics] = useState<WebMetrics | null>(null);
  const [prevWebMetrics, setPrevWebMetrics] = useState<WebMetrics | null>(null);

  // SEO data
  const { rows: seoRows } = useSeoAnalytics(clinicId);
  const latestSeo = seoRows.length > 0 ? seoRows[seoRows.length - 1] : null;
  const prevSeo = seoRows.length > 1 ? seoRows[seoRows.length - 2] : null;

  // Google Ads data
  const [adsData, setAdsData] = useState<any>(null);

  // Social Media data
  const [socialData, setSocialData] = useState<any[]>([]);

  const range = useMemo(() => getDateRange(period), [period]);
  const prevRange = useMemo(() => getPrevRange(range), [range]);

  useEffect(() => {
    if (!clinicId) { setLoading(false); return; }
    const fetchAll = async () => {
      setLoading(true);
      const [
        { data: pvData },
        { data: prevPvData },
        { data: clinicData },
        { data: adsRow },
        { data: socialRows },
      ] = await Promise.all([
        supabase.from("website_pageviews")
          .select("session_id, path, created_at")
          .eq("clinic_id", clinicId)
          .gte("created_at", range.from.toISOString())
          .lte("created_at", range.to.toISOString()),
        supabase.from("website_pageviews")
          .select("session_id, path, created_at")
          .eq("clinic_id", clinicId)
          .gte("created_at", prevRange.from.toISOString())
          .lte("created_at", prevRange.to.toISOString()),
        supabase.from("clinics").select("clinic_name").eq("id", clinicId).single(),
        supabase.from("analytics")
          .select("metrics_json")
          .eq("clinic_id", clinicId)
          .eq("platform", "google_ads")
          .eq("metric_type", "monthly_summary")
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("analytics")
          .select("platform, metric_type, value, date")
          .eq("clinic_id", clinicId)
          .in("platform", ["facebook", "instagram"])
          .order("recorded_at", { ascending: false })
          .limit(20),
      ]);

      const pv = (pvData || []) as { session_id: string; path: string; created_at: string }[];
      const prevPv = (prevPvData || []) as { session_id: string; path: string; created_at: string }[];
      setWebMetrics(pv.length > 0 ? calcWebMetrics(pv) : null);
      setPrevWebMetrics(prevPv.length > 0 ? calcWebMetrics(prevPv) : null);
      setClinicName(clinicData?.clinic_name || "Unknown Clinic");
      setAdsData(adsRow?.metrics_json || null);
      setSocialData(socialRows || []);
      setLoading(false);
    };
    fetchAll();
  }, [clinicId, range, prevRange]);

  const hasAnyData = webMetrics || latestSeo || adsData || socialData.length > 0;

  const generatePDF = useCallback(async () => {
    if (!hasAnyData) return;
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const dateStr = `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`;
      let y = 14;

      // ──────── TITLE ────────
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text("Unified Performance Report", 14, (y += 10));
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(clinicName, 14, (y += 8));
      doc.text(dateStr, 14, (y += 6));
      doc.setDrawColor(200, 200, 200);
      doc.line(14, (y += 4), 196, y);
      y += 6;

      // Helper color for section headers
      const sectionColor = (rgb: number[]) => {
        doc.setFontSize(15);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      };

      // ──────── 1. WEBSITE ────────
      sectionColor([249, 115, 22]);
      doc.text("Website", 14, (y += 4));
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      y += 4;

      if (webMetrics) {
        const pm = prevWebMetrics || { totalViews: 0, totalSessions: 0, bounceRate: 0, avgDuration: 0, pagesPerSession: 0 };
        autoTable(doc, {
          startY: y + 2,
          head: [["Metric", "Current", "Previous", "Change"]],
          body: [
            ["Page Views", webMetrics.totalViews.toLocaleString(), pm.totalViews.toLocaleString(), pctText(webMetrics.totalViews, pm.totalViews)],
            ["Visitors", webMetrics.totalSessions.toLocaleString(), pm.totalSessions.toLocaleString(), pctText(webMetrics.totalSessions, pm.totalSessions)],
            ["Bounce Rate", `${webMetrics.bounceRate}%`, `${pm.bounceRate}%`, pctText(webMetrics.bounceRate, pm.bounceRate)],
            ["Avg. Session", formatDuration(webMetrics.avgDuration), formatDuration(pm.avgDuration), pctText(webMetrics.avgDuration, pm.avgDuration)],
            ["Pages/Session", webMetrics.pagesPerSession.toString(), pm.pagesPerSession.toString(), pctText(webMetrics.pagesPerSession, pm.pagesPerSession)],
          ],
          theme: "striped",
          headStyles: { fillColor: [249, 115, 22] },
          styles: { fontSize: 9 },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 3) {
              const val = data.cell.text[0] || "";
              if (val.startsWith("+")) data.cell.styles.textColor = [22, 163, 74];
              else if (val.startsWith("-")) data.cell.styles.textColor = [220, 38, 38];
              else data.cell.styles.textColor = [120, 120, 120];
            }
          },
        });
        y = (doc as any).lastAutoTable?.finalY || y + 40;
      } else {
        doc.text("No website data available for this period.", 14, y + 2);
        y += 8;
      }

      // ──────── 2. SEO ────────
      y += 8;
      if (y > 240) { doc.addPage(); y = 20; }
      sectionColor([20, 184, 166]);
      doc.text("SEO", 14, y);
      y += 4;

      if (latestSeo) {
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(`Month: ${latestSeo.month}${prevSeo ? ` (vs ${prevSeo.month})` : ""}`, 14, y);
        y += 2;

        autoTable(doc, {
          startY: y + 2,
          head: [["Metric", "Current", "Previous", "Change"]],
          body: [
            ["Domain Authority", latestSeo.domain_authority.toString(), prevSeo?.domain_authority?.toString() || "—", prevSeo ? pctText(latestSeo.domain_authority, prevSeo.domain_authority) : "—"],
            ["Backlinks", latestSeo.backlinks.toLocaleString(), prevSeo?.backlinks?.toLocaleString() || "—", prevSeo ? pctText(latestSeo.backlinks, prevSeo.backlinks) : "—"],
            ["Keywords Top 10", latestSeo.keywords_top_10.toString(), prevSeo?.keywords_top_10?.toString() || "—", prevSeo ? pctText(latestSeo.keywords_top_10, prevSeo.keywords_top_10) : "—"],
            ["Organic Traffic", latestSeo.organic_traffic.toLocaleString(), prevSeo?.organic_traffic?.toLocaleString() || "—", prevSeo ? pctText(latestSeo.organic_traffic, prevSeo.organic_traffic) : "—"],
          ],
          theme: "striped",
          headStyles: { fillColor: [20, 184, 166] },
          styles: { fontSize: 9 },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 3) {
              const val = data.cell.text[0] || "";
              if (val.startsWith("+")) data.cell.styles.textColor = [22, 163, 74];
              else if (val.startsWith("-")) data.cell.styles.textColor = [220, 38, 38];
              else data.cell.styles.textColor = [120, 120, 120];
            }
          },
        });
        y = (doc as any).lastAutoTable?.finalY || y + 40;

        // Top Keywords
        const kws: SeoKeyword[] = latestSeo.top_keywords || [];
        if (kws.length > 0) {
          y += 4;
          if (y > 240) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          doc.setTextColor(20, 184, 166);
          doc.text("Top Keywords", 14, y);
          autoTable(doc, {
            startY: y + 4,
            head: [["#", "Keyword", "Position", "Change"]],
            body: kws.map((kw, i) => [(i + 1).toString(), kw.keyword, kw.position.toString(), kw.change]),
            theme: "striped",
            headStyles: { fillColor: [20, 184, 166] },
            styles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 90 } },
            didParseCell: (data: any) => {
              if (data.section === "body" && data.column.index === 3) {
                const val = data.cell.text[0] || "";
                if (val.startsWith("+")) data.cell.styles.textColor = [22, 163, 74];
                else if (val.startsWith("-")) data.cell.styles.textColor = [220, 38, 38];
              }
            },
          });
          y = (doc as any).lastAutoTable?.finalY || y + 30;
        }
      } else {
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text("No SEO data available.", 14, y);
        y += 6;
      }

      // ──────── 3. GOOGLE ADS ────────
      y += 8;
      if (y > 220) { doc.addPage(); y = 20; }
      sectionColor([59, 130, 246]);
      doc.text("Google Ads", 14, y);
      y += 4;

      if (adsData) {
        const m = adsData as any;
        const clicks = m.clicks || 0;
        const impressions = m.impressions || 0;
        const cost = m.cost || 0;
        const conversions = m.conversions || 0;
        const ctr = impressions > 0 ? `${(Math.round((clicks / impressions) * 10000) / 100)}%` : "0%";
        const cpc = clicks > 0 ? fmtCurrency(Math.round((cost / clicks) * 100) / 100) : "$0.00";

        autoTable(doc, {
          startY: y + 2,
          head: [["Metric", "Value"]],
          body: [
            ["Ad Spend", fmtCurrency(cost)],
            ["Clicks", clicks.toLocaleString()],
            ["Impressions", impressions.toLocaleString()],
            ["Conversions", Math.round(conversions).toLocaleString()],
            ["CTR", ctr],
            ["Avg. CPC", cpc],
          ],
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9 },
          columnStyles: { 1: { fontStyle: "bold" } },
        });
        y = (doc as any).lastAutoTable?.finalY || y + 40;

        // Campaigns
        const campaigns = (m.campaigns || []) as any[];
        if (campaigns.length > 0) {
          y += 4;
          if (y > 220) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          doc.setTextColor(59, 130, 246);
          doc.text("Campaign Performance", 14, y);
          autoTable(doc, {
            startY: y + 4,
            head: [["Campaign", "Spend", "Clicks", "Conv.", "CTR"]],
            body: campaigns.sort((a: any, b: any) => (b.cost || 0) - (a.cost || 0)).slice(0, 10).map((c: any) => {
              const campCtr = c.impressions > 0 ? `${(Math.round((c.clicks / c.impressions) * 10000) / 100)}%` : "0%";
              return [c.name, fmtCurrency(c.cost || 0), (c.clicks || 0).toLocaleString(), Math.round(c.conversions || 0).toString(), campCtr];
            }),
            theme: "striped",
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 60 } },
          });
          y = (doc as any).lastAutoTable?.finalY || y + 30;
        }
      } else {
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text("No Google Ads data available.", 14, y);
        y += 6;
      }

      // ──────── 4. SOCIAL MEDIA ────────
      y += 8;
      if (y > 220) { doc.addPage(); y = 20; }
      sectionColor([168, 85, 247]);
      doc.text("Social Media", 14, y);
      y += 4;

      if (socialData.length > 0) {
        const platformStats: Record<string, Record<string, number>> = {};
        socialData.forEach((r: any) => {
          const p = r.platform || "unknown";
          if (!platformStats[p]) platformStats[p] = {};
          const mt = r.metric_type || "records";
          platformStats[p][mt] = (platformStats[p][mt] || 0) + (r.value || 1);
        });

        const body = Object.entries(platformStats).map(([platform, metrics]) => {
          const metricStr = Object.entries(metrics).map(([k, v]) => `${k}: ${v}`).join(", ");
          return [platform, metricStr];
        });

        autoTable(doc, {
          startY: y + 2,
          head: [["Platform", "Metrics"]],
          body,
          theme: "striped",
          headStyles: { fillColor: [168, 85, 247] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 40 } },
        });
        y = (doc as any).lastAutoTable?.finalY || y + 30;
      } else {
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text("No social media data available.", 14, y);
        y += 6;
      }

      // ──────── FOOTER ────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}  •  Page ${i} of ${pageCount}`, 14, 290);
      }

      await addVSALogoToAllPages(doc);
      doc.save(`${clinicName.replace(/\s+/g, "_")}_Unified_Report_${format(range.from, "yyyy-MM-dd")}.pdf`);
    } finally {
      setGenerating(false);
    }
  }, [hasAnyData, webMetrics, prevWebMetrics, latestSeo, prevSeo, adsData, socialData, clinicName, range]);

  if (!clinicId) {
    return <p className="text-muted-foreground text-sm text-center py-12">Select a clinic to generate a unified report.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" /> Unified Performance Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Generate a combined PDF report covering Website, SEO, Google Ads, and Social Media performance for this clinic.
          </p>
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
              disabled={loading || !hasAnyData || generating}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {generating ? "Generating…" : "Download Unified Report"}
            </Button>
          </div>
          {loading && <p className="text-xs text-muted-foreground mt-3">Loading data…</p>}
          {!loading && !hasAnyData && <p className="text-xs text-muted-foreground mt-3">No data available for any department.</p>}
        </CardContent>
      </Card>

      {/* Data availability preview */}
      {!loading && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Report Summary — {periodLabels[period]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <DeptStatus
                icon={Globe}
                label="Website"
                available={!!webMetrics}
                summary={webMetrics ? `${webMetrics.totalViews} views, ${webMetrics.totalSessions} visitors` : undefined}
                color="text-orange-500"
              />
              <DeptStatus
                icon={Search}
                label="SEO"
                available={!!latestSeo}
                summary={latestSeo ? `DA ${latestSeo.domain_authority}, ${latestSeo.organic_traffic} organic` : undefined}
                color="text-teal-500"
              />
              <DeptStatus
                icon={Megaphone}
                label="Google Ads"
                available={!!adsData}
                summary={adsData ? `${fmtCurrency(adsData.cost || 0)} spend, ${(adsData.clicks || 0).toLocaleString()} clicks` : undefined}
                color="text-blue-500"
              />
              <DeptStatus
                icon={Share2}
                label="Social Media"
                available={socialData.length > 0}
                summary={socialData.length > 0 ? `${socialData.length} data points` : undefined}
                color="text-purple-500"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DeptStatus({ icon: Icon, label, available, summary, color }: {
  icon: React.ElementType;
  label: string;
  available: boolean;
  summary?: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
      <Icon className={`h-5 w-5 mx-auto mb-1.5 ${available ? color : "text-muted-foreground/40"}`} />
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {available ? (
        <p className="text-[10px] text-muted-foreground mt-1">{summary}</p>
      ) : (
        <p className="text-[10px] text-muted-foreground/60 mt-1">No data</p>
      )}
      <div className={`h-1.5 w-1.5 rounded-full mx-auto mt-2 ${available ? "bg-success" : "bg-muted-foreground/20"}`} />
    </div>
  );
}
