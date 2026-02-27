

## Switch Second AI Model from Gemini to Claude (Anthropic)

### What Changes
Replace the Gemini/Lovable AI gateway call with a direct Anthropic Claude API call using Claude Sonnet 4 (the latest Sonnet model, `claude-sonnet-4-20250514`).

### Files to Modify

**1. `supabase/functions/generate-content/index.ts`**
- Revert the `callClaude` function to use the Anthropic API directly (`https://api.anthropic.com/v1/messages`)
- Use model `claude-sonnet-4-20250514` (Claude Sonnet 4)
- Use `ANTHROPIC_API_KEY` (already configured as a secret)
- Switch the second model call from `lovableKey`/Gemini back to `claudeKey`/Claude
- Update model name labels from "Gemini" to "Claude" in results

**2. `src/components/content-requests/ContentRequestCard.tsx`**
- Already has Claude label detection (`name.includes("claude")`) -- no change needed, just confirm the Gemini line stays for backward compatibility with any existing Gemini versions.

### Technical Details

The `callClaude` function will be restored to:
- POST to `https://api.anthropic.com/v1/messages` with `x-api-key` and `anthropic-version: 2023-06-01` headers
- Use model `claude-sonnet-4-20250514` with `max_tokens: 8192`
- Parse response from `data.content[0].text`
- Extract JSON using the existing regex/fallback logic

The main handler will read `ANTHROPIC_API_KEY` instead of `LOVABLE_API_KEY` for the second model call and label results as "Claude".

The edge function will be redeployed automatically.
