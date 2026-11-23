"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lead, Lembrete, STATUS, brl } from "@/lib/types";

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS.map((s) => {
          const col = leads.filter((l) => l.status === s.id);
          return (
            <Link key={s.id} href="/funil" className={`rounded-lg p-3 ${s.cor}`}>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold">{col.length}</p>
              <p className="text-xs text-slate-500">{brl(col.reduce((t, l) => t + Number(l.valor_estimado ?? 0), 0))}</p>
            </Link>
          );
        })}
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">Retornos para hoje e atrasados</h2>
        <ul className="space-y-2">
          {lembretes.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" onChange={() => concluir(r.id)} />
              <span className={r.data < hoje() ? "text-red-600" : ""}>{new Date(r.data + "T12:00").toLocaleDateString("pt-BR")}</span>
              <Link href={`/leads/${r.lead_id}`} className="font-medium text-indigo-700 hover:underline">{r.leads?.nome}</Link>
              <span>{r.descricao}</span>
            </li>
          ))}
          {!lembretes.length && <li className="text-sm text-slate-400">Nada pendente. Bom momento para buscar novos leads.</li>}
        </ul>
      </div>
    </div>
  );
}
