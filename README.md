# BEAR Guild War Admin

Main admin/team planner website for BEAR Guild War.

## Changes in this version

- Adds **Scrim** as a separate top-level tab in the admin planner.
- Scrim is treated as one event only.
- Saturday and Sunday keep League Game / Game 1 / Game 2 / Game 3 / Game 4.
- Reads and writes `scrim_games` from Supabase.

## Deploy

Use this folder as the Vercel project root.

Environment variables needed:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase SQL

Run this once if you have not already:

```sql
alter table registrations add column if not exists scrim_games text[] default '{}';
```
