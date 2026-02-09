-- Create Business/Store Profile
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  tax_id text,
  currency_code text default 'USD',
  timezone text default 'UTC',
  vat_number text,
  gst_number text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create Users/Staff Table
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  role text not null default 'cashier', -- admin, manager, cashier, inventory
  is_active boolean default true,
  pin_code text, -- Optional PIN for quick login
  permissions jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, email)
);

-- Create Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  parent_category_id uuid references public.categories(id) on delete set null,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, name)
);

-- Create Products/Items
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  purchase_price decimal(12, 2),
  selling_price decimal(12, 2) not null,
  tax_rate decimal(5, 2) default 0,
  tax_type text default 'vat', -- vat, gst, none
  barcode text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, sku)
);

-- Create Product Attributes (extensible)
create table if not exists public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_name text not null,
  attribute_value text not null,
  created_at timestamp with time zone default now()
);

-- Create Product Kits (bundles/combo items)
create table if not exists public.product_kits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kit_product_id uuid not null references public.products(id) on delete cascade,
  component_product_id uuid not null references public.products(id) on delete cascade,
  quantity decimal(10, 2) not null default 1,
  created_at timestamp with time zone default now()
);

-- Create Inventory/Stock
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_on_hand decimal(10, 2) not null default 0,
  quantity_reserved decimal(10, 2) default 0,
  reorder_level decimal(10, 2),
  reorder_quantity decimal(10, 2),
  last_stock_check timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, product_id)
);

-- Create Inventory Transactions (Stock In/Out Log)
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  transaction_type text not null, -- 'stock_in', 'stock_out', 'adjustment', 'return'
  quantity decimal(10, 2) not null,
  reference_id uuid, -- Links to sales, purchases, etc
  reference_type text, -- 'sale', 'purchase', 'adjustment'
  notes text,
  created_by uuid references public.staff(id),
  created_at timestamp with time zone default now()
);

-- Create Customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  tax_id text,
  customer_group text default 'retail', -- retail, wholesale, vip
  credit_limit decimal(12, 2) default 0,
  balance decimal(12, 2) default 0,
  tax_exempt boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create Suppliers
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  tax_id text,
  bank_details jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create Taxation Rules (Multi-tier)
create table if not exists public.tax_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  tax_type text not null, -- vat, gst, sales_tax, custom
  rate decimal(5, 2) not null,
  applicable_to text, -- 'products', 'customers', 'regions'
  criteria jsonb, -- JSON criteria for applying tax
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create Price Tiers
create table if not exists public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  customer_group text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create Price Tier Items
create table if not exists public.price_tier_items (
  id uuid primary key default gen_random_uuid(),
  price_tier_id uuid not null references public.price_tiers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  price decimal(12, 2) not null,
  created_at timestamp with time zone default now()
);

-- Create Restaurant Tables
create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  table_number text not null,
  seat_capacity integer,
  section text, -- e.g., 'main', 'patio', 'bar'
  status text default 'available', -- available, occupied, reserved, maintenance
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, table_number)
);

-- Create Sales/Transactions
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  receipt_number text not null,
  customer_id uuid references public.customers(id),
  table_id uuid references public.restaurant_tables(id),
  sale_type text not null, -- 'retail', 'wholesale', 'dine_in', 'delivery'
  subtotal decimal(12, 2) not null default 0,
  tax_amount decimal(12, 2) not null default 0,
  discount_amount decimal(12, 2) default 0,
  total_amount decimal(12, 2) not null,
  payment_method text not null, -- 'cash', 'card', 'cheque', 'bank_transfer'
  payment_status text default 'completed', -- completed, pending, partial
  sale_status text default 'completed', -- completed, pending, refunded, partial_refund
  notes text,
  created_by uuid not null references public.staff(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, receipt_number)
);

-- Create Sale Items/Line Items
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity decimal(10, 2) not null,
  unit_price decimal(12, 2) not null,
  tax_rate decimal(5, 2),
  tax_amount decimal(12, 2),
  discount_percent decimal(5, 2) default 0,
  discount_amount decimal(12, 2) default 0,
  line_total decimal(12, 2) not null,
  created_at timestamp with time zone default now()
);

