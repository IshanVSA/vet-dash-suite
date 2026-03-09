import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  name: string;
  role: string;
  teamRole: string | null;
}

const departmentRoleMap: Record<string, string[]> = {
  website: ["Developer", "Maintenance"],
  seo: ["SEO Lead"],
  google_ads: ["Ads Strategist", "Ads Analyst"],
  social_media: ["Social & Concierge"],
};

export function useDepartmentTeam(department: string): { team: TeamMember[]; loading: boolean } {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      const allowedRoles = departmentRoleMap[department] || [];
      if (allowedRoles.length === 0) {
        setTeam([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, team_role")
        .in("team_role", allowedRoles);

      if (!profiles || profiles.length === 0) {
        setTeam([]);
        setLoading(false);
        return;
      }

      // Exclude client-role users
      const userIds = profiles.map((p) => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const clientIds = new Set(
        (roles || []).filter((r) => r.role === "client").map((r) => r.user_id)
      );

      setTeam(
        profiles
          .filter((p) => !clientIds.has(p.id))
          .map((p) => ({
            name: p.full_name || p.email || "Unknown",
            role: p.team_role || "Member",
            teamRole: p.team_role,
          }))
      );
      setLoading(false);
    };

    fetchTeam();
  }, [department]);

  return { team, loading };
}
