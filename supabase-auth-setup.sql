alter table if exists public.users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;

alter table if exists public.users
  alter column password_hash drop not null;

create index if not exists idx_users_auth_user_id on public.users(auth_user_id);

alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.status_updates enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.saved_payment_methods enable row level security;
alter table public.guest_orders enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users for select
using (auth.uid() = auth_user_id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users for insert
with check (auth.uid() = auth_user_id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
on public.orders for select
using (
  exists (
    select 1
    from public.users
    where users.user_id = orders.user_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "orders_insert_registered_or_guest" on public.orders;
create policy "orders_insert_registered_or_guest"
on public.orders for insert
with check (
  user_id is null
  or exists (
    select 1
    from public.users
    where users.user_id = orders.user_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders
    join public.users on users.user_id = orders.user_id
    where orders.order_id = order_items.order_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "order_items_insert_any" on public.order_items;
create policy "order_items_insert_any"
on public.order_items for insert
with check (true);

drop policy if exists "status_updates_select_own" on public.status_updates;
create policy "status_updates_select_own"
on public.status_updates for select
using (
  exists (
    select 1
    from public.orders
    join public.users on users.user_id = orders.user_id
    where orders.order_id = status_updates.order_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "status_updates_insert_any" on public.status_updates;
create policy "status_updates_insert_any"
on public.status_updates for insert
with check (true);

drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
create policy "wallet_transactions_select_own"
on public.wallet_transactions for select
using (
  exists (
    select 1
    from public.users
    where users.user_id = wallet_transactions.user_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "wallet_transactions_insert_own" on public.wallet_transactions;
create policy "wallet_transactions_insert_own"
on public.wallet_transactions for insert
with check (
  exists (
    select 1
    from public.users
    where users.user_id = wallet_transactions.user_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "loyalty_transactions_select_own" on public.loyalty_transactions;
create policy "loyalty_transactions_select_own"
on public.loyalty_transactions for select
using (
  exists (
    select 1
    from public.users
    where users.user_id = loyalty_transactions.user_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "loyalty_transactions_insert_own" on public.loyalty_transactions;
create policy "loyalty_transactions_insert_own"
on public.loyalty_transactions for insert
with check (
  exists (
    select 1
    from public.users
    where users.user_id = loyalty_transactions.user_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "saved_payment_methods_select_own" on public.saved_payment_methods;
create policy "saved_payment_methods_select_own"
on public.saved_payment_methods for select
using (
  exists (
    select 1
    from public.users
    where users.user_id = saved_payment_methods.user_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "saved_payment_methods_insert_own" on public.saved_payment_methods;
create policy "saved_payment_methods_insert_own"
on public.saved_payment_methods for insert
with check (
  exists (
    select 1
    from public.users
    where users.user_id = saved_payment_methods.user_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "saved_payment_methods_update_own" on public.saved_payment_methods;
create policy "saved_payment_methods_update_own"
on public.saved_payment_methods for update
using (
  exists (
    select 1
    from public.users
    where users.user_id = saved_payment_methods.user_id
      and users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.user_id = saved_payment_methods.user_id
      and users.auth_user_id = auth.uid()
  )
);

drop policy if exists "guest_orders_insert_any" on public.guest_orders;
create policy "guest_orders_insert_any"
on public.guest_orders for insert
with check (true);
