import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money, useAuth, useCart } from "@/lib/shop";
import { Row, SignInPrompt } from "./cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — ShopSphere Pro" },
      { name: "description", content: "Enter shipping details and place your order." },
      { property: "og:title", content: "Checkout — ShopSphere Pro" },
      { property: "og:description", content: "Enter shipping details and place your order." },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  address: z.string().trim().min(5, "Enter your street address").max(200),
  city: z.string().trim().min(2, "Enter your city").max(80),
  postal_code: z.string().trim().min(3, "Enter a postal code").max(12),
  phone: z.string().trim().regex(/^[+\d\s()-]{7,20}$/, "Enter a valid phone number"),
  card: z.string().transform((s) => s.replace(/\s/g, "")).pipe(z.string().regex(/^\d{16}$/, "Card number must be 16 digits")),
});
const fields: [keyof z.infer<typeof schema>, string][] = [
  ["full_name", "Full name"], ["address", "Address"], ["city", "City"], ["postal_code", "Postal code"], ["phone", "Phone"],
];

function Checkout() {
  const { session, ready } = useAuth();
  const { data: cart } = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  if (!ready) return null;
  if (!session) return <SignInPrompt what="checkout" />;
  const subtotal = cart?.reduce((s, i) => s + i.product.price * i.quantity, 0) ?? 0;
  const shipping = subtotal >= 100 ? 0 : 9.99;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    const d = parsed.data;
    const { data: orderId, error } = await supabase.rpc("place_order", {
      _full_name: d.full_name, _address: d.address, _city: d.city, _postal_code: d.postal_code, _phone: d.phone,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Order placed!");
    qc.invalidateQueries({ queryKey: ["user"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    navigate({ to: "/orders", search: { placed: orderId as string } });
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
      <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-6" noValidate>
        <h1 className="text-2xl font-bold">Shipping details</h1>
        {fields.map(([name, label]) => (
          <div key={name} className="space-y-1">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} aria-invalid={!!errors[name]} />
            {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
          </div>
        ))}
        <h2 className="flex items-center gap-2 pt-4 text-lg font-bold"><CreditCard className="h-5 w-5" /> Payment (test mode)</h2>
        <p className="text-xs text-muted-foreground">No real charge is made. Use any 16 digits, e.g. 4242 4242 4242 4242.</p>
        <div className="space-y-1">
          <Label htmlFor="card">Card number</Label>
          <Input id="card" name="card" inputMode="numeric" placeholder="4242 4242 4242 4242" aria-invalid={!!errors["card"]} />
          {errors["card"] && <p className="text-xs text-destructive">{errors["card"]}</p>}
        </div>
        <Button variant="hero" size="lg" className="w-full" disabled={busy || !cart?.length}>
          {busy ? "Placing order…" : `Pay ${money(subtotal + shipping)}`}
        </Button>
      </form>
      <aside className="glass h-fit space-y-3 rounded-2xl p-6">
        <h2 className="text-lg font-bold">Order summary</h2>
        {cart?.map((i) => <Row key={i.product.id} label={`${i.product.name} × ${i.quantity}`} value={money(i.product.price * i.quantity)} />)}
        <div className="space-y-2 border-t pt-3">
          <Row label="Subtotal" value={money(subtotal)} />
          <Row label="Shipping" value={shipping ? money(shipping) : "Free"} />
          <Row label="Total" value={money(subtotal + shipping)} bold />
        </div>
      </aside>
    </div>
  );
}
