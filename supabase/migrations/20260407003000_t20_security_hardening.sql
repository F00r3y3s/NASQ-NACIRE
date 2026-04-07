revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.is_membership_owner(uuid) from public, anon;
grant execute on function public.is_membership_owner(uuid) to authenticated;

revoke execute on function public.is_verified_member() from public, anon;
grant execute on function public.is_verified_member() to authenticated;

revoke execute on function public.is_verified_membership_owner(uuid) from public, anon;
grant execute on function public.is_verified_membership_owner(uuid) to authenticated;

revoke execute on function public.membership_belongs_to_company(uuid, uuid) from public, anon;
grant execute on function public.membership_belongs_to_company(uuid, uuid) to authenticated;

revoke execute on function public.is_company_member(uuid) from public, anon;
grant execute on function public.is_company_member(uuid) to authenticated;

revoke execute on function public.is_company_admin(uuid) from public, anon;
grant execute on function public.is_company_admin(uuid) to authenticated;

revoke execute on function public.is_challenge_owner(uuid) from public, anon;
grant execute on function public.is_challenge_owner(uuid) to authenticated;

revoke execute on function public.is_solution_owner(uuid) from public, anon;
grant execute on function public.is_solution_owner(uuid) to authenticated;

revoke execute on function public.owns_ai_conversation(uuid) from public, anon;
grant execute on function public.owns_ai_conversation(uuid) to authenticated;

revoke execute on function public.can_access_relay_thread(uuid) from public, anon;
grant execute on function public.can_access_relay_thread(uuid) to authenticated;

revoke execute on function public.can_create_relay_thread(uuid, uuid, uuid) from public, anon;
grant execute on function public.can_create_relay_thread(uuid, uuid, uuid) to authenticated;

revoke execute on function public.can_post_relay_message(
  uuid,
  uuid,
  public.relay_participant_role
) from public, anon;
grant execute on function public.can_post_relay_message(
  uuid,
  uuid,
  public.relay_participant_role
) to authenticated;

revoke execute on function public.start_relay_thread(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.start_relay_thread(uuid, uuid, text, uuid) to authenticated;

revoke execute on function public.post_relay_message(uuid, text) from public, anon;
grant execute on function public.post_relay_message(uuid, text) to authenticated;

revoke execute on function public.list_guest_ai_conversations(text) from public, authenticated;
grant execute on function public.list_guest_ai_conversations(text) to anon;

revoke execute on function public.list_guest_ai_messages(text, uuid) from public, authenticated;
grant execute on function public.list_guest_ai_messages(text, uuid) to anon;

drop function if exists public.submit_guest_ai_turn(text, uuid, text, text, text);

revoke execute on function public.submit_guest_ai_turn(text, uuid, text, text, text, jsonb)
from public, authenticated;
grant execute on function public.submit_guest_ai_turn(text, uuid, text, text, text, jsonb)
to anon;
