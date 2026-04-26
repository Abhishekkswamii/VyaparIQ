-- Sync DB product catalog to match src/data/products.ts exactly
-- Safe to re-run: clears dependent rows first, then replaces products.

BEGIN;

-- Clear dependent tables (no real orders exist yet)
DELETE FROM order_items;
DELETE FROM expense_logs;
DELETE FROM cart_items;
DELETE FROM orders;

-- Remove old seed products
DELETE FROM products;

-- Reset sequence
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Insert all 16 products (cheaperAlternativeId resolved after)
INSERT INTO products (id, name, price, category, barcode, image_url, cheaper_alternative_id) VALUES
 (1,  'Organic Bananas (6 pcs)',        45.00,  'Fruits',     '8901030840215', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (2,  'Full Cream Milk (1L)',           68.00,  'Dairy',      '8901233019826', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (3,  'Whole Wheat Bread',             45.00,  'Bakery',     '8901063010215', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (4,  'Farm Fresh Eggs (12)',          120.00,  'Dairy',      '8901725181130', 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (5,  'Avocados (3 pack)',             199.00,  'Fruits',     '8901058851438', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (6,  'Chicken Breast (500g)',         279.00,  'Meat',       '8901491101745', 'https://images.unsplash.com/photo-1604503468506-a8da13d11d36?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (7,  'Basmati Rice (1kg)',             89.00,  'Grains',     '8901425018963', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (8,  'Extra Virgin Olive Oil (500ml)',549.00,  'Pantry',     '8901396512370', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (9,  'Roma Tomatoes (1kg)',            40.00,  'Vegetables', '8901764710238', 'https://images.unsplash.com/photo-1546094096-0df4bcaad337?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (10, 'Baby Spinach (200g)',            55.00,  'Vegetables', '8901030715921', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (11, 'Cheddar Cheese (200g)',         250.00,  'Dairy',      NULL,            'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (12, 'Greek Yogurt (400g)',           119.00,  'Dairy',      NULL,            'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (13, 'Fresh Orange Juice (1L)',       149.00,  'Beverages',  NULL,            'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (14, 'Salted Butter (500g)',          280.00,  'Dairy',      NULL,            'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (15, 'Penne Pasta (500g)',            119.00,  'Grains',     NULL,            'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (16, 'Red Apples (1kg)',              159.00,  'Fruits',     NULL,            'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop&auto=format&q=75', NULL),

-- ── Electronics (17–31) ─────────────────────────────────────────────────
 (17, 'Redmi Note 13 5G (6GB+128GB)',    15999.00, 'Electronics', '6934177793202', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (18, 'Samsung Galaxy M34 5G (6GB+128GB)',18499.00,'Electronics', '8806095043907', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (19, 'Realme Narzo N55 (4GB+64GB)',       9999.00, 'Electronics', '6941399097106', 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (20, 'iQOO Z9 5G (8GB+128GB)',           19999.00, 'Electronics', '6935117892528', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (21, 'boAt Airdopes 141 TWS Earbuds',      799.00, 'Electronics', '8906084452341', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (22, 'Sony WH-1000XM5 Headphones',       26990.00, 'Electronics', '4548736132726', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (23, 'Mi Smart LED TV 32" HD Ready',     11999.00, 'Electronics', '6934177754906', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (24, 'Mi Power Bank 3i 20000mAh',         1499.00, 'Electronics', '6934177752803', 'https://images.unsplash.com/photo-1609241593136-4f8d0e321fcb?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (25, 'Realme Buds Air 5 TWS',             3999.00, 'Electronics', '6941399073353', 'https://images.unsplash.com/photo-1606400082859-9c68fde9b3ba?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (26, 'JBL Go 3 Bluetooth Speaker',        2999.00, 'Electronics', '6925281988457', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (27, 'Logitech MK215 Wireless Combo',     1195.00, 'Electronics', '5099206027152', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (28, 'Samsung Evo Plus 64GB microSD',      699.00, 'Electronics', '8806092698093', 'https://images.unsplash.com/photo-1591815302525-756a9bcc3425?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (29, 'TP-Link Archer C6 AC1200 Router',   2199.00, 'Electronics', '6935364080885', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (30, 'Syska Smart LED Bulb 9W',            399.00, 'Electronics', '8906049120459', 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&h=400&fit=crop&auto=format&q=75', NULL),
 (31, 'Noise ColorFit Pro 5 Smartwatch',   2499.00, 'Electronics', '8906159402345', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop&auto=format&q=75', NULL);

-- Wire up cheaper alternatives (after all rows exist)
UPDATE products SET cheaper_alternative_id = 1  WHERE id = 5;   -- Avocados        → Bananas
UPDATE products SET cheaper_alternative_id = 12 WHERE id = 11;  -- Cheddar         → Greek Yogurt
UPDATE products SET cheaper_alternative_id = 7  WHERE id = 15;  -- Pasta           → Basmati Rice
UPDATE products SET cheaper_alternative_id = 1  WHERE id = 16;  -- Apples          → Bananas
UPDATE products SET cheaper_alternative_id = 17 WHERE id = 18;  -- Samsung M34     → Redmi Note 13
UPDATE products SET cheaper_alternative_id = 21 WHERE id = 22;  -- Sony XM5        → boAt Airdopes
UPDATE products SET cheaper_alternative_id = 21 WHERE id = 25;  -- Realme Buds Air → boAt Airdopes

-- Advance sequence past 31 so future inserts don't collide
SELECT setval('products_id_seq', 31, true);

COMMIT;
