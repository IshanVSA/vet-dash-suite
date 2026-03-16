

# Custom Quick Action Forms for Website Department

## Overview
Replace the generic ticket dialog with service-specific forms when a quick action is clicked. Each form collects structured data tailored to that service type, then stores it as a formatted description in the existing `department_tickets` table (no schema changes needed).

## Custom Form Designs

| Quick Action | Custom Fields |
|---|---|
| **Time Changes** | 7-day grid: each day has a toggle (open/closed) + open time + close time inputs |
| **Pop-up Offers** | Offer title, offer description/text, start date, end date, target page (dropdown or text), image upload |
| **Theme Updates** | Description of changes, color preferences (text), reference image uploads |
| **Add/Remove Team Members** | Action toggle (Add/Remove), member name, member role/title, member email, member phone, photo upload |
| **New Forms** | Form purpose/name, list of fields needed (textarea), where to place it on the site (text), any special requirements |
| **Price List Updates** | Description of changes, file upload for updated price list (PDF/Excel/image) |
| **Others** | Falls back to the existing generic form (title + description + attachments) |

All forms also retain: **Priority selector** and **Notes field**.

## Technical Approach

### No Database Changes
- Store structured form data as a formatted string in the existing `description` column
- Each form serializes its fields into a readable text block (e.g., "Monday: 9:00 AM - 5:00 PM, Tuesday: Closed...")
- Attachments still use the existing `attachments` array + storage bucket

### New Files
1. **`src/components/department/ticket-forms/TimeChangesForm.tsx`** — Day-of-week grid with time pickers
2. **`src/components/department/ticket-forms/PopupOffersForm.tsx`** — Offer details + date range
3. **`src/components/department/ticket-forms/ThemeUpdatesForm.tsx`** — Description + image references
4. **`src/components/department/ticket-forms/AddRemoveTeamForm.tsx`** — Add/remove toggle + member details
5. **`src/components/department/ticket-forms/NewFormsForm.tsx`** — Form purpose + field descriptions
6. **`src/components/department/ticket-forms/PriceListForm.tsx`** — Description + file upload

### Modified Files
1. **`src/components/department/NewTicketDialog.tsx`** — When `defaultType` matches a known service, render the corresponding custom form component instead of the generic description textarea. The dialog shell (title, priority, notes, attachments, submit button) remains the same — only the middle "details" section swaps based on type. Each custom form exposes its data via a callback, which gets serialized into the `description` field on submit.

2. **`src/components/department/DepartmentOverview.tsx`** — No changes needed (already passes `defaultType` to `NewTicketDialog`).

### Form Data Flow
```text
User clicks "Time Changes" badge
  → NewTicketDialog opens with defaultType="Time Changes"
  → Renders <TimeChangesForm onChange={setFormData} />
  → On submit: description = serializeTimeChanges(formData)
  → Insert into department_tickets as usual
```

### Auto-generated Title
For custom forms, the title will be auto-generated from the service type (e.g., "Time Changes Request") so the user doesn't need to type one — though they can still edit it.

