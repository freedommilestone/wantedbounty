-- Version 1.3 progression. EP/day is authoritative; EP/hour in the PDF is rounded.
-- 86,400,000,000 integer units = 1 EP. Accrual is exact to one microsecond.
create table public.energy_levels (
 level integer primary key check(level between 1 and 100),
 holding_days integer not null unique check(holding_days>=0),
 ep_per_day integer not null check(ep_per_day>0),
 capacity integer not null check(capacity>0)
);
insert into public.energy_levels(level,holding_days,ep_per_day,capacity) values
(1,0,144,500),
(2,1,149,528),
(3,4,155,556),
(4,8,160,583),
(5,13,165,611),
(6,18,171,639),
(7,24,176,667),
(8,30,181,694),
(9,37,187,722),
(10,44,192,750),
(11,52,197,775),
(12,61,202,800),
(13,69,206,825),
(14,78,211,850),
(15,88,216,875),
(16,98,221,900),
(17,108,226,925),
(18,119,230,950),
(19,130,235,975),
(20,141,240,1000),
(21,153,245,1050),
(22,165,250,1100),
(23,177,254,1150),
(24,190,259,1200),
(25,203,264,1250),
(26,216,269,1300),
(27,230,274,1350),
(28,244,278,1400),
(29,258,283,1450),
(30,272,288,1500),
(31,287,293,1550),
(32,302,298,1600),
(33,317,302,1650),
(34,332,307,1700),
(35,348,312,1750),
(36,364,317,1800),
(37,380,322,1850),
(38,397,326,1900),
(39,414,331,1950),
(40,431,336,2000),
(41,448,341,2075),
(42,465,346,2150),
(43,483,350,2225),
(44,501,355,2300),
(45,519,360,2375),
(46,538,365,2450),
(47,556,370,2525),
(48,575,374,2600),
(49,594,379,2675),
(50,614,384,2750),
(51,633,389,2825),
(52,653,394,2900),
(53,673,398,2975),
(54,693,403,3050),
(55,713,408,3125),
(56,734,413,3200),
(57,755,418,3275),
(58,776,422,3350),
(59,797,427,3425),
(60,818,432,3500),
(61,840,437,3600),
(62,862,442,3700),
(63,884,446,3800),
(64,906,451,3900),
(65,928,456,4000),
(66,951,461,4100),
(67,973,466,4200),
(68,996,470,4300),
(69,1020,475,4400),
(70,1043,480,4500),
(71,1066,485,4600),
(72,1090,490,4700),
(73,1114,494,4800),
(74,1138,499,4900),
(75,1162,504,5000),
(76,1187,509,5100),
(77,1211,514,5200),
(78,1236,518,5300),
(79,1261,523,5400),
(80,1286,528,5500),
(81,1312,533,5650),
(82,1337,538,5800),
(83,1363,542,5950),
(84,1389,547,6100),
(85,1415,552,6250),
(86,1441,557,6400),
(87,1467,562,6550),
(88,1494,566,6700),
(89,1520,571,6850),
(90,1547,576,7000),
(91,1574,581,7300),
(92,1602,586,7600),
(93,1629,590,7900),
(94,1656,595,8200),
(95,1684,600,8500),
(96,1712,605,8800),
(97,1740,610,9100),
(98,1768,614,9400),
(99,1797,619,9700),
(100,1825,624,10000);
alter table public.energy_levels enable row level security;
revoke all on public.energy_levels from public,anon,authenticated;
grant select on public.energy_levels to authenticated,service_role;
create policy energy_levels_read on public.energy_levels for select to authenticated using(true);

create table public.player_energy (
 user_id uuid primary key references public.players(user_id) on delete cascade,
 energy_units bigint not null default 43200000000000 check(energy_units>=0),
 highest_level integer not null default 1 references public.energy_levels(level),
 best_holding_days integer not null default 0 check(best_holding_days>=0),
 capacity integer not null default 500,
 legacy_ceiling_units bigint not null default 0 check(legacy_ceiling_units>=0),
 ep_per_day integer not null default 144,
 regen_eligible boolean not null default false,
 eligible_until timestamptz,
 last_holding_at timestamptz,
 settled_at timestamptz not null default now(),
 revision bigint not null default 0,
 constraint capped_energy check(energy_units<=greatest(capacity::bigint*86400000000,legacy_ceiling_units))
);
create table public.energy_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.players(user_id) on delete cascade,
 event_key text not null check(length(event_key) between 1 and 200),
 requested_ep integer not null check(requested_ep<>0),
 applied_units bigint not null,
 balance_after_units bigint not null,
 reason text not null check(length(reason) between 1 and 200),
 created_at timestamptz not null default now(),
 unique(user_id,event_key)
);
create index energy_events_player_time on public.energy_events(user_id,created_at desc);
alter table public.player_energy enable row level security;
alter table public.energy_events enable row level security;
revoke all on public.player_energy,public.energy_events from public,anon,authenticated;
grant select on public.player_energy,public.energy_events to authenticated;
grant select,insert,update on public.player_energy to service_role;
grant select,insert on public.energy_events to service_role;
create policy player_energy_read_own on public.player_energy for select to authenticated using(user_id=(select auth.uid()));
create policy energy_events_read_own on public.energy_events for select to authenticated using(user_id=(select auth.uid()));

