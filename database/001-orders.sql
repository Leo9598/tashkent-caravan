-- Apply once to the restaurant's Supabase project. All order data is server-only.
begin;
create table if not exists public.staff_members (
  user_id uuid primary key references auth.users(id),
  email text not null unique check (email = lower(email)),
  display_name text not null default 'Personal',
  role text not null default 'staff' check (role in ('owner','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.restaurant_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  request_id uuid not null unique,
  request_digest text not null,
  status text not null default 'new' check (status in ('new','accepted','preparing','ready','out_for_delivery','completed','cancelled')),
  version integer not null default 0,
  fulfillment text not null check (fulfillment in ('delivery','pickup','dine_in')),
  customer_name text not null,
  customer_phone text not null,
  delivery jsonb,
  notes text not null default '',
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  notification_status text not null default 'pending' check (notification_status in ('pending','not_configured','sent','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists restaurant_orders_created on public.restaurant_orders(created_at desc);
create index if not exists restaurant_orders_status on public.restaurant_orders(status, created_at desc);
create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.restaurant_orders(id),
  actor_id uuid references public.staff_members(user_id),
  from_status text,
  to_status text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table public.staff_members enable row level security;
alter table public.restaurant_orders enable row level security;
alter table public.order_events enable row level security;
revoke all on public.staff_members, public.restaurant_orders, public.order_events from public, anon, authenticated;
grant select, insert, update on public.staff_members, public.restaurant_orders, public.order_events to service_role;
grant usage, select on sequence public.restaurant_orders_order_number_seq, public.order_events_id_seq to service_role;

create or replace function public.create_restaurant_order(p_request_id uuid, p_digest text, p_order jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare saved public.restaurant_orders; created boolean := false;
begin
  insert into public.restaurant_orders(request_id, request_digest, fulfillment, customer_name, customer_phone, delivery, notes, items, subtotal)
  values(p_request_id,p_digest,p_order->>'fulfillment',p_order->>'name',p_order->>'phone',nullif(p_order->'delivery','null'::jsonb),coalesce(p_order->>'notes',''),p_order->'cart',(p_order->>'total')::numeric)
  on conflict (request_id) do nothing returning * into saved;
  if saved.id is not null then
    created := true;
    insert into public.order_events(order_id,to_status) values(saved.id,'new');
  else
    select * into saved from public.restaurant_orders where request_id = p_request_id;
    if saved.request_digest <> p_digest then raise exception 'request_conflict' using errcode = 'P0001'; end if;
  end if;
  return jsonb_build_object('order',to_jsonb(saved),'created',created);
end $$;

create or replace function public.staff_order_snapshot(p_status text default 'active', p_search text default '', p_offset integer default 0)
returns jsonb language sql security invoker set search_path = public, pg_temp as $$
  with filtered as (
    select * from public.restaurant_orders
    where (p_status = 'all' or (p_status = 'active' and status not in ('completed','cancelled')) or status = p_status)
      and (p_search = '' or customer_name ilike '%'||p_search||'%' or customer_phone ilike '%'||p_search||'%' or ('TK-'||order_number::text) ilike '%'||p_search||'%')
  ), page as (select * from filtered order by created_at desc, id desc limit 50 offset greatest(0,least(p_offset,10000)))
  select jsonb_build_object(
    'orders',coalesce((select jsonb_agg(to_jsonb(page) - 'request_digest' - 'request_id' order by created_at desc,id desc) from page),'[]'::jsonb),
    'total',(select count(*) from filtered),
    'counts',jsonb_build_object(
      'new',(select count(*) from public.restaurant_orders where status='new'),
      'active',(select count(*) from public.restaurant_orders where status not in ('completed','cancelled')),
      'completed_today',(select count(*) from public.restaurant_orders where status='completed' and (updated_at at time zone 'Europe/Chisinau')::date=(now() at time zone 'Europe/Chisinau')::date)
    )
  );
$$;

create or replace function public.staff_change_order_status(p_id uuid,p_version integer,p_status text,p_actor uuid,p_note text default '')
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare current_order public.restaurant_orders; changed public.restaurant_orders;
begin
  if not exists(select 1 from public.staff_members where user_id=p_actor and active) then raise exception 'not_authorized' using errcode='P0001'; end if;
  select * into current_order from public.restaurant_orders where id=p_id for update;
  if current_order.id is null then raise exception 'not_found' using errcode='P0001'; end if;
  if current_order.version <> p_version then raise exception 'version_conflict' using errcode='P0001'; end if;
  if not (
    (current_order.status='new' and p_status in ('accepted','cancelled')) or
    (current_order.status='accepted' and p_status in ('preparing','cancelled')) or
    (current_order.status='preparing' and p_status in ('ready','cancelled')) or
    (current_order.status='ready' and (p_status='cancelled' or (current_order.fulfillment='delivery' and p_status='out_for_delivery') or (current_order.fulfillment<>'delivery' and p_status='completed'))) or
    (current_order.status='out_for_delivery' and p_status in ('completed','cancelled'))
  ) then raise exception 'invalid_transition' using errcode='P0001'; end if;
  if p_status='cancelled' and length(trim(p_note)) < 3 then raise exception 'cancellation_note_required' using errcode='P0001'; end if;
  update public.restaurant_orders set status=p_status,version=version+1,updated_at=now() where id=p_id returning * into changed;
  insert into public.order_events(order_id,actor_id,from_status,to_status,note) values(p_id,p_actor,current_order.status,p_status,left(p_note,240));
  return to_jsonb(changed) - 'request_digest' - 'request_id';
end $$;
revoke all on function public.create_restaurant_order(uuid,text,jsonb), public.staff_order_snapshot(text,text,integer), public.staff_change_order_status(uuid,integer,text,uuid,text) from public, anon, authenticated;
grant execute on function public.create_restaurant_order(uuid,text,jsonb), public.staff_order_snapshot(text,text,integer), public.staff_change_order_status(uuid,integer,text,uuid,text) to service_role;
commit;
