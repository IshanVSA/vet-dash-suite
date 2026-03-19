

## Upgrade Compliance Verification to GPT-4o

### Problem
The `verify-popup-offer` edge function currently uses `gpt-4o-mini`, which is a smaller, cheaper model. For compliance verification accuracy, a higher-capability model will produce more reliable results.

### Change

**`supabase/functions/verify-popup-offer/index.ts`** — Line 138:
- Change `model: "gpt-4o-mini"` → `model: "gpt-4o"`

GPT-4o is OpenAI's most capable generally-available model with stronger reasoning, better instruction-following, and more accurate regulatory analysis — ideal for compliance verification where false positives/negatives matter.

This is a single-line change. The function will be automatically redeployed.

