-- Run this in Supabase SQL Editor to create the required table and storage

-- Posts table
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  images text[] default '{}',
  videos text[] default '{}',
  tags text[] default '{}',
  is_new boolean default false,
  price text default '',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table posts enable row level security;

-- Allow public read access
create policy "Public read access" on posts
  for select using (true);

-- Allow all operations (protected by API auth cookie)
create policy "Full access for authenticated" on posts
  for all using (true);

-- Storage bucket for images
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict do nothing;

-- Allow public read access to images
create policy "Public image access" on storage.objects
  for select using (bucket_id = 'images');

-- Allow uploads (protected by API auth cookie)
create policy "Allow uploads" on storage.objects
  for insert with check (bucket_id = 'images');

-- Allow deletes
create policy "Allow deletes" on storage.objects
  for delete using (bucket_id = 'images');
