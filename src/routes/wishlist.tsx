import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/ProductCard";
import { useAuth, useWishlist } from "@/lib/shop";
import { SignInPrompt } from "./cart";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — ShopSphere Pro" },
      { name: "description", content: "Products you've saved for later." },
      { property: "og:title", content: "Wishlist — ShopSphere Pro" },
      { property: "og:description", content: "Products you've saved for later." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { session, ready } = useAuth();
  const { data, isLoading } = useWishlist();
  if (!ready) return null;
  if (!session) return <SignInPrompt what="wishlist" />;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Wishlist</h1>
      {!isLoading && !data?.length ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Nothing saved yet.</p>
          <Button variant="hero" className="mt-4" asChild><Link to="/shop">Discover products</Link></Button>
        </div>
      ) : (
        <ProductGrid products={data} loading={isLoading} />
      )}
    </div>
  );
}
