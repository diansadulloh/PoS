-- Fix restaurant_tables RLS policies
-- Add missing INSERT policy for business owners

-- Drop existing policies first
DROP POLICY IF EXISTS "Managers can manage tables" ON restaurant_tables;
DROP POLICY IF EXISTS "Users can view tables in their business" ON restaurant_tables;

-- Recreate SELECT policy
CREATE POLICY "Users can view tables in their business"
ON restaurant_tables FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Create INSERT policy for business owners
CREATE POLICY "Business owners can create tables"
ON restaurant_tables FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Create UPDATE policy for business owners
CREATE POLICY "Business owners can update tables"
ON restaurant_tables FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Create DELETE policy for business owners
CREATE POLICY "Business owners can delete tables"
ON restaurant_tables FOR DELETE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);
