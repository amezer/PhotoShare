-- Run this in your Supabase SQL editor

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now()
);

-- Photos
create table photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  image_url text not null,
  caption text,
  created_at timestamp with time zone default now()
);

-- Comments (parent_id null = top-level, non-null = reply)
create table comments (
  id uuid default gen_random_uuid() primary key,
  photo_id uuid references photos(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  parent_id uuid references comments(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone default now()
);

-- Storage bucket for photos
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

-- Row Level Security

alter table profiles enable row level security;
alter table photos enable row level security;
alter table comments enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- Photos: anyone can read, only owner can insert/delete
create policy "Photos are viewable by everyone" on photos for select using (true);
create policy "Users can upload their own photos" on photos for insert with check (auth.uid() = user_id);
create policy "Users can delete their own photos" on photos for delete using (auth.uid() = user_id);

-- Comments: anyone can read, authenticated users can insert, owner can delete
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Authenticated users can comment" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on comments for delete using (auth.uid() = user_id);

-- Storage policy: anyone can read photos, authenticated users can upload
create policy "Photos are publicly accessible" on storage.objects for select using (bucket_id = 'photos');
create policy "Authenticated users can upload photos" on storage.objects for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
