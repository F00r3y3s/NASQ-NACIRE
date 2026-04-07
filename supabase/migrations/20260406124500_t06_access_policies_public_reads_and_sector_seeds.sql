create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.profiles
    where id = auth.uid()
      and platform_role = 'admin'
  );
$$;

create function public.is_membership_owner(target_membership_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.memberships
    where id = target_membership_id
      and user_id = auth.uid()
  );
$$;

create function public.is_verified_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists(
      select 1
      from public.memberships
      where user_id = auth.uid()
        and verification_status = 'verified'
        and suspended_at is null
    );
$$;

create function public.is_verified_membership_owner(target_membership_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists(
      select 1
      from public.memberships
      where id = target_membership_id
        and user_id = auth.uid()
        and verification_status = 'verified'
        and suspended_at is null
    );
$$;

create function public.membership_belongs_to_company(
  target_membership_id uuid,
  target_company_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.memberships
    where id = target_membership_id
      and company_id = target_company_id
  );
$$;

create function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists(
      select 1
      from public.memberships
      where company_id = target_company_id
        and user_id = auth.uid()
        and suspended_at is null
    );
$$;

create function public.is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists(
      select 1
      from public.memberships
      where company_id = target_company_id
        and user_id = auth.uid()
        and role = 'company_admin'
        and verification_status = 'verified'
        and suspended_at is null
    );
$$;

create function public.is_challenge_owner(target_challenge_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists(
      select 1
      from public.challenges
      join public.memberships
        on memberships.id = challenges.owner_membership_id
      where challenges.id = target_challenge_id
        and memberships.user_id = auth.uid()
    );
$$;

create function public.is_solution_owner(target_solution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists(
      select 1
      from public.solutions
      join public.memberships
        on memberships.id = solutions.owner_membership_id
      where solutions.id = target_solution_id
        and memberships.user_id = auth.uid()
    );
$$;

create function public.owns_ai_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists(
      select 1
      from public.ai_conversations
      where id = target_conversation_id
        and owner_user_id = auth.uid()
    );
$$;

create function public.can_access_relay_thread(target_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists(
      select 1
      from public.relay_threads
      left join public.memberships challenge_owner_membership
        on challenge_owner_membership.id = relay_threads.challenge_owner_membership_id
      left join public.memberships responder_membership
        on responder_membership.id = relay_threads.responder_membership_id
      where relay_threads.id = target_thread_id
        and (
          challenge_owner_membership.user_id = auth.uid()
          or responder_membership.user_id = auth.uid()
        )
    );
$$;

alter table public.profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.sectors enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_drafts enable row level security;
alter table public.solutions enable row level security;
alter table public.challenge_solution_links enable row level security;
alter table public.relay_threads enable row level security;
alter table public.relay_messages enable row level security;
alter table public.votes enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.analytics_events enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
)
with check (
  id = auth.uid()
  or public.is_admin()
);

create policy "company_profiles_select_member_or_admin"
on public.company_profiles
for select
to authenticated
using (
  public.is_company_member(id)
  or public.is_company_admin(id)
);

create policy "company_profiles_update_company_admin_or_admin"
on public.company_profiles
for update
to authenticated
using (
  public.is_company_admin(id)
)
with check (
  public.is_company_admin(id)
);

create policy "company_profiles_insert_admin_only"
on public.company_profiles
for insert
to authenticated
with check (
  public.is_admin()
);

create policy "company_profiles_delete_admin_only"
on public.company_profiles
for delete
to authenticated
using (
  public.is_admin()
);

create policy "memberships_select_self_or_admin"
on public.memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);

create policy "memberships_insert_admin_only"
on public.memberships
for insert
to authenticated
with check (
  public.is_admin()
);

create policy "memberships_update_admin_only"
on public.memberships
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

create policy "memberships_delete_admin_only"
on public.memberships
for delete
to authenticated
using (
  public.is_admin()
);

create policy "sectors_select_signed_in_or_admin"
on public.sectors
for select
to authenticated
using (
  is_visible
  or public.is_admin()
);

create policy "sectors_insert_admin_only"
on public.sectors
for insert
to authenticated
with check (
  public.is_admin()
);

create policy "sectors_update_admin_only"
on public.sectors
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

create policy "sectors_delete_admin_only"
on public.sectors
for delete
to authenticated
using (
  public.is_admin()
);

create policy "challenges_select_owner_or_admin"
on public.challenges
for select
to authenticated
using (
  public.is_challenge_owner(id)
);

create policy "challenges_insert_verified_owner_or_admin"
on public.challenges
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_verified_membership_owner(owner_membership_id)
    and public.membership_belongs_to_company(owner_membership_id, company_id)
    and status = 'pending_review'
  )
);

