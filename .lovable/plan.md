

## Cross-Department Ticket Visibility

### Problem
Currently, tickets are stored with a single `department` value and only shown in that department's Tickets tab. The user wants certain ticket types (created from Website) to also appear in other departments' Tickets tabs.

### Ticket Type → Department Visibility Map

| Ticket Type | Visible In |
|---|---|
| Time Changes | Website, SEO, Google Ads, Social Media |
| Pop-up Offers | Website, Social Media |
| Third Party Integrations | Website |
| Payment Options | Website |
| Add/Remove Team Members | Website (+ Social Media if "Promote on Social Media" checked) |
| New Forms | Website |
| Price List Updates | Website, Social Media |
| Emergency | Website |
| Others | Website |

### Approach

**Option A — Client-side filtering (recommended)**: Define the visibility map as a shared constant. When fetching tickets in `TicketsTab`, instead of filtering by `department = X`, query tickets whose `ticket_type` maps to the current department. No database changes needed.

**Option B — Database `visible_departments` column**: Add an array column to `department_tickets` that stores which departments should see the ticket. This requires a migration + updating insert logic.

### Implementation (Option A)

**1. Create shared constant** `src/lib/ticket-department-map.ts`
- Export a `TICKET_VISIBILITY` map: `Record<string, string[]>` mapping each ticket type to its visible departments
- Export a helper `getVisibleTicketTypes(department: string): string[]` that returns all ticket types visible to a given department

**2. Update `TicketsTab.tsx` query logic**
- Import `getVisibleTicketTypes`
- Instead of `.eq("department", department)`, use `.in("ticket_type", getVisibleTicketTypes(department))`
- Also keep `.eq("department", department)` as a fallback for ticket types from other departments (SEO's own "Backlinking" tickets, etc.)
- Final query: fetch tickets where `department = current` OR `ticket_type IN visibleTypes`

**3. Handle "Add/Remove Team Members" special case**
- When "Promote on Social Media" is checked, the description already includes `Promote on Social Media: Yes`
- The query for `social_media` department will check: if ticket_type is "Add/Remove Team Members", only show it if description contains "Promote on Social Media: Yes"
- This is handled in client-side post-filtering after the query

**4. Update `TicketsTab` query to fetch cross-department tickets**
- The query needs to fetch from `department_tickets` without strict department filtering for mapped types
- Use an OR filter: tickets where `department = currentDept` OR (`ticket_type` is in the cross-visible list AND `clinic_id` matches)

### Technical Details

The visibility map constant:
```typescript
export const TICKET_VISIBILITY: Record<string, string[]> = {
  "Time Changes": ["website", "seo", "google_ads", "social_media"],
  "Pop-up Offers": ["website", "social_media"],
  "Third Party Integrations": ["website"],
  "Payment Options": ["website"],
  "Add/Remove Team Members": ["website"], // social_media conditional
  "New Forms": ["website"],
  "Price List Updates": ["website", "social_media"],
  "Emergency": ["website"],
  "Others": ["website"],
};
```

The TicketsTab query will use Supabase's `.or()` filter to combine:
- `department.eq.{currentDept}` (native tickets for this department)
- `ticket_type.in.(types that map to this department)` (cross-department visibility)

Then client-side post-filter handles the "Add/Remove Team Members" + social media conditional.

### Files Changed
- **New**: `src/lib/ticket-department-map.ts` — visibility map and helper
- **Edit**: `src/components/department/TicketsTab.tsx` — updated query logic

