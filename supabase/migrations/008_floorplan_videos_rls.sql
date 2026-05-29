alter table public.floorplan_videos enable row level security;

drop policy if exists "Service role full access floorplan_videos" on public.floorplan_videos;
create policy "Service role full access floorplan_videos"
  on public.floorplan_videos
  for all
  using (auth.jwt()->>'role' = 'service_role')
  with check (auth.jwt()->>'role' = 'service_role');
