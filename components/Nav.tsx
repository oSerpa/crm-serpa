"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/", label: "Hoje" },
  { href: "/funil", label: "Funil" },
  { href: "/leads", label: "Leads" },
  { href: "/buscar", label: "Buscar" },
  { href: "/propostas", label: "Propostas" },
  { href: "/painel", label: "Painel" },
  { href: "/servicos", label: "Serviços" },
  { href: "/perfil", label: "Meus dados" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
        <span className="mr-4 font-bold text-indigo-600">CRM Serpa</span>
        {links.map((l) => {
          const ativo = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href}
              className={`rounded-md px-3 py-1.5 text-sm ${ativo ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>
              {l.label}
            </Link>
          );
        })}
        <button onClick={() => supabase.auth.signOut()} className="ml-auto text-sm text-slate-500 hover:text-slate-800">Sair</button>
      </div>
    </header>
  );
}
