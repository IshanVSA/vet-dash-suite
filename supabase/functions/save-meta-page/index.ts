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
    const { clinic_id, page_id, page_name, page_access_token } = await req.json();

    if (!clinic_id || !page_id || !page_access_token) {
      return new Response(
        JSON.stringify({ error: "clinic_id, page_id, and page_access_token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch Instagram Business Account ID
    const igRes = await fetch(
      `https://graph.facebook.com/v21.0/${page_id}?fields=instagram_business_account&access_token=${page_access_token}`
    );
    const igData = await igRes.json();
    const igBusinessId = igData.instagram_business_account?.id || null;

    // Save credentials
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existing } = await supabase
      .from("clinic_api_credentials")
      .select("id")
      .eq("clinic_id", clinic_id)
      .maybeSingle();

    let saveError;
    if (existing) {
      const { error } = await supabase
        .from("clinic_api_credentials")
        .update({
          meta_page_access_token: page_access_token,
          meta_page_id: page_id,
          meta_instagram_business_id: igBusinessId,
          meta_page_name: page_name || null,
        })
        .eq("clinic_id", clinic_id);
      saveError = error;
    } else {
      const { error } = await supabase
        .from("clinic_api_credentials")
        .insert({
          clinic_id,
          meta_page_access_token: page_access_token,
          meta_page_id: page_id,
          meta_instagram_business_id: igBusinessId,
          meta_page_name: page_name || null,
        });
      saveError = error;
    }

    if (saveError) {
      console.error("Failed to save:", saveError);
      return new Response(
        JSON.stringify({ error: saveError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Saved Meta page ${page_name} (${page_id}) for clinic ${clinic_id}, IG: ${igBusinessId}`);
    return new Response(
      JSON.stringify({ success: true, ig_business_id: igBusinessId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("save-meta-page error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
