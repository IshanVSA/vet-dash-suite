
-- Create enums
create type public.ticket_status as enum ('open', 'in_progress', 'completed', 'emergency');
create type public.ticket_priority as enum ('regular', 'urgent', 'emergency');
create type public.department_type as enum ('website', 'seo', 'google_ads', 'social_media');

-- Create table
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

-- RLS policies
create policy "Admins full access on tickets" on public.department_tickets for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Concierges can view tickets" on public.department_tickets for select to authenticated
  using (public.has_role(auth.uid(), 'concierge'));

create policy "Concierges can insert tickets" on public.department_tickets for insert to authenticated
  with check (public.has_role(auth.uid(), 'concierge'));

create policy "Concierges can update tickets" on public.department_tickets for update to authenticated
  using (public.has_role(auth.uid(), 'concierge'));

create policy "Clients can view own tickets" on public.department_tickets for select to authenticated
  using (public.has_role(auth.uid(), 'client') and created_by = auth.uid());

create policy "Clients can insert own tickets" on public.department_tickets for insert to authenticated
  with check (public.has_role(auth.uid(), 'client') and created_by = auth.uid());

-- Trigger for updated_at
create trigger update_department_tickets_updated_at
  before update on public.department_tickets
  for each row execute function public.update_updated_at_column();
