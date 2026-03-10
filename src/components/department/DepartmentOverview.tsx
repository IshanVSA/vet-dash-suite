import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import KPICard from "@/components/dashboard/KPICard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, CheckCircle2, Clock, AlertTriangle, Inbox, LucideIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NewTicketDialog } from "@/components/department/NewTicketDialog";
import { cn } from "@/lib/utils";

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
      let query = supabase.from("department_tickets").select("status").eq("department", department as any);
      if (clinicId) query = query.eq("clinic_id", clinicId);
      const { data } = await query;
      if (!data) return;
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
  borderRadius: "0.5rem",
  fontSize: "12px",
};

export function DepartmentOverview({
  kpis, services, trafficData, trafficLabel = "Traffic Trend", team, department, accentColor = "hsl(var(--primary))", extraSection, clinicId,
}: DepartmentOverviewProps) {
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [prefilledService, setPrefilledService] = useState("");
  const ticketSummary = useTicketCounts(department, clinicId);
  const ticketRows = [
    { label: "Open", count: ticketSummary.open, icon: Inbox, color: "text-primary" },
    { label: "In Progress", count: ticketSummary.inProgress, icon: Clock, color: "text-warning" },
    { label: "Completed", count: ticketSummary.completed, icon: CheckCircle2, color: "text-success" },
    { label: "Emergency", count: ticketSummary.emergency, icon: AlertTriangle, color: "text-destructive" },
  ];
  const totalTickets = ticketRows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} label={kpi.label} value={kpi.value} change={kpi.change} changeType={kpi.changeType} icon={kpi.icon} index={i} gradient={kpi.gradient || (["blue", "green", "amber", "purple"][i % 4] as any)} />
        ))}
      </div>

      {/* Quick Actions — services as clickable chips */}
      <Card className="border-border/60">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Quick Actions</h3>
          <span className="text-[11px] text-muted-foreground">Click to create ticket</span>
        </div>
        <CardContent className="pt-3 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {services.map(s => (
              <Badge
                key={s}
                variant="secondary"
                className="text-xs font-medium px-2.5 py-1 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => { setPrefilledService(s); setTicketDialogOpen(true); }}
              >
                {s}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <NewTicketDialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen} department={department} services={services} onCreated={() => {}} defaultType={prefilledService} />

      {/* Chart + Ticket Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              {trafficLabel}
            </h3>
          </div>
          <CardContent className="pt-4 pb-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={accentColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ticket Summary — compact horizontal bar */}
        <Card className="border-border/60">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Ticket Summary</h3>
            <span className="text-xs text-muted-foreground tabular-nums">{totalTickets} total</span>
          </div>
          <CardContent className="pt-3">
            {/* Segmented bar */}
            {totalTickets > 0 && (
              <div className="flex h-2 rounded-full overflow-hidden mb-4 bg-muted">
                {ticketRows.filter(r => r.count > 0).map(r => (
                  <div
                    key={r.label}
                    className={cn("h-full transition-all", {
                      "bg-primary": r.label === "Open",
                      "bg-warning": r.label === "In Progress",
                      "bg-success": r.label === "Completed",
                      "bg-destructive": r.label === "Emergency",
                    })}
                    style={{ width: `${(r.count / totalTickets) * 100}%` }}
                  />
                ))}
              </div>
            )}
            <div className="space-y-2">
              {ticketRows.map(t => (
                <div key={t.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <t.icon className={cn("h-3.5 w-3.5", t.color)} />
                    <span className="text-sm text-foreground">{t.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums">{t.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      {team.length > 0 && (
        <Card className="border-border/60">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Team Members</h3>
            <span className="text-xs text-muted-foreground">{team.length} member{team.length !== 1 ? "s" : ""}</span>
          </div>
          <CardContent className="pt-3 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {team.map(m => (
                <div key={m.name} className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{m.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                    {m.teamRole && (
                      <p className="text-[11px] text-muted-foreground truncate">{m.teamRole}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {extraSection && <div>{extraSection}</div>}
    </div>
  );
}
