import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  name: string;
  role: string;
  teamRole: string | null;
}

export function useDepartmentTeam(department: string): { team: TeamMember[]; loading: boolean } {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("department_members" as any)
        .select("user_id, department_role")
        .eq("department", department as any);

      if (error || !data || data.length === 0) {
        setTeam([]);
        setLoading(false);
        return;
      }

      const userIds = (data as any[]).map((d: any) => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, team_role")
        .in("id", userIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p: any) => [p.id, { name: p.full_name || p.email || "Unknown", teamRole: p.team_role || null }])
      );

      setTeam(
        (data as any[]).map((d: any) => ({
          name: profileMap[d.user_id]?.name || "Unknown",
          role: d.department_role,
          teamRole: profileMap[d.user_id]?.teamRole || null,
        }))
      );
      setLoading(false);
    };

    fetch();
  }, [department]);

  return { team, loading };
}
