"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Proposta, STATUS_PROPOSTA, brl, dataBR } from "@/lib/types";

export default function Propostas() {
  const [lista, setLista] = useState<Proposta[]>([]);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase.from("propostas").select("*, leads(nome, cidade, whatsapp, telefone)").order("criado_em", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro("Rode o arquivo supabase/migrations/002_propostas.sql no SQL Editor do Supabase para ativar as propostas.");
        setLista((data as Proposta[]) ?? []);
      });
  }, []);

  const filtradas = lista.filter((p) => !status || p.status === status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-bold">Propostas ({filtradas.length})</h1>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todas</option>
          {STATUS_PROPOSTA.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <p className="text-xs text-slate-500">Para criar uma proposta, abra o lead e clique em &quot;Nova proposta&quot;.</p>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr><th className="p-2">#</th><th className="p-2">Título</th><th className="p-2">Cliente</th><th className="p-2">Total</th><th className="p-2">Status</th><th className="p-2">Criada</th></tr>
          </thead>
          <tbody>
            {filtradas.map((p) => {
              const st = STATUS_PROPOSTA.find((s) => s.id === p.status)!;
              return (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-2 text-slate-500">{p.numero}</td>
                  <td className="p-2"><Link className="font-medium text-indigo-700 hover:underline" href={`/propostas/${p.id}`}>{p.titulo}</Link></td>
                  <td className="p-2">{p.leads?.nome}</td>
                  <td className="p-2">{brl(p.total)}</td>
                  <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs ${st.cor}`}>{st.label}</span></td>
                  <td className="p-2 text-xs">{dataBR(p.criado_em)}</td>
                </tr>
              );
            })}
            {!filtradas.length && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Nenhuma proposta ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
