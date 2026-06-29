-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Areas Table
create table public.areas (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Projects Table
create table public.projects (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id text, -- null means personal project
  name text not null,
  area_id text,
  status text default 'active' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tasks Table
create table public.tasks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id text,
  title text not null,
  notes text,
  completed boolean default false not null,
  due_date text,
  start_date text,
  priority text,
  assignee_id uuid, -- assigned team member (foreign key to auth.users)
  assignee_email text, -- cache email for display
  checklist_items jsonb default '[]'::jsonb not null,
  tags jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Workspaces (Teams) Table
create table public.workspaces (
  id text primary key,
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Workspace Members Table
create table public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id text references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null, -- invited by email
  role text default 'member' not null, -- 'owner', 'member', 'pending'
  joined_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Task Comments Table
create table public.task_comments (
  id text primary key,
  task_id text references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Row Level Security Policies (RLS)
alter table public.areas enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.task_comments enable row level security;

-- Policies for areas
create policy "Users can modify their own areas" on public.areas
  for all using (auth.uid() = user_id);

-- Policies for projects
create policy "Users can view personal or shared workspace projects" on public.projects
  for select using (
    auth.uid() = user_id or 
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
create policy "Users can insert projects" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "Users can update projects" on public.projects
  for update using (
    auth.uid() = user_id or 
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
create policy "Users can delete projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Policies for tasks
create policy "Users can view personal or shared tasks" on public.tasks
  for select using (
    auth.uid() = user_id or
    project_id in (select id from public.projects where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()))
  );
create policy "Users can insert tasks" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update tasks" on public.tasks
  for update using (
    auth.uid() = user_id or
    project_id in (select id from public.projects where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()))
  );
create policy "Users can delete tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Policies for workspaces
create policy "Members can view workspaces" on public.workspaces
  for select using (
    owner_id = auth.uid() or 
    id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
create policy "Owners can modify workspaces" on public.workspaces
  for all using (owner_id = auth.uid());

-- Policies for workspace members
create policy "Members can view workspace member lists" on public.workspace_members
  for select using (
    user_id = auth.uid() or
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
create policy "Owners can manage membership" on public.workspace_members
  for all using (
    workspace_id in (select id from public.workspaces where owner_id = auth.uid())
  );

-- Policies for comments
create policy "Members can view task comments" on public.task_comments
  for select using (
    task_id in (
      select id from public.tasks where user_id = auth.uid() or 
      project_id in (select id from public.projects where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()))
    )
  );
create policy "Members can add task comments" on public.task_comments
  for insert with check (auth.uid() = user_id);
