import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import KPICard from "./KPICard";
import { Building2, FileText, Megaphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Clinic {
  id: string;
  clinic_name: string;
  status: string;
}

export default function ConciergeDashboard() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: clinicData } = await supabase
        .from("clinics").select("id, clinic_name, status")
        .eq("assigned_concierge_id", user.id);
      const assignedClinics = clinicData || [];
      setClinics(assignedClinics);
      if (assignedClinics.length > 0) {
        const clinicIds = assignedClinics.map(c => c.id);
        const [totalRes, pendingRes] = await Promise.all([
          supabase.from("content_posts").select("id").in("clinic_id", clinicIds),
          supabase.from("content_posts").select("id").in("clinic_id", clinicIds).eq("status", "pending"),
        ]);
        setPostCount((totalRes.data || []).length);
        setPendingCount((pendingRes.data || []).length);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="hero-section">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Concierge View</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Welcome back{user?.user_metadata?.full_name ? `, ${(user.user_metadata.full_name as string).split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} — Your assigned clinics and performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Assigned Clinics" value={clinics.length} icon={Building2} index={0} gradient="blue" />
        <KPICard label="Total Posts" value={postCount} icon={FileText} index={1} gradient="purple" />
        <KPICard label="Pending Review" value={pendingCount} icon={Megaphone} index={2} gradient="amber" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-header">Your Clinics</h2>
          <Badge variant="secondary" className="rounded-full">{clinics.length} assigned</Badge>
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          </div>
        ) : clinics.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No clinics assigned to you yet. Contact your admin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinics.map((clinic, i) => (
              <Card key={clinic.id} className="group border-border/60 hover-lift animate-fade-in overflow-hidden" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{clinic.clinic_name}</CardTitle>
                    <Badge variant={clinic.status === "active" ? "default" : "secondary"} className="rounded-full text-[11px]">{clinic.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Link to="/intake-forms" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full rounded-lg"><FileText className="h-4 w-4 mr-1" /> Intake</Button>
                    </Link>
                    <Link to={`/clinics/${clinic.id}`} className="flex-1">
                      <Button size="sm" className="w-full rounded-lg group-hover:shadow-md transition-shadow">
                        Details <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
