

## Redesign: Transcript Dialog with Editable Textarea

### What Changes

When the user clicks **Stop** after dictating, a **dialog popup** appears showing the transcribed text in an **editable textarea**. The user can review/edit the transcript, then click **"Autofill Form"** to extract fields and populate the form. They can also cancel/discard.

### Flow

```text
[Dictate] → listening... → [Stop] → Dialog opens with transcript in textarea
   → User reviews/edits → [Autofill Form] → AI extracts → form populated → dialog closes
   → Or [Cancel] → dialog closes, transcript discarded
```

### Changes (single file)

**`src/components/department/ticket-forms/VoiceDictation.tsx`**

- Add a `showDialog` state — set to `true` when Stop is clicked and transcript exists
- Render a `Dialog` with:
  - A `Textarea` pre-filled with the transcript (editable so user can correct mistakes)
  - An "Autofill Form" button that calls the existing `extractFields` logic
  - A "Cancel" button that closes the dialog and clears transcript
- Remove the inline transcript preview and the inline "Fill Form" button — everything moves into the dialog
- The mic button + pulsing indicator remain inline as-is
- Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` and `Textarea`

No other files need changes.

