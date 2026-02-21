

# Fix: Admin Review Collapsible Content Not Visible

## Problem
The "View Content" collapsible dropdown on each clinic card in the Admin Review page is not visually expanding when clicked. The code structure, data, and Radix Collapsible wiring are all correct, but the content isn't appearing.

## Root Cause
The card wrapper `<div>` between `<Collapsible>` and `<CollapsibleContent>` has `overflow-hidden`, which can clip the collapsible content during Radix's internal height animation. Additionally, the `CollapsibleContent` component lacks transition styles that help ensure smooth rendering.

## Fix (single file change)

**File: `src/pages/AdminReview.tsx`**

1. Remove `overflow-hidden` from the card wrapper div (line 217) -- this prevents the collapsible content from being clipped.
2. Add a `forceMount` approach or ensure the `CollapsibleContent` renders correctly by keeping the structure clean.
3. Add a subtle open/close transition using Tailwind's `data-[state=open]` and `data-[state=closed]` attribute selectors on `CollapsibleContent` for visual polish.

The fix is minimal -- just removing `overflow-hidden` from the card div className to allow the collapsible content table to render and be visible when toggled open.

## Technical Details

- Line 217: Change `"bg-card rounded-xl border border-border overflow-hidden border-l-4 animate-fade-in"` to `"bg-card rounded-xl border border-border border-l-4 animate-fade-in"`
- This single class removal should resolve the visibility issue since Radix Collapsible animates height from 0 and `overflow-hidden` on the parent clips the expanding content

