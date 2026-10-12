# Pixel Perfect View

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1b180bf9-0591-427c-97d5-e4e1081535a3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Product catalog and admin setup

The storefront reads its catalog from the Supabase `products` table. Apply
`supabase/migrations/20261012190000_expand_product_catalog.sql` to the existing
project using the Supabase migration workflow (or the SQL Editor). It safely
adds the catalog fields, creates any missing product categories, and inserts
104 additional products by slug, so rerunning it does not duplicate catalog
records. Product images use individual Unsplash image URLs.

Product creation, editing, archiving, and stock updates are available at
`/admin`. Product write policies require an explicit `admin` row in
`public.user_roles`; ordinary authenticated users cannot grant themselves
access. After applying the migration, an authorized project operator can
promote an existing account in the Supabase SQL Editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update set role = excluded.role;
```

Replace the example email with the intended account's email. Product deletion
in the dashboard archives a listing instead of physically removing it, so
existing carts and order history remain intact.
