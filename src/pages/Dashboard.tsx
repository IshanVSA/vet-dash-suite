import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { StatsCard } from "@/components/StatsCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Building2, FileText, BarChart3, ClipboardList } from "lucide-react";

export default function Dashboard() {
  const { role } = useUserRole();

  const { data: clinicCount } = useQuery({
    queryKey: ["clinic-count"],
    queryFn: async () => {
      const { count } = await supabase.from("clinics").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: postCount } = useQuery({
    queryKey: ["post-count"],
    queryFn: async () => {
      const { count } = await supabase.from("content_posts").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: submissionCount } = useQuery({
    queryKey: ["submission-count"],
    queryFn: async () => {
      const { count } = await supabase.from("calendar_submissions").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back{role ? ` (${role})` : ""}!</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Clinics" value={clinicCount ?? 0} icon={Building2} description="Total registered clinics" />
          <StatsCard title="Content Posts" value={postCount ?? 0} icon={FileText} description="Total posts created" />
          <StatsCard title="Submissions" value={submissionCount ?? 0} icon={ClipboardList} description="Intake form submissions" />
          <StatsCard title="Analytics" value="—" icon={BarChart3} description="Engagement metrics" />
        </div>
      </div>
    </DashboardLayout>
  );
}
