import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SeoKeyword {
  keyword: string;
  position: number;
  change: string;
}

export interface SeoAnalyticsRow {
  id: string;
  clinic_id: string;
  month: string;
  domain_authority: number;
  backlinks: number;
  keywords_top_10: number;
  organic_traffic: number;
  top_keywords: SeoKeyword[];
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertSeoPayload {
  clinic_id: string;
  month: string;
  domain_authority: number;
  backlinks: number;
  keywords_top_10: number;
  organic_traffic: number;
  top_keywords: SeoKeyword[];
}

export function useSeoAnalytics(clinicId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["seo-analytics", clinicId];

  const { data: rows, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from("seo_analytics" as any)
        .select("*")
        .eq("clinic_id", clinicId)
        .order("month", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as SeoAnalyticsRow[];
    },
    enabled: !!clinicId,
  });

  const latest = rows && rows.length > 0 ? rows[rows.length - 1] : null;

  const trafficData = (rows || []).map((r) => ({
    label: r.month,
    value: r.organic_traffic,
  }));

  const topKeywords: SeoKeyword[] = latest?.top_keywords || [];

  const upsertMutation = useMutation({
    mutationFn: async (payload: UpsertSeoPayload) => {
      // Check if record exists
      const { data: existing } = await (supabase
        .from("seo_analytics" as any)
        .select("id")
        .eq("clinic_id", payload.clinic_id)
        .eq("month", payload.month)
        .maybeSingle() as any);

      if (existing?.id) {
        const { error } = await (supabase
          .from("seo_analytics" as any)
          .update({
            domain_authority: payload.domain_authority,
            backlinks: payload.backlinks,
            keywords_top_10: payload.keywords_top_10,
            organic_traffic: payload.organic_traffic,
            top_keywords: payload.top_keywords,
            updated_by: user?.id,
          })
          .eq("id", existing.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from("seo_analytics" as any)
          .insert({
            clinic_id: payload.clinic_id,
            month: payload.month,
            domain_authority: payload.domain_authority,
            backlinks: payload.backlinks,
            keywords_top_10: payload.keywords_top_10,
            organic_traffic: payload.organic_traffic,
            top_keywords: payload.top_keywords,
            updated_by: user?.id,
          }) as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    rows: rows || [],
    latest,
    trafficData,
    topKeywords,
    isLoading,
    upsertSeoAnalytics: upsertMutation.mutateAsync,
    isUpserting: upsertMutation.isPending,
  };
}
