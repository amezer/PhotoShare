-- Run this in your Supabase SQL editor

create table likes (
  user_id uuid references profiles(id) on delete cascade not null,
  photo_id uuid references photos(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (user_id, photo_id)
);

alter table likes enable row level security;

create policy "Anyone can see likes" on likes for select using (true);
create policy "Users can like posts" on likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts" on likes for delete using (auth.uid() = user_id);
