
revoke all on function public.consume_usage(uuid, text, text) from public, anon, authenticated;
revoke all on function public.refund_usage(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.get_my_usage() from public, anon;
grant execute on function public.get_my_usage() to authenticated;
