import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offerTitle, offerText, termsAndConditions, startDate, endDate, complianceBody } =
      await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const systemPrompt = `You are a veterinary advertising compliance expert. You verify promotional offers against the advertising and marketing regulations of veterinary regulatory bodies.

Your task: Review the provided pop-up offer details and check them against the rules of the specified regulatory body (${complianceBody || "general veterinary advertising standards"}).

Key rules to check:
- No misleading or false claims
- No guarantees of outcomes
- No use of superlatives ("best", "cheapest") unless substantiated
- Discount offers must have clear terms and conditions
- Start and end dates must be reasonable
- Terms must be clear and not deceptive
- Offers must not undermine professional standards
- Must comply with local consumer protection laws

Respond ONLY with a JSON object using this exact structure (no markdown, no code blocks):
{"compliant": true/false, "issues": ["issue1", "issue2"], "suggestions": ["suggestion1", "suggestion2"]}

- "compliant": whether the offer passes compliance
- "issues": list of specific compliance problems found (empty array if compliant)
- "suggestions": list of improvements to make the offer better/clearer (always provide at least 1-2 suggestions even if compliant)`;

    const userPrompt = `Please verify this veterinary clinic pop-up offer:

Offer Title: ${offerTitle || "N/A"}
Offer Description: ${offerText || "N/A"}
Terms & Conditions: ${termsAndConditions || "None provided"}
Start Date: ${startDate || "N/A"}
End Date: ${endDate || "N/A"}
Regulatory Body: ${complianceBody || "General"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result = { compliant: false, issues: ["Could not parse AI response"], suggestions: [] };
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-popup-offer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
