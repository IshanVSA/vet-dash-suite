

## AI Dictation for Quick Action Forms

### What It Does
Adds a microphone button to every quick action form. Users click it, speak naturally (e.g., "We need to change Monday hours to 8am to 6pm starting next week"), and AI extracts the relevant fields and autofills the form.

### Architecture

```text
User speaks → Browser Speech API → Transcript text
    → Edge Function (Lovable AI) → Structured JSON with field values
        → Client sets form state from JSON
```

### Implementation Steps

**1. Create a reusable `VoiceDictation` component**
- `src/components/department/ticket-forms/VoiceDictation.tsx`
- Uses the browser's built-in `webkitSpeechRecognition` / `SpeechRecognition` API (no external dependency needed)
- Shows a mic button that toggles recording, displays a pulsing indicator while listening
- On speech end, shows the raw transcript and a "Fill Form" button
- Accepts an `onTranscriptReady` callback with the transcript string
- Handles browser compatibility gracefully (hides button if Speech API unavailable)

**2. Create an edge function `extract-ticket-fields`**
- `supabase/functions/extract-ticket-fields/index.ts`
- Receives `{ transcript, formType }` (e.g., "Time Changes", "Emergency")
- Uses Lovable AI (Gemini) with a structured tool-call schema specific to each form type to extract fields
- Returns a JSON object with the extracted field values (different shape per form type)
- Register in `config.toml` with `verify_jwt = false`

**3. Add `VoiceDictation` to each quick action form**
Each form gets a dictation button at the top. When AI returns extracted fields, the form calls its own setter functions to autofill:

- **TimeChangesForm**: Extracts start/end dates, per-day open/close times, stat holiday hours
- **PopupOffersForm**: Extracts offer title, description, terms, dates
- **ThirdPartyIntegrationsForm**: Extracts integration type, provider, URL, details
- **PaymentOptionsForm**: Extracts request type, payment methods, provider, location, details
- **AddRemoveTeamForm**: Extracts action (add/remove), name, role
- **NewFormsForm**: Extracts form name, fields needed
- **PriceListForm**: Extracts changes description, terms
- **EmergencyForm**: Extracts issue type, affected URL, description, impact

**4. Form interface changes**
Each form component will need to accept an optional `onAutofill` pattern. The simplest approach: each form exposes its state setters or accepts an `initialValues` prop that can be updated externally. Since forms already manage their own state, the cleanest approach is to add a `useImperativeHandle` or simply pass extracted values as a prop that triggers a `useEffect` to set state.

### Technical Details

- **Speech API**: Free, built into Chrome/Edge/Safari. Falls back to showing a "not supported" message in Firefox
- **AI Model**: `google/gemini-3-flash-preview` via Lovable AI gateway — fast and cheap
- **Extraction method**: Tool calling with per-form-type JSON schemas for reliable structured output
- **Edge function** uses `LOVABLE_API_KEY` (already available)
- The VoiceDictation component will be compact — a single icon button with a tooltip, expanding to show transcript when active

### Files to Create/Modify
- **Create**: `src/components/department/ticket-forms/VoiceDictation.tsx`
- **Create**: `supabase/functions/extract-ticket-fields/index.ts`
- **Modify**: `supabase/config.toml` — add function entry
- **Modify**: All 8 form components — add VoiceDictation + autofill state handling
- **Modify**: `src/integrations/supabase/client.ts` — no changes needed (already set up)

