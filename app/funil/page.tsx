"use client";
import PageHeader from "@/components/PageHeader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lead, STATUS, Status, brl } from "@/lib/types";

export default function Funil() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [arrastando, setArrastando] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("leads").select("*").order("atualizado_em", { ascending: false }).then(({ data }) => setLeads(data ?? []));
  }, []);

  async function mover(id: string, status: Status) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    await supabase.from("leads").update({ status }).eq("id", id);
  }

  return (
    <div className="space-y-3">
      <PageHeader titulo="Funil de vendas" sub="Arraste os cards entre as colunas. No celular, use o seletor do card." />
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {STATUS.map((s) => {
          const col = leads.filter((l) => l.status === s.id);
          const total = col.reduce((t, l) => t + Number(l.valor_estimado ?? 0), 0);
          return (
            <div key={s.id}
              className={`flex min-w-64 flex-1 shrink-0 flex-col rounded-xl p-2.5 ${s.cor} ${arrastando ? "ring-1 ring-dashed ring-zinc-300" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (arrastando) mover(arrastando, s.id); setArrastando(null); }}>
              <div className="mb-3 flex items-center gap-2 px-1.5 pt-1">
                <span className={`h-2 w-2 rounded-full ${s.ponto}`} />
                <span className="text-sm font-semibold text-zinc-800">{s.label}</span>
                <span className="rounded-full bg-white/80 px-1.5 text-xs font-medium text-zinc-500">{col.length}</span>
                <span className="ml-auto text-xs text-zinc-500">{brl(total)}</span>
              </div>
              <div className="min-h-32 flex-1 space-y-2">
                {col.map((l) => (
                  <div key={l.id} draggable onDragStart={() => setArrastando(l.id)} onDragEnd={() => setArrastando(null)}
                    className="group cursor-grab rounded-lg border border-zinc-200/80 bg-white p-3 text-sm shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing">
                    <Link href={`/leads/${l.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">{l.nome}</Link>
                    {(l.categoria || l.cidade) && <p className="mt-0.5 text-xs text-zinc-500">{[l.categoria, l.cidade].filter(Boolean).join(" · ")}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-700">{brl(l.valor_estimado) || <span className="text-zinc-300">sem valor</span>}</span>
                      <select className="rounded-md border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-xs text-zinc-600 lg:opacity-0 lg:group-hover:opacity-100" value={l.status}
                        onChange={(e) => mover(l.id, e.target.value as Status)}>
                        {STATUS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {!col.length && <p className="py-6 text-center text-xs text-zinc-400">Vazio</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
