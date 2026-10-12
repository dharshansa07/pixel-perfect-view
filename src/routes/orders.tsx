import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { money, useAuth } from "@/lib/shop";
import { SignInPrompt } from "./cart";

export const Route = createFileRoute("/orders")({
  validateSearch: z.object({ placed: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "My orders — ShopSphere Pro" },
      { name: "description", content: "Track your ShopSphere Pro orders." },
      { property: "og:title", content: "My orders — ShopSphere Pro" },
      { property: "og:description", content: "Track your ShopSphere Pro orders." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { placed } = Route.useSearch();
  const { session, ready } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["user", "orders", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (!ready) return null;
  if (!session) return <SignInPrompt what="orders" />;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {placed && (
        <div className="glass mb-8 flex items-center gap-3 rounded-2xl p-5">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <div>
            <p className="font-semibold">Thank you! Your order is confirmed.</p>
            <p className="text-xs text-muted-foreground">Order #{placed.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      )}
      <h1 className="mb-6 text-3xl font-bold">My orders</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {data?.length === 0 && <p className="text-muted-foreground">You haven't placed any orders yet.</p>}
      <div className="space-y-4">
        {data?.map((o) => (
          <div key={o.id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold">#{o.id.slice(0, 8).toUpperCase()}</span>
              <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
              <span className="bg-gradient-brand rounded-full px-3 py-0.5 text-xs font-bold capitalize text-primary-foreground">{o.status}</span>
              <span className="font-bold">{money(o.total)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {o.order_items.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-sm">
                  <img src={i.image} alt={i.name} className="h-12 w-12 rounded-lg object-cover" />
                  <span>{i.name} × {i.quantity}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Ship to {o.full_name}, {o.address}, {o.city} {o.postal_code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
