import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import KPICard from "./KPICard";
import { Building2, FileText, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import UpcomingPosts from "./UpcomingPosts";

interface Clinic {
  id: string;
  clinic_name: string;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [analyticsCount, setAnalyticsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: clinicData } = await supabase
        .from("clinics").select("id, clinic_name")
        .eq("owner_user_id", user.id);
      const owned = clinicData || [];
      setClinics(owned);
      if (owned.length > 0) {
        const clinicIds = owned.map(c => c.id);
        const [postsRes, analyticsRes] = await Promise.all([
          supabase.from("content_posts").select("id").in("clinic_id", clinicIds),
          supabase.from("analytics").select("id").in("clinic_id", clinicIds),
        ]);
        setPostCount((postsRes.data || []).length);
        setAnalyticsCount((analyticsRes.data || []).length);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero */}
      <div className="hero-section">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Welcome back{user?.user_metadata?.full_name ? `, ${(user.user_metadata.full_name as string).split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} — Your clinic overview
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Your Clinics" value={clinics.length} icon={Building2} index={0} gradient="blue" />
        <KPICard label="Content Posts" value={postCount} icon={FileText} index={1} gradient="purple" />
        <KPICard label="Analytics Records" value={analyticsCount} icon={BarChart3} index={2} gradient="green" />
      </div>

      <UpcomingPosts />

      {loading ? (
        <DashboardSkeleton />
      ) : clinics.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No clinics linked to your account yet. Contact your account manager.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clinics.map((clinic, i) => (
            <Card key={clinic.id} className="group border-border/60 hover-lift animate-fade-in overflow-hidden" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
              <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{clinic.clinic_name}</span>
                </div>
                <Link to={`/clinics/${clinic.id}`} className="w-full sm:w-auto">
                  <Button size="sm" className="rounded-lg group-hover:shadow-md transition-shadow w-full sm:w-auto">
                    View Clinic <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
