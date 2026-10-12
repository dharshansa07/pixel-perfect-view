import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  useAuth,
  useCategories,
  useIsAdmin,
  useProducts,
  type Product,
  discountPct,
  money,
} from "@/lib/shop";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Product management — ShopSphere Pro" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminProducts,
});

type ProductDraft = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  category_id: string;
  brand: string;
  price: string;
  compare_at_price: string;
  image: string;
  stock: string;
  rating: string;
  rating_count: string;
  variants: string;
  is_featured: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
};

const emptyDraft: ProductDraft = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  category_id: "",
  brand: "",
  price: "",
  compare_at_price: "",
  image: "",
  stock: "0",
  rating: "0",
  rating_count: "0",
  variants: "[]",
  is_featured: false,
  is_trending: false,
  is_best_seller: false,
};

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a unique lowercase slug with hyphens"),
  sku: z.string().trim().min(3).max(64),
  description: z.string().trim().min(10).max(5000),
  category_id: z.string().uuid("Choose a category"),
  brand: z.string().trim().min(1).max(100),
  price: z.number().positive(),
  compare_at_price: z.number().positive().nullable(),
  image: z
    .string()
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//.test(value),
      "Use an image URL or a local path",
    ),
  stock: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  rating_count: z.number().int().nonnegative(),
});

function draftFromProduct(product: Product): ProductDraft {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    category_id: product.category_id ?? "",
    brand: product.brand,
    price: String(product.price),
    compare_at_price: product.compare_at_price === null ? "" : String(product.compare_at_price),
    image: product.image,
    stock: String(product.stock),
    rating: String(product.rating),
    rating_count: String(product.rating_count),
    variants: JSON.stringify(product.variants, null, 2),
    is_featured: product.is_featured,
    is_trending: product.is_trending,
    is_best_seller: product.is_best_seller,
  };
}

