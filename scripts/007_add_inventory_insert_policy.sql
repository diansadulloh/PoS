-- Add INSERT policy for inventory table to allow staff with 'admin' or 'inventory' roles to create inventory records
create policy "Inventory staff can create inventory records" on public.inventory
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = inventory.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'inventory')
  )
);
