create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  image text not null,
  created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  brand text not null default '',
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  image text not null,
  stock int not null default 0,
  rating numeric(2,1) not null default 0,
  rating_count int not null default 0,
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);
create table public.wishlist_items (
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create table public.cart_items (
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null default 'confirmed',
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null,
  total numeric(10,2) not null,
  full_name text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  phone text not null,
  created_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  image text not null,
  price numeric(10,2) not null,
  quantity int not null
);
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

grant select on public.categories, public.products, public.reviews to anon, authenticated;
grant insert, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.wishlist_items, public.cart_items to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant all on public.categories, public.products, public.reviews, public.wishlist_items, public.cart_items, public.orders, public.order_items, public.newsletter_subscribers to service_role;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "public read categories" on public.categories for select using (true);
create policy "public read products" on public.products for select using (true);
create policy "public read reviews" on public.reviews for select using (true);
create policy "own review insert" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "own review delete" on public.reviews for delete to authenticated using (auth.uid() = user_id);
create policy "own wishlist" on public.wishlist_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own cart" on public.cart_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own orders" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "anyone subscribe" on public.newsletter_subscribers for insert with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

create or replace function public.place_order(_full_name text, _address text, _city text, _postal_code text, _phone text)
returns uuid language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _sub numeric; _ship numeric; _oid uuid; _bad int;
begin
  if _uid is null then raise exception 'Not signed in'; end if;
  if coalesce(trim(_full_name),'')='' or coalesce(trim(_address),'')='' or coalesce(trim(_city),'')='' or coalesce(trim(_postal_code),'')='' or coalesce(trim(_phone),'')='' then raise exception 'All shipping fields are required'; end if;
  select count(*) into _bad from cart_items c join products p on p.id=c.product_id where c.user_id=_uid and c.quantity>p.stock;
  if _bad>0 then raise exception 'Some items are out of stock'; end if;
  select sum(p.price*c.quantity) into _sub from cart_items c join products p on p.id=c.product_id where c.user_id=_uid;
  if _sub is null then raise exception 'Cart is empty'; end if;
  _ship := case when _sub >= 100 then 0 else 9.99 end;
  insert into orders(user_id,subtotal,shipping,total,full_name,address,city,postal_code,phone)
  values(_uid,_sub,_ship,_sub+_ship,_full_name,_address,_city,_postal_code,_phone) returning id into _oid;
  insert into order_items(order_id,product_id,name,image,price,quantity)
  select _oid,p.id,p.name,p.image,p.price,c.quantity from cart_items c join products p on p.id=c.product_id where c.user_id=_uid;
  update products p set stock = p.stock - c.quantity from cart_items c where c.product_id=p.id and c.user_id=_uid;
  delete from cart_items where user_id=_uid;
  return _oid;
end $$;
revoke all on function public.place_order(text,text,text,text,text) from public, anon;
grant execute on function public.place_order(text,text,text,text,text) to authenticated;

insert into public.categories (slug,name,image) values
('audio','Audio','/images/headphones.jpg'),
('wearables','Wearables','/images/watch.jpg'),
('home','Home','/images/lamp.jpg'),
('fashion','Fashion','/images/sneakers.jpg');

insert into public.products (slug,name,description,category_id,brand,price,compare_at_price,image,stock,rating,rating_count,is_featured,is_trending) values
('aurora-headphones','Aurora Wireless Headphones','Studio-grade sound with adaptive noise cancelling and 40-hour battery life.',(select id from categories where slug='audio'),'Sonique',249.00,329.00,'/images/headphones.jpg',24,4.8,312,true,true),
('pulse-earbuds','Pulse Earbuds','Compact true-wireless earbuds with spatial audio and a pocket-sized charging case.',(select id from categories where slug='audio'),'Sonique',129.00,null,'/images/earbuds.jpg',58,4.5,188,false,true),
('orbit-speaker','Orbit Smart Speaker','Room-filling 360° sound with a built-in voice assistant.',(select id from categories where slug='audio'),'Orbit',179.00,199.00,'/images/speaker.jpg',0,4.4,96,true,false),
('nova-watch','Nova Smartwatch','Always-on display, health tracking and seven-day battery.',(select id from categories where slug='wearables'),'Nova',299.00,349.00,'/images/watch.jpg',17,4.7,421,true,true),
('lumen-lamp','Lumen Desk Lamp','Sculpted aluminium lamp with warm-to-cool dimming.',(select id from categories where slug='home'),'Lumen',89.00,null,'/images/lamp.jpg',40,4.6,77,false,true),
('ember-mug','Ember Ceramic Mug Set','Hand-glazed set of two stoneware mugs.',(select id from categories where slug='home'),'Kiln',39.00,49.00,'/images/mug.jpg',120,4.3,54,false,false),
('stride-sneakers','Stride Runner Sneakers','Lightweight knit runners with responsive foam soles.',(select id from categories where slug='fashion'),'Stride',139.00,169.00,'/images/sneakers.jpg',33,4.6,203,true,true),
('voyage-backpack','Voyage Backpack','Weatherproof everyday pack with a padded laptop sleeve.',(select id from categories where slug='fashion'),'Voyage',119.00,null,'/images/backpack.jpg',9,4.5,140,false,false);