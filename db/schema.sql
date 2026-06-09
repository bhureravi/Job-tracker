create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  core_skills text,
  target_roles text,
  summary text,
  phone_number text,
  notification_channel text not null default 'in_app',
  notifications_enabled boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  role_title text not null,
  location text,
  status text not null default 'Applied',
  application_date date,
  deadline date,
  job_link text,
  notes text,
  resume_version text,
  jd_text text,
  follow_up_date date,
  company_website text,
  referral_name text,
  interview_date date,
  next_follow_up_date date,
  prep_status text not null default 'Not Started',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  round_name text not null,
  interview_date date,
  notes text,
  outcome text,
  questions_asked text,
  prep_notes text,
  interviewer_name text,
  interview_link text,
  round_status text not null default 'Upcoming',
  created_at timestamptz default now()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references applications(id) on delete cascade,
  title text not null default 'Reminder',
  message text,
  reminder_type text not null,
  reminder_time timestamptz not null,
  channel text not null default 'in_app',
  is_sent boolean not null default false,
  sent_at timestamptz,
  delivery_status text not null default 'pending',
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references applications(id) on delete cascade,
  tag_name text not null,
  created_at timestamptz default now()
);