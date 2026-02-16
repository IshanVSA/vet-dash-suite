import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import KPICard from "./KPICard";
import { Building2, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your clinic</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Your Clinics" value={clinics.length} icon={Building2} />
        <KPICard label="Content Posts" value={postCount} icon={FileText} />
        <KPICard label="Analytics Records" value={analyticsCount} icon={BarChart3} />
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : clinics.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No clinics linked to your account yet. Contact your account manager.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {clinics.map((clinic) => (
            <Card key={clinic.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 flex items-center justify-between">
                <span className="font-medium text-foreground">{clinic.clinic_name}</span>
                <Link to={`/clinics/${clinic.id}`}>
                  <Button size="sm">View Clinic</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
