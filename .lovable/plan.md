

## Fix: Claude JSON Parsing Failure

### Problem
Claude is wrapping its JSON response in markdown code fences (` ```json ... ``` `), and the current parsing logic fails to extract the JSON properly. The error log shows:
> `Claude call failed: Unexpected token '`', "```json\n{\n"... is not valid JSON`

### Root Cause
Two issues:
1. The system prompt says "Only output the JSON, no other text" but Claude still wraps it in code fences
2. The regex extraction on line 100 may fail on edge cases (e.g., backticks within the content, greedy vs lazy matching issues)

### Fix (in `supabase/functions/generate-content/index.ts`)

**1. Update the system prompt** to explicitly tell the model not to use code fences:
- Change `"Only output the JSON, no other text."` to `"Only output the raw JSON. Do not wrap it in markdown code fences or any other formatting."`

**2. Make the Claude JSON extraction more robust** (lines 99-101):
- Strip any leading/trailing whitespace
- Try regex extraction for code fences first
- If that fails, find the first `{` and last `}` in the response and extract that substring
- Then parse the result

```text
const text = data.content?.[0]?.text || "{}";
// Try to extract JSON from code fences
const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
let jsonStr: string;
if (jsonMatch) {
  jsonStr = jsonMatch[1].trim();
} else {
  // Fallback: find the JSON object boundaries
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  jsonStr = start !== -1 && end !== -1 ? text.substring(start, end + 1) : text.trim();
}
return JSON.parse(jsonStr);
```

**3. Increase `max_tokens`** from 4096 to 8192 to ensure the full JSON for 12+ posts isn't truncated (truncated JSON also causes parse failures).

### Files to Change
- `supabase/functions/generate-content/index.ts` (system prompt + Claude parsing logic + max_tokens)
- Redeploy the edge function after changes
