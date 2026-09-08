create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);

create table public.calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color text not null check (color in ('lilac', 'blue', 'pink', 'green', 'orange')),
  ics_url text not null check (ics_url like 'http%'),
  source text not null default 'custom',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  external_id text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  raw_data jsonb not null default '{}'::jsonb,
  unique(calendar_id, external_id)
);

create table public.weather_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  city text,
  latitude numeric(8,5),
  longitude numeric(8,5),
  constraint weather_location check (city is not null or (latitude is not null and longitude is not null))
);

create table public.meal_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  ics_url text not null check (ics_url like 'http%'),
  updated_at timestamptz not null default now()
);

create table public.meal_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique(user_id, meal_name)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  author text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index calendar_events_starts_at_idx on public.calendar_events(starts_at);
create index calendars_user_active_idx on public.calendars(user_id, active);
create index messages_user_created_idx on public.messages(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.calendars enable row level security;
alter table public.calendar_events enable row level security;
alter table public.weather_settings enable row level security;
alter table public.meal_settings enable row level security;
alter table public.meal_images enable row level security;
alter table public.messages enable row level security;

create policy "users own profile" on public.users for all using (id = auth.uid()) with check (id = auth.uid());
create policy "users own calendars" on public.calendars for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own events" on public.calendar_events for all using (calendar_id in (select id from public.calendars where user_id = auth.uid())) with check (calendar_id in (select id from public.calendars where user_id = auth.uid()));
create policy "users own weather" on public.weather_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own meals" on public.meal_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own images" on public.meal_images for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own messages" on public.messages for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('meal-images', 'meal-images', true) on conflict (id) do nothing;
create policy "users can read meal images" on storage.objects for select using (bucket_id = 'meal-images');
create policy "users own meal image writes" on storage.objects for insert with check (bucket_id = 'meal-images' and auth.uid()::text = (storage.foldername(name))[1]);
