

# Veterinary Regulatory Compliance in Content Generation

## Overview
Enhance the AI content generation system so that both OpenAI and Claude automatically identify the veterinary regulatory body for the clinic's country and state/province, then ensure all generated content complies with that body's advertising and marketing guidelines.

## How It Works
The system prompt will be updated to instruct the AI models to:
1. Identify the relevant veterinary regulatory body based on the country + state/province (e.g., CVBC for British Columbia, AVMA/state boards for US states, RCVS for the UK)
2. Apply that body's advertising rules -- such as restrictions on testimonials, price guarantees, misleading claims, before/after photos, and superlative language
3. Include a compliance note on each post explaining what was considered
4. Add a regulatory summary to the strategy output

No new APIs or external lookups are needed -- the AI models already have knowledge of major veterinary regulatory bodies and their marketing guidelines.

## What Changes

### 1. Edge Function: `supabase/functions/generate-content/index.ts`

**System Prompt Update** -- Add a compliance section:
- Instruct the AI to determine the veterinary regulatory body from the provided country and state/province
- List common compliance rules to check (no misleading claims, no guaranteed outcomes, proper use of credentials, testimonial restrictions, price advertising rules)
- Require each post to include a `compliance_note` field explaining regulatory considerations
- Add a `regulatory_compliance` section to the `strategy_summary` output containing: regulatory body name, key restrictions applied, and a compliance confidence statement

**User Prompt Update** -- Include state/province:
- Add the `stateProvince` field so the AI knows the exact jurisdiction

**Updated JSON Output Structure**:
- `strategy_summary` gains a `regulatory_compliance` object with `regulatory_body`, `jurisdiction`, and `key_restrictions`
- Each post gains a `compliance_note` string field

### 2. Frontend: Display Compliance Info

**`src/components/content-requests/ContentVersionCard.tsx`** (StrategySummary component):
- Add a new block to display the regulatory compliance info (body name, jurisdiction, key restrictions) with a shield icon

**`src/components/content-requests/ContentPostCard.tsx`**:
- Show the `compliance_note` field on each post card if present, with a small compliance badge/indicator

## Technical Details

### System Prompt Addition (appended before the JSON structure)
```
REGULATORY COMPLIANCE (CRITICAL):
- Based on the clinic's country and state/province, identify the governing 
  veterinary regulatory body (e.g., CVBC for British Columbia, AVMA + state 
  board for US states, RCVS for the UK, AVA for Australia).
- Apply that body's advertising and marketing guidelines to ALL generated content.
- Common rules to enforce:
  * No misleading or unsubstantiated claims
  * No guaranteed treatment outcomes
  * Proper use of veterinary titles and credentials
  * Testimonial restrictions (if applicable)
  * Price advertising compliance
  * No superlative claims ("best", "cheapest") unless verifiable
  * Emergency service disclaimers where needed
- Each post MUST include a compliance_note explaining what was considered.
```

### Updated JSON Structure
```json
{
  "strategy_summary": {
    "content_mix": { ... },
    "format_distribution": { ... },
    "goal_alignment": "...",
    "revenue_focus": "...",
    "competitive_positioning": "...",
    "regulatory_compliance": {
      "regulatory_body": "College of Veterinarians of BC (CVBC)",
      "jurisdiction": "British Columbia, Canada",
      "key_restrictions": ["No guaranteed outcomes", "Testimonial restrictions", "..."]
    }
  },
  "posts": [
    {
      ...existing fields...,
      "compliance_note": "Avoids outcome guarantees per CVBC guidelines. CTA uses informational language."
    }
  ]
}
```

### Files Modified
1. **`supabase/functions/generate-content/index.ts`** -- Update `buildSystemPrompt` and `buildUserPrompt`
2. **`src/components/content-requests/ContentVersionCard.tsx`** -- Display regulatory compliance in strategy summary
3. **`src/components/content-requests/ContentPostCard.tsx`** -- Show compliance note per post

