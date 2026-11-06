begin;
select set_config('test.wallet_a',gen_random_uuid()::text,true),set_config('test.wallet_b',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
(current_setting('test.wallet_a')::uuid,'wallet-a@example.invalid','{"name":"Wallet A"}'),
(current_setting('test.wallet_b')::uuid,'wallet-b@example.invalid','{"name":"Wallet B"}');
set local role service_role;
do $$
declare a uuid=current_setting('test.wallet_a')::uuid; b uuid=current_setting('test.wallet_b')::uuid; c uuid=gen_random_uuid(); l uuid; r jsonb; d date=(now() at time zone 'UTC')::date;
begin
 perform public.issue_wallet_challenge(a,c,'11111111111111111111111111111111','test message');
 begin perform public.issue_wallet_challenge(a,gen_random_uuid(),'11111111111111111111111111111111','message');raise exception 'Rate limit failed';exception when raise_exception then if sqlerrm<>'WALLET_RATE_LIMIT' then raise;end if;end;
 begin perform public.finish_wallet_verification(b,c);raise exception 'Wrong account accepted';exception when raise_exception then if sqlerrm<>'WALLET_CHALLENGE_EXPIRED' then raise;end if;end;
 update public.wallet_challenges set expires_at=now()-interval '1 second' where user_id=a;
 begin perform public.finish_wallet_verification(a,c);raise exception 'Expired challenge accepted';exception when raise_exception then if sqlerrm<>'WALLET_CHALLENGE_EXPIRED' then raise;end if;end;
 update public.wallet_challenges set expires_at=now()+interval '5 minutes' where user_id=a;
 r=public.finish_wallet_verification(a,c);l=(r->>'id')::uuid;
 begin perform public.finish_wallet_verification(a,c);raise exception 'Replay accepted';exception when raise_exception then if sqlerrm<>'WALLET_CHALLENGE_EXPIRED' then raise;end if;end;
 begin perform public.issue_wallet_challenge(b,gen_random_uuid(),'11111111111111111111111111111111','message');raise exception 'Duplicate wallet accepted';exception when raise_exception then if sqlerrm<>'WALLET_IN_USE' then raise;end if;end;
 -- Two prior daily observations; today's threshold must be exact, not rounded.
 insert into public.wallet_holding_days values(l,d-2,'1000000',6,true,90,now()-interval '2 days'),(l,d-1,'1000000',6,true,91,now()-interval '1 day');
 r=public.record_wallet_holding(l,'1000000',6,100,now()-interval '4 seconds');
 if r->>'current_streak'<>'3' or r->>'longest_streak'<>'3' then raise exception 'Consecutive days did not count';end if;
 r=public.record_wallet_holding(l,'2000000',6,101,now()-interval '3 seconds');
 if r->>'current_streak'<>'3' then raise exception 'Same day counted twice';end if;
 r=public.record_wallet_holding(l,'999999',6,102,now()-interval '2 seconds');
 if r->>'current_streak'<>'0' or r->>'longest_streak'<>'2' then raise exception 'Below threshold did not break streak';end if;
 r=public.record_wallet_holding(l,'1000000',6,103,now()-interval '1 second');
 if r->>'current_streak'<>'0' then raise exception 'Same-day refill restored failed day';end if;
 r=public.record_wallet_holding(l,'1000000',6,99,now());
 if r->>'last_slot'<>'103' then raise exception 'Old slot accepted';end if;
 delete from public.wallet_holding_days where link_id=l and day>=d-1;
 r=public.record_wallet_holding(l,'1000000',6,104,now());
 if r->>'current_streak'<>'1' then raise exception 'Missing day was backfilled';end if;
 if public.claim_wallet_scan(l) is null then raise exception 'First scan denied';end if;
 if public.claim_wallet_scan(l) is not null then raise exception 'Concurrent scan allowed';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.wallet_b'),true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.wallet_links) or exists(select 1 from public.wallet_holding_days) then raise exception 'Other user wallet readable';end if;
 begin update public.wallet_links set current_streak=999;raise exception 'Client can forge streak';exception when insufficient_privilege then null;end;
 begin perform count(*) from public.wallet_challenges;raise exception 'Client can read nonce';exception when insufficient_privilege then null;end;
 begin perform public.finish_wallet_verification(current_setting('test.wallet_b')::uuid,gen_random_uuid());raise exception 'Client can verify without signature';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.wallet_a'),true);
set local role authenticated;
do $$ begin if (select count(*) from public.wallet_links)<>1 then raise exception 'Own wallet not readable';end if;end $$;
reset role;
select public.unlink_player_wallet(current_setting('test.wallet_a')::uuid);
do $$ begin if exists(select 1 from public.wallet_links where user_id=current_setting('test.wallet_a')::uuid) then raise exception 'Unlink failed';end if;end $$;
rollback;
select 'PASS: threshold, UTC days, no double counting, missing days, same-day drop, stale slots, nonce replay, account ownership, duplicate wallets, scan throttling, RLS and unlink.' as verification;
