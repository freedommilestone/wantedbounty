begin;
select set_config('test.player_a',gen_random_uuid()::text,true),set_config('test.player_b',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
(current_setting('test.player_a')::uuid,'allegiance-test-a@example.invalid','{"name":"Test Sailor"}'),
(current_setting('test.player_b')::uuid,'allegiance-test-b@example.invalid','{"name":"Other Sailor"}');
select set_config('request.jwt.claim.sub',current_setting('test.player_a'),true);
set local role authenticated;
do $$
declare affected integer;
begin
 if (select count(*) from public.players)<>1 then raise exception 'RLS read isolation failed'; end if;
 update public.players set allegiance='marines' where user_id=current_setting('test.player_a')::uuid;
 if not exists(select 1 from public.players where allegiance='marines' and allegiance_chosen_at is not null and display_name='Test Sailor') then raise exception 'Save/trigger failed'; end if;
 update public.players set allegiance='pirates' where user_id=current_setting('test.player_b')::uuid;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account update allowed'; end if;
 begin
  update public.players set allegiance='invalid';
  raise exception 'Invalid allegiance accepted';
 exception when check_violation then null; end;
 begin
  update public.players set display_name='forged';
  raise exception 'Protected column writable';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update auth.users set raw_user_meta_data='{"profile":{"name":"Updated Sailor","bio":"My crew"}}' where id=current_setting('test.player_a')::uuid;
do $$ begin
 if not exists(select 1 from public.players where user_id=current_setting('test.player_a')::uuid and display_name='Updated Sailor' and bio='My crew' and allegiance='marines') then raise exception 'Profile sync lost data'; end if;
 if has_table_privilege('anon','public.players','select') then raise exception 'Anonymous access allowed'; end if;
end $$;
rollback;
select 'PASS: signup trigger, own-row read/write, cross-user isolation, allowed allegiances, timestamps, protected columns, profile sync, anonymous denial; test records rolled back' as verification;
