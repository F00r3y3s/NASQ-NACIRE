create or replace function public.can_create_relay_thread(
  target_challenge_id uuid,
  target_responder_membership_id uuid,
  target_solution_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      public.is_admin()
      and target_responder_membership_id is null
    )
    or exists(
      select 1
      from public.challenges
      join public.memberships responder_membership
        on responder_membership.id = target_responder_membership_id
      where challenges.id = target_challenge_id
        and challenges.status = 'published'
        and challenges.anonymity_mode = 'anonymous'
        and challenges.owner_membership_id <> target_responder_membership_id
        and responder_membership.user_id = (select auth.uid())
        and responder_membership.verification_status = 'verified'
        and (
          target_solution_id is null
          or exists(
            select 1
            from public.solutions
            where solutions.id = target_solution_id
              and solutions.owner_membership_id = target_responder_membership_id
              and solutions.status = 'published'
          )
        )
    );
$$;

create or replace function public.can_post_relay_message(
  target_thread_id uuid,
  target_sender_membership_id uuid,
  target_sender_role public.relay_participant_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      public.is_admin()
      and target_sender_role = 'admin'
      and target_sender_membership_id is null
    )
    or exists(
      select 1
      from public.relay_threads
      left join public.memberships challenge_owner_membership
        on challenge_owner_membership.id = relay_threads.challenge_owner_membership_id
      left join public.memberships responder_membership
        on responder_membership.id = relay_threads.responder_membership_id
      where relay_threads.id = target_thread_id
        and relay_threads.status = 'open'
        and (
          (
            challenge_owner_membership.user_id = (select auth.uid())
            and target_sender_role = 'challenge_owner'
            and target_sender_membership_id = relay_threads.challenge_owner_membership_id
          )
          or (
            responder_membership.user_id = (select auth.uid())
            and target_sender_role = 'responder'
            and target_sender_membership_id = relay_threads.responder_membership_id
          )
        )
    );
$$;

create or replace function public.start_relay_thread(
  target_challenge_id uuid,
  target_responder_membership_id uuid,
  initial_body text,
  target_solution_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_thread_id uuid;
  existing_thread_id uuid;
  existing_thread_status public.relay_thread_status;
  resolved_owner_membership_id uuid;
  sanitized_body text := trim(regexp_replace(coalesce(initial_body, ''), '\s+', ' ', 'g'));
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if char_length(sanitized_body) < 24 then
    raise exception 'Relay message must be at least 24 characters long';
  end if;

  if not public.can_create_relay_thread(
    target_challenge_id,
    target_responder_membership_id,
    target_solution_id
  ) then
    raise exception 'You cannot start a relay thread for this challenge';
  end if;

  select challenges.owner_membership_id
  into resolved_owner_membership_id
  from public.challenges
  where challenges.id = target_challenge_id;

  select relay_threads.id, relay_threads.status
  into existing_thread_id, existing_thread_status
  from public.relay_threads
  where relay_threads.challenge_id = target_challenge_id
    and relay_threads.responder_membership_id = target_responder_membership_id
  limit 1;

  if existing_thread_id is null then
    insert into public.relay_threads (
      challenge_id,
      challenge_owner_membership_id,
      responder_membership_id,
      solution_id,
      status,
      last_message_at
    )
    values (
      target_challenge_id,
      resolved_owner_membership_id,
      target_responder_membership_id,
      target_solution_id,
      'open',
      now()
    )
    returning id into created_thread_id;
  else
    if existing_thread_status <> 'open' then
      raise exception 'This relay thread is not open for new messages';
    end if;

    update public.relay_threads
    set
      solution_id = coalesce(target_solution_id, relay_threads.solution_id),
      last_message_at = now()
    where relay_threads.id = existing_thread_id;

    created_thread_id := existing_thread_id;
  end if;

  insert into public.relay_messages (
    thread_id,
    sender_user_id,
    sender_membership_id,
    sender_role,
    body
  )
  values (
    created_thread_id,
    (select auth.uid()),
    target_responder_membership_id,
    'responder',
    sanitized_body
  );

  return created_thread_id;
end;
$$;

create or replace function public.post_relay_message(
  target_thread_id uuid,
  message_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_message_id uuid;
  derived_sender_membership_id uuid;
  derived_sender_role public.relay_participant_role;
  sanitized_body text := trim(regexp_replace(coalesce(message_body, ''), '\s+', ' ', 'g'));
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if char_length(sanitized_body) < 24 then
    raise exception 'Relay message must be at least 24 characters long';
  end if;

  select
    case
      when challenge_owner_membership.user_id = (select auth.uid())
        then relay_threads.challenge_owner_membership_id
      when responder_membership.user_id = (select auth.uid())
        then relay_threads.responder_membership_id
      else null
    end,
    case
      when challenge_owner_membership.user_id = (select auth.uid())
        then 'challenge_owner'::public.relay_participant_role
      when responder_membership.user_id = (select auth.uid())
        then 'responder'::public.relay_participant_role
      else null
    end
  into derived_sender_membership_id, derived_sender_role
  from public.relay_threads
  left join public.memberships challenge_owner_membership
    on challenge_owner_membership.id = relay_threads.challenge_owner_membership_id
  left join public.memberships responder_membership
    on responder_membership.id = relay_threads.responder_membership_id
  where relay_threads.id = target_thread_id
    and relay_threads.status = 'open';

  if derived_sender_role is null then
    if public.is_admin() then
      derived_sender_membership_id := null;
      derived_sender_role := 'admin';
    else
      raise exception 'You cannot post to this relay thread';
    end if;
  end if;

  if not public.can_post_relay_message(
    target_thread_id,
    derived_sender_membership_id,
    derived_sender_role
  ) then
    raise exception 'You cannot post to this relay thread';
  end if;

  insert into public.relay_messages (
    thread_id,
    sender_user_id,
    sender_membership_id,
    sender_role,
    body
  )
  values (
    target_thread_id,
    (select auth.uid()),
    derived_sender_membership_id,
    derived_sender_role,
    sanitized_body
  )
  returning id into created_message_id;

  update public.relay_threads
  set last_message_at = now()
  where relay_threads.id = target_thread_id;

  return created_message_id;
end;
$$;

grant execute on function public.start_relay_thread(uuid, uuid, text, uuid) to authenticated;
grant execute on function public.post_relay_message(uuid, text) to authenticated;

drop policy if exists "relay_threads_insert_verified_participants_or_admin"
on public.relay_threads;

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
    and public.can_create_relay_thread(
      challenge_id,
      responder_membership_id,
      solution_id
    )
  )
);

drop policy if exists "relay_messages_insert_participants_or_admin"
on public.relay_messages;

create policy "relay_messages_insert_participants_or_admin"
on public.relay_messages
for insert
to authenticated
with check (
  sender_user_id = (select auth.uid())
  and public.can_post_relay_message(
    thread_id,
    sender_membership_id,
    sender_role
  )
);
