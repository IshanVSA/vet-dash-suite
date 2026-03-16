import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";

export function useAiSeoAccess(clinicId?: string) {
  const { user } = useAuth();
  const { role } = useUserRole();

  const { data: enabled, isLoading } = useQuery({
    queryKey: ["ai-seo-access", clinicId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Admins & concierges always have access
      if (role === "admin" || role === "concierge") return true;

      // For clients, check their clinic's ai_seo_enabled flag
      let targetClinicId = clinicId;
      if (!targetClinicId) {
        const { data: clinic } = await supabase
          .from("clinics")
          .select("id, ai_seo_enabled")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        return clinic?.ai_seo_enabled ?? false;
      }

      const { data } = await supabase
        .from("clinics")
        .select("ai_seo_enabled")
        .eq("id", targetClinicId)
        .maybeSingle();
      return (data as any)?.ai_seo_enabled ?? false;
    },
    enabled: !!user && !!role,
  });

  return { hasAccess: enabled ?? false, isLoading };
}
