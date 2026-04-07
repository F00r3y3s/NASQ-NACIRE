create or replace function public.submit_guest_ai_turn(
  target_guest_session_key text,
  target_conversation_id uuid,
  conversation_title text,
  user_content text,
  assistant_content text,
  assistant_citations jsonb
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
  sanitized_assistant_citations jsonb := coalesce(assistant_citations, '[]'::jsonb);
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

  if jsonb_typeof(sanitized_assistant_citations) <> 'array' then
    raise exception 'assistant_citations must be a JSON array';
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
      sanitized_assistant_citations
    );

  update public.ai_conversations
  set updated_at = now()
  where ai_conversations.id = resolved_conversation_id;

  return resolved_conversation_id;
end;
$$;

grant execute on function public.submit_guest_ai_turn(text, uuid, text, text, text, jsonb) to anon;
