import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import KPICard from "./KPICard";
import { Building2, FileText, UserCheck, UserCircle, TrendingUp, Clock, Ticket, AlertTriangle, Globe, Search, Megaphone, Share2, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { motion } from "framer-motion";
import UpcomingPosts from "./UpcomingPosts";
import RecentActivity from "./RecentActivity";
import MyTickets from "./MyTickets";
import { cn } from "@/lib/utils";

interface Clinic {
  id: string;
  clinic_name: string;
  status: string;
  assigned_concierge_id: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
}

interface TrendPoint {
  date: string;
  posts: number;
}

interface TicketSummary {
  department: string;
  open: number;
  in_progress: number;
  total: number;
}

const deptConfig: Record<string, { icon: React.ElementType; label: string; path: string; dotClass: string }> = {
  website: { icon: Globe, label: "Website", path: "/website?tab=tickets", dotClass: "bg-[hsl(var(--dept-website))]" },
  seo: { icon: Search, label: "SEO", path: "/seo?tab=tickets", dotClass: "bg-[hsl(var(--dept-seo))]" },
  google_ads: { icon: Megaphone, label: "Google Ads", path: "/google-ads?tab=tickets", dotClass: "bg-[hsl(var(--dept-ads))]" },
  social_media: { icon: Share2, label: "Social Media", path: "/social?tab=tickets", dotClass: "bg-[hsl(var(--dept-social))]" },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [roleCounts, setRoleCounts] = useState({ concierges: 0, clients: 0 });
  const [totalPosts, setTotalPosts] = useState(0);
  const [pendingPosts, setPendingPosts] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [urgentTickets, setUrgentTickets] = useState(0);
  const [ticketSummary, setTicketSummary] = useState<TicketSummary[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setUserName(data.full_name); });
  }, [user]);

  useEffect(() => {
    const fetchAll = async () => {
      const [clinicsRes, profilesRes, rolesRes, postsRes, pendingRes, ticketsRes] = await Promise.all([
        supabase.from("clinics").select("*"),
        supabase.from("profiles").select("id, full_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("content_posts").select("id, scheduled_date"),
        supabase.from("content_posts").select("id").eq("status", "pending"),
        supabase.from("department_tickets").select("id, department, status, priority"),
      ]);

      setClinics(clinicsRes.data || []);
      setProfiles(profilesRes.data || []);
      setTotalPosts((postsRes.data || []).length);
      setPendingPosts((pendingRes.data || []).length);

      const roles = rolesRes.data || [];
      setRoleCounts({
        concierges: roles.filter(r => r.role === "concierge").length,
        clients: roles.filter(r => r.role === "client").length,
      });

      const tickets = ticketsRes.data || [];
      setOpenTickets(tickets.filter(t => t.status === "open" || t.status === "in_progress").length);
      setUrgentTickets(tickets.filter(t => t.priority === "urgent" || t.priority === "emergency").length);

      const deptMap: Record<string, { open: number; in_progress: number; total: number }> = {};
      tickets.forEach(t => {
        if (!deptMap[t.department]) deptMap[t.department] = { open: 0, in_progress: 0, total: 0 };
        deptMap[t.department].total++;
        if (t.status === "open") deptMap[t.department].open++;
        if (t.status === "in_progress") deptMap[t.department].in_progress++;
      });
      setTicketSummary(Object.entries(deptMap).map(([department, counts]) => ({ department, ...counts })));

      const posts = postsRes.data || [];
      const monthMap: Record<string, number> = {};
      posts.forEach(p => {
        const month = (p as any).scheduled_date?.slice(0, 7);
        if (month) monthMap[month] = (monthMap[month] || 0) + 1;
      });
      const sorted = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([date, posts]) => ({ date, posts }));
      setTrendData(sorted);

      setLoading(false);
    };
    fetchAll();
  }, []);

  const getConciergeName = (id: string | null) => {
    if (!id) return "Unassigned";
    return profiles.find(p => p.id === id)?.full_name || "Unknown";
  };

  if (loading) return <DashboardSkeleton />;

  const statusLine = [
    pendingPosts > 0 && `${pendingPosts} pending review`,
    urgentTickets > 0 && `${urgentTickets} urgent ticket${urgentTickets > 1 ? "s" : ""}`,
    `${clinics.filter(c => c.status === "active").length} active clinics`,
  ].filter(Boolean).join(" · ");

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Compact Command-Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {userName ? `${userName.split(" ")[0]}'s Dashboard` : "Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{statusLine}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/review">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Review Queue
              {pendingPosts > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px] rounded-full">{pendingPosts}</Badge>}
            </Button>
          </Link>
          <Link to="/clinics">
            <Button size="sm" className="h-8 text-xs gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Clinics
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Active Clinics" value={clinics.filter(c => c.status === "active").length} change={`${clinics.length} total`} changeType="neutral" icon={Building2} index={0} gradient="blue" href="/clinics" />
        <KPICard label="Concierges" value={roleCounts.concierges} icon={UserCheck} index={1} gradient="green" href="/employees" />
        <KPICard label="Clients" value={roleCounts.clients} icon={UserCircle} index={2} gradient="amber" href="/clients" />
        <KPICard label="Open Tickets" value={openTickets} change={urgentTickets > 0 ? `${urgentTickets} urgent` : undefined} changeType={urgentTickets > 0 ? "negative" : "neutral"} icon={Ticket} index={3} gradient="purple" href="/website?tab=tickets" />
      </div>

      {/* Department Tickets + Content Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Tickets — compact horizontal bars */}
        <Card className="border-border/60">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Tickets by Department</h3>
            <span className="text-xs text-muted-foreground">{openTickets} active</span>
          </div>
          <CardContent className="p-0">
            {ticketSummary.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">All clear — no open tickets</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {ticketSummary.map((dept) => {
                  const cfg = deptConfig[dept.department] || { icon: Ticket, label: dept.department, path: "/", dotClass: "bg-muted-foreground" };
                  return (
                    <li key={dept.department} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("h-2 w-2 rounded-full", cfg.dotClass)} />
                        <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                        <span className="text-xs text-muted-foreground">{dept.open} open · {dept.in_progress} active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground tabular-nums">{dept.total}</span>
                        <Link to={cfg.path}><ArrowRight className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" /></Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Content Trend */}
        <Card className="border-border/60">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Content Trend</h3>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <CardContent className="pt-4 pb-2">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="posts" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorPosts)" dot={{ r: 3, fill: "hsl(var(--card))", stroke: "hsl(var(--primary))", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">No post data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Posts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingPosts />
        <RecentActivity />
      </div>

      {/* Clinics Table */}
      <Card className="border-border/60">
        <div className="px-4 py-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">All Clinics</h3>
            <p className="text-xs text-muted-foreground">{clinics.length} registered</p>
          </div>
          <Link to="/clinics">
            <Button variant="outline" size="sm" className="h-8 text-xs">View All</Button>
          </Link>
        </div>
        {clinics.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">No clinics yet. Add your first clinic to get started.</p>
            <Link to="/clinics"><Button size="sm" className="text-xs">Add Clinic</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="data-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Clinic Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Concierge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.slice(0, 10).map((clinic) => (
                  <TableRow key={clinic.id} className={cn(
                    "hover:bg-muted/40 transition-colors",
                    clinic.status === "active" ? "border-l-2 border-l-success" : "border-l-2 border-l-border"
                  )}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-primary">{clinic.clinic_name.charAt(0)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-sm">{clinic.clinic_name}</span>
                          <span className="sm:hidden block text-xs text-muted-foreground">{getConciergeName(clinic.assigned_concierge_id)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={clinic.assigned_concierge_id ? "text-foreground text-sm" : "text-muted-foreground italic text-sm"}>
                        {getConciergeName(clinic.assigned_concierge_id)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={clinic.status === "active" ? "default" : "secondary"} className="rounded-full px-2 text-[10px] font-semibold">
                        {clinic.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/clinics/${clinic.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