-- Create Quotations
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  quote_number text not null,
  customer_id uuid not null references public.customers(id),
  subtotal decimal(12, 2) not null default 0,
  tax_amount decimal(12, 2) not null default 0,
  discount_amount decimal(12, 2) default 0,
  total_amount decimal(12, 2) not null,
  status text default 'draft', -- draft, sent, accepted, rejected, expired
  expiry_date date,
  notes text,
  created_by uuid not null references public.staff(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, quote_number)
);

-- Create Quotation Items
create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity decimal(10, 2) not null,
  unit_price decimal(12, 2) not null,
  tax_rate decimal(5, 2),
  tax_amount decimal(12, 2),
  discount_percent decimal(5, 2) default 0,
  discount_amount decimal(12, 2) default 0,
  line_total decimal(12, 2) not null,
  created_at timestamp with time zone default now()
);

-- Create Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  invoice_number text not null,
  sale_id uuid references public.sales(id),
  quotation_id uuid references public.quotations(id),
  customer_id uuid not null references public.customers(id),
  invoice_date date not null default now(),
  due_date date not null,
  subtotal decimal(12, 2) not null default 0,
  tax_amount decimal(12, 2) not null default 0,
  discount_amount decimal(12, 2) default 0,
  total_amount decimal(12, 2) not null,
  paid_amount decimal(12, 2) default 0,
  status text default 'draft', -- draft, sent, viewed, partially_paid, paid, overdue, cancelled
  notes text,
  created_by uuid not null references public.staff(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, invoice_number)
);

-- Create Invoice Payments
create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  payment_date timestamp with time zone default now(),
  payment_method text not null,
  amount_paid decimal(12, 2) not null,
  reference_number text,
  notes text,
  recorded_by uuid references public.staff(id),
  created_at timestamp with time zone default now()
);

-- Create Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null, -- utilities, rent, supplies, maintenance, etc
  description text not null,
  amount decimal(12, 2) not null,
  tax_amount decimal(12, 2) default 0,
  payment_method text,
  reference_number text,
  receipt_url text,
  expense_date date not null,
  created_by uuid not null references public.staff(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create Cash Register Sessions
create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  register_name text not null,
  staff_id uuid not null references public.staff(id),
  opening_time timestamp with time zone not null,
  closing_time timestamp with time zone,
  opening_balance decimal(12, 2) not null,
  closing_balance decimal(12, 2),
  calculated_total decimal(12, 2),
  variance decimal(12, 2), -- difference between expected and actual
  notes text,
  status text default 'open', -- open, closed
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create Receivings (Purchase Orders)
create table if not exists public.receivings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  po_number text not null,
  supplier_id uuid not null references public.suppliers(id),
  receiving_date date not null,
  expected_date date,
  total_amount decimal(12, 2),
  status text default 'pending', -- pending, received, partial, cancelled
  notes text,
  created_by uuid not null references public.staff(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, po_number)
);

-- Create Receiving Items
create table if not exists public.receiving_items (
  id uuid primary key default gen_random_uuid(),
  receiving_id uuid not null references public.receivings(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity_ordered decimal(10, 2) not null,
  quantity_received decimal(10, 2) default 0,
  unit_price decimal(12, 2) not null,
  line_total decimal(12, 2) not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- Create Returns
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  return_number text not null,
  sale_id uuid references public.sales(id),
  customer_id uuid references public.customers(id),
  return_type text not null, -- 'customer_return', 'supplier_return', 'defective'
  return_date date not null,
  reason text,
  total_refund decimal(12, 2),
  status text default 'pending', -- pending, processed, rejected
  created_by uuid not null references public.staff(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, return_number)
);

-- Create Return Items
create table if not exists public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity decimal(10, 2) not null,
  unit_price decimal(12, 2) not null,
  line_total decimal(12, 2) not null,
  condition text, -- good, defective, expired
  notes text,
  created_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table public.businesses enable row level security;
alter table public.staff enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_attributes enable row level security;
alter table public.product_kits enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.tax_rules enable row level security;
alter table public.price_tiers enable row level security;
alter table public.price_tier_items enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_registers enable row level security;
alter table public.receivings enable row level security;
alter table public.receiving_items enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
