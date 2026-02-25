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
    const { clinic_id, customer_id, account_name, refresh_token, login_customer_id } = await req.json();

    if (!clinic_id || !customer_id || !refresh_token) {
      return new Response(
        JSON.stringify({ error: "clinic_id, customer_id, and refresh_token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existing } = await supabase
      .from("clinic_api_credentials")
      .select("id")
      .eq("clinic_id", clinic_id)
      .maybeSingle();

    const updateData = {
      google_ads_refresh_token: refresh_token,
      google_ads_customer_id: customer_id,
      google_ads_login_customer_id: login_customer_id || customer_id,
      google_ads_account_name: account_name || null,
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
        JSON.stringify({ error: saveError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Saved Google Ads account ${account_name} (${customer_id}) for clinic ${clinic_id}`);
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
