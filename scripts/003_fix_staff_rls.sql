-- Fix the infinite recursion in staff RLS policies
-- The issue is that the SELECT policy checks the staff table while inserting into it

-- Drop the problematic policy
drop policy if exists "Staff can view other staff in same business" on public.staff;

-- Create a new SELECT policy that uses the businesses table to avoid recursion
create policy "Users can view staff in their business" on public.staff
for select using (
  exists (
    select 1 from public.businesses b
    where b.id = staff.business_id
    and b.owner_id = auth.uid()
  )
  or
  user_id = auth.uid()
);

-- Also fix the categories INSERT policy to allow business owners
drop policy if exists "Managers can create categories" on public.categories;

create policy "Managers and owners can create categories" on public.categories
for insert with check (
  exists (
    select 1 from public.businesses b
    where b.id = categories.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = categories.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- Add UPDATE policy for categories
create policy "Managers and owners can update categories" on public.categories
for update using (
  exists (
    select 1 from public.businesses b
    where b.id = categories.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = categories.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- Fix products INSERT policy to allow business owners
drop policy if exists "Managers can manage products" on public.products;

create policy "Managers and owners can manage products" on public.products
for insert with check (
  exists (
    select 1 from public.businesses b
    where b.id = products.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = products.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager', 'inventory')
  )
);

-- Add UPDATE policy for products
create policy "Managers and owners can update products" on public.products
for update using (
  exists (
    select 1 from public.businesses b
    where b.id = products.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = products.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager', 'inventory')
  )
);

-- Fix other INSERT policies to include business owners
drop policy if exists "Managers can manage customers" on public.customers;

create policy "Managers and owners can manage customers" on public.customers
for insert with check (
  exists (
    select 1 from public.businesses b
    where b.id = customers.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = customers.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- Add UPDATE policy for customers
create policy "Managers and owners can update customers" on public.customers
for update using (
  exists (
    select 1 from public.businesses b
    where b.id = customers.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = customers.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- Fix expenses INSERT policy
drop policy if exists "Managers can create expenses" on public.expenses;

create policy "Managers and owners can create expenses" on public.expenses
for insert with check (
  exists (
    select 1 from public.businesses b
    where b.id = expenses.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = expenses.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- Fix suppliers INSERT policy
drop policy if exists "Managers can manage suppliers" on public.suppliers;

create policy "Managers and owners can manage suppliers" on public.suppliers
for insert with check (
  exists (
    select 1 from public.businesses b
    where b.id = suppliers.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = suppliers.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- Add UPDATE policy for suppliers
create policy "Managers and owners can update suppliers" on public.suppliers
for update using (
  exists (
    select 1 from public.businesses b
    where b.id = suppliers.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = suppliers.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- Fix cash registers INSERT policy
drop policy if exists "Cashiers can create cash register sessions" on public.cash_registers;

create policy "Staff can create cash register sessions" on public.cash_registers
for insert with check (
  exists (
    select 1 from public.businesses b
    where b.id = cash_registers.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = cash_registers.business_id
    and s.user_id = auth.uid()
    and s.id = cash_registers.staff_id
  )
);

-- Add UPDATE policy for cash registers
create policy "Staff can update their cash registers" on public.cash_registers
for update using (
  exists (
    select 1 from public.businesses b
    where b.id = cash_registers.business_id
    and b.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.staff s
    where s.business_id = cash_registers.business_id
    and s.user_id = auth.uid()
    and s.id = cash_registers.staff_id
  )
);
