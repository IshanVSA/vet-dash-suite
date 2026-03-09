import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check: require authenticated admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabaseAuth = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { clinic_id, customer_id, account_name, refresh_token, login_customer_id } = await req.json();

    // Validate inputs
    if (!clinic_id || !customer_id || !refresh_token) {
      return new Response(
        JSON.stringify({ error: "clinic_id, customer_id, and refresh_token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof clinic_id !== "string" || !UUID_REGEX.test(clinic_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid clinic_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof customer_id !== "string" || customer_id.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid customer_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existing } = await supabase
      .from("clinic_api_credentials")
      .select("id")
      .eq("clinic_id", clinic_id)
      .maybeSingle();

    const updateData = {
      google_ads_refresh_token: refresh_token,
      google_ads_customer_id: customer_id,
      google_ads_login_customer_id: login_customer_id || customer_id,
      google_ads_account_name: typeof account_name === "string" ? account_name.slice(0, 200) : null,
    };

    let saveError;
    if (existing) {
      const { error } = await supabase
        .from("clinic_api_credentials")
        .update(updateData)
        .eq("clinic_id", clinic_id);
      saveError = error;
    } else {
      const { error } = await supabase
        .from("clinic_api_credentials")
        .insert({ clinic_id, ...updateData });
      saveError = error;
    }

    if (saveError) {
      console.error("Failed to save:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Saved Google Ads account for clinic ${clinic_id}`);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("save-google-account error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
