import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/ProductCard";
import { useCategories, useProducts } from "@/lib/shop";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  sort: z.enum(["popular", "price-asc", "price-desc", "rating", "newest"]).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  inStock: z.boolean().optional(),
  page: z.number().int().positive().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Shop all products — ShopSphere Pro" },
      { name: "description", content: "Browse and filter every product by category, price, rating and availability." },
      { property: "og:title", content: "Shop all products — ShopSphere Pro" },
      { property: "og:description", content: "Browse and filter every product by category, price, rating and availability." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products, isLoading } = useProducts();
  const { data: cats } = useCategories();
  const set = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({
      search: (prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }),
      replace: true,
    });

  const { list, brands, categoryCounts } = useMemo(() => {
    const cat = cats?.find((c) => c.slug === s.category);
    const all = products ?? [];
    const query = s.q?.trim().toLowerCase();
    const matching = all.filter((p) => {
      if (query && !`${p.name} ${p.brand} ${p.description} ${p.sku ?? ""}`.toLowerCase().includes(query)) return false;
      if (s.brand && p.brand !== s.brand) return false;
      if (s.min !== undefined && p.price < s.min) return false;
      if (s.max !== undefined && p.price > s.max) return false;
      if (s.inStock && p.stock < 1) return false;
      return true;
    });
    let r = matching.filter((p) => !cat || p.category_id === cat.id);
    const sorters: Record<string, (a: typeof r[0], b: typeof r[0]) => number> = {
      popular: (a, b) => b.rating_count - a.rating_count,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      newest: (a, b) => b.created_at.localeCompare(a.created_at),
    };
    r = [...r].sort(sorters[s.sort ?? "popular"]);
    return {
      list: r,
      brands: [...new Set(all.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
      categoryCounts: new Map((cats ?? []).map((category) => [
        category.id,
        matching.filter((p) => p.category_id === category.id).length,
      ])),
    };
  }, [products, cats, s]);

  const pageSize = 24;
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const page = Math.min(s.page ?? 1, pageCount);
  const visibleProducts = list.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">{s.q ? `Results for “${s.q}”` : cats?.find((c) => c.slug === s.category)?.name ?? "All products"}</h1>
      <div className="glass mt-6 flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm">
        <Input
          defaultValue={s.q}
          key={s.q}
          placeholder="Search"
          aria-label="Search"
          className="max-w-48"
          onKeyDown={(e) => e.key === "Enter" && set({ q: e.currentTarget.value || undefined })}
        />
        <select aria-label="Category" value={s.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })} className="h-9 rounded-md border bg-background px-2">
          <option value="">All categories</option>
          {cats?.map((c) => <option key={c.id} value={c.slug}>{c.name} ({categoryCounts.get(c.id) ?? 0})</option>)}
        </select>
        <select aria-label="Brand" value={s.brand ?? ""} onChange={(e) => set({ brand: e.target.value || undefined })} className="h-9 rounded-md border bg-background px-2">
          <option value="">All brands</option>
          {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
        <select aria-label="Minimum price" value={s.min ?? ""} onChange={(e) => set({ min: e.target.value ? Number(e.target.value) : undefined })} className="h-9 rounded-md border bg-background px-2">
          <option value="">Min price</option>
          <option value="25">$25+</option>
          <option value="50">$50+</option>
          <option value="100">$100+</option>
          <option value="250">$250+</option>
        </select>
        <select aria-label="Max price" value={s.max ?? ""} onChange={(e) => set({ max: e.target.value ? Number(e.target.value) : undefined })} className="h-9 rounded-md border bg-background px-2">
          <option value="">Any price</option>
          <option value="50">Under $50</option>
          <option value="150">Under $150</option>
          <option value="300">Under $300</option>
          <option value="600">Under $600</option>
          <option value="1200">Under $1,200</option>
        </select>
        <select aria-label="Sort" value={s.sort ?? "popular"} onChange={(e) => set({ sort: e.target.value as never })} className="h-9 rounded-md border bg-background px-2">
          <option value="popular">Most popular</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
          <option value="newest">Newest</option>
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!s.inStock} onChange={(e) => set({ inStock: e.target.checked || undefined })} />
          In stock only
        </label>
        <Button variant="ghost" size="sm" onClick={() => navigate({ search: {} })}>Clear</Button>
        <span className="ml-auto text-muted-foreground">{list.length} items</span>
      </div>
      <div className="mt-8">
        {!isLoading && list.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">No products match these filters.</p>
        ) : (
          <ProductGrid products={visibleProducts} loading={isLoading} />
        )}
      </div>
      {!isLoading && list.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, list.length)} of {list.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => set({ page: page + 1 })}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
