-- Run this in your Supabase SQL editor

create table follows (
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (follower_id, following_id)
);

alter table follows enable row level security;

create policy "Anyone can see follows" on follows for select using (true);
create policy "Users can follow others" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on follows for delete using (auth.uid() = follower_id);
