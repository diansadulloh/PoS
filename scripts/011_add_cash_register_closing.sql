-- Add columns to cash_registers for payment method tracking and staff assignment
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS cash_sales decimal(12, 2) default 0;
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS non_cash_sales decimal(12, 2) default 0;
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS small_expenses decimal(12, 2) default 0;
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS assigned_staff_id uuid references public.staff(id);

-- Create table to track small expenses by cashier
CREATE TABLE IF NOT EXISTS public.cash_register_expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  cash_register_id uuid not null references public.cash_registers(id) on delete cascade,
  staff_id uuid not null references public.staff(id),
  amount decimal(12, 2) not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cash_register_expenses ON public.cash_register_expenses(business_id, cash_register_id);

-- Create table to track register closing summaries
CREATE TABLE IF NOT EXISTS public.register_closings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  cash_register_id uuid not null references public.cash_registers(id) on delete cascade,
  opened_by uuid not null references public.staff(id),
  closed_by uuid not null references public.staff(id),
  opening_time timestamp with time zone not null,
  closing_time timestamp with time zone not null,
  opening_balance decimal(12, 2) default 0,
  cash_sales decimal(12, 2) default 0,
  non_cash_sales decimal(12, 2) default 0,
  small_expenses decimal(12, 2) default 0,
  expected_cash decimal(12, 2) default 0,
  actual_cash decimal(12, 2),
  variance decimal(12, 2),
  notes text,
  created_at timestamp with time zone default now()
);

-- Create index for register closings
CREATE INDEX IF NOT EXISTS idx_register_closings ON public.register_closings(business_id, cash_register_id);
CREATE INDEX IF NOT EXISTS idx_register_closings_date ON public.register_closings(closing_time DESC);
