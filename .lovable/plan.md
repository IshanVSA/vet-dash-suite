

## Plan: Enhanced Pop-up Offers Form with Compliance Verification

### Overview

Transform the Pop-up Offers quick action into a compliance-aware form with AI verification, consent gating, and form locking.

### Changes

#### 1. PopupOffersForm.tsx — Complete Rewrite

**Props change**: Accept `clinicId` in addition to `onChange`, plus a new `onConsentChange(consented: boolean)` callback so the parent dialog knows when to enable/disable the submit button.

**New state**:
- `offerTitle` (mandatory), `offerText`, `termsAndConditions`
- `startDate`, `endDate` (both mandatory, moved to bottom)
- `consented` (boolean) — checkbox
- `verified` (boolean) — set after AI verification passes
- `verifying` (boolean) — loading state
- `verificationResult` — stores AI response (compliance status + suggestions)
- `clinicAddress` — fetched from `clinics` table using `clinicId`
- `complianceBody` — auto-derived from clinic address (province/state parsing)

**Remove**: `targetPage` field entirely.

**Form layout order**:
1. Offer Title * (Input)
2. Offer Description (Textarea)
3. Terms & Conditions (Textarea)
4. Start Date * / End Date * (date inputs, grid)
5. **Verify Offer** button — calls the `chat` edge function (or a new lightweight edge function) with the offer details + compliance body to check compliance and return suggestions
6. Verification result panel — shows compliance status, suggestions to improve
7. Consent checkbox — disabled until verified. Text: "I acknowledge that all information provided for this pop-up offer is correct and compliant with [Compliance Body] regulations."
8. All fields become read-only when consented. Unchecking consent unlocks fields.

**Compliance body auto-detection logic** (client-side):
- Fetch clinic address from Supabase
- Parse province/state from address string
- Map to compliance body (e.g., AB → ABVMA, ON → CVO, BC → CVBC, etc.)
- Display detected body name near the verify button

**AI Verification**: Use the existing `LOVABLE_API_KEY` + AI gateway to verify the offer content. Create a new edge function `verify-popup-offer` that:
- Receives: offerTitle, offerText, termsAndConditions, startDate, endDate, complianceBody
- Calls AI gateway with a system prompt asking it to verify the offer against the compliance body's advertising rules
- Returns: `{ compliant: boolean, issues: string[], suggestions: string[] }`

**onChange behavior**: Always emit the full serialized description. Include verification status and compliance body in the output.

**onConsentChange**: Called whenever consent changes. Parent uses this to gate the Create Ticket button.

#### 2. NewTicketDialog.tsx — Minor Updates

- Pass `clinicId` to `PopupOffersForm`
- Hide attachments for "Pop-up Offers" (same as Time Changes)
- Add `popupConsented` state; disable Create Ticket button for Pop-up Offers unless consented
- Add validation: if Pop-up Offers and not consented, show error

#### 3. New Edge Function: `supabase/functions/verify-popup-offer/index.ts`

- Accepts offer details + compliance body
- Uses AI gateway (`LOVABLE_API_KEY`) to verify compliance
- Returns structured JSON with compliance status and suggestions
- Add to `supabase/config.toml` with `verify_jwt = false`

### Technical Details

**Compliance body mapping** (hardcoded client-side):
```
AB → ABVMA, BC → CVBC, ON → CVO, SK → SVMA, MB → MVMA,
QC → OMVQ, NS → NSVMA, NB → NBVMA, PE → PEIVMA, NL → NLVMA,
USA states → AVMA (general), UK → RCVS
```

**Form locking**: When `consented === true`, all inputs get `disabled={true}`. The consent checkbox itself remains enabled to allow unchecking.

**Gating flow**:
1. Fill form → 2. Click "Verify Offer" → 3. AI returns result → 4. If compliant, consent checkbox enabled → 5. Check consent → 6. Fields lock → 7. Create Ticket enabled

