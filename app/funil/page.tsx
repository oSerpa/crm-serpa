"use client";
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
      <h1 className="text-lg font-bold">Funil de vendas</h1>
      <p className="text-xs text-slate-500">Arraste os cards entre as colunas, ou use o seletor no card (celular).</p>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUS.map((s) => {
          const col = leads.filter((l) => l.status === s.id);
          const total = col.reduce((t, l) => t + Number(l.valor_estimado ?? 0), 0);
          return (
            <div key={s.id}
              className={`w-64 shrink-0 rounded-lg p-2 ${s.cor}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (arrastando) mover(arrastando, s.id); setArrastando(null); }}>
              <div className="mb-2 flex justify-between px-1 text-sm font-semibold">
                <span>{s.label} ({col.length})</span>
                <span className="text-xs font-normal text-slate-500">{brl(total)}</span>
              </div>
              <div className="min-h-24 space-y-2">
                {col.map((l) => (
                  <div key={l.id} draggable onDragStart={() => setArrastando(l.id)}
                    className="cursor-grab rounded-md border border-slate-200 bg-white p-2 text-sm shadow-sm">
                    <Link href={`/leads/${l.id}`} className="font-medium hover:underline">{l.nome}</Link>
                    <p className="text-xs text-slate-500">{[l.categoria, l.cidade].filter(Boolean).join(" · ")}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs">{brl(l.valor_estimado)}</span>
                      <select className="rounded border border-slate-200 text-xs" value={l.status}
                        onChange={(e) => mover(l.id, e.target.value as Status)}>
                        {STATUS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
