

## Problem
After OAuth, the Google Ads account selection dialog shows all 36 sub-accounts from the MCC. There is no filtering or guidance to help admins pick the correct account for the current clinic.

## Approach
Add client-side filtering in the `GoogleAccountSelectionDialog` to auto-match and prioritize accounts based on the clinic name. No edge function or database changes needed.

### Changes

**1. Pass clinic name to the selection dialog**
- In `src/pages/ClinicDetail.tsx`: pass `clinicName={clinic?.clinic_name || ""}` to `GoogleAccountSelectionDialog`
- In `src/components/clinic-detail/GoogleAccountSelectionDialog.tsx`: accept new `clinicName` prop

**2. Smart sorting and highlighting in the dialog**
- Compute a match score for each account by checking if the clinic name (or significant words from it) appears in the Google Ads account name (case-insensitive)
- Sort matched accounts to the top of the list
- Show a "Suggested match" badge next to accounts whose name closely matches the clinic name
- Pre-select the best match if there is one
- The search box already exists; the default search value will be pre-filled with the clinic name to immediately narrow results

**3. Visual treatment**
- Matched accounts get a green "Suggested" badge
- Non-matching accounts remain selectable (no hard block) since naming conventions may differ
- This is a soft guard: it guides the user but does not prevent manual override

### Files to modify
- `src/pages/ClinicDetail.tsx` -- pass `clinicName` prop
- `src/components/clinic-detail/GoogleAccountSelectionDialog.tsx` -- add matching logic, sorting, badge, and pre-fill search

