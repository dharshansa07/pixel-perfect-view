import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/shop";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ShopSphere Pro" },
      { name: "description", content: "Sign in or create your ShopSphere Pro account." },
      { property: "og:title", content: "Sign in — ShopSphere Pro" },
      { property: "og:description", content: "Sign in or create your ShopSphere Pro account." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (session) navigate({ to: "/" });
  }, [session, navigate]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { email, password } = parsed.data;
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up" && !data.session) toast.success("Check your email to confirm your account.");
    else toast.success("Welcome!");
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="bg-gradient-hero flex justify-center px-4 py-20">
      <div className="glass w-full max-w-sm rounded-3xl p-8">
        <h1 className="text-2xl font-bold">{mode === "in" ? "Welcome back" : "Create account"}</h1>
        <Button variant="glass" className="mt-6 w-full" onClick={google}>Continue with Google</Button>
        <div className="my-5 text-center text-xs text-muted-foreground">or</div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" /></div>
          <div className="space-y-1"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} /></div>
          <Button variant="hero" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
