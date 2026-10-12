import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, useCart, useCategories, useIsAdmin, useWishlist } from "@/lib/shop";

export function SiteHeader() {
  const { session } = useAuth();
  const { data: cart } = useCart();
  const { data: wish } = useWishlist();
  const { data: cats } = useCategories();
  const { data: isAdmin } = useIsAdmin();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const count = cart?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/shop", search: { q: q.trim() || undefined } });
    setOpen(false);
  };
  const signOut = async () => {
    await qc.cancelQueries();
    qc.removeQueries({ queryKey: ["user"] });
    await supabase.auth.signOut();
    toast("Signed out");
    navigate({ to: "/", replace: true });
  };

  return (
    <>
      <div className="bg-gradient-brand py-2 text-center text-xs font-semibold text-primary-foreground">
        Free shipping on orders over $100 · Use code SPHERE10 for 10% off
      </div>
      <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
          <Link to="/" className="font-display text-xl font-bold">
            Shop<span className="text-gradient-brand">Sphere</span>
          </Link>
          <nav className="hidden gap-5 text-sm text-muted-foreground md:flex">
            <Link to="/shop" className="hover:text-foreground">
              All
            </Link>
            {cats?.map((c) => (
              <Link
                key={c.id}
                to="/shop"
                search={{ category: c.slug }}
                className="hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <form onSubmit={onSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products"
                className="rounded-full pl-9"
                aria-label="Search products"
              />
            </div>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <IconLink to="/wishlist" label="Wishlist" badge={wish?.length}>
              <Heart className="h-5 w-5" />
            </IconLink>
            <IconLink to="/cart" label="Cart" badge={count}>
              <ShoppingBag className="h-5 w-5" />
            </IconLink>
            {isAdmin && (
              <IconLink to="/admin" label="Product management">
                <ShieldCheck className="h-5 w-5" />
              </IconLink>
            )}
            {session ? (
              <>
                <IconLink to="/orders" label="My orders">
                  <Package className="h-5 w-5" />
                </IconLink>
                <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
                  <LogOut />
                </Button>
              </>
            ) : (
              <IconLink to="/auth" label="Sign in">
                <User className="h-5 w-5" />
              </IconLink>
            )}
          </div>
        </div>
        {open && (
          <div className="space-y-3 border-t px-4 py-4 md:hidden">
            <form onSubmit={onSearch}>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
              />
            </form>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/shop" onClick={() => setOpen(false)}>
                All
              </Link>
              {cats?.map((c) => (
                <Link
                  key={c.id}
                  to="/shop"
                  search={{ category: c.slug }}
                  onClick={() => setOpen(false)}
                >
                  {c.name}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)}>
                  Product management
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function IconLink({
  to,
  label,
  badge,
  children,
}: {
  to: "/admin" | "/cart" | "/wishlist" | "/orders" | "/auth";
  label: string;
  badge?: number | undefined;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
    >
      {children}
      {!!badge && (
        <span className="bg-gradient-brand absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-primary-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm text-muted-foreground md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold text-foreground">ShopSphere Pro</p>
          <p className="mt-2">Premium tech and lifestyle, delivered.</p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-foreground">Contact</p>
          <a href="mailto:dharshansa21@gmail.com" className="block hover:text-foreground">
            dharshansa21@gmail.com
          </a>
          <a href="tel:9345124079" className="block hover:text-foreground">
            9345124079
          </a>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-foreground">Help</p>
          <p>Shipping: free over $100, else $9.99</p>
          <p>Returns within 30 days</p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-foreground">Follow</p>
          <p>Instagram · X · YouTube</p>
          <p>_dharshan__07</p>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">© 2026 ShopSphere Pro</p>
    </footer>
  );
}
