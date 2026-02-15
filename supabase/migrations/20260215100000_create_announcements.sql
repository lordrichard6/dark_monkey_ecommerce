create table public.announcements (
  id uuid not null default gen_random_uuid (),
  text text not null,
  url text null,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint announcements_pkey primary key (id)
);

-- RLS
alter table public.announcements enable row level security;

create policy "Announcements are viewable by everyone" on public.announcements for select using (true);
create policy "Announcements are editable by admins" on public.announcements for all using (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
    and user_profiles.is_admin = true
  )
);
