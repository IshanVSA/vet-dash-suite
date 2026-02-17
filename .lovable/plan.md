

## Redesign: Clean Up Content Requests Layout

### Problem
The current layout nests a 2-column post grid inside a 2-column version grid, creating a wall of small, cluttered boxes. Even with collapse/expand, 12+ collapsed post cards are overwhelming. Too many tiny badges and labels add visual noise.

### Design Changes

**1. ContentPostCard -- Minimal collapsed state, cleaner expanded view**
- Collapsed: single-line row with post number, week badge, and truncated caption -- no border/card styling, just a subtle row with a divider
- Expanded: slide-down content with more whitespace, softer section labels
- Remove the floating `#N` badge (overlaps and looks busy); use inline numbering instead

**2. ContentVersionCard -- Accordion-style post list instead of grid**
- Switch posts from a 2-column grid to a single-column list (posts are text-heavy; single column reads better)
- Remove the `max-h-[600px] overflow-y-auto` scroll container (confusing scroll-within-scroll)
- Show only a summary line when all posts are collapsed: "12 posts -- Week 1-4" with expand/collapse toggle
- More padding and spacing between sections

**3. ContentRequestCard -- Wider breathing room**
- Change version cards from `xl:grid-cols-2` to full-width stacked layout (versions are already large; side-by-side makes them cramped)
- Add more vertical spacing between elements
- Simplify the badge row in the header (fewer inline badges)

**4. ContentRequests page -- Minor spacing tweaks**
- Increase gap between request cards from `space-y-5` to `space-y-8`

### Technical Details

**Files to modify:**

**`src/components/content-requests/ContentPostCard.tsx`**
- Replace bordered card with a clean list-item row
- Collapsed: `div` with flex row -- `#1 | W1 | Caption preview...` with chevron
- Expanded: indented content block below, no card border
- Add subtle `border-b border-border/30` divider between posts instead of card borders

**`src/components/content-requests/ContentVersionCard.tsx`**
- `MultiPostBlock`: change grid to `flex flex-col divide-y divide-border/30`
- Remove `max-h-[600px] overflow-y-auto pr-1`
- Add a collapsible wrapper: by default show first 3 posts, with "Show all 12 posts" button
- Remove `sm:grid-cols-2` from the post container

**`src/components/content-requests/ContentRequestCard.tsx`**
- Change `grid grid-cols-1 xl:grid-cols-2 gap-4` to `space-y-4` (single column for versions)
- Increase `CardHeader` padding slightly
- Simplify: move goal/tone badges to a second line only if they exist

**`src/pages/ContentRequests.tsx`**
- Change `space-y-5` to `space-y-8` for the request list

