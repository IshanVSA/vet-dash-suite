import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a veterinary social media content expert. Generate engaging social media content for veterinary clinics.

Return your response as valid JSON with this exact structure:
{
  "caption": "The main social media caption text",
  "main_copy": "The extended body/main copy for the post",
  "cta": "A clear call-to-action",
  "hashtags": "Relevant hashtags as a string"
}

Only output the JSON, no other text.`;

function buildUserPrompt(intake: any): string {
  const parts = [
    `Clinic: ${intake.clinicName || "Veterinary Clinic"}`,
    intake.platform && `Platform: ${intake.platform}`,
    intake.goal && `Campaign Objective: ${intake.goal}`,
    intake.tone && `Tone: ${intake.tone}`,
    intake.services && `Services: ${intake.services}`,
    intake.targetAudience && `Target Audience: ${intake.targetAudience}`,
    intake.promotions && `Promotions: ${intake.promotions}`,
    intake.specialEvents && `Special Events: ${intake.specialEvents}`,
    intake.selectedThemes?.length && `Themes: ${intake.selectedThemes.join(", ")}`,
    intake.country && `Country: ${intake.country}`,
    intake.language && `Language: ${intake.language}`,
    intake.notes && `Additional Notes: ${intake.notes}`,
    intake.month && `Month: ${intake.month}`,
    intake.postsPerWeek && `Posts Per Week: ${intake.postsPerWeek}`,
  ].filter(Boolean);
  return parts.join("\n");
}

async function callOpenAI(apiKey: string, userPrompt: string): Promise<any> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return JSON.parse(content);
}

async function callClaude(apiKey: string, userPrompt: string): Promise<any> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Claude error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || "{}";
  // Extract JSON from possible markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(jsonMatch ? jsonMatch[1].trim() : text.trim());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check role - only admin or concierge
    const { data: roleData } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!roleData || !["admin", "concierge"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Only admin/concierge can generate content" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clinic_id, intake_data } = await req.json();
    if (!clinic_id || !intake_data) {
      return new Response(JSON.stringify({ error: "Missing clinic_id or intake_data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = buildUserPrompt(intake_data);

    // Create content request
    const { data: requestData, error: reqError } = await supabaseAdmin
      .from("content_requests")
      .insert({
        clinic_id,
        created_by_concierge_id: user.id,
        intake_data,
        status: "generated",
      })
      .select("id")
      .single();

    if (reqError) {
      return new Response(JSON.stringify({ error: reqError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentRequestId = requestData.id;

    // Call both APIs in parallel
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const claudeKey = Deno.env.get("ANTHROPIC_API_KEY");

    const results: { model: string; content: any; error?: string }[] = [];

    const promises = [];
    if (openaiKey) {
      promises.push(
        callOpenAI(openaiKey, userPrompt)
          .then(content => results.push({ model: "OpenAI", content }))
          .catch(err => {
            console.error("OpenAI call failed:", err.message);
            results.push({ model: "OpenAI", content: null, error: err.message });
          })
      );
    }
    if (claudeKey) {
      promises.push(
        callClaude(claudeKey, userPrompt)
          .then(content => results.push({ model: "Claude", content }))
          .catch(err => {
            console.error("Claude call failed:", err.message);
            results.push({ model: "Claude", content: null, error: err.message });
          })
      );
    }

    await Promise.all(promises);

    // Save versions
    const versions = [];
    for (const result of results) {
      if (result.content) {
        const { data: versionData } = await supabaseAdmin
          .from("content_versions")
          .insert({
            content_request_id: contentRequestId,
            model_name: result.model,
            generated_content: result.content,
          })
          .select()
          .single();
        if (versionData) versions.push(versionData);
      }
    }

    return new Response(JSON.stringify({
      content_request_id: contentRequestId,
      versions,
      errors: results.filter(r => r.error).map(r => ({ model: r.model, error: r.error })),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-content error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
