begin;
select set_config('test.player_a',gen_random_uuid()::text,true),set_config('test.player_b',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
(current_setting('test.player_a')::uuid,'dashboard-a@example.invalid','{"name":"Captain Redwave"}'),
(current_setting('test.player_b')::uuid,'dashboard-b@example.invalid','{"name":"Captain Bluewave"}');
select set_config('request.jwt.claim.sub',current_setting('test.player_a'),true);
set local role authenticated;
do $$
declare chosen timestamptz; affected integer;
begin
 if not exists(select 1 from public.players where wanted_bounty=0 and energy=500 and level=1 and level_progress=0 and allegiance is null) then raise exception 'Starting stats incorrect'; end if;
 update public.players set allegiance='pirates' where user_id=current_setting('test.player_a')::uuid;
 select allegiance_chosen_at into chosen from public.players where user_id=current_setting('test.player_a')::uuid;
 update public.players set allegiance='pirates' where user_id=current_setting('test.player_a')::uuid;
 if not exists(select 1 from public.players where allegiance='pirates' and allegiance_chosen_at=chosen) then raise exception 'Idempotent choice failed'; end if;
 begin
  update public.players set allegiance='marines';
  raise exception 'Faction change accepted';
 exception when check_violation then null; end;
 begin
  update public.players set allegiance=null;
  raise exception 'Faction reset accepted';
 exception when check_violation then null; end;
 begin
  update public.players set energy=999999;
  raise exception 'Client can forge game stats';
 exception when insufficient_privilege then null; end;
 update public.players set allegiance='revolutionaries' where user_id=current_setting('test.player_b')::uuid;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Foreign player changed'; end if;
 if (select count(*) from public.players)<>1 then raise exception 'Foreign player readable'; end if;
end $$;
reset role;
update auth.users set raw_user_meta_data='{"name":"Updated Captain"}' where id=current_setting('test.player_a')::uuid;
do $$ begin
 if not exists(select 1 from public.players where user_id=current_setting('test.player_a')::uuid and display_name='Updated Captain' and allegiance='pirates' and energy=500) then raise exception 'Profile sync changed faction or stats'; end if;
end $$;
rollback;
select 'PASS: starting stats, first choice, permanent faction, reset denial, idempotent confirmation, server-only stats, RLS ownership, profile sync. Test records rolled back.' as verification;