create policy "challenges_update_owner_or_admin"
on public.challenges
for update
to authenticated
using (
  public.is_challenge_owner(id)
)
with check (
  public.is_admin()
  or (
    public.is_challenge_owner(id)
    and public.membership_belongs_to_company(owner_membership_id, company_id)
  )
);

create policy "challenges_delete_admin_only"
on public.challenges
for delete
to authenticated
using (
  public.is_admin()
);

create policy "challenge_drafts_select_owner_or_admin"
on public.challenge_drafts
for select
to authenticated
using (
  public.is_membership_owner(owner_membership_id)
  or public.is_admin()
);

create policy "challenge_drafts_insert_verified_owner_or_admin"
on public.challenge_drafts
for insert
to authenticated
with check (
  public.is_verified_membership_owner(owner_membership_id)
  or public.is_admin()
);

create policy "challenge_drafts_update_verified_owner_or_admin"
on public.challenge_drafts
for update
to authenticated
using (
  public.is_membership_owner(owner_membership_id)
  or public.is_admin()
)
with check (
  public.is_verified_membership_owner(owner_membership_id)
  or public.is_admin()
);

create policy "challenge_drafts_delete_owner_or_admin"
on public.challenge_drafts
for delete
to authenticated
using (
  public.is_membership_owner(owner_membership_id)
  or public.is_admin()
);

create policy "solutions_select_owner_or_admin"
on public.solutions
for select
to authenticated
using (
  public.is_solution_owner(id)
);

create policy "solutions_insert_verified_owner_or_admin"
on public.solutions
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_verified_membership_owner(owner_membership_id)
    and public.membership_belongs_to_company(owner_membership_id, company_id)
  )
);

create policy "solutions_update_owner_or_admin"
on public.solutions
for update
to authenticated
using (
  public.is_solution_owner(id)
)
with check (
  public.is_admin()
  or (
    public.is_solution_owner(id)
    and public.membership_belongs_to_company(owner_membership_id, company_id)
  )
);

create policy "solutions_delete_owner_or_admin"
on public.solutions
for delete
to authenticated
using (
  public.is_solution_owner(id)
  or public.is_admin()
);

create policy "challenge_solution_links_select_owner_or_admin"
on public.challenge_solution_links
for select
to authenticated
using (
  public.is_admin()
  or public.is_challenge_owner(challenge_id)
  or public.is_solution_owner(solution_id)
);

create policy "challenge_solution_links_insert_owner_or_admin"
on public.challenge_solution_links
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_challenge_owner(challenge_id)
  or public.is_solution_owner(solution_id)
);

create policy "challenge_solution_links_delete_owner_or_admin"
on public.challenge_solution_links
for delete
to authenticated
using (
  public.is_admin()
  or public.is_challenge_owner(challenge_id)
  or public.is_solution_owner(solution_id)
);

create policy "relay_threads_select_participants_or_admin"
on public.relay_threads
for select
to authenticated
using (
  public.can_access_relay_thread(id)
);

create policy "relay_threads_insert_verified_participants_or_admin"
on public.relay_threads
for insert
to authenticated
with check (
  public.is_admin()
  or (
    exists(
      select 1
      from public.challenges
      where challenges.id = challenge_id
        and challenges.owner_membership_id = challenge_owner_membership_id
    )
    and public.is_verified_membership_owner(responder_membership_id)
  )
);

create policy "relay_threads_update_participants_or_admin"
on public.relay_threads
for update
to authenticated
using (
  public.can_access_relay_thread(id)
)
with check (
  public.can_access_relay_thread(id)
);

create policy "relay_messages_select_participants_or_admin"
on public.relay_messages
for select
to authenticated
using (
  exists(
    select 1
    from public.relay_threads
    where relay_threads.id = thread_id
      and public.can_access_relay_thread(relay_threads.id)
  )
);

create policy "relay_messages_insert_participants_or_admin"
on public.relay_messages
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and (
    sender_membership_id is null
    or public.is_membership_owner(sender_membership_id)
  )
  and (
    public.is_admin()
    or exists(
      select 1
      from public.relay_threads
      where relay_threads.id = thread_id
        and public.can_access_relay_thread(relay_threads.id)
    )
  )
);

