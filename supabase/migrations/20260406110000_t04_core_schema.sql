create type public.platform_role as enum ('member', 'admin');
create type public.membership_role as enum ('member', 'company_admin');
create type public.membership_verification_status as enum ('pending', 'verified', 'suspended');
create type public.challenge_anonymity_mode as enum ('named', 'anonymous');
create type public.challenge_draft_status as enum ('draft', 'submitted', 'archived');
create type public.challenge_status as enum ('pending_review', 'published', 'rejected', 'archived');
create type public.solution_access_model as enum ('free', 'paid', 'contact');
create type public.solution_status as enum ('published', 'under_review', 'hidden', 'archived');
create type public.relay_thread_status as enum ('open', 'closed', 'archived');
create type public.relay_participant_role as enum ('challenge_owner', 'responder', 'admin');
create type public.ai_conversation_scope as enum ('public', 'member_private');
create type public.ai_message_role as enum ('system', 'user', 'assistant');
create type public.analytics_actor_kind as enum ('anonymous', 'authenticated', 'system');
create type public.analytics_resource_kind as enum (
  'platform',
  'challenge',
  'solution',
  'sector',
  'company_profile',
  'ai_conversation'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    first_name,
    last_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name'
    ),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return new;
end;
$$;

create function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set
    email = new.email,
    display_name = coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      public.profiles.display_name
    ),
    first_name = coalesce(
      new.raw_user_meta_data ->> 'first_name',
      public.profiles.first_name
    ),
    last_name = coalesce(
      new.raw_user_meta_data ->> 'last_name',
      public.profiles.last_name
    ),
    avatar_url = coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      public.profiles.avatar_url
    ),
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  first_name text,
  last_name text,
  avatar_url text,
  platform_role public.platform_role not null default 'member',
  locale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  website_url text,
  headquarters_label text,
  country_code text,
  city text,
  logo_path text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.company_profiles (id) on delete cascade,
  role public.membership_role not null default 'member',
  verification_status public.membership_verification_status not null default 'pending',
  is_primary boolean not null default false,
  verified_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  icon_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_membership_id uuid not null references public.memberships (id) on delete restrict,
  company_id uuid not null references public.company_profiles (id) on delete restrict,
  sector_id uuid not null references public.sectors (id) on delete restrict,
  title text not null,
  summary text not null,
  problem_statement text not null,
  desired_outcome text,
  geography_label text,
  anonymity_mode public.challenge_anonymity_mode not null default 'named',
  status public.challenge_status not null default 'pending_review',
  review_notes text,
  reviewed_by_user_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles (id) on delete set null,
  guest_session_key text,
  title text,
  access_scope public.ai_conversation_scope not null default 'public',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_conversations_identity_check check (
    owner_user_id is not null or guest_session_key is not null
  )
);

create table public.challenge_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_membership_id uuid not null references public.memberships (id) on delete cascade,
  sector_id uuid references public.sectors (id) on delete set null,
  source_conversation_id uuid references public.ai_conversations (id) on delete set null,
  submitted_challenge_id uuid unique references public.challenges (id) on delete set null,
  title text,
  summary text,
  problem_statement text,
  desired_outcome text,
  geography_label text,
  anonymity_mode public.challenge_anonymity_mode not null default 'named',
  status public.challenge_draft_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.solutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_membership_id uuid not null references public.memberships (id) on delete restrict,
  company_id uuid not null references public.company_profiles (id) on delete restrict,
  sector_id uuid not null references public.sectors (id) on delete restrict,
  title text not null,
  summary text not null,
  offering_description text not null,
  coverage_label text,
  access_model public.solution_access_model not null default 'contact',
  status public.solution_status not null default 'published',
  review_notes text,
  reviewed_by_user_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.challenge_solution_links (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  solution_id uuid not null references public.solutions (id) on delete cascade,
  linked_by_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (challenge_id, solution_id)
);

