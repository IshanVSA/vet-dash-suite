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
  "instagram_basic",
  "instagram_manage_insights",
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
      if (!clinicId) {
        return new Response(JSON.stringify({ error: "clinic_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const state = btoa(JSON.stringify({ clinic_id: clinicId }));
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
        return new Response(null, {
          status: 302,
          headers: { Location: `${FRONTEND_URL}/clinics?error=oauth_denied` },
        });
      }

      if (!code || !stateParam) {
        return new Response(JSON.stringify({ error: "Missing code or state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { clinic_id } = JSON.parse(atob(stateParam));

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
          headers: { Location: `${FRONTEND_URL}/clinics/${clinic_id}?error=token_exchange` },
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
          headers: { Location: `${FRONTEND_URL}/clinics/${clinic_id}?error=long_token` },
        });
      }

      // Step 3: Get pages (page tokens are permanent for long-lived user tokens)
      const pagesRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${longTokenData.access_token}`
      );
      const pagesData = await pagesRes.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        console.error("No pages found for user");
        return new Response(null, {
          status: 302,
          headers: { Location: `${FRONTEND_URL}/clinics/${clinic_id}?error=no_pages` },
        });
      }

      // Use the first page
      const page = pagesData.data[0];
      const pageAccessToken = page.access_token;
      const pageId = page.id;
      const pageName = page.name;

      // Step 4: Get Instagram Business Account ID
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );
      const igData = await igRes.json();
      const igBusinessId = igData.instagram_business_account?.id || null;

      // Step 5: Save credentials
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error: upsertError } = await supabase
        .from("clinic_api_credentials")
        .upsert(
          {
            clinic_id,
            meta_page_access_token: pageAccessToken,
            meta_page_id: pageId,
            meta_instagram_business_id: igBusinessId,
            meta_page_name: pageName,
          },
          { onConflict: "clinic_id" }
        );

      if (upsertError) {
        console.error("Failed to save credentials:", upsertError);
        return new Response(null, {
          status: 302,
          headers: { Location: `${FRONTEND_URL}/clinics/${clinic_id}?error=save_failed` },
        });
      }

      console.log(`Meta OAuth complete for clinic ${clinic_id}, page: ${pageName}`);
      return new Response(null, {
        status: 302,
        headers: { Location: `${FRONTEND_URL}/clinics/${clinic_id}?meta=connected` },
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
