

## Problem
The account list in the Google Ads selection dialog scrolls the entire dialog (header, search, footer all scroll away). The user wants the account list in a fixed-height scrollable area with the search bar above and the Connect button always visible at the bottom.

## Changes

**File: `src/components/clinic-detail/GoogleAccountSelectionDialog.tsx`**

1. Remove `overflow-y-auto` from `DialogContent` — the dialog itself should not scroll
2. Wrap the `RadioGroup` (account list) in a `ScrollArea` with a fixed max height (`max-h-[50vh]`) so only the list scrolls
3. Keep search input and `DialogFooter` (Connect/Cancel buttons) outside the scroll area so they stay fixed

This is a layout-only change — no logic modifications needed.

