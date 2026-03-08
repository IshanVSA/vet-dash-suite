import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/StatsCard";
import { FileCheck, CalendarDays, BarChart3, Building2, Users, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { NewTicketDialog } from "@/components/department/NewTicketDialog";
import { format, subDays, startOfDay } from "date-fns";

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
}

interface RequestSummary {
  generated: number;
  concierge_preferred: number;
  admin_approved: number;
  client_selected: number;
  final_approved: number;
}

const statusColors: Record<string, string> = {
  generated: "bg-blue-500",
  concierge_preferred: "bg-amber-500",
  admin_approved: "bg-primary",
  client_selected: "bg-violet-500",
  final_approved: "bg-emerald-500",
};

const statusLabels: Record<string, string> = {
  generated: "Generated",
  concierge_preferred: "Under Review",
  admin_approved: "Approved",
  client_selected: "Client Selected",
  final_approved: "Completed",
};

const socialServices = [
  "Content Creation", "Post Scheduling", "Engagement Management",
  "Analytics Review", "Campaign Strategy", "Others",
];

export function SocialOverview() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const [totalPosts, setTotalPosts] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [activeClinics, setActiveClinics] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ day: string; posts: number }[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [prefilledService, setPrefilledService] = useState("");
  const [requestSummary, setRequestSummary] = useState<RequestSummary>({
    generated: 0, concierge_preferred: 0, admin_approved: 0, client_selected: 0, final_approved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      // Total posts
      const { count: postCount } = await supabase
        .from("content_posts")
        .select("*", { count: "exact", head: true });
      setTotalPosts(postCount || 0);

      // Pending review posts
      const { count: pendCount } = await supabase
        .from("content_posts")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "pending", "flagged"]);
      setPendingReview(pendCount || 0);

      // Content requests
      const { data: reqData } = await supabase
        .from("content_requests")
        .select("status");
      const reqs = reqData || [];
      setTotalRequests(reqs.length);

      const summary: RequestSummary = {
        generated: 0, concierge_preferred: 0, admin_approved: 0, client_selected: 0, final_approved: 0,
      };
      reqs.forEach(r => {
        if (r.status in summary) summary[r.status as keyof RequestSummary]++;
      });
      setRequestSummary(summary);

      // Active clinics
      const { count: clinicCount } = await supabase
        .from("clinics")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      setActiveClinics(clinicCount || 0);

      // Weekly post trend (last 7 days)
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return { date: format(startOfDay(d), "yyyy-MM-dd"), label: format(d, "EEE") };
      });
      const { data: weekPosts } = await supabase
        .from("content_posts")
        .select("scheduled_date")
        .gte("scheduled_date", days[0].date)
        .lte("scheduled_date", days[6].date);
      const countMap: Record<string, number> = {};
      (weekPosts || []).forEach(p => {
        if (p.scheduled_date) countMap[p.scheduled_date] = (countMap[p.scheduled_date] || 0) + 1;
      });
      setWeeklyData(days.map(d => ({ day: d.label, posts: countMap[d.date] || 0 })));

      // Team (concierges)
      if (role === "admin") {
        const { data: conciergeRoles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("role", ["concierge"]);
        if (conciergeRoles && conciergeRoles.length > 0) {
          const userIds = conciergeRoles.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);
          const roleMap = Object.fromEntries(conciergeRoles.map(r => [r.user_id, r.role]));
          setTeam((profiles || []).map(p => ({
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            role: roleMap[p.id] || "concierge",
          })));
        }
      }

      setLoading(false);
    };

    fetchAll();
  }, [role, user]);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem",
    fontSize: "13px",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Posts" value={totalPosts} icon={CalendarDays} index={0} />
        <StatsCard title="Pending Review" value={pendingReview} icon={Clock} index={1} changeType={pendingReview > 0 ? "negative" : "neutral"} change={pendingReview > 0 ? "Needs attention" : "All clear"} />
        <StatsCard title="Content Requests" value={totalRequests} icon={FileCheck} index={2} />
        <StatsCard title="Active Clinics" value={activeClinics} icon={Building2} index={3} />
      </div>

      {/* Services */}
      <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <CardTitle className="text-base">Services</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {socialServices.map(s => (
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
        department="social_media"
        services={socialServices}
        onCreated={() => {}}
        defaultType={prefilledService}
      />

      {/* Charts + Panels Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Content Trend */}
        <Card className="overflow-hidden hover-lift animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Content Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team */}
        {role === "admin" && team.length > 0 ? (
          <Card className="overflow-hidden hover-lift animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {team.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-border">
                      <span className="text-xs font-bold text-primary">
                        {m.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{m.full_name || m.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden hover-lift animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Request Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {Object.entries(requestSummary).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status]}`} />
                      <span className="text-sm text-foreground">{statusLabels[status]}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Request Summary (for admin, shown below team) */}
      {role === "admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="overflow-hidden hover-lift animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Request Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {Object.entries(requestSummary).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status]}`} />
                      <span className="text-sm text-foreground">{statusLabels[status]}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
