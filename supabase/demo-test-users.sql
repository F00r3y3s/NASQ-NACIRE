begin;

with demo_users as (
  select *
  from (
    values
      (
        '11111111-1111-4111-8111-111111111111'::uuid,
        'testadmin@nasqdemo.com'::text,
        'Test Admin'::text,
        'admin'::text
      ),
      (
        '22222222-2222-4222-8222-222222222222'::uuid,
        'testuser@nasqdemo.com'::text,
        'Test User'::text,
        'member'::text
      )
  ) as seed(id, email, display_name, platform_role)
),
upsert_auth_users as (
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  )
  select
    '00000000-0000-0000-0000-000000000000'::uuid,
    demo_users.id,
    'authenticated',
    'authenticated',
    demo_users.email,
    crypt('Demo1234', gen_salt('bf')),
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    timezone('utc', now()),
    '',
    null,
    '',
    '',
    null,
    timezone('utc', now()),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('display_name', demo_users.display_name),
    false,
    timezone('utc', now()),
    timezone('utc', now()),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false,
    null
  from demo_users
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    invited_at = excluded.invited_at,
    confirmation_sent_at = excluded.confirmation_sent_at,
    last_sign_in_at = excluded.last_sign_in_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = excluded.updated_at
  returning id, email
)
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid()::text,
  demo_users.id,
  jsonb_build_object(
    'sub',
    demo_users.id::text,
    'email',
    demo_users.email,
    'email_verified',
    true,
    'phone_verified',
    false
  ),
  'email',
  demo_users.email,
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
from demo_users
on conflict (provider, provider_id) do update
set
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = excluded.updated_at;

insert into public.profiles (
  id,
  email,
  display_name,
  platform_role
)
select
  demo_users.id,
  demo_users.email,
  demo_users.display_name,
  demo_users.platform_role::public.platform_role
from demo_users
on conflict (id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  platform_role = excluded.platform_role,
  updated_at = now();

insert into public.company_profiles (
  id,
  slug,
  name,
  description,
  website_url,
  headquarters_label,
  country_code,
  city,
  is_public
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
    'demo-admin-labs',
    'Demo Admin Labs',
    'Admin demo company profile for governance, moderation, and protected workflow testing.',
    'https://admin-demo.example',
    'Dubai, UAE',
    'AE',
    'Dubai',
    true
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
    'demo-member-works',
    'Demo Member Works',
    'Member demo company profile for challenge, solution, and account workflow testing.',
    'https://member-demo.example',
    'Abu Dhabi, UAE',
    'AE',
    'Abu Dhabi',
    true
  )
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  website_url = excluded.website_url,
  headquarters_label = excluded.headquarters_label,
  country_code = excluded.country_code,
  city = excluded.city,
  is_public = excluded.is_public,
  updated_at = now();

insert into public.memberships (
  id,
  user_id,
  company_id,
  role,
  verification_status,
  is_primary,
  verified_at
)
values
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
    'company_admin',
    'verified',
    true,
    timezone('utc', now())
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
    'member',
    'verified',
    true,
    timezone('utc', now())
  )
on conflict (id) do update
set
  role = excluded.role,
  verification_status = excluded.verification_status,
  is_primary = excluded.is_primary,
  verified_at = excluded.verified_at,
  suspended_at = null,
  updated_at = now();

commit;
