import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import KPICard from "./KPICard";
import { Building2, FileText, BarChart3, UserCheck, UserCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
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

  return (
    <div className="space-y-8">
      <div className="bg-gradient-hero rounded-xl p-6 -m-2">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of all clinic operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Clinics" value={clinics.filter(c => c.status === "active").length} change={`${clinics.length} total`} changeType="neutral" icon={Building2} index={0} />
        <KPICard label="Total Posts" value={totalPosts} icon={FileText} index={1} />
        <KPICard label="Total Concierges" value={roleCounts.concierges} icon={UserCheck} index={2} />
        <KPICard label="Total Clients" value={roleCounts.clients} icon={UserCircle} index={3} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Pending Review" value={pendingPosts} icon={BarChart3} index={4} />
      </div>

      {trendData.length > 0 && (
        <Card className="hover-lift animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <CardHeader className="bg-gradient-hero rounded-t-lg">
            <CardTitle className="text-base">Content Posts by Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="posts" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="bg-card rounded-xl border border-border animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">All Clinics</h2>
          <Link to="/clinics">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : clinics.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No clinics yet. Add your first clinic to get started.</p>
            <Link to="/clinics"><Button className="mt-4" size="sm">Add Clinic</Button></Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinic Name</TableHead>
                <TableHead>Assigned Concierge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics.slice(0, 10).map((clinic) => (
                <TableRow key={clinic.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{clinic.clinic_name}</TableCell>
                  <TableCell>
                    <span className={clinic.assigned_concierge_id ? "text-foreground" : "text-muted-foreground italic"}>
                      {getConciergeName(clinic.assigned_concierge_id)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={clinic.status === "active" ? "default" : "secondary"}>
                      {clinic.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/clinics/${clinic.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-1" /> View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
