-- RLS Policy for inserting sale items
create policy "Cashiers can create sale items" on public.sale_items
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
