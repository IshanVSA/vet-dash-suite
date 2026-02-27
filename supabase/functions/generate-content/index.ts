import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(totalPosts: number): string {
  return `You are a senior veterinary marketing strategist creating a high-performing monthly social media content calendar for a veterinary clinic.

Your goal is to generate a strategic, revenue-aware, platform-optimized content calendar for the selected month.

You must:
- Balance brand awareness, education, engagement, and revenue generation.
- Prioritize services that drive revenue.
- Use past performance insights to optimize content mix.
- Automatically determine ideal post distribution and formats.
- Create content that is differentiated from competitors.
- Generate conversion-focused CTAs aligned with business goals.
- CRITICAL DATE RULE: ALL suggested_date values MUST fall within the selected calendar month. Do NOT generate any dates outside the selected month. For example, if the month is "March 2026", all dates must be between 2026-03-01 and 2026-03-31. Never spill into the next or previous month.

🔥 AI Decision Logic Requirements:
Before generating the calendar:
1. Determine ideal content mix: Awareness %, Engagement %, Promotion %, Education %
2. Decide content formats: Reels, Carousel, Static, Story
3. Sequence posts logically: Educational before promotional, offer buildup before deadline, event reminders near event date
4. Use tone consistently.
5. Ensure CTAs align with goal.
6. Avoid repetitive ideas.

🧠 Advanced Behavior:
- Automatically prioritize revenue-driving services.
- Build anticipation for promotions.
- Space promotional posts properly. Avoid back-to-back heavy sales posts.
- Include at least: 1 authority-building post per week, 1 engagement-focused post per week, 1 conversion-driven post per week.
- If budget is high → Increase lead-focused content.
- If engagement rate is low → Increase engagement posts.
- If follower growth is low → Add awareness-focused posts.
- CRITICAL: Distribute posts evenly across ALL platforms the user selected. If they selected Instagram, Facebook, and TikTok, roughly 1/3 of posts should be for each platform. Never default to only one platform.

🛡️ REGULATORY COMPLIANCE (CRITICAL):
- Based on the clinic's country and state/province, identify the governing veterinary regulatory body using its OFFICIAL LEGAL NAME (acronym + full name). Examples:
  * Alberta, Canada → ABVMA (Alberta Veterinary Medical Association)
  * British Columbia, Canada → CVBC (College of Veterinarians of British Columbia)
  * Ontario, Canada → CVO (College of Veterinarians of Ontario)
  * United States → AVMA (American Veterinary Medical Association) + the specific state veterinary medical board
  * United Kingdom → RCVS (Royal College of Veterinary Surgeons)
  * Australia → AVA (Australian Veterinary Association)
  Do NOT use unofficial or abbreviated names like "College of Veterinarians of Alberta" — always use the legally recognized name of the regulatory body.
- Apply that body's advertising and marketing guidelines to ALL generated content.
- Common rules to enforce:
  * No misleading or unsubstantiated claims
  * No guaranteed treatment outcomes
  * Proper use of veterinary titles and credentials
  * Testimonial restrictions (if applicable)
  * Price advertising compliance
  * No superlative claims ("best", "cheapest") unless verifiable
  * Emergency service disclaimers where needed
- Each post MUST include a compliance_note explaining what regulatory considerations were applied.

Return your response as valid JSON with this exact structure:
{
  "strategy_summary": {
    "content_mix": { "awareness": 30, "engagement": 25, "promotion": 25, "education": 20 },
    "format_distribution": { "reel": 40, "carousel": 30, "static": 20, "story": 10 },
    "goal_alignment": "Explanation of how content aligns with goals",
    "revenue_focus": "Explanation of revenue strategy",
    "competitive_positioning": "How content differentiates from competitors",
    "regulatory_compliance": {
      "regulatory_body": "Name of the governing veterinary regulatory body",
      "jurisdiction": "State/Province, Country",
      "key_restrictions": ["Restriction 1", "Restriction 2", "Restriction 3"]
    }
  },
  "posts": [
    {
      "post_number": 1,
      "week": 1,
      "suggested_date": "YYYY-MM-DD",
      "platform": "One of the selected platforms (distribute posts evenly across ALL selected platforms)",
      "content_type": "Reel",
      "hook": "Attention-grabbing opening line",
      "caption": "The main social media caption text",
      "main_copy": "The extended body/main copy for the post",
      "cta": "A clear call-to-action",
      "hashtags": "Relevant hashtags as a string",
      "goal_type": "Awareness",
      "service_highlighted": "Service name",
      "funnel_stage": "Top",
      "theme": "The theme or topic of this post",
      "compliance_note": "Brief explanation of regulatory considerations applied to this post"
    }
  ]
}

Generate exactly ${totalPosts} posts, spread across 4 weeks. Each post should be unique, varied in theme, and relevant to the clinic's goals. Only output the raw JSON. Do not wrap it in markdown code fences or any other formatting.`;
}

