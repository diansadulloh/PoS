-- Add correction and cancellation tracking to sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS is_corrected boolean default false,
ADD COLUMN IF NOT EXISTS is_cancelled boolean default false,
ADD COLUMN IF NOT EXISTS correction_reason text,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS corrected_by uuid references public.staff(id),
ADD COLUMN IF NOT EXISTS cancelled_by uuid references public.staff(id),
ADD COLUMN IF NOT EXISTS corrected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS original_sale_id uuid references public.sales(id);

-- Create Sale Corrections/Amendments table
CREATE TABLE IF NOT EXISTS public.sale_corrections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  original_sale_id uuid not null references public.sales(id) on delete cascade,
  corrected_sale_id uuid references public.sales(id) on delete set null,
  correction_type text not null, -- 'price_adjustment', 'quantity_adjustment', 'discount_adjustment', 'other'
  reason text not null,
  changes jsonb not null, -- {original_total, new_total, items_changed, etc}
  created_by uuid not null references public.staff(id),
  created_at timestamp with time zone default now()
);

-- Create Sale Cancellations table
CREATE TABLE IF NOT EXISTS public.sale_cancellations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  cancellation_reason text not null,
  reversal_notes text,
  inventory_reverted boolean default false,
  created_by uuid not null references public.staff(id),
  created_at timestamp with time zone default now()
);

-- Create Sales Audit table for general audit tracking
CREATE TABLE IF NOT EXISTS public.sales_audits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  action text not null, -- 'delete', 'correction', 'cancellation'
  action_reason text,
  data_before jsonb, -- Store the original data before deletion/correction
  data_after jsonb, -- Store the new data after action
  performed_by uuid not null references public.staff(id),
  performed_at timestamp with time zone default now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sales_cancelled ON public.sales(business_id, is_cancelled);
CREATE INDEX IF NOT EXISTS idx_sales_corrected ON public.sales(business_id, is_corrected);
CREATE INDEX IF NOT EXISTS idx_sale_corrections ON public.sale_corrections(original_sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_cancellations ON public.sale_cancellations(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_audits ON public.sales_audits(business_id, sale_id);
