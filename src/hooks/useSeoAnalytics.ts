import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SeoKeyword {
  keyword: string;
  position: number;
  change: string;
}

export interface SeoExtendedData {
  total_keywords_tracked?: number;
  keywords_top_3?: number;
  keywords_top_20?: number;
  keywords_top_50?: number;
  keywords_not_ranking?: number;
  new_keywords_gained?: number;
  keywords_improved?: number;
  keywords_declined?: number;
  avg_position?: number;
  bounce_rate?: number;
  avg_session_duration?: string;
  pages_per_session?: number;
  new_vs_returning?: { new: number; returning: number };
  top_landing_pages?: { page: string; sessions: number; bounce_rate: number }[];
  top_traffic_sources?: { source: string; sessions: number; percentage: number }[];
  referring_domains?: number;
  referring_domains_list?: { domain: string; da: number; type: string }[];
  new_backlinks_gained?: number;
  lost_backlinks?: number;
  dofollow_backlinks?: number;
  nofollow_backlinks?: number;
  backlink_types?: { guest_post: number; directory: number; citation: number; editorial: number; other: number };
  page_speed_mobile?: number;
  page_speed_desktop?: number;
  core_web_vitals?: { lcp: string; fid: string; cls: string; status: string };
  crawl_errors?: number;
  indexed_pages?: number;
  sitemap_pages?: number;
  technical_issues?: { issue: string; count: number; severity: string }[];
  top_pages_by_traffic?: { page: string; traffic: number; change: string }[];
  content_recommendations?: string[];
  local_seo?: { google_business_profile: string; reviews_count: number; avg_rating: number; local_pack_keywords: number };
  competitor_comparison?: { competitor: string; da: number; traffic: number; keywords: number }[];
  monthly_traffic_breakdown?: { organic: number; direct: number; referral: number; social: number; paid: number };
  device_breakdown?: { desktop: number; mobile: number; tablet: number };
  geo_breakdown?: { country: string; sessions: number; percentage: number }[];
  conversion_data?: { goals_completed: number; conversion_rate: number };
  report_period?: string;
  report_title?: string;
  client_name?: string;
  website_url?: string;
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
  extended_data: SeoExtendedData;
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
  extended_data?: SeoExtendedData;
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
      return (data || []).map((r: any) => ({
        ...r,
        extended_data: r.extended_data || {},
      })) as unknown as SeoAnalyticsRow[];
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
      const { data: existing } = await (supabase
        .from("seo_analytics" as any)
        .select("id")
        .eq("clinic_id", payload.clinic_id)
        .eq("month", payload.month)
        .maybeSingle() as any);

      const record = {
        domain_authority: payload.domain_authority,
        backlinks: payload.backlinks,
        keywords_top_10: payload.keywords_top_10,
        organic_traffic: payload.organic_traffic,
        top_keywords: payload.top_keywords,
        extended_data: payload.extended_data || {},
        updated_by: user?.id,
      };

      if (existing?.id) {
        const { error } = await (supabase
          .from("seo_analytics" as any)
          .update(record)
          .eq("id", existing.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from("seo_analytics" as any)
          .insert({
            clinic_id: payload.clinic_id,
            month: payload.month,
            ...record,
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
