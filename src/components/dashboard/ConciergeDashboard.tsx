import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import KPICard from "./KPICard";
import { Building2, FileText, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your assigned clinics and performance</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Assigned Clinics" value={clinics.length} icon={Building2} />
        <KPICard label="Total Posts" value={postCount} icon={FileText} />
        <KPICard label="Pending Review" value={pendingCount} icon={Megaphone} />
      </div>
      <div>
        <h2 className="font-semibold text-foreground mb-4">Your Clinics</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : clinics.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No clinics assigned to you yet. Contact your admin.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinics.map((clinic) => (
              <Card key={clinic.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3"><CardTitle className="text-lg">{clinic.clinic_name}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Link to={`/intake-forms`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full"><FileText className="h-4 w-4 mr-1" /> Intake Form</Button>
                    </Link>
                    <Link to={`/clinics/${clinic.id}`} className="flex-1">
                      <Button size="sm" className="w-full">View Details</Button>
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