function AdminProducts() {
  const { session, ready } = useAuth();
  const { data: isAdmin, isLoading: checkingAdmin, error: adminError } = useIsAdmin();
  const { data: categories } = useCategories();
  const { data: storefrontProducts } = useProducts();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const {
    data: products = [],
    isLoading: loadingProducts,
    error: productsError,
    refetch: reloadProducts,
  } = useQuery({
    queryKey: ["admin", "products"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!ready || (session && checkingAdmin)) {
    return (
      <p className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        Checking admin access…
      </p>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Sign in to continue</h1>
        <p className="mt-3 text-muted-foreground">
          Product management is available to authorized administrators only.
        </p>
        <Button className="mt-6" variant="hero" asChild>
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (adminError) {
    return (
      <p role="alert" className="mx-auto max-w-7xl px-4 py-20 text-center text-destructive">
        Unable to verify admin access: {adminError.message}
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Admin access required</h1>
        <p className="mt-3 text-muted-foreground">
          Your account is not authorized to manage products.
        </p>
      </div>
    );
  }

  const resetEditor = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = productSchema.safeParse({
      ...draft,
      price: Number(draft.price),
      compare_at_price: draft.compare_at_price.trim() ? Number(draft.compare_at_price) : null,
      stock: Number(draft.stock),
      rating: Number(draft.rating),
      rating_count: Number(draft.rating_count),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the product details");
      return;
    }

    let variants: Json;
    try {
      variants = JSON.parse(draft.variants) as Json;
      if (variants === null || typeof variants !== "object")
        throw new Error("Variants must be a JSON object or array");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Variants must be valid JSON");
      return;
    }

    const value = {
      ...parsed.data,
      variants,
      is_featured: draft.is_featured,
      is_trending: draft.is_trending,
      is_best_seller: draft.is_best_seller,
    };

    setBusy(true);
    const result = editingId
      ? await supabase.from("products").update(value).eq("id", editingId)
      : await supabase.from("products").insert(value);
    setBusy(false);
    if (result.error) {
      toast.error(`Couldn't save product: ${result.error.message}`);
      return;
    }
    toast.success(editingId ? "Product updated" : "Product added");
    resetEditor();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
    ]);
  };

  const archiveProduct = async (product: Product) => {
    const nextActive = !product.is_active;
    const action = nextActive ? "restore" : "archive";
    if (
      !window.confirm(
        `${nextActive ? "Restore" : "Archive"} ${product.name}? ${nextActive ? "" : "It will no longer appear in the storefront, while order and cart history stays intact."}`,
      )
    )
      return;
    const { error } = await supabase
      .from("products")
      .update({ is_active: nextActive })
      .eq("id", product.id);
    if (error) {
      toast.error(`Couldn't ${action} product: ${error.message}`);
      return;
    }
    toast.success(nextActive ? "Product restored" : "Product archived");
    if (editingId === product.id) resetEditor();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
    ]);
  };

  const updateDraft = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
      <header>
        <p className="text-sm text-muted-foreground">
          Catalog · {storefrontProducts?.length ?? 0} active storefront products
        </p>
        <h1 className="mt-1 text-3xl font-bold">Product management</h1>
        <p className="mt-2 text-muted-foreground">
          Changes are saved directly to the product database and refresh the storefront catalog.
        </p>
      </header>

      <form
        onSubmit={saveProduct}
        className="glass grid gap-4 rounded-2xl p-5 md:grid-cols-2 lg:grid-cols-3"
      >
        <div className="md:col-span-2 lg:col-span-3">
          <h2 className="text-xl font-semibold">{editingId ? "Edit product" : "Add a product"}</h2>
        </div>
        <Field label="Product name">
          <Input
            required
            value={draft.name}
            onChange={(e) => updateDraft("name", e.target.value)}
          />
        </Field>
        <Field label="Product slug">
          <Input
            required
            value={draft.slug}
            onChange={(e) => updateDraft("slug", e.target.value)}
          />
        </Field>
        <Field label="SKU">
          <Input required value={draft.sku} onChange={(e) => updateDraft("sku", e.target.value)} />
        </Field>
        <Field label="Brand">
          <Input
            required
            value={draft.brand}
            onChange={(e) => updateDraft("brand", e.target.value)}
          />
        </Field>
        <Field label="Category">
          <select
            required
            value={draft.category_id}
            onChange={(e) => updateDraft("category_id", e.target.value)}
            className="h-10 rounded-md border bg-background px-3"
          >
            <option value="">Choose a category</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Image URL or local path">
          <Input
            required
            value={draft.image}
            onChange={(e) => updateDraft("image", e.target.value)}
          />
        </Field>
        <Field label="Selling price">
          <Input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={draft.price}
            onChange={(e) => updateDraft("price", e.target.value)}
          />
        </Field>
        <Field label="Original price (optional)">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={draft.compare_at_price}
            onChange={(e) => updateDraft("compare_at_price", e.target.value)}
          />
        </Field>
        <Field label="Stock quantity">
          <Input
            required
            type="number"
            min="0"
            step="1"
            value={draft.stock}
            onChange={(e) => updateDraft("stock", e.target.value)}
          />
        </Field>
        <Field label="Rating (0–5)">
          <Input
            required
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={draft.rating}
            onChange={(e) => updateDraft("rating", e.target.value)}
          />
        </Field>
        <Field label="Review count">
          <Input
            required
            type="number"
            min="0"
            step="1"
            value={draft.rating_count}
            onChange={(e) => updateDraft("rating_count", e.target.value)}
          />
        </Field>
        <Field label="Variants (JSON)">
          <Textarea
            rows={4}
            value={draft.variants}
            onChange={(e) => updateDraft("variants", e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:col-span-2 lg:col-span-3">
          {(
            [
              ["is_featured", "Featured"],
              ["is_trending", "Trending"],
              ["is_best_seller", "Best seller"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft[key]}
                onChange={(e) => updateDraft(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
        <Field label="Description" className="md:col-span-2 lg:col-span-3">
          <Textarea
            required
            rows={4}
            value={draft.description}
            onChange={(e) => updateDraft("description", e.target.value)}
          />
        </Field>
        <div className="flex gap-2 md:col-span-2 lg:col-span-3">
          <Button variant="hero" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Save changes" : "Add product"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetEditor}>
              Cancel edit
            </Button>
          )}
        </div>
      </form>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Catalog</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length} products, including archived listings
            </p>
          </div>
          <Button variant="outline" onClick={() => void reloadProducts()}>
            Refresh
          </Button>
        </div>
        {productsError ? (
          <p role="alert" className="py-8 text-destructive">
            Couldn't load products: {productsError.message}
          </p>
        ) : loadingProducts ? (
          <p className="py-8 text-center text-muted-foreground">Loading products…</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="glass flex flex-wrap items-center gap-4 rounded-xl p-3"
              >
                <img
                  src={product.image}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="min-w-48 flex-1">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sku} · {product.brand} · {money(product.price)}
                    {discountPct(product) > 0 ? ` · ${discountPct(product)}% off` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.stock} in stock · {product.availability_status.replace("_", " ")}
                    {!product.is_active ? " · archived" : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDraft(draftFromProduct(product));
                    setEditingId(product.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void archiveProduct(product)}>
                  {product.is_active ? "Archive" : "Restore"}
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
