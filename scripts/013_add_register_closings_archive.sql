-- Add is_archived flag to register_closings table
ALTER TABLE public.register_closings
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Create index for archived closings
CREATE INDEX IF NOT EXISTS idx_register_closings_archived ON public.register_closings(business_id, is_archived);

-- Add RLS policy for viewing archived closings
CREATE POLICY "Users can view archived closings" ON public.register_closings
FOR SELECT USING (
  is_archived = true AND
  exists (
    select 1 from public.staff s
    where s.business_id = register_closings.business_id
    and s.user_id = auth.uid()
  )
);

-- Add RLS policy for archiving closings (admins only)
CREATE POLICY "Admins can archive closings" ON public.register_closings
FOR UPDATE USING (
  exists (
    select 1 from public.staff s
    where s.business_id = register_closings.business_id
    and s.user_id = auth.uid()
    and s.role = 'admin'
  )
) WITH CHECK (
  exists (
    select 1 from public.staff s
    where s.business_id = register_closings.business_id
    and s.user_id = auth.uid()
    and s.role = 'admin'
  )
);
