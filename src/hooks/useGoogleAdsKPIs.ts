import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleAdsKPIs {
  loading: boolean;
  hasData: boolean;
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
  ctr: number;
  dailyTrend: { label: string; value: number }[];
  campaigns: { name: string; spend: string; clicks: string; conversions: number; ctr: string }[];
}

export function useGoogleAdsKPIs(clinicId: string): GoogleAdsKPIs {
  const [state, setState] = useState<GoogleAdsKPIs>({
    loading: true, hasData: false,
    clicks: 0, impressions: 0, cost: 0, conversions: 0, ctr: 0,
    dailyTrend: [], campaigns: [],
  });

  useEffect(() => {
    if (!clinicId) {
      setState(prev => ({ ...prev, loading: false, hasData: false }));
      return;
    }

    const fetch = async () => {
      setState({ loading: true, hasData: false, clicks: 0, impressions: 0, cost: 0, conversions: 0, ctr: 0, dailyTrend: [], campaigns: [] });

      const { data } = await supabase
        .from("analytics")
        .select("metrics_json")
        .eq("clinic_id", clinicId)
        .eq("platform", "google_ads")
        .eq("metric_type", "monthly_summary")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data?.metrics_json) {
      setState({ loading: false, hasData: false, clicks: 0, impressions: 0, cost: 0, conversions: 0, ctr: 0, dailyTrend: [], campaigns: [] });
        return;
      }

      const m = data.metrics_json as any;
      const clicks = m.clicks || 0;
      const impressions = m.impressions || 0;
      const cost = m.cost || 0;
      const conversions = m.conversions || 0;
      const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;

      // Last 7 days of daily trends for the overview chart
      const trends = (m.daily_trends || []) as { date: string; clicks: number }[];
      const last7 = trends.slice(-7).map(d => ({
        label: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
        value: d.clicks,
      }));

      const campaigns = ((m.campaigns || []) as any[])
        .sort((a: any, b: any) => (b.cost || 0) - (a.cost || 0))
        .slice(0, 5)
        .map((c: any) => ({
          name: c.name,
          spend: `$${(c.cost || 0).toFixed(0)}`,
          clicks: (c.clicks || 0).toLocaleString(),
          conversions: Math.round(c.conversions || 0),
          ctr: impressions > 0 ? `${(((c.clicks || 0) / (c.impressions || 1)) * 100).toFixed(1)}%` : "0%",
        }));

      setState({
        loading: false, hasData: true,
        clicks, impressions, cost, conversions, ctr,
        dailyTrend: last7.length > 0 ? last7 : [{ label: "—", value: 0 }],
        campaigns,
      });
    };

    fetch();
  }, [clinicId]);

  return state;
}
