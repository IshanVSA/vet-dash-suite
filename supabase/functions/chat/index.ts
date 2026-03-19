import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://api.openai.com/v1/chat/completions";

const tools = [
  {
    type: "function",
    function: {
      name: "create_ticket",
      description:
        "Create a support ticket for a department. Use when the user wants to submit a request, report an issue, or create a task for Website, SEO, Google Ads, or Social Media teams.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Brief summary of the issue or request (max 200 chars)",
          },
          department: {
            type: "string",
            enum: ["website", "seo", "google_ads", "social_media"],
            description: "Which department this ticket is for",
          },
          ticket_type: {
            type: "string",
            description:
              "Category of the ticket. Website: Time Changes, Pop-up Offers, Theme Updates, Add/Remove Team Members, New Forms, Paper-to-Digital Conversion, Price List Updates, Tech Issues, Others. SEO: Backlinking, Ranking Reports, Keyword Research, Manual Work Reports, Search Atlas Integration, SEO Thread Updates, Others. Google Ads: Dashboard Access, Analytics Review, Monthly Performance Report, Call Volume Issues, Wrong Call Tracking, Campaign Adjustments, Others. Social Media: Content Calendar, Post Approval, Analytics, Campaign Planning, Others.",
          },
          priority: {
            type: "string",
            enum: ["regular", "urgent", "emergency"],
            description: "Ticket priority. Default to regular unless user indicates urgency.",
          },
          description: {
            type: "string",
            description: "Detailed description of the issue or request",
          },
        },
        required: ["title", "department", "ticket_type"],
        additionalProperties: false,
      },
    },
  },
];

const systemPrompt = `You are the VSA Vet Media assistant, embedded inside a veterinary marketing platform. You help users with:
- Navigating the platform (Dashboard, Departments: Website/SEO/Google Ads/Social Media, Clinics, Settings)
- Understanding their analytics and content calendar
- Creating support tickets for departments when users have issues or requests
- General veterinary marketing advice (social media best practices, SEO tips, Google Ads optimization)

When a user describes a problem or wants to submit a request, use the create_ticket tool to create a ticket for them. Ask for any missing details if the request is unclear.

Be friendly, concise, and professional. Use markdown formatting for structured answers.`;

async function executeCreateTicket(
  args: {
    title: string;
    department: string;
    ticket_type: string;
    priority?: string;
    description?: string;
  },
  userId: string
) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.from("department_tickets").insert({
    title: args.title,
    department: args.department,
    ticket_type: args.ticket_type,
    priority: args.priority || "regular",
    description: args.description || null,
    created_by: userId,
  }).select("id, title, department, priority").single();

  if (error) {
    console.error("Ticket creation error:", error);
    return { success: false, error: error.message };
  }
  return { success: true, ticket: data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Extract user ID from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
        userId = data?.claims?.sub as string || null;
      } catch (e) {
        console.error("Auth error:", e);
      }
    }

    const gatewayHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    const allMessages = [{ role: "system", content: systemPrompt }, ...messages];

    // First pass: non-streaming with tools to detect tool calls
    const r1 = await fetch(GATEWAY, {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        tools,
        stream: false,
      }),
    });

    if (!r1.ok) {
      const status = r1.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await r1.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const j1 = await r1.json();
    const choice = j1.choices?.[0];

    if (!choice) {
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalMessages = allMessages;

    // Handle tool calls
    if (choice.message?.tool_calls?.length) {
      const assistantMsg = choice.message;
      const toolResults = [];

      for (const tc of assistantMsg.tool_calls) {
        if (tc.function.name === "create_ticket") {
          const args = typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;

          if (!userId) {
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({ success: false, error: "User not authenticated. Please log in to create tickets." }),
            });
          } else {
            const result = await executeCreateTicket(args, userId);
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            });
          }
        }
      }

      finalMessages = [...allMessages, assistantMsg, ...toolResults];
    } else if (choice.message?.content) {
      // No tool call - include the assistant response and stream won't re-generate
      // Just return the content directly as SSE
      const content = choice.message.content;
      const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`;
      return new Response(sseData, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Stream the final response (after tool execution or if no content)
    const r2 = await fetch(GATEWAY, {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!r2.ok) {
      const t = await r2.text();
      console.error("AI gateway error (2nd pass):", r2.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(r2.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
