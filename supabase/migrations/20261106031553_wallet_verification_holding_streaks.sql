-- Wallet ownership and daily observed BERI holdings. Only the server can write.
create table public.wallet_links (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 address text not null unique check(address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
 verified_at timestamptz not null default now(),
 current_streak integer not null default 0,
 longest_streak integer not null default 0,
 last_checked_at timestamptz,
 last_attempt_at timestamptz,
 last_day date,
 last_slot bigint,
 balance_raw text,
 decimals smallint,
 check_failed boolean not null default false
);
create table public.wallet_holding_days (
 link_id uuid not null references public.wallet_links(id) on delete cascade,
 day date not null,
 balance_raw text not null check(balance_raw ~ '^[0-9]{1,78}$'),
 decimals smallint not null check(decimals between 0 and 18),
 qualifies boolean not null,
 slot bigint not null,
 checked_at timestamptz not null,
 primary key(link_id,day)
);
create table public.wallet_challenges (
 user_id uuid primary key references auth.users(id) on delete cascade,
 id uuid not null unique,
 address text not null,
 message text not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 used_at timestamptz
);
alter table public.wallet_links enable row level security;
alter table public.wallet_holding_days enable row level security;
alter table public.wallet_challenges enable row level security;
revoke all on public.wallet_links,public.wallet_holding_days,public.wallet_challenges from anon,authenticated;
grant select on public.wallet_links,public.wallet_holding_days to authenticated;
grant all on public.wallet_links,public.wallet_holding_days,public.wallet_challenges to service_role;
create policy "Read own verified wallet" on public.wallet_links for select to authenticated using(user_id=(select auth.uid()));
create policy "Read own holding days" on public.wallet_holding_days for select to authenticated using(exists(select 1 from public.wallet_links l where l.id=link_id and l.user_id=(select auth.uid())));
create index wallet_links_due on public.wallet_links(last_checked_at,id);

create function public.issue_wallet_challenge(p_user uuid,p_id uuid,p_address text,p_message text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c public.wallet_challenges; l public.wallet_links;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,81));
 select * into c from public.wallet_challenges where user_id=p_user;
 if c.created_at>now()-interval '15 seconds' then raise exception 'WALLET_RATE_LIMIT'; end if;
 select * into l from public.wallet_links where user_id=p_user;
 if l.id is not null and l.address<>p_address then raise exception 'WALLET_ALREADY_LINKED'; end if;
 if exists(select 1 from public.wallet_links where address=p_address and user_id<>p_user) then raise exception 'WALLET_IN_USE'; end if;
 insert into public.wallet_challenges(user_id,id,address,message,expires_at)
 values(p_user,p_id,p_address,p_message,now()+interval '5 minutes')
 on conflict(user_id) do update set id=excluded.id,address=excluded.address,message=excluded.message,created_at=now(),expires_at=excluded.expires_at,used_at=null returning * into c;
 return to_jsonb(c);
end $$;
create function public.finish_wallet_verification(p_user uuid,p_challenge uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c public.wallet_challenges; l public.wallet_links;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,81));
 select * into c from public.wallet_challenges where user_id=p_user and id=p_challenge for update;
 if c.id is null or c.used_at is not null or c.expires_at<=now() then raise exception 'WALLET_CHALLENGE_EXPIRED'; end if;
 select * into l from public.wallet_links where user_id=p_user for update;
 if l.id is not null and l.address<>c.address then raise exception 'WALLET_ALREADY_LINKED'; end if;
 if exists(select 1 from public.wallet_links where address=c.address and user_id<>p_user) then raise exception 'WALLET_IN_USE'; end if;
 insert into public.wallet_links(user_id,address) values(p_user,c.address)
 on conflict(user_id) do update set address=excluded.address returning * into l;
 update public.wallet_challenges set used_at=now() where user_id=p_user;
 return to_jsonb(l);
end $$;
create function public.unlink_player_wallet(p_user uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,81));
 delete from public.wallet_links where user_id=p_user;
 delete from public.wallet_challenges where user_id=p_user;
end $$;
create function public.claim_wallet_scan(p_link uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare l public.wallet_links;
begin
 update public.wallet_links set last_attempt_at=now() where id=p_link
 and (last_attempt_at is null or last_attempt_at<now()-interval '1 minute') returning * into l;
 return case when l.id is null then null else to_jsonb(l) end;
end $$;
create function public.record_wallet_holding(p_link uuid,p_raw text,p_decimals integer,p_slot bigint,p_checked timestamptz) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare l public.wallet_links; d date; eligible boolean; current_count integer; longest_count integer;
begin
 if p_raw is null or p_decimals is null or p_slot is null or p_checked is null or p_raw !~ '^[0-9]{1,78}$' or p_decimals not between 0 and 18 or p_slot<0 or p_checked>now()+interval '10 seconds' or p_checked<now()-interval '5 minutes' then raise exception 'INVALID_HOLDING_SAMPLE'; end if;
 select * into l from public.wallet_links where id=p_link for update;
 if l.id is null then return null; end if;
 if l.last_slot is not null and (p_slot<l.last_slot or p_checked<=l.last_checked_at) then return to_jsonb(l); end if;
 d=(p_checked at time zone 'UTC')::date;
 eligible=p_raw::numeric>=power(10::numeric,p_decimals);
 insert into public.wallet_holding_days(link_id,day,balance_raw,decimals,qualifies,slot,checked_at)
 values(p_link,d,p_raw,p_decimals,eligible,p_slot,p_checked)
 on conflict(link_id,day) do update set balance_raw=excluded.balance_raw,decimals=excluded.decimals,
 qualifies=public.wallet_holding_days.qualifies and excluded.qualifies,slot=excluded.slot,checked_at=excluded.checked_at;
 -- A below-threshold observation disqualifies that UTC day, even if refilled.
 with qualifying as (
  select day,day-(row_number() over(order by day))::integer as grp from public.wallet_holding_days where link_id=p_link and qualifies
 ), runs as (select count(*)::integer as n,max(day) as last from qualifying group by grp)
 select coalesce(max(n) filter(where last=d),0),coalesce(max(n),0) into current_count,longest_count from runs;
 update public.wallet_links set current_streak=current_count,longest_streak=longest_count,last_checked_at=p_checked,last_day=d,last_slot=p_slot,balance_raw=p_raw,decimals=p_decimals,check_failed=false where id=p_link returning * into l;
 return to_jsonb(l);
end $$;
revoke all on function public.issue_wallet_challenge(uuid,uuid,text,text),public.finish_wallet_verification(uuid,uuid),public.unlink_player_wallet(uuid),public.claim_wallet_scan(uuid),public.record_wallet_holding(uuid,text,integer,bigint,timestamptz) from public,anon,authenticated;
grant execute on function public.issue_wallet_challenge(uuid,uuid,text,text),public.finish_wallet_verification(uuid,uuid),public.unlink_player_wallet(uuid),public.claim_wallet_scan(uuid),public.record_wallet_holding(uuid,text,integer,bigint,timestamptz) to service_role;
