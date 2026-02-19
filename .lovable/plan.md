
## Update AI Content Generation Prompt

The intake form already collects all required fields. This plan updates the edge function prompt and the content display components to match the new output structure.

### Changes

**1. Update `supabase/functions/generate-content/index.ts`**

Replace `buildSystemPrompt` with the full veterinary marketing strategist prompt you provided. Key changes:
- Role: "senior veterinary marketing strategist" instead of "social media content expert"
- Adds AI decision logic: content mix calculation, format distribution, post sequencing rules, budget/engagement-aware behavior
- New output structure requires a `strategy_summary` object (content mix %, format distribution, goal alignment, revenue focus, competitive positioning)
- Each post now includes: `suggested_date`, `platform`, `content_type` (Reel/Carousel/Static/Story), `hook`, `caption`, `cta`, `hashtags`, `goal_type` (Awareness/Lead/Engagement/Promotion), `service_highlighted`, `funnel_stage` (Top/Middle/Bottom)
- Increase Claude `max_tokens` from 8192 to 16384 to accommodate the larger strategy summary + posts output

Update `buildUserPrompt` to pass all intake fields with clearer labels matching the prompt template (e.g., `Budget`, `Competitors`, `Secondary Goals`, `Top Performing Post`, etc.).

**2. Update `src/components/content-requests/ContentVersionCard.tsx`**

Add a `StrategySummary` block that renders the `strategy_summary` object from the AI response before the posts list. Displays:
- Content Mix percentages
- Format Distribution
- Goal Alignment
- Revenue Focus
- Competitive Positioning

**3. Update `src/components/content-requests/ContentPostCard.tsx`**

Add display for the new post fields:
- `hook` — shown as a highlighted text block above the caption
- `platform` — shown as a badge next to week/content_type
- `goal_type` — shown as a colored badge (Awareness=blue, Lead=orange, Engagement=green, Promotion=purple)
- `service_highlighted` — shown as a subtle label
- `funnel_stage` — shown as a badge (Top/Middle/Bottom)
- `suggested_date` — shown in the collapsed row

### Technical Details

New JSON output structure the AI will return:

```text
{
  "strategy_summary": {
    "content_mix": { "awareness": 30, "engagement": 25, "promotion": 25, "education": 20 },
    "format_distribution": { "reel": 40, "carousel": 30, "static": 20, "story": 10 },
    "goal_alignment": "...",
    "revenue_focus": "...",
    "competitive_positioning": "..."
  },
  "posts": [
    {
      "post_number": 1,
      "week": 1,
      "suggested_date": "2026-03-02",
      "platform": "Instagram",
      "content_type": "Reel",
      "hook": "...",
      "caption": "...",
      "main_copy": "...",
      "cta": "...",
      "hashtags": "...",
      "goal_type": "Awareness",
      "service_highlighted": "Dental Cleaning",
      "funnel_stage": "Top",
      "theme": "..."
    }
  ]
}
```

### What stays unchanged
- Intake form (`IntakeForms.tsx`) — already collects all needed fields
- Dual-AI parallel generation (OpenAI + Claude)
- 3-level approval workflow (Concierge -> Admin -> Client)
- Database schema (generated_content is already a JSON column)
