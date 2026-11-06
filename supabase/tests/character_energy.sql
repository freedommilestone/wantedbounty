begin;
select set_config('test.energy_user',gen_random_uuid()::text,true);
insert into auth.users(id,raw_user_meta_data) values(current_setting('test.energy_user')::uuid,'{"name":"Energy QA"}');
do $$
declare u uuid=current_setting('test.energy_user')::uuid; e public.player_energy; result jsonb; original bigint;
begin
 if (select count(*) from public.energy_levels)<>100 then raise exception 'Missing progression levels'; end if;
 e=public.settle_player_energy(u);
 if e.energy_units<>500::bigint*86400000000 then raise exception 'New reserve must start at 500'; end if;
 -- Exact fractional regeneration: 1 hour at level 2 = 149/24 EP, no rounded hourly credits.
 update public.player_energy set energy_units=0,highest_level=2,capacity=528,ep_per_day=149,regen_eligible=true,eligible_until=now()+interval '1 day',settled_at=now()-interval '1 hour' where user_id=u;
 e=public.settle_player_energy(u);
 if e.energy_units<>149::bigint*3600000000 then raise exception 'Fractional accrual failed'; end if;
 original=e.energy_units;e=public.settle_player_energy(u);
 if e.energy_units<>original then raise exception 'Double accrual'; end if;
 result=public.apply_player_energy_event(u,'battle-1',-2,'Battle entry');
 e=public.settle_player_energy(u);original=e.energy_units;
 result=public.apply_player_energy_event(u,'battle-1',-2,'Battle entry');
 e=public.settle_player_energy(u);
 if e.energy_units<>original or not (result->>'replayed')::boolean then raise exception 'Retry double spent'; end if;
 begin perform public.apply_player_energy_event(u,'battle-1',-3,'Battle entry');raise exception 'Replay changed amount';exception when others then if sqlerrm<>'ENERGY_EVENT_CONFLICT' then raise;end if;end;
 begin perform public.apply_player_energy_event(u,'battle-2',-500,'Battle entry');raise exception 'Overspend succeeded';exception when others then if sqlerrm<>'INSUFFICIENT_ENERGY' then raise;end if;end;
 if exists(select 1 from public.energy_events where user_id=u and event_key='battle-2') then raise exception 'Rejected spend logged';end if;
 result=public.apply_player_energy_event(u,'reward-1',1000,'Quest reward');
 e=public.settle_player_energy(u);if e.energy_units<>528::bigint*86400000000 then raise exception 'Reward exceeded cap';end if;
 update public.player_energy set settled_at=now()-interval '10 days' where user_id=u;
 e=public.settle_player_energy(u);
 perform public.apply_player_energy_event(u,'battle-3',-100,'Battle entry');
 e=public.settle_player_energy(u);if e.energy_units<>428::bigint*86400000000 then raise exception 'Full reserve banked overflow';end if;
 -- Only eligible time accrues; gaps after eligibility expires cannot be credited.
 update public.player_energy set energy_units=0,settled_at=now()-interval '3 hours',eligible_until=now()-interval '1 hour' where user_id=u;
 e=public.settle_player_energy(u);if e.energy_units<>149::bigint*7200000000 then raise exception 'Expired eligibility accrued';end if;
 e=public.set_player_energy_holding(u,true,1825,now()-interval '1 second',now()+interval '1 day');
 if e.highest_level<>100 or e.capacity<>10000 or e.ep_per_day<>624 then raise exception 'Level 100 mismatch';end if;
 original=e.energy_units;e=public.set_player_energy_holding(u,false,0,now(),null);
 if e.highest_level<>100 or e.regen_eligible or e.energy_units<>original then raise exception 'Zero balance erased level/energy';end if;
 -- Existing over-cap energy stays available, never grows or gets refilled above normal cap.
 update public.player_energy set energy_units=8400::bigint*86400000000,legacy_ceiling_units=8400::bigint*86400000000,capacity=500,ep_per_day=144,settled_at=now()-interval '1 day',regen_eligible=true,eligible_until=now()+interval '1 day' where user_id=u;
 e=public.settle_player_energy(u);if e.energy_units<>8400::bigint*86400000000 then raise exception 'Legacy balance altered';end if;
 perform public.apply_player_energy_event(u,'legacy-reward',20,'Quest reward');
 e=public.settle_player_energy(u);if e.energy_units<>8400::bigint*86400000000 then raise exception 'Legacy over-cap reward grew balance';end if;
 perform public.apply_player_energy_event(u,'legacy-spend',-8000,'Battle entry');
 e=public.settle_player_energy(u);if e.energy_units<>400::bigint*86400000000 or e.legacy_ceiling_units<>0 then raise exception 'Legacy transition failed';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.energy_user'),true);
do $$begin
 if (select count(*) from public.player_energy)<>1 then raise exception 'RLS exposed other characters';end if;
 begin update public.player_energy set energy_units=0;raise exception 'Client energy write allowed';exception when insufficient_privilege then null;end;
 begin perform public.apply_player_energy_event(current_setting('test.energy_user')::uuid,'forged',100,'Cheat');raise exception 'Client grant allowed';exception when insufficient_privilege then null;end;
 begin perform public.set_player_energy_holding(current_setting('test.energy_user')::uuid,true,1825,now(),now()+interval '1 day');raise exception 'Client level forge allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: exact accrual, caps, spending, idempotency, expired eligibility, permanent levels, legacy balance preservation, RLS and mutation grants' as result;
rollback;
