-- VyaparIQ Seed Data: 30+ products across Grocery, Snacks, Essentials

INSERT INTO products (id, name, price, category, barcode, image_url, cheaper_alternative_id) VALUES

-- ── Grocery (1–12) ───────────────────────────────────────────────
( 1, 'Tata Salt (1 kg)',                 28.00, 'Grocery',    '8901725181802', NULL, NULL),
( 2, 'Aashirvaad Atta (5 kg)',          289.00, 'Grocery',    '8901063083103', NULL, NULL),
( 3, 'Fortune Sunflower Oil (1 L)',     155.00, 'Grocery',    '8901058854206', NULL,  4),
( 4, 'Gemini Sunflower Oil (1 L)',      130.00, 'Grocery',    '8901058854300', NULL, NULL),
( 5, 'Toor Dal (1 kg)',                 160.00, 'Grocery',    '8904067700012', NULL,  6),
( 6, 'Toor Dal Unbranded (1 kg)',       125.00, 'Grocery',    '0000000000006', NULL, NULL),
( 7, 'Basmati Rice (5 kg)',             450.00, 'Grocery',    '8901058002102', NULL,  8),
( 8, 'Sona Masoori Rice (5 kg)',        320.00, 'Grocery',    '8901058002200', NULL, NULL),
( 9, 'Sugar (1 kg)',                     46.00, 'Grocery',    '8901063040007', NULL, NULL),
(10, 'Mother Dairy Milk (1 L)',          64.00, 'Grocery',    '8906002480012', NULL, 11),
(11, 'Amul Taaza Milk (1 L)',            54.00, 'Grocery',    '8901262150132', NULL, NULL),
(12, 'Organic Honey (500 g)',           349.00, 'Grocery',    '8906079570012', NULL, NULL),

-- ── Snacks (13–22) ───────────────────────────────────────────────
(13, 'Lays Classic Salted (52 g)',       20.00, 'Snacks',     '8901491101813', NULL, 14),
(14, 'Balaji Wafers Salted (45 g)',      10.00, 'Snacks',     '8906002480100', NULL, NULL),
(15, 'Kurkure Masala Munch (90 g)',      20.00, 'Snacks',     '8901491502313', NULL, NULL),
(16, 'Haldiram Aloo Bhujia (200 g)',     55.00, 'Snacks',     '8904004401134', NULL, 17),
(17, 'Bikaji Aloo Bhujia (200 g)',       45.00, 'Snacks',     '8906002480200', NULL, NULL),
(18, 'Parle-G Biscuits (800 g)',         55.00, 'Snacks',     '8901725133510', NULL, NULL),
(19, 'Britannia Good Day (250 g)',       45.00, 'Snacks',     '8901063010109', NULL, NULL),
(20, 'Dark Fantasy Choco Fills (75 g)',  40.00, 'Snacks',     '8901063058002', NULL, NULL),
(21, 'Cadbury Dairy Milk (50 g)',        50.00, 'Snacks',     '8901233020129', NULL, 22),
(22, 'Amul Dark Chocolate (50 g)',       40.00, 'Snacks',     '8901262350013', NULL, NULL),

-- ── Essentials (23–34) ───────────────────────────────────────────
(23, 'Surf Excel Detergent (1 kg)',     199.00, 'Essentials', '8901030602115', NULL, 24),
(24, 'Ghadi Detergent (1 kg)',           79.00, 'Essentials', '8901030602200', NULL, NULL),
(25, 'Colgate MaxFresh (150 g)',         95.00, 'Essentials', '8901314301109', NULL, 26),
(26, 'Pepsodent Toothpaste (150 g)',     72.00, 'Essentials', '8901030522017', NULL, NULL),
(27, 'Dettol Soap (125 g)',              49.00, 'Essentials', '8901396373216', NULL, 28),
(28, 'Lifebuoy Soap (125 g)',            38.00, 'Essentials', '8901030020308', NULL, NULL),
(29, 'Vim Dishwash Bar (200 g)',         22.00, 'Essentials', '8901030544002', NULL, NULL),
(30, 'Harpic Toilet Cleaner (500 ml)',   95.00, 'Essentials', '8901200003102', NULL, NULL),
(31, 'Parachute Coconut Oil (200 ml)',   95.00, 'Essentials', '8904067700210', NULL, 32),
(32, 'KLF Coconut Oil (200 ml)',         75.00, 'Essentials', '8906002480300', NULL, NULL),
(33, 'Scotch-Brite Scrub Pad (3 pk)',    55.00, 'Essentials', '8901030640200', NULL, NULL),
(34, 'Garbage Bags (30 pk)',             80.00, 'Essentials', '8906002480400', NULL, NULL);

-- ── Admin User ──────────────────────────────────────────────────
INSERT INTO users (name, first_name, last_name, email, password_hash, role, provider)
VALUES (
  'Admin',
  'Admin',
  'User',
  'admin@vyapariq.com',
  '$2a$10$7Mt1hH3HJm5AVAUuPIst6e2YRfe6rFGIwNvTAjQXlH6XeldFU.V0.',
  'admin',
  'local'
)
ON CONFLICT (email) DO UPDATE SET role = 'admin';

ON CONFLICT (id) DO NOTHING;

-- Reset the sequence to continue after the last seeded id
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
