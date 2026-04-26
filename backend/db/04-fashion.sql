-- Fashion products (32–43) — idempotent insert
INSERT INTO products (id, name, price, category, barcode, image_url, cheaper_alternative_id) VALUES
(32, 'Men''s Classic Cotton T-Shirt',        399.00, 'Fashion', '8902811012345', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&auto=format&q=75', NULL),
(33, 'Men''s Slim Fit Jeans',               1299.00, 'Fashion', '8902811023456', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&auto=format&q=75', NULL),
(34, 'Women''s Floral Printed Kurta',        699.00, 'Fashion', '8902811034567', 'https://images.unsplash.com/photo-1624989030543-a1a7e3f2ee5f?w=400&h=400&fit=crop&auto=format&q=75', NULL),
(35, 'Men''s Running Sports Shoes',         1799.00, 'Fashion', '8902811045678', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format&q=75', NULL),
(36, 'Women''s White Casual Sneakers',      1299.00, 'Fashion', '8902811056789', 'https://images.unsplash.com/photo-1551107696-a4b537da9451?w=400&h=400&fit=crop&auto=format&q=75', 35),
(37, 'Men''s Cotton Formal Shirt',           799.00, 'Fashion', '8902811067890', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop&auto=format&q=75', NULL),
(38, 'Women''s Stylish Tote Handbag',       1199.00, 'Fashion', '8902811078901', 'https://images.unsplash.com/photo-1548036161-b1dbf8c77b49?w=400&h=400&fit=crop&auto=format&q=75', NULL),
(39, 'Unisex UV-Protection Sunglasses',      699.00, 'Fashion', '8902811089012', 'https://images.unsplash.com/photo-1473496169904-071b6c3ca6d5?w=400&h=400&fit=crop&auto=format&q=75', NULL),
(40, 'Men''s Dry-Fit Sports Shorts',         499.00, 'Fashion', '8902811090123', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop&auto=format&q=75', 32),
(41, 'Women''s High-Waist Yoga Leggings',    599.00, 'Fashion', '8902811101234', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=400&fit=crop&auto=format&q=75', NULL),
(42, 'Men''s Genuine Leather Belt',          449.00, 'Fashion', '8902811112345', 'https://images.unsplash.com/photo-1553528788-403f651a6ee4?w=400&h=400&fit=crop&auto=format&q=75', NULL),
(43, 'Unisex Cotton Fleece Hoodie',         1499.00, 'Fashion', '8902811123456', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&auto=format&q=75', NULL)
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', 43, true);