function buildUserPrompt(intake: any): string {
  const parts = [
    `Clinic Name: ${intake.clinicName || "Veterinary Clinic"}`,
    intake.country && `Country: ${intake.country}`,
    intake.stateProvince && `State/Province: ${intake.stateProvince}`,
    intake.language && `Language: ${intake.language}`,
    intake.budget && `Budget: ${intake.budget}`,
    intake.tone && `Tone: ${intake.tone}`,
    intake.selectedMonth && `Calendar Month: ${intake.selectedMonth}`,
    // Past Performance
    intake.topPost && `Top Performing Post: ${intake.topPost}`,
    intake.engagementRate && `Engagement Rate: ${intake.engagementRate}`,
    intake.followerGrowth && `Follower Growth: ${intake.followerGrowth}`,
    intake.topContentType && `Top Content Type: ${intake.topContentType}`,
    intake.performanceNotes && `Performance Notes: ${intake.performanceNotes}`,
    // Goals
    intake.goal && `Primary Goal: ${intake.goal}`,
    intake.secondaryGoals && `Secondary Goals: ${intake.secondaryGoals}`,
    intake.promotions && `Promotions: ${intake.promotions}`,
    intake.specialEvents && `Upcoming Events: ${intake.specialEvents}`,
    intake.services && `Services to Highlight: ${intake.services}`,
    intake.targetAudience && `Target Audience: ${intake.targetAudience}`,
    intake.competitors && `Competitors: ${intake.competitors}`,
    intake.selectedThemes?.length && `Themes: ${intake.selectedThemes.join(", ")}`,
    intake.platform && `Preferred Platforms: ${intake.platform}`,
    intake.postsPerWeek && `Posts Per Week: ${intake.postsPerWeek}`,
    intake.notes && `Additional Notes: ${intake.notes}`,
  ].filter(Boolean);
  return parts.join("\n");
}

function calculateTotalPosts(intake: any): number {
  const perWeek = parseInt(intake.postsPerWeek) || 3;
  return perWeek * 4;
}

async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<any> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
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

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<any> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Claude error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || "{}";
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonStr: string;
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  } else {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    jsonStr = start !== -1 && end !== -1 ? text.substring(start, end + 1) : text.trim();
  }
  return JSON.parse(jsonStr);
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

    // Check role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!roleData || !["admin", "concierge"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Only admin/concierge can generate content" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const clinic_id = typeof body.clinic_id === "string" ? body.clinic_id.trim() : "";
    const intake_data = body.intake_data && typeof body.intake_data === "object" && !Array.isArray(body.intake_data) ? body.intake_data : null;

    if (!clinic_id || !intake_data) {
      return new Response(JSON.stringify({ error: "Missing clinic_id or intake_data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate payload size (limit intake_data to ~50KB)
    const intakeStr = JSON.stringify(intake_data);
    if (intakeStr.length > 50000) {
      return new Response(JSON.stringify({ error: "Intake data is too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalPosts = calculateTotalPosts(intake_data);
    const systemPrompt = buildSystemPrompt(totalPosts);
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
      console.error("Content request insert error:", reqError.message);
      return new Response(JSON.stringify({ error: "Failed to create content request" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentRequestId = requestData.id;

    // Call APIs in parallel
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const claudeKey = Deno.env.get("ANTHROPIC_API_KEY");

    // Run models SEQUENTIALLY to avoid exceeding compute limits
    const results: { model: string; content: any; error?: string }[] = [];

    if (openaiKey) {
      try {
        const content = await callOpenAI(openaiKey, systemPrompt, userPrompt);
        results.push({ model: "OpenAI", content });
      } catch (err: any) {
        console.error("OpenAI call failed:", err.message);
        results.push({ model: "OpenAI", content: null, error: err.message });
      }
    }
    if (claudeKey) {
      try {
        const content = await callClaude(claudeKey, systemPrompt, userPrompt);
        results.push({ model: "Claude", content });
      } catch (err: any) {
        console.error("Claude call failed:", err.message);
        results.push({ model: "Claude", content: null, error: err.message });
      }
    }

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
      total_posts: totalPosts,
      errors: results.filter(r => r.error).map(r => ({ model: r.model, error: r.error })),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-content error:", err);
    return new Response(JSON.stringify({ error: "Content generation failed. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
