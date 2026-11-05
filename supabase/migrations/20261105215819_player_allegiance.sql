-- One private player record per Supabase Auth account. Passwords stay in Auth.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.players (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 bio text not null default '',
 allegiance text check (allegiance in ('pirates','marines','revolutionaries')),
 allegiance_chosen_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint player_allegiance_timestamp check ((allegiance is null) = (allegiance_chosen_at is null))
);
alter table public.players enable row level security;
revoke all on public.players from anon, authenticated;
grant select on public.players to authenticated;
grant update (allegiance) on public.players to authenticated;
grant all on public.players to service_role;
create policy players_read_own on public.players for select to authenticated
 using ((select auth.uid()) = user_id);
create policy players_update_own on public.players for update to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Only Auth invokes this trigger, never a public RPC. User metadata is display
-- content only: it cannot set an allegiance or supply authorization.
create function private.sync_player_from_auth() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if tg_table_schema <> 'auth' or tg_table_name <> 'users' then
  raise exception 'Only Auth may create player records';
 end if;
 insert into public.players(user_id,display_name,bio,created_at)
 values (new.id,
  left(coalesce(new.raw_user_meta_data->'profile'->>'name',new.raw_user_meta_data->>'name',''),64),
  left(coalesce(new.raw_user_meta_data->'profile'->>'bio',''),2000),
  coalesce(new.created_at,now()))
 on conflict (user_id) do update set
  display_name=excluded.display_name,bio=excluded.bio,updated_at=now();
 return new;
end;
$$;
revoke all on function private.sync_player_from_auth() from public,anon,authenticated,service_role;
create trigger sync_player_after_signup after insert on auth.users
 for each row execute function private.sync_player_from_auth();
create trigger sync_player_after_profile_change after update of raw_user_meta_data on auth.users
 for each row execute function private.sync_player_from_auth();

create function private.stamp_player_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 new.updated_at=now();
 if new.allegiance is distinct from old.allegiance then
  new.allegiance_chosen_at=case when new.allegiance is null then null else now() end;
 end if;
 return new;
end;
$$;
revoke all on function private.stamp_player_update() from public,anon,authenticated,service_role;
create trigger stamp_player_update before update on public.players
 for each row execute function private.stamp_player_update();

-- Existing accounts join the same onboarding flow without losing their profile.
insert into public.players(user_id,display_name,bio,created_at)
 select id,
 left(coalesce(raw_user_meta_data->'profile'->>'name',raw_user_meta_data->>'name',''),64),
 left(coalesce(raw_user_meta_data->'profile'->>'bio',''),2000),
 coalesce(created_at,now())
 from auth.users
 on conflict (user_id) do nothing;
