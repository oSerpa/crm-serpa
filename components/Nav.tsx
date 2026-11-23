"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Icone from "./Icone";

const grupos = [
  {
    titulo: "Vendas",
    links: [
      { href: "/", label: "Hoje", icone: "hoje" },
      { href: "/funil", label: "Funil", icone: "funil" },
      { href: "/leads", label: "Leads", icone: "leads" },
      { href: "/buscar", label: "Buscar no mapa", icone: "buscar" },
      { href: "/propostas", label: "Propostas", icone: "propostas" },
    ],
  },
  {
    titulo: "Gestão",
    links: [
      { href: "/painel", label: "Painel", icone: "painel" },
      { href: "/servicos", label: "Serviços", icone: "servicos" },
      { href: "/perfil", label: "Meus dados", icone: "perfil" },
    ],
  },
];

function Marca() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">S</div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-zinc-900">Serpa</p>
        <p className="text-[11px] text-zinc-500">CRM de serviços</p>
      </div>
    </div>
  );
}

export default function Nav() {
  const path = usePathname();
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? ""));
  }, []);
  useEffect(() => setAberto(false), [path]);

  const conteudo = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Marca />
      <nav className="flex-1 space-y-6">
        {grupos.map((g) => (
          <div key={g.titulo}>
            <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">{g.titulo}</p>
            <div className="space-y-0.5">
              {g.links.map((l) => {
                const ativo = l.href === "/" ? path === "/" : path.startsWith(l.href);
                return (
                  <Link key={l.href} href={l.href}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      ativo ? "bg-white font-medium text-zinc-900 shadow-xs ring-1 ring-zinc-200" : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
                    }`}>
                    <Icone nome={l.icone} className={`h-4 w-4 ${ativo ? "text-indigo-600" : "text-zinc-400"}`} />
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-2 border-t border-zinc-200 px-2 pt-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
          {email.charAt(0).toUpperCase() || "?"}
        </div>
        <p className="min-w-0 flex-1 truncate text-xs text-zinc-500">{email}</p>
        <button onClick={() => supabase.auth.signOut()} title="Sair" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700">
          <Icone nome="sair" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-zinc-200 bg-zinc-100/60 lg:block">{conteudo}</aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
        <Marca />
        <button onClick={() => setAberto(true)} className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100" aria-label="Abrir menu">
          <Icone nome="menu" className="h-5 w-5" />
        </button>
      </header>

      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-zinc-50 shadow-xl">
            <button onClick={() => setAberto(false)} className="absolute right-3 top-4 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200" aria-label="Fechar menu">
              <Icone nome="fechar" />
            </button>
            {conteudo}
          </aside>
        </div>
      )}
    </>
  );
}
