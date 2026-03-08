import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import KPICard from "./KPICard";
import { Building2, FileText, UserCheck, UserCircle, TrendingUp, Clock, Ticket, AlertTriangle, Globe, Search, Megaphone, Share2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { motion } from "framer-motion";
import UpcomingPosts from "./UpcomingPosts";
import RecentActivity from "./RecentActivity";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

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

const deptConfig: Record<string, { icon: React.ElementType; label: string; path: string; color: string }> = {
  website: { icon: Globe, label: "Website", path: "/website?tab=tickets", color: "text-primary" },
  seo: { icon: Search, label: "SEO", path: "/seo?tab=tickets", color: "text-emerald-500" },
  google_ads: { icon: Megaphone, label: "Google Ads", path: "/google-ads?tab=tickets", color: "text-amber-500" },
  social_media: { icon: Share2, label: "Social Media", path: "/social?tab=tickets", color: "text-violet-500" },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
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

      // Tickets
      const tickets = ticketsRes.data || [];
      setOpenTickets(tickets.filter(t => t.status === "open" || t.status === "in_progress").length);
      setUrgentTickets(tickets.filter(t => t.priority === "urgent" || t.priority === "emergency").length);

      // Ticket summary by department
      const deptMap: Record<string, { open: number; in_progress: number; total: number }> = {};
      tickets.forEach(t => {
        if (!deptMap[t.department]) deptMap[t.department] = { open: 0, in_progress: 0, total: 0 };
        deptMap[t.department].total++;
        if (t.status === "open") deptMap[t.department].open++;
        if (t.status === "in_progress") deptMap[t.department].in_progress++;
      });
      setTicketSummary(
        Object.entries(deptMap).map(([department, counts]) => ({ department, ...counts }))
      );

      // Posts trend
      const posts = postsRes.data || [];
      const monthMap: Record<string, number> = {};
      posts.forEach(p => {
        const month = (p as any).scheduled_date?.slice(0, 7);
        if (month) monthMap[month] = (monthMap[month] || 0) + 1;
      });
      const sorted = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([date, posts]) => ({ date, posts }));
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

  return (
    <motion.div className="space-y-6 sm:space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Overview</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">{today} — Monitor clinic operations and content performance</p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard label="Active Clinics" value={clinics.filter(c => c.status === "active").length} change={`${clinics.length} total`} changeType="neutral" icon={Building2} index={0} gradient="blue" />
        <KPICard label="Total Posts" value={totalPosts} icon={FileText} index={1} gradient="purple" />
        <KPICard label="Concierges" value={roleCounts.concierges} icon={UserCheck} index={2} gradient="green" />
        <KPICard label="Clients" value={roleCounts.clients} icon={UserCircle} index={3} gradient="amber" />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KPICard label="Pending Review" value={pendingPosts} icon={Clock} index={4} gradient="amber" />
        <KPICard label="Open Tickets" value={openTickets} change={urgentTickets > 0 ? `${urgentTickets} urgent` : undefined} changeType={urgentTickets > 0 ? "negative" : "neutral"} icon={Ticket} index={5} gradient="blue" />
        {urgentTickets > 0 && (
          <KPICard label="Urgent / Emergency" value={urgentTickets} icon={AlertTriangle} index={6} gradient="amber" />
        )}
      </div>

      {/* Department Tickets Summary + Content Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Tickets */}
        <Card className="overflow-hidden border-border/60 animate-fade-in" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Tickets by Department</CardTitle>
                  <p className="text-xs text-muted-foreground">Active support tickets</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ticketSummary.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Ticket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tickets yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {ticketSummary.map((dept, i) => {
                  const cfg = deptConfig[dept.department] || { icon: Ticket, label: dept.department, path: "/", color: "text-muted-foreground" };
                  const DeptIcon = cfg.icon;
                  return (
                    <li key={dept.department} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-muted/30 transition-colors animate-fade-in" style={{ animationDelay: `${220 + i * 40}ms`, animationFillMode: "both" }}>
                      <div className="flex items-center gap-3">
                        <DeptIcon className={cn("h-4 w-4", cfg.color)} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                          <p className="text-xs text-muted-foreground">{dept.open} open · {dept.in_progress} in progress</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full text-[11px]">{dept.total} total</Badge>
                        <Link to={cfg.path}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Content Trend Chart */}
        <Card className="overflow-hidden border-border/60 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Content Trend</CardTitle>
                <p className="text-xs text-muted-foreground">Posts by month — last 6 months</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-4">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                      boxShadow: "0 8px 24px -4px hsl(var(--foreground) / 0.1)",
                      fontSize: "13px",
                    }}
                  />
                  <Area type="monotone" dataKey="posts" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorPosts)" dot={{ r: 4, fill: "hsl(var(--card))", stroke: "hsl(var(--primary))", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm">No post data yet</div>
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
      <Card className="overflow-hidden border-border/60 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
        <div className="px-4 sm:px-6 py-4 border-b border-border/40 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">All Clinics</h2>
              <p className="text-xs text-muted-foreground">{clinics.length} clinics registered</p>
            </div>
          </div>
          <Link to="/clinics">
            <Button variant="outline" size="sm" className="rounded-lg w-full sm:w-auto">View All</Button>
          </Link>
        </div>
        {clinics.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-3">No clinics yet. Add your first clinic to get started.</p>
            <Link to="/clinics"><Button size="sm" className="rounded-lg">Add Clinic</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="data-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Clinic Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Assigned Concierge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.slice(0, 10).map((clinic) => (
                  <TableRow key={clinic.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      {clinic.clinic_name}
                      <span className="sm:hidden block text-xs text-muted-foreground mt-0.5">
                        {getConciergeName(clinic.assigned_concierge_id)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={clinic.assigned_concierge_id ? "text-foreground" : "text-muted-foreground italic"}>
                        {getConciergeName(clinic.assigned_concierge_id)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={clinic.status === "active" ? "default" : "secondary"}
                        className="rounded-full px-2.5 text-[11px] font-semibold"
                      >
                        {clinic.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/clinics/${clinic.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-primary"><Eye className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">View</span></Button>
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
