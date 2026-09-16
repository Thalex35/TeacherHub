create or replace function public.update_my_profile_name(next_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set full_name = nullif(trim(next_full_name), '')
  where id = auth.uid();
end;
$$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.update_my_profile_name(text) from public;
revoke all on function public.delete_my_account() from public;
grant execute on function public.update_my_profile_name(text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;