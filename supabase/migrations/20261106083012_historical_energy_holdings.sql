-- Resumable, finalized history reconstruction; clients cannot write checkpoints.
alter table public.wallet_links
 add column history_status text not null default 'pending' check(history_status in ('pending','indexing','complete','retrying')),
 add column history_current_since timestamptz,
 add column history_best_seconds bigint not null default 0 check(history_best_seconds>=0),
 add column history_checked_at timestamptz;
create table public.wallet_holding_history (
 link_id uuid primary key references public.wallet_links(id) on delete cascade,
 checkpoint jsonb,
 job jsonb,
 lease_token uuid,
 lease_until timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.wallet_holding_history enable row level security;
revoke all on public.wallet_holding_history from public,anon,authenticated;
grant select,insert,update,delete on public.wallet_holding_history to service_role;
-- No client grants/policies: private indexing state contains token-account maps.

create function public.claim_wallet_history(p_link uuid,p_token uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare h public.wallet_holding_history;
begin
 perform 1 from public.wallet_links where id=p_link for update;
 if not found then return null; end if;
 insert into public.wallet_holding_history(link_id) values(p_link) on conflict do nothing;
 update public.wallet_holding_history set lease_token=p_token,lease_until=now()+interval '3 minutes'
 where link_id=p_link and (lease_until is null or lease_until<now()) returning * into h;
 return case when h.link_id is null then null else to_jsonb(h) end;
end $$;

-- A fresh finalized balance observation authorizes regeneration for at most 26
-- hours (the daily cron has an hour scheduling window). Levels require a fully
-- reconciled transaction history; a daily snapshot never proves holding duration.
create function public.sync_wallet_energy(p_link uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare l public.wallet_links;
begin
 select * into l from public.wallet_links where id=p_link for update;
 if l.id is null or l.last_checked_at is null or not exists(select 1 from public.players where user_id=l.user_id) then return; end if;
 perform public.set_player_energy_holding(l.user_id,l.balance_raw::numeric>=power(10::numeric,l.decimals),
  least(1825,l.history_best_seconds/86400)::integer,l.last_checked_at,l.last_checked_at+interval '26 hours');
end $$;

-- Same observation may acquire a newly completed historical backfill. It may
-- upgrade a permanent level, without moving the balance-check validity window.
create or replace function public.set_player_energy_holding(p_user uuid,p_eligible boolean,p_best_days integer,p_observed timestamptz,p_valid_until timestamptz)
returns public.player_energy language plpgsql security invoker set search_path='' as $$
declare e public.player_energy; l public.energy_levels;
begin
 if p_eligible is null or p_best_days is null or p_best_days<0 or p_observed is null or p_observed>now()+interval '10 seconds' or (p_eligible and (p_valid_until is null or p_valid_until<=p_observed or p_valid_until>p_observed+interval '26 hours')) then raise exception 'INVALID_ENERGY_HOLDING'; end if;
 e=public.settle_player_energy(p_user);
 if e.last_holding_at is not null and p_observed<e.last_holding_at then return e; end if;
 select * into strict l from public.energy_levels where holding_days<=greatest(e.best_holding_days,p_best_days) order by level desc limit 1;
 select * into strict l from public.energy_levels where level=greatest(e.highest_level,l.level);
 update public.player_energy set highest_level=l.level,best_holding_days=greatest(best_holding_days,p_best_days),capacity=l.capacity,ep_per_day=l.ep_per_day,
 regen_eligible=p_eligible,eligible_until=case when p_eligible then p_valid_until else null end,last_holding_at=p_observed,revision=revision+1 where user_id=p_user returning * into e;
 update public.players set level=e.highest_level where user_id=p_user and level<>e.highest_level;
 return e;
end $$;

create function public.save_wallet_history(p_link uuid,p_token uuid,p_job jsonb,p_checkpoint jsonb) returns boolean
language plpgsql security invoker set search_path='' as $$
declare h public.wallet_holding_history; l public.wallet_links; best bigint; observed timestamptz; since timestamptz;
begin
 select * into l from public.wallet_links where id=p_link for update;
 if l.id is null then return false; end if;
 select * into h from public.wallet_holding_history where link_id=p_link for update;
 if h.lease_token is distinct from p_token or h.lease_until<now() then return false; end if;
 if p_checkpoint is not null then
  best=(p_checkpoint->>'bestSeconds')::bigint;
  observed=to_timestamp((p_checkpoint->>'throughTime')::double precision);
  since=case when p_checkpoint->>'currentSince' is null then null else to_timestamp(greatest((p_checkpoint->>'currentSince')::double precision,(p_checkpoint->>'start')::double precision)) end;
  if best<0 or observed>now()+interval '10 seconds' or (h.checkpoint is not null and ((p_checkpoint->>'coverageSlot')::bigint<(h.checkpoint->>'coverageSlot')::bigint or (p_checkpoint->>'start')::bigint<>(h.checkpoint->>'start')::bigint)) then raise exception 'INVALID_HISTORY_CHECKPOINT'; end if;
  update public.wallet_links set history_best_seconds=greatest(history_best_seconds,best),history_current_since=since,history_checked_at=observed where id=p_link;
 end if;
 update public.wallet_holding_history set checkpoint=p_checkpoint,job=p_job,lease_token=null,lease_until=null,updated_at=now() where link_id=p_link;
 update public.wallet_links set history_status=case when p_job is null then 'complete' else 'indexing' end where id=p_link;
 perform public.sync_wallet_energy(p_link);
 return true;
end $$;
create function public.fail_wallet_history(p_link uuid,p_token uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.wallet_links where id=p_link for update;
 update public.wallet_holding_history set lease_token=null,lease_until=null where link_id=p_link and lease_token=p_token;
 if found then update public.wallet_links set history_status='retrying' where id=p_link; end if;
end $$;
create function public.wallet_energy_changed() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='DELETE' then
  if exists(select 1 from public.player_energy where user_id=old.user_id) then
   perform public.settle_player_energy(old.user_id);
   update public.player_energy set regen_eligible=false,eligible_until=null,last_holding_at=now(),revision=revision+1 where user_id=old.user_id;
  end if;
  return old;
 end if;
 if new.last_checked_at is distinct from old.last_checked_at then perform public.sync_wallet_energy(new.id); end if;
 return new;
end $$;
create trigger wallet_energy_observation after update of last_checked_at on public.wallet_links for each row execute function public.wallet_energy_changed();
create trigger wallet_energy_unlink before delete on public.wallet_links for each row execute function public.wallet_energy_changed();

revoke all on function public.claim_wallet_history(uuid,uuid),public.sync_wallet_energy(uuid),public.save_wallet_history(uuid,uuid,jsonb,jsonb),public.fail_wallet_history(uuid,uuid),public.wallet_energy_changed() from public,anon,authenticated;
grant execute on function public.claim_wallet_history(uuid,uuid),public.sync_wallet_energy(uuid),public.save_wallet_history(uuid,uuid,jsonb,jsonb),public.fail_wallet_history(uuid,uuid),public.wallet_energy_changed() to service_role;
