create function public.request_company_membership(
  company_name text,
  company_slug text,
  website_url text default null,
  headquarters_label text default null,
  country_code text default null,
  city text default null,
  company_description text default null
)
returns table (
  company_id uuid,
  membership_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_company_id uuid;
  inserted_membership_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required to request company access.';
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    first_name,
    last_name,
    avatar_url
  )
  select
    users.id,
    users.email,
    coalesce(
      users.raw_user_meta_data ->> 'display_name',
      users.raw_user_meta_data ->> 'full_name'
    ),
    users.raw_user_meta_data ->> 'first_name',
    users.raw_user_meta_data ->> 'last_name',
    users.raw_user_meta_data ->> 'avatar_url'
  from auth.users as users
  where users.id = current_user_id
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  if exists(
    select 1
    from public.memberships
    where user_id = current_user_id
      and suspended_at is null
  ) then
    raise exception 'This account already has a company membership linked.';
  end if;

  insert into public.company_profiles (
    slug,
    name,
    description,
    website_url,
    headquarters_label,
    country_code,
    city,
    is_public
  )
  values (
    company_slug,
    company_name,
    nullif(company_description, ''),
    nullif(website_url, ''),
    nullif(headquarters_label, ''),
    nullif(country_code, ''),
    nullif(city, ''),
    false
  )
  returning id into inserted_company_id;

  insert into public.memberships (
    user_id,
    company_id,
    role,
    verification_status,
    is_primary
  )
  values (
    current_user_id,
    inserted_company_id,
    'company_admin',
    'pending',
    true
  )
  returning id into inserted_membership_id;

  return query
  select inserted_company_id, inserted_membership_id;
end;
$$;

revoke all on function public.request_company_membership(text, text, text, text, text, text, text) from public;
revoke all on function public.request_company_membership(text, text, text, text, text, text, text) from anon;
grant execute on function public.request_company_membership(text, text, text, text, text, text, text) to authenticated;
grant execute on function public.request_company_membership(text, text, text, text, text, text, text) to service_role;
