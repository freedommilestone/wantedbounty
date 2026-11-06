begin;
select set_config('test.history_user',gen_random_uuid()::text,true);
insert into auth.users(id,raw_user_meta_data) values(current_setting('test.history_user')::uuid,'{"name":"History QA"}');
do $$
declare u uuid=current_setting('test.history_user')::uuid; l public.wallet_links; e public.player_energy; token uuid=gen_random_uuid(); h jsonb; cp jsonb;
begin
 insert into public.wallet_links(user_id,address) values(u,'11111111111111111111111111111111') returning * into l;
 perform public.record_wallet_holding(l.id,'999999',6,100,now()-interval '2 seconds');
 select * into e from public.player_energy where user_id=u;
 if e.regen_eligible then raise exception 'Fractional BERI granted regeneration'; end if;
 perform public.record_wallet_holding(l.id,'1000000',6,101,now()-interval '1 second');
 select * into e from public.player_energy where user_id=u;
 if not e.regen_eligible or e.highest_level<>1 or e.eligible_until>now()+interval '26 hours' then raise exception 'Balance eligibility mismatch'; end if;
 h=public.claim_wallet_history(l.id,token);
 if h is null or public.claim_wallet_history(l.id,gen_random_uuid()) is not null then raise exception 'History lease not exclusive'; end if;
 if public.save_wallet_history(l.id,gen_random_uuid(),null,'{}'::jsonb) then raise exception 'Unowned lease saved'; end if;
 perform public.save_wallet_history(l.id,token,'{"cursor":"1:1"}'::jsonb,null);
 if (select history_status from public.wallet_links where id=l.id)<>'indexing' then raise exception 'Cursor not saved'; end if;
 h=public.claim_wallet_history(l.id,token);
 if h->'job'->>'cursor'<>'1:1' then raise exception 'Resume lost cursor'; end if;
 cp=jsonb_build_object('start',0,'currentSince',extract(epoch from now()-interval '44 days'),'bestSeconds',44*86400,'throughTime',floor(extract(epoch from now())),'coverageSlot',101);
 perform public.save_wallet_history(l.id,token,null,cp);
 select * into e from public.player_energy where user_id=u;
 if e.highest_level<>10 or e.capacity<>750 or e.best_holding_days<>44 then raise exception 'Historical level not applied to same observation'; end if;
 h=public.claim_wallet_history(l.id,token);perform public.fail_wallet_history(l.id,token);
 if (select checkpoint from public.wallet_holding_history where link_id=l.id)<>cp then raise exception 'Failure erased confirmed history'; end if;
 perform public.record_wallet_holding(l.id,'0',6,102,now());
 select * into e from public.player_energy where user_id=u;
 if e.regen_eligible or e.highest_level<>10 then raise exception 'Zero holdings did not pause/preserve'; end if;
 -- Unlink is atomic with pausing energy and deleting in-flight history jobs.
 update public.player_energy set regen_eligible=true,eligible_until=now()+interval '1 hour' where user_id=u;
 perform public.unlink_player_wallet(u);
 select * into e from public.player_energy where user_id=u;
 if e.regen_eligible or e.highest_level<>10 or exists(select 1 from public.wallet_holding_history where link_id=l.id) then raise exception 'Unlink left regeneration/indexer active'; end if;
end $$;
set local role authenticated;
do $$begin
 begin perform public.claim_wallet_history(gen_random_uuid(),gen_random_uuid());raise exception 'Client can claim history';exception when insufficient_privilege then null;end;
 begin perform * from public.wallet_holding_history;raise exception 'Client can read private indexing state';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: 1 BERI eligibility, historical level upgrade, resumable/exclusive leases, no incomplete awards, failure preservation, unlink pause, client privilege denial' as result;
rollback;
