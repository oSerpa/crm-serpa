"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Nav from "./Nav";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null && path !== "/login") router.replace("/login");
    if (session && path === "/login") router.replace("/");
  }, [session, path, router]);

  if (path === "/login") return <>{children}</>;
  if (!session) return <p className="p-8 text-sm text-slate-500">Carregando...</p>;

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
