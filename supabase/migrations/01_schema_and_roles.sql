-- ==============================================================================
-- 1. EXTENSIONS & TYPES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- Drop existing tables to recreate the new schema cleanly (USE WITH CAUTION IN PRODUCTION)
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Profiles (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'manager', 'supervisor', 'cashier', 'seller')) NOT NULL DEFAULT 'seller',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_warehouse INTEGER NOT NULL DEFAULT 0,
    stock_sales_floor INTEGER NOT NULL DEFAULT 0,
    min_stock_alert INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sales (Header)
CREATE TABLE public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_name TEXT,
    status TEXT CHECK (status IN ('PENDIENTE', 'PAGADA', 'CANCELADA')) NOT NULL DEFAULT 'PENDIENTE',
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sale Items (Detail)
CREATE TABLE public.sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    product_sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inventory Movements (Audit & Transfers)
CREATE TABLE public.inventory_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT CHECK (movement_type IN ('TRANSFER', 'ADJUSTMENT', 'RETURN', 'SALE')) NOT NULL,
    quantity INTEGER NOT NULL,
    from_location TEXT, -- e.g., 'warehouse', 'supplier'
    to_location TEXT,   -- e.g., 'sales_floor', 'warehouse'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admin and Managers can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admin can modify profiles"
    ON public.profiles FOR ALL
    USING (public.get_current_user_role() = 'admin');

-- Products Policies
CREATE POLICY "Everyone can view products"
    ON public.products FOR SELECT
    USING (true);

CREATE POLICY "Manager and Admin can manage products"
    ON public.products FOR ALL
    USING (public.get_current_user_role() IN ('admin', 'manager', 'supervisor'));

-- Sales Policies
CREATE POLICY "Cashier, Manager, Admin can view sales"
    ON public.sales FOR SELECT
    USING (public.get_current_user_role() IN ('cashier', 'manager', 'admin', 'supervisor'));

CREATE POLICY "Cashier can insert sales"
    ON public.sales FOR INSERT
    WITH CHECK (public.get_current_user_role() IN ('cashier', 'manager', 'admin'));

-- Sale Items Policies
CREATE POLICY "Cashier, Manager, Admin can view sale items"
    ON public.sale_items FOR SELECT
    USING (public.get_current_user_role() IN ('cashier', 'manager', 'admin', 'supervisor'));

CREATE POLICY "Cashier can insert sale items"
    ON public.sale_items FOR INSERT
    WITH CHECK (public.get_current_user_role() IN ('cashier', 'manager', 'admin'));

-- Inventory Movements Policies
CREATE POLICY "Manager and Admin can manage inventory movements"
    ON public.inventory_movements FOR ALL
    USING (public.get_current_user_role() IN ('admin', 'manager', 'supervisor'));


-- ==============================================================================
-- 4. RPC FUNCTION: process_sale
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.process_sale(
    p_cart JSONB,
    p_total NUMERIC,
    p_seller_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id UUID;
    v_item JSONB;
    v_sku TEXT;
    v_name TEXT;
    v_qty INT;
    v_price NUMERIC;
    v_current_stock INT;
    v_product_id UUID;
BEGIN
    -- 1. Insert the main sale header
    INSERT INTO sales (seller_name, status, total)
    VALUES (p_seller_name, 'PAGADA', p_total)
    RETURNING id INTO v_sale_id;

    -- 2. Loop through each item in the JSONB cart payload
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart)
    LOOP
        v_sku := v_item->>'sku';
        v_name := v_item->>'nombre';
        v_qty := (v_item->>'cantidad')::INT;
        v_price := (v_item->>'precio_unitario')::NUMERIC;

        -- 3. Lock the product row for update to prevent race conditions (ATOMICITY)
        SELECT id, stock_sales_floor INTO v_product_id, v_current_stock
        FROM products
        WHERE sku = v_sku
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto con SKU % no encontrado', v_sku;
        END IF;

        IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Stock insuficiente para el SKU % (%) en piso de ventas. Stock actual: %, Solicitado: %', v_sku, v_name, v_current_stock, v_qty;
        END IF;

        -- 4. Deduct the stock from the sales floor
        UPDATE products
        SET stock_sales_floor = stock_sales_floor - v_qty
        WHERE sku = v_sku;

        -- 5. Insert the sale item detail
        INSERT INTO sale_items (sale_id, product_sku, quantity, unit_price)
        VALUES (v_sale_id, v_sku, v_qty, v_price);
        
        -- 6. Register the movement
        INSERT INTO inventory_movements (product_id, movement_type, quantity, from_location, to_location, notes)
        VALUES (v_product_id, 'SALE', v_qty, 'sales_floor', 'customer', 'Venta POS: ' || v_sale_id);

    END LOOP;

    -- Return a success payload with the generated sale_id
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'message', 'Venta procesada exitosamente'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error procesando la venta: %', SQLERRM;
END;
$$;
