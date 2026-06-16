create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  discord_name text,
  role text not null default 'DPS',
  weapon_1 text,
  weapon_2 text,
  notes text,
  saturday_games text[] default '{}',
  sunday_games text[] default '{}',
  assigned_day text default '',
  assigned_game text default '',
  assigned_team text default '',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table registrations add column if not exists discord_name text;
alter table registrations add column if not exists weapon_1 text;
alter table registrations add column if not exists weapon_2 text;
alter table registrations add column if not exists saturday_games text[] default '{}';
alter table registrations add column if not exists sunday_games text[] default '{}';
alter table registrations add column if not exists assigned_day text default '';
alter table registrations add column if not exists assigned_game text default '';
alter table registrations add column if not exists assigned_team text default '';
alter table registrations add column if not exists sort_order integer default 0;
alter table registrations add column if not exists updated_at timestamptz default now();

create table if not exists guild_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  updated_at timestamptz default now()
);

insert into guild_settings (setting_key, setting_value)
values (
  'teams_by_day',
  '{"Saturday":["Offense 1","Offense 2","Offense 3","Defense A","Defense B","Defense C"],"Sunday":["Offense 1","Offense 2","Offense 3","Defense A","Defense B","Defense C"]}'::jsonb
)
on conflict (setting_key) do nothing;

alter table registrations enable row level security;
alter table guild_settings enable row level security;

drop policy if exists "Anyone can view registrations" on registrations;
drop policy if exists "Anyone can submit registration" on registrations;
drop policy if exists "Anyone can update registrations for now" on registrations;
drop policy if exists "Anyone can delete registrations for now" on registrations;

create policy "Anyone can view registrations"
on registrations for select to anon using (true);

create policy "Anyone can submit registration"
on registrations for insert to anon with check (true);

create policy "Anyone can update registrations for now"
on registrations for update to anon using (true) with check (true);

create policy "Anyone can delete registrations for now"
on registrations for delete to anon using (true);

drop policy if exists "Anyone can view settings" on guild_settings;
drop policy if exists "Anyone can insert settings" on guild_settings;
drop policy if exists "Anyone can update settings" on guild_settings;

create policy "Anyone can view settings"
on guild_settings for select to anon using (true);

create policy "Anyone can insert settings"
on guild_settings for insert to anon with check (true);

create policy "Anyone can update settings"
on guild_settings for update to anon using (true) with check (true);
