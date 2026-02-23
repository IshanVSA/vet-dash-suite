import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_APP_ID = Deno.env.get("META_APP_ID")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET")!;

// The redirect URI must match what's configured in Meta App settings
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/meta-oauth?action=callback`;

// Frontend URL for redirecting after OAuth
const FRONTEND_URL = Deno.env.get("SITE_URL") || "https://vet-dash-suite.lovable.app";

const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
  "read_insights",
  "pages_read_user_content",
].join(",");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "authorize") {
      const clinicId = url.searchParams.get("clinic_id");
      const originUrl = url.searchParams.get("origin") || FRONTEND_URL;
      if (!clinicId) {
        return new Response(JSON.stringify({ error: "clinic_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const state = btoa(JSON.stringify({ clinic_id: clinicId, origin: originUrl }));
      const authUrl =
        `https://www.facebook.com/v21.0/dialog/oauth?` +
        `client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&state=${encodeURIComponent(state)}` +
        `&response_type=code`;

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: authUrl },
      });
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const errorParam = url.searchParams.get("error");

      if (errorParam) {
        console.error("Meta OAuth error:", errorParam, url.searchParams.get("error_description"));
        // Can't use redirectBase here since state may not be parseable on error
        const fallbackUrl = stateParam ? (JSON.parse(atob(stateParam)).origin || FRONTEND_URL) : FRONTEND_URL;
        return new Response(null, {
          status: 302,
          headers: { Location: `${fallbackUrl}/clinics?error=oauth_denied` },
        });
      }

      if (!code || !stateParam) {
        return new Response(JSON.stringify({ error: "Missing code or state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { clinic_id, origin } = JSON.parse(atob(stateParam));
      const redirectBase = origin || FRONTEND_URL;

      // Step 1: Exchange code for short-lived user access token
      const tokenRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
          `client_id=${META_APP_ID}` +
          `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
          `&client_secret=${META_APP_SECRET}` +
          `&code=${code}`
      );
      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        console.error("Token exchange error:", tokenData.error);
        return new Response(null, {
          status: 302,
          headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=token_exchange` },
        });
      }

      // Step 2: Exchange for long-lived user token
      const longTokenRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
          `grant_type=fb_exchange_token` +
          `&client_id=${META_APP_ID}` +
          `&client_secret=${META_APP_SECRET}` +
          `&fb_exchange_token=${tokenData.access_token}`
      );
      const longTokenData = await longTokenRes.json();
      if (longTokenData.error) {
        console.error("Long-lived token error:", longTokenData.error);
        return new Response(null, {
          status: 302,
          headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=long_token` },
        });
      }

      // Step 3: Get ALL pages (follow pagination from me/accounts + Business Manager)
      console.log("Fetching pages with long-lived token...");
      const pageMap = new Map<string, any>();

      // 3a: Fetch from me/accounts
      let nextUrl: string | null = `https://graph.facebook.com/v21.0/me/accounts?limit=100&access_token=${longTokenData.access_token}`;
      while (nextUrl) {
        const pagesRes = await fetch(nextUrl);
        const pagesData = await pagesRes.json();
        if (pagesData.data) {
          for (const p of pagesData.data) pageMap.set(p.id, p);
        }
        nextUrl = pagesData.paging?.next || null;
      }
      console.log(`me/accounts returned ${pageMap.size} pages`);

      // 3b: Fetch from Business Manager owned_pages
      try {
        let bizUrl: string | null = `https://graph.facebook.com/v21.0/me/businesses?limit=100&access_token=${longTokenData.access_token}`;
        while (bizUrl) {
          const bizRes = await fetch(bizUrl);
          const bizData = await bizRes.json();
          if (bizData.data) {
            for (const biz of bizData.data) {
              let pagesUrl: string | null = `https://graph.facebook.com/v21.0/${biz.id}/owned_pages?limit=100&fields=id,name,access_token,category&access_token=${longTokenData.access_token}`;
              while (pagesUrl) {
                const pRes = await fetch(pagesUrl);
                const pData = await pRes.json();
                if (pData.data) {
                  for (const p of pData.data) {
                    if (!pageMap.has(p.id)) pageMap.set(p.id, p);
                  }
                }
                pagesUrl = pData.paging?.next || null;
              }
            }
          }
          bizUrl = bizData.paging?.next || null;
        }
      } catch (bizErr) {
        console.error("Business Manager fetch error (non-fatal):", bizErr);
      }

      const allPages = Array.from(pageMap.values());
      console.log(`Fetched ${allPages.length} total unique pages`);

      if (allPages.length === 0) {
        console.error("No pages found for user.");
        return new Response(null, {
          status: 302,
          headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=no_pages` },
        });
      }

      // If only one page, auto-select it (original behavior)
      if (allPages.length === 1) {
        const page = allPages[0];
        const pageAccessToken = page.access_token;
        const pageId = page.id;
        const pageName = page.name;

        // Get Instagram Business Account ID
        const igRes = await fetch(
          `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
        );
        const igData = await igRes.json();
        const igBusinessId = igData.instagram_business_account?.id || null;

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: existing } = await supabase
          .from("clinic_api_credentials")
          .select("id")
          .eq("clinic_id", clinic_id)
          .maybeSingle();

        let upsertError;
        if (existing) {
          const { error } = await supabase
            .from("clinic_api_credentials")
            .update({
              meta_page_access_token: pageAccessToken,
              meta_page_id: pageId,
              meta_instagram_business_id: igBusinessId,
              meta_page_name: pageName,
            })
            .eq("clinic_id", clinic_id);
          upsertError = error;
        } else {
          const { error } = await supabase
            .from("clinic_api_credentials")
            .insert({
              clinic_id,
              meta_page_access_token: pageAccessToken,
              meta_page_id: pageId,
              meta_instagram_business_id: igBusinessId,
              meta_page_name: pageName,
            });
          upsertError = error;
        }

        if (upsertError) {
          console.error("Failed to save credentials:", upsertError);
          return new Response(null, {
            status: 302,
            headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=save_failed` },
          });
        }

        console.log(`Meta OAuth complete for clinic ${clinic_id}, page: ${pageName}`);
        return new Response(null, {
          status: 302,
          headers: { Location: `${redirectBase}/clinics/${clinic_id}?meta=connected` },
        });
      }

      // Multiple pages: encode pages data and redirect to frontend for selection
      const pagesForSelection = allPages.map((p: any) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
        category: p.category || "",
      }));
      const encodedPages = btoa(JSON.stringify(pagesForSelection));
      console.log(`Multiple pages found (${allPages.length}), redirecting for selection`);
      return new Response(null, {
        status: 302,
        headers: { Location: `${redirectBase}/clinics/${clinic_id}?meta_pages=${encodeURIComponent(encodedPages)}` },
      });
    }

    // Disconnect action
    if (action === "disconnect") {
      const body = await req.json();
      const { clinic_id } = body;
      if (!clinic_id) {
        return new Response(JSON.stringify({ error: "clinic_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error } = await supabase
        .from("clinic_api_credentials")
        .update({
          meta_page_access_token: null,
          meta_page_id: null,
          meta_instagram_business_id: null,
          meta_page_name: null,
          last_meta_sync_at: null,
        })
        .eq("clinic_id", clinic_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("meta-oauth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
