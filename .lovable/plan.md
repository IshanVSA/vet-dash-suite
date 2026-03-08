

## Plan: Add Ticketing System to All Departments

### What We're Building
A full ticketing system where users can create tickets scoped to a department (Website, SEO, Google Ads, Social Media). Each department's "Tickets" tab shows a list of tickets with filtering by status (Open, In Progress, Completed, Emergency). A "New Ticket" dialog (matching the uploaded reference images) allows creating tickets with title, type (department-specific services list), priority, description, attachments area, and notes.

### Database Changes

**1. Create `department_tickets` table:**

```sql
create type public.ticket_status as enum ('open', 'in_progress', 'completed', 'emergency');
create type public.ticket_priority as enum ('regular', 'urgent', 'emergency');
create type public.department_type as enum ('website', 'seo', 'google_ads', 'social_media');

create table public.department_tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department department_type not null,
  ticket_type text not null,
  priority ticket_priority not null default 'regular',
  status ticket_status not null default 'open',
  description text,
  notes text,
  clinic_id uuid references public.clinics(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.department_tickets enable row level security;

-- RLS: Admins full access, concierges can create/view/update, clients can create and view own
create policy "Admins full access on tickets" on public.department_tickets for all to authenticated
  using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

create policy "Concierges can view tickets" on public.department_tickets for select to authenticated
  using (has_role(auth.uid(), 'concierge'));

create policy "Concierges can insert tickets" on public.department_tickets for insert to authenticated
  with check (has_role(auth.uid(), 'concierge'));

create policy "Concierges can update tickets" on public.department_tickets for update to authenticated
  using (has_role(auth.uid(), 'concierge'));

create policy "Clients can view own tickets" on public.department_tickets for select to authenticated
  using (has_role(auth.uid(), 'client') and created_by = auth.uid());

create policy "Clients can insert tickets" on public.department_tickets for insert to authenticated
  with check (has_role(auth.uid(), 'client') and created_by = auth.uid());

-- Trigger for updated_at
create trigger update_department_tickets_updated_at
  before update on public.department_tickets
  for each row execute function update_updated_at_column();
```

### New Components

**2. `src/components/department/TicketsTab.tsx`** — Main tickets tab component:
- Props: `department` (string matching enum), `services` (string[] for the Type dropdown)
- Fetches tickets from `department_tickets` filtered by department
- Status filter tabs/chips: All, Open, In Progress, Completed, Emergency
- Ticket list as cards showing title, type, priority badge, status badge, created date, clinic name
- "New Ticket" button opens the creation dialog
- Admins/concierges see all tickets; clients see only their own (enforced by RLS)

**3. `src/components/department/NewTicketDialog.tsx`** — Dialog matching the reference images:
- Fields: Title, Type (select from department services), Priority (Regular 24-48hrs / Urgent / Emergency), Description (textarea), Attachments (placeholder drop zone — no storage bucket yet, shown but disabled), Notes
- On submit: inserts into `department_tickets` with the current user as `created_by`
- Styled to match the dark dialog from the reference images

**4. `src/components/department/TicketCard.tsx`** — Individual ticket display card:
- Shows title, type, priority, status, created time (relative), assigned user
- Status badge with color coding (blue=Open, amber=In Progress, green=Completed, red=Emergency)
- Click to expand or view details (simple expand for now)

### Integration into Department Pages

**5. Replace `<ComingSoonTab label="Tickets" />` in all 4 department pages:**
- `WebsiteDepartment.tsx` → `<TicketsTab department="website" services={services} />`
- `SeoDepartment.tsx` → `<TicketsTab department="seo" services={services} />`
- `GoogleAdsDepartment.tsx` → `<TicketsTab department="google_ads" services={services} />`
- `SocialMedia.tsx` → Add a Tickets tab with `<TicketsTab department="social_media" services={[...]} />`

**6. Update `DepartmentOverview` ticket summary** to pull real counts from the `department_tickets` table per department, replacing the hardcoded zeros.

### Files Summary

| Action | File |
|--------|------|
| Create | `src/components/department/TicketsTab.tsx` |
| Create | `src/components/department/NewTicketDialog.tsx` |
| Create | `src/components/department/TicketCard.tsx` |
| Modify | `src/pages/WebsiteDepartment.tsx` — swap ComingSoonTab for TicketsTab |
| Modify | `src/pages/SeoDepartment.tsx` — swap ComingSoonTab for TicketsTab |
| Modify | `src/pages/GoogleAdsDepartment.tsx` — swap ComingSoonTab for TicketsTab |
| Modify | `src/pages/SocialMedia.tsx` — add Tickets tab |
| Modify | `src/components/department/DepartmentOverview.tsx` — fetch live ticket counts |
| Migration | Create `department_tickets` table with enums, RLS, and trigger |

