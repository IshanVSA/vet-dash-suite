import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const GOOGLE_ADS_DEVELOPER_TOKEN = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN")!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-oauth?action=callback`;
const FRONTEND_URL = Deno.env.get("SITE_URL") || "https://vet-dash-suite.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── AUTHORIZE ──
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
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent("https://www.googleapis.com/auth/adwords")}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${encodeURIComponent(state)}`;

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: authUrl },
      });
    }

    // ── CALLBACK ──
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const errorParam = url.searchParams.get("error");

      if (errorParam) {
        console.error("Google OAuth error:", errorParam);
        const fallbackUrl = stateParam
          ? JSON.parse(atob(stateParam)).origin || FRONTEND_URL
          : FRONTEND_URL;
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

      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        console.error("Token exchange error:", tokenData.error);
        return new Response(null, {
          status: 302,
          headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=token_exchange` },
        });
      }

      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;

      if (!refreshToken) {
        console.error("No refresh token received");
        return new Response(null, {
          status: 302,
          headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=no_refresh_token` },
        });
      }

      // List accessible customer accounts
      const customersRes = await fetch(
        "https://googleads.googleapis.com/v18/customers:listAccessibleCustomers",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "developer-token": GOOGLE_ADS_DEVELOPER_TOKEN,
          },
        }
      );
      const customersData = await customersRes.json();
      if (customersData.error) {
        console.error("List customers error:", JSON.stringify(customersData.error));
        return new Response(null, {
          status: 302,
          headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=list_customers` },
        });
      }

      const resourceNames: string[] = customersData.resourceNames || [];
      if (resourceNames.length === 0) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=no_accounts` },
        });
      }

      // Fetch descriptive name for each account
      const accounts: { customer_id: string; name: string; login_customer_id: string }[] = [];
      for (const rn of resourceNames) {
        const custId = rn.replace("customers/", "");
        try {
          const detailRes = await fetch(
            `https://googleads.googleapis.com/v18/customers/${custId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": GOOGLE_ADS_DEVELOPER_TOKEN,
                "login-customer-id": custId,
              },
            }
          );
          const detail = await detailRes.json();
          accounts.push({
            customer_id: custId,
            name: detail.descriptiveName || custId,
            login_customer_id: custId,
          });
        } catch (e) {
          console.warn(`Failed to fetch details for ${custId}:`, e);
          accounts.push({ customer_id: custId, name: custId, login_customer_id: custId });
        }
      }

      // If single account, auto-save
      if (accounts.length === 1) {
        const acct = accounts[0];
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: existing } = await supabase
          .from("clinic_api_credentials")
          .select("id")
          .eq("clinic_id", clinic_id)
          .maybeSingle();

        const updateData = {
          google_ads_refresh_token: refreshToken,
          google_ads_customer_id: acct.customer_id,
          google_ads_login_customer_id: acct.login_customer_id,
          google_ads_account_name: acct.name,
        };

        if (existing) {
          await supabase.from("clinic_api_credentials").update(updateData).eq("clinic_id", clinic_id);
        } else {
          await supabase.from("clinic_api_credentials").insert({ clinic_id, ...updateData });
        }

        return new Response(null, {
          status: 302,
          headers: { Location: `${redirectBase}/clinics/${clinic_id}?google=connected` },
        });
      }

      // Multiple accounts: redirect for selection
      const encoded = btoa(JSON.stringify({ accounts, refresh_token: refreshToken }));
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${redirectBase}/clinics/${clinic_id}?google_accounts=${encodeURIComponent(encoded)}`,
        },
      });
    }

    // ── DISCONNECT ──
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
          google_ads_refresh_token: null,
          google_ads_customer_id: null,
          google_ads_login_customer_id: null,
          google_ads_account_name: null,
          last_google_sync_at: null,
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
    console.error("google-oauth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
