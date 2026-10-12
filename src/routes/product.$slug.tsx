import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import { discountPct, money, pushRecentlyViewed, useAuth, useCartActions, useProducts, useToggleWishlist } from "@/lib/shop";

export const Route = createFileRoute("/product/$slug")({
  head: () => ({
    meta: [
      { title: "Product details — ShopSphere Pro" },
      { name: "description", content: "Product details, reviews and pricing at ShopSphere Pro." },
      { property: "og:title", content: "Product details — ShopSphere Pro" },
      { property: "og:description", content: "Product details, reviews and pricing at ShopSphere Pro." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products, isLoading } = useProducts();
  const product = products?.find((p) => p.slug === slug);
  const [qty, setQty] = useState(1);
  const { add } = useCartActions();
  const { has, toggle } = useToggleWishlist();

  useEffect(() => {
    if (product) pushRecentlyViewed(product.id);
  }, [product]);

  if (isLoading) return <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2"><Skeleton className="aspect-square rounded-3xl" /><Skeleton className="h-80" /></div>;
  if (!product) return <div className="py-32 text-center"><p>Product not found.</p><Link to="/shop" className="text-primary underline">Back to shop</Link></div>;

  const off = discountPct(product);
  const related = products!.filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="group overflow-hidden rounded-3xl">
          <img src={product.image} alt={product.name} width={1024} height={1024} className="w-full transition-transform duration-500 group-hover:scale-125" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-wider text-muted-foreground">{product.brand}</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-warning text-warning" /> {product.rating} · {product.rating_count} ratings
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{money(product.price)}</span>
            {off > 0 && <><span className="text-lg text-muted-foreground line-through">{money(product.compare_at_price!)}</span><span className="bg-gradient-brand rounded-full px-2 py-0.5 text-xs font-bold text-primary-foreground">Save {off}%</span></>}
          </div>
          <p className="mt-6 text-muted-foreground">{product.description}</p>
          <p className={cn("mt-4 text-sm font-medium", product.stock > 0 ? "text-success" : "text-destructive")}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="glass flex items-center rounded-full">
              <Button variant="ghost" size="icon" aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))}><Minus /></Button>
              <span className="w-8 text-center">{qty}</span>
              <Button variant="ghost" size="icon" aria-label="Increase" onClick={() => setQty(Math.min(product.stock || 1, qty + 1))}><Plus /></Button>
            </div>
            <Button variant="hero" size="lg" disabled={product.stock === 0 || add.isPending} onClick={() => add.mutate({ product, qty })}>Add to cart</Button>
            <Button variant="glass" size="lg" onClick={() => toggle.mutate(product)}>
              <Heart className={cn(has(product.id) && "fill-brand-purple text-brand-purple")} /> {has(product.id) ? "Saved" : "Wishlist"}
            </Button>
          </div>
        </div>
      </div>
      <Reviews productId={product.id} />
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

function Reviews({ productId }: { productId: string }) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { data: reviews } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (comment.trim().length < 5) return toast.error("Please write at least a few words");
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: session.user.id,
      author_name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0] ?? "Customer",
      rating,
      comment: comment.trim().slice(0, 1000),
    });
    if (error) return toast.error(error.message);
    toast.success("Thanks for your review!");
    setComment("");
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
  };
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold">Reviews</h2>
      {session ? (
        <form onSubmit={submit} className="glass mt-4 space-y-3 rounded-2xl p-5">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
                <Star className={cn("h-5 w-5", n <= rating ? "fill-warning text-warning" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts" maxLength={1000} />
          <Button variant="hero">Post review</Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground"><Link to="/auth" className="text-primary underline">Sign in</Link> to write a review.</p>
      )}
      <div className="mt-6 space-y-4">
        {reviews?.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>}
        {reviews?.map((r) => (
          <div key={r.id} className="border-b pb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{r.author_name}</span>
              <span className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
