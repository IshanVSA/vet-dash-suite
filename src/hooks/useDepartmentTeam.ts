import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  name: string;
  role: string;
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
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map(p => [p.id, p.full_name || p.email || "Unknown"])
      );

      setTeam(
        (data as any[]).map((d: any) => ({
          name: profileMap[d.user_id] || "Unknown",
          role: d.department_role,
        }))
      );
      setLoading(false);
    };

    fetch();
  }, [department]);

  return { team, loading };
}
