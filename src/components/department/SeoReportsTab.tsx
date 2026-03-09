import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Globe, Link2, Hash, TrendingUp, BarChart3 } from "lucide-react";
import { useSeoAnalytics, type SeoAnalyticsRow, type SeoKeyword } from "@/hooks/useSeoAnalytics";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addVSALogoToAllPages } from "@/lib/pdf-logo";

interface Props {
  clinicId: string;
}

export function SeoReportsTab({ clinicId }: Props) {
  const { rows, isLoading } = useSeoAnalytics(clinicId);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  // Available months from data
  const months = useMemo(() => rows.map(r => r.month).sort().reverse(), [rows]);

  // Auto-select latest month
  const activeMonth = selectedMonth || months[0] || "";
  const current = useMemo(() => rows.find(r => r.month === activeMonth) || null, [rows, activeMonth]);

  // Find previous month for comparison
  const prevMonth = useMemo(() => {
    if (!activeMonth || months.length < 2) return null;
    const idx = months.indexOf(activeMonth);
    return idx < months.length - 1 ? rows.find(r => r.month === months[idx + 1]) || null : null;
  }, [rows, months, activeMonth]);

  const [clinicName, setClinicName] = useState("");
  // Fetch clinic name
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

  const generatePDF = useCallback(async () => {
    if (!current) return;
    setGenerating(true);
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("SEO Performance Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(clinicName, 14, 30);
      doc.text(`Month: ${current.month}`, 14, 36);
      if (prevMonth) {
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text(`Compared to: ${prevMonth.month}`, 14, 42);
      }
      doc.setDrawColor(220, 220, 220);
      doc.line(14, prevMonth ? 46 : 40, 196, prevMonth ? 46 : 40);

      // KPI Summary
      const startY = prevMonth ? 54 : 48;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Key Metrics", 14, startY);

      const kpiBody: string[][] = [
        ["Domain Authority", current.domain_authority.toString(), prevMonth?.domain_authority?.toString() || "—", prevMonth ? pctChange(current.domain_authority, prevMonth.domain_authority).text : "—"],
        ["Backlinks", current.backlinks.toLocaleString(), prevMonth?.backlinks?.toLocaleString() || "—", prevMonth ? pctChange(current.backlinks, prevMonth.backlinks).text : "—"],
        ["Keywords Top 10", current.keywords_top_10.toString(), prevMonth?.keywords_top_10?.toString() || "—", prevMonth ? pctChange(current.keywords_top_10, prevMonth.keywords_top_10).text : "—"],
        ["Organic Traffic", current.organic_traffic.toLocaleString(), prevMonth?.organic_traffic?.toLocaleString() || "—", prevMonth ? pctChange(current.organic_traffic, prevMonth.organic_traffic).text : "—"],
      ];

      autoTable(doc, {
        startY: startY + 4,
        head: [["Metric", "Current", "Previous", "Change"]],
        body: kpiBody,
        theme: "striped",
        headStyles: { fillColor: [20, 184, 166] }, // teal-500
        styles: { fontSize: 10 },
        columnStyles: { 3: { fontStyle: "bold" } },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 3) {
            const val = data.cell.text[0] || "";
            if (val.startsWith("+")) data.cell.styles.textColor = [22, 163, 74];
            else if (val.startsWith("-")) data.cell.styles.textColor = [220, 38, 38];
            else data.cell.styles.textColor = [120, 120, 120];
          }
        },
      });

      // Top Keywords
      const keywords: SeoKeyword[] = current.top_keywords || [];
      if (keywords.length > 0) {
        const afterKPI = (doc as any).lastAutoTable?.finalY || 120;
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Top Keywords", 14, afterKPI + 12);

        autoTable(doc, {
          startY: afterKPI + 16,
          head: [["#", "Keyword", "Position", "Change"]],
          body: keywords.map((kw, i) => [(i + 1).toString(), kw.keyword, kw.position.toString(), kw.change]),
          theme: "striped",
          headStyles: { fillColor: [20, 184, 166] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 90 } },
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 3) {
              const val = data.cell.text[0] || "";
              if (val.startsWith("+")) data.cell.styles.textColor = [22, 163, 74];
              else if (val.startsWith("-")) data.cell.styles.textColor = [220, 38, 38];
            }
          },
        });
      }

      // Traffic Trend (all months)
      if (rows.length > 1) {
        const afterKeywords = (doc as any).lastAutoTable?.finalY || 160;
        if (afterKeywords > 230) doc.addPage();
        const trendY = afterKeywords > 230 ? 20 : afterKeywords + 12;

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Organic Traffic Trend", 14, trendY);

        autoTable(doc, {
          startY: trendY + 4,
          head: [["Month", "Organic Traffic", "DA", "Backlinks", "Keywords Top 10"]],
          body: [...rows].sort((a, b) => b.month.localeCompare(a.month)).map(r => [
            r.month,
            r.organic_traffic.toLocaleString(),
            r.domain_authority.toString(),
            r.backlinks.toLocaleString(),
            r.keywords_top_10.toString(),
          ]),
          theme: "striped",
          headStyles: { fillColor: [20, 184, 166] },
          styles: { fontSize: 9 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}  •  Page ${i} of ${pageCount}`, 14, 290);
      }

      await addVSALogoToAllPages(doc);
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
      {/* Controls */}
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
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
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

      {/* Preview */}
      {current && !isLoading && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Report Preview — {current.month}
              </CardTitle>
              {prevMonth && (
                <span className="text-[10px] text-muted-foreground">vs {prevMonth.month}</span>
              )}
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
