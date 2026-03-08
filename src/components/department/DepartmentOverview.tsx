import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import KPICard from "@/components/dashboard/KPICard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, BarChart3, CheckCircle2, Clock, AlertTriangle, Inbox, LucideIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NewTicketDialog } from "@/components/department/NewTicketDialog";

interface KPI {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  gradient?: "blue" | "green" | "amber" | "purple";
}

interface TeamMember {
  name: string;
  role: string;
  teamRole?: string | null;
}

interface TicketSummary {
  open: number;
  inProgress: number;
  completed: number;
  emergency: number;
}

interface TrafficDataPoint {
  label: string;
  value: number;
}

interface DepartmentOverviewProps {
  kpis: KPI[];
  services: string[];
  trafficData: TrafficDataPoint[];
  trafficLabel?: string;
  team: TeamMember[];
  department: string;
  accentColor?: string;
  extraSection?: ReactNode;
  clinicId?: string;
}

function useTicketCounts(department: string, clinicId?: string): TicketSummary {
  const [counts, setCounts] = useState<TicketSummary>({ open: 0, inProgress: 0, completed: 0, emergency: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      let query = supabase
        .from("department_tickets")
        .select("status")
        .eq("department", department as any);
      if (clinicId) {
        query = query.eq("clinic_id", clinicId);
      }
      const { data, error } = await query;
      if (error || !data) return;
      const summary = { open: 0, inProgress: 0, completed: 0, emergency: 0 };
      for (const row of data) {
        if (row.status === "open") summary.open++;
        else if (row.status === "in_progress") summary.inProgress++;
        else if (row.status === "completed") summary.completed++;
        else if (row.status === "emergency") summary.emergency++;
      }
      setCounts(summary);
    };

    fetchCounts();

    const channel = supabase
      .channel(`ticket-counts-${department}-${clinicId || "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "department_tickets", filter: `department=eq.${department}` }, fetchCounts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [department, clinicId]);

  return counts;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  fontSize: "13px",
};

export function DepartmentOverview({
  kpis,
  services,
  trafficData,
  trafficLabel = "Traffic Trend",
  team,
  department,
  accentColor = "hsl(var(--primary))",
  extraSection,
  clinicId,
}: DepartmentOverviewProps) {
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [prefilledService, setPrefilledService] = useState("");
  const ticketSummary = useTicketCounts(department, clinicId);
  const ticketRows = [
    { label: "Open", count: ticketSummary.open, icon: Inbox, color: "text-blue-500" },
    { label: "In Progress", count: ticketSummary.inProgress, icon: Clock, color: "text-warning" },
    { label: "Completed", count: ticketSummary.completed, icon: CheckCircle2, color: "text-success" },
    { label: "Emergency", count: ticketSummary.emergency, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            changeType={kpi.changeType}
            icon={kpi.icon}
            index={i}
            gradient={kpi.gradient || (["blue", "green", "amber", "purple"][i % 4] as "blue" | "green" | "amber" | "purple")}
          />
        ))}
      </div>

      {/* Services */}
      <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <CardTitle className="text-base">Services</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {services.map(s => (
              <Badge
                key={s}
                variant="secondary"
                className="text-xs font-medium px-3 py-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => { setPrefilledService(s); setTicketDialogOpen(true); }}
              >
                {s}
              </Badge>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">Click a service to create a ticket</p>
        </CardContent>
      </Card>

      <NewTicketDialog
        open={ticketDialogOpen}
        onOpenChange={setTicketDialogOpen}
        department={department}
        services={services}
        onCreated={() => {}}
        defaultType={prefilledService}
      />

      {/* Charts + Team Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traffic Trend */}
        <Card className="overflow-hidden hover-lift animate-fade-in" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
          <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {trafficLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={accentColor} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="overflow-hidden hover-lift animate-fade-in" style={{ animationDelay: "320ms", animationFillMode: "both" }}>
          <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {team.length === 0 && (
                <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
              )}
              {team.map(m => (
                <div key={m.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-border shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Summary + Extra */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden hover-lift animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
          <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
            <CardTitle className="text-base">Ticket Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {ticketRows.map(t => (
                <div key={t.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <t.icon className={`h-4 w-4 ${t.color}`} />
                    <span className="text-sm text-foreground">{t.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums">{t.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {extraSection && (
          <div className="animate-fade-in" style={{ animationDelay: "480ms", animationFillMode: "both" }}>
            {extraSection}
          </div>
        )}
      </div>
    </div>
  );
}
