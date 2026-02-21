import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import KPICard from "./KPICard";
import { Building2, FileText, BarChart3, UserCheck, UserCircle, Eye, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { motion } from "framer-motion";

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setUserName(data.full_name); });
  }, [user]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const [roleCounts, setRoleCounts] = useState({ concierges: 0, clients: 0 });
  const [totalPosts, setTotalPosts] = useState(0);
  const [pendingPosts, setPendingPosts] = useState(0);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [clinicsRes, profilesRes, rolesRes, postsRes, pendingRes] = await Promise.all([
        supabase.from("clinics").select("*"),
        supabase.from("profiles").select("id, full_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("content_posts").select("id, scheduled_date"),
        supabase.from("content_posts").select("id").eq("status", "pending"),
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

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Clinics" value={clinics.filter(c => c.status === "active").length} change={`${clinics.length} total`} changeType="neutral" icon={Building2} index={0} gradient="blue" />
        <KPICard label="Total Posts" value={totalPosts} icon={FileText} index={1} gradient="purple" />
        <KPICard label="Total Concierges" value={roleCounts.concierges} icon={UserCheck} index={2} gradient="green" />
        <KPICard label="Total Clients" value={roleCounts.clients} icon={UserCircle} index={3} gradient="amber" />
      </div>

      {/* Secondary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Pending Review" value={pendingPosts} icon={Clock} index={4} gradient="amber" />
      </div>

      {/* Chart */}
      {trendData.length > 0 && (
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
            <ResponsiveContainer width="100%" height={260}>
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
          </CardContent>
        </Card>
      )}

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
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading clinics...
            </div>
          </div>
        ) : clinics.length === 0 ? (
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
