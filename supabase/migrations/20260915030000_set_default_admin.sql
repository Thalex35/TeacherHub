update public.profiles
set role = 'admin',
    account_status = 'approved',
    approved_at = coalesce(approved_at, now())
where id = '334b4b75-4568-4d37-b7fc-e338324edc45';