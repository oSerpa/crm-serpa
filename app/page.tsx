"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lead, Lembrete, STATUS, brl } from "@/lib/types";
import CapturaRapida from "@/components/CapturaRapida";
import PageHeader from "@/components/PageHeader";

const hoje = () => new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD no fuso local

export default function Hoje() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [leads, setLeads] = useState<Pick<Lead, "status" | "valor_estimado">[]>([]);

  const carregar = () => {
    supabase.from("lembretes").select("*, leads(nome)").eq("feito", false).lte("data", hoje()).order("data")
      .then(({ data }) => setLembretes((data as Lembrete[]) ?? []));
    supabase.from("leads").select("status, valor_estimado").then(({ data }) => setLeads(data ?? []));
  };
  useEffect(() => { carregar(); }, []);

  async function concluir(id: string) {
    await supabase.from("lembretes").update({ feito: true }).eq("id", id);
    carregar();
  }

  const saudacao = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  })();
  const dataHoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <PageHeader titulo={saudacao} sub={dataHoje.charAt(0).toUpperCase() + dataHoje.slice(1)}>
        <Link href="/buscar" className="btn-sec">Buscar no mapa</Link>
        <Link href="/leads" className="btn">+ Novo lead</Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATUS.map((s) => {
          const col = leads.filter((l) => l.status === s.id);
          return (
            <Link key={s.id} href="/funil" className="card group !p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.ponto}`} />
                <p className="text-xs font-medium text-zinc-500">{s.label}</p>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{col.length}</p>
              <p className="text-xs text-zinc-500">{brl(col.reduce((t, l) => t + Number(l.valor_estimado ?? 0), 0)) || "R$ 0,00"}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><CapturaRapida onSalvo={carregar} /></div>
        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Retornos de hoje</h2>
            {lembretes.length > 0 && <span className="badge bg-indigo-50 text-indigo-700">{lembretes.length}</span>}
          </div>
          <ul className="divide-y divide-zinc-100">
            {lembretes.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-2.5 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded accent-indigo-600" onChange={() => concluir(r.id)} />
                <div className="min-w-0 flex-1">
                  <Link href={`/leads/${r.lead_id}`} className="font-medium text-zinc-900 hover:text-indigo-600">{r.leads?.nome}</Link>
                  <p className="text-zinc-600">{r.descricao}</p>
                </div>
                <span className={`shrink-0 text-xs ${r.data < hoje() ? "font-medium text-rose-600" : "text-zinc-400"}`}>
                  {new Date(r.data + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              </li>
            ))}
            {!lembretes.length && <li className="py-6 text-center text-sm text-zinc-400">Nada pendente. Bom momento para buscar novos leads.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