create policy "votes_select_owner_or_admin"
on public.votes
for select
to authenticated
using (
  voter_user_id = auth.uid()
  or public.is_admin()
);

create policy "votes_insert_self_or_admin"
on public.votes
for insert
to authenticated
with check (
  voter_user_id = auth.uid()
  or public.is_admin()
);

create policy "votes_delete_self_or_admin"
on public.votes
for delete
to authenticated
using (
  voter_user_id = auth.uid()
  or public.is_admin()
);

create policy "ai_conversations_select_owner_or_admin"
on public.ai_conversations
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.is_admin()
);

create policy "ai_conversations_insert_owner_or_admin"
on public.ai_conversations
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  or public.is_admin()
);

create policy "ai_conversations_update_owner_or_admin"
on public.ai_conversations
for update
to authenticated
using (
  owner_user_id = auth.uid()
  or public.is_admin()
)
with check (
  owner_user_id = auth.uid()
  or public.is_admin()
);

create policy "ai_conversations_delete_owner_or_admin"
on public.ai_conversations
for delete
to authenticated
using (
  owner_user_id = auth.uid()
  or public.is_admin()
);

create policy "ai_messages_select_owner_or_admin"
on public.ai_messages
for select
to authenticated
using (
  public.owns_ai_conversation(conversation_id)
);

create policy "ai_messages_insert_owner_or_admin"
on public.ai_messages
for insert
to authenticated
with check (
  public.owns_ai_conversation(conversation_id)
);

create policy "analytics_events_select_admin_only"
on public.analytics_events
for select
to authenticated
using (
  public.is_admin()
);

create policy "analytics_events_insert_anon"
on public.analytics_events
for insert
to anon
with check (
  actor_kind = 'anonymous'
  and actor_user_id is null
);

create policy "analytics_events_insert_authenticated"
on public.analytics_events
for insert
to authenticated
with check (
  (
    actor_user_id is null
    or actor_user_id = auth.uid()
  )
  and actor_kind in ('anonymous', 'authenticated')
);

