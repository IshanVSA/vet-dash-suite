import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find posts where auto_approve_at has passed
    const { data: workflows, error: fetchError } = await supabase
      .from("post_workflow")
      .select("id, post_id")
      .eq("stage", "sent_to_client")
      .lte("auto_approve_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching workflows:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!workflows || workflows.length === 0) {
      return new Response(
        JSON.stringify({ message: "No posts to auto-approve", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let approvedCount = 0;

    for (const wf of workflows) {
      // Update workflow stage
      const { error: wfError } = await supabase
        .from("post_workflow")
        .update({ stage: "auto_approved" })
        .eq("id", wf.id);

      if (wfError) {
        console.error(`Failed to update workflow ${wf.id}:`, wfError);
        continue;
      }

      // Update content_posts status and workflow_stage
      await supabase
        .from("content_posts")
        .update({ status: "approved", workflow_stage: "auto_approved" })
        .eq("id", wf.post_id);

      // Log activity
      await supabase.from("post_activity_log").insert({
        post_id: wf.post_id,
        action: "auto_approved",
        actor_id: null,
        metadata: { reason: "5-day countdown expired" },
      });

      approvedCount++;
    }

    console.log(`Auto-approved ${approvedCount} posts`);

    return new Response(
      JSON.stringify({ message: "Auto-approval complete", count: approvedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auto-approve error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
