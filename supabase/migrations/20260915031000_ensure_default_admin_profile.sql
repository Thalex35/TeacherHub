insert into public.profiles (id, email, full_name, account_status)
select id,
       email,
       coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
       'approved'
from auth.users
where id = '334b4b75-4568-4d37-b7fc-e338324edc45'
on conflict (id) do nothing;

update public.profiles
set role = 'admin',
    account_status = 'approved',
    approved_at = coalesce(approved_at, now())
where id = '334b4b75-4568-4d37-b7fc-e338324edc45';
