-- Permanent allegiance plus server-owned starting game state.
alter table public.players
 add column wanted_bounty bigint not null default 0 check (wanted_bounty between 0 and 9007199254740991),
 add column energy integer not null default 8400 check (energy >= 0),
 add column level integer not null default 1 check (level >= 1),
 add column level_progress integer not null default 0 check (level_progress between 0 and 100),
 add column world_rank integer check (world_rank > 0),
 add column fighting_style text,
 add column devil_fruit text;

-- Existing grants allow browser updates ONLY to allegiance; game stats are
-- server-owned. The trigger also protects the choice from direct API updates.
create or replace function private.stamp_player_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 if old.allegiance is not null and new.allegiance is distinct from old.allegiance then
  raise exception 'Your allegiance is permanent and cannot be changed.'
   using errcode='23514';
 end if;
 new.updated_at=now();
 if old.allegiance is null and new.allegiance is not null then
  new.allegiance_chosen_at=now();
 else
  new.allegiance_chosen_at=old.allegiance_chosen_at;
 end if;
 return new;
end;
$$;
revoke all on function private.stamp_player_update() from public,anon,authenticated,service_role;
