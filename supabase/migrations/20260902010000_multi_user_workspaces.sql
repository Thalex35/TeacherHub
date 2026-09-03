-- Give every authenticated user an isolated workspace.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'teachers','subjects','academic_years','academic_periods','classes','students',
    'units','topics','lessons','evaluation_types','assessments','grades','attendance',
    'calendar_events','grade_weights','final_grade_overrides','app_settings'
  ] loop
    execute format('alter table public.%I add column if not exists owner_id uuid default auth.uid()', table_name);
    execute format('create index if not exists %I on public.%I (owner_id)', table_name || '_owner_id_idx', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_authenticated_all', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', table_name || '_owner_only', table_name);
  end loop;
end $$;

-- app_settings was previously a global singleton, which prevents one row per user.
alter table public.app_settings drop constraint if exists app_settings_singleton;
alter table public.app_settings drop constraint if exists app_settings_pkey;
alter table public.app_settings alter column id drop default;
alter table public.app_settings alter column id type uuid using gen_random_uuid();
alter table public.app_settings alter column id set default gen_random_uuid();
alter table public.app_settings add primary key (id);

create or replace function public.create_user_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.teachers (user_id, full_name, email, owner_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email, new.id)
  on conflict do nothing;

  insert into public.app_settings (owner_id, school_name, teacher_name, is_demo_data)
  values (new.id, 'My School', coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), false);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace
after insert on auth.users
for each row execute function public.create_user_workspace();

-- Existing seed rows are intentionally left unowned. They are not visible to any
-- authenticated user until explicitly assigned to an owner by an administrator.