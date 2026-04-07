create or replace function public.list_guest_ai_conversations(
  target_guest_session_key text
)
returns table (
  id uuid,
  title text,
  access_scope public.ai_conversation_scope,
  last_message_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    ai_conversations.id,
    ai_conversations.title,
    ai_conversations.access_scope,
    ai_conversations.last_message_at,
    ai_conversations.created_at,
    ai_conversations.updated_at
  from public.ai_conversations
  where ai_conversations.owner_user_id is null
    and ai_conversations.guest_session_key = target_guest_session_key
  order by ai_conversations.updated_at desc
  limit 12;
$$;

create or replace function public.list_guest_ai_messages(
  target_guest_session_key text,
  target_conversation_id uuid
)
returns table (
  id uuid,
  role public.ai_message_role,
  content text,
  citations jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    ai_messages.id,
    ai_messages.role,
    ai_messages.content,
    ai_messages.citations,
    ai_messages.created_at
  from public.ai_messages
  join public.ai_conversations
    on ai_conversations.id = ai_messages.conversation_id
  where ai_messages.conversation_id = target_conversation_id
    and ai_conversations.owner_user_id is null
    and ai_conversations.guest_session_key = target_guest_session_key
  order by ai_messages.created_at asc;
$$;

create or replace function public.submit_guest_ai_turn(
  target_guest_session_key text,
  target_conversation_id uuid,
  conversation_title text,
  user_content text,
  assistant_content text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_conversation_id uuid;
  sanitized_guest_session_key text := trim(coalesce(target_guest_session_key, ''));
  sanitized_title text := nullif(trim(regexp_replace(coalesce(conversation_title, ''), '\s+', ' ', 'g')), '');
  sanitized_user_content text := trim(regexp_replace(coalesce(user_content, ''), '\s+', ' ', 'g'));
  sanitized_assistant_content text := trim(regexp_replace(coalesce(assistant_content, ''), '\s+', ' ', 'g'));
begin
  if (select auth.uid()) is not null then
    raise exception 'Guest AI conversation functions are only available to anon access';
  end if;

  if char_length(sanitized_guest_session_key) < 16 then
    raise exception 'A valid guest session key is required';
  end if;

  if char_length(sanitized_user_content) < 16 then
    raise exception 'A valid user message is required';
  end if;

  if char_length(sanitized_assistant_content) < 16 then
    raise exception 'A valid assistant message is required';
  end if;

  if target_conversation_id is null then
    insert into public.ai_conversations (
      guest_session_key,
      title,
      access_scope,
      last_message_at
    )
    values (
      sanitized_guest_session_key,
      sanitized_title,
      'public',
      now()
    )
    returning ai_conversations.id into resolved_conversation_id;
  else
    select ai_conversations.id
    into resolved_conversation_id
    from public.ai_conversations
    where ai_conversations.id = target_conversation_id
      and ai_conversations.owner_user_id is null
      and ai_conversations.guest_session_key = sanitized_guest_session_key
      and ai_conversations.access_scope = 'public';

    if resolved_conversation_id is null then
      raise exception 'Guest conversation not found';
    end if;

    update public.ai_conversations
    set
      title = coalesce(ai_conversations.title, sanitized_title),
      last_message_at = now()
    where ai_conversations.id = resolved_conversation_id;
  end if;

  insert into public.ai_messages (
    conversation_id,
    role,
    content,
    citations
  )
  values
    (
      resolved_conversation_id,
      'user',
      sanitized_user_content,
      '[]'::jsonb
    ),
    (
      resolved_conversation_id,
      'assistant',
      sanitized_assistant_content,
      '[]'::jsonb
    );

  update public.ai_conversations
  set updated_at = now()
  where ai_conversations.id = resolved_conversation_id;

  return resolved_conversation_id;
end;
$$;

grant execute on function public.list_guest_ai_conversations(text) to anon;
grant execute on function public.list_guest_ai_messages(text, uuid) to anon;
grant execute on function public.submit_guest_ai_turn(text, uuid, text, text, text) to anon;
