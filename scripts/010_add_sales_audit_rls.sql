-- RLS Policies for Sales Audits
create policy "Users can view sales audits in their business" on public.sales_audits
for select using (
  exists (
    select 1 from public.sales s
    where s.id = sales_audits.sale_id
    and (
      exists (
        select 1 from public.staff st
        where st.business_id = s.business_id
        and st.user_id = auth.uid()
      )
      or
      exists (
        select 1 from public.businesses b
        where b.id = s.business_id
        and b.owner_id = auth.uid()
      )
    )
  )
);

-- Managers and admins can create audit records
create policy "Authorized staff can create sales audits" on public.sales_audits
for insert with check (
  exists (
    select 1 from public.staff s
    where s.id = sales_audits.performed_by
    and s.role in ('admin', 'manager')
  )
);

-- Only admins can delete sales (with audit trail)
create policy "Only admins can delete sales" on public.sales
for delete using (
  exists (
    select 1 from public.staff s
    where s.business_id = sales.business_id
    and s.user_id = auth.uid()
    and s.role = 'admin'
  )
);

-- Managers and above can update sales (for correction/cancellation)
create policy "Authorized staff can update sales" on public.sales
for update using (
  exists (
    select 1 from public.staff s
    where s.business_id = sales.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- Add insert policy for sale_items
create policy "Authorized staff can insert sale items" on public.sale_items
for insert with check (
  exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id
    and exists (
      select 1 from public.staff st
      where st.business_id = s.business_id
      and st.user_id = auth.uid()
      and st.role in ('admin', 'manager', 'cashier')
    )
  )
);
