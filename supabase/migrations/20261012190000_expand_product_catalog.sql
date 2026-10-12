alter table public.products
  add column if not exists sku text,
  add column if not exists variants jsonb not null default '[]'::jsonb,
  add column if not exists is_best_seller boolean not null default false,
  add column if not exists is_active boolean not null default true;

update public.products
set sku = 'SSP-' || upper(replace(slug, '-', ''))
where sku is null;

alter table public.products
  alter column sku set not null;

create unique index if not exists products_sku_key on public.products (sku);

alter table public.products
  add column if not exists availability_status text
  generated always as (
    case when is_active and stock > 0 then 'in_stock' else 'out_of_stock' end
  ) stored;

insert into public.categories (slug, name, image) values
  ('electronics', 'Electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85'),
  ('home-living', 'Home & Living', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85'),
  ('beauty-personal-care', 'Beauty & Personal Care', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85'),
  ('sports-fitness', 'Sports & Fitness', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85'),
  ('books-stationery', 'Books & Stationery', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85'),
  ('gaming', 'Gaming', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=85'),
  ('accessories', 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85')
on conflict (slug) do nothing;

with catalog (slug, name, category_slug, brand, price, photo_id) as (
  values
    ('aero-5g-smartphone', 'Aero 5G Smartphone', 'electronics', 'Aero Mobile', 699.00, '1511707171634-5f897ff02aa9'),
    ('pixelwave-pro-phone', 'Pixelwave Pro Smartphone', 'electronics', 'Pixelwave', 849.00, '1598327105666-5b89351aff97'),
    ('terra-compact-phone', 'Terra Compact Smartphone', 'electronics', 'Terra', 579.00, '1512499617640-c74ae3a79d37'),
    ('zenith-ultrabook-14', 'Zenith 14-inch Ultrabook', 'electronics', 'Zenith', 1199.00, '1498050108023-c5249f4df085'),
    ('northstar-creator-laptop', 'Northstar Creator Laptop', 'electronics', 'Northstar', 1549.00, '1496181133206-80ce9b88a853'),
    ('fieldnote-business-laptop', 'Fieldnote Business Laptop', 'electronics', 'Fieldnote', 999.00, '1588872657578-7efd1f1555ed'),
    ('vista-11-tablet', 'Vista 11-inch Tablet', 'electronics', 'Vista', 449.00, '1544244015-0df4b3ffc6b0'),
    ('canvas-pro-tablet', 'Canvas Pro Drawing Tablet', 'electronics', 'Canvas', 729.00, '1561154464-82e9adf32764'),
    ('sonata-studio-headphones', 'Sonata Studio Headphones', 'electronics', 'Sonata', 219.00, '1505740420928-5e560c06d30e'),
    ('echo-beat-wireless-earbuds', 'EchoBeat Wireless Earbuds', 'electronics', 'EchoBeat', 99.00, '1606220945770-b5b6c2c55bf1'),
    ('pulsefit-smartwatch', 'PulseFit Smartwatch', 'electronics', 'PulseFit', 249.00, '1523275335684-37898b6baf30'),
    ('horizon-4k-monitor', 'Horizon 4K Monitor', 'electronics', 'Horizon', 389.00, '1527443224154-c4a3942d3acf'),
    ('atlas-mirrorless-camera', 'Atlas Mirrorless Camera', 'electronics', 'Atlas Imaging', 1099.00, '1516035069371-29a1b244cc32'),

    ('everyday-cotton-tee', 'Everyday Cotton T-shirt', 'fashion', 'Common Thread', 28.00, '1521572163474-6864f9cf17ab'),
    ('harbor-linen-shirt', 'Harbor Linen Shirt', 'fashion', 'Harbor & Field', 64.00, '1596755094514-f87e34085b2c'),
    ('studio-oxford-shirt', 'Studio Oxford Shirt', 'fashion', 'Northline', 72.00, '1603252109303-2751441dd157'),
    ('selvedge-straight-jeans', 'Selvedge Straight Jeans', 'fashion', 'Blue Ridge', 89.00, '1542272604-787c3835535d'),
    ('weekender-denim-jacket', 'Weekender Denim Jacket', 'fashion', 'Blue Ridge', 118.00, '1543076447-215ad9ba6923'),
    ('marlow-trench-coat', 'Marlow Cotton Trench Coat', 'fashion', 'Marlow', 189.00, '1539533018447-63fcce2678e3'),
    ('willow-wrap-dress', 'Willow Wrap Dress', 'fashion', 'Willow Lane', 112.00, '1595777457583-95e059d581b8'),
    ('solstice-midi-dress', 'Solstice Midi Dress', 'fashion', 'Solstice', 138.00, '1496747611176-843222e1e57c'),
    ('stride-knit-sneakers', 'Stride Knit Sneakers', 'fashion', 'Stride', 124.00, '1495555961986-6d4c1ecb7be3'),
    ('courtline-classic-sneakers', 'Courtline Classic Sneakers', 'fashion', 'Courtline', 96.00, '1525966222134-fcfa99b8ae77'),
    ('summit-trail-shoes', 'Summit Trail Shoes', 'fashion', 'Summit Works', 144.00, '1552346154-21d32810aba3'),
    ('arc-crossbody-bag', 'Arc Everyday Crossbody Bag', 'fashion', 'Arc Studio', 78.00, '1584917865442-de89df76afd3'),
    ('atelier-leather-belt', 'Atelier Leather Belt', 'fashion', 'Atelier Goods', 52.00, '1490481651871-ab68de25d43d'),

    ('solace-accent-chair', 'Solace Upholstered Accent Chair', 'home-living', 'Solace Home', 349.00, '1567538096630-e0c55bd6374c'),
    ('ridge-oak-coffee-table', 'Ridge Oak Coffee Table', 'home-living', 'Ridge & Co.', 279.00, '1499933374294-4584851497cc'),
    ('haven-platform-bed', 'Haven Platform Bed Frame', 'home-living', 'Haven Living', 799.00, '1505693416388-ac5ce068fe85'),
    ('cloud-weave-bedsheet-set', 'Cloud Weave Bedsheet Set', 'home-living', 'Cloud Weave', 89.00, '1631049307264-da0ec9d70304'),
    ('linen-drift-duvet-cover', 'Linen Drift Duvet Cover', 'home-living', 'Linen Drift', 129.00, '1616486338812-3dadae4b4ace'),
    ('halo-ceramic-table-lamp', 'Halo Ceramic Table Lamp', 'home-living', 'Halo House', 74.00, '1507473885765-e6ed057f782c'),
    ('arc-floor-lamp', 'Arc Floor Lamp', 'home-living', 'Arc House', 189.00, '1513506003901-1e6a229e2d15'),
    ('bloom-compact-air-fryer', 'Bloom Compact Air Fryer', 'home-living', 'Bloom Kitchen', 119.00, '1585515320310-259814833e62'),
    ('puresteam-electric-kettle', 'PureSteam Electric Kettle', 'home-living', 'PureSteam', 68.00, '1578500494198-246f612d3b3d'),
    ('hearth-cast-iron-cookware', 'Hearth Cast Iron Cookware Set', 'home-living', 'Hearth & Iron', 159.00, '1556911220-e15b29be8c8f'),
    ('modular-pantry-organizer', 'Modular Pantry Organizer Set', 'home-living', 'Neat Nest', 46.00, '1600585154340-be6161a56a0c'),
    ('archway-wall-mirror', 'Archway Wall Mirror', 'home-living', 'Archway Home', 139.00, '1618221195710-dd6b41faaea6'),
    ('meadow-stoneware-vase', 'Meadow Stoneware Vase', 'home-living', 'Meadow Studio', 58.00, '1578749556568-bc2c40e68b61'),

    ('daily-glow-vitamin-c-serum', 'Daily Glow Vitamin C Serum', 'beauty-personal-care', 'Kindred Skin', 34.00, '1608248543803-ba4f8c70ae0b'),
    ('barrier-repair-moisturizer', 'Barrier Repair Moisturizer', 'beauty-personal-care', 'Kindred Skin', 29.00, '1556229010-6c3f2c9ca5f8'),
    ('mineral-shield-sunscreen', 'Mineral Shield SPF 50 Sunscreen', 'beauty-personal-care', 'SunKind', 26.00, '1556228720-195a672e8a03'),
    ('calm-cloud-cleanser', 'Calm Cloud Facial Cleanser', 'beauty-personal-care', 'Calm Cloud', 22.00, '1556228578-0d85b1a4d571'),
    ('midnight-hydration-mask', 'Midnight Hydration Mask', 'beauty-personal-care', 'Nocturne', 38.00, '1570172619644-dfd03ed5d881'),
    ('botanical-scalp-shampoo', 'Botanical Scalp Shampoo', 'beauty-personal-care', 'Root Ritual', 24.00, '1608571423902-eed4a5ad8108'),
    ('silk-protein-conditioner', 'Silk Protein Conditioner', 'beauty-personal-care', 'Root Ritual', 25.00, '1620916566398-39f1143ab7be'),
    ('ceramic-airflow-hair-dryer', 'Ceramic Airflow Hair Dryer', 'beauty-personal-care', 'Form & Flow', 89.00, '1522338242992-e1a54906a8da'),
    ('precision-beard-trimmer', 'Precision Beard Trimmer', 'beauty-personal-care', 'Goodform', 59.00, '1621607512214-68297480165e'),
    ('sensitive-skin-shave-kit', 'Sensitive Skin Shave Kit', 'beauty-personal-care', 'Goodform', 42.00, '1556905055-8f358a7a47b2'),
    ('soft-touch-makeup-brush-set', 'Soft Touch Makeup Brush Set', 'beauty-personal-care', 'Mira Beauty', 36.00, '1522335789203-aabd1fc54bc9'),
    ('reusable-silicone-face-pads', 'Reusable Silicone Face Pads', 'beauty-personal-care', 'Kindred Skin', 14.00, '1601049541289-9b1b7bbbfe19'),
    ('cedar-hand-care-duo', 'Cedar Hand Care Duo', 'beauty-personal-care', 'Cedar & Coast', 31.00, '1598440947619-2c35fc9aa908'),

    ('tempo-training-t-shirt', 'Tempo Training T-shirt', 'sports-fitness', 'Tempo Athletics', 38.00, '1539109136881-3be0616acf4b'),
    ('motion-high-rise-leggings', 'Motion High-Rise Leggings', 'sports-fitness', 'Tempo Athletics', 68.00, '1515886657613-9f3515b0c78f'),
    ('trailmark-running-shorts', 'Trailmark Running Shorts', 'sports-fitness', 'Trailmark', 42.00, '1599058917212-d750089bc07e'),
    ('grip-control-football', 'Grip Control Football', 'sports-fitness', 'Matchday', 32.00, '1517466787929-bc90951d0974'),
    ('club-pro-cricket-bat', 'Club Pro Cricket Bat', 'sports-fitness', 'WillowCraft', 149.00, '1531415074968-036ba1b575da'),
    ('match-ready-cricket-ball-set', 'Match-Ready Cricket Ball Set', 'sports-fitness', 'WillowCraft', 44.00, '1521412644187-c49fa049e84d'),
    ('grounded-cork-yoga-mat', 'Grounded Cork Yoga Mat', 'sports-fitness', 'Grounded', 59.00, '1592432678016-e910b452f9a2'),
    ('align-yoga-block-pair', 'Align Yoga Block Pair', 'sports-fitness', 'Align Studio', 24.00, '1593811167562-9cef47bfc4d7'),
    ('core-loop-resistance-bands', 'Core Loop Resistance Bands', 'sports-fitness', 'Core Loop', 19.00, '1517836357463-d25dfeac3438'),
    ('ironpath-adjustable-dumbbells', 'Ironpath Adjustable Dumbbells', 'sports-fitness', 'Ironpath', 229.00, '1583454110551-21f2fa2afe61'),
    ('summit-insulated-hiking-bottle', 'Summit Insulated Hiking Bottle', 'sports-fitness', 'Summit Works', 36.00, '1602143407151-7111542de6e8'),
    ('wildland-two-person-tent', 'Wildland Two-Person Tent', 'sports-fitness', 'Wildland', 219.00, '1504280390367-361c6d9f38f4'),
    ('stridefoam-recovery-roller', 'StrideFoam Recovery Roller', 'sports-fitness', 'Stride Recovery', 28.00, '1518611012118-696072aa579a'),

    ('practical-typescript-patterns', 'Practical TypeScript Patterns', 'books-stationery', 'Brightleaf Press', 42.00, '1507842217343-583bb7270b66'),
    ('modern-react-workshop', 'The Modern React Workshop', 'books-stationery', 'Brightleaf Press', 48.00, '1532012197267-da84d127e765'),
    ('designing-data-systems', 'Designing Reliable Data Systems', 'books-stationery', 'Fieldnotes Publishing', 54.00, '1544947950-fa07a98d237f'),
    ('the-last-lighthouse-novel', 'The Last Lighthouse', 'books-stationery', 'Juniper House', 18.00, '1543002588-bfa74002ed7e'),
    ('paper-gardens-novel', 'Paper Gardens', 'books-stationery', 'Juniper House', 16.00, '1519682337058-a94d519337bc'),
    ('orbit-of-small-things-novel', 'The Orbit of Small Things', 'books-stationery', 'North Window', 21.00, '1512820790803-83ca734da794'),
    ('dot-grid-project-notebook', 'Dot Grid Project Notebook', 'books-stationery', 'Margin Paper Co.', 14.00, '1531346878377-a5be20888e57'),
    ('linen-bound-journal', 'Linen-Bound Journal', 'books-stationery', 'Margin Paper Co.', 22.00, '1517842645767-c639042777db'),
    ('studio-gel-pen-set', 'Studio Gel Pen Set', 'books-stationery', 'Line & Loop', 12.00, '1455390582262-044cdead277a'),
    ('precision-fountain-pen', 'Precision Fountain Pen', 'books-stationery', 'Line & Loop', 49.00, '1583485088034-697b5bc54ccd'),
    ('desk-planner-weekly', 'Desk Planner Weekly Pad', 'books-stationery', 'Daymark', 17.00, '1506784983877-45594efa4cbe'),
    ('stackable-document-trays', 'Stackable Document Trays', 'books-stationery', 'Daymark', 32.00, '1497366754035-f200968a6e72'),
    ('softcover-sketchbook-set', 'Softcover Sketchbook Set', 'books-stationery', 'Margin Paper Co.', 26.00, '1513364776144-60967b0f800f'),

    ('nexus-wireless-gamepad', 'Nexus Wireless Game Controller', 'gaming', 'Nexus Play', 69.00, '1593305841991-05c297ba4575'),
    ('tournament-mechanical-keyboard', 'Tournament Mechanical Gaming Keyboard', 'gaming', 'Keyforge', 129.00, '1595225476474-87563907a212'),
    ('phantom-lightweight-gaming-mouse', 'Phantom Lightweight Gaming Mouse', 'gaming', 'Keyforge', 79.00, '1527814050087-3793815479db'),
    ('arena-surround-gaming-headset', 'Arena Surround Gaming Headset', 'gaming', 'Arena Sound', 119.00, '1599669454699-248893623440'),
    ('tactile-compact-gamepad', 'Tactile Compact Gamepad', 'gaming', 'Nexus Play', 54.00, '1606144042614-b2417e99c4e3'),
    ('victory-xl-desk-mat', 'Victory XL Desk Mat', 'gaming', 'Victory Gear', 34.00, '1612287230202-1ff1d85d1bdf'),
    ('streamline-usb-microphone', 'Streamline USB Gaming Microphone', 'gaming', 'Streamline Audio', 99.00, '1590602847861-f357a9332bbc'),
    ('prism-rgb-light-bars', 'Prism RGB Light Bar Pair', 'gaming', 'Prism Play', 46.00, '1550745165-9bc0b252726f'),
    ('rapidfire-wireless-mouse', 'Rapidfire Wireless Gaming Mouse', 'gaming', 'Keyforge', 94.00, '1615663245857-ac93bb7c39e7'),
    ('ironclad-controller-dock', 'Ironclad Dual Controller Dock', 'gaming', 'Ironclad', 39.00, '1580327344181-c1163234e5a0'),
    ('questlink-vr-cable-kit', 'QuestLink VR Cable Kit', 'gaming', 'QuestLink', 29.00, '1593508512255-86ab42a8e620'),
    ('overclock-laptop-cooling-stand', 'Overclock Laptop Cooling Stand', 'gaming', 'Overclock', 58.00, '1525547719571-a2d4ac8945e2'),
    ('checkpoint-console-carry-case', 'Checkpoint Console Carry Case', 'gaming', 'Checkpoint', 44.00, '1595246140625-573b715d11dc'),

    ('daybreak-commuter-backpack', 'Daybreak Commuter Backpack', 'accessories', 'Daybreak', 88.00, '1553062407-98eeb64c6a62'),
    ('ridgeway-travel-backpack', 'Ridgeway Travel Backpack', 'accessories', 'Ridgeway', 142.00, '1622560480654-d96214fdc887'),
    ('slimfold-leather-wallet', 'Slimfold Leather Wallet', 'accessories', 'Stillwell Goods', 64.00, '1627123424574-724758594e93'),
    ('harbor-cardholder-wallet', 'Harbor Cardholder Wallet', 'accessories', 'Stillwell Goods', 38.00, '1548036328-c9fa89d128fa'),
    ('coastline-polarized-sunglasses', 'Coastline Polarized Sunglasses', 'accessories', 'Coastline', 96.00, '1511499767150-a48a237f0083'),
    ('solstice-round-sunglasses', 'Solstice Round Sunglasses', 'accessories', 'Solstice', 82.00, '1517841905240-472988babdf9'),
    ('heritage-field-watch', 'Heritage Field Watch', 'accessories', 'Heritage Works', 189.00, '1524805444758-089113d48a6d'),
    ('meridian-minimal-watch', 'Meridian Minimal Watch', 'accessories', 'Meridian', 159.00, '1523170335258-f5ed11844a49'),
    ('carry-on-compression-cubes', 'Carry-On Compression Cubes', 'accessories', 'Roam Ready', 36.00, '1581553680321-4fffae59fccd'),
    ('weekend-leather-duffel', 'Weekend Leather Duffel Bag', 'accessories', 'Roam Ready', 229.00, '1577733966973-d680bffd2e80'),
    ('atlas-passport-organizer', 'Atlas Passport Organizer', 'accessories', 'Atlas Travel', 42.00, '1553531384-411a247ccd73'),
    ('voyager-luggage-scale', 'Voyager Digital Luggage Scale', 'accessories', 'Atlas Travel', 24.00, '1565026057447-bc90a3dceb87'),
    ('everyday-canvas-tote', 'Everyday Canvas Tote', 'accessories', 'Common Thread', 32.00, '1590874103328-eac38a683ce7')
)
insert into public.products (
  slug, sku, name, description, category_id, brand, price, compare_at_price,
  image, stock, rating, rating_count, is_featured, is_trending, is_best_seller, variants
)
select
  c.slug,
  'SSP-' || upper(replace(c.slug, '-', '')),
  c.name,
  case c.category_slug
    when 'electronics' then c.name || ' by ' || c.brand || ' is designed for dependable everyday performance, intuitive setup and practical use at home, work or on the move. Thoughtful details and durable construction make it a versatile choice for daily routines.'
    when 'fashion' then c.name || ' by ' || c.brand || ' pairs comfortable materials with considered construction and an easy-to-style finish. Designed for repeat wear, it works across casual plans, workdays and weekends.'
    when 'home-living' then c.name || ' by ' || c.brand || ' brings practical function and balanced style to everyday spaces. Considered details and versatile design make it easy to pair with a range of home interiors and routines.'
    when 'beauty-personal-care' then c.name || ' by ' || c.brand || ' is designed for convenient, comfortable personal-care routines at home. Its approachable design and practical everyday usability make it easy to incorporate into your regular care essentials.'
    when 'sports-fitness' then c.name || ' by ' || c.brand || ' supports regular practice, training and active days with dependable everyday performance. Practical construction and comfortable handling make it suitable for a range of routines and experience levels.'
    when 'books-stationery' then c.name || ' from ' || c.brand || ' is a thoughtful addition to a personal library, study space or work desk. Carefully selected for useful ideas and everyday utility, it suits readers, students and makers alike.'
    when 'gaming' then c.name || ' by ' || c.brand || ' is designed for responsive, comfortable play with practical controls and durable construction. It fits naturally into a gaming desk or console setup for focused sessions and everyday use.'
    else c.name || ' by ' || c.brand || ' is an easy-to-carry everyday essential with practical organization and considered materials. Ready for commuting, travel and daily errands, it helps keep your everyday kit close at hand.'
  end,
  cat.id,
  c.brand,
  c.price,
  round((c.price * 1.16)::numeric, 2),
  'https://images.unsplash.com/photo-' || c.photo_id || '?auto=format&fit=crop&w=900&q=85',
  8 + (row_number() over (order by c.slug)::int * 17 % 90),
  (4.1 + (row_number() over (order by c.slug)::int % 9) * 0.1)::numeric(2,1),
  28 + (row_number() over (order by c.slug)::int * 19 % 470),
  row_number() over (order by c.slug)::int % 17 = 1,
  row_number() over (order by c.slug)::int % 4 = 0,
  row_number() over (order by c.slug)::int % 5 = 0,
  case
    when c.category_slug in ('fashion', 'sports-fitness') then
      jsonb_build_object('sizes', jsonb_build_array('S', 'M', 'L', 'XL'), 'colors', jsonb_build_array('Black', 'Navy', 'Stone'))
    when c.category_slug = 'accessories' then
      jsonb_build_object('colors', jsonb_build_array('Black', 'Tan', 'Olive'))
    when c.category_slug = 'electronics' then
      jsonb_build_object('colors', jsonb_build_array('Graphite', 'Silver', 'Blue'))
    else '[]'::jsonb
  end
from catalog c
join public.categories cat on cat.slug = c.category_slug
on conflict (slug) do nothing;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin'))
);

alter table public.user_roles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products"
  on public.products for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
