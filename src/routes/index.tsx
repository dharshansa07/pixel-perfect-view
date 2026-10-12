import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductGrid } from "@/components/ProductCard";
import { useCategories, useProducts, useRecentlyViewed } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopSphere Pro — Premium Tech & Lifestyle" },
      { name: "description", content: "Shop headphones, wearables, home and fashion picks with free shipping over $100." },
      { property: "og:title", content: "ShopSphere Pro — Premium Tech & Lifestyle" },
      { property: "og:description", content: "Shop headphones, wearables, home and fashion picks with free shipping over $100." },
    ],
  }),
  component: Home,
});

const testimonials = [
  { name: "Priya S.", text: "Fast delivery and the headphones sound incredible. My new favourite store." },
  { name: "Marcus L.", text: "Checkout took under a minute. Great prices on the smartwatch." },
  { name: "Aiko T.", text: "Beautiful products and really helpful order tracking." },
];

function Section({ title, children, link }: { title: string; children: React.ReactNode; link?: boolean }) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        {link && (
          <Link to="/shop" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Home() {
  const { data: products, isLoading } = useProducts();
  const { data: cats } = useCategories();
  const recentIds = useRecentlyViewed();
  const featured = products?.find((p) => p.is_featured);
  const featuredProducts = products?.filter((p) => p.is_featured).slice(0, 4);
  const trending = products?.filter((p) => p.is_trending).slice(0, 4);
  const designatedBestSellers = products?.filter((p) => p.is_best_seller) ?? [];
  const best = (designatedBestSellers.length ? designatedBestSellers : [...(products ?? [])].sort((a, b) => b.rating_count - a.rating_count)).slice(0, 4);
  const arrivals = [...(products ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);
  const recent = recentIds.map((id) => products?.find((p) => p.id === id)).filter(Boolean).slice(0, 4) as NonNullable<typeof products>;

  return (
    <>
      <section className="bg-gradient-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="glass inline-block rounded-full px-3 py-1 text-xs font-semibold">Autumn Sale · up to 25% off</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
              Gear that feels <span className="text-gradient-brand">a level above.</span>
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Hand-picked audio, wearables and everyday essentials — designed well and delivered fast.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild><Link to="/shop">Shop now</Link></Button>
              {featured && (
                <Button variant="glass" size="lg" asChild>
                  <Link to="/product/$slug" params={{ slug: featured.slug }}>See featured</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="bg-gradient-brand absolute inset-6 rounded-full opacity-40 blur-3xl" />
            <img src="/images/headphones.jpg" alt="Aurora Wireless Headphones" width={1024} height={1024} className="relative rounded-3xl shadow-glow" />
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-4 sm:grid-cols-3">
        {[
          [Truck, "Free shipping over $100"],
          [RotateCcw, "30-day easy returns"],
          [ShieldCheck, "Secure checkout"],
        ].map(([Icon, t]) => {
          const I = Icon as typeof Truck;
          return (
            <div key={t as string} className="glass flex items-center gap-3 rounded-2xl p-4 text-sm">
              <I className="h-5 w-5 text-brand-blue" /> {t as string}
            </div>
          );
        })}
      </div>

      <Section title="Shop by category">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cats?.map((c) => (
            <Link key={c.id} to="/shop" search={{ category: c.slug }} className="group relative aspect-[4/5] overflow-hidden rounded-2xl">
              <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-x-3 bottom-3 glass rounded-xl px-4 py-3 font-display font-semibold">{c.name}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Featured picks" link><ProductGrid products={featuredProducts} loading={isLoading} /></Section>
      <Section title="Trending now" link><ProductGrid products={trending} loading={isLoading} /></Section>

      <section className="mx-auto mt-20 max-w-7xl px-4">
        <div className="bg-gradient-brand flex flex-col items-start justify-between gap-6 rounded-3xl p-8 text-primary-foreground md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-3xl font-bold">Save 10% on your first order</h2>
            <p className="mt-2 opacity-90">Use code SPHERE10 at checkout. Limited time.</p>
          </div>
          <Button size="lg" variant="secondary" className="rounded-full" asChild><Link to="/shop">Browse deals</Link></Button>
        </div>
      </section>

      <Section title="Best sellers" link><ProductGrid products={best} loading={isLoading} /></Section>
      <Section title="New arrivals" link><ProductGrid products={arrivals} loading={isLoading} /></Section>
      {recent.length > 0 && <Section title="Recently viewed"><ProductGrid products={recent} /></Section>}

      <Section title="What customers say">
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="glass rounded-2xl p-6">
              <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
              <blockquote className="mt-3 text-sm">“{t.text}”</blockquote>
              <figcaption className="mt-3 text-xs text-muted-foreground">— {t.name}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Newsletter />
    </>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error("Please enter a valid email"); return; }
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.toLowerCase() });
    setBusy(false);
    if (error && error.code !== "23505") { toast.error("Couldn't subscribe, please try again"); return; }
    toast.success("You're subscribed!");
    setEmail("");
  };
  return (
    <section className="mx-auto mt-20 max-w-3xl px-4 text-center">
      <h2 className="text-3xl font-bold">Get early access to drops</h2>
      <p className="mt-2 text-muted-foreground">One email a week. No spam.</p>
      <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md gap-2">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email" className="rounded-full" />
        <Button variant="hero" disabled={busy}>Subscribe</Button>
      </form>
    </section>
  );
}
