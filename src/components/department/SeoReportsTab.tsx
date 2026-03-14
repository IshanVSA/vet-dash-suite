import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Globe, Link2, Hash, TrendingUp, BarChart3 } from "lucide-react";
import { useSeoAnalytics, type SeoKeyword } from "@/hooks/useSeoAnalytics";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PDF_COLORS, renderPDFHeader, renderSectionHeader, renderKPICards,
  getTableStyles, colorChangeCell, finalizePDF, ensureSpace,
} from "@/lib/pdf-theme";

interface Props {
  clinicId: string;
}

export function SeoReportsTab({ clinicId }: Props) {
  const { rows, isLoading } = useSeoAnalytics(clinicId);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const months = useMemo(() => rows.map(r => r.month).sort().reverse(), [rows]);
  const activeMonth = selectedMonth || months[0] || "";
  const current = useMemo(() => rows.find(r => r.month === activeMonth) || null, [rows, activeMonth]);
  const prevMonth = useMemo(() => {
    if (!activeMonth || months.length < 2) return null;
    const idx = months.indexOf(activeMonth);
    return idx < months.length - 1 ? rows.find(r => r.month === months[idx + 1]) || null : null;
  }, [rows, months, activeMonth]);

  const [clinicName, setClinicName] = useState("");
  useMemo(() => {
    if (!clinicId) return;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("clinics").select("clinic_name").eq("id", clinicId).single().then(({ data }) => {
        setClinicName(data?.clinic_name || "Unknown Clinic");
      });
    });
  }, [clinicId]);

  function pctChange(cur: number, prev: number | undefined, invertBetter = false) {
    if (prev === undefined || prev === null) return { text: "—", color: "text-muted-foreground" };
    if (prev === 0 && cur === 0) return { text: "No change", color: "text-muted-foreground" };
    if (prev === 0) return { text: `+${cur} (new)`, color: invertBetter ? "text-destructive" : "text-success" };
    const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
    const sign = pct >= 0 ? "+" : "";
    let color = pct > 0 ? "text-success" : pct < 0 ? "text-destructive" : "text-muted-foreground";
    if (invertBetter) color = pct > 0 ? "text-destructive" : pct < 0 ? "text-success" : "text-muted-foreground";
    return { text: `${sign}${pct}%`, color };
  }

  function pctText(cur: number, prev: number): string {
    if (prev === 0 && cur === 0) return "No change";
    if (prev === 0) return `+${cur} (new)`;
    const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
    return `${pct >= 0 ? "+" : ""}${pct}%`;
  }

  const generatePDF = useCallback(async () => {
    if (!current) return;
    setGenerating(true);
    try {
      const doc = new jsPDF();

      // ── Header ──
      const subtitle = prevMonth ? `Month: ${current.month} vs ${prevMonth.month}` : `Month: ${current.month}`;
      let y = renderPDFHeader(doc, "SEO Performance Report", clinicName, subtitle, PDF_COLORS.seo);

      // ── KPI Cards ──
      y = renderKPICards(doc, y, [
        { label: "Domain Authority", value: current.domain_authority.toString(), change: prevMonth ? pctText(current.domain_authority, prevMonth.domain_authority) : undefined },
        { label: "Backlinks", value: current.backlinks.toLocaleString(), change: prevMonth ? pctText(current.backlinks, prevMonth.backlinks) : undefined },
        { label: "Keywords Top 10", value: current.keywords_top_10.toString(), change: prevMonth ? pctText(current.keywords_top_10, prevMonth.keywords_top_10) : undefined },
        { label: "Organic Traffic", value: current.organic_traffic.toLocaleString(), change: prevMonth ? pctText(current.organic_traffic, prevMonth.organic_traffic) : undefined },
      ], PDF_COLORS.seo);

      // ── Key Metrics Table ──
      y = renderSectionHeader(doc, "Key Metrics", y, PDF_COLORS.seo, prevMonth ? `Compared to ${prevMonth.month}` : undefined);

      autoTable(doc, {
        startY: y,
        head: [["Metric", "Current", "Previous", "Change"]],
        body: [
          ["Domain Authority", current.domain_authority.toString(), prevMonth?.domain_authority?.toString() || "—", prevMonth ? pctText(current.domain_authority, prevMonth.domain_authority) : "—"],
          ["Backlinks", current.backlinks.toLocaleString(), prevMonth?.backlinks?.toLocaleString() || "—", prevMonth ? pctText(current.backlinks, prevMonth.backlinks) : "—"],
          ["Keywords Top 10", current.keywords_top_10.toString(), prevMonth?.keywords_top_10?.toString() || "—", prevMonth ? pctText(current.keywords_top_10, prevMonth.keywords_top_10) : "—"],
          ["Organic Traffic", current.organic_traffic.toLocaleString(), prevMonth?.organic_traffic?.toLocaleString() || "—", prevMonth ? pctText(current.organic_traffic, prevMonth.organic_traffic) : "—"],
        ],
        ...getTableStyles(PDF_COLORS.seo),
        didParseCell: (data: any) => colorChangeCell(data, 3),
      });
      y = (doc as any).lastAutoTable?.finalY || y + 50;

      // ── Top Keywords ──
      const keywords: SeoKeyword[] = current.top_keywords || [];
      if (keywords.length > 0) {
        y = ensureSpace(doc, y + 8, 60);
        y = renderSectionHeader(doc, "Top Keywords", y, PDF_COLORS.seo);

        autoTable(doc, {
          startY: y,
          head: [["#", "Keyword", "Position", "Change"]],
          body: keywords.map((kw, i) => [(i + 1).toString(), kw.keyword, kw.position.toString(), kw.change]),
          ...getTableStyles(PDF_COLORS.seo),
          columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 90 } },
          didParseCell: (data: any) => colorChangeCell(data, 3),
        });
        y = (doc as any).lastAutoTable?.finalY || y + 50;
      }

      // ── Traffic Trend ──
      if (rows.length > 1) {
        y = ensureSpace(doc, y + 8, 60);
        y = renderSectionHeader(doc, "Organic Traffic Trend", y, PDF_COLORS.seo);

        autoTable(doc, {
          startY: y,
          head: [["Month", "Organic Traffic", "DA", "Backlinks", "Keywords Top 10"]],
          body: [...rows].sort((a, b) => b.month.localeCompare(a.month)).map(r => [
            r.month, r.organic_traffic.toLocaleString(), r.domain_authority.toString(), r.backlinks.toLocaleString(), r.keywords_top_10.toString(),
          ]),
          ...getTableStyles(PDF_COLORS.seo),
        });
      }

      await finalizePDF(doc);
      doc.save(`${clinicName.replace(/\s+/g, "_")}_SEO_Report_${current.month}.pdf`);
    } finally {
      setGenerating(false);
    }
  }, [current, prevMonth, rows, clinicName]);

  if (!clinicId) {
    return <p className="text-muted-foreground text-sm text-center py-12">Select a clinic to generate reports.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" /> Generate SEO Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Report Month</label>
              <Select value={activeMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  {months.map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generatePDF} disabled={isLoading || !current || generating} className="gap-2">
              <Download className="h-4 w-4" />
              {generating ? "Generating…" : "Download PDF Report"}
            </Button>
          </div>
          {isLoading && <p className="text-xs text-muted-foreground mt-3">Loading data…</p>}
          {!isLoading && months.length === 0 && <p className="text-xs text-muted-foreground mt-3">No SEO data available. Use "Update Analytics" to add data.</p>}
        </CardContent>
      </Card>

      {current && !isLoading && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Report Preview — {current.month}
              </CardTitle>
              {prevMonth && <span className="text-[10px] text-muted-foreground">vs {prevMonth.month}</span>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <PreviewStat icon={Globe} label="Domain Authority" value={current.domain_authority.toString()} change={pctChange(current.domain_authority, prevMonth?.domain_authority)} />
              <PreviewStat icon={Link2} label="Backlinks" value={current.backlinks.toLocaleString()} change={pctChange(current.backlinks, prevMonth?.backlinks)} />
              <PreviewStat icon={Hash} label="Keywords Top 10" value={current.keywords_top_10.toString()} change={pctChange(current.keywords_top_10, prevMonth?.keywords_top_10)} />
              <PreviewStat icon={TrendingUp} label="Organic Traffic" value={current.organic_traffic.toLocaleString()} change={pctChange(current.organic_traffic, prevMonth?.organic_traffic)} />
            </div>
            {current.top_keywords && current.top_keywords.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Top Keywords</h4>
                <div className="space-y-1">
                  {current.top_keywords.slice(0, 8).map((kw, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="font-medium truncate max-w-[200px]">{kw.keyword}</span>
                      <div className="flex gap-3">
                        <span className="tabular-nums text-muted-foreground">#{kw.position}</span>
                        <span className={`tabular-nums font-medium ${kw.change.startsWith("+") ? "text-success" : kw.change.startsWith("-") ? "text-destructive" : "text-muted-foreground"}`}>
                          {kw.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PreviewStat({ icon: Icon, label, value, change }: { icon: React.ElementType; label: string; value: string; change: { text: string; color: string } }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <span className={`text-[10px] font-medium ${change.color}`}>{change.text}</span>
    </div>
  );
}
