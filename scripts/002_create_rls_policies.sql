-- RLS Policies for Businesses
create policy "Users can view their own businesses" on public.businesses
for select using (auth.uid() = owner_id);

create policy "Users can create businesses" on public.businesses
for insert with check (auth.uid() = owner_id);

create policy "Users can update their own businesses" on public.businesses
for update using (auth.uid() = owner_id);

create policy "Users can delete their own businesses" on public.businesses
for delete using (auth.uid() = owner_id);

-- RLS Policies for Staff
create policy "Staff can view other staff in same business" on public.staff
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = staff.business_id
    and s.user_id = auth.uid()
  )
);

create policy "Business owners can manage staff" on public.staff
for insert with check (
  exists (
    select 1 from public.businesses b
    where b.id = staff.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Staff can update their own records" on public.staff
for update using (auth.uid() = user_id);

-- RLS Policies for Categories
create policy "Users can view categories in their business" on public.categories
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = categories.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = categories.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Managers can create categories" on public.categories
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = categories.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- RLS Policies for Products
create policy "Users can view products in their business" on public.products
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = products.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = products.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Managers can manage products" on public.products
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = products.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager', 'inventory')
  )
);

-- RLS Policies for Inventory
create policy "Users can view inventory in their business" on public.inventory
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = inventory.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = inventory.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Inventory staff can update stock" on public.inventory
for update using (
  exists (
    select 1 from public.staff s
    where s.business_id = inventory.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'inventory')
  )
);

create policy "Inventory staff can create inventory records" on public.inventory
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = inventory.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'inventory')
  )
);

-- RLS Policies for Sales
create policy "Users can view sales in their business" on public.sales
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = sales.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = sales.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Cashiers can create sales" on public.sales
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = sales.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager', 'cashier')
  )
);

-- RLS Policies for Customers
create policy "Users can view customers in their business" on public.customers
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = customers.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = customers.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Managers can manage customers" on public.customers
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = customers.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- RLS Policies for Invoices
create policy "Users can view invoices in their business" on public.invoices
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = invoices.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = invoices.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Managers can create invoices" on public.invoices
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = invoices.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- RLS Policies for Expenses
create policy "Users can view expenses in their business" on public.expenses
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = expenses.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = expenses.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Managers can create expenses" on public.expenses
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = expenses.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- RLS Policies for Restaurant Tables
create policy "Users can view tables in their business" on public.restaurant_tables
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = restaurant_tables.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = restaurant_tables.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Managers can manage tables" on public.restaurant_tables
for update using (
  exists (
    select 1 from public.staff s
    where s.business_id = restaurant_tables.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- RLS Policies for Sale Items (protected by parent Sales table)
create policy "Users can view sale items" on public.sale_items
for select using (
  exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id
    and exists (
      select 1 from public.staff st
      where st.business_id = s.business_id
      and st.user_id = auth.uid()
    )
  )
);

-- RLS Policies for Quotations
create policy "Users can view quotations in their business" on public.quotations
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = quotations.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = quotations.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Managers can create quotations" on public.quotations
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = quotations.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- RLS Policies for Receivings
create policy "Users can view receivings in their business" on public.receivings
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = receivings.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = receivings.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Inventory staff can create receivings" on public.receivings
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = receivings.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'inventory')
  )
);

-- RLS Policies for Cash Registers
create policy "Users can view cash registers in their business" on public.cash_registers
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = cash_registers.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = cash_registers.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Cashiers can create cash register sessions" on public.cash_registers
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = cash_registers.business_id
    and s.user_id = auth.uid()
    and s.id = cash_registers.staff_id
  )
);

-- RLS Policies for Suppliers
create policy "Users can view suppliers in their business" on public.suppliers
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = suppliers.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = suppliers.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Managers can manage suppliers" on public.suppliers
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = suppliers.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);

-- RLS Policies for Returns
create policy "Users can view returns in their business" on public.returns
for select using (
  exists (
    select 1 from public.staff s
    where s.business_id = returns.business_id
    and s.user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.businesses b
    where b.id = returns.business_id
    and b.owner_id = auth.uid()
  )
);

create policy "Managers can create returns" on public.returns
for insert with check (
  exists (
    select 1 from public.staff s
    where s.business_id = returns.business_id
    and s.user_id = auth.uid()
    and s.role in ('admin', 'manager')
  )
);
