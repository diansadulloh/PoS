-- Enable RLS for cash_registers table
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.register_closings ENABLE ROW LEVEL SECURITY;

-- Only admins can create and view all cash registers
CREATE POLICY "Admins can manage all cash registers" ON public.cash_registers
FOR ALL USING (
  exists (
    select 1 from public.staff s
    where s.business_id = cash_registers.business_id
    and s.user_id = auth.uid()
    and s.role = 'admin'
  )
)
WITH CHECK (
  exists (
    select 1 from public.staff s
    where s.business_id = cash_registers.business_id
    and s.user_id = auth.uid()
    and s.role = 'admin'
  )
);

-- Staff can view and open/close only their assigned register
CREATE POLICY "Staff can view their assigned register" ON public.cash_registers
FOR SELECT USING (
  assigned_staff_id = (
    select id from public.staff s
    where s.user_id = auth.uid()
    and s.business_id = cash_registers.business_id
  )
);

-- Only admins can update register assignments
CREATE POLICY "Admins can update cash registers" ON public.cash_registers
FOR UPDATE USING (
  exists (
    select 1 from public.staff s
    where s.business_id = cash_registers.business_id
    and s.user_id = auth.uid()
    and s.role = 'admin'
  )
)
WITH CHECK (
  exists (
    select 1 from public.staff s
    where s.business_id = cash_registers.business_id
    and s.user_id = auth.uid()
    and s.role = 'admin'
  )
);

-- Enable staff to insert register closings for their register
CREATE POLICY "Staff can create register closings" ON public.register_closings
FOR INSERT WITH CHECK (
  exists (
    select 1 from public.cash_registers cr
    join public.staff s on s.id = cr.assigned_staff_id
    where cr.id = register_closings.cash_register_id
    and s.user_id = auth.uid()
  )
);

-- Staff and admins can view register closings
CREATE POLICY "Users can view register closings" ON public.register_closings
FOR SELECT USING (
  exists (
    select 1 from public.cash_registers cr
    join public.staff s on s.id = cr.assigned_staff_id
    where cr.id = register_closings.cash_register_id
    and (s.user_id = auth.uid() or exists (
      select 1 from public.staff admin_s
      where admin_s.business_id = cr.business_id
      and admin_s.user_id = auth.uid()
      and admin_s.role = 'admin'
    ))
  )
);