-- Preserve existing balances in the same reserve. Legacy over-cap energy
-- cannot regenerate or receive credits until spent below the normal cap.
alter table public.players alter column energy set default 500;
insert into public.player_energy(user_id,energy_units,legacy_ceiling_units)
 select user_id,energy::bigint*86400000000,case when energy>500 then energy::bigint*86400000000 else 0 end from public.players;

create function public.settle_player_energy(p_user uuid) returns public.player_energy
language plpgsql security invoker set search_path='' as $$
declare e public.player_energy; credit bigint; elapsed numeric; t timestamptz=now();
begin
 insert into public.player_energy(user_id) values(p_user) on conflict(user_id) do nothing;
 select * into strict e from public.player_energy where user_id=p_user for update;
 elapsed=greatest(0,extract(epoch from (least(t,coalesce(e.eligible_until,e.settled_at))-e.settled_at))*1000000);
 credit=case when e.regen_eligible then least(greatest(0,e.capacity::bigint*86400000000-e.energy_units),floor(elapsed*e.ep_per_day))::bigint else 0 end;
 -- Never bank overflow for later: advance settled_at even at full reserve.
 if t>e.settled_at then
  update public.player_energy set energy_units=energy_units+credit,settled_at=t,revision=revision+1 where user_id=p_user returning * into e;
 end if;
 update public.players set energy=(e.energy_units/86400000000)::integer,level=e.highest_level
 where user_id=p_user and (energy<>(e.energy_units/86400000000)::integer or level<>e.highest_level);
 return e;
end $$;

-- Called only by the trusted holdings/history pipeline. A failed check does
-- not erase energy or permanent level; its eligibility window simply expires.
create function public.set_player_energy_holding(p_user uuid,p_eligible boolean,p_best_days integer,p_observed timestamptz,p_valid_until timestamptz)
returns public.player_energy language plpgsql security invoker set search_path='' as $$
declare e public.player_energy; l public.energy_levels;
begin
 if p_eligible is null or p_best_days is null or p_best_days<0 or p_observed is null or p_observed>now()+interval '10 seconds' or (p_eligible and (p_valid_until is null or p_valid_until<=p_observed)) then raise exception 'INVALID_ENERGY_HOLDING'; end if;
 e=public.settle_player_energy(p_user);
 if e.last_holding_at is not null and p_observed<=e.last_holding_at then return e; end if;
 select * into strict l from public.energy_levels where holding_days<=greatest(e.best_holding_days,p_best_days) order by level desc limit 1;
 select * into strict l from public.energy_levels where level=greatest(e.highest_level,l.level);
 update public.player_energy set highest_level=l.level,best_holding_days=greatest(best_holding_days,p_best_days),capacity=l.capacity,ep_per_day=l.ep_per_day,
 regen_eligible=p_eligible,eligible_until=case when p_eligible then p_valid_until else null end,last_holding_at=p_observed,revision=revision+1 where user_id=p_user returning * into e;
 update public.players set level=e.highest_level where user_id=p_user and level<>e.highest_level;
 return e;
end $$;

-- No browser can invoke this. Game handlers supply a verified action/reward
-- ID and server-defined amount, never a player-entered delta. Same ID is once only.
create function public.apply_player_energy_event(p_user uuid,p_key text,p_delta integer,p_reason text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare e public.player_energy; prior public.energy_events; delta bigint;
begin
 if p_key is null or length(p_key) not between 1 and 200 or p_delta is null or p_delta=0 or p_delta not between -10000 and 10000 or p_reason is null or length(p_reason) not between 1 and 200 then raise exception 'INVALID_ENERGY_EVENT'; end if;
 e=public.settle_player_energy(p_user);
 select * into prior from public.energy_events where user_id=p_user and event_key=p_key;
 if prior.id is not null then
  if prior.requested_ep<>p_delta or prior.reason<>p_reason then raise exception 'ENERGY_EVENT_CONFLICT'; end if;
  return jsonb_build_object('state',to_jsonb(e),'event',to_jsonb(prior),'replayed',true);
 end if;
 delta=p_delta::bigint*86400000000;
 if delta<0 and e.energy_units+delta<0 then raise exception 'INSUFFICIENT_ENERGY'; end if;
 if delta>0 then delta=least(delta,greatest(0,e.capacity::bigint*86400000000-e.energy_units)); end if;
 update public.player_energy set energy_units=energy_units+delta,legacy_ceiling_units=case when energy_units+delta>capacity::bigint*86400000000 then energy_units+delta else 0 end,revision=revision+1 where user_id=p_user returning * into e;
 insert into public.energy_events(user_id,event_key,requested_ep,applied_units,balance_after_units,reason)
 values(p_user,p_key,p_delta,delta,e.energy_units,p_reason) returning * into prior;
 update public.players set energy=(e.energy_units/86400000000)::integer where user_id=p_user;
 return jsonb_build_object('state',to_jsonb(e),'event',to_jsonb(prior),'replayed',false);
end $$;
revoke all on function public.settle_player_energy(uuid),public.set_player_energy_holding(uuid,boolean,integer,timestamptz,timestamptz),public.apply_player_energy_event(uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.settle_player_energy(uuid),public.set_player_energy_holding(uuid,boolean,integer,timestamptz,timestamptz),public.apply_player_energy_event(uuid,text,integer,text) to service_role;

-- Own-row SELECT policies apply to Realtime deliveries, including across tabs.
alter publication supabase_realtime add table public.player_energy;
