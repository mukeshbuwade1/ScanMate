-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Users table (mirrors auth.users with app metadata)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  raw_path text, -- storage path to raw PDF or raw page bundle
  processed_path text, -- storage path to processed PDF (latest)
  thumbnail_path text,
  page_count int default 0,
  size_bytes bigint,
  status text default 'idle', -- idle | processing | error | completed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Processing jobs for async tasks (compress, thumbnail, etc.)
create table if not exists public.processing_jobs (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null, -- compress_pdf | generate_thumbnail | cleanup_temp
  input_path text,
  output_path text,
  status text default 'pending', -- pending | running | completed | failed
  error text,
  payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

-- Indexes
create index if not exists idx_documents_user on public.documents(user_id);
create index if not exists idx_processing_jobs_user on public.processing_jobs(user_id);
create index if not exists idx_processing_jobs_doc on public.processing_jobs(document_id);

-- RLS
alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.processing_jobs enable row level security;

-- Policies
create policy "Users can view their profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their profile" on public.users
  for update using (auth.uid() = id);

create policy "Users see own documents" on public.documents
  for select using (auth.uid() = user_id);

create policy "Users insert documents" on public.documents
  for insert with check (auth.uid() = user_id);

create policy "Users update documents" on public.documents
  for update using (auth.uid() = user_id);

create policy "Users delete documents" on public.documents
  for delete using (auth.uid() = user_id);

create policy "Users see own jobs" on public.processing_jobs
  for select using (auth.uid() = user_id);

create policy "Users insert jobs" on public.processing_jobs
  for insert with check (auth.uid() = user_id);

create policy "Users update own jobs" on public.processing_jobs
  for update using (auth.uid() = user_id);