insert into public.sectors (
  slug,
  name,
  description,
  display_order,
  is_visible,
  icon_key
)
values
  (
    'oil-gas',
    'Oil & Gas',
    'Exploration, production, refinery, and field-operations challenges across upstream and downstream energy systems.',
    1,
    true,
    'oil-gas'
  ),
  (
    'energy-utilities',
    'Energy & Utilities',
    'Grid resilience, water, power, and utility-service challenges affecting national infrastructure and operations.',
    2,
    true,
    'energy-utilities'
  ),
  (
    'construction-infrastructure',
    'Construction & Infrastructure',
    'Built-environment delivery, asset durability, and large-scale infrastructure coordination under demanding climate conditions.',
    3,
    true,
    'construction-infrastructure'
  ),
  (
    'healthcare',
    'Healthcare',
    'Clinical, hospital, patient-data, and care-delivery challenges across public and private health networks.',
    4,
    true,
    'healthcare'
  ),
  (
    'finance-banking',
    'Finance & Banking',
    'Banking operations, compliance, payments, risk, and customer-service innovation across regulated financial services.',
    5,
    true,
    'finance-banking'
  ),
  (
    'logistics-supply-chain',
    'Logistics & Supply Chain',
    'Transport, warehousing, customs, routing, and last-mile challenges across regional and global supply networks.',
    6,
    true,
    'logistics-supply-chain'
  ),
  (
    'manufacturing',
    'Manufacturing',
    'Factory efficiency, industrial automation, quality, maintenance, and production resilience for advanced manufacturing.',
    7,
    true,
    'manufacturing'
  ),
  (
    'technology',
    'Technology',
    'Software, platforms, cybersecurity, AI, and digital-transformation challenges that support cross-sector innovation.',
    8,
    true,
    'technology'
  ),
  (
    'tourism-hospitality',
    'Tourism & Hospitality',
    'Guest experience, destination operations, accommodation, and service-delivery challenges across travel and hospitality.',
    9,
    true,
    'tourism-hospitality'
  ),
  (
    'education',
    'Education',
    'Learning delivery, campus operations, workforce readiness, and education technology challenges across institutions.',
    10,
    true,
    'education'
  ),
  (
    'police-civil-defense',
    'Police & Civil Defense',
    'Public safety, emergency response, civil-defense readiness, and secure coordination challenges for frontline agencies.',
    11,
    true,
    'police-civil-defense'
  ),
  (
    'aviation',
    'Aviation',
    'Airport, airline, air-traffic, maintenance, and passenger-experience challenges across the aviation ecosystem.',
    12,
    true,
    'aviation'
  ),
  (
    'solar-energy',
    'Solar & Energy',
    'Solar deployment, storage, distributed generation, and clean-energy optimization challenges distinct from utility operations.',
    13,
    true,
    'solar-energy'
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  is_visible = excluded.is_visible,
  icon_key = excluded.icon_key,
  updated_at = now();

create view public.public_sectors as
select
  sectors.id,
  sectors.slug,
  sectors.name,
  sectors.description,
  sectors.display_order as display_order,
  sectors.icon_key as icon_key
from public.sectors
where sectors.is_visible = true
order by sectors.display_order asc;
grant select on public.public_sectors to anon, authenticated;

create view public.public_company_profiles as
select
  company_profiles.id,
  company_profiles.slug,
  company_profiles.name,
  company_profiles.description,
  company_profiles.website_url,
  company_profiles.headquarters_label,
  company_profiles.country_code,
  company_profiles.city,
  company_profiles.logo_path,
  count(distinct named_challenges.id) as published_challenge_count,
  count(distinct solutions.id) as published_solution_count
from public.company_profiles
left join public.challenges named_challenges
  on named_challenges.company_id = company_profiles.id
  and named_challenges.status = 'published'
  and named_challenges.anonymity_mode = 'named'
left join public.solutions
  on solutions.company_id = company_profiles.id
  and solutions.status = 'published'
where company_profiles.is_public = true
group by
  company_profiles.id,
  company_profiles.slug,
  company_profiles.name,
  company_profiles.description,
  company_profiles.website_url,
  company_profiles.headquarters_label,
  company_profiles.country_code,
  company_profiles.city,
  company_profiles.logo_path;
grant select on public.public_company_profiles to anon, authenticated;

create view public.public_challenges as
select
  challenges.id,
  challenges.slug,
  challenges.title,
  challenges.summary,
  challenges.problem_statement,
  challenges.desired_outcome,
  challenges.geography_label,
  challenges.anonymity_mode,
  challenges.status,
  challenges.published_at,
  challenges.created_at,
  challenges.updated_at,
  sectors.id as sector_id,
  sectors.slug as sector_slug,
  sectors.name as sector_name,
  sectors.icon_key as sector_icon_key,
  case when challenges.anonymity_mode = 'anonymous' then 'Anonymous' else company_profiles.name end as company_name,
  case when challenges.anonymity_mode = 'anonymous' then null else company_profiles.slug end as company_slug,
  case when challenges.anonymity_mode = 'anonymous' then null else company_profiles.logo_path end as company_logo_path,
  count(distinct linked_solutions.id) as linked_solution_count
from public.challenges
join public.sectors
  on sectors.id = challenges.sector_id
join public.company_profiles
  on company_profiles.id = challenges.company_id
left join public.challenge_solution_links
  on challenge_solution_links.challenge_id = challenges.id
left join public.solutions linked_solutions
  on linked_solutions.id = challenge_solution_links.solution_id
  and linked_solutions.status = 'published'
where challenges.status = 'published'
  and sectors.is_visible = true
  and (
    challenges.anonymity_mode = 'anonymous'
    or company_profiles.is_public = true
  )
group by
  challenges.id,
  challenges.slug,
  challenges.title,
  challenges.summary,
  challenges.problem_statement,
  challenges.desired_outcome,
  challenges.geography_label,
  challenges.anonymity_mode,
  challenges.status,
  challenges.published_at,
  challenges.created_at,
  challenges.updated_at,
  sectors.id,
  sectors.slug,
  sectors.name,
  sectors.icon_key,
  company_profiles.name,
  company_profiles.slug,
  company_profiles.logo_path;
grant select on public.public_challenges to anon, authenticated;

create view public.public_solutions as
select
  solutions.id,
  solutions.slug,
  solutions.title,
  solutions.summary,
  solutions.offering_description,
  solutions.coverage_label,
  solutions.access_model,
  solutions.status,
  solutions.published_at,
  solutions.created_at,
  solutions.updated_at,
  sectors.id as sector_id,
  sectors.slug as sector_slug,
  sectors.name as sector_name,
  company_profiles.id as company_id,
  company_profiles.slug as company_slug,
  company_profiles.name as company_name,
  company_profiles.logo_path as company_logo_path,
  count(distinct challenge_solution_links.challenge_id) as linked_challenge_count,
  count(distinct votes.id) as vote_count
from public.solutions
join public.sectors
  on sectors.id = solutions.sector_id
join public.company_profiles
  on company_profiles.id = solutions.company_id
left join public.challenge_solution_links
  on challenge_solution_links.solution_id = solutions.id
left join public.challenges published_challenges
  on published_challenges.id = challenge_solution_links.challenge_id
  and published_challenges.status = 'published'
left join public.votes
  on votes.solution_id = solutions.id
where solutions.status = 'published'
  and sectors.is_visible = true
  and company_profiles.is_public = true
group by
  solutions.id,
  solutions.slug,
  solutions.title,
  solutions.summary,
  solutions.offering_description,
  solutions.coverage_label,
  solutions.access_model,
  solutions.status,
  solutions.published_at,
  solutions.created_at,
  solutions.updated_at,
  sectors.id,
  sectors.slug,
  sectors.name,
  company_profiles.id,
  company_profiles.slug,
  company_profiles.name,
  company_profiles.logo_path;
grant select on public.public_solutions to anon, authenticated;

create view public.public_challenge_solution_links as
select
  challenge_solution_links.id,
  challenge_solution_links.challenge_id,
  challenge_solution_links.solution_id,
  challenge_solution_links.created_at
from public.challenge_solution_links
join public.public_challenges
  on public_challenges.id = challenge_solution_links.challenge_id
join public.public_solutions
  on public_solutions.id = challenge_solution_links.solution_id;
grant select on public.public_challenge_solution_links to anon, authenticated;

create view public.public_sector_activity as
select
  public_sectors.id as sector_id,
  public_sectors.slug as sector_slug,
  public_sectors.name as sector_name,
  count(distinct public_challenges.id) as published_challenge_count,
  count(distinct public_solutions.id) as published_solution_count,
  max(
    greatest(
      coalesce(public_challenges.published_at, public_challenges.created_at),
      coalesce(public_solutions.published_at, public_solutions.created_at)
    )
  ) as latest_publication_at
from public.public_sectors
left join public.public_challenges
  on public_challenges.sector_id = public_sectors.id
left join public.public_solutions
  on public_solutions.sector_id = public_sectors.id
group by
  public_sectors.id,
  public_sectors.slug,
  public_sectors.name;
grant select on public.public_sector_activity to anon, authenticated;

create view public.public_activity_signals as
select
  analytics_events.id,
  analytics_events.event_name,
  analytics_events.resource_kind,
  analytics_events.route,
  analytics_events.occurred_at,
  case
    when analytics_events.actor_kind = 'anonymous' then 'Anonymous'
    when analytics_events.actor_kind = 'authenticated' then 'Member'
    else 'Platform'
  end as actor_label,
  coalesce(
    analytics_events.payload ->> 'sector_name',
    public_challenges.sector_name,
    public_solutions.sector_name,
    public_sectors.name
  ) as sector_name,
  coalesce(
    public_challenges.title,
    public_solutions.title,
    public_company_profiles.name,
    initcap(replace(analytics_events.resource_kind::text, '_', ' '))
  ) as resource_label
from public.analytics_events
left join public.public_challenges
  on analytics_events.resource_kind = 'challenge'
  and analytics_events.resource_id = public_challenges.id
left join public.public_solutions
  on analytics_events.resource_kind = 'solution'
  and analytics_events.resource_id = public_solutions.id
left join public.public_company_profiles
  on analytics_events.resource_kind = 'company_profile'
  and analytics_events.resource_id = public_company_profiles.id
left join public.public_sectors
  on analytics_events.resource_kind = 'sector'
  and analytics_events.resource_id = public_sectors.id
where analytics_events.resource_kind in ('platform', 'challenge', 'solution', 'sector', 'company_profile')
  and analytics_events.event_name in (
    'challenge_published',
    'solution_published',
    'company_joined',
    'ai_discovery',
    'challenge_resolved'
  );
grant select on public.public_activity_signals to anon, authenticated;

create view public.public_platform_metrics as
select
  (select count(*) from public.public_sectors) as visible_sector_count,
  (select count(*) from public.public_challenges) as published_challenge_count,
  (select count(*) from public.public_solutions) as published_solution_count,
  (select count(*) from public.public_company_profiles) as public_company_count,
  (select count(*) from public.public_activity_signals) as public_signal_count,
  (select max(occurred_at) from public.public_activity_signals) as latest_activity_at;
grant select on public.public_platform_metrics to anon, authenticated;
