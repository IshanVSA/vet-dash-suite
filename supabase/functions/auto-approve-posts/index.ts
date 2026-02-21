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

    // Find all post_workflow rows where stage='sent_to_client' and auto_approve_at <= now
    const { data: expiredWorkflows, error: fetchError } = await supabase
      .from("post_workflow")
      .select("id, post_id")
      .eq("stage", "sent_to_client")
      .lte("auto_approve_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired workflows:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch workflows" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!expiredWorkflows || expiredWorkflows.length === 0) {
      return new Response(
        JSON.stringify({ message: "No posts to auto-approve", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const postIds = expiredWorkflows.map((w) => w.post_id);
    let approvedCount = 0;

    // Batch update all post_workflow rows
    const { error: workflowUpdateError } = await supabase
      .from("post_workflow")
      .update({ stage: "auto_approved", updated_at: new Date().toISOString() })
      .in("post_id", postIds);

    if (workflowUpdateError) {
      console.error("Error updating workflows:", workflowUpdateError);
    }

    // Batch update all content_posts
    const { error: postsUpdateError } = await supabase
      .from("content_posts")
      .update({ status: "approved", workflow_stage: "auto_approved" })
      .in("id", postIds);

    if (postsUpdateError) {
      console.error("Error updating posts:", postsUpdateError);
    }

    // Log activity for each post
    const activityLogs = postIds.map((postId) => ({
      post_id: postId,
      action: "auto_approved",
      actor_id: null,
      metadata: { reason: "5-day client review period expired" },
    }));

    const { error: logError } = await supabase
      .from("post_activity_log")
      .insert(activityLogs);

    if (logError) {
      console.error("Error inserting activity logs:", logError);
    }

    approvedCount = postIds.length;

    console.log(`Auto-approved ${approvedCount} posts`);

    return new Response(
      JSON.stringify({ message: `Auto-approved ${approvedCount} posts`, count: approvedCount }),
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
