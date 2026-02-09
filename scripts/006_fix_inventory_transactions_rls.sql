-- Fix RLS policies for inventory_transactions table
-- Allow business owners to create inventory transaction records

-- Drop existing policies
DROP POLICY IF EXISTS "inventory_transactions_select" ON inventory_transactions;
DROP POLICY IF EXISTS "inventory_transactions_insert" ON inventory_transactions;
DROP POLICY IF EXISTS "inventory_transactions_update" ON inventory_transactions;
DROP POLICY IF EXISTS "inventory_transactions_delete" ON inventory_transactions;

-- Allow business owners to view their inventory transactions
CREATE POLICY "inventory_transactions_select"
ON inventory_transactions
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Allow business owners to create inventory transactions
CREATE POLICY "inventory_transactions_insert"
ON inventory_transactions
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Allow business owners to update their inventory transactions
CREATE POLICY "inventory_transactions_update"
ON inventory_transactions
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Allow business owners to delete their inventory transactions
CREATE POLICY "inventory_transactions_delete"
ON inventory_transactions
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);
