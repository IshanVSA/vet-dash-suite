import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Check role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || !["admin", "concierge"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clinic_id } = await req.json();
    if (!clinic_id) {
      return new Response(JSON.stringify({ error: "clinic_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get credentials
    const { data: creds } = await supabase
      .from("clinic_api_credentials")
      .select("meta_page_access_token, meta_page_id, meta_instagram_business_id")
      .eq("clinic_id", clinic_id)
      .maybeSingle();

    if (!creds?.meta_page_access_token || !creds?.meta_page_id) {
      return new Response(JSON.stringify({ error: "Meta credentials not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token_str = creds.meta_page_access_token;
    const pageId = creds.meta_page_id;
    const igId = creds.meta_instagram_business_id;
    const today = new Date().toISOString().slice(0, 10);
    const analyticsRows: any[] = [];

    // ---- Facebook Page Insights ----
    try {
      const fbRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=fan_count,name&access_token=${token_str}`
      );
      const fbPage = await fbRes.json();

      // Get page impressions (last 28 days)
      const insightsRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/insights?metric=page_impressions,page_engaged_users&period=days_28&access_token=${token_str}`
      );
      const insightsData = await insightsRes.json();

      const metricsMap: Record<string, number> = {};
      if (insightsData.data) {
        for (const metric of insightsData.data) {
          const latest = metric.values?.[metric.values.length - 1];
          if (latest) metricsMap[metric.name] = latest.value;
        }
      }

      analyticsRows.push({
        clinic_id,
        platform: "facebook",
        metric_type: "monthly_summary",
        date: today,
        value: fbPage.fan_count || 0,
        metrics_json: {
          likes: fbPage.fan_count || 0,
          reach: metricsMap.page_impressions || 0,
          engagement: metricsMap.page_engaged_users || 0,
        },
      });
    } catch (e) {
      console.error("Facebook fetch error:", e);
    }

    // ---- Instagram Insights ----
    if (igId) {
      try {
        // Get follower count
        const igProfileRes = await fetch(
          `https://graph.facebook.com/v21.0/${igId}?fields=followers_count,media_count&access_token=${token_str}`
        );
        const igProfile = await igProfileRes.json();

        // Get insights (reach, impressions)
        const igInsightsRes = await fetch(
          `https://graph.facebook.com/v21.0/${igId}/insights?metric=reach,impressions&period=days_28&access_token=${token_str}`
        );
        const igInsights = await igInsightsRes.json();

        const igMetrics: Record<string, number> = {};
        if (igInsights.data) {
          for (const metric of igInsights.data) {
            const latest = metric.values?.[metric.values.length - 1];
            if (latest) igMetrics[metric.name] = latest.value;
          }
        }

        // Calculate engagement from recent media
        let engagementRate = 0;
        const followers = igProfile.followers_count || 0;
        if (followers > 0) {
          const mediaRes = await fetch(
            `https://graph.facebook.com/v21.0/${igId}/media?fields=like_count,comments_count&limit=25&access_token=${token_str}`
          );
          const mediaData = await mediaRes.json();
          if (mediaData.data && mediaData.data.length > 0) {
            const totalEngagement = mediaData.data.reduce(
              (sum: number, m: any) => sum + (m.like_count || 0) + (m.comments_count || 0),
              0
            );
            engagementRate = Math.round((totalEngagement / mediaData.data.length / followers) * 10000) / 100;
          }
        }

        analyticsRows.push({
          clinic_id,
          platform: "instagram",
          metric_type: "monthly_summary",
          date: today,
          value: followers,
          metrics_json: {
            followers,
            reach: igMetrics.reach || 0,
            impressions: igMetrics.impressions || 0,
            engagement: engagementRate,
          },
        });
      } catch (e) {
        console.error("Instagram fetch error:", e);
      }
    }

    // Insert analytics rows
    if (analyticsRows.length > 0) {
      const { error: insertError } = await supabase.from("analytics").insert(analyticsRows);
      if (insertError) console.error("Analytics insert error:", insertError);
    }

    // Update last sync timestamp
    await supabase
      .from("clinic_api_credentials")
      .update({ last_meta_sync_at: new Date().toISOString() })
      .eq("clinic_id", clinic_id);

    return new Response(
      JSON.stringify({
        success: true,
        synced: analyticsRows.map((r) => r.platform),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-meta-analytics error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
