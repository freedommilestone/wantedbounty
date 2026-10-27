-- Run once in the Supabase SQL Editor. All access is through Vercel's server.
begin;
create table public.poster_orders (
  id uuid primary key,
  token_hash text not null,
  owner text not null,
  client_hash text not null,
  currency text not null check (currency in ('SOL','USDC','USDT')),
  amount bigint not null check (amount > 0),
  treasury text not null,
  details jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','generating','ready','review')),
  signature text unique,
  started_at timestamptz,
  result_path text,
  error_code text
);
alter table public.poster_orders enable row level security;
revoke all on public.poster_orders from anon, authenticated;
grant all on public.poster_orders to service_role;
create index poster_orders_created on public.poster_orders(created_at);

-- Serialize admissions so simultaneous requests cannot bypass limits.
create function public.prepare_poster_order(p_order jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
begin
  perform pg_advisory_xact_lock(8261026);
  if (select count(*) from poster_orders where created_at > now()-interval '1 hour'
      and (owner=p_order->>'owner' or client_hash=p_order->>'client_hash')) >= 10
     or (select count(*) from poster_orders where created_at > now()-interval '1 day') >= 200 then
    raise exception 'ORDER_RATE_LIMIT';
  end if;
  insert into poster_orders(id,token_hash,owner,client_hash,currency,amount,treasury,details,expires_at)
  values ((p_order->>'id')::uuid,p_order->>'token_hash',p_order->>'owner',p_order->>'client_hash',
    p_order->>'currency',(p_order->>'amount')::bigint,p_order->>'treasury',p_order->'details',
    (p_order->>'expires_at')::timestamptz);
  return (p_order->>'id')::uuid;
end $$;

-- A unique receipt plus a single atomic claim prevents replay and concurrent edits.
-- No automatic lease expiry: an uncertain OpenAI outcome must not run twice.
create function public.claim_poster_order(p_id uuid, p_signature text) returns boolean
language plpgsql security invoker set search_path = public as $$
declare claimed uuid;
begin
  update poster_orders set status='generating',signature=p_signature,started_at=now()
    where id=p_id and status='pending' returning id into claimed;
  return claimed is not null;
end $$;
revoke all on function public.prepare_poster_order(jsonb) from public,anon,authenticated;
revoke all on function public.claim_poster_order(uuid,text) from public,anon,authenticated;
grant execute on function public.prepare_poster_order(jsonb) to service_role;
grant execute on function public.claim_poster_order(uuid,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('poster-private','poster-private',false,5242880,array['image/jpeg'])
on conflict(id) do update set public=false;
commit;
