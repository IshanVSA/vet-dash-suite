import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, DollarSign, MousePointerClick, Target, Percent, Megaphone, BarChart3, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addVSALogoToAllPages } from "@/lib/pdf-logo";

interface Campaign {
  name: string;
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
}

interface DailyTrend {
  date: string;
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
}

interface MetricsJson {
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
  daily_trends: DailyTrend[];
  campaigns: Campaign[];
}

interface Props {
  clinicId: string;
}

interface ComputedMetrics {
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
  costPerConversion: number;
  campaigns: Campaign[];
  dailyTrends: DailyTrend[];
}

function computeMetrics(m: MetricsJson): ComputedMetrics {
  const { clicks, impressions, cost, conversions, daily_trends, campaigns } = m;
  const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
  const cpc = clicks > 0 ? Math.round((cost / clicks) * 100) / 100 : 0;
  const costPerConversion = conversions > 0 ? Math.round((cost / conversions) * 100) / 100 : 0;
  const sortedCampaigns = [...campaigns].sort((a, b) => b.cost - a.cost);
  return { clicks, impressions, cost, conversions, ctr, cpc, costPerConversion, campaigns: sortedCampaigns, dailyTrends: daily_trends || [] };
}

function fmtCurrency(v: number): string {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function GoogleAdsReportsTab({ clinicId }: Props) {
  const [metricsData, setMetricsData] = useState<MetricsJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [recordedAt, setRecordedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      const [{ data }, { data: clinicData }] = await Promise.all([
        supabase
          .from("analytics")
          .select("metrics_json, recorded_at")
          .eq("clinic_id", clinicId)
          .eq("platform", "google_ads")
          .eq("metric_type", "monthly_summary")
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("clinics").select("clinic_name").eq("id", clinicId).single(),
      ]);
      setMetricsData(data?.metrics_json ? (data.metrics_json as unknown as MetricsJson) : null);
      setRecordedAt(data?.recorded_at || null);
      setClinicName(clinicData?.clinic_name || "Unknown Clinic");
      setLoading(false);
    };
    fetchData();
  }, [clinicId]);

  const computed = useMemo(() => (metricsData ? computeMetrics(metricsData) : null), [metricsData]);

  const generatePDF = useCallback(async () => {
    if (!computed) return;
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const periodStr = recordedAt ? `Report synced: ${format(new Date(recordedAt), "MMM d, yyyy 'at' h:mm a")}` : "Last 30 Days";

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Google Ads Performance Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(clinicName, 14, 30);
      doc.text(periodStr, 14, 36);
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 40, 196, 40);

      // KPI Summary
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Key Metrics", 14, 50);

      autoTable(doc, {
        startY: 54,
        head: [["Metric", "Value"]],
        body: [
          ["Total Ad Spend", fmtCurrency(computed.cost)],
          ["Clicks", computed.clicks.toLocaleString()],
          ["Impressions", computed.impressions.toLocaleString()],
          ["Conversions", Math.round(computed.conversions).toLocaleString()],
          ["CTR", `${computed.ctr}%`],
          ["Avg. CPC", fmtCurrency(computed.cpc)],
          ["Cost per Conversion", fmtCurrency(computed.costPerConversion)],
        ],
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 },
        columnStyles: { 1: { fontStyle: "bold" } },
      });

      // Daily Spend Breakdown
      if (computed.dailyTrends.length > 0) {
        const afterKPI = (doc as any).lastAutoTable?.finalY || 120;
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Daily Performance", 14, afterKPI + 12);

        autoTable(doc, {
          startY: afterKPI + 16,
          head: [["Date", "Spend", "Clicks", "Impressions", "Conversions"]],
          body: computed.dailyTrends.map(d => [
            d.date,
            fmtCurrency(d.cost),
            d.clicks.toLocaleString(),
            d.impressions.toLocaleString(),
            Math.round(d.conversions).toString(),
          ]),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 },
        });
      }

      // Campaign Performance
      if (computed.campaigns.length > 0) {
        const afterDaily = (doc as any).lastAutoTable?.finalY || 160;
        if (afterDaily > 230) doc.addPage();
        const campY = afterDaily > 230 ? 20 : afterDaily + 12;

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Campaign Performance", 14, campY);

        autoTable(doc, {
          startY: campY + 4,
          head: [["Campaign", "Spend", "Clicks", "Impressions", "Conv.", "CTR", "CPC"]],
          body: computed.campaigns.map(c => {
            const ctr = c.impressions > 0 ? `${(Math.round((c.clicks / c.impressions) * 10000) / 100)}%` : "0%";
            const cpc = c.clicks > 0 ? fmtCurrency(Math.round((c.cost / c.clicks) * 100) / 100) : "$0.00";
            return [
              c.name,
              fmtCurrency(c.cost),
              c.clicks.toLocaleString(),
              c.impressions.toLocaleString(),
              Math.round(c.conversions).toString(),
              ctr,
              cpc,
            ];
          }),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 },
          columnStyles: { 0: { cellWidth: 55 } },
        });

        // Spend Distribution Summary
        const afterCamp = (doc as any).lastAutoTable?.finalY || 200;
        if (afterCamp > 240) doc.addPage();
        const distY = afterCamp > 240 ? 20 : afterCamp + 12;

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Spend Distribution", 14, distY);

        const totalSpend = computed.cost;
        autoTable(doc, {
          startY: distY + 4,
          head: [["Campaign", "Spend", "% of Total"]],
          body: computed.campaigns.map(c => [
            c.name,
            fmtCurrency(c.cost),
            totalSpend > 0 ? `${(Math.round((c.cost / totalSpend) * 1000) / 10)}%` : "0%",
          ]),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 80 } },
        });
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}  •  Page ${i} of ${pageCount}`, 14, 290);
      }

      await addVSALogoToAllPages(doc);
      doc.save(`${clinicName.replace(/\s+/g, "_")}_Google_Ads_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } finally {
      setGenerating(false);
    }
  }, [computed, clinicName, recordedAt]);

  if (!clinicId) {
    return <p className="text-muted-foreground text-sm text-center py-12">Select a clinic to generate reports.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" /> Generate Google Ads Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <Button
              onClick={generatePDF}
              disabled={loading || !computed || generating}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {generating ? "Generating…" : "Download PDF Report"}
            </Button>
          </div>
          {loading && <p className="text-xs text-muted-foreground mt-3">Loading data…</p>}
          {!loading && !computed && <p className="text-xs text-muted-foreground mt-3">No Google Ads data available. Sync data from the Analytics tab first.</p>}
          {recordedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Data from: {format(new Date(recordedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {computed && !loading && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Report Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* KPI Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <PreviewStat icon={DollarSign} label="Ad Spend" value={fmtCurrency(computed.cost)} />
              <PreviewStat icon={MousePointerClick} label="Clicks" value={computed.clicks.toLocaleString()} sub={`CPC: ${fmtCurrency(computed.cpc)}`} />
              <PreviewStat icon={Target} label="Conversions" value={Math.round(computed.conversions).toLocaleString()} sub={`${fmtCurrency(computed.costPerConversion)}/conv`} />
              <PreviewStat icon={Percent} label="CTR" value={`${computed.ctr}%`} sub={`${computed.impressions.toLocaleString()} impr.`} />
            </div>

            {/* Campaign Preview */}
            {computed.campaigns.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Megaphone className="h-3.5 w-3.5" /> Campaign Performance
                  </h4>
                  <div className="space-y-1">
                    {computed.campaigns.slice(0, 5).map(c => (
                      <div key={c.name} className="flex justify-between text-xs py-1 border-b border-border/50">
                        <span className="truncate max-w-[180px] font-medium">{c.name}</span>
                        <span className="tabular-nums text-muted-foreground">{fmtCurrency(c.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" /> Spend Distribution
                  </h4>
                  <div className="space-y-1">
                    {computed.campaigns.slice(0, 5).map(c => {
                      const pct = computed.cost > 0 ? Math.round((c.cost / computed.cost) * 1000) / 10 : 0;
                      return (
                        <div key={c.name} className="text-xs py-1 border-b border-border/50">
                          <div className="flex justify-between mb-1">
                            <span className="truncate max-w-[160px]">{c.name}</span>
                            <span className="tabular-nums text-muted-foreground">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PreviewStat({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
