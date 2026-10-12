import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n));

export const discountPct = (p: Product) =>
  p.compare_at_price && p.compare_at_price > p.price
    ? Math.round((1 - p.price / p.compare_at_price) * 100)
    : 0;

const AuthCtx = createContext<{ session: Session | null; ready: boolean }>({ session: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        qc.invalidateQueries({ queryKey: ["user"] });
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  return <AuthCtx.Provider value={{ session, ready }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useCart() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ["user", "cart", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity, product:products(*)")
        .order("created_at");
      if (error) throw error;
      return data.filter((r) => r.product) as { quantity: number; product: Product }[];
    },
  });
}

export function useWishlist() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ["user", "wishlist", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("product:products(*)");
      if (error) throw error;
      return data.map((r) => r.product).filter(Boolean) as Product[];
    },
  });
}

function needLogin() {
  toast("Please sign in first", { description: "Create a free account to save items." });
}

export function useCartActions() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["user", "cart"] });
  const add = useMutation({
    mutationFn: async ({ product, qty = 1 }: { product: Product; qty?: number }) => {
      if (!session) return needLogin();
      if (product.stock < 1) throw new Error("This item is out of stock");
      const { data: existing } = await supabase
        .from("cart_items").select("quantity").eq("product_id", product.id).maybeSingle();
      const quantity = Math.min(product.stock, (existing?.quantity ?? 0) + qty);
      const { error } = await supabase
        .from("cart_items")
        .upsert({ user_id: session.user.id, product_id: product.id, quantity });
      if (error) throw error;
      toast.success(`${product.name} added to cart`);
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const setQty = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const q = quantity < 1
        ? supabase.from("cart_items").delete().eq("product_id", productId)
        : supabase.from("cart_items").update({ quantity }).eq("product_id", productId);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  return { add, setQty };
}

export function useToggleWishlist() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const { data: list } = useWishlist();
  const has = (id: string) => !!list?.some((p) => p.id === id);
  const toggle = useMutation({
    mutationFn: async (product: Product) => {
      if (!session) return needLogin();
      if (has(product.id)) {
        await supabase.from("wishlist_items").delete().eq("product_id", product.id);
        toast("Removed from wishlist");
      } else {
        const { error } = await supabase
          .from("wishlist_items").insert({ user_id: session.user.id, product_id: product.id });
        if (error) throw error;
        toast.success("Saved to wishlist");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user", "wishlist"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return { has, toggle };
}

const RV_KEY = "shopsphere-recent";
export function pushRecentlyViewed(id: string) {
  const list: string[] = JSON.parse(localStorage.getItem(RV_KEY) ?? "[]");
  localStorage.setItem(RV_KEY, JSON.stringify([id, ...list.filter((x) => x !== id)].slice(0, 8)));
}
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(JSON.parse(localStorage.getItem(RV_KEY) ?? "[]")), []);
  return ids;
}
