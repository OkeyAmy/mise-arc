create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  sentiment text,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security so anonymous inserts succeed
alter table public.feedback enable row level security;

-- Allow anonymous inserts (no user context required)
create policy "Public insert feedback" on public.feedback
  for insert with check (true);

-- Allow users to view their own feedback
create policy "Users can view their own feedback" on public.feedback
  for select using (auth.uid() = user_id);

-- Allow admins to view all feedback (requires admin role setup)
create policy "Admins can view all feedback" on public.feedback
  for all using (auth.uid() in (
    select auth.uid() from auth.users
    where auth.uid() = '00000000-0000-0000-0000-000000000000'
    -- Replace with actual admin check when available
  )); 