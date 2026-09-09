create table public.meal_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  external_id text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  unique(user_id, external_id)
);

create index meal_events_user_starts_idx on public.meal_events(user_id, starts_at);
alter table public.meal_events enable row level security;
create policy "users own meal events" on public.meal_events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
