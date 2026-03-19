

## Switch All AI Functions to OpenAI API Key

### Current State
The project has 5 edge functions using AI:
- **`generate-content`** and **`extract-seo-report`** — already use `OPENAI_API_KEY` with `api.openai.com` directly. No changes needed.
- **`chat`**, **`extract-ticket-fields`**, **`verify-popup-offer`** — use `LOVABLE_API_KEY` with `ai.gateway.lovable.dev`. These need updating.

### Changes

**1. Update `supabase/functions/chat/index.ts`**
- Replace `LOVABLE_API_KEY` with `OPENAI_API_KEY`
- Change gateway URL from `https://ai.gateway.lovable.dev/v1/chat/completions` to `https://api.openai.com/v1/chat/completions`
- Change model from `google/gemini-3-flash-preview` to `gpt-4o-mini`

**2. Update `supabase/functions/extract-ticket-fields/index.ts`**
- Replace `LOVABLE_API_KEY` with `OPENAI_API_KEY`
- Change gateway URL to `https://api.openai.com/v1/chat/completions`
- Change model to `gpt-4o-mini`

**3. Update `supabase/functions/verify-popup-offer/index.ts`**
- Replace `LOVABLE_API_KEY` with `OPENAI_API_KEY`
- Change gateway URL to `https://api.openai.com/v1/chat/completions`
- Change model to `gpt-4o-mini`

### No other changes needed
- `OPENAI_API_KEY` is already configured as a Supabase secret
- `generate-content` and `extract-seo-report` already use OpenAI directly
- No frontend changes required — all AI calls go through edge functions

