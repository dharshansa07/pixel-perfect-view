import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money, useAuth, useCart, useCartActions } from "@/lib/shop";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — ShopSphere Pro" },
      { name: "description", content: "Review the items in your ShopSphere Pro cart." },
      { property: "og:title", content: "Your cart — ShopSphere Pro" },
      { property: "og:description", content: "Review the items in your ShopSphere Pro cart." },
    ],
  }),
  component: CartPage,
});

export function SignInPrompt({ what }: { what: string }) {
  return (
    <div className="py-32 text-center">
      <p className="text-lg">Sign in to see your {what}.</p>
      <Button variant="hero" className="mt-4" asChild><Link to="/auth">Sign in</Link></Button>
    </div>
  );
}

function CartPage() {
  const { session, ready } = useAuth();
  const { data: cart, isLoading } = useCart();
  const { setQty } = useCartActions();
  if (!ready) return null;
  if (!session) return <SignInPrompt what="cart" />;
  if (isLoading) return <p className="py-32 text-center text-muted-foreground">Loading…</p>;
  if (!cart?.length)
    return (
      <div className="py-32 text-center">
        <p className="text-lg">Your cart is empty.</p>
        <Button variant="hero" className="mt-4" asChild><Link to="/shop">Start shopping</Link></Button>
      </div>
    );
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal >= 100 ? 0 : 9.99;
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="mb-6 text-3xl font-bold">Cart</h1>
        <div className="space-y-3">
          {cart.map(({ product: p, quantity }) => (
            <div key={p.id} className="glass flex items-center gap-4 rounded-2xl p-3">
              <img src={p.image} alt={p.name} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1">
                <Link to="/product/$slug" params={{ slug: p.slug }} className="font-semibold hover:underline">{p.name}</Link>
                <p className="text-sm text-muted-foreground">{money(p.price)}</p>
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" aria-label="Decrease" onClick={() => setQty.mutate({ productId: p.id, quantity: quantity - 1 })}><Minus /></Button>
                <span className="w-6 text-center">{quantity}</span>
                <Button variant="ghost" size="icon" aria-label="Increase" disabled={quantity >= p.stock} onClick={() => setQty.mutate({ productId: p.id, quantity: quantity + 1 })}><Plus /></Button>
              </div>
              <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => setQty.mutate({ productId: p.id, quantity: 0 })}><Trash2 /></Button>
            </div>
          ))}
        </div>
      </div>
      <aside className="glass h-fit space-y-3 rounded-2xl p-6">
        <h2 className="text-lg font-bold">Summary</h2>
        <Row label="Subtotal" value={money(subtotal)} />
        <Row label="Shipping" value={shipping ? money(shipping) : "Free"} />
        <div className="border-t pt-3"><Row label="Total" value={money(subtotal + shipping)} bold /></div>
        <Button variant="hero" size="lg" className="w-full" asChild><Link to="/checkout">Checkout</Link></Button>
      </aside>
    </div>
  );
}

export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={`flex justify-between text-sm ${bold ? "text-base font-bold" : ""}`}><span>{label}</span><span>{value}</span></div>;
}
