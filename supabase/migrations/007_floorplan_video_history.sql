create table if not exists public.floorplan_videos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  video_url text not null,
  from_room_he text,
  to_room_he text,
  prompt text,
  created_at timestamptz not null default now()
);

create index if not exists floorplan_videos_user_created_idx
  on public.floorplan_videos (user_id, created_at desc);