create table public.relay_threads (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  challenge_owner_membership_id uuid not null references public.memberships (id) on delete cascade,
  responder_membership_id uuid not null references public.memberships (id) on delete cascade,
  solution_id uuid references public.solutions (id) on delete set null,
  status public.relay_thread_status not null default 'open',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, responder_membership_id)
);

create table public.relay_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.relay_threads (id) on delete cascade,
  sender_user_id uuid not null references public.profiles (id) on delete cascade,
  sender_membership_id uuid references public.memberships (id) on delete set null,
  sender_role public.relay_participant_role not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  solution_id uuid not null references public.solutions (id) on delete cascade,
  voter_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (solution_id, voter_user_id)
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role public.ai_message_role not null,
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_messages_citations_array check (jsonb_typeof(citations) = 'array')
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  actor_kind public.analytics_actor_kind not null,
  actor_user_id uuid references public.profiles (id) on delete set null,
  company_id uuid references public.company_profiles (id) on delete set null,
  resource_kind public.analytics_resource_kind not null default 'platform',
  resource_id uuid,
  event_name text not null,
  route text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint analytics_events_payload_object check (jsonb_typeof(payload) = 'object')
);

insert into public.profiles (
  id,
  email,
  display_name,
  first_name,
  last_name,
  avatar_url
)
select
  id,
  email,
  coalesce(
    raw_user_meta_data ->> 'display_name',
    raw_user_meta_data ->> 'full_name'
  ),
  raw_user_meta_data ->> 'first_name',
  raw_user_meta_data ->> 'last_name',
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  avatar_url = excluded.avatar_url,
  updated_at = now();

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

create trigger company_profiles_set_updated_at
before update on public.company_profiles
for each row
execute procedure public.set_updated_at();

create trigger memberships_set_updated_at
before update on public.memberships
for each row
execute procedure public.set_updated_at();

create trigger sectors_set_updated_at
before update on public.sectors
for each row
execute procedure public.set_updated_at();

create trigger challenges_set_updated_at
before update on public.challenges
for each row
execute procedure public.set_updated_at();

create trigger ai_conversations_set_updated_at
before update on public.ai_conversations
for each row
execute procedure public.set_updated_at();

create trigger challenge_drafts_set_updated_at
before update on public.challenge_drafts
for each row
execute procedure public.set_updated_at();

create trigger solutions_set_updated_at
before update on public.solutions
for each row
execute procedure public.set_updated_at();

create trigger relay_threads_set_updated_at
before update on public.relay_threads
for each row
execute procedure public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

create trigger on_auth_user_updated
after update on auth.users
for each row
execute procedure public.handle_auth_user_updated();

create index memberships_user_verification_idx
  on public.memberships (user_id, verification_status);

create index memberships_company_verification_idx
  on public.memberships (company_id, verification_status);

create index sectors_display_order_idx
  on public.sectors (display_order);

create index challenges_status_idx
  on public.challenges (status);

create index challenges_sector_idx
  on public.challenges (sector_id);

create index challenges_company_idx
  on public.challenges (company_id);

create index challenge_drafts_owner_status_idx
  on public.challenge_drafts (owner_membership_id, status);

create index solutions_status_idx
  on public.solutions (status);

create index solutions_sector_idx
  on public.solutions (sector_id);

create index solutions_company_idx
  on public.solutions (company_id);

create index challenge_solution_links_solution_idx
  on public.challenge_solution_links (solution_id);

create index relay_threads_owner_status_idx
  on public.relay_threads (challenge_owner_membership_id, status);

create index relay_threads_responder_status_idx
  on public.relay_threads (responder_membership_id, status);

create index relay_messages_thread_created_idx
  on public.relay_messages (thread_id, created_at);

create index votes_voter_idx
  on public.votes (voter_user_id);

create index ai_conversations_owner_updated_idx
  on public.ai_conversations (owner_user_id, updated_at);

create index ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at);

create index analytics_events_occurred_idx
  on public.analytics_events (occurred_at);

create index analytics_events_resource_occurred_idx
  on public.analytics_events (resource_kind, occurred_at);
