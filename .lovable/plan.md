

## Fix: Tighten Compliance Verification Prompt

### Problem

The current system prompt gives the AI generic rules like "start and end dates must be reasonable" which aren't actual CVO (or other regulatory body) rules. The AI invents false compliance issues — e.g., flagging dates as "too far in the future" when no such rule exists.

### Solution

Rewrite the system prompt in `supabase/functions/verify-popup-offer/index.ts` to:

1. **Only flag genuine regulatory violations** — issues that would actually cause legal/regulatory problems
2. **Stop inventing rules** — explicitly instruct the AI not to fabricate restrictions that the regulatory body doesn't enforce
3. **Remove the generic checklist** — replace with body-specific guidance focusing on what each body actually regulates (misleading claims, false advertising, unprofessional conduct)
4. **Separate real issues from optional suggestions** — issues should only be actual violations; suggestions remain as nice-to-haves

### Updated System Prompt (key changes)

- Remove "Start and end dates must be reasonable" — no regulatory body has this rule
- Remove "Must comply with local consumer protection laws" — too vague, causes false flags
- Add explicit instruction: "Only flag issues that represent actual violations of the regulatory body's published advertising/marketing rules. Do NOT invent or assume rules. If unsure whether something violates a specific rule, do NOT flag it as an issue."
- Add: "Do NOT flag date ranges, promotional timeframes, or offer durations as compliance issues unless they create a genuinely misleading impression."
- Keep legitimate checks: misleading claims, outcome guarantees, unsubstantiated superlatives, deceptive terms

### File Changed

**`supabase/functions/verify-popup-offer/index.ts`** — rewrite the `systemPrompt` string (lines 23-42), then redeploy.

