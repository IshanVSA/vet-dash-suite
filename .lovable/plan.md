

## Replace Browser Speech API with OpenAI Whisper

The browser's Web Speech API fails in iframe/cross-origin contexts. We'll replace it with **MediaRecorder** (records audio as a blob) + a new **Supabase edge function** that sends the audio to **OpenAI Whisper** for transcription.

### Flow

```text
[Dictate] → MediaRecorder captures mic audio → [Stop] → audio blob sent to edge function
→ Edge function sends to OpenAI Whisper API → transcript returned
→ Dialog opens with transcript in editable textarea → [Autofill Form] → AI extracts fields
```

### Changes

**1. New edge function: `supabase/functions/transcribe-audio/index.ts`**
- Accepts audio file via FormData
- Sends to `https://api.openai.com/v1/audio/transcriptions` using existing `OPENAI_API_KEY`
- Model: `whisper-1`
- Returns `{ text: "..." }`
- Standard CORS headers

**2. Update `supabase/config.toml`**
- Add `[functions.transcribe-audio]` with `verify_jwt = false`

**3. Rewrite `src/components/department/ticket-forms/VoiceDictation.tsx`**
- Remove all Web Speech API code (`SpeechRecognition`, `recognition.*`)
- Use `navigator.mediaDevices.getUserMedia()` + `MediaRecorder` to capture audio
- On Stop: send recorded audio blob to `transcribe-audio` edge function
- Show loading state ("Transcribing...") while waiting for Whisper response
- On success: open the existing review dialog with the transcript
- Remove the `if (!SpeechRecognition) return null` guard so the component always renders
- Keep the existing dialog, autofill, and cancel logic unchanged

### Technical Details

- MediaRecorder uses `audio/webm` format (widely supported, Whisper accepts it)
- Audio chunks collected in a ref array, combined into a single blob on stop
- The component no longer depends on browser speech recognition support

