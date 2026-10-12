import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { discountPct, money, useCartActions, useToggleWishlist, type Product } from "@/lib/shop";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCartActions();
  const { has, toggle } = useToggleWishlist();
  const off = discountPct(product);
  const saved = has(product.id);
  return (
    <div className="group glass relative flex flex-col overflow-hidden rounded-2xl transition-transform hover:-translate-y-1">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {off > 0 && (
          <span className="bg-gradient-brand absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground">
            -{off}%
          </span>
        )}
      </Link>
      <button
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => toggle.mutate(product)}
        className="glass absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full"
      >
        <Heart className={cn("h-4 w-4", saved && "fill-brand-purple text-brand-purple")} />
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{product.brand}</p>
        <Link to="/product/$slug" params={{ slug: product.slug }} className="font-display font-semibold leading-tight hover:underline">
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          {product.rating} ({product.rating_count})
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <span className="text-lg font-bold">{money(product.price)}</span>
            {off > 0 && (
              <span className="ml-2 text-sm text-muted-foreground line-through">
                {money(product.compare_at_price!)}
              </span>
            )}
            <p className={cn("text-xs", product.stock > 0 ? "text-success" : "text-destructive")}>
              {product.stock === 0 ? "Out of stock" : product.stock < 10 ? `Only ${product.stock} left` : "In stock"}
            </p>
          </div>
          <Button
            size="icon"
            variant="hero"
            aria-label="Add to cart"
            disabled={product.stock === 0 || add.isPending}
            onClick={() => add.mutate({ product })}
          >
            <ShoppingBag />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading }: { products?: Product[] | undefined; loading?: boolean | undefined }) {
  if (loading)
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products?.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
