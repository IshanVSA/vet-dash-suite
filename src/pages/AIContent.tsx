import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sparkles, Download, Calendar, ChevronDown, Copy, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Clinic { id: string; clinic_name: string; }
interface AIContentRow {
  id: string;
  clinic_id: string | null;
  month: string | null;
  generated_content: string | null;
  created_at: string;
  version_number: number;
  created_by: string | null;
}

export default function AIContent() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [months, setMonths] = useState<string[]>([]);
  const [content, setContent] = useState<AIContentRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinics = async () => {
      let query = supabase.from("clinics").select("id, clinic_name");
      if (role === "concierge") query = query.eq("assigned_concierge_id", user?.id);
      const { data } = await query;
      setClinics(data || []);
    };
    fetchClinics();
  }, [role, user]);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      let query = supabase.from("ai_content").select("*").order("created_at", { ascending: false });
      if (selectedClinic !== "all") query = query.eq("clinic_id", selectedClinic);
      if (selectedMonth !== "all") query = query.eq("month", selectedMonth);
      const { data } = await query;
      const rows = (data as any as AIContentRow[]) || [];
      setContent(rows);
      const allMonths = [...new Set(rows.map(r => r.month).filter(Boolean))].sort().reverse() as string[];
      setMonths(allMonths);

      const userIds = [...new Set(rows.map(r => r.created_by).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const map: Record<string, string> = {};
        (profileData || []).forEach(p => { map[p.id] = p.full_name || "Unknown"; });
        setProfiles(map);
      }
      setLoading(false);
    };
    fetchContent();
  }, [selectedClinic, selectedMonth]);

  const getClinicName = (id: string | null) => clinics.find(c => c.id === id)?.clinic_name || "Unknown";

  const copyAll = (item: AIContentRow) => {
    const gc = item.generated_content as any;
    if (typeof gc === "string") {
      navigator.clipboard.writeText(gc);
    } else if (gc && typeof gc === "object") {
      const text = [
        "CONTENT CALENDAR:\n" + (gc?.content_calendar || ""),
        "\nCAPTIONS:\n" + (gc?.captions || []).join("\n\n"),
        "\nREEL IDEAS:\n" + (gc?.reel_ideas || []).join("\n"),
        "\nHASHTAGS:\n" + (gc?.hashtags || ""),
        "\nAD COPIES:\n" + (gc?.ad_copies || []).join("\n\n"),
        "\nEMAIL NEWSLETTER:\n" + (gc?.email_newsletter || ""),
      ].join("\n");
      navigator.clipboard.writeText(text);
    }
    toast.success("Content copied to clipboard!");
  };

  const exportDoc = (item: AIContentRow) => {
    const gc = item.generated_content as any;
    const name = getClinicName(item.clinic_id);
    let html = `<html><head><meta charset="utf-8"><title>${name} Content Plan</title></head><body>`;
    html += `<h1>${name} — ${item.month || "N/A"} Content Plan</h1>`;
    html += `<p>Version ${item.version_number} | Generated ${format(new Date(item.created_at), "MMM d, yyyy")}</p>`;
    if (typeof gc === "string") {
      html += `<p>${gc}</p>`;
    } else if (gc) {
      if (gc.content_calendar) html += `<h2>Content Calendar</h2><p>${gc.content_calendar.replace(/\n/g, "<br>")}</p>`;
      if (gc.captions?.length) html += `<h2>Captions</h2>${gc.captions.map((c: string, i: number) => `<p><b>${i + 1}.</b> ${c}</p>`).join("")}`;
      if (gc.hashtags) html += `<h2>Hashtags</h2><p>${gc.hashtags}</p>`;
    }
    html += `</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}_${item.month || "content"}_v${item.version_number}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-hero rounded-xl p-6 -mx-2 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Content Engine
          </h1>
          <p className="text-muted-foreground mt-1">Browse and manage all AI-generated content</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedClinic} onValueChange={setSelectedClinic}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by clinic" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clinics</SelectItem>
              {clinics.map(c => (<SelectItem key={c.id} value={c.id}>{c.clinic_name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by month" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading content...</div>
        ) : content.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="py-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mx-auto mb-4" style={{ animation: "sparkle-pulse 2s ease-in-out infinite" }}>
                <Sparkles className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No AI Content Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Use the Monthly Intake Form from a clinic to generate AI-powered content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {content.map((item, idx) => {
              const gc = item.generated_content as any;
              const isExpanded = expandedId === item.id;
              return (
                <Collapsible key={item.id} open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : item.id)}>
                  <Card className="hover-lift animate-fade-in" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{getClinicName(item.clinic_id)}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {item.month && (
                            <Badge variant="secondary" className="text-xs"><Calendar className="h-3 w-3 mr-1" />{item.month}</Badge>
                          )}
                          <Badge className="bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground text-xs border-0">v{item.version_number}</Badge>
                          {item.created_by && profiles[item.created_by] && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" /> {profiles[item.created_by]}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copyAll(item); }}>
                          <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); exportDoc(item); }}>
                          <Download className="h-4 w-4 mr-1" /> Export
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>
                    {!isExpanded && (
                      <CardContent className="space-y-2 pt-0">
                        {typeof gc === "string" ? (
                          <p className="text-sm text-foreground line-clamp-2">{gc}</p>
                        ) : gc?.content_calendar ? (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Content Calendar</p>
                            <p className="text-sm text-foreground line-clamp-2">{gc.content_calendar}</p>
                          </div>
                        ) : null}
                      </CardContent>
                    )}
                    <CollapsibleContent>
                      <CardContent className="space-y-4 border-t border-border pt-4">
                        {typeof gc === "string" ? (
                          <p className="text-sm text-foreground whitespace-pre-wrap">{gc}</p>
                        ) : gc ? (
                          <>
                            {gc.content_calendar && (
                              <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Content Calendar</p><p className="text-sm text-foreground whitespace-pre-wrap">{gc.content_calendar}</p></div>
                            )}
                            {gc.posting_schedule && (
                              <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Posting Schedule</p><p className="text-sm text-foreground whitespace-pre-wrap">{gc.posting_schedule}</p></div>
                            )}
                            {gc.captions?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Captions ({gc.captions.length})</p>
                                <div className="space-y-2">{gc.captions.map((c: string, i: number) => (<div key={i} className="p-3 rounded-lg bg-secondary text-sm text-foreground">{c}</div>))}</div>
                              </div>
                            )}
                            {gc.reel_ideas?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reel Ideas ({gc.reel_ideas.length})</p>
                                <ul className="space-y-1">{gc.reel_ideas.map((r: string, i: number) => (<li key={i} className="text-sm text-foreground"><span className="font-bold text-primary">{i + 1}.</span> {r}</li>))}</ul>
                              </div>
                            )}
                            {gc.hashtags && (
                              <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Hashtags</p><p className="text-sm text-primary">{gc.hashtags}</p></div>
                            )}
                            {gc.ad_copies?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Ad Copies ({gc.ad_copies.length})</p>
                                <div className="space-y-2">{gc.ad_copies.map((a: string, i: number) => (<div key={i} className="p-3 rounded-lg bg-secondary text-sm text-foreground">{a}</div>))}</div>
                              </div>
                            )}
                            {gc.email_newsletter && (
                              <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Email Newsletter</p><pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{gc.email_newsletter}</pre></div>
                            )}
                          </>
                        ) : null}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
